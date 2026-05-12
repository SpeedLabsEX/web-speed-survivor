/**
 * Session cookie helpers — server-only.
 *
 * The httpOnly `sps_jwt` cookie holds the app JWT minted by
 * api-speed-survivor's POST /api/v1/auth/login. We never read it from the
 * browser; instead, the browser forwards calls through this app's route
 * handlers (or our /api/proxy/* helper) so the cookie travels server-side.
 */

import { cookies } from "next/headers";
import { decodeJwt } from "jose";

export const SESSION_COOKIE = "sps_jwt";
const ONE_DAY_SECONDS = 60 * 60 * 24;

interface CookieOpts {
	maxAgeSeconds?: number;
}

export async function setSessionCookie(token: string, opts: CookieOpts = {}): Promise<void> {
	const store = await cookies();
	store.set(SESSION_COOKIE, token, {
		httpOnly: true,
		sameSite: "lax",
		secure: process.env.NODE_ENV === "production",
		path: "/",
		maxAge: opts.maxAgeSeconds ?? ONE_DAY_SECONDS,
	});
}

export async function clearSessionCookie(): Promise<void> {
	const store = await cookies();
	store.delete(SESSION_COOKIE);
}

export async function readSessionToken(): Promise<string | null> {
	const store = await cookies();
	return store.get(SESSION_COOKIE)?.value ?? null;
}

export interface SessionClaims {
	sub: string;
	username?: string;
	exp?: number;
	[key: string]: unknown;
}

/**
 * Decode the JWT payload WITHOUT verifying the signature. We do not have the
 * shared secret on the web app, and api-speed-survivor verifies on every
 * request. This is purely so server components can show the user's email
 * and detect obvious expiration before making a network call.
 */
export function decodeSessionToken(token: string): SessionClaims | null {
	try {
		return decodeJwt(token) as SessionClaims;
	} catch {
		return null;
	}
}

export function isExpired(claims: SessionClaims | null): boolean {
	if (!claims?.exp) return false;
	return Date.now() >= claims.exp * 1000;
}
