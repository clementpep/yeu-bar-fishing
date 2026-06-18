<script lang="ts">
	import type { TidePoint } from '$lib/types/conditions';

	let { points, nowFraction = 0.5, coefficient }: {
		points: TidePoint[];
		nowFraction?: number;
		coefficient: number;
	} = $props();

	const W = 320;
	const H = 130;
	const PAD_X = 14;
	const PAD_TOP = 18;
	const PAD_BOTTOM = 26;

	const heights = points.map((p) => p.height);
	const min = Math.min(...heights);
	const max = Math.max(...heights);
	const span = max - min || 1;

	const xAt = (i: number) =>
		PAD_X + (points.length > 1 ? (i / (points.length - 1)) * (W - PAD_X * 2) : 0);
	const yAt = (h: number) =>
		PAD_TOP + (1 - (h - min) / span) * (H - PAD_TOP - PAD_BOTTOM);

	const linePath = points
		.map((p, i) => `${i === 0 ? 'M' : 'L'}${xAt(i).toFixed(1)} ${yAt(p.height).toFixed(1)}`)
		.join(' ');
	const areaPath = `${linePath} L${xAt(points.length - 1).toFixed(1)} ${H} L${xAt(0).toFixed(1)} ${H} Z`;

	const clampedNow = Math.max(0, Math.min(1, nowFraction));
	const nowPos = clampedNow * (points.length - 1);
	const i0 = Math.floor(nowPos);
	const i1 = Math.min(i0 + 1, points.length - 1);
	const frac = nowPos - i0;
	const nowHeight = points[i0].height + (points[i1].height - points[i0].height) * frac;
	const nowX = xAt(i0) + (xAt(i1) - xAt(i0)) * frac;
	const nowY = yAt(nowHeight);

	const etales = points
		.map((p, i) => ({ ...p, i }))
		.filter((p) => p.type);
</script>

<figure class="tide">
	<figcaption class="tide-coef">
		<span class="tide-coef-label">Coefficient</span>
		<span class="tide-coef-value tabular-nums">{coefficient}</span>
	</figcaption>

	<svg viewBox="0 0 {W} {H}" preserveAspectRatio="none" role="img" aria-label="Courbe de marée du jour">
		<defs>
			<linearGradient id="tide-fill" x1="0" y1="0" x2="0" y2="1">
				<stop offset="0%" stop-color="var(--accent)" stop-opacity="0.22" />
				<stop offset="100%" stop-color="var(--accent)" stop-opacity="0" />
			</linearGradient>
		</defs>

		<path d={areaPath} fill="url(#tide-fill)" stroke="none" />
		<path
			class="tide-line"
			d={linePath}
			fill="none"
			stroke="var(--accent)"
			stroke-width="2"
			stroke-linecap="round"
			pathLength="1"
		/>

		{#each etales as e (e.i)}
			<circle cx={xAt(e.i)} cy={yAt(e.height)} r="3" fill="var(--accent-soft)" />
		{/each}

		<line
			data-now
			x1={nowX}
			y1={PAD_TOP - 6}
			x2={nowX}
			y2={H - PAD_BOTTOM}
			stroke="var(--text-faint)"
			stroke-width="1"
			stroke-dasharray="3 3"
		/>
		<circle data-now-dot cx={nowX} cy={nowY} r="4" fill="var(--text-primary)" />
	</svg>

	<ul class="tide-etales">
		{#each etales as e (e.i)}
			<li class="tide-etale">
				<span class="tide-etale-kind">{e.type === 'high' ? 'PM' : 'BM'}</span>
				<span class="tide-etale-time tabular-nums">{e.t}</span>
				<span class="tide-etale-h tabular-nums">{e.height.toFixed(1)} m</span>
			</li>
		{/each}
	</ul>
</figure>

<style>
	.tide {
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
	}
	.tide-coef {
		display: flex;
		align-items: baseline;
		gap: var(--space-2);
	}
	.tide-coef-label {
		font-size: var(--text-xs);
		text-transform: uppercase;
		letter-spacing: var(--tracking-wide);
		color: var(--text-faint);
	}
	.tide-coef-value {
		font-family: var(--font-display);
		font-size: var(--text-2xl);
		font-weight: 600;
		color: var(--accent);
	}
	svg {
		width: 100%;
		height: 130px;
		display: block;
	}
	.tide-line {
		stroke-dasharray: 1;
		stroke-dashoffset: 0;
		animation: draw var(--motion-dur-slow) var(--motion-ease-out) both;
	}
	@keyframes draw {
		from { stroke-dashoffset: 1; }
		to { stroke-dashoffset: 0; }
	}
	.tide-etales {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		gap: var(--space-4);
		flex-wrap: wrap;
	}
	.tide-etale {
		display: flex;
		align-items: baseline;
		gap: var(--space-2);
		font-size: var(--text-sm);
		color: var(--text-secondary);
	}
	.tide-etale-kind {
		font-size: var(--text-xs);
		font-weight: 600;
		letter-spacing: var(--tracking-wide);
		color: var(--accent-soft);
	}
	.tide-etale-h { color: var(--text-faint); }
</style>
