"use client";

import { useEffect } from "react";

import { storePendingReferralCode } from "@/lib/referral";

interface ReferralCaptureProps {
	// Optional explicit code (e.g. from an /invite/<code> route param).
	code?: string;
}

/**
 * Captures a referral code from the current URL (?ref= / ?code= /
 * ?referral=) or an explicit prop, and stashes it in localStorage so it can
 * be attached after the visitor signs in. Renders nothing.
 */
export function ReferralCapture({ code }: ReferralCaptureProps) {
	useEffect(() => {
		if (code) {
			storePendingReferralCode(code);
			return;
		}
		try {
			const params = new URLSearchParams(window.location.search);
			const fromQuery = params.get("ref") ?? params.get("code") ?? params.get("referral");
			storePendingReferralCode(fromQuery);
		} catch {
			// ignore
		}
	}, [code]);

	return null;
}
