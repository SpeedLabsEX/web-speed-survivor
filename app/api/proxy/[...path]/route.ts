import { NextResponse, type NextRequest } from "next/server";

import { env } from "@/lib/env";
import { readSessionToken, clearSessionCookie } from "@/lib/session";

/**
 * Generic authenticated proxy to api-speed-survivor.
 *
 * The browser cannot read our httpOnly JWT cookie, so it calls
 * /api/proxy/<path> on this app and we forward to api-speed-survivor with
 * the Authorization header attached. We only allow a small allowlist of
 * paths to avoid turning this into an open relay.
 */

const ALLOWED_PREFIXES = ["api/v1/wallet/", "api/v1/me"];

function isAllowed(path: string): boolean {
	return ALLOWED_PREFIXES.some((p) => path === p || path.startsWith(p));
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

	const search = req.nextUrl.search;
	const url = `${env.apiBaseUrl}/${path}${search ?? ""}`;

	const init: RequestInit = {
		method: req.method,
		headers: {
			Accept: "application/json",
			Authorization: `Bearer ${token}`,
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

	if (upstream.status === 401) {
		await clearSessionCookie();
	}

	const text = await upstream.text();
	const contentType =
		upstream.headers.get("content-type") ?? "application/json";

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
