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
		<div class="brand-mark">
			<img class="auth-logo" src="/branding/logo-web.png" alt="Pêche au Bar — Île d'Yeu" width="96" height="96" />
		</div>
		<div class="auth-titles">
			<h1>Créer un compte</h1>
			<p class="auth-tagline">Rejoins les pêcheurs de l’île d’Yeu.</p>
		</div>
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
		gap: var(--space-5, 20px);
		text-align: center;
	}
	/* Halo « lever de soleil » laiton derrière le logo (écho à l'icône Le moment). */
	.brand-mark {
		position: relative;
		display: grid;
		place-items: center;
	}
	.brand-mark::before {
		content: '';
		position: absolute;
		width: 220px;
		height: 220px;
		border-radius: 50%;
		background: radial-gradient(circle, rgba(201, 162, 75, 0.2), transparent 60%);
		pointer-events: none;
		z-index: 0;
	}
	.auth-logo {
		position: relative;
		z-index: 1;
		width: 96px;
		height: 96px;
		border-radius: var(--radius-xl);
		box-shadow:
			var(--elevation-2),
			0 0 0 1px var(--border-subtle);
	}
	.auth-titles {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
	}
	.auth-head h1 {
		font-size: var(--text-3xl);
	}
	.auth-tagline {
		max-width: 30ch;
		margin: 0 auto;
		font-size: var(--text-base);
		color: var(--text-secondary);
		line-height: var(--leading-snug);
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
