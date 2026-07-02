"use client";

import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { preconnect } from "react-dom";

import {
	PackagePicker,
	depositPackages,
	type DepositPackage,
} from "@/components/deposit/PackagePicker";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { env } from "@/lib/env";
import { formatBalance } from "@/lib/format";
import { paymentsFetch, type PaymentSessionResponse } from "@/lib/payments-api";
import { balanceCents, useBalance } from "@/lib/wallet-hooks";

const CoinflowEmbed = dynamic(
	() => import("@/components/deposit/CoinflowEmbed").then((m) => m.CoinflowEmbed),
	{
		ssr: false,
		// Same 520px floor as MIN_EMBED_HEIGHT in CoinflowEmbed so the panel
		// doesn't jump when the embed mounts.
		loading: () => (
			<div className="flex h-[520px] flex-col items-center justify-center gap-4 rounded-[var(--radius-panel)] border border-[var(--color-hairline)] bg-[var(--color-panel)]">
				<Spinner size={28} />
				<span className="text-eyebrow">Secure checkout</span>
			</div>
		),
	},
);

/** Warm connections to the checkout origins while the user picks an amount. */
function preconnectCoinflow() {
	const isProd = env.coinflow.env === "prod";
	preconnect(isProd ? "https://coinflow.cash" : "https://sandbox.coinflow.cash");
	preconnect(isProd ? "https://api.coinflow.cash" : "https://api-sandbox.coinflow.cash");
	// TokenEx hosts the card-number iframe inside Coinflow's checkout.
	preconnect(isProd ? "https://htp.tokenex.com" : "https://test-htp.tokenex.com");
}

interface DepositCheckoutSession {
	sessionKey: string;
	accountUuid: string;
	email: string | null;
	expiresAt: string | null;
	webhookInfo: Record<string, unknown>;
}

type Stage = "select" | "checkout" | "success";
type CreditState = "waiting" | "credited" | "pending";

const POLL_TIMEOUT_MS = 60_000;
const POLL_INTERVAL_MS = 3_000;

export default function DepositPage() {
	preconnectCoinflow();
	const router = useRouter();
	const queryClient = useQueryClient();
	const balanceQuery = useBalance();
	const initialBalanceRef = useRef<number | null>(null);

	const [stage, setStage] = useState<Stage>("select");
	const [selectedPkg, setSelectedPkg] = useState<DepositPackage | null>(
		depositPackages().find((p) => p.id === "p_5000") ??
			depositPackages()[0] ??
			null,
	);
	const [customCents, setCustomCents] = useState<number | null>(null);
	const [session, setSession] = useState<DepositCheckoutSession | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [continueLoading, setContinueLoading] = useState(false);
	const [creditState, setCreditState] = useState<CreditState>("waiting");

	// Pull the Coinflow SDK chunk down while the user is still picking an
	// amount so "Continue to checkout" doesn't wait on it.
	useEffect(() => {
		void import("@/components/deposit/CoinflowEmbed");
	}, []);

	const onContinue = useCallback(async () => {
		if (!selectedPkg) {
			setError("Choose an amount.");
			return;
		}
		if (selectedPkg.cents < 1) {
			setError("Amount must be at least $0.01.");
			return;
		}
		setError(null);
		setContinueLoading(true);
		try {
			const data = await paymentsFetch<PaymentSessionResponse>("sessions", {
				method: "POST",
				body: JSON.stringify({
					coreTransferId: `web-deposit:${Date.now()}:${crypto.randomUUID()}`,
					direction: "deposit",
					amountCents: selectedPkg.cents,
					currency: "USD",
					preferredActionType: "sdk",
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
			const action = data.action;
			const payload = action?.payload ?? {};
			const sessionKey =
				typeof payload.sessionKey === "string" ? payload.sessionKey : null;
			const accountUuid =
				typeof payload.accountUuid === "string" ? payload.accountUuid : null;
			if (action?.type !== "sdk" || !sessionKey || !accountUuid) {
				throw new Error("Could not start checkout.");
			}
			initialBalanceRef.current = balanceCents(balanceQuery.data);
			setSession({
				sessionKey,
				accountUuid,
				email: typeof payload.email === "string" ? payload.email : null,
				expiresAt: typeof action.expiresAt === "string" ? action.expiresAt : null,
				webhookInfo:
					payload.webhookInfo && typeof payload.webhookInfo === "object"
						? (payload.webhookInfo as Record<string, unknown>)
						: {},
			});
			setStage("checkout");
		} catch (err) {
			setError(err instanceof Error ? err.message : String(err));
		} finally {
			setContinueLoading(false);
		}
	}, [selectedPkg, balanceQuery.data]);

	const onSuccess = useCallback(() => {
		setCreditState("waiting");
		setStage("success");
	}, []);

	useEffect(() => {
		if (stage !== "success" || creditState !== "waiting") return;
		const start = Date.now();
		const initial = initialBalanceRef.current ?? 0;

		const tick = async () => {
			await queryClient.invalidateQueries({ queryKey: ["wallet", "balance"] });
			await queryClient.invalidateQueries({
				queryKey: ["wallet", "transactions"],
			});
			const next = balanceCents(
				queryClient.getQueryData(["wallet", "balance"]),
			);
			if (next !== null && next > initial) {
				setCreditState("credited");
				setTimeout(() => router.push("/wallet"), 2_000);
				return true;
			}
			if (Date.now() - start > POLL_TIMEOUT_MS) {
				setCreditState("pending");
				return true;
			}
			return false;
		};

		let cancelled = false;
		const loop = async () => {
			while (!cancelled) {
				const done = await tick();
				if (done) return;
				await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
			}
		};
		void loop();
		return () => {
			cancelled = true;
		};
	}, [stage, creditState, queryClient, router]);

	if (stage === "success") {
		return (
			<SuccessView
				state={creditState}
				balanceCents={balanceCents(balanceQuery.data)}
			/>
		);
	}

	return (
		<div className="flex flex-col gap-10">
			<Link
				href="/wallet"
				className="text-cta flex items-center gap-2 self-start text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
			>
				<ArrowLeft size={14} />
				Wallet
			</Link>

			<h1 className="text-page-title text-[var(--color-text)]">
				{stage === "checkout" ? "Checkout" : "Add funds"}
			</h1>

			{error ? <Alert tone="error">{error}</Alert> : null}

			{stage === "select" ? (
				<>
					<PackagePicker
						selectedId={selectedPkg?.id ?? null}
						customCents={customCents}
						onSelect={(p) => {
							setSelectedPkg(p);
							if (p.id !== "custom") setCustomCents(null);
						}}
						onCustomChange={setCustomCents}
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
							loading={continueLoading}
							disabled={
								!selectedPkg || selectedPkg.cents < 1 || continueLoading
							}
							className="sm:min-w-[220px]"
						>
							Continue
						</Button>
					</div>
				</>
			) : null}

			{stage === "checkout" && session && selectedPkg ? (
				<>
					<CoinflowEmbed
						sessionKey={session.sessionKey}
						accountUuid={session.accountUuid}
						email={session.email}
						subtotalCents={selectedPkg.cents}
						packageId={selectedPkg.id}
						webhookInfo={session.webhookInfo}
						onSuccess={onSuccess}
					/>
					<button
						type="button"
						onClick={() => {
							setStage("select");
							setSession(null);
						}}
						className="text-eyebrow text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors mx-auto"
					>
						← Change amount
					</button>
				</>
			) : null}
		</div>
	);
}

function SuccessView({
	state,
	balanceCents,
}: {
	state: CreditState;
	balanceCents: number | null;
}) {
	const waiting = state === "waiting";
	const credited = state === "credited";

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

			{credited && balanceCents !== null ? (
				<div>
					<div className="text-eyebrow text-[var(--color-text-muted)]">
						New balance
					</div>
					<div className="text-bignum mt-3 text-[var(--color-text)]">
						{formatBalance(balanceCents)}
					</div>
				</div>
			) : (
				<p className="max-w-md text-[15px] text-[var(--color-text-muted)]">
					{waiting
						? "Payment confirmed — updating your balance."
						: "Bank deposits can take longer to settle. Your balance updates automatically."}
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
