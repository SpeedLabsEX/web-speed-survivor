import { cn } from "@/lib/cn";

interface WordmarkProps {
	size?: "sm" | "md" | "lg" | "xl";
	className?: string;
	href?: string;
}

const SIZE_CLASS: Record<NonNullable<WordmarkProps["size"]>, string> = {
	sm: "text-[18px]",
	md: "text-[22px]",
	lg: "text-[36px]",
	xl: "text-[clamp(56px,12vw,120px)]",
};

/**
 * Speed Survivor wordmark. Typographic — Space Grotesk, weight 700, uppercase,
 * tight tracking, with a single emerald block that doubles as the "dot" /
 * brand pulse. No raster logo.
 */
export function Wordmark({ size = "md", className }: WordmarkProps) {
	return (
		<span
			className={cn("wordmark leading-none", SIZE_CLASS[size], className)}
			aria-label="Speed Survivor"
		>
			Speed<span className="dot" aria-hidden />
		</span>
	);
}
