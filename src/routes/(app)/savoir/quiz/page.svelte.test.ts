import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import Page from './+page.svelte';

describe('Page Quiz', () => {
	it('affiche la première question et ses options', () => {
		render(Page);
		expect(screen.getByRole('heading', { name: 'Quiz' })).toBeInTheDocument();
		expect(screen.getByText(/maille.*du bar en Atlantique/i)).toBeInTheDocument();
		expect(screen.getByRole('button', { name: /42 cm/ })).toBeInTheDocument();
	});

	it('révèle l’explication après une réponse et propose de continuer', async () => {
		render(Page);
		await fireEvent.click(screen.getByRole('button', { name: /42 cm/ }));
		// Explication affichée + bouton pour avancer.
		expect(screen.getByText(/La maille est de 42 cm/)).toBeInTheDocument();
		expect(screen.getByRole('button', { name: /question suivante/i })).toBeInTheDocument();
	});
});
