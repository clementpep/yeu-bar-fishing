import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import ScoreGauge from './ScoreGauge.svelte';

describe('ScoreGauge', () => {
	it('clampe et arrondit le score entre 0 et 100', () => {
		render(ScoreGauge, { props: { score: 130, factors: [] } });
		expect(screen.getByText('100')).toBeInTheDocument();
	});

	it('clampe les scores négatifs à 0', () => {
		render(ScoreGauge, { props: { score: -10, factors: [] } });
		expect(screen.getByText('0')).toBeInTheDocument();
	});

	it('affiche le libellé qualitatif selon le seuil', () => {
		render(ScoreGauge, { props: { score: 80, factors: [] } });
		expect(screen.getByText('Très favorable')).toBeInTheDocument();
	});

	it('rend chaque facteur contributeur', () => {
		render(ScoreGauge, {
			props: { score: 60, factors: [{ label: 'Marée', weight: 0.8 }, { label: 'Lune', weight: 0.4 }] }
		});
		expect(screen.getByText('Marée')).toBeInTheDocument();
		expect(screen.getByText('Lune')).toBeInTheDocument();
	});
});
