/**
 * Transfer State Machine & Blaaiz Status Mapping
 * Single authoritative source of truth for all transfer statuses,
 * transition validation, and plain-language microcopy.
 */

export type PayWideStatus =
  | "CREATED"
  | "AWAITING_FUNDS"
  | "PROCESSING"
  | "COMPLETED"
  | "FAILED"
  | "EXPIRED"
  | "CANCELLED";

export type WayPayStatus = PayWideStatus;
export type TransferStatus = PayWideStatus;

export type BlaaizStatus =
  | "PENDING"
  | "PROCESSING"
  | "SUCCESSFUL"
  | "FAILED"
  | "EXPIRED"
  | "REVERSED"
  | "CANCELLED"
  | "AWAITING_APPROVAL";

export interface StatusMeta {
  status: WayPayStatus;
  label: string;
  subtext: string;
  badgeVariant: "default" | "warning" | "info" | "success" | "destructive" | "neutral";
  stepIndex: number; // 0: Created, 1: Awaiting Funds, 2: Processing, 3: Completed
}

export const STATUS_META: Record<WayPayStatus, StatusMeta> = {
  CREATED: {
    status: "CREATED",
    label: "Transfer created",
    subtext: "Quote locked and transfer registered.",
    badgeVariant: "default",
    stepIndex: 0,
  },
  AWAITING_FUNDS: {
    status: "AWAITING_FUNDS",
    label: "Waiting for your payment",
    subtext: "Please send the exact NGN amount to your dedicated virtual account.",
    badgeVariant: "warning",
    stepIndex: 1,
  },
  PROCESSING: {
    status: "PROCESSING",
    label: "On its way",
    subtext: "Payment confirmed. Funds are being dispatched via partner payout rails.",
    badgeVariant: "info",
    stepIndex: 2,
  },
  COMPLETED: {
    status: "COMPLETED",
    label: "Delivered",
    subtext: "Funds have arrived successfully in the recipient's account.",
    badgeVariant: "success",
    stepIndex: 3,
  },
  FAILED: {
    status: "FAILED",
    label: "Couldn't complete",
    subtext: "The transfer could not be delivered. Your funds are protected.",
    badgeVariant: "destructive",
    stepIndex: 3,
  },
  EXPIRED: {
    status: "EXPIRED",
    label: "Quote expired",
    subtext: "Funding window elapsed before payment was detected.",
    badgeVariant: "neutral",
    stepIndex: 1,
  },
  CANCELLED: {
    status: "CANCELLED",
    label: "Cancelled",
    subtext: "Transfer cancelled by sender prior to funding.",
    badgeVariant: "neutral",
    stepIndex: 1,
  },
};

/**
 * Maps any raw Blaaiz transaction status to the PayWide domain status.
 */
export function mapBlaaizStatusToTransferStatus(
  blaaizStatus: BlaaizStatus | string,
  currentStatus?: WayPayStatus
): WayPayStatus {
  const normalized = blaaizStatus ? blaaizStatus.toUpperCase().trim() : "";

  switch (normalized) {
    case "PENDING":
    case "AWAITING_APPROVAL":
      // If we are already PROCESSING or COMPLETED, do not regress
      if (currentStatus === "PROCESSING" || currentStatus === "COMPLETED") {
        return currentStatus;
      }
      return "AWAITING_FUNDS";

    case "PROCESSING":
      if (currentStatus === "COMPLETED") {
        return "COMPLETED";
      }
      return "PROCESSING";

    case "SUCCESSFUL":
      return "COMPLETED";

    case "FAILED":
    case "REVERSED":
      return "FAILED";

    case "EXPIRED":
      return "EXPIRED";

    case "CANCELLED":
      return "CANCELLED";

    default:
      return currentStatus || "CREATED";
  }
}

/**
 * Validates whether a state transition is legal in the unidirectional state machine.
 */
export function isValidStatusTransition(from: WayPayStatus, to: WayPayStatus): boolean {
  if (from === to) return true;

  const validTransitions: Record<WayPayStatus, WayPayStatus[]> = {
    CREATED: ["AWAITING_FUNDS", "EXPIRED", "CANCELLED", "FAILED"],
    AWAITING_FUNDS: ["PROCESSING", "EXPIRED", "CANCELLED", "FAILED"],
    PROCESSING: ["COMPLETED", "FAILED"],
    COMPLETED: [], // Terminal
    FAILED: [], // Terminal
    EXPIRED: [], // Terminal
    CANCELLED: [], // Terminal
  };

  return validTransitions[from]?.includes(to) ?? false;
}

export function getStatusCopy(status: WayPayStatus | string): { title: string; description: string } {
  const meta = STATUS_META[status as WayPayStatus];
  if (meta) {
    return {
      title: meta.label,
      description: meta.subtext,
    };
  }
  return {
    title: String(status || "Processing"),
    description: "Your transfer is being handled by Blaaiz rails.",
  };
}

export function getStatusColor(status: WayPayStatus | string): {
  bg: string;
  text: string;
  border: string;
} {
  switch (status) {
    case "COMPLETED":
      return {
        bg: "bg-emerald-50",
        text: "text-emerald-800",
        border: "border-emerald-200",
      };
    case "PROCESSING":
      return {
        bg: "bg-blue-50",
        text: "text-blue-800",
        border: "border-blue-200",
      };
    case "AWAITING_FUNDS":
      return {
        bg: "bg-amber-50",
        text: "text-amber-800",
        border: "border-amber-200",
      };
    case "FAILED":
      return {
        bg: "bg-rose-50",
        text: "text-rose-800",
        border: "border-rose-200",
      };
    case "EXPIRED":
    case "CANCELLED":
      return {
        bg: "bg-slate-100",
        text: "text-slate-700",
        border: "border-slate-300",
      };
    case "CREATED":
    default:
      return {
        bg: "bg-slate-50",
        text: "text-slate-800",
        border: "border-slate-200",
      };
  }
}

