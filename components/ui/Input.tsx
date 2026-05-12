import { forwardRef, type InputHTMLAttributes } from "react";

import { cn } from "@/lib/cn";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
	invalid?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
	({ className, invalid, ...props }, ref) => {
		return (
			<input
				ref={ref}
				className={cn(
					"w-full bg-[var(--color-panel)] text-[var(--color-text)]",
					"placeholder:text-[var(--color-text-dim)]",
					"border rounded-[var(--radius-input)] px-4 h-12 text-[15px]",
					"focus:outline-none focus:border-[var(--color-spine)]",
					"transition-colors duration-150",
					invalid
						? "border-[var(--color-risk)]"
						: "border-[var(--color-hairline)] hover:border-[var(--color-hairline-2)]",
					className,
				)}
				{...props}
			/>
		);
	},
);

Input.displayName = "Input";
