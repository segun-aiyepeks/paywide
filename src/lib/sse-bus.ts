import { EventEmitter } from "events";

// Global EventEmitter for Server-Sent Events (SSE) across route handlers
const globalForEvents = globalThis as unknown as {
  sseEmitter: EventEmitter | undefined;
};

export const sseEmitter = globalForEvents.sseEmitter ?? new EventEmitter();
if (process.env.NODE_ENV !== "production") globalForEvents.sseEmitter = sseEmitter;

export function emitTransferEvent(transferId: string, eventData: any) {
  sseEmitter.emit(`transfer:${transferId}`, eventData);
}
