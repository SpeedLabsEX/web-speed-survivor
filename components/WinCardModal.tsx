"use client";

import { useState } from "react";

import { Wordmark } from "@/components/Wordmark";
import type { PublicWinResponse } from "@/lib/api-types";
import { money, ordinalParts, usd, winBadge } from "@/lib/win";

interface WinCardModalProps {
	win: PublicWinResponse;
	appStoreUrl: string;
	playStoreUrl: string;
}

/**
 * Popup PnL card shown over the public profile when a shared win link is
 * opened (/u/:username?win=:contestUuid). Recreates the mobile "You Won" card
 * and adds a clear download CTA. Dismissible to reveal the profile beneath.
 */
export function WinCardModal({ win, appStoreUrl, playStoreUrl }: WinCardModalProps) {
	const [open, setOpen] = useState(true);
	if (!open) return null;

	const badge = winBadge(win);
	const [rankNum, rankSuffix] = ordinalParts(win.final_placement);
	const showPayout = win.is_winner && win.prize_amount > 0;
	const survivorsOutlasted = Math.max(win.total_players - win.final_placement, 0);
	const hasStoreLinks = Boolean(appStoreUrl || playStoreUrl);

	return (
		<div
			className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/80 p-4 backdrop-blur-sm"
			role="dialog"
			aria-modal="true"
			aria-label={`${win.username ?? "Player"} contest result`}
		>
			<div className="relative w-full max-w-md">
				<button
					type="button"
					onClick={() => setOpen(false)}
					aria-label="Close"
					className="press-scale absolute -top-3 -right-3 z-10 flex h-9 w-9 items-center justify-center rounded-full border border-[var(--color-hairline)] bg-[var(--color-panel)] text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
				>
					<span className="text-lg leading-none">×</span>
				</button>

				<div className="overflow-hidden rounded-[var(--radius-panel)] border border-[var(--color-hairline)] bg-[var(--color-panel)]">
					{/* Card body */}
					<div className="flex flex-col items-center px-6 pt-8 pb-6 text-center">
						<div className="text-eyebrow text-[var(--color-spine)]">{badge}</div>

						<h2 className="mt-3 text-xl font-extrabold text-[var(--color-text)]">
							{win.contest_name}
						</h2>

						<div className="text-section mt-6 text-[var(--color-text-muted)]">FINAL RANK</div>
						<div className="flex items-start justify-center">
							<span className="text-bignum text-[var(--color-text)]">{rankNum}</span>
							<span className="mt-2 text-2xl font-black text-[var(--color-spine)]">
								{rankSuffix}
							</span>
						</div>

						{showPayout ? (
							<div className="mt-4">
								<div className="text-section text-[var(--color-text-muted)]">TOTAL PAYOUT</div>
								<div className="mt-1 text-3xl font-black text-[var(--color-spine)]">
									{usd(win.prize_amount)}
								</div>
							</div>
						) : null}
					</div>

					{/* PnL / stat strip */}
					<div className="grid grid-cols-3 border-t border-[var(--color-hairline)] text-center">
						<div className="border-r border-[var(--color-hairline)] px-3 py-4">
							<div className="text-[11px] uppercase tracking-wider text-[var(--color-text-muted)]">
								PnL
							</div>
							<div
								className={`tabular mt-1 text-[15px] font-bold ${win.pnl >= 0 ? "text-[var(--color-spine)]" : "text-[var(--color-risk)]"}`}
							>
								{money(win.pnl)}
							</div>
						</div>
						<div className="border-r border-[var(--color-hairline)] px-3 py-4">
							<div className="text-[11px] uppercase tracking-wider text-[var(--color-text-muted)]">
								Entry
							</div>
							<div className="tabular mt-1 text-[15px] font-bold text-[var(--color-text)]">
								{usd(win.entry_fee)}
							</div>
						</div>
						<div className="px-3 py-4">
							<div className="text-[11px] uppercase tracking-wider text-[var(--color-text-muted)]">
								Outlasted
							</div>
							<div className="tabular mt-1 text-[15px] font-bold text-[var(--color-text)]">
								{survivorsOutlasted.toLocaleString()}
							</div>
						</div>
					</div>

					{/* CTA */}
					<div className="flex flex-col gap-3 border-t border-[var(--color-hairline)] px-6 py-6">
						<div className="flex items-center justify-center">
							<Wordmark size="sm" />
						</div>
						<p className="text-center text-[13px] text-[var(--color-text-muted)]">
							Think you can beat @{win.username}? Play live survivor contests on Speed Survivor.
						</p>
						{hasStoreLinks ? (
							<div className="flex flex-col gap-2 sm:flex-row">
								{appStoreUrl ? (
									<a
										href={appStoreUrl}
										target="_blank"
										rel="noreferrer"
										className="press-scale text-cta flex flex-1 items-center justify-center rounded-[var(--radius-button)] bg-[var(--color-spine)] px-4 py-3 text-[var(--color-ink)]"
									>
										App Store
									</a>
								) : null}
								{playStoreUrl ? (
									<a
										href={playStoreUrl}
										target="_blank"
										rel="noreferrer"
										className={`press-scale text-cta flex flex-1 items-center justify-center rounded-[var(--radius-button)] px-4 py-3 ${appStoreUrl ? "border border-[var(--color-hairline)] text-[var(--color-text)]" : "bg-[var(--color-spine)] text-[var(--color-ink)]"}`}
									>
										Google Play
									</a>
								) : null}
							</div>
						) : (
							<div className="press-scale text-cta flex items-center justify-center rounded-[var(--radius-button)] bg-[var(--color-spine)] px-4 py-3 text-[var(--color-ink)]">
								Download Speed Survivor
							</div>
						)}
						<button
							type="button"
							onClick={() => setOpen(false)}
							className="text-[13px] text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text)]"
						>
							View @{win.username}&apos;s profile
						</button>
					</div>
				</div>
			</div>
		</div>
	);
}
