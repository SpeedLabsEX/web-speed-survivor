"use client";

import { ArrowUpRight, Plus } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { cn } from "@/lib/cn";
import { formatBalance } from "@/lib/format";

interface BalanceCardProps {
	balanceCents: number | null;
	creditCents?: number | null;
	withdrawableCents?: number | null;
	loading?: boolean;
	withdrawalsEnabled?: boolean;
	className?: string;
}

/**
 * The signature module of the wallet. Eyebrow → big number → hairline →
 * action row. The number does the work; the chrome stays out of the way.
 */
export function BalanceCard({
	balanceCents,
	creditCents,
	withdrawableCents,
	loading,
	withdrawalsEnabled = false,
	className,
}: BalanceCardProps) {
	const hasCredit = (creditCents ?? 0) > 0;
	return (
		<section
			className={cn(
				"rounded-[var(--radius-panel)] bg-[var(--color-panel)] p-8 sm:p-10",
				"border border-[var(--color-hairline)]",
				"shadow-[0_8px_32px_rgba(0,0,0,0.4)]",
				className,
			)}
		>
			<div className="text-eyebrow">Balance</div>

			<div className="mt-4 mb-8">
				{loading && balanceCents === null ? (
					<div className="flex h-[72px] items-center">
						<Spinner size={28} />
					</div>
				) : (
					<div className="text-bignum text-[var(--color-text)]">
						{formatBalance(balanceCents ?? 0)}
					</div>
				)}
				{hasCredit ? (
					<div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px]">
						<span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-accent-soft,rgba(0,229,155,0.12))] px-2.5 py-1 font-semibold text-[var(--color-accent,#00e59b)]">
							{formatBalance(creditCents ?? 0)} credit
						</span>
						<span className="text-[var(--color-text-muted)]">
							{formatBalance(withdrawableCents ?? balanceCents ?? 0)} withdrawable
						</span>
					</div>
				) : null}
			</div>

			{hasCredit ? (
				<p className="-mt-4 mb-6 text-[12px] text-[var(--color-text-muted)]">
					Credit can be used to play but can&apos;t be withdrawn.
				</p>
			) : null}

			<div className="h-px w-full bg-[var(--color-hairline)]" />

			<div className="mt-6 flex flex-col gap-3 sm:flex-row">
				<Link href="/wallet/deposit" className="flex-1">
					<Button variant="primary" size="lg" className="w-full">
						<Plus size={18} aria-hidden />
						Add Funds
					</Button>
				</Link>
				<Link href="/wallet/withdraw" className="flex-1">
					<Button variant="ghost" size="lg" className="w-full">
						<ArrowUpRight size={18} aria-hidden />
						{withdrawalsEnabled ? "Withdraw" : "Withdraw"}
					</Button>
				</Link>
			</div>
		</section>
	);
}
