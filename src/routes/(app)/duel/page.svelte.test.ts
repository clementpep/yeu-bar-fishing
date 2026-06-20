import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import Page from './+page.svelte';

const data = {
	leaderboard: [
		{ rank: 1, name: 'Alice', biggestCm: 62, count: 3, isMe: false },
		{ rank: 2, name: 'Bob', biggestCm: 55, count: 1, isMe: true },
		{ rank: 3, name: 'Chloé', biggestCm: null, count: 0, isMe: false }
	]
};

describe('Page Duel', () => {
	it('rend le classement avec records, ma ligne et l’état sans prise', () => {
		render(Page, { props: { data } });
		expect(screen.getByRole('heading', { name: 'Duel' })).toBeInTheDocument();
		expect(screen.getByText('Alice')).toBeInTheDocument();
		expect(screen.getByText('62')).toBeInTheDocument();
		// Ma ligne porte le chip « toi ».
		expect(screen.getByText('toi')).toBeInTheDocument();
		// Un pêcheur sans prise.
		expect(screen.getByText('Pas encore de prise')).toBeInTheDocument();
	});
});
