import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getBlaaizGateway } from "@/domain";
import { toMinorUnits } from "@/domain/money";
import { CORRIDORS, SupportedCorridor } from "@/domain/corridors";

const quoteInputSchema = z.object({
  from_currency: z.string().optional(),
  sourceCurrency: z.string().optional(),
  to_currency: z.string().optional(),
  targetCurrency: z.string().optional(),
  amount: z.union([z.number(), z.string()]).optional(),
  amountMajor: z.union([z.number(), z.string()]).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = quoteInputSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const from_currency = (parsed.data.from_currency || parsed.data.sourceCurrency || "NGN").toUpperCase();
    const to_currency = (parsed.data.to_currency || parsed.data.targetCurrency || "USD").toUpperCase();
    const rawAmount = parsed.data.amount ?? parsed.data.amountMajor ?? 1000000;
    const amount = Number(rawAmount);

    if (isNaN(amount) || amount <= 0) {
      return NextResponse.json(
        { error: "Invalid transfer amount specified" },
        { status: 400 }
      );
    }

    const gateway = getBlaaizGateway();

    // Call Blaaiz fee breakdown endpoint
    const breakdown = await gateway.getFeeBreakdown({
      from_currency_id: from_currency,
      to_currency_id: to_currency,
      from_amount: amount,
    });

    const corridor = CORRIDORS[to_currency as SupportedCorridor] || {
      eta: "Within 10-30 minutes",
    };
    const paywideFee = 0; // PayWide service fee is 0 in demo mode
    const totalToPay = breakdown.you_send || amount;
    const recipientGets = breakdown.recipient_gets;
    const rate = breakdown.exchange_rate;

    // 5-minute locked quote window
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();
    const quoteId = `q_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    const sourceAmountMinor = toMinorUnits(amount, from_currency).toString();
    const feeMinor = toMinorUnits(breakdown.total_fees || 0, from_currency).toString();
    const targetAmountMinor = toMinorUnits(recipientGets, to_currency).toString();

    // Return combined payload satisfying QuoteData and classic quote object
    return NextResponse.json({
      success: true,
      quoteId,
      sourceCurrency: from_currency,
      targetCurrency: to_currency,
      sourceAmountMinor,
      targetAmountMinor,
      feeMinor,
      exchangeRate: rate,
      rateGuaranteeSeconds: 300,
      expiresAt,
      mode: gateway.mode,
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
