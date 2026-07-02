import { NextResponse, type NextRequest } from "next/server";
import { SignJWT } from "jose";

import { serverEnv } from "@/lib/env";
import {
	clearSessionCookie,
	decodeSessionToken,
	isExpired,
	readSessionToken,
} from "@/lib/session";

const ALLOWED_PREFIXES = ["sessions", "withdrawals", "reconciliation"];
const PAYMENTS_JWT_ISSUER = "speed-labs-api";
const PAYMENTS_JWT_AUDIENCE = "speed-mobile-app";
const PAYMENTS_JWT_VERSION = 2;
const PAYMENTS_JWT_TTL = "5m";
// Re-use a minted token until shortly before its 5m expiry.
const MINTED_TOKEN_REUSE_MS = 4 * 60_000;
const MINTED_TOKEN_CACHE_MAX = 500;

function isAllowed(path: string): boolean {
	return ALLOWED_PREFIXES.some((prefix) => path === prefix || path.startsWith(`${prefix}/`));
}

// Session token → freshly minted payments token. Module-scope is fine: the
// standalone server is a single long-lived Node process.
const mintedTokens = new Map<string, { token: string; staleAtMs: number }>();

/**
 * Mint the short-lived bearer token api-payments expects.
 *
 * The session JWT from api-speed-survivor already carries the Firebase UID as
 * `sub` (api-payments resolves the account from that claim alone), so we can
 * re-sign locally — no upstream /me round-trip per request.
 */
async function createPaymentsBearerToken(sessionToken: string): Promise<string> {
	const secret = serverEnv.appJwtSharedSecret;
	if (!secret) {
		return sessionToken;
	}

	const cached = mintedTokens.get(sessionToken);
	if (cached && cached.staleAtMs > Date.now()) {
		return cached.token;
	}

	const firebaseUid = decodeSessionToken(sessionToken)?.sub;
	if (!firebaseUid) {
		throw new Error("Session token is missing its subject claim");
	}

	const token = await new SignJWT({ token_version: PAYMENTS_JWT_VERSION })
		.setProtectedHeader({ alg: "HS256" })
		.setSubject(firebaseUid)
		.setIssuer(PAYMENTS_JWT_ISSUER)
		.setAudience(PAYMENTS_JWT_AUDIENCE)
		.setIssuedAt()
		.setExpirationTime(PAYMENTS_JWT_TTL)
		.sign(new TextEncoder().encode(secret));

	if (mintedTokens.size >= MINTED_TOKEN_CACHE_MAX) {
		mintedTokens.clear();
	}
	mintedTokens.set(sessionToken, {
		token,
		staleAtMs: Date.now() + MINTED_TOKEN_REUSE_MS,
	});
	return token;
}

async function forward(req: NextRequest, segments: string[]): Promise<NextResponse> {
	const path = segments.join("/");
	if (!isAllowed(path)) {
		return NextResponse.json({ error: "Not found" }, { status: 404 });
	}

	const token = await readSessionToken();
	if (!token) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}
	if (isExpired(decodeSessionToken(token))) {
		await clearSessionCookie();
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	let paymentsToken: string;
	try {
		paymentsToken = await createPaymentsBearerToken(token);
	} catch (err) {
		return NextResponse.json(
			{ error: err instanceof Error ? err.message : "Unable to authorize payments request" },
			{ status: 502 },
		);
	}

	const search = req.nextUrl.search;
	const url = `${serverEnv.paymentsApiBaseUrl}/api/v1/payments/${path}${search ?? ""}`;
	const init: RequestInit = {
		method: req.method,
		headers: {
			Accept: "application/json",
			Authorization: `Bearer ${paymentsToken}`,
		},
		cache: "no-store",
	};

	if (req.method !== "GET" && req.method !== "HEAD") {
		const body = await req.text();
		if (body) {
			init.body = body;
			(init.headers as Record<string, string>)["Content-Type"] =
				req.headers.get("content-type") ?? "application/json";
		}
	}

	const upstream = await fetch(url, init);
	const text = await upstream.text();
	const contentType = upstream.headers.get("content-type") ?? "application/json";
	return new NextResponse(text, {
		status: upstream.status,
		headers: { "Content-Type": contentType },
	});
}

interface RouteContext {
	params: Promise<{ path: string[] }>;
}

export async function GET(req: NextRequest, ctx: RouteContext): Promise<NextResponse> {
	const { path } = await ctx.params;
	return forward(req, path);
}

export async function POST(req: NextRequest, ctx: RouteContext): Promise<NextResponse> {
	const { path } = await ctx.params;
	return forward(req, path);
}

export async function PATCH(req: NextRequest, ctx: RouteContext): Promise<NextResponse> {
	const { path } = await ctx.params;
	return forward(req, path);
}

export async function DELETE(req: NextRequest, ctx: RouteContext): Promise<NextResponse> {
	const { path } = await ctx.params;
	return forward(req, path);
}
