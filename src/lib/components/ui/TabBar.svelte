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
		padding-top: var(--space-2);
		padding-bottom: env(safe-area-inset-bottom);
		/* Repli opaque ; verre dépoli activé plus bas si supporté. */
		background: var(--surface-raised);
		border-top: 1px solid var(--border-subtle);
		box-shadow: var(--elevation-bar);
		z-index: 10;
	}
	/* Verre dépoli : le contenu défile en transparence sous la barre. */
	@supports ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px))) {
		.tabbar {
			background: color-mix(in srgb, var(--surface-base) 70%, transparent);
			-webkit-backdrop-filter: blur(20px) saturate(140%);
			backdrop-filter: blur(20px) saturate(140%);
		}
	}
	.tab {
		position: relative;
		flex: 1;
		min-height: 56px;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: var(--space-1);
		padding: var(--space-2) var(--space-1);
		color: var(--text-secondary);
		text-decoration: none;
		transition: color var(--motion-dur-base) var(--motion-ease-out);
	}
	.tab-icon {
		display: grid;
		place-items: center;
		height: 30px;
		padding: 0 var(--space-4);
		border-radius: var(--radius-full);
		background: transparent;
		transition:
			background var(--motion-dur-base) var(--motion-ease-out),
			box-shadow var(--motion-dur-base) var(--motion-ease-out),
			transform var(--motion-dur-base) var(--motion-ease-spring);
	}
	.tab-icon :global(svg) {
		width: 24px;
		height: 24px;
		display: block;
	}
	.tab-label {
		font-size: 0.6875rem;
		line-height: 1;
		letter-spacing: 0.01em;
		white-space: nowrap;
		font-weight: 500;
		transition: color var(--motion-dur-base) var(--motion-ease-out);
	}
	/* Survol (souris/clavier uniquement) — jamais sur l'onglet actif. */
	@media (hover: hover) {
		.tab:not(.active):hover {
			color: var(--accent-soft);
		}
		.tab:not(.active):hover .tab-icon {
			background: var(--border-subtle);
		}
	}
	.tab.active {
		color: var(--accent);
	}
	/* Pastille active nette : fin liseré laiton + léger fond + élévation. */
	.tab.active .tab-icon {
		background: rgba(201, 162, 75, 0.12);
		box-shadow:
			inset 0 0 0 1px rgba(201, 162, 75, 0.3),
			0 4px 14px rgba(0, 0, 0, 0.3);
		transform: translateY(-2px);
	}
	.tab.active .tab-label {
		font-weight: 600;
	}
</style>
