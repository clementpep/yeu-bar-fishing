<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const catchLabel = (n: number) =>
		n === 0 ? 'Pas encore de prise' : `${n} ${n > 1 ? 'prises' : 'prise'}`;
</script>

<header class="page-header">
	<p class="page-kicker">Classement amical</p>
	<h1>Duel</h1>
	<p class="lead">Le plus gros bar mène la danse — à égalité, c’est le nombre de prises qui départage.</p>
</header>

<ol class="board" aria-label="Classement des pêcheurs">
	{#each data.leaderboard as p (p.rank)}
		<li class="row" class:me={p.isMe}>
			<span class="rank" class:podium={p.rank <= 3}>{p.rank}</span>
			<span class="who">
				<span class="name">
					{p.name}{#if p.isMe}<span class="me-chip">toi</span>{/if}
				</span>
				<span class="count">{catchLabel(p.count)}</span>
			</span>
			<span class="record tabular-nums">
				{#if p.biggestCm}
					{p.biggestCm}<span class="unit">cm</span>
				{:else}
					<span class="none">—</span>
				{/if}
			</span>
		</li>
	{/each}
</ol>

<style>
	.page-header {
		margin-bottom: var(--space-4);
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
	.lead {
		margin-top: var(--space-3);
		max-width: 40ch;
		color: var(--text-secondary);
		line-height: var(--leading-normal);
	}

	.board {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
	}
	.row {
		display: flex;
		align-items: center;
		gap: var(--space-4);
		padding: var(--space-3) var(--space-4);
		background: var(--surface-raised);
		border: 1px solid var(--border-subtle);
		border-radius: var(--radius-lg);
	}
	/* Ma ligne : mise en évidence laiton (même langage que la nav active). */
	.row.me {
		background: rgba(201, 162, 75, 0.1);
		border-color: transparent;
		box-shadow: inset 0 0 0 1px rgba(201, 162, 75, 0.3);
	}
	.rank {
		flex: none;
		width: 28px;
		height: 28px;
		display: grid;
		place-items: center;
		border-radius: var(--radius-full);
		font-size: var(--text-sm);
		font-weight: 600;
		color: var(--text-faint);
		background: var(--border-subtle);
	}
	.rank.podium {
		color: var(--surface-base);
		background: var(--accent);
	}
	.who {
		flex: 1;
		min-width: 0;
		display: flex;
		flex-direction: column;
		gap: 2px;
	}
	.name {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		font-weight: 600;
		color: var(--text-primary);
	}
	.me-chip {
		font-size: var(--text-xs);
		font-weight: 600;
		letter-spacing: var(--tracking-wide);
		text-transform: uppercase;
		color: var(--accent);
		background: rgba(201, 162, 75, 0.16);
		border-radius: var(--radius-full);
		padding: 1px 7px;
	}
	.count {
		font-size: var(--text-sm);
		color: var(--text-secondary);
	}
	.record {
		flex: none;
		font-size: var(--text-xl);
		font-weight: 600;
		color: var(--text-primary);
	}
	.unit {
		font-size: var(--text-sm);
		font-weight: 500;
		color: var(--text-secondary);
		margin-left: 2px;
	}
	.none {
		color: var(--text-faint);
		font-weight: 400;
	}
</style>
