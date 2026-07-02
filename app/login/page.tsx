"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { preconnect } from "react-dom";

import { GoogleIcon } from "@/components/auth/GoogleIcon";
import { AuthShell, OrDivider } from "@/components/auth/AuthShell";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Spinner } from "@/components/ui/Spinner";
import { preloadFirebase, useAuth } from "@/lib/auth-context";

const NO_ACCOUNT_MESSAGE =
	"No account found for this login. Sign up in the Speed Survivor app first.";

function friendlyError(err: unknown): string {
	const msg = err instanceof Error ? err.message : String(err);
	if (msg.includes("auth/wrong-password") || msg.includes("auth/invalid-credential")) {
		return "Incorrect email or password.";
	}
	if (msg.includes("auth/user-not-found")) {
		return NO_ACCOUNT_MESSAGE;
	}
	if (msg.includes("auth/too-many-requests")) {
		return "Too many attempts. Try again in a few minutes.";
	}
	if (msg.includes("auth/unauthorized-domain")) {
		return "This domain isn't authorized in Firebase. Add it under Authentication → Settings → Authorized domains.";
	}
	if (msg.includes("auth/operation-not-allowed")) {
		return "Google sign-in isn't enabled for this Firebase project. Enable it under Authentication → Sign-in method.";
	}
	if (msg.includes("auth/popup-blocked")) {
		return "Your browser blocked the sign-in popup. We're retrying with a redirect.";
	}
	// Upstream /api/v1/auth/login returns 401 when the Firebase user has
	// never registered with the Speed API. Translate that to a sign-up CTA
	// rather than a raw "Unauthorized".
	if (
		msg.includes("Unauthorized") ||
		msg.includes("not found") ||
		msg.includes("Request failed (401)")
	) {
		return NO_ACCOUNT_MESSAGE;
	}
	return msg.replace(/^Firebase:\s*/, "");
}

function LoginForm() {
	// Firebase Auth's REST backend — warm the connection before the first
	// sign-in call.
	preconnect("https://identitytoolkit.googleapis.com");
	const router = useRouter();
	const params = useSearchParams();
	const { status, loginWithEmail, loginWithGoogle } = useAuth();
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [loadingMode, setLoadingMode] = useState<"email" | "google" | null>(null);

	const next = params.get("next") || "/wallet";

	// Login is the one page that needs Firebase — fetch the lazy chunk now so
	// the first sign-in click doesn't wait on it.
	useEffect(() => {
		preloadFirebase();
	}, []);

	useEffect(() => {
		if (status === "authenticated") {
			router.replace(next);
		}
	}, [status, router, next]);

	const onEmailSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (loadingMode) return;
		if (!email || !password) {
			setError("Enter your email and password.");
			return;
		}
		setError(null);
		setLoadingMode("email");
		try {
			await loginWithEmail(email.trim(), password);
			router.replace(next);
		} catch (err) {
			setError(friendlyError(err));
		} finally {
			setLoadingMode(null);
		}
	};

	const onGoogle = async () => {
		if (loadingMode) return;
		setError(null);
		setLoadingMode("google");
		try {
			await loginWithGoogle();
			router.replace(next);
		} catch (err) {
			setError(friendlyError(err));
		} finally {
			setLoadingMode(null);
		}
	};

	return (
		<AuthShell
			title="Welcome back."
			footer={
				<>
					New here? Create your account in the{" "}
					<span className="text-[var(--color-text)]">Speed Survivor</span> app
					first.
				</>
			}
		>
			{error ? <Alert tone="error">{error}</Alert> : null}

			<form className="flex flex-col gap-3" onSubmit={onEmailSubmit}>
				<Input
					type="email"
					autoComplete="email"
					placeholder="Email"
					value={email}
					onChange={(e) => setEmail(e.target.value)}
					disabled={loadingMode !== null}
					required
				/>
				<Input
					type="password"
					autoComplete="current-password"
					placeholder="Password"
					value={password}
					onChange={(e) => setPassword(e.target.value)}
					disabled={loadingMode !== null}
					required
				/>
				<Button
					type="submit"
					variant="primary"
					size="lg"
					loading={loadingMode === "email"}
					disabled={loadingMode !== null}
					className="mt-1"
				>
					Sign in
				</Button>
			</form>

			<OrDivider />

			<Button
				type="button"
				variant="ghost"
				size="lg"
				onClick={onGoogle}
				loading={loadingMode === "google"}
				disabled={loadingMode !== null}
			>
				<GoogleIcon />
				Continue with Google
			</Button>
		</AuthShell>
	);
}

export default function LoginPage() {
	return (
		<Suspense
			fallback={
				<div className="flex min-h-screen items-center justify-center">
					<Spinner size={28} />
				</div>
			}
		>
			<LoginForm />
		</Suspense>
	);
}
