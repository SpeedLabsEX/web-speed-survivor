import { AlertTriangle, CheckCircle2, Info, type LucideIcon } from "lucide-react";
import { type ReactNode } from "react";

import { cn } from "@/lib/cn";

type Tone = "error" | "success" | "info" | "warning";

const TONE: Record<Tone, { bg: string; text: string; Icon: LucideIcon }> = {
	error: {
		bg: "bg-[var(--color-risk-soft)] border-[var(--color-risk)]/40",
		text: "text-[var(--color-risk)]",
		Icon: AlertTriangle,
	},
	success: {
		bg: "bg-[var(--color-spine-soft)] border-[var(--color-spine)]/40",
		text: "text-[var(--color-spine)]",
		Icon: CheckCircle2,
	},
	info: {
		bg: "bg-[var(--color-panel)] border-[var(--color-hairline)]",
		text: "text-[var(--color-text)]",
		Icon: Info,
	},
	warning: {
		bg: "bg-[var(--color-panel)] border-[var(--color-hairline)]",
		text: "text-[var(--color-text)]",
		Icon: AlertTriangle,
	},
};

export function Alert({
	tone = "info",
	children,
	className,
}: {
	tone?: Tone;
	children: ReactNode;
	className?: string;
}) {
	const { bg, text, Icon } = TONE[tone];
	return (
		<div
			role="alert"
			className={cn(
				"flex items-start gap-3 rounded-[var(--radius-input)] border px-4 py-3 text-sm",
				bg,
				text,
				className,
			)}
		>
			<Icon size={16} className="mt-0.5 shrink-0" aria-hidden />
			<div className="leading-snug">{children}</div>
		</div>
	);
}
