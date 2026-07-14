import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ContestStartTime } from "@/components/ContestStartTime";
import { Wordmark } from "@/components/Wordmark";
import { Panel } from "@/components/ui/Card";
import type { PublicContest } from "@/lib/api-types";
import { env } from "@/lib/env";
import { fetchPublicContest } from "@/lib/contest-server";

function money(n: number): string {
	return `$${Math.max(0, Math.round(n)).toLocaleString()}`;
}

function entryDisplay(entryFee: string): string {
	const n = Number.parseFloat((entryFee || "").replace(/[$,]/g, ""));
	if (!Number.isFinite(n) || n <= 0) return "Free";
	return `$${n.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}

function prettyModelType(modelType: string): string {
	return modelType?.toLowerCase() === "wager" ? "Wager" : "Survivor";
}

/** UTC-based fallback label rendered on the server before the client localizes. */
function startFallback(startTime: string | null | undefined): string {
	if (!startTime) return "";
	const hasTz = /(Z|[+-]\d{2}:?\d{2})$/.test(startTime.trim());
	const iso = hasTz ? startTime : `${startTime.trim().replace(" ", "T")}Z`;
	const d = new Date(iso);
	if (Number.isNaN(d.getTime())) return "";
	const date = d.toLocaleDateString("en-US", {
		weekday: "short",
		month: "short",
		day: "numeric",
		timeZone: "UTC",
	});
	const time = d.toLocaleTimeString("en-US", {
		hour: "numeric",
		minute: "2-digit",
		timeZone: "UTC",
	});
	return `${date} · ${time} UTC`;
}

function prizePool(c: PublicContest): number {
	if (c.max_prize_pool > 0) return c.max_prize_pool;
	if (c.total_prize_pool > 0) return c.total_prize_pool;
	return c.grand_prize;
}

export async function generateMetadata({
	params,
}: {
	params: Promise<{ contestId: string }>;
}): Promise<Metadata> {
	const { contestId } = await params;
	const contest = await fetchPublicContest(contestId);
	if (!contest) {
		return { title: "Contest not found · Speed Survivor" };
	}
	const title = `${contest.title} · Speed Survivor`;
	const description =
		contest.description?.trim() ||
		`${money(prizePool(contest))} prize pool · ${entryDisplay(contest.entry_fee)} entry. Join on Speed Survivor.`;
	return {
		title,
		description,
		openGraph: {
			title,
			description,
			images: contest.image_url ? [{ url: contest.image_url }] : undefined,
		},
		twitter: {
			card: contest.image_url ? "summary_large_image" : "summary",
			title,
			description,
			images: contest.image_url ? [contest.image_url] : undefined,
		},
	};
}

export default async function ContestDetailsPage({
	params,
}: {
	params: Promise<{ contestId: string }>;
}) {
	const { contestId } = await params;
	const contest = await fetchPublicContest(contestId);
	if (!contest) notFound();

	const pool = prizePool(contest);
	const hasCapacity = contest.pool_size_max > 0;
	const pct = hasCapacity
		? Math.min(100, Math.round((contest.participant_count / contest.pool_size_max) * 100))
		: 0;
	const spotsLeft = Math.max(contest.pool_size_max - contest.participant_count, 0);

	const { appStoreUrl, playStoreUrl } = env.stores;
	const hasStoreLinks = Boolean(appStoreUrl || playStoreUrl);

	return (
		<main className="relative flex min-h-screen flex-col">
			<header className="border-b border-[var(--color-hairline)]">
				<div className="mx-auto flex h-16 max-w-2xl items-center justify-between px-4 sm:px-6">
					<Link href="/">
						<Wordmark size="md" />
					</Link>
					<Link
						href="/login"
						className="text-cta text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text)]"
					>
						Sign in
					</Link>
				</div>
			</header>

			<section className="mx-auto w-full max-w-2xl px-4 py-8 sm:px-6">
				{/* Hero */}
				<div className="relative overflow-hidden rounded-[var(--radius-panel)] border border-[var(--color-hairline)]">
					{contest.image_url ? (
						// eslint-disable-next-line @next/next/no-img-element
						<img
							src={contest.image_url}
							alt={contest.title}
							className="h-56 w-full object-cover sm:h-64"
						/>
					) : (
						<div className="h-56 w-full bg-[var(--color-panel-2)] sm:h-64" />
					)}
					<div className="absolute inset-0 bg-gradient-to-t from-[var(--color-stage)] via-[var(--color-stage)]/20 to-transparent" />
					<div className="absolute inset-x-0 bottom-0 p-5 sm:p-6">
						<div className="mb-3 flex flex-wrap items-center gap-2">
							<span className="rounded-full bg-[var(--color-spine)] px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-[var(--color-ink)]">
								{prettyModelType(contest.model_type)}
							</span>
							{contest.sport && contest.sport !== "other" ? (
								<span className="rounded-full border border-white/10 bg-white/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-white backdrop-blur">
									{contest.sport.toUpperCase()}
								</span>
							) : null}
							{contest.is_live ? (
								<span className="rounded-full bg-[var(--color-risk)] px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-white">
									Live Now
								</span>
							) : null}
						</div>
						<h1 className="text-display text-3xl leading-none text-white sm:text-4xl">
							{contest.title}
						</h1>
					</div>
				</div>

				{/* Stat trio */}
				<div className="mt-6 grid grid-cols-3 gap-3">
					<Stat label="Prizes" value={money(pool)} accent />
					<Stat label="Entry" value={entryDisplay(contest.entry_fee)} />
					<Stat
						label="Starts"
						value={
							contest.is_live ? (
								"Live Now"
							) : contest.start_time ? (
								<ContestStartTime
									startTime={contest.start_time}
									fallback={startFallback(contest.start_time)}
								/>
							) : (
								"TBD"
							)
						}
					/>
				</div>

				{/* Capacity */}
				{hasCapacity ? (
					<div className="mt-5">
						<div className="h-2 w-full overflow-hidden rounded-full bg-[var(--color-panel-2)]">
							<div
								className="h-full rounded-full bg-[var(--color-spine)]"
								style={{ width: `${pct}%` }}
							/>
						</div>
						<div className="mt-2 flex items-center justify-between text-[10px] font-black uppercase tracking-[0.1em] text-[var(--color-text-muted)]">
							<span>{pct}% Filled</span>
							<span>
								{contest.participant_count.toLocaleString()} / {contest.pool_size_max.toLocaleString()} ·{" "}
								{spotsLeft.toLocaleString()} spots left
							</span>
						</div>
					</div>
				) : null}

				{/* CTA */}
				<div className="mt-6 rounded-[var(--radius-panel)] border border-[var(--color-hairline)] bg-[var(--color-spine-soft)] p-5 text-center">
					<p className="text-[15px] font-semibold text-[var(--color-text)]">
						Play this contest in the Speed Survivor app
					</p>
					<p className="mt-1 text-[13px] text-[var(--color-text-muted)]">
						Download the app to enter, make your picks, and compete live.
					</p>
					{hasStoreLinks ? (
						<div className="mt-4 flex flex-col items-center justify-center gap-2 sm:flex-row">
							{appStoreUrl ? (
								<a
									href={appStoreUrl}
									className="press-scale w-full rounded-[var(--radius-button)] bg-[var(--color-spine)] px-5 py-3 text-cta font-bold text-[var(--color-ink)] sm:w-auto"
								>
									Download on the App Store
								</a>
							) : null}
							{playStoreUrl ? (
								<a
									href={playStoreUrl}
									className="press-scale w-full rounded-[var(--radius-button)] border border-[var(--color-hairline)] bg-[var(--color-panel)] px-5 py-3 text-cta font-bold text-[var(--color-text)] sm:w-auto"
								>
									Get it on Google Play
								</a>
							) : null}
						</div>
					) : (
						<p className="mt-4 text-[13px] font-semibold text-[var(--color-spine)]">
							Get the Speed Survivor app to play.
						</p>
					)}
				</div>

				{/* About */}
				{contest.description?.trim() ? (
					<div className="mt-8">
						<h2 className="text-eyebrow text-[var(--color-text-muted)]">About This Contest</h2>
						<p className="mt-3 text-[15px] leading-relaxed text-[var(--color-text-muted)]">
							{contest.description}
						</p>
					</div>
				) : null}

				{/* Payouts */}
				{contest.payouts.length > 0 ? (
					<div className="mt-8">
						<h2 className="text-eyebrow text-[var(--color-text-muted)]">Prize Payouts</h2>
						<Panel className="mt-3 px-5 py-1">
							{contest.payouts.map((tier, i) => (
								<div
									key={`${tier.place}-${i}`}
									className="flex items-center justify-between border-b border-[var(--color-hairline)] py-3 last:border-0"
								>
									<span
										className={`text-[13px] font-bold uppercase tracking-[0.06em] ${
											i === 0 ? "text-[var(--color-spine)]" : "text-[var(--color-text-muted)]"
										}`}
									>
										{tier.place}
									</span>
									<span className="tabular text-[15px] font-semibold text-[var(--color-text)]">
										{tier.amount}
									</span>
								</div>
							))}
						</Panel>
					</div>
				) : null}

				{/* Contest details */}
				<div className="mt-8">
					<h2 className="text-eyebrow text-[var(--color-text-muted)]">Contest Details</h2>
					<Panel className="mt-3 px-5 py-1">
						<DetailRow label="Contest Type" value={prettyModelType(contest.model_type)} accent />
						<DetailRow label="Entry Fee" value={entryDisplay(contest.entry_fee)} />
						{hasCapacity ? (
							<DetailRow label="Field Size" value={`${contest.pool_size_max.toLocaleString()} players`} />
						) : null}
						<DetailRow
							label="Status"
							value={contest.is_live ? "Live" : contest.is_registration_open ? "Open" : "Closed"}
						/>
					</Panel>
				</div>

				<p className="mt-12 text-center text-[13px] text-[var(--color-text-muted)]">
					Speed Survivor — real-time survivor contests for sports.
				</p>
			</section>
		</main>
	);
}

function Stat({
	label,
	value,
	accent,
}: {
	label: string;
	value: React.ReactNode;
	accent?: boolean;
}) {
	return (
		<div className="rounded-[var(--radius-tile)] border border-[var(--color-hairline)] bg-[var(--color-panel)] px-3 py-3">
			<div className="text-[9px] font-black uppercase tracking-[0.16em] text-[var(--color-text-muted)]">
				{label}
			</div>
			<div
				className={`mt-1 text-[15px] font-bold ${
					accent ? "text-[var(--color-spine)]" : "text-[var(--color-text)]"
				}`}
			>
				{value}
			</div>
		</div>
	);
}

function DetailRow({
	label,
	value,
	accent,
}: {
	label: string;
	value: string;
	accent?: boolean;
}) {
	return (
		<div className="flex items-center justify-between border-b border-[var(--color-hairline)] py-3 last:border-0">
			<span className="text-[13px] uppercase tracking-[0.06em] text-[var(--color-text-muted)]">
				{label}
			</span>
			<span
				className={`text-[14px] font-medium ${
					accent ? "text-[var(--color-spine)]" : "text-[var(--color-text)]"
				}`}
			>
				{value}
			</span>
		</div>
	);
}
