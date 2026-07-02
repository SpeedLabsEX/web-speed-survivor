import type { NextConfig } from "next";

// The Firebase-hosted auth helper origin. We reverse-proxy its `/__/auth/*`
// and `/__/firebase/*` endpoints (see `rewrites` below) so the entire Google
// OAuth handshake runs on our own origin. Keeping it same-origin is what
// prevents mobile browsers (Safari ITP / Chrome storage partitioning) from
// dropping signInWithRedirect's sessionStorage and throwing "missing initial
// state". Paired with `authDomain = window.location.host` in lib/firebase.ts.
const FIREBASE_AUTH_DOMAIN =
	process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "speed-labs-198e6.firebaseapp.com";

const nextConfig: NextConfig = {
	reactStrictMode: true,
	poweredByHeader: false,
	// Emit a self-contained `.next/standalone/` server bundle so the Docker
	// production image only needs the runtime, not the full node_modules.
	// Cuts the final image from ~800 MB → ~180 MB. The Dockerfile copies
	// `.next/standalone`, `.next/static`, and `public` into the runtime stage.
	output: "standalone",
	async rewrites() {
		return [
			{
				source: "/__/auth/:path*",
				destination: `https://${FIREBASE_AUTH_DOMAIN}/__/auth/:path*`,
			},
			{
				source: "/__/firebase/:path*",
				destination: `https://${FIREBASE_AUTH_DOMAIN}/__/firebase/:path*`,
			},
		];
	},
	async headers() {
		return [
			{
				// Exclude the proxied Firebase auth paths (`/__/...`) from the
				// framing-blocking headers below. The auth resolver loads
				// `<authDomain>/__/auth/iframe` in an iframe; now that authDomain is
				// our own host, `X-Frame-Options: DENY` would block that same-origin
				// frame and break Google sign-in. Firebase serves its own security
				// headers for these paths, so we simply don't override them here.
				source: "/((?!__/).*)",
				headers: [
					{ key: "X-Content-Type-Options", value: "nosniff" },
					{ key: "X-Frame-Options", value: "DENY" },
					{ key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
					// Required for Firebase signInWithPopup() — the popup at
					// <authDomain>/__/auth/handler needs to postMessage back to the
					// opener window. `same-origin` blocks this; `same-origin-allow-popups`
					// keeps process isolation but permits the popup handshake.
					{ key: "Cross-Origin-Opener-Policy", value: "same-origin-allow-popups" },
				],
			},
		];
	},
};

export default nextConfig;
