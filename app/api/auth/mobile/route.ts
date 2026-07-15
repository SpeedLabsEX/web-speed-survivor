import { NextResponse, type NextRequest } from "next/server";

import { callApi } from "@/lib/apiClient";
import { env } from "@/lib/env";
import { setSessionCookie } from "@/lib/session";

interface HandoffRedemption {
	token: string;
	redirect_path: string;
}

const ALLOWED_REDIRECT_PATHS = new Set([
	"/wallet",
	"/wallet/deposit",
	"/wallet/withdraw",
]);

function redirectResponse(url: URL): NextResponse {
	const response = NextResponse.redirect(url, 303);
	response.headers.set("Cache-Control", "no-store, max-age=0");
	response.headers.set("Referrer-Policy", "no-referrer");
	return response;
}

function appUrl(path: string): URL {
	return new URL(path, `${env.appUrl.replace(/\/+$/, "")}/`);
}

function loginFallback(): NextResponse {
	const url = appUrl("/login");
	url.searchParams.set("next", "/wallet");
	url.searchParams.set("handoff", "invalid");
	return redirectResponse(url);
}

function safeRedirectPath(value: string): string | null {
	const parsed = new URL(value, "https://wallet.invalid");
	if (parsed.origin !== "https://wallet.invalid") return null;
	if (parsed.search || parsed.hash) return null;
	if (!ALLOWED_REDIRECT_PATHS.has(parsed.pathname)) return null;
	return parsed.pathname;
}

export async function GET(req: NextRequest): Promise<NextResponse> {
	const code = req.nextUrl.searchParams.get("code")?.trim();
	if (!code || code.length < 32 || code.length > 128) {
		return loginFallback();
	}

	try {
		const redemption = await callApi<HandoffRedemption>(
			"/api/v1/auth/web-handoff/redeem",
			{
				method: "POST",
				body: { handoff_code: code },
				token: null,
			},
		);
		const redirectPath = safeRedirectPath(redemption.redirect_path);
		if (!redemption.token || !redirectPath) {
			return loginFallback();
		}

		await setSessionCookie(redemption.token);
		return redirectResponse(appUrl(redirectPath));
	} catch {
		return loginFallback();
	}
}
