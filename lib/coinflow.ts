/**
 * Server-only Coinflow client.
 *
 * Talks to api-coinflow.cash / api-sandbox.coinflow.cash with the merchant
 * API key, which must NEVER ship to the browser. Only imported by route
 * handlers under app/api/coinflow/.
 */

import { buildWalletTopUpCart } from "./coinflow-cart";
import { coinflowApiBaseUrl, env, serverEnv } from "./env";

interface CoinflowSessionKeyResponse {
	key: string;
	expiresAt?: string;
}

export interface SessionKey {
	sessionKey: string;
	expiresAt: string | null;
}

export async function fetchCoinflowSessionKey(accountUuid: string): Promise<SessionKey> {
	const res = await fetch(`${coinflowApiBaseUrl()}/api/auth/session-key`, {
		method: "GET",
		headers: {
			Authorization: serverEnv.coinflowApiKey,
			Accept: "application/json",
			"x-coinflow-auth-user-id": accountUuid,
		},
		cache: "no-store",
	});

	const text = await res.text();
	if (!res.ok) {
		throw new CoinflowError(
			`Coinflow session-key call failed (${res.status})`,
			res.status,
			text,
		);
	}
	const data = JSON.parse(text) as CoinflowSessionKeyResponse;
	return {
		sessionKey: data.key,
		expiresAt: data.expiresAt ?? null,
	};
}

export interface CheckoutLinkRequest {
	accountUuid: string;
	email: string | null;
	subtotalCents: number;
	packageId?: string;
	itemName?: string;
	coins?: number;
	bonus?: number;
	successUrl?: string;
	cancelUrl?: string;
}

interface CoinflowCheckoutLinkResponse {
	link: string;
}

export async function createCoinflowCheckoutLink(
	req: CheckoutLinkRequest,
): Promise<{ link: string }> {
	const packageId = req.packageId ?? "custom";
	const body = {
		subtotal: {
			currency: "USD",
			cents: req.subtotalCents,
		},
		email: req.email ?? undefined,
		blockchain: "solana" as const,
		settlementType: "USDC" as const,
		merchantId: env.coinflow.merchantId,
		successUrl: req.successUrl,
		cancelUrl: req.cancelUrl,
		// Required because the speedsurvivor merchant has chargeback
		// protection enabled. Same shape as the embedded SDK uses.
		chargebackProtectionData: buildWalletTopUpCart({
			subtotalCents: req.subtotalCents,
			packageId,
			accountUuid: req.accountUuid,
		}),
		webhookInfo: {
			itemName: req.itemName ?? "Speed Survivor Wallet Deposit",
			price: (req.subtotalCents / 100).toFixed(2),
			coins: req.coins ?? req.subtotalCents,
			bonus: req.bonus ?? 0,
			userId: req.accountUuid,
			packageId,
		},
	};

	const res = await fetch(`${coinflowApiBaseUrl()}/api/checkout/link`, {
		method: "POST",
		headers: {
			Authorization: serverEnv.coinflowApiKey,
			Accept: "application/json",
			"Content-Type": "application/json",
			"x-coinflow-auth-user-id": req.accountUuid,
		},
		body: JSON.stringify(body),
		cache: "no-store",
	});

	const text = await res.text();
	if (!res.ok) {
		throw new CoinflowError(
			`Coinflow checkout-link call failed (${res.status})`,
			res.status,
			text,
		);
	}
	const data = JSON.parse(text) as CoinflowCheckoutLinkResponse;
	return { link: data.link };
}

export class CoinflowError extends Error {
	readonly status: number;
	readonly body: string;
	constructor(message: string, status: number, body: string) {
		super(message);
		this.name = "CoinflowError";
		this.status = status;
		this.body = body;
	}
}
