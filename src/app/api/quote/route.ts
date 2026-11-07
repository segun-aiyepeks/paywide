import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getBlaaizGateway } from "@/domain";
import { toMinorUnits, toMajorUnits, calculateRecipientMinor } from "@/domain/money";
import { CORRIDORS, SupportedCorridor } from "@/domain/corridors";

const quoteRequestSchema = z.object({
  from_currency: z.literal("NGN").default("NGN"),
  to_currency: z.enum(["USD", "GBP", "EUR", "CAD"]),
  amount: z.number().positive("Amount must be greater than 0"),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = quoteRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { from_currency, to_currency, amount } = parsed.data;
    const gateway = getBlaaizGateway();

    // Call Blaaiz fee breakdown endpoint
    const breakdown = await gateway.getFeeBreakdown({
      from_currency_id: from_currency,
      to_currency_id: to_currency,
      from_amount: amount,
    });

    const corridor = CORRIDORS[to_currency as SupportedCorridor];
    const paywideFee = 0; // PayWide service fee is 0 in demo mode
    const totalToPay = breakdown.you_send;
    const recipientGets = breakdown.recipient_gets;
    const rate = breakdown.exchange_rate;

    // 5-minute locked quote window
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

    return NextResponse.json({
      success: true,
      quote: {
        from_currency,
        to_currency,
        you_send: amount,
        blaaiz_fee: breakdown.total_fees,
        paywide_fee: paywideFee,
        total_to_pay: totalToPay,
        exchange_rate: rate,
        recipient_gets: recipientGets,
        eta: corridor.eta,
        expires_at: expiresAt,
        mode: gateway.mode,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to calculate quote" },
      { status: 500 }
    );
  }
}
