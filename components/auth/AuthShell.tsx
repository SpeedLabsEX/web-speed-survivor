import Link from "next/link";
import { type ReactNode } from "react";

import { Wordmark } from "@/components/Wordmark";
import { cn } from "@/lib/cn";

interface AuthShellProps {
	eyebrow: string;
	title: string;
	children: ReactNode;
	footer?: ReactNode;
	className?: string;
}

export function AuthShell({
	eyebrow,
	title,
	children,
	footer,
	className,
}: AuthShellProps) {
	return (
		<main className="relative flex min-h-screen flex-col">
			<header className="border-b border-[var(--color-hairline)]">
				<div className="mx-auto flex h-16 max-w-3xl items-center px-4 sm:px-6">
					<Link href="/">
						<Wordmark size="md" />
					</Link>
				</div>
			</header>

			<div className="flex flex-1 items-center justify-center px-6 py-16">
				<div className={cn("relative z-10 w-full max-w-[420px]", className)}>
					<div className="text-eyebrow text-[var(--color-spine)]">{eyebrow}</div>
					<h1 className="text-page-title mt-3 text-[var(--color-text)]">
						{title}
					</h1>

					<div className="mt-10 flex flex-col gap-3">{children}</div>

					{footer ? (
						<div className="mt-8 text-sm text-[var(--color-text-muted)]">
							{footer}
						</div>
					) : null}
				</div>
			</div>
		</main>
	);
}

export function OrDivider({ label = "or" }: { label?: string }) {
	return (
		<div className="flex items-center gap-3 py-1">
			<div className="h-px flex-1 bg-[var(--color-hairline)]" />
			<span className="text-eyebrow text-[10px] tracking-[0.24em]">
				{label}
			</span>
			<div className="h-px flex-1 bg-[var(--color-hairline)]" />
		</div>
	);
}
