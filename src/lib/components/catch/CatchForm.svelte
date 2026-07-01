<script lang="ts">
	import { untrack } from 'svelte';
	import { enhance } from '$app/forms';
	import Button from '$lib/components/ui/Button.svelte';
	import TextField from '$lib/components/ui/TextField.svelte';
	import { TECHNIQUES, TIDE_TRENDS, MAILLE_BAR_CM, type Catch } from '$lib/catch/types';

	let {
		action,
		mode = 'create',
		friends,
		initial = null,
		prefillCoefficient = null,
		prefillTempC = null,
		submitLabel = 'Enregistrer la prise',
		submittingLabel = 'Enregistrement…',
		formError = null
	}: {
		action: string;
		mode?: 'create' | 'edit';
		friends: { id: string; name: string }[];
		initial?: Catch | null;
		prefillCoefficient?: number | null;
		prefillTempC?: number | null;
		submitLabel?: string;
		submittingLabel?: string;
		formError?: string | null;
	} = $props();

	// `initial` est fourni une fois (page d'édition chargée à neuf) : on capture ses
	// valeurs de départ dans des locales non réactives pour initialiser l'état.
	const init = untrack(() => initial);
	const initialCompanionIds = new Set((init?.companions ?? []).map((c) => c.id));

	let lengthStr = $state(init ? String(init.lengthCm) : '');
	const lengthNum = $derived(Number(lengthStr.replace(',', '.')));
	const undersized = $derived(
		Number.isFinite(lengthNum) && lengthNum > 0 && lengthNum < MAILLE_BAR_CM
	);

	// Géolocalisation — pré-remplie en édition.
	let lat = $state(init?.lat != null ? String(init.lat) : '');
	let lng = $state(init?.lng != null ? String(init.lng) : '');
	let accuracy = $state<number | null>(init?.accuracyM != null ? Math.round(init.accuracyM) : null);
	let geoStatus = $state<'idle' | 'loading' | 'ok' | 'error'>(init?.lat != null ? 'ok' : 'idle');

	// Photo : compressée côté client avant envoi. On garde aussi l'original pleine
	// résolution pour l'enregistrement dans la pellicule.
	let photoName = $state('');
	let photoBlob = $state<Blob | null>(null);
	let photoOriginal = $state<File | null>(null);
	let compressing = $state(false);
	let removePhoto = $state(false);
	let savingToDevice = $state(false);

	let submitting = $state(false);
	let submitError = $state('');

	function locateMe() {
		if (!navigator.geolocation) {
			geoStatus = 'error';
			return;
		}
		geoStatus = 'loading';
		accuracy = null;
		navigator.geolocation.getCurrentPosition(
			(pos) => {
				lat = pos.coords.latitude.toFixed(7);
				lng = pos.coords.longitude.toFixed(7);
				accuracy = Math.round(pos.coords.accuracy);
				geoStatus = 'ok';
			},
			() => {
				geoStatus = 'error';
			},
			{ enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
		);
	}

	function clearPosition() {
		lat = '';
		lng = '';
		accuracy = null;
		geoStatus = 'idle';
	}

	// Redimensionne/compresse l'image (max 1280 px, JPEG ~0.72) pour un envoi léger.
	async function compressImage(file: File): Promise<Blob> {
		const maxEdge = 1280;
		const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
		const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
		const w = Math.max(1, Math.round(bitmap.width * scale));
		const h = Math.max(1, Math.round(bitmap.height * scale));
		const canvas = document.createElement('canvas');
		canvas.width = w;
		canvas.height = h;
		const ctx = canvas.getContext('2d');
		if (!ctx) return file;
		ctx.drawImage(bitmap, 0, 0, w, h);
		bitmap.close?.();
		const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, 'image/jpeg', 0.72));
		return blob ?? file;
	}

	async function onPhotoChange(e: Event) {
		const input = e.currentTarget as HTMLInputElement;
		const file = input.files && input.files.length ? input.files[0] : null;
		if (!file) {
			photoName = '';
			photoBlob = null;
			photoOriginal = null;
			return;
		}
		photoOriginal = file;
		photoName = file.name;
		removePhoto = false;
		compressing = true;
		try {
			photoBlob = await compressImage(file);
		} catch {
			photoBlob = file; // repli : on envoie l'original
		} finally {
			compressing = false;
		}
	}

	// Enregistre la photo dans la pellicule / le stockage de l'appareil.
	// iOS/Android : feuille de partage (« Enregistrer l'image ») ; sinon téléchargement.
	async function saveToPellicule() {
		savingToDevice = true;
		try {
			let blob: Blob | null = photoOriginal;
			let filename = photoOriginal?.name || 'prise.jpg';
			if (!blob && initial?.photo) {
				const res = await fetch(`/carnet/photo/${initial.photo}`);
				if (!res.ok) return;
				blob = await res.blob();
				filename = initial.photo;
			}
			if (!blob) return;
			const type = blob.type || 'image/jpeg';
			const file = new File([blob], filename, { type });
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
				a.download = filename;
				document.body.appendChild(a);
				a.click();
				a.remove();
				URL.revokeObjectURL(url);
			}
		} catch {
			// partage annulé par l'utilisateur : rien à faire
		} finally {
			savingToDevice = false;
		}
	}

	function resetForCreate() {
		lengthStr = '';
		clearPosition();
		photoName = '';
		photoBlob = null;
		photoOriginal = null;
		removePhoto = false;
	}

	const showSaveToPellicule = $derived(
		!!photoOriginal || (mode === 'edit' && !!initial?.photo && !removePhoto)
	);
</script>

<form
	method="POST"
	{action}
	enctype="multipart/form-data"
	use:enhance={({ formData, cancel }) => {
		if (submitting || compressing) {
			cancel();
			return;
		}
		submitError = '';
		submitting = true;
		// Remplace le fichier brut par la version compressée (envoi léger).
		if (photoBlob) formData.set('photo', photoBlob, 'photo.jpg');
		return async ({ result, update }) => {
			submitting = false;
			if (result.type === 'success') {
				if (mode === 'create') resetForCreate();
				await update();
			} else if (result.type === 'error') {
				submitError = "L'enregistrement a échoué. Vérifie ta connexion et réessaie.";
			} else {
				await update();
			}
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
			<option value="" selected={!initial?.technique}>—</option>
			{#each TECHNIQUES as t (t)}
				<option value={t} selected={initial?.technique === t}>{t}</option>
			{/each}
		</select>
	</div>

	<TextField label="Leurre / appât" name="lureBait" type="text" value={initial?.lureBait ?? ''} />

	<label class="toggle">
		<input type="checkbox" name="released" checked={initial?.released ?? false} />
		<span>Relâché</span>
	</label>

	<!-- Notes de pêche -->
	<TextField label="Lieu (spot)" name="place" type="text" value={initial?.place ?? ''} />

	<div class="grid-2">
		<div class="field">
			<label class="field-label" for="tideTrend">Marée</label>
			<select id="tideTrend" name="tideTrend" class="select">
				<option value="" selected={!initial?.tideTrend}>—</option>
				{#each TIDE_TRENDS as t (t.value)}
					<option value={t.value} selected={initial?.tideTrend === t.value}>{t.label}</option>
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
				value={initial ? (initial.coefficient ?? '') : (prefillCoefficient ?? '')}
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
				value={initial ? (initial.tempC ?? '') : (prefillTempC ?? '')}
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
				value={initial?.weatherNote ?? ''}
			/>
		</div>
	</div>

	<!-- Avec qui : tagger un pote inscrit + noms libres -->
	<div class="field">
		<span class="field-label">Avec qui</span>
		{#if friends.length}
			<div class="friends">
				{#each friends as f (f.id)}
					<label class="friend-chip">
						<input
							type="checkbox"
							name="companions"
							value={f.id}
							checked={initialCompanionIds.has(f.id)}
						/>
						<span>{f.name}</span>
					</label>
				{/each}
			</div>
		{/if}
		<input
			name="companionsText"
			type="text"
			class="field-input"
			placeholder="Autres (non inscrits), séparés par des virgules…"
			value={initial?.companionsText ?? ''}
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
				<span class="geo-status geo-ok">
					Position enregistrée{accuracy != null ? ` (±${accuracy} m)` : ''}
				</span>
				<button type="button" class="geo-clear" onclick={locateMe}>Réessayer</button>
				<button type="button" class="geo-clear" onclick={clearPosition}>Effacer</button>
			{:else if geoStatus === 'error'}
				<span class="geo-status geo-err">Localisation indisponible</span>
			{/if}
		</div>
		{#if geoStatus === 'ok' && accuracy != null && accuracy > 25}
			<p class="geo-hint">
				Précision faible (±{accuracy} m) — attends d'avoir un bon signal GPS puis « Réessayer ».
			</p>
		{/if}
		<input type="hidden" name="lat" value={lat} />
		<input type="hidden" name="lng" value={lng} />
		<input type="hidden" name="accuracyM" value={accuracy ?? ''} />
	</div>

	<!-- Photo (option) -->
	<div class="field">
		<span class="field-label">Photo (option)</span>
		{#if mode === 'edit' && initial?.photo && !removePhoto}
			<img class="photo-current" src={`/carnet/photo/${initial.photo}`} alt="Prise actuelle" />
		{/if}
		<label class="photo-pick">
			<input type="file" name="photo" accept="image/*" onchange={onPhotoChange} />
			<span>
				{#if compressing}Compression…{:else if photoName}{photoName}{:else if mode === 'edit' && initial?.photo && !removePhoto}Remplacer la photo…{:else}Choisir une photo…{/if}
			</span>
		</label>
		{#if showSaveToPellicule}
			<button type="button" class="link-btn" onclick={saveToPellicule} disabled={savingToDevice}>
				📷 {savingToDevice ? 'Ouverture…' : 'Enregistrer dans la pellicule'}
			</button>
		{/if}
		{#if mode === 'edit' && initial?.photo}
			<label class="toggle toggle-sm">
				<input type="checkbox" name="removePhoto" bind:checked={removePhoto} />
				<span>Retirer la photo</span>
			</label>
		{/if}
	</div>

	<div class="field">
		<label class="field-label" for="notes">Notes</label>
		<textarea id="notes" name="notes" class="textarea" rows="2" placeholder="Remarques…"
			>{initial?.notes ?? ''}</textarea
		>
	</div>

	{#if formError}
		<p class="form-error" role="alert" aria-live="polite">{formError}</p>
	{/if}
	{#if submitError}
		<p class="form-error" role="alert" aria-live="polite">{submitError}</p>
	{/if}

	<Button type="submit" disabled={submitting || compressing}>
		{submitting ? submittingLabel : submitLabel}
	</Button>
</form>

<style>
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
		min-width: 0;
	}
	.field-label {
		font-size: var(--text-sm);
		letter-spacing: var(--tracking-wide);
		color: var(--text-secondary);
	}
	.select,
	.field-input,
	.textarea {
		width: 100%;
		min-width: 0;
		box-sizing: border-box;
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
	.toggle-sm {
		min-height: 36px;
		font-size: var(--text-sm);
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
	.geo-hint {
		margin: 0;
		font-size: var(--text-sm);
		color: var(--color-danger);
	}
	.photo-current {
		width: 100%;
		max-height: 240px;
		object-fit: cover;
		border-radius: var(--radius-md);
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
	.link-btn {
		align-self: flex-start;
		background: none;
		border: none;
		padding: 0;
		color: var(--accent);
		font: inherit;
		font-size: var(--text-sm);
		cursor: pointer;
	}
	.link-btn:disabled {
		opacity: 0.6;
		cursor: default;
	}
	.form-error {
		font-size: var(--text-sm);
		color: var(--color-danger);
	}
</style>
