<script lang="ts">
	import type { ScoreFactor } from '$lib/types/conditions';

	let { score, factors, label }: {
		score: number;
		factors: ScoreFactor[];
		label?: string;
	} = $props();

	// Valeurs dérivées des props : $derived pour rester réactives (le moteur de conditions
	// du Plan 3 fournira des données qui changent) et éviter les warnings state_referenced_locally.
	const clamped = $derived(Math.max(0, Math.min(100, Math.round(score))));

	function qualitative(s: number): string {
		if (s >= 75) return 'Très favorable';
		if (s >= 50) return 'Favorable';
		if (s >= 25) return 'Moyen';
		return 'Faible';
	}
	const tierLabel = $derived(label ?? qualitative(clamped));
	const tierColor = $derived(
		clamped >= 75 ? 'var(--score-high)' : clamped >= 25 ? 'var(--score-mid)' : 'var(--score-low)'
	);

	// Géométrie de l'arc (270°, ouverture en bas) — entièrement statique
	const CX = 80;
	const CY = 80;
	const R = 62;
	const START = -135;
	const SWEEP = 270;

	function polar(deg: number): [number, number] {
		const rad = ((deg - 90) * Math.PI) / 180;
		return [CX + R * Math.cos(rad), CY + R * Math.sin(rad)];
	}
	function arc(fromDeg: number, toDeg: number): string {
		const [sx, sy] = polar(fromDeg);
		const [ex, ey] = polar(toDeg);
		const large = Math.abs(toDeg - fromDeg) > 180 ? 1 : 0;
		return `M${sx.toFixed(2)} ${sy.toFixed(2)} A${R} ${R} 0 ${large} 1 ${ex.toFixed(2)} ${ey.toFixed(2)}`;
	}
	const trackPath = arc(START, START + SWEEP);
	const fill = $derived(clamped / 100);

	const clamp01 = (n: number) => Math.max(0, Math.min(1, n));
</script>

<div class="gauge">
	<div class="gauge-dial">
		<svg viewBox="0 0 160 160" role="img" aria-label={`Score de pêche ${clamped} sur 100 — ${tierLabel}`}>
			<path d={trackPath} fill="none" stroke="var(--border-strong)" stroke-width="10" stroke-linecap="round" />
			<path
				class="gauge-fg"
				d={trackPath}
				fill="none"
				stroke={tierColor}
				stroke-width="10"
				stroke-linecap="round"
				pathLength="1"
				style="--fill:{fill}"
			/>
		</svg>
		<div class="gauge-center">
			<span class="gauge-score tabular-nums">{clamped}</span>
			<span class="gauge-tier" style="color:{tierColor}">{tierLabel}</span>
		</div>
	</div>

	{#if factors.length}
		<ul class="factors">
			{#each factors as f (f.label)}
				<li class="factor">
					<span class="factor-label">{f.label}</span>
					<span class="factor-bar">
						<span class="factor-fill" style="width:{Math.round(clamp01(f.weight) * 100)}%"></span>
					</span>
				</li>
			{/each}
		</ul>
	{/if}
</div>

<style>
	.gauge {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--space-6);
	}
	.gauge-dial {
		position: relative;
		width: 200px;
		max-width: 60vw;
		aspect-ratio: 1;
	}
	.gauge-dial svg {
		width: 100%;
		height: 100%;
		display: block;
	}
	.gauge-fg {
		stroke-dasharray: 1;
		stroke-dashoffset: calc(1 - var(--fill));
		animation: gauge-draw var(--motion-dur-slow) var(--motion-ease-out) both;
	}
	@keyframes gauge-draw {
		from { stroke-dashoffset: 1; }
		to { stroke-dashoffset: calc(1 - var(--fill)); }
	}
	.gauge-center {
		position: absolute;
		inset: 0;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: var(--space-1);
	}
	.gauge-score {
		font-family: var(--font-display);
		font-size: var(--text-score);
		font-weight: 600;
		line-height: 1;
		color: var(--text-primary);
	}
	.gauge-tier {
		font-size: var(--text-sm);
		font-weight: 600;
		letter-spacing: var(--tracking-wide);
		text-transform: uppercase;
	}
	.factors {
		list-style: none;
		margin: 0;
		padding: 0;
		width: 100%;
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
	}
	.factor {
		display: grid;
		grid-template-columns: 1fr 1.4fr;
		align-items: center;
		gap: var(--space-4);
	}
	.factor-label {
		font-size: var(--text-sm);
		color: var(--text-secondary);
	}
	.factor-bar {
		height: 6px;
		border-radius: var(--radius-full);
		background: var(--border-subtle);
		overflow: hidden;
	}
	.factor-fill {
		display: block;
		height: 100%;
		border-radius: var(--radius-full);
		background: var(--accent);
		transform-origin: left;
		animation: factor-grow var(--motion-dur-base) var(--motion-ease-out) both;
	}
	@keyframes factor-grow {
		from { transform: scaleX(0); }
		to { transform: scaleX(1); }
	}
</style>
