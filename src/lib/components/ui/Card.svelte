<script lang="ts">
	import type { Snippet } from 'svelte';

	let { variant = 'raised', children }: {
		variant?: 'raised' | 'inset';
		children?: Snippet;
	} = $props();
</script>

<div class="card {variant}">{@render children?.()}</div>

<style>
	.card {
		border-radius: var(--radius-lg);
		padding: var(--space-6);
	}
	.card.raised {
		background: var(--surface-overlay);
		border: 1px solid var(--border-subtle);
		box-shadow: var(--elevation-2);
	}
	.card.inset {
		background: rgba(0, 0, 0, 0.18);
		border: 1px solid var(--border-subtle);
	}
</style>
