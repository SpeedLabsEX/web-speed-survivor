"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";

import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { env } from "@/lib/env";

export default function WithdrawPage() {
	if (!env.features.withdrawals) {
		return <ComingSoon />;
	}
	return <WithdrawFlow />;
}

function ComingSoon() {
	return (
		<div className="flex flex-col gap-10">
			<Link
				href="/wallet"
				className="text-cta flex items-center gap-2 text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
			>
				<ArrowLeft size={14} />
				Wallet
			</Link>

			<header>
				<div className="text-eyebrow text-[var(--color-text-muted)]">
					Phase 2
				</div>
				<h1 className="text-display mt-3 text-[var(--color-text)]">
					Withdrawals
					<br />
					are next.
				</h1>
				<p className="mt-6 max-w-xl text-[15px] leading-relaxed text-[var(--color-text-muted)]">
					Cash out via instant push-to-card, Same-Day ACH, or Standard ACH.
					KYC verification, bank linking, and the API plumbing are in flight.
				</p>
			</header>

			<Link href="/wallet">
				<Button variant="ghost" size="lg" className="self-start">
					Back to wallet
				</Button>
			</Link>
		</div>
	);
}

function WithdrawFlow() {
	return (
		<div className="flex flex-col gap-10">
			<Link
				href="/wallet"
				className="text-cta flex items-center gap-2 text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
			>
				<ArrowLeft size={14} />
				Wallet
			</Link>

			<header>
				<div className="text-eyebrow text-[var(--color-spine)]">Withdraw</div>
				<h1 className="text-page-title mt-3 text-[var(--color-text)]">
					Choose a destination
				</h1>
			</header>

			<Alert tone="warning">
				Feature flag is on but the underlying API is not yet live. See
				<code className="ml-1 font-mono text-[13px]">
					docs/withdrawals.md
				</code>
				.
			</Alert>
		</div>
	);
}
