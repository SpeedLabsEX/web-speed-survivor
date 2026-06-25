export class PaymentsApiError extends Error {
	readonly status: number;
	readonly body: unknown;

	constructor(message: string, status: number, body: unknown) {
		super(message);
		this.name = "PaymentsApiError";
		this.status = status;
		this.body = body;
	}
}

export interface ProviderAction {
	type: "sdk" | "redirect" | "iframe" | "none";
	provider: string;
	payload: Record<string, unknown>;
	url?: string | null;
	expiresAt?: string | null;
}

export interface PaymentSessionResponse {
	sessionId: string;
	direction: "deposit" | "withdrawal";
	amountCents: number;
	currency: string;
	status:
		| "created"
		| "action_required"
		| "processing"
		| "succeeded"
		| "failed"
		| "canceled"
		| "expired"
		| "unknown";
	currentAttemptId?: string | null;
	canContinue: boolean;
	action?: ProviderAction | null;
}

export interface WithdrawalDestination {
	providerPaymentMethodId: string;
	destinationType: "bank" | "card";
	label?: string | null;
	last4?: string | null;
	brand?: string | null;
	bankName?: string | null;
	speeds: WithdrawalSpeed[];
	metadata?: Record<string, unknown>;
}

export type WithdrawalSpeed = "standard" | "same_day" | "card";

export interface WithdrawalProfileResponse {
	provider: string;
	providerCustomerId?: string | null;
	kycStatus: "unknown" | "created" | "pending" | "verified" | "failed" | "kyc_required";
	destinations: WithdrawalDestination[];
}

export interface WithdrawalKycRequest {
	email?: string | null;
	firstName: string;
	surName: string;
	physicalAddress: string;
	city: string;
	state: string;
	zip: string;
	country: string;
	dob: string;
	ssn: string;
	redirectUrl?: string | null;
}

export interface WithdrawalKycResponse {
	provider: string;
	status: WithdrawalProfileResponse["kycStatus"];
	providerCustomerId?: string | null;
	verificationUrl?: string | null;
}

export interface WithdrawalQuoteResponse {
	quoteId: string;
	provider: string;
	providerPaymentMethodId: string;
	destinationType: "bank" | "card";
	speed: WithdrawalSpeed;
	walletDebitAmountCents: number;
	providerPayoutAmountCents: number;
	providerFeeAmountCents: number;
	currency: string;
	expiresAt: string;
	expectedDeliveryAt?: string | null;
}

export interface WithdrawalResponse {
	withdrawalId?: string | null;
	sessionId: string;
	attemptId: string;
	provider: string;
	status:
		| "created"
		| "action_required"
		| "processing"
		| "succeeded"
		| "failed"
		| "canceled"
		| "expired"
		| "unknown";
	walletDebitAmountCents: number;
	providerPaymentMethodId: string;
	providerPayoutAmountCents: number;
	providerFeeAmountCents: number;
	providerTransactionId?: string | null;
	expectedDeliveryAt?: string | null;
	failure?: {
		code: string;
		message?: string | null;
		class: string;
	} | null;
}

export interface PaymentReconciliationResponse {
	success: boolean;
	checked: number;
	processed: number;
	ignored: number;
	duplicates: number;
	errors: number;
	staleWithdrawalsFailed: number;
	providers: Record<string, Record<string, number>>;
}

export async function paymentsFetch<T>(
	path: string,
	init: RequestInit = {},
): Promise<T> {
	const res = await fetch(`/api/payments/${path.replace(/^\/+/, "")}`, {
		...init,
		headers: {
			Accept: "application/json",
			...(init.body ? { "Content-Type": "application/json" } : {}),
			...init.headers,
		},
		credentials: "same-origin",
	});

	const text = await res.text();
	let parsed: unknown = undefined;
	if (text) {
		try {
			parsed = JSON.parse(text);
		} catch {
			parsed = text;
		}
	}

	if (!res.ok) {
		const message =
			parsed && typeof parsed === "object" && "detail" in parsed
				? String((parsed as { detail: unknown }).detail)
				: parsed && typeof parsed === "object" && "error" in parsed
					? String((parsed as { error: unknown }).error)
					: res.statusText;
		throw new PaymentsApiError(message || `Request failed (${res.status})`, res.status, parsed);
	}

	return parsed as T;
}
