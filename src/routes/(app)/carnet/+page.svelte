<script lang="ts">
	import { enhance } from '$app/forms';
	import Card from '$lib/components/ui/Card.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import TextField from '$lib/components/ui/TextField.svelte';
	import StatTile from '$lib/components/ui/StatTile.svelte';
	import { TECHNIQUES, MAILLE_BAR_CM } from '$lib/catch/types';
	import type { PageData, ActionData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let lengthStr = $state('');
	const lengthNum = $derived(Number(lengthStr.replace(',', '.')));
	const undersized = $derived(Number.isFinite(lengthNum) && lengthNum > 0 && lengthNum < MAILLE_BAR_CM);

	const dateFmt = new Intl.DateTimeFormat('fr-FR', {
		timeZone: 'Europe/Paris',
		day: 'numeric',
		month: 'short',
		hour: '2-digit',
		minute: '2-digit'
	});
	const kg = (g: number) => (g / 1000).toFixed(2);
</script>

<header class="page-header">
	<p class="page-kicker">Prises &amp; records</p>
	<h1>Carnet</h1>
</header>

<section class="records" aria-label="Records">
	<Card variant="inset"><StatTile value={data.records.count} label="Prises" /></Card>
	<Card variant="inset">
		<StatTile
			value={data.records.biggestCm ? data.records.biggestCm : '—'}
			unit={data.records.biggestCm ? 'cm' : ''}
			label="Record"
		/>
	</Card>
	<Card variant="inset"><StatTile value={data.records.totalReleased} label="Relâchés" /></Card>
</section>

<Card>
	<h2 class="block-title">Nouvelle prise</h2>
	<form method="POST" action="?/add" use:enhance class="catch-form">
		<TextField label="Taille (cm)" name="lengthCm" type="text" required bind:value={lengthStr} />
		{#if undersized}
			<p class="maille" role="status" aria-live="polite">
				En dessous de la maille ({MAILLE_BAR_CM} cm) — à relâcher.
			</p>
		{/if}

		<div class="field">
			<label class="field-label" for="technique">Technique</label>
			<select id="technique" name="technique" class="select">
				<option value="">—</option>
				{#each TECHNIQUES as t (t)}
					<option value={t}>{t}</option>
				{/each}
			</select>
		</div>

		<TextField label="Leurre / appât" name="lureBait" type="text" />

		<label class="toggle">
			<input type="checkbox" name="released" />
			<span>Relâché</span>
		</label>

		{#if form?.error}
			<p class="form-error" role="alert" aria-live="polite">{form.error}</p>
		{/if}

		<Button type="submit">Enregistrer la prise</Button>
	</form>
</Card>

<section class="list" aria-label="Historique des prises">
	<h2 class="block-title">Historique</h2>
	{#if data.catches.length === 0}
		<Card><p class="empty">Aucune prise pour l'instant. Bonne pêche !</p></Card>
	{:else}
		{#each data.catches as c (c.id)}
			<Card>
				<div class="catch">
					<div class="catch-main">
						<span class="catch-size tabular-nums">{c.lengthCm} cm</span>
						<span class="catch-weight tabular-nums">≈ {kg(c.weightEstG)} kg</span>
					</div>
					<div class="catch-meta">
						<span class="catch-date">{dateFmt.format(new Date(c.caughtAt))}</span>
						{#if c.technique}<span class="chip">{c.technique}</span>{/if}
						{#if c.lureBait}<span class="catch-lure">{c.lureBait}</span>{/if}
						{#if c.released}
							<span class="chip chip-soft">Relâché</span>
						{:else if c.lengthCm < MAILLE_BAR_CM}
							<span class="chip chip-warn">Sous maille</span>
						{:else}
							<span class="chip">Gardé</span>
						{/if}
					</div>
					{#if c.conditions}
						<p class="catch-cond">
							Coef {c.conditions.coefficient} · score {c.conditions.score} · {c.conditions.moonLabel}
						</p>
					{/if}
				</div>
			</Card>
		{/each}
	{/if}
</section>

<style>
	.page-header {
		margin-bottom: var(--space-2);
	}
	.page-kicker {
		font-size: var(--text-sm);
		letter-spacing: var(--tracking-wide);
		text-transform: uppercase;
		color: var(--text-faint);
		margin-bottom: var(--space-1);
	}
	.page-header h1 {
		font-size: var(--text-2xl);
	}
	.records {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: var(--space-3);
	}
	.block-title {
		font-size: var(--text-xl);
		margin-bottom: var(--space-4);
	}
	.catch-form {
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
	}
	.maille {
		font-size: var(--text-sm);
		color: var(--color-danger);
		margin: 0;
	}
	.field {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
	}
	.field-label {
		font-size: var(--text-sm);
		letter-spacing: var(--tracking-wide);
		color: var(--text-secondary);
	}
	.select {
		min-height: 48px;
		padding: 0 var(--space-4);
		font: inherit;
		font-size: var(--text-base);
		color: var(--text-primary);
		background: var(--surface-base);
		border: 1px solid var(--border-strong);
		border-radius: var(--radius-md);
	}
	.toggle {
		display: flex;
		align-items: center;
		gap: var(--space-3);
		min-height: 44px;
		color: var(--text-secondary);
		font-size: var(--text-base);
	}
	.toggle input {
		width: 20px;
		height: 20px;
		accent-color: var(--accent);
	}
	.form-error {
		font-size: var(--text-sm);
		color: var(--color-danger);
	}
	.list {
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
	}
	.empty {
		color: var(--text-secondary);
		margin: 0;
	}
	.catch {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
	}
	.catch-main {
		display: flex;
		align-items: baseline;
		gap: var(--space-3);
	}
	.catch-size {
		font-size: var(--text-xl);
		font-weight: 600;
		color: var(--text-primary);
	}
	.catch-weight {
		color: var(--text-faint);
	}
	.catch-meta {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		gap: var(--space-2);
	}
	.catch-date {
		font-size: var(--text-sm);
		color: var(--text-faint);
	}
	.catch-lure {
		font-size: var(--text-sm);
		color: var(--text-secondary);
	}
	.chip {
		font-size: var(--text-xs);
		letter-spacing: var(--tracking-wide);
		padding: 2px var(--space-2);
		border-radius: var(--radius-full);
		background: var(--border-subtle);
		color: var(--text-secondary);
	}
	.chip-soft {
		color: var(--accent);
	}
	.chip-warn {
		color: var(--color-danger);
	}
	.catch-cond {
		font-size: var(--text-sm);
		color: var(--text-faint);
		margin: 0;
	}
</style>
