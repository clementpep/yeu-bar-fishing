<script lang="ts">
	import { enhance } from '$app/forms';
	import Card from '$lib/components/ui/Card.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import TextField from '$lib/components/ui/TextField.svelte';
	import type { ActionData } from './$types';

	let { form }: { form: ActionData } = $props();
</script>

<main class="auth">
	<header class="auth-head">
		<img class="auth-logo" src="/branding/logo-web.png" alt="Pêche au Bar — Île d'Yeu" width="120" height="120" />
		<h1>Créer un compte</h1>
	</header>

	<Card>
		<form method="POST" use:enhance class="auth-form">
			<TextField label="Nom" name="name" type="text" autocomplete="name" required value={form?.name ?? ''} />
			<TextField label="Adresse e-mail" name="email" type="email" autocomplete="username" required value={form?.email ?? ''} />
			<TextField label="Mot de passe" name="password" type="password" autocomplete="new-password" required />

			{#if form?.error}
				<p class="auth-error" role="alert" aria-live="polite">{form.error}</p>
			{/if}

			<Button type="submit">S'inscrire</Button>
		</form>
	</Card>

	<p class="auth-switch">Déjà un compte ? <a href="/login">Se connecter</a></p>
</main>

<style>
	.auth {
		min-height: 100dvh;
		display: flex;
		flex-direction: column;
		justify-content: center;
		gap: var(--space-8);
		padding: var(--space-6) var(--space-4);
		padding-top: max(var(--space-6), env(safe-area-inset-top));
		padding-bottom: max(var(--space-6), env(safe-area-inset-bottom));
		max-width: 480px;
		margin: 0 auto;
	}
	@supports (min-height: 100svh) {
		.auth { min-height: 100svh; }
	}
	.auth-head {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--space-4);
		text-align: center;
	}
	.auth-logo {
		width: 120px;
		height: 120px;
		border-radius: var(--radius-lg);
		box-shadow: var(--elevation-1);
	}
	.auth-head h1 {
		font-size: var(--text-3xl);
	}
	.auth-form {
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
	}
	.auth-error {
		font-size: var(--text-sm);
		color: var(--color-danger);
	}
	.auth-switch {
		text-align: center;
		font-size: var(--text-sm);
		color: var(--text-secondary);
	}
	.auth-switch a {
		color: var(--accent);
		font-weight: 500;
	}
</style>
