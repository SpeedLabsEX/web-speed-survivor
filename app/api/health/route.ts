import { NextResponse } from "next/server";

/**
 * Liveness/readiness probe for DigitalOcean App Platform (and any other
 * orchestrator). Intentionally cheap — no DB, no upstream calls — so a
 * failing dependency doesn't cascade into restart loops.
 *
 * For deeper readiness, the underlying api-speed-survivor exposes its
 * own `/api/v1/health`; this surface only needs to confirm the Next
 * server is accepting requests.
 */
export async function GET(): Promise<NextResponse> {
	return NextResponse.json({
		status: "ok",
		service: "web-speed-survivor",
		uptime_seconds: Math.round(process.uptime()),
	});
}
