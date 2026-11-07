import { BlaaizGateway } from "./gateway";
import { MockBlaaizGateway } from "./mock-gateway";
import { RealBlaaizGateway } from "./real-gateway";

let gatewayInstance: BlaaizGateway | null = null;

export function getBlaaizGateway(): BlaaizGateway {
  if (!gatewayInstance) {
    const isMock = process.env.USE_MOCK !== "false";
    if (isMock) {
      gatewayInstance = new MockBlaaizGateway();
    } else {
      gatewayInstance = new RealBlaaizGateway();
    }
  }
  return gatewayInstance;
}

export * from "./gateway";
export * from "./money";
export * from "./status";
export * from "./corridors";
export * from "./mock-gateway";
export * from "./real-gateway";
