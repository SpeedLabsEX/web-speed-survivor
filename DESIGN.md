# Design

The web app is a port of the Speed Survivor mobile app's visual language onto a desktop / mobile-web canvas. Tokens below are extracted from `mobile-speed-survivor/src/constants/Colors.ts`, `Theme.ts`, and the polished gameplay surfaces (`FeaturedContestCard`, `Question`, `GameStartingSoon`, `LeaderBoard`).

## Theme

Dark, always. Specifically: a 2 a.m. fan in a dim room about to fund their account before the Sunday slate. Light mode would feel like a settings page; we are not a settings page. `prefers-color-scheme` is ignored on purpose.

## Color

OKLCH-equivalent dark palette anchored on near-black panels with a single electric green spine. Token names use the mobile app's vocabulary so anyone cross-referencing the React Native code lands in the right place.

### Stage (cabinet metal)

| Token | Hex | Use |
| --- | --- | --- |
| `--stage` | `#0a0a0a` | Page background. Slightly lifted from pure black so cards have somewhere to sit. |
| `--panel` | `#171717` | Card / module fills. The "shell" color. |
| `--panel-2` | `#1f1f1f` | Hovered / nested panel surfaces. Used sparingly. |
| `--hairline` | `#262626` | 1px chrome borders on panels. Default border everywhere. |
| `--hairline-2` | `#2f2f2f` | Hover state for hairlines on interactive panels. |

No more `#1E1E1E` cards. The panel color is `#171717` (matches `FeaturedContestCard` line 454) and the borders are `#262626` (line 459), not the translucent `rgba(255,255,255,0.06)` we had.

### Spine (the only accent)

| Token | Hex | Use |
| --- | --- | --- |
| `--spine` | `#00e59b` | Money, success, primary CTA, "yes," wallet pill border, the Add Funds button. |
| `--spine-soft` | `rgba(0,229,155,0.08)` | Tinted fills under the spine border (tile selected, alert success). |
| `--spine-glow` | `rgba(0,229,155,0.35)` | iOS-style green shadow under the primary CTA on hover. |

This replaces both `#34D399` (token) and the previous emerald-soft mix. `#00e59b` is the in-game neon from `Question.tsx` / `GameStartingSoon.tsx` — visibly brighter than `#34D399` and unmistakably "Speed."

### Risk

| Token | Hex | Use |
| --- | --- | --- |
| `--risk` | `#ef4444` | Errors, "no," elimination, debits in the activity list. |
| `--risk-soft` | `rgba(239,68,68,0.08)` | Tinted alert background. |

### Type

| Token | Hex | Use |
| --- | --- | --- |
| `--text` | `#fafafa` | Body text on dark panels. WCAG AAA on `#171717`. |
| `--text-muted` | `#a3a3a3` | Caps labels (`HUD-style`), timestamps, secondary copy. |
| `--text-dim` | `#525252` | Disabled states, very tertiary metadata. |

### Banned

- `--accent-purple`, `--accent-cyan`, `--accent-pink`, `--gold` — exist in the mobile token file but are reserved for **encoding tier/payout data** in the contest UI. The wallet web app has no such data and therefore does not use them. Don't add a "highlight" / "best value" purple badge.
- Pure `#000` and `#fff` — every neutral is tinted toward warm-grey.
- `--emerald-soft` (the muted green-12% from the previous build). Replaced by `--spine-soft` at 8% — slightly less candy, more tinted-glass.

## Typography

### Stack

```css
--font-display: "Space Grotesk", "Geist", system-ui, sans-serif;
--font-sans: "Geist", system-ui, sans-serif;
--font-mono: "Geist Mono", "JetBrains Mono", ui-monospace, SFMono-Regular, monospace;
```

Geist is the body face (already loaded). Space Grotesk shows up on display-scale headings only, matching how the mobile app uses it on `Get Ready` and `GameStartingSoon`. Mono is rare — reserved for transaction IDs and the like.

### Scale + weight

Speed type is aggressive. Negative letter-spacing on big stuff, positive letter-spacing on small stuff, weight 900 on most labels, never weight 400 on a heading.

| Role | Class / variable | Spec |
| --- | --- | --- |
| Display (page hero) | `text-display` | Space Grotesk, 48–72px clamp, weight 900, leading 1.0, tracking -0.04em, uppercase. |
| Page title | `text-page-title` | Geist, 32–40px clamp, weight 900, leading 1.05, tracking -0.02em. |
| Big number (balance) | `text-bignum` | Geist, 56–72px clamp, weight 800, leading 1, tracking -0.03em, `font-variant-numeric: tabular-nums`. |
| Section heading | `text-section` | Geist, 14px, weight 900, leading 1, tracking 0.16em (`uppercase`). The "HUD label." |
| Body | `text-base` | Geist, 15px, weight 500, leading 1.5. |
| Eyebrow | `text-eyebrow` | Geist, 11px, weight 900, leading 1, tracking 0.2em (`uppercase`), text-muted. |
| CTA label | `text-cta` | Geist, 14px, weight 900, leading 1, tracking 0.12em (`uppercase`). |

Numerals: any element rendering money or a count gets `font-variant-numeric: tabular-nums`. No exceptions.

Line length: body capped at 65ch. Headers can run wider.

## Layout

- **Stage:** `--stage` (`#0a0a0a`) full-bleed. The ambient glow lives behind it; nothing else floats above stage except panels.
- **Container:** `max-w-3xl` (768px) for wallet content, `max-w-md` (448px) for auth. The wallet is a focused tool, not a page builder.
- **Spacing scale:** 4 / 8 / 12 / 16 / 24 / 32 / 48 / 64 px. Default vertical rhythm between modules is 32px; intra-module padding is 24px.
- **Radius:** Hard-leaning. Panels = 16px. Tiles = 14px. Buttons = 12px. Wallet pill = 999px (the only true pill in the app, matches mobile `CompactHeader`). No "rounded-3xl" iOS-blob radii anywhere.
- **Borders:** Always 1px `--hairline`. Interactive panels swap to `--spine` on `aria-selected="true"` or focus. Never side-stripe (left or right border accents are banned per impeccable laws).
- **No nested cards.** A panel inside a panel is a code smell. If a section needs grouping, use a hairline divider or a caps label, not another card.

## Components

### Button

Three variants, no more.

- **`primary`** — solid `--spine` fill, `--ink` (`#0a0a0a`) text, weight 900, uppercase, tracking 0.12em, radius 12px, height 56px (lg) / 48px (md). Hover adds `--spine-glow` shadow. Used for: Add Funds, Continue to checkout, Sign in, Create account.
- **`ghost`** — transparent fill, 1px `--hairline` border, `--text` text, weight 700, no-uppercase. Hover swaps border to `--hairline-2`. Used for: Back, Cancel, secondary CTAs.
- **`destructive`** — `--risk` text on transparent, 1px `--risk` border. Rare; used for "Cancel withdrawal" type actions.

The auth-style "translucent fill + emerald border + emerald text" variant from the previous build is **deleted**. It made auth feel like a different app. Auth uses `primary` like everywhere else.

### Input

`--panel` fill, 1px `--hairline` border (focus → `--spine`, error → `--risk`), 14px text, 48px height, radius 10px. Placeholder is `--text-dim`.

### Panel

The base "card." `--panel` fill, 1px `--hairline` border, 16px radius, 24px padding. No shadow by default — the glow background does the depth work. Apply `shadow-[0_8px_32px_rgba(0,0,0,0.4)]` only on the wallet's hero balance module, where the panel needs to feel slightly elevated.

### HUD label

The eyebrow / section-heading pattern: `text-eyebrow` muted grey, `--text-muted` color, 12px gap below to the value it labels. Use everywhere a section needs a name without taking up visual real estate.

### Activity row

Single horizontal row inside the activity panel: 12px vertical padding, 1px `--hairline` divider between rows (last row no divider), icon-in-tinted-circle on the left (8px gap), title + relative timestamp stacked in the middle, signed amount right-aligned with tabular numerals. Credit = `--spine`, debit = `--risk`.

### Balance hero

The signature module of the wallet page. `--panel` fill, 16px radius, 1px `--hairline`, 32px padding. Stack:

1. Eyebrow `BALANCE` (text-eyebrow, muted).
2. Big number (`text-bignum`, `--text`, tabular-nums) — 56-72px depending on viewport.
3. Hairline divider (1px `--hairline`, full width).
4. Action row: primary `Add Funds` button on the left, ghost `Withdraw` button on the right. Stack vertically below 480px.

No second card around it. No gradient background. The number does the work.

### Wallet pill (header)

The header chrome from `CompactHeader.tsx` mobile: `--panel` fill, 1px `--spine` border, 999px radius, 13px tabular-nums text in `#e8e8e8`, 8px / 12px padding. Hovers to `--panel-2`.

### Package tile

The deposit picker tiles. `--panel` fill, 1px `--hairline` border (selected → `--spine`, with `--spine-soft` fill), 14px radius, 20px padding, left-aligned. Shows the dollar amount in `text-page-title` (32px, 900) and a tiny eyebrow underneath (`+ TO WALLET`). **No badges.** No "Most popular." No "Best value." If we want to recommend an amount, we mark exactly one tile with a 1px `--spine` border in the unselected state — that's the recommendation. One signal, not three.

The custom-amount field is a sibling input below the grid, styled like a normal input — not a fake tile.

## Motion

Three motion patterns, all subordinate to the typography.

1. **Ambient drift** — three blurred orbs in the background of every page (`--ambient-1: #1a1a1f`, `--ambient-2: #1f1e20`, `--ambient-3: #29282a` on `--stage`). Sizes 30/40/50% of viewport, drift over 60–80s, opacity 0.35. Disabled under `prefers-reduced-motion`. **Strictly one shade family** (warm-greys), no green / purple / cyan. The previous build used emerald + purple + cyan orbs — that's the multi-accent slop reflex.
2. **Press scale** — 120ms cubic-out, scale 0.97. Matches mobile `PressableScale`. Disabled under `prefers-reduced-motion`; replaced with a 0.85 opacity flicker.
3. **Stair wipe** — green vertical wipe on route transitions (mobile `StairsTransition`). Phase-2 polish; v1 ships without it.

No shimmer sweeps. No gradient text. No pulsing emerald CTAs (we lean on the green-glow shadow on hover, that's the entire vocabulary).

Easing across the board: `cubic-bezier(0.22, 1, 0.36, 1)` (cubic-out). No bounce, no elastic, no spring.

## Iconography

`lucide-react` at 16px / 18px / 20px sizes, 1.75 stroke. Always inherits text color, never colored independently. The mobile app uses Ionicons; lucide is the closest line-weight match for web.

## Tokens (CSS custom properties)

Authoritative list. All other code references these via `var(--token)` and never hardcodes hex.

```css
:root {
	/* Stage */
	--stage: #0a0a0a;
	--panel: #171717;
	--panel-2: #1f1f1f;
	--hairline: #262626;
	--hairline-2: #2f2f2f;
	--ink: #0a0a0a;

	/* Spine */
	--spine: #00e59b;
	--spine-soft: rgba(0, 229, 155, 0.08);
	--spine-glow: rgba(0, 229, 155, 0.35);

	/* Risk */
	--risk: #ef4444;
	--risk-soft: rgba(239, 68, 68, 0.08);

	/* Text */
	--text: #fafafa;
	--text-muted: #a3a3a3;
	--text-dim: #525252;

	/* Ambient (drift orbs) */
	--ambient-1: #1a1a1f;
	--ambient-2: #1f1e20;
	--ambient-3: #29282a;

	/* Radii */
	--radius-input: 10px;
	--radius-button: 12px;
	--radius-tile: 14px;
	--radius-panel: 16px;

	/* Motion */
	--ease-out: cubic-bezier(0.22, 1, 0.36, 1);
	--dur-fast: 120ms;
	--dur-normal: 180ms;
	--dur-slow: 240ms;
}
```

Anything that doesn't fit one of these tokens is suspicious and should be questioned before being added.
