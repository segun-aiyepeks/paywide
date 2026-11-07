import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { STATUS_META, WayPayStatus } from "@/domain/status";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const query = searchParams.get("q");

    const where: any = {};

    if (status && status !== "ALL") {
      where.status = status;
    }

    if (query) {
      where.OR = [
        { id: { contains: query } },
        { blaaizTransactionId: { contains: query } },
        { toCurrency: { contains: query.toUpperCase() } },
        { recipient: { name: { contains: query } } },
      ];
    }

    const transfers = await prisma.transfer.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        recipient: true,
        events: {
          orderBy: { createdAt: "asc" },
        },
      },
      take: 50,
    });

    const formatted = transfers.map((tx) => ({
      ...tx,
      amountMinor: tx.amountMinor.toString(),
      feeMinor: tx.feeMinor.toString(),
      recipientGetsMinor: tx.recipientGetsMinor.toString(),
      statusMeta: STATUS_META[tx.status as WayPayStatus] || {
        status: tx.status,
        label: tx.status,
        subtext: "",
        badgeVariant: "neutral",
        stepIndex: 0,
      },
    }));

    return NextResponse.json({
      success: true,
      count: formatted.length,
      transfers: formatted,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to list transfers" },
      { status: 500 }
    );
  }
}
