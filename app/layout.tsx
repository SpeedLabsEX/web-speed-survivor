import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";

import { GlowBackdrop } from "@/components/GlowBackdrop";
import { env } from "@/lib/env";

import { Providers } from "./providers";

import "./globals.css";

const geist = localFont({
	src: "../assets/fonts/geist-latin-wght-normal.woff2",
	weight: "100 900",
	display: "swap",
	variable: "--font-geist",
});

const spaceGrotesk = localFont({
	src: "../assets/fonts/space-grotesk-latin-wght-normal.woff2",
	weight: "300 700",
	display: "swap",
	variable: "--font-grotesk",
	// Display face for the big success headlines only — not worth a preload
	// on every page.
	preload: false,
});

export const metadata: Metadata = {
	// Ensures relative Open Graph / Twitter image URLs (e.g. the shared-win
	// thumbnail at /api/og/win/...) resolve to absolute URLs for crawlers.
	metadataBase: new URL(env.appUrl),
	title: "Speed Survivor — Wallet",
	description:
		"Manage your Speed Survivor wallet. Deposit and withdraw funds, view your transaction history.",
	icons: {
		icon: "/favicon.png",
		apple: "/apple-icon.png",
	},
};

export const viewport: Viewport = {
	themeColor: "#000000",
	width: "device-width",
	initialScale: 1,
	maximumScale: 1,
};

export default function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<html lang="en" className={`${geist.variable} ${spaceGrotesk.variable}`}>
			<body className="bg-[var(--color-bg-lift)] text-[var(--color-text)] antialiased">
				<GlowBackdrop />
				<div className="relative z-10 min-h-screen">
					<Providers>{children}</Providers>
				</div>
			</body>
		</html>
	);
}
