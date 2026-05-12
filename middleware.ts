import { NextResponse, type NextRequest } from "next/server";

import { SESSION_COOKIE } from "@/lib/session";

const PROTECTED_PREFIXES = ["/wallet"];

export function middleware(req: NextRequest) {
	const { pathname, search } = req.nextUrl;

	const needsAuth = PROTECTED_PREFIXES.some(
		(p) => pathname === p || pathname.startsWith(`${p}/`),
	);
	if (!needsAuth) return NextResponse.next();

	const hasToken = req.cookies.get(SESSION_COOKIE)?.value;
	if (hasToken) return NextResponse.next();

	const loginUrl = new URL("/login", req.url);
	loginUrl.searchParams.set("next", `${pathname}${search}`);
	return NextResponse.redirect(loginUrl);
}

export const config = {
	matcher: ["/wallet/:path*"],
};
