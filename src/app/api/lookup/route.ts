import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getBlaaizGateway } from "@/domain";

const lookupSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("bank_account"),
    account_number: z.string().min(5),
    bank_id: z.string().default("058"), // e.g. GTBank
  }),
  z.object({
    type: z.literal("uk_payee"),
    sort_code: z.string().length(6),
    account_number: z.string().length(8),
    account_name: z.string().min(2),
  }),
  z.object({
    type: z.literal("iban"),
    iban: z.string().min(15).max(34),
  }),
]);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = lookupSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const gateway = getBlaaizGateway();
    const data = parsed.data;

    if (data.type === "bank_account") {
      const result = await gateway.lookupBankAccount(data.account_number, data.bank_id);
      return NextResponse.json({ success: true, result });
    } else if (data.type === "uk_payee") {
      const result = await gateway.verifyPayee({
        sort_code: data.sort_code,
        account_number: data.account_number,
        account_name: data.account_name,
      });
      return NextResponse.json({ success: true, result });
    } else if (data.type === "iban") {
      const result = await gateway.verifyIban({ iban: data.iban });
      return NextResponse.json({ success: true, result });
    }

    return NextResponse.json({ error: "Unsupported lookup type" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Lookup verification failed" },
      { status: 500 }
    );
  }
}
