import { NextResponse, type NextRequest } from "next/server";

import { ApiError, callApi } from "@/lib/apiClient";
import type { LoginResponse, MeResponse } from "@/lib/api-types";
import { setSessionCookie } from "@/lib/session";

interface SessionRequestBody {
	idToken: string;
}

/**
 * Exchange a Firebase ID token for an api-speed-survivor app JWT and store it
 * in an httpOnly cookie.
 *
 * The web wallet is sign-in only — registration happens in the mobile app
 * (we don't ship the Speed onboarding here). A 401 from upstream is passed
 * through unchanged so the UI can tell the player to install the app.
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
	let body: SessionRequestBody;
	try {
		body = (await req.json()) as SessionRequestBody;
	} catch {
		return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
	}

	if (!body?.idToken) {
		return NextResponse.json({ error: "idToken is required" }, { status: 400 });
	}

	let token: string | null;
	try {
		const data = await callApi<LoginResponse>("/api/v1/auth/login", {
			method: "POST",
			body: { id_token: body.idToken },
			token: null,
		});
		token = data.token ?? null;
	} catch (err) {
		return errorFor(err);
	}

	if (!token) {
		return NextResponse.json(
			{ error: "API did not return a JWT" },
			{ status: 502 },
		);
	}

	await setSessionCookie(token);

	let me: MeResponse | null = null;
	try {
		me = await callApi<MeResponse>("/api/v1/me", { token });
	} catch {
		// /me failure shouldn't kill login — we have the JWT cookie set.
		me = null;
	}

	return NextResponse.json({
		me: me
			? {
					accountUuid: me.account.account_uuid,
					firebaseUid: me.account.firebase_uid,
					email: me.account.email,
				}
			: null,
	});
}

function errorFor(err: unknown): NextResponse {
	if (err instanceof ApiError) {
		const message =
			typeof err.body === "object" && err.body && "detail" in err.body
				? String((err.body as { detail: unknown }).detail)
				: err.message;
		return NextResponse.json({ error: message }, { status: err.status });
	}
	return NextResponse.json(
		{ error: err instanceof Error ? err.message : "Unknown error" },
		{ status: 500 },
	);
}
