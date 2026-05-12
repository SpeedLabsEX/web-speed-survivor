import { cn } from "@/lib/cn";

export function Spinner({
	size = 20,
	className,
}: {
	size?: number;
	className?: string;
}) {
	return (
		<span
			role="status"
			aria-label="Loading"
			style={{ width: size, height: size, borderWidth: Math.max(2, size / 12) }}
			className={cn(
				"inline-block animate-spin rounded-full border-current border-t-transparent text-[var(--color-spine)]",
				className,
			)}
		/>
	);
}
