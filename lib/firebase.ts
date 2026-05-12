"use client";

import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";

import { env } from "./env";

const firebaseConfig = {
	apiKey: env.firebase.apiKey,
	authDomain: env.firebase.authDomain,
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
