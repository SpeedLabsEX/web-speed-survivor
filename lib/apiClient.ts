/**
 * Server-side wrapper around api-speed-survivor.
 *
 * Always called from Route Handlers / server components — never from the
 * browser, because the auth cookie is httpOnly. The browser uses the
 * /api/proxy/* route as its single entry point.
 */

import { env } from "./env";
import { readSessionToken } from "./session";

export class ApiError extends Error {
	readonly status: number;
	readonly body: unknown;

	constructor(message: string, status: number, body: unknown) {
		super(message);
		this.name = "ApiError";
		this.status = status;
		this.body = body;
	}
}

export interface ApiCallOptions {
	method?: "GET" | "POST" | "PATCH" | "DELETE" | "PUT";
	body?: unknown;
	token?: string | null;
	headers?: Record<string, string>;
	cache?: RequestCache;
}

export async function callApi<T>(
	path: string,
	opts: ApiCallOptions = {},
): Promise<T> {
	const token =
		opts.token === undefined ? await readSessionToken() : opts.token;
	const url = `${env.apiBaseUrl}${path.startsWith("/") ? path : `/${path}`}`;

	const res = await fetch(url, {
		method: opts.method ?? "GET",
		headers: {
			"Content-Type": "application/json",
			Accept: "application/json",
			...(token ? { Authorization: `Bearer ${token}` } : {}),
			...opts.headers,
		},
		body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
		cache: opts.cache ?? "no-store",
	});

	const text = await res.text();
	let parsed: unknown = undefined;
	if (text) {
		try {
			parsed = JSON.parse(text);
		} catch {
			parsed = text;
		}
	}

	if (!res.ok) {
		const detail =
			parsed && typeof parsed === "object" && "detail" in parsed
				? String((parsed as { detail: unknown }).detail)
				: res.statusText;
		throw new ApiError(`API ${res.status}: ${detail}`, res.status, parsed);
	}

	return parsed as T;
}
