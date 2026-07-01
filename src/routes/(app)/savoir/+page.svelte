<script lang="ts">
	// Contenu statique — bibliothèque pêche au bar (île d'Yeu). Pas de back, pas de DB.
	type Fiche = { id: string; titre: string; chapeau: string; points: string[] };

	const fiches: Fiche[] = [
		{
			id: 'techniques',
			titre: 'Techniques de pêche',
			chapeau: 'Du leurre à l’appât, comment provoquer l’attaque du bar.',
			points: [
				'Poissons nageurs (jerkbaits) : imitent un petit poisson fuyard. Redoutables le long des cassures et sur les chasses, en récupération linéaire ou en dents de scie.',
				'Leurres de surface (stickbaits, poppers) : à l’aube et au crépuscule, sur eau peu agitée. Le « walking the dog » déclenche des attaques spectaculaires.',
				'Leurres souples sur tête plombée : les plus polyvalents. On prospecte toute la couche d’eau en adaptant le poids au courant.',
				'Aux appâts : crabe mou (top au printemps), lançon, ver de chalut. Souvent décisifs quand l’eau est troublée ou le poisson méfiant.'
			]
		},
		{
			id: 'montages',
			titre: 'Montages essentiels',
			chapeau: 'Le bon montage selon le poste et la nature du fond.',
			points: [
				'Tête plombée : le plus simple pour le leurre souple. Poids choisi selon la profondeur et la force du courant.',
				'Montage texan : pour passer dans la roche et les herbiers sans accrocher.',
				'Bas de ligne fluorocarbone 0,30–0,40 mm : discret et résistant à l’abrasion sur la roche.',
				'Montage coulissant (appât) : le bar prend l’appât sans sentir le plomb, donc moins de méfiance.'
			]
		},
		{
			id: 'noeuds',
			titre: 'Nœuds essentiels',
			chapeau: 'Cinq nœuds d’hameçon et raccords de bas de ligne à connaître par cœur.',
			points: [
				'Nœud Palomar (hameçon/émerillon) : passe la boucle dans l’œillet, fais un nœud simple, repasse l’hameçon dans la boucle, humidifie et serre. Ultra solide et rapide, même sur tresse.',
				'Clinch amélioré (hameçon/agrafe) : passe le fil dans l’œillet, fais 5–6 tours autour du corps, repasse par la première boucle puis par la grande boucle. Le classique du montage au fluorocarbone.',
				'Nœud Rapala / nœud de boucle (leurre) : laisse une boucle libre devant le leurre pour une nage plus ample et naturelle. Idéal pour les poissons nageurs et stickbaits.',
				'Nœud Uni / Grinner (polyvalent) : 5 tours du brin autour du corps de ligne à l’intérieur d’une boucle, puis serre. Fiable sur tresse comme fluoro, base du Double Uni.',
				'Nœud FG (raccord tresse ↔ fluorocarbone) : le plus fin et le plus résistant pour relier le corps tressé au bas de ligne fluoro. Passe dans les anneaux sans accrocher — la référence pour le bar aux leurres.',
				'Double Uni (raccord de deux fils) : deux nœuds Uni face à face que l’on rapproche. Simple et solide pour raccorder corps de ligne et bas de ligne de diamètres proches.'
			]
		},
		{
			id: 'maree',
			titre: 'Lire la marée',
			chapeau: 'Le bar est un chasseur de courant : se placer au bon endroit, au bon moment.',
			points: [
				'Les postes : cassures, pointes rocheuses, sorties de baie — partout où le courant concentre les proies.',
				'Les fenêtres : 1 à 2 h autour des étales, plus l’aube et le crépuscule.',
				'Le coefficient : un coef moyen à fort dynamise les postes ; trop fort, le courant peut devenir ingérable du bord.',
				'C’est exactement ce que résume l’écran « Le moment » : score, marée et fenêtres conseillées du jour.'
			]
		},
		{
			id: 'reglementation',
			titre: 'Réglementation',
			chapeau: 'Pêcher responsable, et garder une ressource en bonne santé.',
			points: [
				'Maille minimale : 42 cm en Atlantique. En dessous, on relâche le poisson avec soin.',
				'Quotas et périodes de capture évoluent chaque année par arrêté : vérifie la réglementation en vigueur avant de sortir.',
				'Remise à l’eau : mains mouillées, manipulation rapide, on évite de poser le bar sur les rochers. Sa survie en dépend.'
			]
		}
	];
</script>

<header class="page-header">
	<p class="page-kicker">Bibliothèque</p>
	<h1>Savoir</h1>
	<p class="lead">L’essentiel de la pêche du bar à l’île d’Yeu — techniques, montages, lecture de la marée et réglementation.</p>
</header>

<section class="fiches" aria-label="Fiches techniques">
	{#each fiches as fiche, i (fiche.id)}
		<details class="fiche" open={i === 0}>
			<summary>
				<span class="fiche-head">
					<span class="fiche-titre">{fiche.titre}</span>
					<span class="fiche-chapeau">{fiche.chapeau}</span>
				</span>
				<svg class="chevron" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
					<path d="M6 9l6 6 6-6" />
				</svg>
			</summary>
			<ul class="fiche-points">
				{#each fiche.points as point, j (j)}
					<li>{point}</li>
				{/each}
			</ul>
		</details>
	{/each}
</section>

<a class="quiz-cta" href="/savoir/quiz">
	<span class="quiz-cta-text">
		<span class="quiz-cta-title">Tester mes connaissances</span>
		<span class="quiz-cta-sub">7 questions pour vérifier que tu maîtrises l’essentiel.</span>
	</span>
	<svg class="quiz-cta-arrow" viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
		<path d="M5 12h14M13 6l6 6-6 6" />
	</svg>
</a>

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
	.lead {
		margin-top: var(--space-3);
		max-width: 42ch;
		color: var(--text-secondary);
		line-height: var(--leading-normal);
	}

	.fiches {
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
		margin-top: var(--space-4);
	}
	.fiche {
		background: var(--surface-raised);
		border: 1px solid var(--border-subtle);
		border-radius: var(--radius-lg);
		box-shadow: var(--elevation-1);
		overflow: hidden;
	}
	summary {
		display: flex;
		align-items: center;
		gap: var(--space-3);
		padding: var(--space-4);
		cursor: pointer;
		list-style: none;
		-webkit-tap-highlight-color: transparent;
	}
	summary::-webkit-details-marker {
		display: none;
	}
	.fiche-head {
		display: flex;
		flex-direction: column;
		gap: 2px;
		flex: 1;
		min-width: 0;
	}
	.fiche-titre {
		font-family: var(--font-display);
		font-size: var(--text-lg);
		font-weight: 600;
		color: var(--text-primary);
	}
	.fiche-chapeau {
		font-size: var(--text-sm);
		color: var(--text-secondary);
		line-height: var(--leading-snug);
	}
	.chevron {
		flex: none;
		color: var(--accent);
		transition: transform var(--motion-dur-base) var(--motion-ease-out);
	}
	.fiche[open] .chevron {
		transform: rotate(180deg);
	}
	.fiche-points {
		margin: 0;
		padding: 0 var(--space-4) var(--space-4) var(--space-6);
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
	}
	.fiche-points li {
		color: var(--text-secondary);
		line-height: var(--leading-normal);
		/* puce laiton discrète */
		list-style: none;
		position: relative;
	}
	.fiche-points li::before {
		content: '';
		position: absolute;
		left: calc(-1 * var(--space-4));
		top: 0.6em;
		width: 6px;
		height: 6px;
		border-radius: 50%;
		background: var(--accent);
		opacity: 0.8;
	}

	/* Appel à l'action vers le quiz. */
	.quiz-cta {
		display: flex;
		align-items: center;
		gap: var(--space-4);
		margin-top: var(--space-5, 20px);
		padding: var(--space-4) var(--space-5, 20px);
		border-radius: var(--radius-lg);
		text-decoration: none;
		color: var(--accent);
		background: rgba(201, 162, 75, 0.1);
		box-shadow: inset 0 0 0 1px rgba(201, 162, 75, 0.3);
		transition:
			background var(--motion-dur-fast) var(--motion-ease-out),
			transform var(--motion-dur-fast) var(--motion-ease-out);
	}
	@media (hover: hover) {
		.quiz-cta:hover {
			background: rgba(201, 162, 75, 0.16);
		}
	}
	.quiz-cta:active {
		transform: scale(0.99);
	}
	.quiz-cta-text {
		display: flex;
		flex-direction: column;
		gap: 2px;
		flex: 1;
	}
	.quiz-cta-title {
		font-weight: 600;
		color: var(--text-primary);
	}
	.quiz-cta-sub {
		font-size: var(--text-sm);
		color: var(--text-secondary);
		line-height: var(--leading-snug);
	}
	.quiz-cta-arrow {
		flex: none;
	}
</style>
