import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getBlaaizGateway } from "@/domain";
import { mapBlaaizStatusToTransferStatus, STATUS_META, WayPayStatus } from "@/domain/status";
import { emitTransferEvent } from "@/lib/sse-bus";

export async function POST(req: NextRequest) {
  try {
    const signature = req.headers.get("x-blaaiz-signature");
    const timestamp = req.headers.get("x-blaaiz-timestamp");
    const rawBody = await req.text();

    if (!signature || !timestamp) {
      return NextResponse.json(
        { error: "Missing x-blaaiz-signature or x-blaaiz-timestamp headers" },
        { status: 400 }
      );
    }

    // 1. Verify Timestamp Freshness (Reject timestamps older than 5 minutes / 300s)
    const timestampNum = Number(timestamp);
    const nowSec = Math.floor(Date.now() / 1000);
    // Support both seconds and ms timestamps
    const timestampSec = timestampNum > 100000000000 ? Math.floor(timestampNum / 1000) : timestampNum;

    if (Math.abs(nowSec - timestampSec) > 300) {
      return NextResponse.json(
        { error: "Webhook timestamp expired. Replay attack prevented." },
        { status: 400 }
      );
    }

    // 2. Verify HMAC-SHA256 Signature
    const gateway = getBlaaizGateway();
    const webhookSecret = process.env.BLAAIZ_WEBHOOK_SECRET || "whsec_blaaiz_sandbox_secret_key_demo";
    const isValid = gateway.verifyWebhookSignature(rawBody, signature, timestamp, webhookSecret);

    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid webhook signature" },
        { status: 401 }
      );
    }

    // 3. Parse Event Body & Check Deduplication
    let event: any;
    try {
      event = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ error: "Malformed JSON payload" }, { status: 400 });
    }

    const eventId =
      event.id ||
      event.event_id ||
      `${event.transaction_id || "tx"}_${event.status || "ev"}_${timestamp}`;

    // Deduplication check
    const existingEvent = await prisma.webhookEvent.findUnique({
      where: { eventId },
    });

    if (existingEvent) {
      return NextResponse.json(
        { received: true, deduplicated: true, message: "Event already processed." },
        { status: 200 }
      );
    }

    // Record webhook event in DB
    await prisma.webhookEvent.create({
      data: {
        eventId,
        eventType: event.event || event.type || "transaction.updated",
        rawPayload: rawBody,
        signature,
        timestamp,
        verified: true,
      },
    });

    // 4. Update Transfer & Notify SSE
    const transactionId = event.transaction_id || event.data?.id || event.id;
    if (transactionId) {
      const transfer = await prisma.transfer.findFirst({
        where: {
          OR: [
            { blaaizTransactionId: transactionId },
            { id: transactionId },
          ],
        },
      });

      if (transfer) {
        const rawStatus = event.status || event.data?.status || "SUCCESSFUL";
        const newStatus = mapBlaaizStatusToTransferStatus(rawStatus, transfer.status as WayPayStatus);

        const updated = await prisma.transfer.update({
          where: { id: transfer.id },
          data: {
            status: newStatus,
            failureReason: newStatus === "FAILED" ? (event.failure_reason || "Partner payout declined") : null,
            events: {
              create: {
                fromStatus: transfer.status,
                toStatus: newStatus,
                message: `Status updated to ${STATUS_META[newStatus].label} via Blaaiz Webhook.`,
                source: "webhook",
                rawPayloadJson: rawBody,
              },
            },
          },
          include: {
            events: { orderBy: { createdAt: "asc" } },
            recipient: true,
          },
        });

        // Push to SSE listeners
        emitTransferEvent(transfer.id, {
          transfer: {
            ...updated,
            amountMinor: updated.amountMinor.toString(),
            feeMinor: updated.feeMinor.toString(),
            recipientGetsMinor: updated.recipientGetsMinor.toString(),
            statusMeta: STATUS_META[updated.status as WayPayStatus],
          },
        });
      }
    }

    return NextResponse.json({ received: true, verified: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to process webhook" },
      { status: 500 }
    );
  }
}
