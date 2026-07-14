"use client";

import {
	CoinflowPurchase,
	type MerchantTheme,
} from "@coinflowlabs/react";
import { memo, useCallback, useMemo, useState } from "react";

import { buildWalletTopUpCart } from "@/lib/coinflow-cart";
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

const StableCoinflowPurchase = memo(CoinflowPurchase);

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
		const px = Number.parseFloat(String(value).replace(/[^\d.]/g, ""));
		if (Number.isFinite(px) && px > 0) {
			setIframeHeight(Math.ceil(px));
		}
	}, []);

	const renderedHeight = Math.max(iframeHeight ?? 0, MIN_EMBED_HEIGHT);

	const chargebackProtectionData = useMemo(
		() => buildWalletTopUpCart({ subtotalCents, packageId, accountUuid }),
		[subtotalCents, packageId, accountUuid],
	);
	const subtotal = useMemo(
		() => ({ currency: "USD" as never, cents: subtotalCents }),
		[subtotalCents],
	);
	const normalizedWebhookInfo = useMemo(
		() => ({
			userId: accountUuid,
			packageId,
			coins: subtotalCents,
			bonus: 0,
			...(webhookInfo ?? {}),
		}),
		[accountUuid, packageId, subtotalCents, webhookInfo],
	);

	return (
		<div
			className="overflow-hidden rounded-[var(--radius-panel)] border border-[var(--color-hairline)] bg-[var(--color-panel)] transition-[height] duration-200"
			style={{ height: renderedHeight }}
		>
			<StableCoinflowPurchase
				merchantId={env.coinflow.merchantId}
				env={env.coinflow.env}
				sessionKey={sessionKey}
				blockchain="solana"
				settlementType={"USDC" as never}
				email={email ?? undefined}
				subtotal={subtotal}
				chargebackProtectionData={chargebackProtectionData}
				webhookInfo={normalizedWebhookInfo}
				theme={THEME}
				loaderBackground="#0a0a0a"
				handleHeightChange={handleHeightChange}
				onSuccess={handleSuccess}
			/>
		</div>
	);
}
