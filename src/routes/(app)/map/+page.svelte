<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import 'leaflet/dist/leaflet.css';
	import type { Map as LeafletMap } from 'leaflet';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	let mapEl: HTMLDivElement;
	let map: LeafletMap | undefined;

	// Centre de repli : île d'Yeu (Port-Joinville) quand aucune prise géolocalisée.
	const ILE_DYEU: [number, number] = [46.7276, -2.3486];

	const dateFmt = new Intl.DateTimeFormat('fr-FR', {
		timeZone: 'Europe/Paris',
		day: 'numeric',
		month: 'short',
		year: 'numeric'
	});
	const esc = (s: string) =>
		s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);

	onMount(async () => {
		const L = (await import('leaflet')).default;
		map = L.map(mapEl, { scrollWheelZoom: true });
		L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
			attribution: '© OpenStreetMap',
			maxZoom: 19
		}).addTo(map);

		if (data.points.length) {
			const markers = data.points.map((p) => {
				const date = dateFmt.format(new Date(p.caughtAt));
				const place = p.place ? `<br>${esc(p.place)}` : '';
				return L.circleMarker([p.lat, p.lng], {
					radius: 8,
					color: '#c9a24b',
					weight: 2,
					fillColor: '#c9a24b',
					fillOpacity: 0.55
				}).bindPopup(`<strong>${p.lengthCm} cm</strong> — ${date}${place}`);
			});
			const group = L.featureGroup(markers).addTo(map);
			map.fitBounds(group.getBounds().pad(0.25), { maxZoom: 16 });
		} else {
			map.setView(ILE_DYEU, 11);
		}
	});

	onDestroy(() => {
		map?.remove();
	});
</script>

<header class="page-header">
	<p class="page-kicker">Prises géolocalisées</p>
	<h1>Carte</h1>
</header>

{#if data.points.length === 0}
	<p class="empty">
		Aucune prise géolocalisée pour l'instant. Ajoute une position à tes prises depuis le Carnet
		pour les voir apparaître ici.
	</p>
{/if}

<div class="map-wrap">
	<div class="map" bind:this={mapEl}></div>
</div>

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
	.empty {
		color: var(--text-secondary);
		margin: 0;
		line-height: var(--leading-normal);
	}
	.map-wrap {
		border-radius: var(--radius-lg);
		overflow: hidden;
		border: 1px solid var(--border-subtle);
		box-shadow: var(--elevation-1);
	}
	.map {
		width: 100%;
		height: 68dvh;
		min-height: 360px;
		background: var(--surface-raised);
	}
	/* La popup Leaflet hérite du thème sombre de l'app. */
	.map-wrap :global(.leaflet-popup-content) {
		font: inherit;
		color: #1a1a1a;
	}
</style>
