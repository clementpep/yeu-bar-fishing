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
	});
});
