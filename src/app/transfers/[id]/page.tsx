import React from "react";
import { TrackerClient } from "./TrackerClient";

export const metadata = {
  title: "Transfer Tracking — WayPay",
  description: "Real-time live status tracking for cross-border remittance via Blaaiz RaaS.",
};

export default async function TransferDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <TrackerClient transferId={id} />;
}
