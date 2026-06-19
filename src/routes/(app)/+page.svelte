<script lang="ts">
	import Card from '$lib/components/ui/Card.svelte';
	import ScoreGauge from '$lib/components/ui/ScoreGauge.svelte';
	import TideCurve from '$lib/components/ui/TideCurve.svelte';
	import StatTile from '$lib/components/ui/StatTile.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	const m = $derived(data.moment);
</script>

<header class="moment-header">
	<p class="moment-spot">{m.spot}</p>
	<h1 class="moment-date">{m.date}</h1>
</header>

<section class="moment-hero" aria-labelledby="score-title">
	<h2 id="score-title" class="visually-hidden">Score de pêche</h2>
	<ScoreGauge score={m.score} factors={m.factors} />
	<p class="moment-why">{m.scoreWhy}</p>
</section>

<Card>
	<div class="block-head">
		<h2>Marée</h2>
		<span class="block-aside">{m.tide.nextEtale}</span>
	</div>
	<TideCurve points={m.tide.points} nowFraction={m.tide.nowFraction} coefficient={m.tide.coefficient} />
</Card>

<section class="stats" aria-label="Conditions">
	{#each m.stats as s (s.label)}
		<Card variant="inset">
			<StatTile value={s.value} unit={s.unit} label={s.label} />
		</Card>
	{/each}
</section>

<Card>
	<div class="block-head">
		<h2>{m.tip.title}</h2>
	</div>
	<p class="tip-body">{m.tip.body}</p>
</Card>

<Card>
	<div class="block-head">
		<h2>Fenêtres conseillées</h2>
	</div>
	<ul class="windows">
		{#each m.windows as w (w.label)}
			<li class="window">
				<span class="window-label">{w.label}</span>
				<span class="window-time tabular-nums">{w.time}</span>
			</li>
		{/each}
	</ul>
</Card>

<style>
	.visually-hidden {
		position: absolute;
		width: 1px;
		height: 1px;
		padding: 0;
		margin: -1px;
		overflow: hidden;
		clip: rect(0, 0, 0, 0);
		white-space: nowrap;
		border: 0;
	}
	.moment-spot {
		font-size: var(--text-sm);
		letter-spacing: var(--tracking-wide);
		text-transform: uppercase;
		color: var(--text-faint);
		margin-bottom: var(--space-1);
	}
	.moment-date {
		font-size: var(--text-2xl);
		color: var(--text-primary);
	}
	/* Marge basse renforcée sous le héro (le gap du shell gère le reste) */
	.moment-hero {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--space-6);
	}
	.moment-why {
		text-align: center;
		font-size: var(--text-base);
		line-height: var(--leading-snug);
		color: var(--text-secondary);
		max-width: 32ch;
	}
	.stats {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: var(--space-3);
	}
	.block-head {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		gap: var(--space-3);
		margin-bottom: var(--space-4);
	}
	.block-head h2 {
		font-size: var(--text-xl);
	}
	.block-aside {
		font-size: var(--text-sm);
		color: var(--accent-soft);
		white-space: nowrap;
	}
	.tip-body {
		font-size: var(--text-base);
		line-height: var(--leading-normal);
		color: var(--text-secondary);
	}
	.windows {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
	}
	.window {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: var(--space-3) 0;
		border-bottom: 1px solid var(--border-subtle);
	}
	.window:last-child {
		border-bottom: none;
	}
	.window-label {
		color: var(--text-secondary);
	}
	.window-time {
		font-weight: 600;
		color: var(--text-primary);
	}
</style>
