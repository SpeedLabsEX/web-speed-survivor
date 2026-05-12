import { type HTMLAttributes } from "react";

import { cn } from "@/lib/cn";

/**
 * Panel — the only card primitive. `--panel` fill, 1px hairline, 16px radius.
 * No nested panels. No shadow by default — the ambient drift does the depth work.
 */
export function Panel({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
	return (
		<div
			className={cn(
				"bg-[var(--color-panel)] rounded-[var(--radius-panel)]",
				"border border-[var(--color-hairline)]",
				className,
			)}
			{...props}
		/>
	);
}

/** Backwards-compat alias so older imports keep working. Prefer `Panel`. */
export const Card = Panel;
