<script lang="ts">
	import type { HTMLInputAttributes } from 'svelte/elements';

	let {
		label,
		name,
		type = 'text',
		value = $bindable(''),
		autocomplete,
		required = false
	}: {
		label: string;
		name: string;
		type?: 'text' | 'email' | 'password';
		value?: string;
		autocomplete?: HTMLInputAttributes['autocomplete'];
		required?: boolean;
	} = $props();

	const id = $derived(`field-${name}`);
</script>

<div class="field">
	<label class="field-label" for={id}>{label}</label>
	<input
		{id}
		{name}
		{type}
		{required}
		{autocomplete}
		bind:value
		class="field-input"
	/>
</div>

<style>
	.field {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
	}
	.field-label {
		font-size: var(--text-sm);
		letter-spacing: var(--tracking-wide);
		color: var(--text-secondary);
	}
	.field-input {
		min-height: 48px;
		padding: 0 var(--space-4);
		font: inherit;
		font-size: var(--text-base);
		color: var(--text-primary);
		background: var(--surface-base);
		border: 1px solid var(--border-strong);
		border-radius: var(--radius-md);
		transition: border-color var(--motion-dur-fast) var(--motion-ease-out);
	}
	.field-input:focus {
		outline: none;
		border-color: var(--accent);
	}
</style>
