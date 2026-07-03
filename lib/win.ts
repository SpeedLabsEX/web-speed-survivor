/**
 * Pure, client-safe display helpers for the shareable-win surface.
 *
 * IMPORTANT: keep this module free of server-only imports (apiClient/session →
 * next/headers). It is imported by the client component WinCardModal. The
 * server-side data fetch lives in lib/win-server.ts.
 */
import type { PublicWinResponse } from "@/lib/api-types";

/** Signed USD, no cents. `+$500`, `-$25`, `$0`. */
export function money(n: number): string {
	const sign = n > 0 ? "+" : n < 0 ? "-" : "";
	return `${sign}$${Math.abs(n).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

/** Unsigned USD, no cents. `$500`. */
export function usd(n: number): string {
	return `$${Math.abs(n).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

/** `1` -> `["1", "st"]`, `2` -> `["2", "nd"]`, `13` -> `["13", "th"]`. */
export function ordinalParts(n: number): [string, string] {
	const abs = Math.abs(n);
	const tens = abs % 100;
	if (tens >= 11 && tens <= 13) return [String(n), "th"];
	switch (abs % 10) {
		case 1:
			return [String(n), "st"];
		case 2:
			return [String(n), "nd"];
		case 3:
			return [String(n), "rd"];
		default:
			return [String(n), "th"];
	}
}

export function ordinal(n: number): string {
	const [num, suffix] = ordinalParts(n);
	return `${num}${suffix}`;
}

/**
 * Achievement badge mirroring the mobile YouWon screen:
 *   CHAMPION (1st + payout) / ELITE FINISHER (paid, not 1st) / SURVIVOR (else).
 */
export function winBadge(win: PublicWinResponse): string {
	if (win.is_winner) {
		return win.final_placement === 1 ? "CHAMPION" : "ELITE FINISHER";
	}
	return "SURVIVOR";
}

/**
 * Headline shown in link previews and the win card, e.g.
 * "Finished 1st and won $500 in Sunday Night Baseball".
 */
export function winHeadline(win: PublicWinResponse): string {
	const place = ordinal(win.final_placement);
	if (win.is_winner && win.prize_amount > 0) {
		return `Finished ${place} and won ${usd(win.prize_amount)} in ${win.contest_name}`;
	}
	return `Finished ${place} in ${win.contest_name}`;
}
