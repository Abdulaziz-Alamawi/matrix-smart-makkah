import { NextResponse } from "next/server";
import { buildSnapshot } from "@/lib/data-engine";

export const dynamic = "force-dynamic";

// GET /api/snapshot — full real-time city telemetry snapshot.
export async function GET() {
  const snapshot = buildSnapshot(new Date());
  return NextResponse.json(snapshot, {
    headers: { "Cache-Control": "no-store, max-age=0" },
  });
}
