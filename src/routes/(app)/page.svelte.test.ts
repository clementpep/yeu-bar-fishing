import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import Page from './+page.svelte';
import type { MomentData } from '$lib/types/conditions';

// Régression : une journée a ~2 pleines mers + ~2 basses mers, donc `windows`
// contient des labels DUPLIQUÉS (« Étale de pleine mer » ×2, etc.). Le `{#each}`
// ne doit donc PAS être keyé sur le label, sinon Svelte 5 jette `each_key_duplicate`
// et crashe l'hydratation de la home → app entièrement non-interactive en prod.
const moment: MomentData = {
	spot: "Île d'Yeu",
	date: 'samedi 20 juin',
	score: 75,
	scoreWhy: 'Conditions favorables au bar.',
	factors: [
		{ label: 'Coefficient', weight: 0.6 },
		{ label: 'Saison', weight: 0.85 }
	],
	tide: {
		points: [
			{ t: '06:00', height: 1.2 },
			{ t: '12:00', height: 4.8, type: 'high' }
		],
		nowFraction: 0.5,
		coefficient: 72,
		nextEtale: 'Pleine mer à 12:00'
	},
	stats: [
		{ label: 'Vent', value: '12', unit: 'km/h O' },
		{ label: 'Mer', value: 'Belle' }
	],
	tip: { title: 'Conseil du jour', body: 'Insiste sur les cassures.' },
	windows: [
		{ label: 'Aube', time: '06:12' },
		{ label: 'Étale de pleine mer', time: '00:30' },
		{ label: 'Étale de basse mer', time: '06:45' },
		{ label: 'Étale de pleine mer', time: '12:50' },
		{ label: 'Étale de basse mer', time: '19:05' },
		{ label: 'Crépuscule', time: '21:58' }
	]
};

describe('Page Le moment', () => {
	it('rend sans crash même avec des labels de fenêtres dupliqués', () => {
		expect(() => render(Page, { props: { data: { moment } } })).not.toThrow();
		// Les deux « Étale de pleine mer » sont bien affichées toutes les deux.
		expect(screen.getAllByText('Étale de pleine mer')).toHaveLength(2);
	});
});
