"use client";

import { useEffect, useState } from "react";

/** Parse an API timestamp to ms, treating offset-less values as UTC. */
function parseMs(value: string): number {
	const trimmed = value.trim();
	if (!trimmed) return Number.NaN;
	const looksIso = /^\d{4}-\d{2}-\d{2}[T ]/.test(trimmed);
	const hasTz = /(Z|[+-]\d{2}:?\d{2})$/.test(trimmed);
	const normalized = looksIso && !hasTz ? `${trimmed.replace(" ", "T")}Z` : trimmed;
	return new Date(normalized).getTime();
}

/**
 * Renders a contest start instant localized to the *viewer's* timezone.
 *
 * The server can't know the visitor's timezone, so it renders `fallback`
 * (a UTC-based label) first; after mount we reformat in the browser's local
 * zone (with its abbreviation). Initial client render matches the server, so
 * there is no hydration mismatch.
 */
export function ContestStartTime({
	startTime,
	fallback,
}: {
	startTime: string;
	fallback: string;
}) {
	const [label, setLabel] = useState(fallback);

	useEffect(() => {
		const ms = parseMs(startTime);
		if (!Number.isFinite(ms)) return;
		const d = new Date(ms);
		const date = d.toLocaleDateString(undefined, {
			weekday: "short",
			month: "short",
			day: "numeric",
		});
		const time = d.toLocaleTimeString(undefined, {
			hour: "numeric",
			minute: "2-digit",
			timeZoneName: "short",
		});
		setLabel(`${date} · ${time}`);
	}, [startTime]);

	return <>{label}</>;
}
