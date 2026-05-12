import Link from "next/link";

import { Wordmark } from "@/components/Wordmark";
import { Button } from "@/components/ui/Button";

export default function LandingPage() {
	return (
		<main className="relative flex min-h-screen flex-col">
			<header className="border-b border-[var(--color-hairline)]">
				<div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-4 sm:px-6">
					<Wordmark size="md" />
					<Link
						href="/login"
						className="text-cta text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
					>
						Sign in
					</Link>
				</div>
			</header>

			<section className="relative flex flex-1 flex-col items-start justify-center px-6 py-20 sm:px-12">
				<div className="relative z-10 mx-auto w-full max-w-3xl">
					<div className="text-eyebrow text-[var(--color-spine)]">
						Wallet · Speed Labs
					</div>

					<h1 className="text-display mt-6 text-[var(--color-text)]">
						Fund the
						<br />
						next slate.
					</h1>

				<p className="mt-8 max-w-xl text-[18px] leading-relaxed text-[var(--color-text-muted)]">
					Add money to your Speed Survivor wallet with card, ACH, Apple Pay
					or Google Pay. Cash out winnings when the game ends. Built for the
					player who showed up to play.
				</p>

				<div className="mt-12 flex flex-col items-stretch gap-3 sm:flex-row">
					<Link href="/login">
						<Button variant="primary" size="lg">
							Sign in
						</Button>
					</Link>
				</div>

				<p className="mt-6 max-w-xl text-[14px] text-[var(--color-text-muted)]">
					New to Speed? Create your account in the mobile app, then come
					back here to manage your wallet.
				</p>
				</div>
			</section>

			<footer className="border-t border-[var(--color-hairline)]">
				<div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-4 text-eyebrow text-[var(--color-text-muted)] sm:px-6">
					<span>Speed Labs, Inc.</span>
					<span className="tabular">v1.0</span>
				</div>
			</footer>
		</main>
	);
}
