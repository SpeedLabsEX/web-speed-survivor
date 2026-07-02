import { cn } from "@/lib/cn";

interface WordmarkProps {
	size?: "sm" | "md" | "lg" | "xl";
	className?: string;
}

const SIZE_PX: Record<NonNullable<WordmarkProps["size"]>, number> = {
	sm: 24,
	md: 32,
	lg: 48,
	xl: 72,
};

// public/brand/logo-header-2x.png — 194×64 (2x of the md render size).
const LOGO_ASPECT = 194 / 64;

/**
 * Speed Survivor logo — brand raster from the mobile app (green S mark +
 * wordmark, transparent background).
 */
export function Wordmark({ size = "md", className }: WordmarkProps) {
	const height = SIZE_PX[size];
	const width = Math.round(height * LOGO_ASPECT);
	return (
		// eslint-disable-next-line @next/next/no-img-element -- small static
		// asset already sized for its slot; skip the /_next/image round-trip.
		<img
			src="/brand/logo-header-2x.png"
			alt="Speed Survivor"
			width={width}
			height={height}
			decoding="async"
			className={cn("select-none", className)}
			draggable={false}
		/>
	);
}
