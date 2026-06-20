<script lang="ts">
	import PagePlaceholder from '$lib/components/ui/PagePlaceholder.svelte';

	const items = [
		{ title: 'Classement', desc: 'Le tableau des pêcheurs, réactualisé à chaque prise.' },
		{ title: 'Badges', desc: 'Des récompenses pour tes plus belles prises et tes séries.' },
		{ title: 'Défis de la semaine', desc: 'Un objectif hebdomadaire à relever entre amis.' }
	];
</script>

<PagePlaceholder
	kicker="Classement amical"
	title="Duel"
	body="Classement, badges et défis hebdomadaires entre pêcheurs."
	{items}
/>
