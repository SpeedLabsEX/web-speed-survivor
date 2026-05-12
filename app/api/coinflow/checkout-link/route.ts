import { NextResponse, type NextRequest } from "next/server";

import { ApiError, callApi } from "@/lib/apiClient";
import type { MeResponse } from "@/lib/api-types";
import {
	CoinflowError,
	createCoinflowCheckoutLink,
} from "@/lib/coinflow";
import { env } from "@/lib/env";
import {
	clearSessionCookie,
	decodeSessionToken,
	isExpired,
	readSessionToken,
} from "@/lib/session";

interface CheckoutLinkBody {
	subtotalCents: number;
	packageId?: string;
	itemName?: string;
	coins?: number;
	bonus?: number;
}

const MIN_CENTS = 1;
const MAX_CENTS = 1_000_00;

export async function POST(req: NextRequest): Promise<NextResponse> {
	const token = await readSessionToken();
	if (!token) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	const claims = decodeSessionToken(token);
	if (isExpired(claims)) {
		await clearSessionCookie();
		return NextResponse.json({ error: "Session expired" }, { status: 401 });
	}

	let body: CheckoutLinkBody;
	try {
		body = (await req.json()) as CheckoutLinkBody;
	} catch {
		return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
	}

	const cents = Math.round(Number(body.subtotalCents));
	if (!Number.isFinite(cents) || cents < MIN_CENTS || cents > MAX_CENTS) {
		return NextResponse.json(
			{
				error: `subtotalCents must be an integer between ${MIN_CENTS} and ${MAX_CENTS}`,
			},
			{ status: 400 },
		);
	}

	let me: MeResponse;
	try {
		me = await callApi<MeResponse>("/api/v1/me", { token });
	} catch (err) {
		if (err instanceof ApiError && err.status === 401) {
			await clearSessionCookie();
			return NextResponse.json({ error: "Session expired" }, { status: 401 });
		}
		return NextResponse.json(
			{ error: err instanceof Error ? err.message : "Failed to load account" },
			{ status: 502 },
		);
	}

	const accountUuid = me.account.account_uuid;
	if (!accountUuid) {
		return NextResponse.json(
			{ error: "Account UUID missing from /me response" },
			{ status: 500 },
		);
	}

	try {
		const result = await createCoinflowCheckoutLink({
			accountUuid,
			email: me.account.email,
			subtotalCents: cents,
			packageId: body.packageId,
			itemName: body.itemName,
			coins: body.coins,
			bonus: body.bonus,
			successUrl: `${env.appUrl}/wallet/deposit/return?status=success`,
			cancelUrl: `${env.appUrl}/wallet/deposit/return?status=cancel`,
		});
		return NextResponse.json(result);
	} catch (err) {
		if (err instanceof CoinflowError) {
			return NextResponse.json(
				{ error: err.message, detail: err.body },
				{ status: 502 },
			);
		}
		return NextResponse.json(
			{ error: err instanceof Error ? err.message : "Coinflow request failed" },
			{ status: 502 },
		);
	}
}
