"use client";

import { ArrowUpRight, Plus } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { cn } from "@/lib/cn";
import { formatBalance } from "@/lib/format";

interface BalanceCardProps {
	balanceCents: number | null;
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
	loading,
	withdrawalsEnabled = false,
	className,
}: BalanceCardProps) {
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
			</div>

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
