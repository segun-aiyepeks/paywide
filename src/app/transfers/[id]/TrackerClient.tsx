"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { LiveTracker } from "../../../components/LiveTracker";
import { ReceiptModal } from "../../../components/ReceiptModal";

export function TrackerClient({ transferId }: { transferId: string }) {
  const router = useRouter();
  const [isReceiptOpen, setIsReceiptOpen] = useState<boolean>(false);
  const [transferData, setTransferData] = useState<any>(null);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <LiveTracker
        transferId={transferId}
        onOpenReceipt={(data) => {
          if (data) setTransferData(data);
          setIsReceiptOpen(true);
        }}
        onStartNew={() => router.push("/")}
      />

      <ReceiptModal
        transfer={transferData}
        isOpen={isReceiptOpen}
        onClose={() => setIsReceiptOpen(false)}
      />
    </div>
  );
}
