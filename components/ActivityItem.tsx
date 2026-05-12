import { ArrowDownLeft, ArrowUpRight } from "lucide-react";

import { cn } from "@/lib/cn";
import { formatBalance, formatRelativeTime } from "@/lib/format";

export type WalletTransactionType = "deposit" | "withdrawal" | string;

export interface WalletTransactionRow {
	type: WalletTransactionType;
	amount: number | string;
	description?: string | null;
	created_at: string;
}

interface ActivityItemProps {
	txn: WalletTransactionRow;
}

/**
 * Single horizontal HUD row inside the activity panel. Icon-circle → title +
 * relative time → signed amount right-aligned with tabular numerals.
 * Credit = spine, debit = risk, with both color and a sign.
 */
export function ActivityItem({ txn }: ActivityItemProps) {
	const isCredit = txn.type === "deposit";
	const sign = isCredit ? "+" : txn.type === "withdrawal" ? "−" : "";
	const amount = formatBalance(txn.amount);
	const title = txn.description ?? (isCredit ? "Deposit" : "Withdrawal");

	return (
		<div className="flex items-center gap-4 border-b border-[var(--color-hairline)] px-5 py-4 last:border-b-0">
			<div
				className={cn(
					"flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
					isCredit
						? "bg-[var(--color-spine-soft)] text-[var(--color-spine)]"
						: "bg-[var(--color-risk-soft)] text-[var(--color-risk)]",
				)}
				aria-hidden
			>
				{isCredit ? <ArrowDownLeft size={16} /> : <ArrowUpRight size={16} />}
			</div>

			<div className="min-w-0 flex-1">
				<div className="truncate text-[15px] font-semibold text-[var(--color-text)]">
					{title}
				</div>
				<div className="text-eyebrow mt-1.5 text-[10px] tracking-[0.16em]">
					{formatRelativeTime(txn.created_at)}
				</div>
			</div>

			<div
				className={cn(
					"text-[15px] font-bold tabular",
					isCredit ? "text-[var(--color-spine)]" : "text-[var(--color-risk)]",
				)}
			>
				{sign}
				{amount}
			</div>
		</div>
	);
}
