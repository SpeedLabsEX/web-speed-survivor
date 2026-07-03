import { ImageResponse } from "next/og";

import { env } from "@/lib/env";
import { ordinalParts, usd, winBadge } from "@/lib/win";
import { fetchWin } from "@/lib/win-server";

// 1200x630 is the canonical Open Graph / Twitter summary_large_image size.
const WIDTH = 1200;
const HEIGHT = 630;

const BG = "#0a0a0a";
const PANEL = "#141414";
const HAIRLINE = "#262626";
const SPINE = "#00e59b";
const TEXT = "#fafafa";
const TEXT_MUTED = "#a3a3a3";

/**
 * Server-generated share thumbnail recreating the mobile "You Won" share card:
 * badge, contest name, final rank ordinal, and total payout, over the brand
 * stage color. Rendered on demand for link previews (iMessage, X, Discord).
 */
export async function GET(
	_req: Request,
	{ params }: { params: Promise<{ username: string; contestId: string }> },
) {
	const { username, contestId } = await params;

	let win = null;
	try {
		win = await fetchWin(username, contestId);
	} catch {
		win = null;
	}

	const logoSrc = `${env.appUrl}/brand/logo-header-2x.png`;

	// Fallback branded card when the result can't be loaded.
	if (!win) {
		return new ImageResponse(
			(
				<div
					style={{
						width: "100%",
						height: "100%",
						display: "flex",
						flexDirection: "column",
						alignItems: "center",
						justifyContent: "center",
						background: BG,
						color: TEXT,
					}}
				>
					{/* eslint-disable-next-line @next/next/no-img-element */}
					<img src={logoSrc} width={360} height={119} alt="Speed Survivor" />
					<div style={{ marginTop: 32, fontSize: 34, color: TEXT_MUTED }}>
						Real-time survivor contests
					</div>
				</div>
			),
			{ width: WIDTH, height: HEIGHT },
		);
	}

	const badge = winBadge(win);
	const [rankNum, rankSuffix] = ordinalParts(win.final_placement);
	const showPayout = win.is_winner && win.prize_amount > 0;

	return new ImageResponse(
		(
			<div
				style={{
					width: "100%",
					height: "100%",
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
					background: BG,
					padding: 64,
				}}
			>
				<div
					style={{
						display: "flex",
						flexDirection: "column",
						alignItems: "center",
						justifyContent: "center",
						width: "100%",
						height: "100%",
						background: PANEL,
						border: `2px solid ${HAIRLINE}`,
						borderRadius: 32,
						padding: "56px 48px",
					}}
				>
					{/* Badge */}
					<div
						style={{
							display: "flex",
							fontSize: 40,
							fontWeight: 900,
							letterSpacing: 6,
							color: SPINE,
							textTransform: "uppercase",
						}}
					>
						{badge}
					</div>

					{/* Contest name */}
					<div
						style={{
							display: "flex",
							marginTop: 20,
							fontSize: 44,
							fontWeight: 800,
							color: TEXT,
							textAlign: "center",
							maxWidth: 900,
						}}
					>
						{win.contest_name}
					</div>

					{/* Final rank */}
					<div
						style={{
							display: "flex",
							marginTop: 44,
							fontSize: 26,
							fontWeight: 900,
							letterSpacing: 8,
							color: TEXT_MUTED,
						}}
					>
						FINAL RANK
					</div>
					<div
						style={{
							display: "flex",
							alignItems: "flex-start",
							color: TEXT,
						}}
					>
						<div style={{ display: "flex", fontSize: 200, fontWeight: 900, lineHeight: 1 }}>
							{rankNum}
						</div>
						<div
							style={{
								display: "flex",
								fontSize: 72,
								fontWeight: 900,
								marginTop: 28,
								color: SPINE,
							}}
						>
							{rankSuffix}
						</div>
					</div>

					{/* Total payout */}
					{showPayout ? (
						<div
							style={{
								display: "flex",
								flexDirection: "column",
								alignItems: "center",
								marginTop: 12,
							}}
						>
							<div
								style={{
									display: "flex",
									fontSize: 22,
									fontWeight: 900,
									letterSpacing: 6,
									color: TEXT_MUTED,
								}}
							>
								TOTAL PAYOUT
							</div>
							<div
								style={{
									display: "flex",
									fontSize: 76,
									fontWeight: 900,
									color: SPINE,
								}}
							>
								{usd(win.prize_amount)}
							</div>
						</div>
					) : null}

					{/* Wordmark */}
					{/* eslint-disable-next-line @next/next/no-img-element */}
					<img
						src={logoSrc}
						width={216}
						height={71}
						alt="Speed Survivor"
						style={{ marginTop: 40 }}
					/>
				</div>
			</div>
		),
		{ width: WIDTH, height: HEIGHT },
	);
}
