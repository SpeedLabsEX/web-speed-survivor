# Product

## Scope

Sign-in only. Account creation lives in the mobile app (Speed Survivor on iOS / Android), where the rest of the onboarding flow is — phone verification, KYC, profile, avatar, contest registration. The web wallet does not duplicate any of that; if a player without a Speed account hits this site, the answer is "install the mobile app."

## Users

Existing Speed Survivor mobile players, on a desktop or mobile browser, doing money operations: depositing funds before a contest, checking their balance, scanning recent activity, and (phase 2) cashing out winnings. They have a Speed account, they know the brand from the mobile app, and they are usually here because the mobile app sent them — they tap "Add Funds" in `WalletFlow` and land on this site. The session is short, transactional, and high-trust: nobody opens this app to browse.

Context: a player who just survived a cut round and wants to top up before the next contest, or someone funding their account on Sunday morning before the slate. Real money, real urgency, very little patience.

## Product Purpose

Speed Survivor's wallet web app. Two jobs:

1. **Deposit funds via Coinflow** — credit card, ACH, Apple Pay, Google Pay, etc. The Coinflow webhook in `api-speed-survivor` credits `wallet.deposits`; this app gets the user from "I want to add money" to "money is in my wallet" with as little friction as the underlying payment rails allow.
2. **Show the player their balance and recent activity.** The mobile app already does this, but the moment a deposit is in flight the user is here, so the wallet view has to feel like a first-class surface, not a settings page.

Withdrawals (Coinflow payouts) are phase 2 and gated behind a feature flag.

Success = a player who tapped "Add Funds" on mobile arrives, deposits, sees the credit land, and gets back to playing. Anything that distracts from that path is dead weight.

## Brand Personality

Three words: **electric, machined, deliberate.**

- **Electric** — Speed isn't a bank. There's a single bright green that does the work of "money," "go," "alive." It punches against near-black. Nothing else gets to be loud.
- **Machined** — Hard edges over soft pillows. `#262626` 1px hairlines on `#171717` panels, the way arcade cabinets have brushed-metal trim. Not glassmorphism. Not soft shadows. Not bubbly iOS pills.
- **Deliberate** — `fontWeight: 900` ALL-CAPS microcopy, `letterSpacing: 2`, tabular numerals on every number that matters. Every label looks like it knows what it's saying. Nothing is decorative; if it's on screen, it earns its place.

Voice: short, present-tense, sports-broadcast-confident. "Funds added." "Crediting wallet." "Cancelled. No charges." Never "Oops!" or "Hooray!" or three exclamation marks.

## Anti-references

- **Generic SaaS dashboards** — cream-on-white, soft shadows, gradient hero illustration, "Welcome to your dashboard 👋" copy. Speed is not Linear-for-finance. The current `(marketing)/page.tsx` and the auth pages drift this way and need to be killed.
- **Multi-accent rainbow** — the current package picker stacks an emerald "Most popular" badge next to a gold "Best value" badge next to a purple custom-amount card. The mobile app reserves purple/cyan/pink for *meaning* (payout tiers, multipliers); slapping them on tile chrome is exactly the slop reflex to avoid.
- **Cartoony illustrated** — no mascots, no hand-drawn coins, no Stripe-Atlas-style vector blobs. Speed leans typographic, not illustrative.
- **Crypto-neon** — magenta-cyan gradient text, animated orbs as decoration, "web3" energy. We're a regulated cash-in/cash-out flow, not a degen casino.
- **Casino-garish** — gold trim, red CTAs, slot-machine glow, FOMO countdowns. The vibe is "professional sports book operator," not "free play, claim your bonus now."

## Design Principles

1. **Inherit, don't invent.** The mobile app already has an opinionated visual language (machined dark + single electric green + typographic aggression + ambient drift). The web app is a port of that language onto a larger canvas, not a parallel design system. If you're about to invent a new card style, stop and look at `FeaturedContestCard.tsx` first.
2. **One spine, one accent.** Electric green (`#00e59b`) is the spine of the app. It marks money, progression, success. Red marks risk and failure. Everything else is grey on near-black. Purple, cyan, gold do not exist in this surface unless they're encoding tier data (and we don't have tier data here).
3. **The number is the hero.** This is a wallet. The balance, the deposit amount, and the activity totals are the most important pixels. They get the biggest type, the heaviest weight, the tabular numerals, and the most generous breathing room. Buttons and chrome serve them.
4. **Movement is ambient, never decorative.** Slow drifting glow in the background says "alive." A 120ms scale on press says "responsive." Animated orbs in the hero, gradient sweeps on buttons, and shimmer effects say "AI made that" — kill them.
5. **Trust through restraint.** Players are sending real money. Every gradient, glow, and emoji nudges them toward "this looks like a casino." Speed earns trust by looking like the team behind it knows exactly which pixel matters and which one doesn't.

## Accessibility & Inclusion

- **WCAG AA minimum** for text contrast, AAA where it's free (the dark theme makes this easy on big text). Body text on `#171717` panels uses `#fafafa`, not `#a3a3a3`. Muted greys are reserved for labels and timestamps.
- **`prefers-reduced-motion: reduce`** disables the ambient glow drift entirely. Press feedback drops to opacity changes, not scale.
- **Tabular numerals everywhere money appears**, so balances and amounts visually align across rows.
- **Keyboard-first** — every action reachable via tab, focus rings visible (emerald, 2px, 2px offset). Coinflow's iframe handles its own internal a11y.
- **Color is never the only signal** — credits/debits get a sign and an icon, not just a green/red color.
- **Reduced contrast mode** is not a one-off accommodation; the design uses high contrast by default, so this is a no-op.
