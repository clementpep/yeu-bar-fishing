<script lang="ts">
	import { enhance } from '$app/forms';
	import Card from '$lib/components/ui/Card.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import TextField from '$lib/components/ui/TextField.svelte';
	import type { ActionData } from './$types';

	let { form }: { form: ActionData } = $props();
</script>

<main class="login">
	<header class="login-head">
		<div class="brand-mark">
			<img class="login-logo" src="/branding/logo-web.png" alt="Pêche au Bar — Île d'Yeu" width="96" height="96" />
		</div>
		<div class="login-titles">
			<h1>Connexion</h1>
			<p class="login-tagline">Ton assistant de pêche au bar, à l’île d’Yeu.</p>
		</div>
	</header>

	<Card>
		<form method="POST" use:enhance class="login-form">
			<TextField label="Adresse e-mail" name="email" type="email" autocomplete="username" required value={form?.email ?? ''} />
			<TextField label="Mot de passe" name="password" type="password" autocomplete="current-password" required />

			{#if form?.error}
				<p class="login-error" role="alert" aria-live="polite">{form.error}</p>
			{/if}

			<Button type="submit">Se connecter</Button>
		</form>
	</Card>

	<p class="login-switch">Pas encore de compte ? <a href="/register">Créer un compte</a></p>
</main>

<style>
	.login {
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
		.login { min-height: 100svh; }
	}
	.login-head {
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
	.login-logo {
		position: relative;
		z-index: 1;
		width: 96px;
		height: 96px;
		border-radius: var(--radius-xl);
		box-shadow:
			var(--elevation-2),
			0 0 0 1px var(--border-subtle);
	}
	.login-titles {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
	}
	.login-head h1 {
		font-size: var(--text-3xl);
	}
	.login-tagline {
		max-width: 30ch;
		margin: 0 auto;
		font-size: var(--text-base);
		color: var(--text-secondary);
		line-height: var(--leading-snug);
	}
	.login-form {
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
	}
	.login-error {
		font-size: var(--text-sm);
		color: var(--color-danger);
	}
	.login-switch {
		text-align: center;
		font-size: var(--text-sm);
		color: var(--text-secondary);
	}
	.login-switch a {
		color: var(--accent);
		font-weight: 500;
	}
</style>
