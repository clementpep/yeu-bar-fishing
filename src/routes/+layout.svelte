<script lang="ts">
	import '../app.css';
	import TabBar from '$lib/components/ui/TabBar.svelte';
	let { children }: { children?: any } = $props();
</script>

<div class="app-shell">
	<main>{@render children?.()}</main>
	<TabBar />
</div>

<style>
	.app-shell { min-height: 100dvh; }
	main {
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
		padding: var(--space-6) var(--space-4);
		padding-top: max(var(--space-6), env(safe-area-inset-top));
		padding-bottom: calc(var(--tabbar-height) + env(safe-area-inset-bottom));
		max-width: 640px;
		margin: 0 auto;
	}
</style>
