<script lang="ts">
	let { kicker, title, body, items = [] }: {
		kicker: string;
		title: string;
		body: string;
		/** Aperçu de ce qui arrive — présenté en fil de sonde. */
		items?: { title: string; desc: string }[];
	} = $props();
</script>

<header class="page-header">
	<p class="page-kicker">{kicker}</p>
	<div class="title-row">
		<h1>{title}</h1>
		<span class="soon">Bientôt</span>
	</div>
	<p class="lead">{body}</p>
</header>

{#if items.length}
	<ul class="preview">
		{#each items as item, i (i)}
			<li class="item">
				<span class="node" aria-hidden="true"></span>
				<div class="item-text">
					<p class="item-title">{item.title}</p>
					<p class="item-desc">{item.desc}</p>
				</div>
			</li>
		{/each}
	</ul>
{/if}

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
	.title-row {
		display: flex;
		align-items: center;
		gap: var(--space-3);
	}
	.title-row h1 {
		font-size: var(--text-2xl);
	}
	/* Badge « Bientôt » — même langage que la pastille active de la nav. */
	.soon {
		flex: none;
		font-size: 0.625rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: var(--tracking-wide);
		color: var(--accent);
		background: rgba(201, 162, 75, 0.12);
		box-shadow: inset 0 0 0 1px rgba(201, 162, 75, 0.3);
		border-radius: var(--radius-full);
		padding: 3px 9px;
	}
	.lead {
		margin-top: var(--space-3);
		max-width: 38ch;
		color: var(--text-secondary);
		line-height: var(--leading-normal);
	}

	/* Fil de sonde : timeline verticale à nœuds laiton. */
	.preview {
		list-style: none;
		margin: var(--space-8) 0 0;
		padding: 0;
	}
	.item {
		position: relative;
		display: flex;
		padding: 0 0 var(--space-6) var(--space-6);
	}
	.item:last-child {
		padding-bottom: 0;
	}
	/* Ligne reliant les nœuds (le fil). */
	.item::before {
		content: '';
		position: absolute;
		left: 4px;
		top: 14px;
		bottom: -2px;
		width: 1px;
		background: var(--border-strong);
	}
	.item:last-child::before {
		display: none;
	}
	.node {
		position: absolute;
		left: 0;
		top: 5px;
		width: 9px;
		height: 9px;
		border-radius: 50%;
		background: var(--accent);
		box-shadow: 0 0 0 4px rgba(201, 162, 75, 0.14);
	}
	.item-title {
		font-weight: 600;
		color: var(--text-primary);
	}
	.item-desc {
		margin-top: 2px;
		font-size: var(--text-sm);
		color: var(--text-secondary);
		line-height: var(--leading-snug);
	}
</style>
