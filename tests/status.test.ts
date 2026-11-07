import { describe, it, expect } from "vitest";
import {
  mapBlaaizStatusToTransferStatus,
  isValidStatusTransition,
  STATUS_META,
} from "../src/domain/status";

describe("Status Mapping & State Machine", () => {
  it("maps Blaaiz SUCCESSFUL to COMPLETED (Delivered)", () => {
    const status = mapBlaaizStatusToTransferStatus("SUCCESSFUL");
    expect(status).toBe("COMPLETED");
    expect(STATUS_META[status].label).toBe("Delivered");
  });

  it("maps Blaaiz PROCESSING to PROCESSING (On its way)", () => {
    const status = mapBlaaizStatusToTransferStatus("PROCESSING");
    expect(status).toBe("PROCESSING");
    expect(STATUS_META[status].label).toBe("On its way");
  });

  it("maps Blaaiz PENDING / AWAITING_APPROVAL to AWAITING_FUNDS (Waiting for your payment)", () => {
    expect(mapBlaaizStatusToTransferStatus("PENDING")).toBe("AWAITING_FUNDS");
    expect(mapBlaaizStatusToTransferStatus("AWAITING_APPROVAL")).toBe("AWAITING_FUNDS");
    expect(STATUS_META["AWAITING_FUNDS"].label).toBe("Waiting for your payment");
  });

  it("maps Blaaiz FAILED / REVERSED to FAILED (Couldn't complete)", () => {
    expect(mapBlaaizStatusToTransferStatus("FAILED")).toBe("FAILED");
    expect(mapBlaaizStatusToTransferStatus("REVERSED")).toBe("FAILED");
    expect(STATUS_META["FAILED"].label).toBe("Couldn't complete");
  });

  it("prevents status regression from COMPLETED", () => {
    expect(mapBlaaizStatusToTransferStatus("PENDING", "COMPLETED")).toBe("COMPLETED");
    expect(mapBlaaizStatusToTransferStatus("PROCESSING", "COMPLETED")).toBe("COMPLETED");
  });

  it("enforces unidirectional state transitions", () => {
    expect(isValidStatusTransition("CREATED", "AWAITING_FUNDS")).toBe(true);
    expect(isValidStatusTransition("AWAITING_FUNDS", "PROCESSING")).toBe(true);
    expect(isValidStatusTransition("PROCESSING", "COMPLETED")).toBe(true);
    expect(isValidStatusTransition("PROCESSING", "FAILED")).toBe(true);

    // Illegal backwards transitions
    expect(isValidStatusTransition("COMPLETED", "PROCESSING")).toBe(false);
    expect(isValidStatusTransition("COMPLETED", "CREATED")).toBe(false);
    expect(isValidStatusTransition("FAILED", "AWAITING_FUNDS")).toBe(false);
  });
});
