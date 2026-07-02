"use client";

import {
	CoinflowPurchase,
	type MerchantTheme,
} from "@coinflowlabs/react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { Spinner } from "@/components/ui/Spinner";
import { buildWalletTopUpCart } from "@/lib/coinflow-cart";
import { cn } from "@/lib/cn";
import { env } from "@/lib/env";

export interface CoinflowEmbedProps {
	sessionKey: string;
	accountUuid: string;
	email: string | null;
	subtotalCents: number;
	packageId: string;
	webhookInfo?: Record<string, unknown>;
	onSuccess: (paymentId: string) => void;
}

const THEME: MerchantTheme = {
	primary: "#00e59b",
	background: "#0a0a0a",
	backgroundAccent: "#171717",
	backgroundAccent2: "#1f1f1f",
	textColor: "#fafafa",
	textColorAccent: "#a3a3a3",
	textColorAction: "#0a0a0a",
	ctaColor: "#00e59b",
	font: "Geist, system-ui, sans-serif",
};

// Floor for the loader / picker state. Coinflow's payment-method picker
// renders ~480px tall; setting a small floor prevents a visible jump when
// handleHeightChange first reports a real value.
export const MIN_EMBED_HEIGHT = 520;

// If the SDK never reports a height (network hiccup, iframe error UI), drop
// the overlay anyway so Coinflow's own error state isn't hidden behind it.
const OVERLAY_FAILSAFE_MS = 10_000;

export function CoinflowEmbed({
	sessionKey,
	accountUuid,
	email,
	subtotalCents,
	packageId,
	webhookInfo,
	onSuccess,
}: CoinflowEmbedProps) {
	const [iframeHeight, setIframeHeight] = useState<number | null>(null);
	const [ready, setReady] = useState(false);

	useEffect(() => {
		if (ready) return;
		const timer = window.setTimeout(() => setReady(true), OVERLAY_FAILSAFE_MS);
		return () => window.clearTimeout(timer);
	}, [ready]);

	const handleSuccess = useCallback(
		(args: { paymentId: string; hash?: string } | string) => {
			const paymentId =
				typeof args === "string" ? args : args.paymentId ?? "unknown";
			onSuccess(paymentId);
		},
		[onSuccess],
	);

	const handleHeightChange = useCallback((value: string) => {
		// SDK reports the iframe content height as a CSS string like "612px".
		// The first report means the checkout has rendered — spinner comes off.
		const px = Number.parseFloat(String(value).replace(/[^\d.]/g, ""));
		if (Number.isFinite(px) && px > 0) {
			setIframeHeight(Math.ceil(px));
			setReady(true);
		}
	}, []);

	const renderedHeight = Math.max(iframeHeight ?? 0, MIN_EMBED_HEIGHT);

	const chargebackProtectionData = useMemo(
		() => buildWalletTopUpCart({ subtotalCents, packageId, accountUuid }),
		[subtotalCents, packageId, accountUuid],
	);

	return (
		<div
			className="relative overflow-hidden rounded-[var(--radius-panel)] border border-[var(--color-hairline)] bg-[var(--color-panel)] transition-[height] duration-200"
			style={{ height: renderedHeight }}
		>
			<CoinflowPurchase
				merchantId={env.coinflow.merchantId}
				env={env.coinflow.env}
				sessionKey={sessionKey}
				blockchain="solana"
				settlementType={"USDC" as never}
				email={email ?? undefined}
				subtotal={{ currency: "USD" as never, cents: subtotalCents }}
				chargebackProtectionData={chargebackProtectionData}
				webhookInfo={{
					userId: accountUuid,
					packageId,
					coins: subtotalCents,
					bonus: 0,
					...(webhookInfo ?? {}),
				}}
				theme={THEME}
				loaderBackground="#0a0a0a"
				handleHeightChange={handleHeightChange}
				onSuccess={handleSuccess}
			/>

			<div
				aria-hidden={ready}
				className={cn(
					"absolute inset-0 z-10 flex flex-col items-center justify-center gap-4",
					"bg-[var(--color-panel)] transition-opacity duration-300",
					ready ? "pointer-events-none opacity-0" : "opacity-100",
				)}
			>
				<Spinner size={28} />
				<span className="text-eyebrow">Secure checkout</span>
			</div>
		</div>
	);
}
