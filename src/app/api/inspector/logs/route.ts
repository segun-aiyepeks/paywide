import { NextResponse } from "next/server";
import { getBlaaizGateway } from "@/domain";

export async function GET() {
  const gateway = getBlaaizGateway();
  const logs = gateway.getCallLogs();

  return NextResponse.json({
    mode: gateway.mode,
    count: logs.length,
    logs,
  });
}
