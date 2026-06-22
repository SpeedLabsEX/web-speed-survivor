import { NextResponse, type NextRequest } from "next/server";

import { serverEnv } from "@/lib/env";
import { clearSessionCookie, readSessionToken } from "@/lib/session";

const ALLOWED_PREFIXES = ["sessions", "withdrawals"];

function isAllowed(path: string): boolean {
	return ALLOWED_PREFIXES.some((prefix) => path === prefix || path.startsWith(`${prefix}/`));
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
	const url = `${serverEnv.paymentsApiBaseUrl}/api/v1/payments/${path}${search ?? ""}`;
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
