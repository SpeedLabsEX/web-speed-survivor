/**
 * Centralized env access with sensible defaults for local development.
 *
 * Public vars (NEXT_PUBLIC_*) are inlined by Next.js at build time and are
 * safe to read in the browser. Server-only vars are accessed via env.server.*
 * which throws if you try to use them client-side.
 */

function requirePublic(name: string, value: string | undefined, fallback?: string): string {
	if (value && value.length > 0) return value;
	if (fallback !== undefined) return fallback;
	throw new Error(
		`Missing required public env var ${name}. Set it in .env.local before running.`,
	);
}

export const env = {
	apiBaseUrl: requirePublic(
		"NEXT_PUBLIC_API_BASE_URL",
		process.env.NEXT_PUBLIC_API_BASE_URL,
		// Default matches mobile-speed-survivor/src/config/env.ts FALLBACK_API_URL.
		// Override locally with NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
		// (or wherever your api-speed-survivor instance runs) in .env.local.
		"https://speed-survivor-api-3xewp.ondigitalocean.app",
	),
	appUrl: requirePublic(
		"NEXT_PUBLIC_APP_URL",
		process.env.NEXT_PUBLIC_APP_URL,
		"http://localhost:8081",
	),
	firebase: {
		apiKey: requirePublic(
			"NEXT_PUBLIC_FIREBASE_API_KEY",
			process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
			"AIzaSyDP4q2W66YcUURmyZA3dYW3E1BZ7ISjLmk",
		),
		authDomain: requirePublic(
			"NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
			process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
			"speed-labs-198e6.firebaseapp.com",
		),
		projectId: requirePublic(
			"NEXT_PUBLIC_FIREBASE_PROJECT_ID",
			process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
			"speed-labs-198e6",
		),
		storageBucket: requirePublic(
			"NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET",
			process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
			"speed-labs-198e6.firebasestorage.app",
		),
		messagingSenderId: requirePublic(
			"NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID",
			process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
			"347026101112",
		),
		appId: requirePublic(
			"NEXT_PUBLIC_FIREBASE_APP_ID",
			process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
			"1:347026101112:web:050f2b31ac282d3362ae8d",
		),
		measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
	},
	coinflow: {
		env: (process.env.NEXT_PUBLIC_COINFLOW_ENV ?? "sandbox") as
			| "sandbox"
			| "prod",
		merchantId:
			process.env.NEXT_PUBLIC_COINFLOW_MERCHANT_ID ?? "speedsurvivor",
	},
	features: {
		enable1CentTest: process.env.NEXT_PUBLIC_ENABLE_TEST_1_CENT === "true",
		withdrawals: process.env.NEXT_PUBLIC_FEATURE_WITHDRAWALS === "true",
	},
} as const;

/**
 * Server-only env. Throws if accessed from the browser bundle so leaks are
 * loud rather than silent.
 */
export const serverEnv = {
	get coinflowApiKey(): string {
		if (typeof window !== "undefined") {
			throw new Error(
				"serverEnv.coinflowApiKey accessed in the browser. This is a leak.",
			);
		}
		const value = process.env.COINFLOW_API_KEY;
		if (!value) {
			throw new Error(
				"COINFLOW_API_KEY is not set. Required for /api/coinflow/* route handlers.",
			);
		}
		return value;
	},
	get appJwtSharedSecret(): string | undefined {
		if (typeof window !== "undefined") {
			throw new Error(
				"serverEnv.appJwtSharedSecret accessed in the browser. This is a leak.",
			);
		}
		return process.env.APP_JWT_SHARED_SECRET || undefined;
	},
};

/** Coinflow REST base URL — selects sandbox vs prod based on NEXT_PUBLIC_COINFLOW_ENV. */
export function coinflowApiBaseUrl(): string {
	return env.coinflow.env === "sandbox"
		? "https://api-sandbox.coinflow.cash"
		: "https://api.coinflow.cash";
}
