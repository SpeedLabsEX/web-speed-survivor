"use client";

import { useRouter } from "next/navigation";
import { use, useEffect } from "react";

import { Wordmark } from "@/components/Wordmark";
import { Spinner } from "@/components/ui/Spinner";
import { useAuth } from "@/lib/auth-context";
import { storePendingReferralCode } from "@/lib/referral";

/**
 * Invite landing page. Stores the referral code, then routes the visitor to
 * the wallet (which attaches the code once they're signed in) or to login.
 */
export default function InvitePage({
	params,
}: {
	params: Promise<{ code: string }>;
}) {
	const { code } = use(params);
	const router = useRouter();
	const { status } = useAuth();

	useEffect(() => {
		storePendingReferralCode(code);
	}, [code]);

	useEffect(() => {
		if (status === "loading") return;
		if (status === "authenticated") {
			router.replace("/wallet");
		} else {
			router.replace("/login?next=/wallet");
		}
	}, [status, router]);

	return (
		<main className="flex min-h-screen flex-col items-center justify-center gap-6 px-6 text-center">
			<Wordmark size="lg" />
			<p className="max-w-sm text-[15px] text-[var(--color-text-muted)]">
				You&apos;ve been invited to Speed Survivor. Deposit $10 or more and
				you&apos;ll both get $15 in credit.
			</p>
			<Spinner size={24} />
		</main>
	);
}
