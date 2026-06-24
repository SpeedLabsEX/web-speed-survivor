"use client";

import { ActivityItem, type WalletTransactionRow } from "@/components/ActivityItem";
import { BalanceCard } from "@/components/BalanceCard";
import { Alert } from "@/components/ui/Alert";
import { Spinner } from "@/components/ui/Spinner";
import { env } from "@/lib/env";
import {
	balanceCents,
	creditCents,
	withdrawableCents,
	useBalance,
	useTransactions,
} from "@/lib/wallet-hooks";

export default function WalletPage() {
	const balanceQuery = useBalance({ pollMs: 15_000 });
	const txQuery = useTransactions({ limit: 20, pollMs: 30_000 });

	const cents = balanceCents(balanceQuery.data);
	const credit = creditCents(balanceQuery.data);
	const withdrawable = withdrawableCents(balanceQuery.data);
	const txList = (txQuery.data?.transactions ?? []) as WalletTransactionRow[];

	return (
		<div className="flex flex-col gap-12">
			<BalanceCard
				balanceCents={cents}
				creditCents={credit}
				withdrawableCents={withdrawable}
				loading={balanceQuery.isLoading}
				withdrawalsEnabled={env.features.withdrawals}
			/>

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
