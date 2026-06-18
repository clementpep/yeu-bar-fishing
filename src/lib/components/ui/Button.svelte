<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		variant = 'primary',
		size = 'md',
		type = 'button',
		disabled = false,
		children,
		onclick
	}: {
		variant?: 'primary' | 'ghost';
		size?: 'sm' | 'md';
		type?: 'button' | 'submit';
		disabled?: boolean;
		children?: Snippet;
		onclick?: (e: MouseEvent) => void;
	} = $props();
</script>

<button class="btn {variant} {size}" {type} {disabled} {onclick}>
	{@render children?.()}
</button>

<style>
	.btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-height: 48px;
		padding: 0 var(--space-6);
		border-radius: var(--radius-md);
		font: inherit;
		font-weight: 600;
		letter-spacing: var(--tracking-wide);
		border: 1px solid transparent;
		cursor: pointer;
		transition:
			transform var(--motion-dur-fast) var(--motion-ease-out),
			background var(--motion-dur-fast) var(--motion-ease-out),
			box-shadow var(--motion-dur-fast) var(--motion-ease-out);
	}
	.btn.sm {
		min-height: 44px;
		padding: 0 var(--space-4);
		font-size: var(--text-sm);
	}
	.btn:active {
		transform: scale(0.97);
	}
	.btn.primary {
		background: var(--accent);
		color: var(--surface-base);
		box-shadow: var(--elevation-1);
	}
	.btn.primary:active {
		box-shadow: none;
	}
	.btn.ghost {
		background: transparent;
		color: var(--text-primary);
		border-color: var(--border-strong);
	}
	.btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
		transform: none;
	}
</style>
