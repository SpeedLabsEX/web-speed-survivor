import { NextResponse } from "next/server";

import { ApiError, callApi } from "@/lib/apiClient";
import type { MeResponse } from "@/lib/api-types";
import {
	CoinflowError,
	fetchCoinflowSessionKey,
} from "@/lib/coinflow";
import {
	clearSessionCookie,
	decodeSessionToken,
	isExpired,
	readSessionToken,
} from "@/lib/session";

/**
 * Mint a Coinflow session key for the currently logged-in user.
 *
 * The browser cannot do this directly without exposing our merchant API
 * key. This handler:
 *   1. Reads the app JWT from the httpOnly cookie.
 *   2. Resolves the caller's account_uuid via GET /api/v1/me.
 *   3. Calls Coinflow GET /api/auth/session-key with the merchant key.
 *   4. Returns the sessionKey + accountUuid + email to the client so the
 *      <CoinflowPurchase> SDK can render the embedded checkout.
 */
export async function POST(): Promise<NextResponse> {
	const token = await readSessionToken();
	if (!token) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	const claims = decodeSessionToken(token);
	if (isExpired(claims)) {
		await clearSessionCookie();
		return NextResponse.json({ error: "Session expired" }, { status: 401 });
	}

	let me: MeResponse;
	try {
		me = await callApi<MeResponse>("/api/v1/me", { token });
	} catch (err) {
		if (err instanceof ApiError && err.status === 401) {
			await clearSessionCookie();
			return NextResponse.json({ error: "Session expired" }, { status: 401 });
		}
		return NextResponse.json(
			{ error: err instanceof Error ? err.message : "Failed to load account" },
			{ status: 502 },
		);
	}

	const accountUuid = me.account.account_uuid;
	if (!accountUuid) {
		return NextResponse.json(
			{ error: "Account UUID missing from /me response" },
			{ status: 500 },
		);
	}

	try {
		const sk = await fetchCoinflowSessionKey(accountUuid);
		return NextResponse.json({
			sessionKey: sk.sessionKey,
			expiresAt: sk.expiresAt,
			accountUuid,
			email: me.account.email,
		});
	} catch (err) {
		if (err instanceof CoinflowError) {
			return NextResponse.json(
				{ error: err.message, detail: err.body },
				{ status: 502 },
			);
		}
		return NextResponse.json(
			{ error: err instanceof Error ? err.message : "Coinflow request failed" },
			{ status: 502 },
		);
	}
}
