<script lang="ts">
	import Card from './Card.svelte';

	let { kicker, title, body }: {
		kicker: string;
		title: string;
		body: string;
	} = $props();
</script>

<header class="page-header">
	<p class="page-kicker">{kicker}</p>
	<h1>{title}</h1>
</header>

<Card>
	<p class="coming">{body}</p>
</Card>

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
	.coming {
		color: var(--text-secondary);
		line-height: var(--leading-normal);
	}
</style>
