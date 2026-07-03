import { readFile } from "node:fs/promises";
import path from "node:path";

import { ImageResponse } from "next/og";

import { ordinalParts, usd, winBadge } from "@/lib/win";
import { fetchWin } from "@/lib/win-server";

// 1200x630 is the canonical Open Graph / Twitter summary_large_image size.
const WIDTH = 1200;
const HEIGHT = 630;

// Brand green share card — matches the mobile "You Won" share image: solid
// #00E59B fill, black text, black logo.
const GREEN = "#00E59B";
const INK = "#000000";
const INK_70 = "rgba(0,0,0,0.7)";
const INK_60 = "rgba(0,0,0,0.6)";
const INK_40 = "rgba(0,0,0,0.4)";

/**
 * Load a Google font as TTF for satori (which can't parse woff2). Uses a
 * legacy User-Agent so Google serves truetype. Best-effort: returns null on
 * failure and the image falls back to satori's default sans.
 */
/** Read the black logo off disk and return it as a base64 data URI. */
async function loadLogoDataUri(): Promise<string | null> {
	try {
		const file = path.join(process.cwd(), "public", "brand", "logo-header-black.png");
		const bytes = await readFile(file);
		return `data:image/png;base64,${bytes.toString("base64")}`;
	} catch {
		return null;
	}
}

async function loadGoogleFont(family: string, weight: number): Promise<ArrayBuffer | null> {
	// Hard timeout so a slow/unreachable font CDN never hangs image generation.
	const withTimeout = (input: string, init?: RequestInit) => {
		const ctrl = new AbortController();
		const t = setTimeout(() => ctrl.abort(), 2500);
		return fetch(input, { ...init, signal: ctrl.signal }).finally(() => clearTimeout(t));
	};
	try {
		const url = `https://fonts.googleapis.com/css2?family=${family.replace(/ /g, "+")}:wght@${weight}`;
		const css = await (
			await withTimeout(url, {
				headers: { "User-Agent": "Mozilla/4.0 (compatible; MSIE 6.0; Windows NT 5.1)" },
			})
		).text();
		const match = css.match(/src:\s*url\(([^)]+)\)\s*format\('(?:truetype|opentype)'\)/);
		if (!match) return null;
		return await (await withTimeout(match[1])).arrayBuffer();
	} catch {
		return null;
	}
}

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

	const font = await loadGoogleFont("Space Grotesk", 700);
	const fonts = font
		? [{ name: "Space Grotesk", data: font, weight: 700 as const, style: "normal" as const }]
		: undefined;
	const fontFamily = '"Space Grotesk", sans-serif';

	// Embed the black logo as a data URI. satori can't reliably fetch an image
	// URL from the same server mid-request, so read it off disk instead.
	const logoBlack = await loadLogoDataUri();

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
						background: GREEN,
						fontFamily,
					}}
				>
					{logoBlack ? (
						// eslint-disable-next-line @next/next/no-img-element
						<img src={logoBlack} width={420} height={139} alt="Speed Survivor" />
					) : null}
				</div>
			),
			{ width: WIDTH, height: HEIGHT, fonts },
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
					flexDirection: "column",
					alignItems: "center",
					justifyContent: "center",
					gap: 18,
					background: GREEN,
					fontFamily,
					padding: "40px 64px",
				}}
			>
				{/* Badge + contest */}
				<div
					style={{
						display: "flex",
						flexDirection: "column",
						alignItems: "center",
						gap: 6,
					}}
				>
					<div
						style={{
							display: "flex",
							fontSize: 26,
							fontWeight: 700,
							letterSpacing: 4,
							color: INK_70,
							textTransform: "uppercase",
						}}
					>
						{badge}
					</div>
					<div
						style={{
							display: "flex",
							fontSize: 40,
							fontWeight: 700,
							letterSpacing: -1,
							color: INK,
							textTransform: "uppercase",
							textAlign: "center",
						}}
					>
						{win.contest_name}
					</div>
				</div>

				{/* Final rank */}
				<div
					style={{
						display: "flex",
						flexDirection: "column",
						alignItems: "center",
						gap: 2,
					}}
				>
					<div
						style={{
							display: "flex",
							fontSize: 18,
							fontWeight: 700,
							letterSpacing: 8,
							color: INK_40,
							textTransform: "uppercase",
						}}
					>
						FINAL RANK
					</div>
					<div style={{ display: "flex", alignItems: "flex-start", color: INK }}>
						<div style={{ display: "flex", fontSize: 150, fontWeight: 700, lineHeight: 1, letterSpacing: -7 }}>
							{rankNum}
						</div>
						<div style={{ display: "flex", fontSize: 52, fontWeight: 700, marginTop: 20, marginLeft: 4 }}>
							{rankSuffix}
						</div>
					</div>
				</div>

				{/* Total payout */}
				{showPayout ? (
					<div
						style={{
							display: "flex",
							flexDirection: "column",
							alignItems: "center",
							gap: 2,
						}}
					>
						<div
							style={{
								display: "flex",
								fontSize: 16,
								fontWeight: 700,
								letterSpacing: 5,
								color: INK_60,
								textTransform: "uppercase",
							}}
						>
							TOTAL PAYOUT
						</div>
						<div style={{ display: "flex", fontSize: 68, fontWeight: 700, letterSpacing: -3, color: INK }}>
							{usd(win.prize_amount)}
						</div>
					</div>
				) : null}

				{/* Wordmark */}
				{logoBlack ? (
					// eslint-disable-next-line @next/next/no-img-element
					<img src={logoBlack} width={216} height={72} alt="Speed Survivor" />
				) : null}
			</div>
		),
		{ width: WIDTH, height: HEIGHT, fonts },
	);
}
