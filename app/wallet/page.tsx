"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

import {
	ActivityItem,
	type WalletTransactionRow,
	walletTransactionTimestamp,
} from "@/components/ActivityItem";
import { BalanceCard } from "@/components/BalanceCard";
import { Alert } from "@/components/ui/Alert";
import { Skeleton } from "@/components/ui/Skeleton";
import { Spinner } from "@/components/ui/Spinner";
import { formatBalance } from "@/lib/format";
import { paymentsFetch, type PaymentReconciliationResponse } from "@/lib/payments-api";
import {
	balanceCents,
	creditCents,
	useBalance,
	useTransactions,
	withdrawableCents,
} from "@/lib/wallet-hooks";

const RECONCILE_MIN_INTERVAL_MS = 60_000;
let lastReconcileAtMs = 0;

function WalletView() {
	const params = useSearchParams();
	const queryClient = useQueryClient();
	const activityNowMs = useNow(30_000);
	const balanceQuery = useBalance({ pollMs: 15_000 });
	const txQuery = useTransactions({ limit: 20, pollMs: 30_000 });

	const cents = balanceCents(balanceQuery.data);
	const credit = creditCents(balanceQuery.data);
	const withdrawable = withdrawableCents(balanceQuery.data);
	const txList = ((txQuery.data?.transactions ?? txQuery.data?.data ?? []) as WalletTransactionRow[])
		.filter(isVisibleWalletActivity);
	const withdrawalStatus = params.get("withdrawal");
	const withdrawalAmountCents = parseOptionalCents(params.get("amountCents"));
	const withdrawalNotice = withdrawalStatus
		? withdrawalNoticeFor(withdrawalStatus, withdrawalAmountCents)
		: null;

	useEffect(() => {
		// Freshness sweep on the payments API. Once per minute is plenty —
		// without the guard every wallet ⇄ deposit navigation fired another
		// sweep on top of the normal 15s/30s polling.
		if (Date.now() - lastReconcileAtMs < RECONCILE_MIN_INTERVAL_MS) return;
		lastReconcileAtMs = Date.now();

		let cancelled = false;
		void paymentsFetch<PaymentReconciliationResponse>("reconciliation", {
			method: "POST",
		})
			.then((result) => {
				if (
					cancelled ||
					(result.processed === 0 && result.staleWithdrawalsFailed === 0)
				) {
					return;
				}
				void queryClient.invalidateQueries({ queryKey: ["wallet", "balance"] });
				void queryClient.invalidateQueries({ queryKey: ["wallet", "transactions"] });
			})
			.catch(() => {
				// Best-effort freshness pass; normal wallet polling still runs.
			});
		return () => {
			cancelled = true;
		};
	}, [queryClient]);

	return (
		<div className="flex flex-col gap-12">
			<BalanceCard
				balanceCents={cents}
				creditCents={credit}
				withdrawableCents={withdrawable}
				loading={balanceQuery.isLoading}
			/>

			{withdrawalNotice ? (
				<Alert tone={withdrawalNotice.tone}>
					{withdrawalNotice.message}
				</Alert>
			) : null}

			{balanceQuery.isError ? (
				<Alert tone="error">
					Could not load your balance. Refresh and try again.
				</Alert>
			) : null}

			<section>
				<h2 className="text-section mb-4 text-[var(--color-text-muted)]">
					Activity
				</h2>

				<div className="rounded-[var(--radius-panel)] bg-[var(--color-panel)] border border-[var(--color-hairline)]">
					{txQuery.isLoading ? (
						<ActivitySkeleton />
					) : txList.length === 0 ? (
						<EmptyActivity />
					) : (
						<div>
							{txList.map((txn, idx) => (
								<ActivityItem
									key={`${walletTransactionTimestamp(txn) ?? "txn"}-${idx}`}
									txn={txn}
									nowMs={activityNowMs}
								/>
							))}
						</div>
					)}
				</div>
			</section>
		</div>
	);
}

function useNow(intervalMs: number): number {
	const [now, setNow] = useState(() => Date.now());

	useEffect(() => {
		const timer = window.setInterval(() => {
			setNow(Date.now());
		}, intervalMs);
		return () => window.clearInterval(timer);
	}, [intervalMs]);

	return now;
}

export default function WalletPage() {
	return (
		<Suspense
			fallback={
				<div className="flex min-h-[40vh] items-center justify-center">
					<Spinner size={28} />
				</div>
			}
		>
			<WalletView />
		</Suspense>
	);
}

function ActivitySkeleton() {
	return (
		<div>
			{[0, 1, 2].map((i) => (
				<div
					key={i}
					className="flex items-center gap-4 border-b border-[var(--color-hairline)] px-5 py-4 last:border-b-0"
				>
					<Skeleton className="h-9 w-9 shrink-0 rounded-full" />
					<div className="min-w-0 flex-1">
						<Skeleton className="h-4 w-32 max-w-full" />
						<Skeleton className="mt-2 h-3 w-20" />
					</div>
					<Skeleton className="h-4 w-16" />
				</div>
			))}
		</div>
	);
}

function EmptyActivity() {
	return (
		<div className="px-6 py-16 text-center">
			<div className="text-eyebrow text-[var(--color-text-dim)]">
				No activity yet
			</div>
		</div>
	);
}

function isVisibleWalletActivity(txn: WalletTransactionRow): boolean {
	const status = (txn.status ?? "").toLowerCase();
	return !(txn.type === "deposit" && status === "action_required");
}

function parseOptionalCents(value: string | null): number | null {
	if (!value) return null;
	const parsed = Number.parseInt(value, 10);
	return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

function withdrawalNoticeFor(
	status: string,
	amountCents: number | null,
): { tone: "success" | "error" | "info"; message: string } {
	const amount = amountCents === null ? "Your withdrawal" : `${formatBalance(amountCents)} withdrawal`;
	if (status === "failed" || status === "canceled" || status === "expired") {
		return {
			tone: "error",
			message: `${amount} couldn't be started — funds are still in your wallet.`,
		};
	}
	if (status === "unknown") {
		return {
			tone: "info",
			message: `${amount} is being confirmed.`,
		};
	}
	return {
		tone: "success",
		message: `${amount} submitted — track it in recent activity.`,
	};
}
