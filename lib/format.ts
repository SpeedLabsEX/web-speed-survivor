/**
 * Formatting helpers shared across wallet UI.
 * Mirrors the formatting logic in mobile-speed-survivor/src/screens/wallet/WalletFlow.tsx.
 */

const USD = new Intl.NumberFormat("en-US", {
	style: "currency",
	currency: "USD",
	minimumFractionDigits: 2,
	maximumFractionDigits: 2,
});

/** Render an integer "amount" (as the API returns it — see wallet.deposits.amount) as USD. */
export function formatBalance(amount: number | string | null | undefined): string {
	const n = typeof amount === "string" ? Number.parseFloat(amount) : amount ?? 0;
	if (!Number.isFinite(n)) return USD.format(0);
	return USD.format(n / 100);
}

/** Render a relative timestamp ("2m ago", "3h ago", …). Falls back to a short date. */
export function formatRelativeTime(iso: string | null | undefined): string {
	if (!iso) return "";
	const then = new Date(iso).getTime();
	if (!Number.isFinite(then)) return "";
	const diffMs = Date.now() - then;
	const diffSec = Math.max(0, Math.floor(diffMs / 1000));
	if (diffSec < 60) return "just now";
	const diffMin = Math.floor(diffSec / 60);
	if (diffMin < 60) return `${diffMin}m ago`;
	const diffHr = Math.floor(diffMin / 60);
	if (diffHr < 24) return `${diffHr}h ago`;
	const diffDay = Math.floor(diffHr / 24);
	if (diffDay < 7) return `${diffDay}d ago`;
	return new Date(then).toLocaleDateString("en-US", {
		month: "short",
		day: "numeric",
	});
}
