"use client";

import { useEffect, useRef } from "react";

import { useAuth } from "@/lib/auth-context";
import {
	attachReferralCode,
	clearPendingReferralCode,
	getPendingReferralCode,
} from "@/lib/referral";

/**
 * Mount once inside an authenticated area. When a pending referral code exists
 * (captured from an invite link before the user signed in), attach it to the
 * account. The API validates that the user isn't already referred and hasn't
 * deposited yet, so this is safe to fire on every authenticated load.
 */
export function ReferralAttacher() {
	const { status } = useAuth();
	const attempted = useRef(false);

	useEffect(() => {
		if (status !== "authenticated" || attempted.current) return;
		const code = getPendingReferralCode();
		if (!code) return;
		attempted.current = true;
		attachReferralCode(code)
			.then(() => clearPendingReferralCode())
			.catch(() => {
				// Leave the pending code for a later retry on transient failures.
			});
	}, [status]);

	return null;
}
