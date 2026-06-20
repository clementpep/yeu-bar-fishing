import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import Page from './+page.svelte';

describe('Page Savoir', () => {
	it('rend les fiches techniques avec leur contenu', () => {
		render(Page);
		expect(screen.getByRole('heading', { name: 'Savoir' })).toBeInTheDocument();
		// Les 4 fiches sont présentes.
		expect(screen.getByText('Techniques de pêche')).toBeInTheDocument();
		expect(screen.getByText('Montages essentiels')).toBeInTheDocument();
		expect(screen.getByText('Lire la marée')).toBeInTheDocument();
		expect(screen.getByText('Réglementation')).toBeInTheDocument();
		// Un point de contenu réel (maille) est rendu.
		expect(screen.getByText(/Maille minimale : 42 cm/)).toBeInTheDocument();
	});
});
