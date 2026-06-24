"use client";

import { useQueryClient } from "@tanstack/react-query";
import {
	ArrowLeft,
	Building2,
	CheckCircle2,
	CreditCard,
	ExternalLink,
	RefreshCw,
	ShieldCheck,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";

import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Panel } from "@/components/ui/Card";
import { Spinner } from "@/components/ui/Spinner";
import { env } from "@/lib/env";
import { formatBalance } from "@/lib/format";
import {
	paymentsFetch,
	type ProviderAction,
	type WithdrawalDestination,
	type WithdrawalKycRequest,
	type WithdrawalProfileResponse,
	type WithdrawalQuoteResponse,
	type WithdrawalResponse,
	type WithdrawalSpeed,
} from "@/lib/payments-api";
import { creditCents, useBalance, withdrawableCents } from "@/lib/wallet-hooks";
import { cn } from "@/lib/cn";

const SPEED_LABEL: Record<WithdrawalSpeed, string> = {
	standard: "Standard",
	same_day: "Same day",
	card: "Card",
};

const INITIAL_KYC: WithdrawalKycRequest = {
	email: "",
	firstName: "",
	surName: "",
	physicalAddress: "",
	city: "",
	state: "",
	zip: "",
	country: "US",
	dob: "",
	ssn: "",
	redirectUrl: `${env.appUrl}/wallet/withdraw`,
};

export function WithdrawFlow() {
	const queryClient = useQueryClient();
	const balanceQuery = useBalance({ pollMs: 15_000 });
	// Only the withdrawable portion can be cashed out — referral credit is
	// spendable on contests but never withdrawable. The cap and validation use
	// withdrawable; api-payments enforces the same server-side.
	const walletBalanceCents = withdrawableCents(balanceQuery.data);
	const creditBalanceCents = creditCents(balanceQuery.data);

	const [profile, setProfile] = useState<WithdrawalProfileResponse | null>(null);
	const [profileLoading, setProfileLoading] = useState(true);
	const [profileError, setProfileError] = useState<string | null>(null);
	const [kyc, setKyc] = useState<WithdrawalKycRequest>(INITIAL_KYC);
	const [kycLoading, setKycLoading] = useState(false);
	const [kycSubmitted, setKycSubmitted] = useState(false);
	const [destinationAction, setDestinationAction] = useState<ProviderAction | null>(null);
	const [linkLoading, setLinkLoading] = useState(false);
	const [selectedDestinationId, setSelectedDestinationId] = useState<string | null>(null);
	const [speed, setSpeed] = useState<WithdrawalSpeed>("standard");
	const [amount, setAmount] = useState("");
	const [quote, setQuote] = useState<WithdrawalQuoteResponse | null>(null);
	const [quoteLoading, setQuoteLoading] = useState(false);
	const [withdrawal, setWithdrawal] = useState<WithdrawalResponse | null>(null);
	const [withdrawalLoading, setWithdrawalLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const loadProfile = useCallback(async () => {
		setProfileError(null);
		setProfileLoading(true);
		try {
			const nextProfile =
				await paymentsFetch<WithdrawalProfileResponse>("withdrawals/profile");
			setProfile(nextProfile);
			setSelectedDestinationId((current) => {
				if (current && nextProfile.destinations.some((item) => item.providerPaymentMethodId === current)) {
					return current;
				}
				return nextProfile.destinations[0]?.providerPaymentMethodId ?? null;
			});
		} catch (err) {
			setProfileError(err instanceof Error ? err.message : String(err));
		} finally {
			setProfileLoading(false);
		}
	}, []);

	useEffect(() => {
		void loadProfile();
	}, [loadProfile]);

	const selectedDestination = useMemo(() => {
		return (
			profile?.destinations.find(
				(item) => item.providerPaymentMethodId === selectedDestinationId,
			) ?? null
		);
	}, [profile?.destinations, selectedDestinationId]);

	const availableSpeeds = useMemo<WithdrawalSpeed[]>(() => {
		if (!selectedDestination) return [];
		if (selectedDestination.speeds.length > 0) return selectedDestination.speeds;
		return selectedDestination.destinationType === "card"
			? ["card"]
			: ["standard", "same_day"];
	}, [selectedDestination]);

	useEffect(() => {
		if (availableSpeeds.length === 0) return;
		if (!availableSpeeds.includes(speed)) {
			setSpeed(availableSpeeds[0]);
		}
	}, [availableSpeeds, speed]);

	const amountCents = useMemo(() => dollarsToCents(amount), [amount]);
	const quoteDisabled =
		!selectedDestination ||
		!amountCents ||
		amountCents <= 0 ||
		(walletBalanceCents !== null && amountCents > walletBalanceCents) ||
		quoteLoading;

	const submitKyc = async () => {
		setError(null);
		setKycLoading(true);
		try {
			await paymentsFetch("withdrawals/kyc", {
				method: "POST",
				body: JSON.stringify(kyc),
			});
			setKycSubmitted(true);
			setKyc(INITIAL_KYC);
			await loadProfile();
		} catch (err) {
			setError(err instanceof Error ? err.message : String(err));
		} finally {
			setKycLoading(false);
		}
	};

	const startDestinationLink = async () => {
		setError(null);
		setLinkLoading(true);
		try {
			const action = await paymentsFetch<ProviderAction>("withdrawals/destination-link", {
				method: "POST",
				body: JSON.stringify({
					returnUrl: `${env.appUrl}/wallet/withdraw`,
					origins: [env.appUrl],
					allowedWithdrawSpeeds: ["standard", "same_day", "card"],
				}),
			});
			setDestinationAction(action);
		} catch (err) {
			setError(err instanceof Error ? err.message : String(err));
		} finally {
			setLinkLoading(false);
		}
	};

	const createQuote = async () => {
		if (!selectedDestination || !amountCents) return;
		setError(null);
		setWithdrawal(null);
		setQuoteLoading(true);
		try {
			const nextQuote = await paymentsFetch<WithdrawalQuoteResponse>(
				"withdrawals/quotes",
				{
					method: "POST",
					body: JSON.stringify({
						amountCents,
						providerPaymentMethodId: selectedDestination.providerPaymentMethodId,
						destinationType: selectedDestination.destinationType,
						speed,
						currency: "USD",
					}),
				},
			);
			setQuote(nextQuote);
		} catch (err) {
			setQuote(null);
			setError(err instanceof Error ? err.message : String(err));
		} finally {
			setQuoteLoading(false);
		}
	};

	const createWithdrawal = async () => {
		if (!quote) return;
		setError(null);
		setWithdrawalLoading(true);
		try {
			const result = await paymentsFetch<WithdrawalResponse>("withdrawals", {
				method: "POST",
				body: JSON.stringify({
					quoteId: quote.quoteId,
					coreTransferId: `web-withdrawal:${Date.now()}:${crypto.randomUUID()}`,
				}),
			});
			setWithdrawal(result);
			setQuote(null);
			await queryClient.invalidateQueries({ queryKey: ["wallet", "balance"] });
			await queryClient.invalidateQueries({ queryKey: ["wallet", "transactions"] });
		} catch (err) {
			setError(err instanceof Error ? err.message : String(err));
		} finally {
			setWithdrawalLoading(false);
		}
	};

	return (
		<div className="flex flex-col gap-10">
			<Link
				href="/wallet"
				className="text-cta flex items-center gap-2 text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text)]"
			>
				<ArrowLeft size={14} />
				Wallet
			</Link>

			<header>
				<div className="text-eyebrow text-[var(--color-spine)]">Withdraw</div>
				<h1 className="text-page-title mt-3 text-[var(--color-text)]">
					Cash out
				</h1>
			</header>

			{error ? <Alert tone="error">{error}</Alert> : null}
			{profileError ? <Alert tone="error">{profileError}</Alert> : null}

			<BalanceStrip
				balanceCents={walletBalanceCents}
				creditCents={creditBalanceCents}
				loading={balanceQuery.isLoading}
			/>

			<IdentitySection
				kyc={kyc}
				setKyc={setKyc}
				status={profile?.kycStatus ?? "unknown"}
				submitted={kycSubmitted}
				loading={kycLoading}
				onSubmit={submitKyc}
			/>

			<DestinationSection
				profile={profile}
				profileLoading={profileLoading}
				action={destinationAction}
				linkLoading={linkLoading}
				selectedDestinationId={selectedDestinationId}
				onSelectDestination={(destination) => {
					setSelectedDestinationId(destination.providerPaymentMethodId);
					setQuote(null);
					setWithdrawal(null);
				}}
				onLink={startDestinationLink}
				onRefresh={loadProfile}
			/>

			<AmountSection
				amount={amount}
				setAmount={(value) => {
					setAmount(value);
					setQuote(null);
					setWithdrawal(null);
				}}
				amountCents={amountCents}
				balanceCents={walletBalanceCents}
				selectedDestination={selectedDestination}
				speed={speed}
				setSpeed={(nextSpeed) => {
					setSpeed(nextSpeed);
					setQuote(null);
				}}
				availableSpeeds={availableSpeeds}
				quote={quote}
				quoteLoading={quoteLoading}
				quoteDisabled={quoteDisabled}
				withdrawal={withdrawal}
				withdrawalLoading={withdrawalLoading}
				onCreateQuote={createQuote}
				onCreateWithdrawal={createWithdrawal}
			/>
		</div>
	);
}

function BalanceStrip({
	balanceCents,
	creditCents,
	loading,
}: {
	balanceCents: number | null;
	creditCents?: number | null;
	loading: boolean;
}) {
	const hasCredit = (creditCents ?? 0) > 0;
	return (
		<Panel className="flex flex-col gap-3 p-5 sm:flex-row sm:items-end sm:justify-between">
			<div>
				<div className="text-eyebrow text-[var(--color-text-muted)]">
					Available to withdraw
				</div>
				<div className="mt-2 text-[32px] font-extrabold tabular text-[var(--color-text)]">
					{loading && balanceCents === null ? (
						<Spinner size={22} />
					) : (
						formatBalance(balanceCents ?? 0)
					)}
				</div>
				{hasCredit ? (
					<div className="mt-1 text-sm text-[var(--color-text-muted)]">
						{formatBalance(creditCents ?? 0)} in credit can&apos;t be withdrawn.
					</div>
				) : null}
			</div>
			<div className="text-sm text-[var(--color-text-muted)]">
				Withdrawals update your balance as soon as funds are reserved.
			</div>
		</Panel>
	);
}

function IdentitySection({
	kyc,
	setKyc,
	status,
	submitted,
	loading,
	onSubmit,
}: {
	kyc: WithdrawalKycRequest;
	setKyc: (value: WithdrawalKycRequest) => void;
	status: WithdrawalProfileResponse["kycStatus"];
	submitted: boolean;
	loading: boolean;
	onSubmit: () => void;
}) {
	const complete = status === "verified" || status === "pending" || status === "created" || submitted;

	return (
		<section className="flex flex-col gap-4">
			<SectionHeader
				icon={<ShieldCheck size={18} />}
				label="Identity"
				title={complete ? `Status: ${statusLabel(status, submitted)}` : "Verify identity"}
			/>

			{complete ? (
				<Panel className="flex items-center gap-3 p-5">
					<CheckCircle2 size={18} className="text-[var(--color-spine)]" />
					<div>
						<div className="text-[15px] font-semibold text-[var(--color-text)]">
							Identity details received
						</div>
						<div className="mt-1 text-sm text-[var(--color-text-muted)]">
							Status: {statusLabel(status, submitted)}
						</div>
					</div>
				</Panel>
			) : (
				<Panel className="p-5">
					<div className="grid gap-3 sm:grid-cols-2">
						<Field label="First name">
							<Input
								value={kyc.firstName}
								autoComplete="given-name"
								onChange={(event) => setKyc({ ...kyc, firstName: event.target.value })}
							/>
						</Field>
						<Field label="Last name">
							<Input
								value={kyc.surName}
								autoComplete="family-name"
								onChange={(event) => setKyc({ ...kyc, surName: event.target.value })}
							/>
						</Field>
						<Field label="Email">
							<Input
								type="email"
								value={kyc.email ?? ""}
								autoComplete="email"
								onChange={(event) => setKyc({ ...kyc, email: event.target.value })}
							/>
						</Field>
						<Field label="Date of birth">
							<Input
								type="date"
								value={kyc.dob}
								autoComplete="bday"
								onChange={(event) => setKyc({ ...kyc, dob: event.target.value })}
							/>
						</Field>
						<Field label="Address">
							<Input
								value={kyc.physicalAddress}
								autoComplete="street-address"
								onChange={(event) =>
									setKyc({ ...kyc, physicalAddress: event.target.value })
								}
							/>
						</Field>
						<Field label="City">
							<Input
								value={kyc.city}
								autoComplete="address-level2"
								onChange={(event) => setKyc({ ...kyc, city: event.target.value })}
							/>
						</Field>
						<Field label="State">
							<Input
								value={kyc.state}
								autoComplete="address-level1"
								maxLength={16}
								onChange={(event) =>
									setKyc({ ...kyc, state: event.target.value.toUpperCase() })
								}
							/>
						</Field>
						<Field label="ZIP">
							<Input
								value={kyc.zip}
								autoComplete="postal-code"
								onChange={(event) => setKyc({ ...kyc, zip: event.target.value })}
							/>
						</Field>
						<Field label="Last 4 digits of SSN">
							<Input
								value={kyc.ssn}
								inputMode="numeric"
								autoComplete="off"
								maxLength={32}
								onChange={(event) => setKyc({ ...kyc, ssn: event.target.value })}
							/>
						</Field>
					</div>
					<div className="mt-5 flex justify-end">
						<Button
							type="button"
							variant="primary"
							size="lg"
							loading={loading}
							disabled={loading || !kycFormComplete(kyc)}
							onClick={onSubmit}
						>
							Submit identity
						</Button>
					</div>
				</Panel>
			)}
		</section>
	);
}

function DestinationSection({
	profile,
	profileLoading,
	action,
	linkLoading,
	selectedDestinationId,
	onSelectDestination,
	onLink,
	onRefresh,
}: {
	profile: WithdrawalProfileResponse | null;
	profileLoading: boolean;
	action: ProviderAction | null;
	linkLoading: boolean;
	selectedDestinationId: string | null;
	onSelectDestination: (destination: WithdrawalDestination) => void;
	onLink: () => void;
	onRefresh: () => void;
}) {
	const destinations = profile?.destinations ?? [];

	return (
		<section className="flex flex-col gap-4">
			<SectionHeader
				icon={<Building2 size={18} />}
				label="Destination"
				title={destinations.length > 0 ? "Choose account" : "Link account"}
			/>

			<div className="flex flex-col gap-3">
				{profileLoading ? (
					<Panel className="flex items-center justify-center p-8">
						<Spinner size={22} />
					</Panel>
				) : destinations.length > 0 ? (
					<div className="grid gap-3 sm:grid-cols-2">
						{destinations.map((destination) => (
							<DestinationButton
								key={destination.providerPaymentMethodId}
								destination={destination}
								selected={
									destination.providerPaymentMethodId === selectedDestinationId
								}
								onClick={() => onSelectDestination(destination)}
							/>
						))}
					</div>
				) : (
					<Panel className="flex flex-col gap-4 p-5">
						<div>
							<div className="text-[15px] font-semibold text-[var(--color-text)]">
								No payout destination yet
							</div>
							<div className="mt-1 text-sm text-[var(--color-text-muted)]">
								Link a bank account or debit card to continue.
							</div>
						</div>
						<div className="flex flex-col gap-3 sm:flex-row">
							<Button
								type="button"
								variant="primary"
								size="lg"
								loading={linkLoading}
								onClick={onLink}
							>
								<ExternalLink size={18} aria-hidden />
								Link destination
							</Button>
							<Button type="button" variant="ghost" size="lg" onClick={onRefresh}>
								<RefreshCw size={18} aria-hidden />
								Refresh
							</Button>
						</div>
					</Panel>
				)}

				{destinations.length > 0 ? (
					<div className="flex justify-end">
						<Button type="button" variant="ghost" size="md" onClick={onLink}>
							<ExternalLink size={16} aria-hidden />
							Add destination
						</Button>
					</div>
				) : null}

				{action?.url ? (
					<Panel className="overflow-hidden">
						<div className="flex items-center justify-between gap-3 border-b border-[var(--color-hairline)] px-4 py-3">
							<div className="text-eyebrow text-[10px]">Coinflow</div>
							<Button type="button" variant="ghost" size="sm" onClick={onRefresh}>
								<RefreshCw size={14} aria-hidden />
								Refresh
							</Button>
						</div>
						<iframe
							title="Link payout destination"
							src={action.url}
							className="h-[720px] w-full border-0 bg-[var(--color-panel)]"
							allow="payment *"
						/>
					</Panel>
				) : null}
			</div>
		</section>
	);
}

function AmountSection({
	amount,
	setAmount,
	amountCents,
	balanceCents,
	selectedDestination,
	speed,
	setSpeed,
	availableSpeeds,
	quote,
	quoteLoading,
	quoteDisabled,
	withdrawal,
	withdrawalLoading,
	onCreateQuote,
	onCreateWithdrawal,
}: {
	amount: string;
	setAmount: (value: string) => void;
	amountCents: number | null;
	balanceCents: number | null;
	selectedDestination: WithdrawalDestination | null;
	speed: WithdrawalSpeed;
	setSpeed: (speed: WithdrawalSpeed) => void;
	availableSpeeds: readonly WithdrawalSpeed[];
	quote: WithdrawalQuoteResponse | null;
	quoteLoading: boolean;
	quoteDisabled: boolean;
	withdrawal: WithdrawalResponse | null;
	withdrawalLoading: boolean;
	onCreateQuote: () => void;
	onCreateWithdrawal: () => void;
}) {
	const overBalance =
		amountCents !== null && balanceCents !== null && amountCents > balanceCents;

	return (
		<section className="flex flex-col gap-4">
			<SectionHeader
				icon={<CreditCard size={18} />}
				label="Amount"
				title="Review payout"
			/>

			<Panel className="p-5">
				<div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
					<Field label="Amount">
						<div className="relative">
							<span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]">
								$
							</span>
							<Input
								value={amount}
								inputMode="decimal"
								placeholder="0.00"
								className="pl-8"
								invalid={overBalance}
								onChange={(event) => setAmount(event.target.value)}
							/>
						</div>
					</Field>

					<Button
						type="button"
						variant="primary"
						size="lg"
						loading={quoteLoading}
						disabled={quoteDisabled}
						onClick={onCreateQuote}
						className="sm:min-w-[180px]"
					>
						Get quote
					</Button>
				</div>

				{overBalance ? (
					<div className="mt-3 text-sm text-[var(--color-risk)]">
						Amount exceeds available balance.
					</div>
				) : null}

				{selectedDestination ? (
					<div className="mt-5 flex flex-wrap gap-2">
						{availableSpeeds.map((item) => (
							<button
								key={item}
								type="button"
								aria-pressed={speed === item}
								onClick={() => setSpeed(item)}
								className={cn(
									"press-scale h-10 rounded-[var(--radius-button)] border px-4 text-sm font-semibold",
									speed === item
										? "border-[var(--color-spine)] bg-[var(--color-spine-soft)] text-[var(--color-text)]"
										: "border-[var(--color-hairline)] text-[var(--color-text-muted)] hover:border-[var(--color-hairline-2)] hover:text-[var(--color-text)]",
								)}
							>
								{SPEED_LABEL[item]}
							</button>
						))}
					</div>
				) : (
					<div className="mt-4 text-sm text-[var(--color-text-muted)]">
						Select a payout destination first.
					</div>
				)}
			</Panel>

			{quote ? (
				<QuotePanel
					quote={quote}
					withdrawalLoading={withdrawalLoading}
					onCreateWithdrawal={onCreateWithdrawal}
				/>
			) : null}

			{withdrawal ? <WithdrawalResult result={withdrawal} /> : null}
		</section>
	);
}

function QuotePanel({
	quote,
	withdrawalLoading,
	onCreateWithdrawal,
}: {
	quote: WithdrawalQuoteResponse;
	withdrawalLoading: boolean;
	onCreateWithdrawal: () => void;
}) {
	return (
		<Panel className="p-5">
			<div className="grid gap-4 sm:grid-cols-3">
				<Metric label="Wallet debit" value={formatBalance(quote.walletDebitAmountCents)} />
				<Metric label="Payout" value={formatBalance(quote.providerPayoutAmountCents)} />
				<Metric label="Fee" value={formatBalance(quote.providerFeeAmountCents)} />
			</div>
			<div className="mt-5 flex flex-col gap-3 border-t border-[var(--color-hairline)] pt-5 sm:flex-row sm:items-center sm:justify-between">
				<div className="text-sm text-[var(--color-text-muted)]">
					Speed: {SPEED_LABEL[quote.speed]}
				</div>
				<Button
					type="button"
					variant="primary"
					size="lg"
					loading={withdrawalLoading}
					onClick={onCreateWithdrawal}
					className="sm:min-w-[220px]"
				>
					Confirm withdrawal
				</Button>
			</div>
		</Panel>
	);
}

function WithdrawalResult({ result }: { result: WithdrawalResponse }) {
	const failed = result.status === "failed" || result.status === "canceled";
	return (
		<Alert tone={failed ? "error" : "success"}>
			{failed
				? result.failure?.message ?? "Withdrawal failed. Funds are available again."
				: `Withdrawal ${result.status}. ${formatBalance(
						result.walletDebitAmountCents,
					)} is reflected in your wallet.`}
		</Alert>
	);
}

function DestinationButton({
	destination,
	selected,
	onClick,
}: {
	destination: WithdrawalDestination;
	selected: boolean;
	onClick: () => void;
}) {
	const Icon = destination.destinationType === "card" ? CreditCard : Building2;
	const label =
		destination.label ??
		destination.bankName ??
		destination.brand ??
		(destination.destinationType === "card" ? "Debit card" : "Bank account");
	return (
		<button
			type="button"
			aria-pressed={selected}
			onClick={onClick}
			className={cn(
				"press-scale flex min-h-[112px] flex-col items-start gap-4 rounded-[var(--radius-tile)] border bg-[var(--color-panel)] p-5 text-left",
				selected
					? "border-[var(--color-spine)] bg-[var(--color-spine-soft)]"
					: "border-[var(--color-hairline)] hover:border-[var(--color-hairline-2)]",
			)}
		>
			<div className="flex items-center gap-3">
				<Icon size={18} className="text-[var(--color-spine)]" />
				<div>
					<div className="text-[15px] font-semibold text-[var(--color-text)]">
						{label}
					</div>
					<div className="mt-1 text-sm text-[var(--color-text-muted)]">
						{destination.last4 ? `Ending ${destination.last4}` : destination.destinationType}
					</div>
				</div>
			</div>
			<div className="text-eyebrow text-[10px]">
				{speedsLabel(destination)}
			</div>
		</button>
	);
}

function SectionHeader({
	icon,
	label,
	title,
}: {
	icon: ReactNode;
	label: string;
	title: string;
}) {
	return (
		<div className="flex items-end justify-between gap-4">
			<div>
				<div className="text-eyebrow text-[var(--color-text-muted)]">
					{label}
				</div>
				<h2 className="mt-2 flex items-center gap-2 text-[22px] font-extrabold text-[var(--color-text)]">
					<span className="text-[var(--color-spine)]">{icon}</span>
					{title}
				</h2>
			</div>
		</div>
	);
}

function Field({
	label,
	children,
}: {
	label: string;
	children: ReactNode;
}) {
	return (
		<label className="flex flex-col gap-2">
			<span className="text-eyebrow text-[10px]">{label}</span>
			{children}
		</label>
	);
}

function Metric({ label, value }: { label: string; value: string }) {
	return (
		<div>
			<div className="text-eyebrow text-[10px]">{label}</div>
			<div className="mt-2 text-[24px] font-extrabold tabular text-[var(--color-text)]">
				{value}
			</div>
		</div>
	);
}

function dollarsToCents(value: string): number | null {
	const normalized = value.replace(/[$,\s]/g, "");
	if (!normalized) return null;
	const parsed = Number.parseFloat(normalized);
	if (!Number.isFinite(parsed) || parsed <= 0) return null;
	return Math.round(parsed * 100);
}

function kycFormComplete(kyc: WithdrawalKycRequest): boolean {
	return [
		kyc.firstName,
		kyc.surName,
		kyc.physicalAddress,
		kyc.city,
		kyc.state,
		kyc.zip,
		kyc.country,
		kyc.dob,
		kyc.ssn,
	].every((value) => value.trim().length > 0);
}

function statusLabel(status: WithdrawalProfileResponse["kycStatus"], submitted: boolean): string {
	if (submitted && status === "unknown") return "submitted";
	if (status === "kyc_required") return "required";
	return status.replace(/_/g, " ");
}

function speedsLabel(destination: WithdrawalDestination): string {
	const speeds = destination.speeds.length > 0 ? destination.speeds : [];
	if (speeds.length === 0) {
		return destination.destinationType === "card" ? "Card" : "Standard, same day";
	}
	return speeds.map((item) => SPEED_LABEL[item]).join(", ");
}
