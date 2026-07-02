import { cn } from "@/lib/cn";

interface SkeletonProps {
	className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
	return (
		<div
			aria-hidden="true"
			className={cn("skeleton-shimmer rounded-[var(--radius-input)]", className)}
		/>
	);
}
