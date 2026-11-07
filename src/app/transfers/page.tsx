import React from "react";
import { TransfersList } from "../../components/TransfersList";

export const metadata = {
  title: "Transfer Activity — PayWide",
  description: "View and track cross-border remittance transactions executed via the Blaaiz RaaS gateway.",
};

export default function TransfersPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <TransfersList />
    </div>
  );
}
