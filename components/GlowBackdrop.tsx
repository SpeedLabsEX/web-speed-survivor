/**
 * Ambient drift backdrop — three warm-grey orbs slowly drifting on
 * `--stage`. The motion says "alive"; the color discipline says "trust."
 *
 * Strictly warm-grey only (`--ambient-1..3`). No green / purple / cyan
 * orbs — that was the multi-accent slop reflex in the previous build.
 *
 * Honors `prefers-reduced-motion: reduce` (animation disabled in CSS).
 */
export function GlowBackdrop() {
	return (
		<div className="ambient" aria-hidden="true">
			<div className="orb a" />
			<div className="orb b" />
			<div className="orb c" />
		</div>
	);
}
