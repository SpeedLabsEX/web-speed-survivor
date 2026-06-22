"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import {
	PackagePicker,
	depositPackages,
	type DepositPackage,
} from "@/components/deposit/PackagePicker";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { env } from "@/lib/env";
import { formatBalance } from "@/lib/format";
import { paymentsFetch, type PaymentSessionResponse } from "@/lib/payments-api";

export default function HostedDepositPage() {
	const [selectedPkg, setSelectedPkg] = useState<DepositPackage | null>(
		depositPackages().find((p) => p.id === "p_5000") ??
			depositPackages()[0] ??
			null,
	);
	const [customCents, setCustomCents] = useState<number | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);

	const onContinue = async () => {
		if (!selectedPkg || selectedPkg.cents < 1) {
			setError("Choose an amount.");
			return;
		}
		setError(null);
		setLoading(true);
		try {
			const data = await paymentsFetch<PaymentSessionResponse>("sessions", {
				method: "POST",
				body: JSON.stringify({
					coreTransferId: `web-hosted-deposit:${Date.now()}:${crypto.randomUUID()}`,
					direction: "deposit",
					amountCents: selectedPkg.cents,
					currency: "USD",
					preferredActionType: "redirect",
					returnUrl: `${env.appUrl}/wallet/deposit/return`,
					stateCode: "NY",
					countryCode: "US",
					metadata: {
						packageId: selectedPkg.id,
						itemName: `Speed Survivor Deposit (${selectedPkg.label})`,
						coins: String(selectedPkg.cents),
						bonus: "0",
					},
				}),
			});
			const link = data.action?.url;
			if (!link) {
				throw new Error("Coinflow did not return a checkout link.");
			}
			window.location.assign(link);
		} catch (err) {
			setError(err instanceof Error ? err.message : String(err));
			setLoading(false);
		}
	};

	return (
		<div className="flex flex-col gap-10">
			<div className="flex items-center justify-between">
				<Link
					href="/wallet/deposit"
					className="text-cta flex items-center gap-2 text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
				>
					<ArrowLeft size={14} />
					Embedded checkout
				</Link>
			</div>

			<header>
				<div className="text-eyebrow text-[var(--color-spine)]">
					Add funds · Hosted
				</div>
				<h1 className="text-page-title mt-3 text-[var(--color-text)]">
					Pick an amount
				</h1>
				<p className="mt-3 max-w-xl text-[15px] text-[var(--color-text-muted)]">
					You&apos;ll be sent to Coinflow&apos;s secure checkout and returned
					here when done.
				</p>
			</header>

			{error ? <Alert tone="error">{error}</Alert> : null}

			<PackagePicker
				selectedId={selectedPkg?.id ?? null}
				customCents={customCents}
				onSelect={(p) => {
					setSelectedPkg(p);
					if (p.id !== "custom") setCustomCents(null);
				}}
				onCustomChange={setCustomCents}
				disabled={loading}
			/>

			<div className="flex flex-col gap-4 border-t border-[var(--color-hairline)] pt-6 sm:flex-row sm:items-center sm:justify-between">
				<div className="flex items-baseline gap-3">
					<span className="text-eyebrow text-[var(--color-text-muted)]">
						Total
					</span>
					<span className="text-[28px] font-bold tabular text-[var(--color-text)]">
						{formatBalance(selectedPkg?.cents ?? 0)}
					</span>
				</div>
				<Button
					variant="primary"
					size="lg"
					onClick={onContinue}
					loading={loading}
					disabled={!selectedPkg || selectedPkg.cents < 1 || loading}
					className="sm:min-w-[220px]"
				>
					Continue to Coinflow
				</Button>
			</div>
		</div>
	);
}
