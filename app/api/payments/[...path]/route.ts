import { NextResponse, type NextRequest } from "next/server";
import { SignJWT } from "jose";

import { callApi, ApiError } from "@/lib/apiClient";
import type { MeResponse } from "@/lib/api-types";
import { serverEnv } from "@/lib/env";
import { clearSessionCookie, readSessionToken } from "@/lib/session";

const ALLOWED_PREFIXES = ["sessions", "withdrawals", "reconciliation"];
const PAYMENTS_JWT_ISSUER = "speed-labs-api";
const PAYMENTS_JWT_AUDIENCE = "speed-mobile-app";
const PAYMENTS_JWT_VERSION = 2;

function isAllowed(path: string): boolean {
	return ALLOWED_PREFIXES.some((prefix) => path === prefix || path.startsWith(`${prefix}/`));
}

async function createPaymentsBearerToken(sessionToken: string): Promise<string> {
	const secret = serverEnv.appJwtSharedSecret;
	if (!secret) {
		return sessionToken;
	}

	const me = await callApi<MeResponse>("/api/v1/me", { token: sessionToken });
	const firebaseUid = me.account.firebase_uid;
	if (!firebaseUid) {
		throw new Error("Account is missing Firebase UID");
	}

	return new SignJWT({
		token_version: PAYMENTS_JWT_VERSION,
		account_uuid: me.account.account_uuid,
	})
		.setProtectedHeader({ alg: "HS256" })
		.setSubject(firebaseUid)
		.setIssuer(PAYMENTS_JWT_ISSUER)
		.setAudience(PAYMENTS_JWT_AUDIENCE)
		.setIssuedAt()
		.setExpirationTime("5m")
		.sign(new TextEncoder().encode(secret));
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

	let paymentsToken: string;
	try {
		paymentsToken = await createPaymentsBearerToken(token);
	} catch (err) {
		if (err instanceof ApiError && err.status === 401) {
			await clearSessionCookie();
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}
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
