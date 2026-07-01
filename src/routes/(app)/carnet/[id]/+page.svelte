<script lang="ts">
	import { enhance } from '$app/forms';
	import Card from '$lib/components/ui/Card.svelte';
	import CatchForm from '$lib/components/catch/CatchForm.svelte';
	import type { PageData, ActionData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	function confirmDelete({ cancel }: { cancel: () => void }) {
		if (!confirm('Supprimer cette prise ? Cette action est définitive.')) {
			cancel();
			return;
		}
		return async ({ update }: { update: () => Promise<void> }) => {
			await update();
		};
	}
</script>

<header class="page-header">
	<p class="page-kicker">Modifier une prise</p>
	<h1>{data.catch.lengthCm} cm</h1>
	<a class="back" href="/carnet">← Retour au carnet</a>
</header>

<Card>
	<CatchForm
		action="?/update"
		mode="edit"
		friends={data.friends}
		initial={data.catch}
		submitLabel="Enregistrer les modifications"
		submittingLabel="Enregistrement…"
		formError={form?.error ?? null}
	/>
</Card>

<form method="POST" action="?/delete" use:enhance={confirmDelete} class="delete-block">
	<button type="submit" class="delete-btn">Supprimer cette prise</button>
</form>

<style>
	.page-header {
		margin-bottom: var(--space-2);
	}
	.page-kicker {
		font-size: var(--text-sm);
		letter-spacing: var(--tracking-wide);
		text-transform: uppercase;
		color: var(--text-faint);
		margin-bottom: var(--space-1);
	}
	.page-header h1 {
		font-size: var(--text-2xl);
	}
	.back {
		display: inline-block;
		margin-top: var(--space-2);
		font-size: var(--text-sm);
		color: var(--accent);
		text-decoration: none;
	}
	.delete-block {
		display: flex;
	}
	.delete-btn {
		width: 100%;
		min-height: 48px;
		padding: 0 var(--space-6);
		border-radius: var(--radius-md);
		font: inherit;
		font-weight: 600;
		letter-spacing: var(--tracking-wide);
		color: var(--color-danger);
		background: transparent;
		border: 1px solid var(--color-danger);
		cursor: pointer;
	}
	.delete-btn:active {
		transform: scale(0.99);
	}
</style>
