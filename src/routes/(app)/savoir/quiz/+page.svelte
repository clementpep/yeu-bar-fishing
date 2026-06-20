<script lang="ts">
	import { browser } from '$app/environment';
	import Button from '$lib/components/ui/Button.svelte';

	type Option = { text: string; correct?: boolean };
	type Question = { q: string; options: Option[]; explain: string };

	// Questions tirées des fiches Savoir — contenu réel pêche au bar.
	const questions: Question[] = [
		{
			q: 'Quelle est la taille minimale légale (maille) du bar en Atlantique ?',
			options: [{ text: '36 cm' }, { text: '42 cm', correct: true }, { text: '50 cm' }],
			explain: 'La maille est de 42 cm en Atlantique. En dessous, le bar doit être relâché avec soin.'
		},
		{
			q: 'Quand les leurres de surface sont-ils les plus efficaces ?',
			options: [
				{ text: 'En plein midi, plein soleil' },
				{ text: 'À l’aube et au crépuscule, sur eau peu agitée', correct: true },
				{ text: 'Par fort vent et grosse mer' }
			],
			explain: 'À l’aube et au crépuscule, sur eau calme, le « walking the dog » déclenche des attaques spectaculaires.'
		},
		{
			q: 'Le bar est avant tout un chasseur de…',
			options: [{ text: 'fond' }, { text: 'courant', correct: true }, { text: 'surface' }],
			explain: 'Le bar se poste là où le courant concentre les proies : cassures, pointes, sorties de baie.'
		},
		{
			q: 'À quel moment de la marée le bar est-il souvent le plus actif ?',
			options: [
				{ text: 'Uniquement à marée haute' },
				{ text: '1 à 2 h autour des étales', correct: true },
				{ text: 'Jamais pendant le courant' }
			],
			explain: 'Les meilleures fenêtres sont 1 à 2 h autour des étales — c’est ce que résume l’écran « Le moment ».'
		},
		{
			q: 'Pourquoi utiliser un bas de ligne en fluorocarbone ?',
			options: [
				{ text: 'Parce qu’il flotte' },
				{ text: 'Parce qu’il est discret et résiste à l’abrasion', correct: true },
				{ text: 'Parce qu’il est très élastique' }
			],
			explain: 'Le fluorocarbone est discret dans l’eau et encaisse l’abrasion sur la roche (0,30–0,40 mm).'
		},
		{
			q: 'À quoi sert un montage texan ?',
			options: [
				{ text: 'Pêcher beaucoup plus profond' },
				{ text: 'Passer dans la roche et les herbiers sans accrocher', correct: true },
				{ text: 'Alourdir le leurre' }
			],
			explain: 'Le montage texan protège l’hameçon : on prospecte la roche et les herbiers sans s’accrocher.'
		},
		{
			q: 'Que faire d’un bar pris en dessous de la maille ?',
			options: [
				{ text: 'Le garder quand même' },
				{ text: 'Le relâcher avec soin (mains mouillées)', correct: true },
				{ text: 'Le poser sur les rochers' }
			],
			explain: 'On le relâche vite, mains mouillées, sans le poser sur les rochers : sa survie en dépend.'
		}
	];

	let index = $state(0);
	let selected = $state<number | null>(null);
	let score = $state(0);
	let finished = $state(false);
	let best = $state<number | null>(null);

	const current = $derived(questions[index]);
	const answered = $derived(selected !== null);
	const isLast = $derived(index === questions.length - 1);
	const total = questions.length;

	function choose(i: number) {
		if (answered) return;
		selected = i;
		if (current.options[i].correct) score += 1;
	}

	function next() {
		if (isLast) {
			finished = true;
			if (browser) {
				const prev = Number(localStorage.getItem('savoir-quiz-best') ?? '0');
				best = Math.max(prev, score);
				localStorage.setItem('savoir-quiz-best', String(best));
			}
		} else {
			index += 1;
			selected = null;
		}
	}

	function restart() {
		index = 0;
		selected = null;
		score = 0;
		finished = false;
	}

	function optionClass(i: number): string {
		if (!answered) return '';
		if (current.options[i].correct) return 'correct';
		if (i === selected) return 'wrong';
		return 'dim';
	}

	const verdict = $derived(
		score === total
			? 'Sans-faute — tu connais ton sujet !'
			: score >= Math.ceil(total * 0.7)
				? 'Belle prise, tu maîtrises l’essentiel.'
				: score >= Math.ceil(total * 0.4)
					? 'Pas mal — relis les fiches et retente.'
					: 'Un tour par les fiches s’impose, puis retente !'
	);
</script>

<header class="page-header">
	<p class="page-kicker">Bibliothèque · Quiz</p>
	<h1>Quiz</h1>
</header>

{#if !finished}
	<div class="progress" aria-label={`Question ${index + 1} sur ${total}`}>
		<span class="progress-count tabular-nums">{index + 1}<span class="progress-total">/{total}</span></span>
		<span class="progress-track">
			<span class="progress-fill" style="width:{((index + (answered ? 1 : 0)) / total) * 100}%"></span>
		</span>
	</div>

	<section class="quiz-card">
		<p class="question">{current.q}</p>

		<ul class="options" role="list">
			{#each current.options as opt, i (i)}
				<li>
					<button
						type="button"
						class="option {optionClass(i)}"
						aria-pressed={selected === i}
						disabled={answered}
						onclick={() => choose(i)}
					>
						<span class="option-text">{opt.text}</span>
						{#if answered && opt.correct}<span class="option-mark" aria-hidden="true">✓</span>{/if}
						{#if answered && i === selected && !opt.correct}<span class="option-mark" aria-hidden="true">✕</span>{/if}
					</button>
				</li>
			{/each}
		</ul>

		{#if answered}
			<p class="explain" role="status" aria-live="polite">{current.explain}</p>
			<Button type="button" onclick={next}>{isLast ? 'Voir le résultat' : 'Question suivante'}</Button>
		{/if}
	</section>
{:else}
	<section class="result">
		<p class="result-score tabular-nums">{score}<span class="result-total">/{total}</span></p>
		<p class="result-verdict">{verdict}</p>
		{#if best !== null}
			<p class="result-best">Meilleur score : {best}/{total}</p>
		{/if}
		<div class="result-actions">
			<Button type="button" onclick={restart}>Recommencer</Button>
			<a class="result-link" href="/savoir">Revoir les fiches</a>
		</div>
	</section>
{/if}

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

	.progress {
		display: flex;
		align-items: center;
		gap: var(--space-3);
		margin-bottom: var(--space-4);
	}
	.progress-count {
		font-size: var(--text-sm);
		font-weight: 600;
		color: var(--text-secondary);
	}
	.progress-total {
		color: var(--text-faint);
	}
	.progress-track {
		flex: 1;
		height: 6px;
		border-radius: var(--radius-full);
		background: var(--border-subtle);
		overflow: hidden;
	}
	.progress-fill {
		display: block;
		height: 100%;
		border-radius: var(--radius-full);
		background: var(--accent);
		transition: width var(--motion-dur-base) var(--motion-ease-out);
	}

	.quiz-card {
		background: var(--surface-raised);
		border: 1px solid var(--border-subtle);
		border-radius: var(--radius-lg);
		box-shadow: var(--elevation-1);
		padding: var(--space-5, 20px);
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
	}
	.question {
		font-family: var(--font-display);
		font-size: var(--text-xl);
		line-height: var(--leading-snug);
		color: var(--text-primary);
	}
	.options {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
	}
	.option {
		width: 100%;
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-3);
		text-align: left;
		padding: var(--space-4);
		font: inherit;
		font-size: var(--text-base);
		color: var(--text-primary);
		background: var(--surface-base);
		border: 1px solid var(--border-strong);
		border-radius: var(--radius-md);
		cursor: pointer;
		transition:
			border-color var(--motion-dur-fast) var(--motion-ease-out),
			background var(--motion-dur-fast) var(--motion-ease-out);
	}
	@media (hover: hover) {
		.option:not(:disabled):hover {
			border-color: var(--accent);
		}
	}
	.option:disabled {
		cursor: default;
	}
	.option.correct {
		border-color: var(--score-high);
		background: color-mix(in srgb, var(--score-high) 16%, var(--surface-base));
		color: var(--text-primary);
	}
	.option.wrong {
		border-color: var(--color-danger);
		background: color-mix(in srgb, var(--color-danger) 16%, var(--surface-base));
	}
	.option.dim {
		opacity: 0.55;
	}
	.option-mark {
		flex: none;
		font-weight: 700;
	}
	.option.correct .option-mark {
		color: var(--score-high);
	}
	.option.wrong .option-mark {
		color: var(--color-danger);
	}
	.explain {
		font-size: var(--text-sm);
		line-height: var(--leading-normal);
		color: var(--text-secondary);
		padding-left: var(--space-3);
		border-left: 2px solid var(--accent);
	}

	.result {
		display: flex;
		flex-direction: column;
		align-items: center;
		text-align: center;
		gap: var(--space-3);
		padding: var(--space-8) var(--space-4);
	}
	.result-score {
		font-family: var(--font-display);
		font-size: var(--text-display);
		font-weight: 600;
		line-height: 1;
		color: var(--accent);
	}
	.result-total {
		color: var(--text-faint);
		font-size: var(--text-2xl);
	}
	.result-verdict {
		font-size: var(--text-lg);
		color: var(--text-primary);
		max-width: 28ch;
	}
	.result-best {
		font-size: var(--text-sm);
		color: var(--text-secondary);
	}
	.result-actions {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--space-4);
		margin-top: var(--space-4);
		width: 100%;
		max-width: 320px;
	}
	.result-link {
		font-size: var(--text-sm);
		color: var(--accent);
		font-weight: 500;
	}
</style>
