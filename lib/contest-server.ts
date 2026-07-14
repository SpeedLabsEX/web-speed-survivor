/**
 * Server-side fetch for a single public contest.
 *
 * Backs the shareable /contest/:id page reached from mobile deep links when the
 * app is not installed. Fetched with no auth token so it works for logged-out
 * visitors and link-preview crawlers.
 */
import { ApiError, callApi } from "./apiClient";
import type { PublicContest } from "./api-types";

export async function fetchPublicContest(
	contestId: string,
): Promise<PublicContest | null> {
	try {
		return await callApi<PublicContest>(
			`/api/v1/public/contests/${encodeURIComponent(contestId)}`,
			{ token: null, cache: "no-store" },
		);
	} catch (err) {
		if (err instanceof ApiError && err.status === 404) return null;
		throw err;
	}
}
