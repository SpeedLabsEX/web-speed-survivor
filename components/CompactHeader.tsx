"use client";

import { LogOut } from "lucide-react";
import Link from "next/link";

import { Wordmark } from "@/components/Wordmark";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/cn";
import { formatBalance } from "@/lib/format";

interface CompactHeaderProps {
	balanceCents?: number | null;
	className?: string;
}

/**
 * Wallet header. Wordmark on the left, balance pill + logout on the right.
 * Mirrors mobile CompactHeader.tsx — pill is `--panel` fill with a 1px
 * `--spine` border and tabular numerals.
 */
export function CompactHeader({ balanceCents, className }: CompactHeaderProps) {
	const { logout, status } = useAuth();
	const isAuthed = status === "authenticated";

	return (
		<header
			className={cn(
				"sticky top-0 z-20 w-full",
				"bg-[var(--color-stage)]/85 backdrop-blur",
				"border-b border-[var(--color-hairline)]",
				className,
			)}
		>
			<div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-4 sm:px-6">
				<Link href={isAuthed ? "/wallet" : "/"}>
					<Wordmark size="md" />
				</Link>

				<div className="flex items-center gap-2">
					{typeof balanceCents === "number" ? (
						<Link
							href="/wallet"
							className={cn(
								"press-scale flex items-center rounded-full",
								"bg-[var(--color-panel)] hover:bg-[var(--color-panel-2)]",
								"border border-[var(--color-spine)]",
								"px-4 h-9 text-[13px] font-bold tabular text-[#e8e8e8]",
							)}
						>
							{formatBalance(balanceCents)}
						</Link>
					) : null}

					{isAuthed ? (
						<button
							onClick={logout}
							type="button"
							aria-label="Log out"
							className={cn(
								"press-scale flex h-9 w-9 items-center justify-center rounded-full",
								"text-[var(--color-text-muted)] hover:text-[var(--color-text)]",
								"hover:bg-[var(--color-panel)]",
							)}
						>
							<LogOut size={16} />
						</button>
					) : null}
				</div>
			</div>
		</header>
	);
}
