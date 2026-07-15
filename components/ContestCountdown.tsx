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

function formatRemaining(diffMs: number): string {
	const totalSec = Math.floor(diffMs / 1000);
	const days = Math.floor(totalSec / 86400);
	const hours = Math.floor((totalSec % 86400) / 3600);
	const mins = Math.floor((totalSec % 3600) / 60);
	const secs = totalSec % 60;
	if (days > 0) return `${days}d ${hours}h`;
	if (hours > 0) return `${hours}h ${mins}m`;
	if (mins > 0) return `${mins}m ${secs}s`;
	return `${secs}s`;
}

/**
 * Live "Starts in 2h 14m" countdown to kickoff. Renders nothing until mounted
 * (so server output and first client render match — no hydration mismatch) and
 * nothing once the start time has passed.
 */
export function ContestCountdown({ startTime }: { startTime: string }) {
	const [now, setNow] = useState<number | null>(null);

	useEffect(() => {
		const ms = parseMs(startTime);
		if (!Number.isFinite(ms)) return;
		setNow(Date.now());
		const id = setInterval(() => setNow(Date.now()), 1000);
		return () => clearInterval(id);
	}, [startTime]);

	if (now === null) return null;
	const ms = parseMs(startTime);
	if (!Number.isFinite(ms)) return null;
	const diff = ms - now;
	if (diff <= 0) return null;

	return (
		<span className="mt-1 block text-[11px] font-semibold text-[var(--color-spine)]">
			Starts in {formatRemaining(diff)}
		</span>
	);
}
