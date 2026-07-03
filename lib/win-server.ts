/**
 * Server-only data fetch for the shareable-win surface.
 *
 * Split from lib/win.ts because this pulls in apiClient → session →
 * next/headers, which must never be bundled into a client component. Only
 * import this from server components / route handlers.
 */
import { ApiError, callApi } from "@/lib/apiClient";
import type { PublicWinResponse } from "@/lib/api-types";

/**
 * Fetch a shared win. No auth token so it works for logged-out visitors and
 * link-preview crawlers. Returns null on 404 (unknown profile or no finalized
 * result for the contest).
 */
export async function fetchWin(
	username: string,
	contestUuid: string,
): Promise<PublicWinResponse | null> {
	try {
		return await callApi<PublicWinResponse>(
			`/api/v1/public/profiles/${encodeURIComponent(username)}/results/${encodeURIComponent(contestUuid)}`,
			{ token: null, cache: "no-store" },
		);
	} catch (err) {
		if (err instanceof ApiError && err.status === 404) return null;
		throw err;
	}
}
