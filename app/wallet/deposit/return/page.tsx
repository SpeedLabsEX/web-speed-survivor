"use client";

import { useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { formatBalance } from "@/lib/format";
import { balanceCents, useBalance } from "@/lib/wallet-hooks";

const POLL_TIMEOUT_MS = 60_000;
const POLL_INTERVAL_MS = 3_000;
type CreditState = "waiting" | "credited" | "pending";

function ReturnView() {
	const params = useSearchParams();
	const queryClient = useQueryClient();
	const balanceQuery = useBalance({ pollMs: 5_000 });
	const status = params.get("status") ?? "success";

	const [creditState, setCreditState] = useState<CreditState>("waiting");
	const [startBalance] = useState<number | null>(() =>
		balanceCents(balanceQuery.data),
	);

	useEffect(() => {
		if (status !== "success" || creditState !== "waiting") return;
		const start = Date.now();
		let cancelled = false;
		const tick = async () => {
			while (!cancelled) {
				await queryClient.invalidateQueries({ queryKey: ["wallet", "balance"] });
				await queryClient.invalidateQueries({
					queryKey: ["wallet", "transactions"],
				});
				const next = balanceCents(
					queryClient.getQueryData(["wallet", "balance"]),
				);
				if (next !== null && startBalance !== null && next > startBalance) {
					setCreditState("credited");
					return;
				}
				if (Date.now() - start > POLL_TIMEOUT_MS) {
					setCreditState("pending");
					return;
				}
				await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
			}
		};
		void tick();
		return () => {
			cancelled = true;
		};
	}, [status, creditState, queryClient, startBalance]);

	if (status === "cancel") {
		return (
			<div className="flex min-h-[60vh] flex-col items-start justify-center gap-6">
				<div className="text-eyebrow text-[var(--color-text-muted)]">
					Cancelled
				</div>
				<h1 className="text-display text-[var(--color-text)]">
					No charges
					<br />
					were made.
				</h1>
				<Alert tone="info">
					Checkout was cancelled. You can try again any time.
				</Alert>
				<div className="mt-2 flex gap-3">
					<Link href="/wallet/deposit">
						<Button variant="primary" size="lg">
							Try again
						</Button>
					</Link>
					<Link href="/wallet">
						<Button variant="ghost" size="lg">
							Back to wallet
						</Button>
					</Link>
				</div>
			</div>
		);
	}

	const cents = balanceCents(balanceQuery.data);
	const waiting = creditState === "waiting";
	const credited = creditState === "credited";

	return (
		<div className="flex min-h-[60vh] flex-col items-start justify-center gap-6">
			<div className="text-eyebrow text-[var(--color-spine)] flex items-center gap-3">
				{waiting ? <Spinner size={12} /> : <span aria-hidden>●</span>}
				{waiting ? "Crediting" : credited ? "Complete" : "Pending"}
			</div>

			<h1 className="text-display text-[var(--color-text)]">
				{credited ? (
					<>
						Funds
						<br />
						added.
					</>
				) : (
					<>
						Funds
						<br />
						en route.
					</>
				)}
			</h1>

			{credited && cents !== null ? (
				<div>
					<div className="text-eyebrow text-[var(--color-text-muted)]">
						New balance
					</div>
					<div className="text-bignum mt-3 text-[var(--color-text)]">
						{formatBalance(cents)}
					</div>
				</div>
			) : (
				<p className="max-w-md text-[15px] text-[var(--color-text-muted)]">
					{waiting
						? "Coinflow confirmed your payment. We're waiting for the wallet credit to land."
						: "ACH bank deposits can take longer to settle. Your balance updates once Coinflow sends the settlement webhook."}
				</p>
			)}

			<Link href="/wallet" className="mt-2">
				<Button variant="primary" size="lg">
					Back to wallet
				</Button>
			</Link>
		</div>
	);
}

export default function DepositReturnPage() {
	return (
		<Suspense
			fallback={
				<div className="flex min-h-[40vh] items-center justify-center">
					<Spinner size={28} />
				</div>
			}
		>
			<ReturnView />
		</Suspense>
	);
}
