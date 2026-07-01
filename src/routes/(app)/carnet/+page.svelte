<script lang="ts">
	import { enhance } from '$app/forms';
	import Card from '$lib/components/ui/Card.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import TextField from '$lib/components/ui/TextField.svelte';
	import StatTile from '$lib/components/ui/StatTile.svelte';
	import { TECHNIQUES, TIDE_TRENDS, MAILLE_BAR_CM, type TideTrend } from '$lib/catch/types';
	import type { PageData, ActionData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let lengthStr = $state('');
	const lengthNum = $derived(Number(lengthStr.replace(',', '.')));
	const undersized = $derived(
		Number.isFinite(lengthNum) && lengthNum > 0 && lengthNum < MAILLE_BAR_CM
	);

	// Géolocalisation (optionnelle) — remplie côté client.
	let lat = $state('');
	let lng = $state('');
	let geoStatus = $state<'idle' | 'loading' | 'ok' | 'error'>('idle');
	let photoName = $state('');

	function locateMe() {
		if (!navigator.geolocation) {
			geoStatus = 'error';
			return;
		}
		geoStatus = 'loading';
		navigator.geolocation.getCurrentPosition(
			(pos) => {
				lat = pos.coords.latitude.toFixed(6);
				lng = pos.coords.longitude.toFixed(6);
				geoStatus = 'ok';
			},
			() => {
				geoStatus = 'error';
			},
			{ enableHighAccuracy: true, timeout: 10000 }
		);
	}

	function clearPosition() {
		lat = '';
		lng = '';
		geoStatus = 'idle';
	}

	function onPhotoChange(e: Event) {
		const input = e.currentTarget as HTMLInputElement;
		photoName = input.files && input.files.length ? input.files[0].name : '';
	}

	// Réinitialise le formulaire après un enregistrement réussi.
	function resetLocalState() {
		lengthStr = '';
		clearPosition();
		photoName = '';
	}

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

	// Cadre (bbox) autour du point pour l'aperçu carte OpenStreetMap.
	function osmEmbed(latN: number, lngN: number): string {
		const d = 0.01;
		const bbox = [lngN - d, latN - d, lngN + d, latN + d].map((n) => n.toFixed(5)).join(',');
		return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${latN},${lngN}`;
	}
	const osmLink = (latN: number, lngN: number) =>
		`https://www.openstreetmap.org/?mlat=${latN}&mlon=${lngN}#map=15/${latN}/${lngN}`;
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
	<form
		method="POST"
		action="?/add"
		enctype="multipart/form-data"
		use:enhance={() => {
			return async ({ result, update }) => {
				if (result.type === 'success') resetLocalState();
				await update();
			};
		}}
		class="catch-form"
	>
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

		<!-- Notes de pêche -->
		<TextField label="Lieu (spot)" name="place" type="text" />

		<div class="grid-2">
			<div class="field">
				<label class="field-label" for="tideTrend">Marée</label>
				<select id="tideTrend" name="tideTrend" class="select">
					<option value="">—</option>
					{#each TIDE_TRENDS as t (t.value)}
						<option value={t.value}>{t.label}</option>
					{/each}
				</select>
			</div>
			<div class="field">
				<label class="field-label" for="coefficient">Coefficient</label>
				<input
					id="coefficient"
					name="coefficient"
					type="number"
					inputmode="numeric"
					min="20"
					max="120"
					class="field-input"
					value={data.prefill.coefficient ?? ''}
				/>
			</div>
		</div>

		<div class="grid-2">
			<div class="field">
				<label class="field-label" for="tempC">Température (°C)</label>
				<input
					id="tempC"
					name="tempC"
					type="number"
					inputmode="decimal"
					step="0.5"
					class="field-input"
					value={data.prefill.tempC ?? ''}
				/>
			</div>
			<div class="field">
				<label class="field-label" for="weatherNote">Météo</label>
				<input
					id="weatherNote"
					name="weatherNote"
					type="text"
					class="field-input"
					placeholder="Ensoleillé, couvert…"
				/>
			</div>
		</div>

		<label class="toggle">
			<input type="checkbox" name="fromBoat" />
			<span>Depuis le bateau</span>
		</label>

		<!-- Avec qui : tagger un pote inscrit + noms libres -->
		<div class="field">
			<span class="field-label">Avec qui</span>
			{#if data.friends.length}
				<div class="friends">
					{#each data.friends as f (f.id)}
						<label class="friend-chip">
							<input type="checkbox" name="companions" value={f.id} />
							<span>{f.name}</span>
						</label>
					{/each}
				</div>
			{/if}
			<input
				name="companionsText"
				type="text"
				class="field-input"
				placeholder="Autres (non inscrits)…"
			/>
		</div>

		<!-- Position de la prise -->
		<div class="field">
			<span class="field-label">Position</span>
			<div class="geo">
				<Button type="button" variant="ghost" onclick={locateMe}>📍 Ma position</Button>
				{#if geoStatus === 'loading'}
					<span class="geo-status">Localisation…</span>
				{:else if geoStatus === 'ok'}
					<span class="geo-status geo-ok">Position enregistrée</span>
					<button type="button" class="geo-clear" onclick={clearPosition}>Effacer</button>
				{:else if geoStatus === 'error'}
					<span class="geo-status geo-err">Localisation indisponible</span>
				{/if}
			</div>
			<input type="hidden" name="lat" value={lat} />
			<input type="hidden" name="lng" value={lng} />
		</div>

		<!-- Photo (option) -->
		<div class="field">
			<span class="field-label">Photo (option)</span>
			<label class="photo-pick">
				<input type="file" name="photo" accept="image/*" onchange={onPhotoChange} />
				<span>{photoName || 'Choisir une photo…'}</span>
			</label>
		</div>

		<div class="field">
			<label class="field-label" for="notes">Notes</label>
			<textarea id="notes" name="notes" class="textarea" rows="2" placeholder="Remarques…"
			></textarea>
		</div>

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

					{#if c.place || c.tideTrend || c.coefficient != null || c.tempC != null || c.weatherNote || c.fromBoat}
						<div class="catch-notes">
							{#if c.place}<span class="note">📍 {c.place}</span>{/if}
							{#if c.fromBoat}<span class="note">🚤 Bateau</span>{/if}
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
							<a class="map-link" href={osmLink(c.lat, c.lng)} target="_blank" rel="noreferrer">
								Ouvrir dans OpenStreetMap
							</a>
						</details>
					{/if}

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
	.grid-2 {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: var(--space-3);
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
	.select,
	.field-input,
	.textarea {
		min-height: 48px;
		padding: var(--space-3) var(--space-4);
		font: inherit;
		font-size: var(--text-base);
		color: var(--text-primary);
		background: var(--surface-base);
		border: 1px solid var(--border-strong);
		border-radius: var(--radius-md);
	}
	.select {
		padding: 0 var(--space-4);
	}
	.textarea {
		min-height: 64px;
		resize: vertical;
		line-height: var(--leading-normal);
	}
	.field-input:focus,
	.textarea:focus,
	.select:focus {
		outline: none;
		border-color: var(--accent);
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
	.friends {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-2);
	}
	.friend-chip {
		display: inline-flex;
		align-items: center;
		gap: var(--space-2);
		padding: var(--space-2) var(--space-3);
		border: 1px solid var(--border-strong);
		border-radius: var(--radius-full);
		color: var(--text-secondary);
		font-size: var(--text-sm);
		cursor: pointer;
	}
	.friend-chip input {
		accent-color: var(--accent);
	}
	.friend-chip:has(input:checked) {
		border-color: var(--accent);
		color: var(--text-primary);
	}
	.geo {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		gap: var(--space-3);
	}
	.geo-status {
		font-size: var(--text-sm);
		color: var(--text-faint);
	}
	.geo-ok {
		color: var(--accent);
	}
	.geo-err {
		color: var(--color-danger);
	}
	.geo-clear {
		background: none;
		border: none;
		padding: 0;
		color: var(--text-faint);
		font: inherit;
		font-size: var(--text-sm);
		text-decoration: underline;
		cursor: pointer;
	}
	.photo-pick {
		display: flex;
		align-items: center;
		gap: var(--space-3);
		min-height: 48px;
		padding: 0 var(--space-4);
		border: 1px dashed var(--border-strong);
		border-radius: var(--radius-md);
		color: var(--text-secondary);
		font-size: var(--text-base);
		cursor: pointer;
	}
	.photo-pick input {
		display: none;
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
	.map-link {
		display: inline-block;
		margin-top: var(--space-2);
		font-size: var(--text-sm);
		color: var(--accent);
	}
	.catch-cond {
		font-size: var(--text-sm);
		color: var(--text-faint);
		margin: 0;
	}
</style>
