"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";

import { ActivityItem, type WalletTransactionRow } from "@/components/ActivityItem";
import { BalanceCard } from "@/components/BalanceCard";
import { Alert } from "@/components/ui/Alert";
import { Spinner } from "@/components/ui/Spinner";
import { env } from "@/lib/env";
import { formatBalance } from "@/lib/format";
import { paymentsFetch, type PaymentReconciliationResponse } from "@/lib/payments-api";
import {
	balanceCents,
	creditCents,
	useBalance,
	useTransactions,
	withdrawableCents,
} from "@/lib/wallet-hooks";

function WalletView() {
	const params = useSearchParams();
	const queryClient = useQueryClient();
	const balanceQuery = useBalance({ pollMs: 15_000 });
	const txQuery = useTransactions({ limit: 20, pollMs: 30_000 });

	const cents = balanceCents(balanceQuery.data);
	const credit = creditCents(balanceQuery.data);
	const withdrawable = withdrawableCents(balanceQuery.data);
	const txList = (txQuery.data?.transactions ?? txQuery.data?.data ?? []) as WalletTransactionRow[];
	const withdrawalStatus = params.get("withdrawal");
	const withdrawalAmountCents = parseOptionalCents(params.get("amountCents"));
	const withdrawalNotice = withdrawalStatus
		? withdrawalNoticeFor(withdrawalStatus, withdrawalAmountCents)
		: null;

	useEffect(() => {
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
				withdrawalsEnabled={env.features.withdrawals}
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
				<div className="mb-4 flex items-baseline justify-between">
					<h2 className="text-section text-[var(--color-text-muted)]">
						Recent activity
					</h2>
					{txQuery.isFetching ? (
						<span className="text-eyebrow text-[10px]">Updating</span>
					) : null}
				</div>

				<div className="rounded-[var(--radius-panel)] bg-[var(--color-panel)] border border-[var(--color-hairline)]">
					{txQuery.isLoading ? (
						<div className="flex items-center justify-center py-12">
							<Spinner size={20} />
						</div>
					) : txList.length === 0 ? (
						<EmptyActivity />
					) : (
						<div>
							{txList.map((txn, idx) => (
								<ActivityItem key={`${txn.created_at}-${idx}`} txn={txn} />
							))}
						</div>
					)}
				</div>
			</section>
		</div>
	);
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

function EmptyActivity() {
	return (
		<div className="px-6 py-16 text-center">
			<div className="text-eyebrow text-[var(--color-text-dim)]">
				No activity yet
			</div>
			<p className="mt-3 text-[15px] text-[var(--color-text-muted)]">
				Your deposits and withdrawals show up here.
			</p>
		</div>
	);
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
			message: `${amount} could not be started. Funds are still available in your wallet.`,
		};
	}
	if (status === "unknown") {
		return {
			tone: "info",
			message: `${amount} is being checked. Recent activity will update when the provider confirms the status.`,
		};
	}
	return {
		tone: "success",
		message: `${amount} submitted. Funds are reserved now and the status appears in Recent activity.`,
	};
}
