<script lang="ts">
	import { enhance } from '$app/forms';
	import Card from '$lib/components/ui/Card.svelte';
	import StatTile from '$lib/components/ui/StatTile.svelte';
	import CatchForm from '$lib/components/catch/CatchForm.svelte';
	import { TIDE_TRENDS, MAILLE_BAR_CM, type TideTrend } from '$lib/catch/types';
	import type { PageData, ActionData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	const dateFmt = new Intl.DateTimeFormat('fr-FR', {
		timeZone: 'Europe/Paris',
		day: 'numeric',
		month: 'short',
		hour: '2-digit',
		minute: '2-digit'
	});
	const kg = (g: number) => (g / 1000).toFixed(2);

	const tideLabel = (t: TideTrend | null) =>
		TIDE_TRENDS.find((x) => x.value === t)?.label ?? null;

	// Confirmation avant suppression (action définitive).
	function confirmDelete({ cancel }: { cancel: () => void }) {
		if (!confirm('Supprimer cette prise ? Cette action est définitive.')) {
			cancel();
			return;
		}
		return async ({ update }: { update: () => Promise<void> }) => {
			await update();
		};
	}

	// Enregistre une photo existante dans la pellicule (partage) ou la télécharge.
	async function savePhotoToDevice(name: string) {
		try {
			const res = await fetch(`/carnet/photo/${name}`);
			if (!res.ok) return;
			const blob = await res.blob();
			const file = new File([blob], name, { type: blob.type || 'image/jpeg' });
			const nav = navigator as Navigator & {
				canShare?: (data?: ShareData) => boolean;
				share?: (data?: ShareData) => Promise<void>;
			};
			if (nav.canShare?.({ files: [file] }) && nav.share) {
				await nav.share({ files: [file] });
			} else {
				const url = URL.createObjectURL(blob);
				const a = document.createElement('a');
				a.href = url;
				a.download = name;
				document.body.appendChild(a);
				a.click();
				a.remove();
				URL.revokeObjectURL(url);
			}
		} catch {
			// partage annulé / indisponible : rien à faire
		}
	}

	// Cadre (bbox) serré autour du point pour l'aperçu carte OpenStreetMap.
	function osmEmbed(latN: number, lngN: number): string {
		const radiusM = 60;
		const dLat = radiusM / 111320;
		const dLng = radiusM / (111320 * Math.cos((latN * Math.PI) / 180));
		const bbox = [lngN - dLng, latN - dLat, lngN + dLng, latN + dLat]
			.map((n) => n.toFixed(6))
			.join(',');
		return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${latN},${lngN}`;
	}
	const osmLink = (latN: number, lngN: number) =>
		`https://www.openstreetmap.org/?mlat=${latN}&mlon=${lngN}#map=19/${latN}/${lngN}`;
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
	<CatchForm
		action="?/add"
		mode="create"
		friends={data.friends}
		prefillCoefficient={data.prefill.coefficient}
		prefillTempC={data.prefill.tempC}
		formError={form?.error ?? null}
	/>
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

					{#if c.place || c.tideTrend || c.coefficient != null || c.tempC != null || c.weatherNote}
						<div class="catch-notes">
							{#if c.place}<span class="note">📍 {c.place}</span>{/if}
							{#if c.tideTrend}<span class="note">Marée {tideLabel(c.tideTrend)}</span>{/if}
							{#if c.coefficient != null}<span class="note">Coef {c.coefficient}</span>{/if}
							{#if c.tempC != null}<span class="note">{c.tempC}°C</span>{/if}
							{#if c.weatherNote}<span class="note">{c.weatherNote}</span>{/if}
						</div>
					{/if}

					{#if c.companions.length || c.companionsText}
						<p class="catch-with">
							Avec {[...c.companions.map((p) => p.name), c.companionsText]
								.filter(Boolean)
								.join(', ')}
						</p>
					{/if}

					{#if c.photo}
						<img
							class="catch-photo"
							src={`/carnet/photo/${c.photo}`}
							alt="Bar de {c.lengthCm} cm"
							loading="lazy"
						/>
					{/if}

					{#if c.notes}
						<p class="catch-notes-text">{c.notes}</p>
					{/if}

					{#if c.lat != null && c.lng != null}
						<details class="catch-map">
							<summary>Voir sur la carte</summary>
							<iframe
								class="map-frame"
								title="Carte de la prise"
								src={osmEmbed(c.lat, c.lng)}
								loading="lazy"
							></iframe>
							<div class="map-foot">
								<a class="map-link" href={osmLink(c.lat, c.lng)} target="_blank" rel="noreferrer">
									Ouvrir dans OpenStreetMap
								</a>
								{#if c.accuracyM != null}
									<span class="map-acc">Précision ±{Math.round(c.accuracyM)} m</span>
								{/if}
							</div>
						</details>
					{/if}

					{#if c.conditions}
						<p class="catch-cond">
							Coef {c.conditions.coefficient} · score {c.conditions.score} · {c.conditions.moonLabel}
						</p>
					{/if}

					<div class="catch-actions">
						<a class="action-link" href="/carnet/{c.id}">Modifier</a>
						{#if c.photo}
							<button type="button" class="action-link" onclick={() => savePhotoToDevice(c.photo!)}>
								Enregistrer la photo
							</button>
						{/if}
						<form
							method="POST"
							action="/carnet/{c.id}?/delete"
							use:enhance={confirmDelete}
							class="delete-form"
						>
							<button type="submit" class="action-link danger">Supprimer</button>
						</form>
					</div>
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
	.catch-notes {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-2);
	}
	.note {
		font-size: var(--text-xs);
		letter-spacing: var(--tracking-wide);
		padding: 2px var(--space-2);
		border-radius: var(--radius-full);
		background: var(--surface-base);
		border: 1px solid var(--border-subtle);
		color: var(--text-secondary);
	}
	.catch-with {
		font-size: var(--text-sm);
		color: var(--text-secondary);
		margin: 0;
	}
	.catch-notes-text {
		font-size: var(--text-sm);
		color: var(--text-secondary);
		margin: 0;
		line-height: var(--leading-normal);
	}
	.catch-photo {
		width: 100%;
		max-height: 320px;
		object-fit: cover;
		border-radius: var(--radius-md);
		margin-top: var(--space-1);
	}
	.catch-map summary {
		font-size: var(--text-sm);
		color: var(--accent);
		cursor: pointer;
		-webkit-tap-highlight-color: transparent;
	}
	.map-frame {
		width: 100%;
		height: 200px;
		border: 1px solid var(--border-subtle);
		border-radius: var(--radius-md);
		margin-top: var(--space-2);
	}
	.map-foot {
		display: flex;
		align-items: baseline;
		flex-wrap: wrap;
		gap: var(--space-2) var(--space-3);
		margin-top: var(--space-2);
	}
	.map-link {
		font-size: var(--text-sm);
		color: var(--accent);
	}
	.map-acc {
		font-size: var(--text-xs);
		color: var(--text-faint);
	}
	.catch-cond {
		font-size: var(--text-sm);
		color: var(--text-faint);
		margin: 0;
	}
	.catch-actions {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		gap: var(--space-4);
		margin-top: var(--space-2);
		padding-top: var(--space-2);
		border-top: 1px solid var(--border-subtle);
	}
	.delete-form {
		display: inline;
	}
	.action-link {
		background: none;
		border: none;
		padding: 0;
		font: inherit;
		font-size: var(--text-sm);
		color: var(--accent);
		text-decoration: none;
		cursor: pointer;
	}
	.action-link.danger {
		color: var(--color-danger);
	}
</style>
