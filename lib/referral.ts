"use client";

import type { AttachReferralResponse } from "./api-types";

const PENDING_KEY = "speed_pending_referral_code";
const CODE_PATTERN = /^[A-Za-z0-9_-]{4,64}$/;

/** Normalize/validate a raw referral code. Returns null when invalid. */
export function sanitizeReferralCode(raw: string | null | undefined): string | null {
	if (!raw) return null;
	const trimmed = raw.trim();
	if (!CODE_PATTERN.test(trimmed)) return null;
	return trimmed.toUpperCase();
}

/** Persist a pending referral code (first code wins, survives until attached). */
export function storePendingReferralCode(raw: string | null | undefined): void {
	if (typeof window === "undefined") return;
	const code = sanitizeReferralCode(raw);
	if (!code) return;
	try {
		if (window.localStorage.getItem(PENDING_KEY)) return;
		window.localStorage.setItem(PENDING_KEY, code);
	} catch {
		// ignore storage failures (private mode, etc.)
	}
}

export function getPendingReferralCode(): string | null {
	if (typeof window === "undefined") return null;
	try {
		return window.localStorage.getItem(PENDING_KEY);
	} catch {
		return null;
	}
}

export function clearPendingReferralCode(): void {
	if (typeof window === "undefined") return;
	try {
		window.localStorage.removeItem(PENDING_KEY);
	} catch {
		// ignore
	}
}

/** Attach the given code to the signed-in user via the authenticated proxy. */
export async function attachReferralCode(code: string): Promise<AttachReferralResponse> {
	const res = await fetch("/api/proxy/api/v1/referrals/attach", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		credentials: "same-origin",
		body: JSON.stringify({ code }),
	});
	const text = await res.text();
	const parsed = (text ? JSON.parse(text) : {}) as AttachReferralResponse;
	if (!res.ok) {
		throw new Error(parsed?.message || `Request failed (${res.status})`);
	}
	return parsed;
}
