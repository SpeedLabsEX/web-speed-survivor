"use client";

import type { AuthError } from "firebase/auth";
import { useRouter } from "next/navigation";
import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useState,
	type ReactNode,
} from "react";

type AuthStatus = "loading" | "authenticated" | "unauthenticated";

export interface AuthMe {
	accountUuid: string;
	firebaseUid: string | null;
	email: string | null;
}

interface AuthContextValue {
	status: AuthStatus;
	me: AuthMe | null;
	error: string | null;
	loginWithEmail: (email: string, password: string) => Promise<void>;
	loginWithGoogle: () => Promise<void>;
	logout: () => Promise<void>;
	refreshMe: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
	const ctx = useContext(AuthContext);
	if (!ctx) throw new Error("useAuth must be used within AuthProvider");
	return ctx;
}

/**
 * Firebase is only needed to acquire credentials (login, redirect results).
 * Loading it lazily keeps the ~90 KB firebase/auth chunk out of every page's
 * critical path — authenticated users never download it at all.
 */
async function loadFirebase() {
	const [{ getFirebaseAuth }, authModule] = await Promise.all([
		import("./firebase"),
		import("firebase/auth"),
	]);
	return { auth: getFirebaseAuth(), authModule };
}

/** Warm the firebase chunk (e.g. on the login page) so the first click is fast. */
export function preloadFirebase(): void {
	void loadFirebase().catch(() => {
		// Best-effort prefetch; real errors surface on the actual login call.
	});
}

/**
 * signInWithRedirect stashes a `firebase:pendingRedirect:<apiKey>:<app>` flag
 * in sessionStorage before navigating away. Its presence is the only case
 * where we must initialize Firebase before resolving the session — everywhere
 * else the httpOnly cookie is the source of truth.
 */
function hasPendingRedirect(): boolean {
	try {
		for (let i = 0; i < window.sessionStorage.length; i++) {
			if (window.sessionStorage.key(i)?.startsWith("firebase:pendingRedirect")) {
				return true;
			}
		}
	} catch {
		// Storage access can throw in some privacy modes; treat as no redirect.
	}
	return false;
}

/**
 * Pull the most actionable bit out of a Firebase Auth error. The default
 * `Firebase: <message> (auth/<code>).` form buries the code at the end;
 * we lift it to the front so a misconfigured project or unauthorized
 * domain is immediately diagnosable instead of looking like "user
 * cancelled".
 */
function formatFirebaseError(err: unknown): string {
	const e = err as Partial<AuthError> & { message?: string };
	const code = e?.code;
	const message = e?.message?.replace(/^Firebase:\s*/, "") ?? String(err);
	if (code) return `[${code}] ${message}`;
	return message;
}

async function postJson<T>(url: string, body?: unknown): Promise<T> {
	const res = await fetch(url, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: body !== undefined ? JSON.stringify(body) : undefined,
		credentials: "same-origin",
	});
	const text = await res.text();
	const parsed = text ? JSON.parse(text) : undefined;
	if (!res.ok) {
		const detail =
			parsed && typeof parsed === "object" && "error" in parsed
				? String((parsed as { error: unknown }).error)
				: res.statusText;
		throw new Error(detail || `Request failed (${res.status})`);
	}
	return parsed as T;
}

interface SessionPayload {
	me: AuthMe | null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
	const router = useRouter();
	const [status, setStatus] = useState<AuthStatus>("loading");
	const [me, setMe] = useState<AuthMe | null>(null);
	const [error, setError] = useState<string | null>(null);

	const refreshMe = useCallback(async () => {
		try {
			const res = await fetch("/api/auth/me", { credentials: "same-origin" });
			if (res.status === 401) {
				setMe(null);
				setStatus("unauthenticated");
				return;
			}
			const data = (await res.json()) as SessionPayload;
			setMe(data.me);
			setStatus(data.me ? "authenticated" : "unauthenticated");
		} catch {
			setMe(null);
			setStatus("unauthenticated");
		}
	}, []);

	const exchangeAndStore = useCallback(
		async (idToken: string): Promise<void> => {
			const data = await postJson<SessionPayload>("/api/auth/session", {
				idToken,
			});
			setMe(data.me);
			setStatus(data.me ? "authenticated" : "unauthenticated");
		},
		[],
	);

	useEffect(() => {
		// Resolve the session from the httpOnly cookie straight away. Firebase
		// only enters the picture when a signInWithRedirect round-trip is in
		// flight (popup-blocked fallback, mobile Safari): then we must exchange
		// the redirect credential for an app JWT before falling back to
		// refreshMe.
		let cancelled = false;
		(async () => {
			if (hasPendingRedirect()) {
				try {
					const { auth, authModule } = await loadFirebase();
					const result = await authModule.getRedirectResult(auth);
					if (cancelled) return;
					if (result?.user) {
						const idToken = await result.user.getIdToken();
						await exchangeAndStore(idToken);
						return;
					}
				} catch (err) {
					if (!cancelled) {
						setError(formatFirebaseError(err));
					}
				}
			}
			if (!cancelled) await refreshMe();
		})();
		return () => {
			cancelled = true;
		};
	}, [refreshMe, exchangeAndStore]);

	const loginWithEmail = useCallback(
		async (email: string, password: string) => {
			setError(null);
			const { auth, authModule } = await loadFirebase();
			const credential = await authModule.signInWithEmailAndPassword(
				auth,
				email,
				password,
			);
			const idToken = await credential.user.getIdToken();
			await exchangeAndStore(idToken);
		},
		[exchangeAndStore],
	);

	const loginWithGoogle = useCallback(async () => {
		setError(null);
		const { auth, authModule } = await loadFirebase();
		const provider = new authModule.GoogleAuthProvider();
		provider.setCustomParameters({ prompt: "select_account" });

		try {
			const result = await authModule.signInWithPopup(auth, provider);
			const idToken = await result.user.getIdToken();
			await exchangeAndStore(idToken);
		} catch (err) {
			const code = (err as AuthError)?.code;
			// Popup-blocked / popup-disallowed-by-browser / blocked by COOP →
			// fall back to full-page redirect. The result is picked up on the
			// next mount via getRedirectResult().
			const popupBlocked =
				code === "auth/popup-blocked" ||
				code === "auth/popup-closed-by-user" ||
				code === "auth/operation-not-supported-in-this-environment" ||
				code === "auth/cancelled-popup-request";
			if (popupBlocked) {
				await authModule.signInWithRedirect(auth, provider);
				return; // browser navigates away; the redirect handler resumes
			}
			throw err;
		}
	}, [exchangeAndStore]);

	const logout = useCallback(async () => {
		try {
			await postJson("/api/auth/logout");
		} finally {
			try {
				const { auth } = await loadFirebase();
				await auth.signOut();
			} catch {
				// ignore
			}
			setMe(null);
			setStatus("unauthenticated");
			router.push("/login");
		}
	}, [router]);

	const value = useMemo<AuthContextValue>(
		() => ({
			status,
			me,
			error,
			loginWithEmail,
			loginWithGoogle,
			logout,
			refreshMe,
		}),
		[
			status,
			me,
			error,
			loginWithEmail,
			loginWithGoogle,
			logout,
			refreshMe,
		],
	);

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
