/**
 * Builds the `chargebackProtectionData` cart payload that Coinflow requires
 * when chargeback protection is enabled on the merchant account
 * (which it is for `speedsurvivor`).
 *
 * For wallet top-ups we always send a single `MoneyTopUpCartItem`:
 *   - sellingPrice and topUpAmount are equal (1:1 USD → wallet credit)
 *   - quantity is 1
 *   - isPresetAmount is true for fixed packages, false for custom amounts
 *
 * The cart item uses major currency units (e.g. 50 for $50.00), unlike the
 * `subtotal` prop which uses cents — yes, the SDK is inconsistent.
 */

export interface WalletTopUpCartParams {
	subtotalCents: number;
	packageId: string;
	accountUuid: string;
}

export function buildWalletTopUpCart(params: WalletTopUpCartParams) {
	const dollars = Number((params.subtotalCents / 100).toFixed(2));
	const amount = { valueInCurrency: dollars, currency: "USD" };

	return [
		{
			itemClass: "moneyTopUp" as const,
			id: params.packageId,
			sellingPrice: amount,
			topUpAmount: amount,
			quantity: 1,
			isPresetAmount: params.packageId !== "custom",
			rawProductData: {
				description: "Speed Survivor Wallet Deposit",
				accountUuid: params.accountUuid,
				packageId: params.packageId,
			},
		},
	];
}
