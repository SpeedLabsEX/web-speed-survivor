"use client";

import { useState } from "react";

import type { PublicWinResponse } from "@/lib/api-types";
import { ordinalParts, usd, winBadge } from "@/lib/win";

interface WinCardModalProps {
	win: PublicWinResponse;
	appStoreUrl: string;
	playStoreUrl: string;
}

const GREEN = "#00E59B";
// Heading face used across the brand (matches the mobile card's web font).
const HEADING = "var(--font-grotesk), system-ui, sans-serif";

/**
 * Popup shown over the public profile when a shared win link is opened
 * (/u/:username?win=:contestUuid). The hero recreates the mobile "You Won"
 * share image exactly (solid green card, black text, black logo); a separate
 * panel beneath it carries the download CTA. Dismissible to reveal the profile.
 */
export function WinCardModal({ win, appStoreUrl, playStoreUrl }: WinCardModalProps) {
	const [open, setOpen] = useState(true);
	if (!open) return null;

	const badge = winBadge(win);
	const [rankNum, rankSuffix] = ordinalParts(win.final_placement);
	const showPayout = win.is_winner && win.prize_amount > 0;
	const hasStoreLinks = Boolean(appStoreUrl || playStoreUrl);

	return (
		<div
			className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/80 p-4 backdrop-blur-sm"
			role="dialog"
			aria-modal="true"
			aria-label={`${win.username ?? "Player"} contest result`}
		>
			<div className="relative w-full max-w-[400px]">
				<button
					type="button"
					onClick={() => setOpen(false)}
					aria-label="Close"
					className="press-scale absolute -top-3 -right-3 z-10 flex h-9 w-9 items-center justify-center rounded-full border border-[var(--color-hairline)] bg-[var(--color-panel)] text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
				>
					<span className="text-lg leading-none">×</span>
				</button>

				{/* Green share card — identical to the mobile share image */}
				<div
					style={{
						background: GREEN,
						fontFamily: HEADING,
						aspectRatio: "1 / 1",
						borderRadius: 20,
						padding: "20px 28px",
					}}
					className="flex flex-col items-center justify-center overflow-hidden text-center"
				>
					<div
						style={{
							fontSize: 14,
							fontWeight: 700,
							color: "rgba(0,0,0,0.7)",
							textTransform: "uppercase",
							letterSpacing: 1.6,
							marginBottom: 6,
						}}
					>
						{badge}
					</div>

					<div
						style={{
							fontSize: 20,
							fontWeight: 700,
							color: "#000",
							textTransform: "uppercase",
							letterSpacing: -1,
							marginBottom: 16,
						}}
					>
						{win.contest_name}
					</div>

					<div
						style={{
							fontSize: 10,
							fontWeight: 900,
							color: "rgba(0,0,0,0.4)",
							textTransform: "uppercase",
							letterSpacing: 4,
							marginBottom: 2,
						}}
					>
						FINAL RANK
					</div>
					<div className="flex items-start justify-center" style={{ color: "#000" }}>
						<span style={{ fontSize: 88, fontWeight: 700, lineHeight: "94px", letterSpacing: -4.4 }}>
							{rankNum}
						</span>
						<span style={{ fontSize: 28, fontWeight: 700, letterSpacing: -1.4, marginTop: 10, marginLeft: 3 }}>
							{rankSuffix}
						</span>
					</div>

					{showPayout ? (
						<div className="flex flex-col items-center" style={{ marginTop: 12 }}>
							<div
								style={{
									fontSize: 9,
									fontWeight: 700,
									color: "rgba(0,0,0,0.6)",
									textTransform: "uppercase",
									letterSpacing: 2.7,
									marginBottom: 2,
								}}
							>
								TOTAL PAYOUT
							</div>
							<div style={{ fontSize: 40, fontWeight: 700, color: "#000", letterSpacing: -2 }}>
								{usd(win.prize_amount)}
							</div>
						</div>
					) : null}

					{/* eslint-disable-next-line @next/next/no-img-element */}
					<img
						src="/brand/logo-header-black.png"
						alt="Speed Survivor"
						width={150}
						height={50}
						style={{ marginTop: 16 }}
						draggable={false}
					/>
				</div>

				{/* CTA panel — separate from the card so the card stays identical */}
				<div className="mt-3 flex flex-col gap-3 rounded-[var(--radius-panel)] border border-[var(--color-hairline)] bg-[var(--color-panel)] px-5 py-5">
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
	);
}
