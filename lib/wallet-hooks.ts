"use client";

import { useQuery } from "@tanstack/react-query";

import type {
	WalletBalance,
	WalletTransaction,
	WalletTransactionList,
} from "./api-types";

async function fetchJson<T>(url: string): Promise<T> {
	const res = await fetch(url, { credentials: "same-origin" });
	const text = await res.text();
	const parsed = text ? JSON.parse(text) : undefined;
	if (!res.ok) {
		const detail =
			parsed && typeof parsed === "object" && "detail" in parsed
				? String((parsed as { detail: unknown }).detail)
				: res.statusText;
		throw new Error(detail || `Request failed (${res.status})`);
	}
	return parsed as T;
}

interface UseBalanceOpts {
	pollMs?: number;
}

export function useBalance(opts: UseBalanceOpts = {}) {
	return useQuery({
		queryKey: ["wallet", "balance"],
		queryFn: () => fetchJson<WalletBalance>("/api/proxy/api/v1/wallet/balance"),
		refetchInterval: opts.pollMs,
		refetchIntervalInBackground: opts.pollMs ? true : false,
	});
}

interface UseTransactionsOpts {
	limit?: number;
	offset?: number;
	pollMs?: number;
}

export function useTransactions(opts: UseTransactionsOpts = {}) {
	const { limit = 20, offset = 0, pollMs } = opts;
	return useQuery({
		queryKey: ["wallet", "transactions", limit, offset],
		queryFn: () =>
			fetchJson<WalletTransactionList | { transactions: WalletTransaction[] }>(
				`/api/proxy/api/v1/wallet/transactions?limit=${limit}&offset=${offset}`,
			),
		refetchInterval: pollMs,
		refetchIntervalInBackground: pollMs ? true : false,
	});
}

function centsFrom(raw: number | string | undefined | null): number | null {
	if (raw === undefined || raw === null) return null;
	const n = typeof raw === "string" ? Number.parseFloat(raw) : raw;
	if (!Number.isFinite(n)) return null;
	return Math.round(n);
}

/** Cents value extracted from the heterogeneous balance response. */
export function balanceCents(balance: WalletBalance | undefined | null): number | null {
	if (!balance) return null;
	return centsFrom(balance.balance);
}

/** Remaining non-withdrawable referral credit, in cents. */
export function creditCents(balance: WalletBalance | undefined | null): number | null {
	if (!balance) return null;
	return centsFrom(balance.credit_balance) ?? 0;
}

/** Withdrawable balance in cents. Falls back to total balance when the API
 * doesn't return a withdrawable field (older deploys). */
export function withdrawableCents(balance: WalletBalance | undefined | null): number | null {
	if (!balance) return null;
	const explicit = centsFrom(balance.withdrawable_balance);
	if (explicit !== null) return explicit;
	return balanceCents(balance);
}
