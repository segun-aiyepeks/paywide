import { BlaaizGateway } from "./gateway";
import { MockBlaaizGateway } from "./mock-gateway";
import { RealBlaaizGateway } from "./real-gateway";

let gatewayInstance: BlaaizGateway | null = null;

export function getBlaaizGateway(): BlaaizGateway {
  if (!gatewayInstance) {
    const clientId = process.env.BLAAIZ_CLIENT_ID?.trim();
    const clientSecret = process.env.BLAAIZ_CLIENT_SECRET?.trim();
    const apiKey = process.env.BLAAIZ_API_KEY?.trim();
    const hasCredentials = Boolean((clientId && clientSecret) || apiKey);

    // If live credentials are provided, default to live gateway
    const forceMock = process.env.USE_MOCK === "force_mock";
    const isLiveRequested = process.env.USE_MOCK === "false" || hasCredentials;

    if (isLiveRequested && hasCredentials && !forceMock) {
      gatewayInstance = new RealBlaaizGateway();
    } else {
      gatewayInstance = new MockBlaaizGateway();
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
