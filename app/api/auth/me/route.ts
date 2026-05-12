import { NextResponse } from "next/server";

import { ApiError, callApi } from "@/lib/apiClient";
import type { MeResponse } from "@/lib/api-types";
import {
	clearSessionCookie,
	decodeSessionToken,
	isExpired,
	readSessionToken,
} from "@/lib/session";

export async function GET(): Promise<NextResponse> {
	const token = await readSessionToken();
	if (!token) {
		return NextResponse.json({ me: null }, { status: 401 });
	}

	const claims = decodeSessionToken(token);
	if (isExpired(claims)) {
		await clearSessionCookie();
		return NextResponse.json({ me: null }, { status: 401 });
	}

	try {
		const me = await callApi<MeResponse>("/api/v1/me", { token });
		return NextResponse.json({
			me: {
				accountUuid: me.account.account_uuid,
				firebaseUid: me.account.firebase_uid,
				email: me.account.email,
			},
		});
	} catch (err) {
		if (err instanceof ApiError && err.status === 401) {
			await clearSessionCookie();
			return NextResponse.json({ me: null }, { status: 401 });
		}
		return NextResponse.json(
			{ error: err instanceof Error ? err.message : "Unknown error" },
			{ status: 500 },
		);
	}
}
