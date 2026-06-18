<script lang="ts">
	import type { Snippet } from 'svelte';

	let { value, unit = '', label, icon }: {
		value: string | number;
		unit?: string;
		label: string;
		icon?: Snippet;
	} = $props();
</script>

<div class="stat">
	{#if icon}<span class="stat-icon">{@render icon()}</span>{/if}
	<span class="stat-value tabular-nums">
		<span class="stat-number">{value}</span>{#if unit}<span class="stat-unit">{unit}</span>{/if}
	</span>
	<span class="stat-label">{label}</span>
</div>

<style>
	.stat {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: var(--space-1);
		min-width: 0;
	}
	.stat-icon {
		width: 20px;
		height: 20px;
		color: var(--accent);
		margin-bottom: var(--space-1);
	}
	.stat-icon :global(svg) {
		width: 100%;
		height: 100%;
		display: block;
	}
	.stat-value {
		font-size: var(--text-xl);
		font-weight: 600;
		line-height: 1;
		color: var(--text-primary);
	}
	.stat-unit {
		font-size: var(--text-sm);
		font-weight: 500;
		color: var(--text-secondary);
		margin-left: 2px;
	}
	.stat-label {
		font-size: var(--text-xs);
		letter-spacing: var(--tracking-wide);
		text-transform: uppercase;
		color: var(--text-faint);
	}
</style>
