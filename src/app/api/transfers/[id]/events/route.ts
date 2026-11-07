import { NextRequest } from "next/server";
import { sseEmitter } from "@/lib/sse-bus";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      // Send initial connect signal
      controller.enqueue(
        encoder.encode(`event: connected\ndata: ${JSON.stringify({ transferId: id, connected: true })}\n\n`)
      );

      const handler = (data: any) => {
        try {
          controller.enqueue(encoder.encode(`event: update\ndata: ${JSON.stringify(data)}\n\n`));
        } catch {
          // Stream might be closed
        }
      };

      sseEmitter.on(`transfer:${id}`, handler);

      // Keepalive ping every 15 seconds
      const pingInterval = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`: ping\n\n`));
        } catch {
          clearInterval(pingInterval);
        }
      }, 15000);

      req.signal.addEventListener("abort", () => {
        clearInterval(pingInterval);
        sseEmitter.off(`transfer:${id}`, handler);
        try {
          controller.close();
        } catch {}
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
