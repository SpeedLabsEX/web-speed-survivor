"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

import { DepositSubmittedView } from "@/components/deposit/DepositSubmittedView";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";

function ReturnView() {
	const params = useSearchParams();
	const status = params.get("status") ?? "success";

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

	return <DepositSubmittedView />;
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
