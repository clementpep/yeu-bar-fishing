<script lang="ts">
	import PagePlaceholder from '$lib/components/ui/PagePlaceholder.svelte';

	const items = [
		{ title: 'Techniques', desc: 'Lancer-ramener, leurres de surface, pêche aux appâts.' },
		{ title: 'Montages illustrés', desc: 'Schémas clairs : nœuds, bas de ligne, plombées.' },
		{ title: 'Stratégies', desc: 'Lire la marée et choisir son poste selon le coefficient.' },
		{ title: 'Réglementation', desc: 'Maille 42 cm, quotas, zones — l’essentiel tenu à jour.' }
	];
</script>

<PagePlaceholder
	kicker="Bibliothèque"
	title="Savoir"
	body="Techniques, montages et stratégies pour le bar — en fiches claires et quiz."
	{items}
/>
