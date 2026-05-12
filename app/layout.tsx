import type { Metadata, Viewport } from "next";

import { GlowBackdrop } from "@/components/GlowBackdrop";

import { Providers } from "./providers";

import "./globals.css";

export const metadata: Metadata = {
	title: "Speed Survivor — Wallet",
	description:
		"Manage your Speed Survivor wallet. Deposit and withdraw funds, view your transaction history.",
	icons: {
		icon: "/favicon.png",
		apple: "/favicon.png",
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
		<html lang="en">
			<body className="bg-[var(--color-bg-lift)] text-[var(--color-text)] antialiased">
				<GlowBackdrop />
				<div className="relative z-10 min-h-screen">
					<Providers>{children}</Providers>
				</div>
			</body>
		</html>
	);
}
