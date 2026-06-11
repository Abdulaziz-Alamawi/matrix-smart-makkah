import { buildSnapshot } from "@/lib/data-engine";

export const dynamic = "force-dynamic";

// GET /api/stream — Server-Sent Events live sensor feed.
// Pushes a fresh city snapshot every 3s, emulating the IoT gateway stream.
export async function GET() {
  const encoder = new TextEncoder();
  let timer: ReturnType<typeof setInterval> | null = null;

  const stream = new ReadableStream({
    start(controller) {
      const push = () => {
        const snapshot = buildSnapshot(new Date());
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(snapshot)}\n\n`)
        );
      };
      push();
      timer = setInterval(push, 3000);
    },
    cancel() {
      if (timer) clearInterval(timer);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
