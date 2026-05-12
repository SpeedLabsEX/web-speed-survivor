import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	reactStrictMode: true,
	// Emit a self-contained `.next/standalone/` server bundle so the Docker
	// production image only needs the runtime, not the full node_modules.
	// Cuts the final image from ~800 MB → ~180 MB. The Dockerfile copies
	// `.next/standalone`, `.next/static`, and `public` into the runtime stage.
	output: "standalone",
	async headers() {
		return [
			{
				source: "/:path*",
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
