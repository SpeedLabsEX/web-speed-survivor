"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";

import { WithdrawFlow } from "@/components/withdraw/WithdrawFlow";
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
				<h1 className="text-display text-[var(--color-text)]">
					Withdrawals
					<br />
					are next.
				</h1>
			</header>

			<Link href="/wallet">
				<Button variant="ghost" size="lg" className="self-start">
					Back to wallet
				</Button>
			</Link>
		</div>
	);
}
