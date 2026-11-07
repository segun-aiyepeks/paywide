import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getBlaaizGateway } from "@/domain";
import { toMinorUnits, toMajorUnits } from "@/domain/money";
import { universalRecipientSchema } from "@/domain/corridors";
import { STATUS_META, WayPayStatus } from "@/domain/status";

const initiatePayoutSchema = z.object({
  idempotency_key: z.string().min(8, "Idempotency key is required"),
  from_currency: z.literal("NGN").default("NGN"),
  to_currency: z.enum(["USD", "GBP", "EUR", "CAD"]),
  amount: z.number().positive("Amount must be positive"),
  purpose: z.string().min(2, "Purpose of transfer is required"),
  sender_name: z.string().default("Demo Sender"),
  sender_email: z.string().email().default("demo.sender@paywide.example"),
  recipient: universalRecipientSchema,
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = initiatePayoutSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const {
      idempotency_key,
      from_currency,
      to_currency,
      amount,
      purpose,
      sender_name,
      sender_email,
      recipient,
    } = parsed.data;

    // Idempotency check: Return existing transfer if idempotency key was already processed
    const existing = await prisma.transfer.findUnique({
      where: { idempotencyKey: idempotency_key },
      include: { events: true },
    });

    if (existing) {
      return NextResponse.json({
        success: true,
        idempotent_replay: true,
        transfer: {
          ...existing,
          amountMinor: existing.amountMinor.toString(),
          feeMinor: existing.feeMinor.toString(),
          recipientGetsMinor: existing.recipientGetsMinor.toString(),
          statusMeta: STATUS_META[existing.status as WayPayStatus],
        },
      });
    }

    const gateway = getBlaaizGateway();

    // 1. Ensure user and customer records exist
    let user = await prisma.user.findUnique({
      where: { email: sender_email },
      include: { customers: true },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email: sender_email,
          name: sender_name,
        },
        include: { customers: true },
      });
    }

    let customer = user.customers[0];
    if (!customer) {
      const blzCustomer = await gateway.createCustomer({
        first_name: sender_name.split(" ")[0] || "Ada",
        last_name: sender_name.split(" ")[1] || "Okonkwo",
        email: sender_email,
        type: "individual",
        country: "NGA",
        id_type: "drivers_license",
        id_number: "DL-90812347",
      });

      customer = await prisma.customer.create({
        data: {
          userId: user.id,
          blaaizCustomerId: blzCustomer.id,
          idType: "drivers_license",
          idNumber: "DL-90812347",
          verificationStatus: blzCustomer.verification_status,
        },
      });
    }

    // 2. Fetch fee breakdown & compute minor units
    const feeBreakdown = await gateway.getFeeBreakdown({
      from_currency_id: from_currency,
      to_currency_id: to_currency,
      from_amount: amount,
    });

    const amountMinor = toMinorUnits(amount, from_currency);
    const feeMinor = toMinorUnits(feeBreakdown.total_fees, from_currency);
    const recipientGetsMinor = toMinorUnits(feeBreakdown.recipient_gets, to_currency);

    // 3. Prepare corridor payout request payload for Blaaiz
    const payoutPayload: any = {
      wallet_id: "wal_ngn_primary",
      customer_id: customer.blaaizCustomerId,
      from_currency_id: from_currency,
      to_currency_id: to_currency,
      from_amount: amount,
      merchant_reference: idempotency_key,
      note: purpose,
    };

    if (recipient.currency === "GBP") {
      payoutPayload.method = "bank_transfer";
      payoutPayload.sort_code = recipient.sort_code;
      payoutPayload.account_number = recipient.account_number;
      payoutPayload.account_name = recipient.account_name;
    } else if (recipient.currency === "EUR") {
      payoutPayload.method = "bank_transfer";
      payoutPayload.iban = recipient.iban;
      payoutPayload.bic_code = recipient.bic_code;
      payoutPayload.account_name = recipient.account_name;
    } else if (recipient.currency === "USD") {
      payoutPayload.method = recipient.method;
      payoutPayload.type = recipient.type;
      payoutPayload.account_name = recipient.account_name;
      payoutPayload.bank_name = recipient.bank_name;
      payoutPayload.account_type = recipient.account_type;
      payoutPayload.routing_number = recipient.routing_number;
      payoutPayload.account_number = recipient.account_number;
      if (recipient.method === "wire") {
        payoutPayload.swift_code = recipient.swift_code;
      }
    } else if (recipient.currency === "CAD") {
      payoutPayload.method = "interac";
      payoutPayload.email = recipient.email;
      payoutPayload.interac_first_name = recipient.interac_first_name;
      payoutPayload.interac_last_name = recipient.interac_last_name;
    }

    // 4. Initiate payout in Blaaiz
    const payoutRes = await gateway.initiatePayout(payoutPayload);

    // 5. Generate virtual bank account for NGN funding step
    const vba = await gateway.createVirtualBankAccount({
      wallet_id: "wal_ngn_primary",
      account_name: `PayWide / ${sender_name}`,
    });

    // 6. Save Recipient
    const recipientRecord = await prisma.recipient.create({
      data: {
        userId: user.id,
        name:
          recipient.currency === "CAD"
            ? `${recipient.interac_first_name} ${recipient.interac_last_name}`
            : (recipient as any).account_name,
        email: recipient.currency === "CAD" ? recipient.email : null,
        currency: to_currency,
        method: recipient.method,
        detailsJson: JSON.stringify(recipient),
      },
    });

    // 7. Create Transfer record in database
    const transfer = await prisma.transfer.create({
      data: {
        userId: user.id,
        recipientId: recipientRecord.id,
        idempotencyKey: idempotency_key,
        blaaizTransactionId: payoutRes.transaction.id,
        mode: gateway.mode,
        status: "AWAITING_FUNDS",
        fromCurrency: from_currency,
        toCurrency: to_currency,
        payoutMethod: recipient.method,
        amountMinor,
        feeMinor,
        recipientGetsMinor,
        exchangeRate: feeBreakdown.exchange_rate,
        purpose,
        fundingAccountName: vba.account_name,
        fundingAccountNumber: vba.account_number,
        fundingBankName: vba.bank_name,
        events: {
          create: [
            {
              fromStatus: null,
              toStatus: "CREATED",
              message: "Transfer created and quote locked.",
              source: "system",
            },
            {
              fromStatus: "CREATED",
              toStatus: "AWAITING_FUNDS",
              message: `Virtual funding account ${vba.account_number} (${vba.bank_name}) generated. Waiting for sender payment.`,
              source: "system",
            },
          ],
        },
      },
      include: {
        events: true,
        recipient: true,
      },
    });

    return NextResponse.json({
      success: true,
      transfer: {
        ...transfer,
        amountMinor: transfer.amountMinor.toString(),
        feeMinor: transfer.feeMinor.toString(),
        recipientGetsMinor: transfer.recipientGetsMinor.toString(),
        statusMeta: STATUS_META[transfer.status as WayPayStatus],
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to initiate transfer" },
      { status: 500 }
    );
  }
}
