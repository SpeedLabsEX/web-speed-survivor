import { forwardRef, type ButtonHTMLAttributes } from "react";

import { cn } from "@/lib/cn";

type Variant = "primary" | "ghost" | "destructive";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
	variant?: Variant;
	size?: Size;
	loading?: boolean;
}

const VARIANT: Record<Variant, string> = {
	primary: [
		"bg-[var(--color-spine)] text-[var(--color-ink)]",
		"text-cta",
		"hover:shadow-[0_8px_32px_var(--color-spine-glow)]",
		"hover:brightness-105",
	].join(" "),

	ghost: [
		"bg-transparent text-[var(--color-text)]",
		"border border-[var(--color-hairline)]",
		"font-medium",
		"hover:border-[var(--color-hairline-2)]",
		"hover:bg-[var(--color-panel)]",
	].join(" "),

	destructive: [
		"bg-transparent text-[var(--color-risk)]",
		"border border-[var(--color-risk)]",
		"font-semibold",
		"hover:bg-[var(--color-risk-soft)]",
	].join(" "),
};

const SIZE: Record<Size, string> = {
	sm: "h-9 px-3 text-sm rounded-[var(--radius-button)]",
	md: "h-12 px-5 text-sm rounded-[var(--radius-button)]",
	lg: "h-14 px-6 text-base rounded-[var(--radius-button)]",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
	(
		{ className, variant = "primary", size = "md", loading, disabled, children, ...props },
		ref,
	) => {
		return (
			<button
				ref={ref}
				disabled={disabled || loading}
				className={cn(
					"press-scale inline-flex items-center justify-center gap-2",
					"select-none whitespace-nowrap",
					VARIANT[variant],
					SIZE[size],
					className,
				)}
				{...props}
			>
				{loading ? (
					<span
						aria-hidden
						className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
					/>
				) : null}
				{children}
			</button>
		);
	},
);

Button.displayName = "Button";
