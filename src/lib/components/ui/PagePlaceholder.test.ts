import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import PagePlaceholder from './PagePlaceholder.svelte';

describe('PagePlaceholder', () => {
	it('rend le kicker, le titre et le corps', () => {
		render(PagePlaceholder, {
			props: { kicker: 'Bibliothèque', title: 'Savoir', body: 'Bientôt disponible.' }
		});
		expect(screen.getByText('Bibliothèque')).toBeInTheDocument();
		expect(screen.getByRole('heading', { name: 'Savoir' })).toBeInTheDocument();
		expect(screen.getByText('Bientôt disponible.')).toBeInTheDocument();
		expect(screen.getByText('Bientôt')).toBeInTheDocument();
	});

	it('rend l’aperçu (items) quand il est fourni', () => {
		render(PagePlaceholder, {
			props: {
				kicker: 'Classement amical',
				title: 'Duel',
				body: 'Aperçu.',
				items: [
					{ title: 'Classement', desc: 'Le tableau des pêcheurs.' },
					{ title: 'Badges', desc: 'Des récompenses.' }
				]
			}
		});
		expect(screen.getByText('Classement')).toBeInTheDocument();
		expect(screen.getByText('Le tableau des pêcheurs.')).toBeInTheDocument();
		expect(screen.getByText('Badges')).toBeInTheDocument();
	});
});
