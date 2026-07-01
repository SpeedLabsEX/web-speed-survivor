"use client";

import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";

import { env } from "./env";

/**
 * Resolve the Firebase `authDomain`.
 *
 * In the browser we deliberately use the app's own host instead of the
 * project's `*.firebaseapp.com` domain. Combined with the `/__/auth/*` and
 * `/__/firebase/*` reverse proxy in `next.config.ts`, this keeps the entire
 * Google OAuth handshake (iframe + redirect handler) same-origin.
 *
 * Why it matters: `signInWithRedirect` stashes "initial state" in
 * `sessionStorage` on our origin before bouncing to the auth handler. When the
 * handler lives on a different domain, mobile browsers with storage
 * partitioning (Safari ITP, Chrome third-party storage) drop that state, and
 * the redirect returns with "Unable to process request due to missing initial
 * state." Desktop never hits this because popups succeed there. Serving the
 * handler from our own host fixes the mobile redirect path.
 *
 * Note: the app's host must be listed under Firebase Auth → Settings →
 * Authorized domains (it already is, since desktop popup sign-in works).
 */
function resolveAuthDomain(): string {
	if (typeof window !== "undefined") {
		return window.location.host;
	}
	return env.firebase.authDomain;
}

const firebaseConfig = {
	apiKey: env.firebase.apiKey,
	authDomain: resolveAuthDomain(),
	projectId: env.firebase.projectId,
	storageBucket: env.firebase.storageBucket,
	messagingSenderId: env.firebase.messagingSenderId,
	appId: env.firebase.appId,
	measurementId: env.firebase.measurementId,
} as const;

let app: FirebaseApp | null = null;
let authInstance: Auth | null = null;

export function getFirebaseApp(): FirebaseApp {
	if (app) return app;
	app = getApps()[0] ?? initializeApp(firebaseConfig);
	return app;
}

export function getFirebaseAuth(): Auth {
	if (authInstance) return authInstance;
	authInstance = getAuth(getFirebaseApp());
	return authInstance;
}
