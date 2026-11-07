import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getBlaaizGateway } from "@/domain";
import { mapBlaaizStatusToTransferStatus, STATUS_META, WayPayStatus } from "@/domain/status";

function formatTransferResponse(t: any) {
  return {
    ...t,
    reference: `WP-${t.id.slice(-8).toUpperCase()}`,
    sourceAmountMinor: t.amountMinor.toString(),
    targetAmountMinor: t.recipientGetsMinor.toString(),
    amountMinor: t.amountMinor.toString(),
    feeMinor: t.feeMinor.toString(),
    recipientGetsMinor: t.recipientGetsMinor.toString(),
    sourceCurrency: t.fromCurrency,
    targetCurrency: t.toCurrency,
    virtualAccount: t.fundingAccountNumber,
    blaaizPayoutId: t.blaaizTransactionId,
    recipientName: t.recipient?.name || "Authorized Recipient",
    statusMeta: STATUS_META[t.status as WayPayStatus],
  };
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const transfer = await prisma.transfer.findUnique({
      where: { id },
      include: {
        events: {
          orderBy: { createdAt: "asc" },
        },
        recipient: true,
      },
    });

    if (!transfer) {
      return NextResponse.json({ error: "Transfer not found" }, { status: 404 });
    }

    // Polling fallback: If active, check Blaaiz for updates
    if (
      (transfer.status === "AWAITING_FUNDS" || transfer.status === "PROCESSING") &&
      transfer.blaaizTransactionId
    ) {
      try {
        const gateway = getBlaaizGateway();
        const blzTx = await gateway.getTransaction(transfer.blaaizTransactionId);

        if (blzTx && blzTx.status) {
          const newStatus = mapBlaaizStatusToTransferStatus(
            blzTx.status,
            transfer.status as WayPayStatus
          );

          if (newStatus !== transfer.status) {
            const updated = await prisma.transfer.update({
              where: { id: transfer.id },
              data: {
                status: newStatus,
                events: {
                  create: {
                    fromStatus: transfer.status,
                    toStatus: newStatus,
                    message: `Status updated to ${STATUS_META[newStatus].label} via Blaaiz polling.`,
                    source: "polling",
                    rawPayloadJson: JSON.stringify(blzTx),
                  },
                },
              },
              include: {
                events: { orderBy: { createdAt: "asc" } },
                recipient: true,
              },
            });

            return NextResponse.json({
              success: true,
              transfer: formatTransferResponse(updated),
            });
          }
        }
      } catch (pollErr) {
        // Polling failure should not crash the endpoint; return current DB state
        console.error("Polling fallback error:", pollErr);
      }
    }

    return NextResponse.json({
      success: true,
      transfer: formatTransferResponse(transfer),
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to fetch transfer" },
      { status: 500 }
    );
  }
}
