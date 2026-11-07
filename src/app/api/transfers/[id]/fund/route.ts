import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { STATUS_META, WayPayStatus } from "@/domain/status";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const transfer = await prisma.transfer.findUnique({
      where: { id },
      include: { events: true },
    });

    if (!transfer) {
      return NextResponse.json({ error: "Transfer not found" }, { status: 404 });
    }

    if (transfer.status !== "AWAITING_FUNDS") {
      return NextResponse.json(
        { error: `Cannot fund transfer in status ${transfer.status}` },
        { status: 400 }
      );
    }

    // Move to PROCESSING
    const updated = await prisma.transfer.update({
      where: { id: transfer.id },
      data: {
        status: "PROCESSING",
        events: {
          create: {
            fromStatus: "AWAITING_FUNDS",
            toStatus: "PROCESSING",
            message: "Simulated NGN funding received via Wema Bank virtual account. Payout dispatched to recipient bank.",
            source: "simulated",
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
      transfer: {
        ...updated,
        amountMinor: updated.amountMinor.toString(),
        feeMinor: updated.feeMinor.toString(),
        recipientGetsMinor: updated.recipientGetsMinor.toString(),
        statusMeta: STATUS_META[updated.status as WayPayStatus],
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to simulate payment" },
      { status: 500 }
    );
  }
}
