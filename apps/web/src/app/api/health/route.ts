import { NextResponse } from "next/server";

// GET /api/health — liveness/readiness probe for orchestrators.
export async function GET() {
  return NextResponse.json({
    status: "ok",
    service: "matrix-smart-makkah-web",
    version: "1.0.0",
    owner: "Abdulaziz AlAmawi",
    timestamp: new Date().toISOString(),
  });
}
