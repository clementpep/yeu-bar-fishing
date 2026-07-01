<script lang="ts">
	import { page } from '$app/stores';
	import TabBar from '$lib/components/ui/TabBar.svelte';
	import IconProfil from '$lib/components/icons/IconProfil.svelte';
	import type { LayoutData } from './$types';

	let { children, data }: { children?: any; data: LayoutData } = $props();

	const initial = $derived((data.user?.name ?? '?').trim().charAt(0).toUpperCase() || '?');
	const onProfil = $derived($page.url.pathname.startsWith('/profil'));
</script>

<div class="app-shell">
	<a
		href="/profil"
		class="profile-btn"
		class:active={onProfil}
		aria-label="Profil"
		aria-current={onProfil ? 'page' : undefined}
	>
		{#if initial !== '?'}
			<span class="profile-initial" aria-hidden="true">{initial}</span>
		{:else}
			<span class="profile-icon" aria-hidden="true"><IconProfil /></span>
		{/if}
	</a>

	<main>{@render children?.()}</main>
	<TabBar />
</div>

<style>
	.app-shell {
		min-height: 100dvh;
	}
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
	.profile-btn {
		position: fixed;
		top: max(var(--space-4), env(safe-area-inset-top));
		right: max(var(--space-4), env(safe-area-inset-right));
		z-index: 20;
		display: grid;
		place-items: center;
		width: 40px;
		height: 40px;
		border-radius: var(--radius-full);
		background: var(--surface-raised);
		color: var(--text-secondary);
		border: 1px solid var(--border-subtle);
		box-shadow: var(--elevation-1);
		text-decoration: none;
		font-weight: 600;
		-webkit-tap-highlight-color: transparent;
		transition:
			color var(--motion-dur-base) var(--motion-ease-out),
			box-shadow var(--motion-dur-base) var(--motion-ease-out),
			transform var(--motion-dur-fast) var(--motion-ease-out);
	}
	.profile-btn:active {
		transform: scale(0.95);
	}
	.profile-btn.active {
		color: var(--accent);
		border-color: rgba(201, 162, 75, 0.4);
		box-shadow:
			inset 0 0 0 1px rgba(201, 162, 75, 0.3),
			var(--elevation-1);
	}
	.profile-initial {
		font-size: var(--text-base);
		line-height: 1;
	}
	.profile-icon {
		display: grid;
		place-items: center;
	}
	.profile-icon :global(svg) {
		width: 22px;
		height: 22px;
	}
</style>
