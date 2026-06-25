import { ArrowDownLeft, ArrowUpRight } from "lucide-react";

import { cn } from "@/lib/cn";
import { formatBalance, formatRelativeTime } from "@/lib/format";

export type WalletTransactionType = "deposit" | "withdrawal" | string;

export interface WalletTransactionRow {
	type: WalletTransactionType;
	amount: number | string;
	source?: string | null;
	provider?: string | null;
	description?: string | null;
	created_at?: string | null;
	createdAt?: string | null;
	timestamp?: string | null;
	status?: string | null;
	metadata?: Record<string, unknown> | null;
}

interface ActivityItemProps {
	txn: WalletTransactionRow;
	nowMs?: number;
}

/**
 * Single horizontal HUD row inside the activity panel. Icon-circle → title +
 * relative time → signed amount right-aligned with tabular numerals.
 * Credit = spine, debit = risk, with both color and a sign.
 */
export function ActivityItem({ txn, nowMs }: ActivityItemProps) {
	const isCredit = txn.type === "deposit";
	const sign = isCredit ? "+" : txn.type === "withdrawal" ? "−" : "";
	const amount = formatBalance(txn.amount);
	const status = normalizeStatus(txn.status, txn.type);
	const title = txn.description ?? titleFor(txn.type, status, txn.source);
	const source = labelFor(txn.provider ?? txn.source);
	const createdAt = walletTransactionTimestamp(txn);

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
				<div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1">
					<span className="text-eyebrow text-[10px] tracking-[0.16em]">
						{formatRelativeTime(createdAt, nowMs)}
					</span>
					{source ? (
						<span className="text-eyebrow text-[10px] tracking-[0.16em] text-[var(--color-text-dim)]">
							{source}
						</span>
					) : null}
					<StatusPill status={status} />
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

export function walletTransactionTimestamp(txn: WalletTransactionRow): string | null {
	return txn.created_at ?? txn.createdAt ?? txn.timestamp ?? null;
}

function normalizeStatus(status: string | null | undefined, type: string): string {
	const raw = (status ?? "").toLowerCase();
	if (!raw) return type === "deposit" ? "settled" : "settled";
	if (raw === "succeeded") return "settled";
	if (raw === "unknown" && type === "deposit") return "pending";
	return raw;
}

function titleFor(type: string, status: string, source?: string | null): string {
	const label = statusLabel(status).toLowerCase();
	if (type === "deposit") {
		return status === "settled" ? "Deposit" : `Deposit ${label}`;
	}
	if (type === "withdrawal") {
		if (source === "deposit_reversal") {
			return status === "settled" ? "Deposit reversal" : `Deposit reversal ${label}`;
		}
		return status === "settled" ? "Withdrawal" : `Withdrawal ${label}`;
	}
	return "Transaction";
}

function labelFor(value: string | null | undefined): string | null {
	if (!value) return null;
	return value
		.split(/[_\s-]+/)
		.filter(Boolean)
		.map((part) => part.charAt(0).toUpperCase() + part.slice(1))
		.join(" ");
}

function statusLabel(status: string): string {
	if (status === "settled") return "Settled";
	if (status === "credit_pending") return "Credit Pending";
	if (status === "processing" || status === "pending") return "Pending";
	if (status === "action_required") return "Action Required";
	if (status === "failed") return "Failed";
	if (status === "canceled" || status === "cancelled") return "Canceled";
	if (status === "expired") return "Expired";
	return "Pending";
}

function StatusPill({ status }: { status: string }) {
	const tone =
		status === "settled"
			? "border-[var(--color-spine)]/40 bg-[var(--color-spine-soft)] text-[var(--color-spine)]"
			: status === "failed" || status === "canceled" || status === "cancelled" || status === "expired"
				? "border-[var(--color-risk)]/40 bg-[var(--color-risk-soft)] text-[var(--color-risk)]"
				: "border-[var(--color-hairline-2)] bg-[var(--color-panel-2)] text-[var(--color-text-muted)]";

	return (
		<span
			className={cn(
				"rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em]",
				tone,
			)}
		>
			{statusLabel(status)}
		</span>
	);
}
