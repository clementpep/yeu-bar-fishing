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
		<p class="login-kicker">Bar d'Yeu</p>
		<h1>Connexion</h1>
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
	.login-kicker {
		font-size: var(--text-sm);
		letter-spacing: var(--tracking-wide);
		text-transform: uppercase;
		color: var(--text-faint);
		margin-bottom: var(--space-1);
	}
	.login-head h1 {
		font-size: var(--text-3xl);
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
</style>
