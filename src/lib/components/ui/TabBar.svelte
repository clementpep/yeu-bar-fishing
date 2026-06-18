<script lang="ts">
	import { page } from '$app/stores';
	import IconMoment from '$lib/components/icons/IconMoment.svelte';
	import IconSavoir from '$lib/components/icons/IconSavoir.svelte';
	import IconCarnet from '$lib/components/icons/IconCarnet.svelte';
	import IconDuel from '$lib/components/icons/IconDuel.svelte';
	import IconProfil from '$lib/components/icons/IconProfil.svelte';

	const tabs = [
		{ href: '/', label: 'Le moment', icon: IconMoment },
		{ href: '/savoir', label: 'Savoir', icon: IconSavoir },
		{ href: '/carnet', label: 'Carnet', icon: IconCarnet },
		{ href: '/duel', label: 'Duel', icon: IconDuel },
		{ href: '/profil', label: 'Profil', icon: IconProfil }
	];

	const isActive = (href: string, path: string) =>
		href === '/' ? path === '/' : path.startsWith(href);
</script>

<nav class="tabbar" aria-label="Navigation principale">
	{#each tabs as tab (tab.href)}
		{@const active = isActive(tab.href, $page.url.pathname)}
		{@const Icon = tab.icon}
		<a
			href={tab.href}
			class="tab"
			class:active
			aria-current={active ? 'page' : undefined}
		>
			<span class="tab-icon" aria-hidden="true"><Icon /></span>
			<span class="tab-label">{tab.label}</span>
		</a>
	{/each}
</nav>

<style>
	.tabbar {
		position: fixed;
		bottom: 0;
		left: 0;
		right: 0;
		display: flex;
		justify-content: space-around;
		background: var(--surface-raised);
		border-top: 1px solid var(--border-subtle);
		padding-bottom: env(safe-area-inset-bottom);
		box-shadow: var(--elevation-bar);
		z-index: 10;
	}
	.tab {
		position: relative;
		flex: 1;
		min-height: 56px;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 4px;
		padding: 8px 4px;
		color: var(--text-secondary);
		text-decoration: none;
		transition: color var(--motion-dur-fast) var(--motion-ease-out);
	}
	.tab-icon {
		width: 24px;
		height: 24px;
		display: block;
	}
	.tab-icon :global(svg) {
		width: 100%;
		height: 100%;
		display: block;
	}
	.tab-label {
		font-size: var(--text-xs);
		letter-spacing: var(--tracking-wide);
	}
	.tab.active {
		color: var(--accent);
	}
	.tab.active .tab-label {
		font-weight: 600;
	}
	.tab.active::before {
		content: '';
		position: absolute;
		top: 0;
		left: 50%;
		transform: translateX(-50%);
		width: 22px;
		height: 2px;
		background: var(--accent);
		border-radius: var(--radius-full);
	}
</style>
