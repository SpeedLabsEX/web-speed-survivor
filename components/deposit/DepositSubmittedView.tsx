"use client";

import { useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/Button";

const REDIRECT_DELAY_SECONDS = 5;

export function DepositSubmittedView() {
	const router = useRouter();
	const queryClient = useQueryClient();
	const [secondsRemaining, setSecondsRemaining] = useState(
		REDIRECT_DELAY_SECONDS,
	);

	useEffect(() => {
		// Refresh opportunistically; the webhook remains authoritative and the
		// wallet page continues polling after this short acknowledgement screen.
		void queryClient.invalidateQueries({ queryKey: ["wallet", "balance"] });
		void queryClient.invalidateQueries({
			queryKey: ["wallet", "transactions"],
		});

		const countdown = window.setInterval(() => {
			setSecondsRemaining((current) => Math.max(0, current - 1));
		}, 1_000);
		const redirect = window.setTimeout(() => {
			router.replace("/wallet");
		}, REDIRECT_DELAY_SECONDS * 1_000);

		return () => {
			window.clearInterval(countdown);
			window.clearTimeout(redirect);
		};
	}, [queryClient, router]);

	return (
		<div className="flex min-h-[60vh] flex-col items-start justify-center gap-6">
			<div className="text-eyebrow flex items-center gap-3 text-[var(--color-spine)]">
				<span aria-hidden>●</span>
				Deposit submitted
			</div>

			<h1 className="text-display text-[var(--color-text)]">
				Funds
				<br />
				en route.
			</h1>

			<p className="max-w-md text-[15px] text-[var(--color-text-muted)]">
				Your deposit is processing. We&apos;ll notify you when the funds arrive.
			</p>

			<p
				aria-live="polite"
				className="text-eyebrow text-[var(--color-text-muted)]"
			>
				Redirecting in {secondsRemaining}s
			</p>

			<Link href="/wallet" className="mt-2">
				<Button variant="primary" size="lg">
					Back to wallet
				</Button>
			</Link>
		</div>
	);
}
