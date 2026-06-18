<script lang="ts">
	import { enhance } from '$app/forms';
	import Card from '$lib/components/ui/Card.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import TextField from '$lib/components/ui/TextField.svelte';
	import type { PageData, ActionData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();
</script>

<header class="page-header">
	<p class="page-kicker">Compte</p>
	<h1>Profil</h1>
</header>

<Card>
	<dl class="account">
		<div class="row"><dt>Nom</dt><dd>{data.user.name}</dd></div>
		<div class="row"><dt>E-mail</dt><dd>{data.user.email}</dd></div>
		<div class="row"><dt>Spot par défaut</dt><dd>Île d'Yeu · Port-Joinville</dd></div>
	</dl>
</Card>

<Card>
	<h2 class="block-title">Changer le mot de passe</h2>
	<form method="POST" action="?/changePassword" use:enhance class="pw-form">
		<TextField label="Mot de passe actuel" name="current" type="password" autocomplete="current-password" required />
		<TextField label="Nouveau mot de passe" name="next" type="password" autocomplete="new-password" required />
		{#if form?.pwError}
			<p class="form-error" role="alert" aria-live="polite">{form.pwError}</p>
		{/if}
		<Button type="submit" variant="ghost">Mettre à jour</Button>
	</form>
</Card>

<form method="POST" action="?/logout" use:enhance class="logout-form">
	<Button type="submit">Se déconnecter</Button>
</form>

<style>
	.page-header { margin-bottom: var(--space-2); }
	.page-kicker {
		font-size: var(--text-sm);
		letter-spacing: var(--tracking-wide);
		text-transform: uppercase;
		color: var(--text-faint);
		margin-bottom: var(--space-1);
	}
	.page-header h1 { font-size: var(--text-2xl); }
	.account { margin: 0; display: flex; flex-direction: column; gap: var(--space-3); }
	.row { display: flex; align-items: baseline; justify-content: space-between; gap: var(--space-3); }
	.row dt { color: var(--text-faint); font-size: var(--text-sm); }
	.row dd { margin: 0; color: var(--text-primary); font-weight: 500; }
	.block-title { font-size: var(--text-xl); margin-bottom: var(--space-4); }
	.pw-form { display: flex; flex-direction: column; gap: var(--space-4); }
	.form-error { font-size: var(--text-sm); color: var(--color-danger); }
	.logout-form { display: flex; }
	.logout-form :global(.btn) { width: 100%; }
</style>
