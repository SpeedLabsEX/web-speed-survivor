import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ReferralCapture } from "@/components/ReferralCapture";
import { Wordmark } from "@/components/Wordmark";
import { Panel } from "@/components/ui/Card";
import { ApiError, callApi } from "@/lib/apiClient";
import type { PublicProfileResponse } from "@/lib/api-types";

// Public, shareable profile page. Fetched server-side with no auth token so it
// works for logged-out visitors and link-preview crawlers.
async function fetchProfile(username: string): Promise<PublicProfileResponse | null> {
	try {
		return await callApi<PublicProfileResponse>(
			`/api/v1/public/profiles/${encodeURIComponent(username)}`,
			{ token: null, cache: "no-store" },
		);
	} catch (err) {
		if (err instanceof ApiError && err.status === 404) return null;
		throw err;
	}
}

function money(n: number): string {
	const sign = n > 0 ? "+" : n < 0 ? "-" : "";
	return `${sign}$${Math.abs(n).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

export async function generateMetadata({
	params,
}: {
	params: Promise<{ username: string }>;
}): Promise<Metadata> {
	const { username } = await params;
	const profile = await fetchProfile(username);
	if (!profile) {
		return { title: "Profile not found · Speed Survivor" };
	}
	const title = `@${profile.username} · Speed Survivor`;
	const description = profile.bio
		? profile.bio
		: `${profile.stats.games_played} games · ${money(profile.stats.pnl)} PnL on Speed Survivor.`;
	return {
		title,
		description,
		openGraph: {
			title,
			description,
			images: profile.avatar_image_url ? [{ url: profile.avatar_image_url }] : undefined,
		},
		twitter: { card: "summary", title, description },
	};
}

export default async function PublicProfilePage({
	params,
}: {
	params: Promise<{ username: string }>;
}) {
	const { username } = await params;
	const profile = await fetchProfile(username);
	if (!profile) notFound();

	const s = profile.stats;
	const links = profile.social_links;

	const statRows: Array<[string, string]> = [
		["Games Played", String(s.games_played)],
		["PnL", `${money(s.pnl)} / ${s.pnl_percent >= 0 ? "+" : ""}${s.pnl_percent}%`],
		["Accuracy", `${s.accuracy}%`],
		["Win Rate", `${s.win_rate}%`],
		["Average Finish Rank", s.average_finish_rank != null ? `#${s.average_finish_rank}` : "—"],
		["Best Finish", s.best_finish != null ? `#${s.best_finish}` : "—"],
		["Top 3 Finishes", String(s.top_three_finishes)],
		["Current / Best Streak", `${s.current_win_streak} / ${s.longest_win_streak}`],
	];

	const initials = profile.username ? profile.username.substring(0, 2).toUpperCase() : "SP";

	return (
		<main className="relative flex min-h-screen flex-col">
			<ReferralCapture />
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

			<section className="mx-auto w-full max-w-2xl px-4 py-10 sm:px-6">
				{/* Profile header */}
				<div className="flex flex-col items-center text-center">
					{profile.avatar_image_url ? (
						// eslint-disable-next-line @next/next/no-img-element
						<img
							src={profile.avatar_image_url}
							alt={`@${profile.username}`}
							className="h-24 w-24 rounded-full object-cover"
						/>
					) : (
						<div className="flex h-24 w-24 items-center justify-center rounded-full bg-[var(--color-panel)] text-2xl font-bold text-[var(--color-text)]">
							{profile.emoji ?? initials}
						</div>
					)}
					<h1 className="text-page-title mt-4 text-[var(--color-text)]">@{profile.username}</h1>
					{profile.bio ? (
						<p className="mt-3 max-w-md text-[15px] leading-relaxed text-[var(--color-text-muted)]">
							{profile.bio}
						</p>
					) : null}

					<div className="mt-4 flex items-center gap-4 text-[var(--color-text-muted)]">
						{links.x_handle ? (
							<a href={`https://x.com/${links.x_handle}`} target="_blank" rel="noreferrer" className="hover:text-[var(--color-text)]">
								X
							</a>
						) : null}
						{links.telegram ? (
							<a href={`https://t.me/${links.telegram}`} target="_blank" rel="noreferrer" className="hover:text-[var(--color-text)]">
								Telegram
							</a>
						) : null}
						{links.discord ? <span>{links.discord}</span> : null}
						{links.website_url ? (
							<a href={links.website_url} target="_blank" rel="noreferrer" className="hover:text-[var(--color-text)]">
								Website
							</a>
						) : null}
					</div>
				</div>

				{/* Stats */}
				<Panel className="mt-8 px-5 py-1">
					{statRows.map(([label, value]) => (
						<div
							key={label}
							className="flex items-center justify-between border-b border-[var(--color-hairline)] py-3 last:border-0"
						>
							<span className="text-[14px] text-[var(--color-text-muted)]">{label}</span>
							<span className="tabular text-[14px] font-medium text-[var(--color-text)]">{value}</span>
						</div>
					))}
				</Panel>

				{/* Recent activity */}
				<h2 className="text-section mt-10 text-[var(--color-text)]">Recent Activity</h2>
				{profile.recent_activity.length === 0 ? (
					<p className="mt-4 text-[14px] text-[var(--color-text-muted)]">No completed games yet.</p>
				) : (
					<div className="mt-4">
						{profile.recent_activity.map((item) => {
							const pnl = item.prize_amount - item.entry_fee;
							const date = item.contest_date
								? new Date(item.contest_date).toLocaleDateString(undefined, {
										month: "short",
										day: "numeric",
									})
								: "";
							return (
								<div
									key={item.contest_uuid}
									className="border-b border-[var(--color-hairline)] py-3 last:border-0"
								>
									<div className="text-[15px] font-medium text-[var(--color-text)]">
										{item.contest_name}
										{date ? ` · ${date}` : ""}
									</div>
									<div className="mt-1 text-[13px] text-[var(--color-text-muted)]">
										Finished #{item.final_placement} · PnL {money(pnl)}
									</div>
								</div>
							);
						})}
					</div>
				)}

				<p className="mt-12 text-center text-[13px] text-[var(--color-text-muted)]">
					Want to compete? Get the Speed Survivor app.
				</p>
			</section>
		</main>
	);
}
