import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import { readable } from 'svelte/store';
import TabBar from './TabBar.svelte';

vi.mock('$app/stores', () => ({
  page: readable({ url: new URL('http://localhost/carnet') })
}));

describe('TabBar', () => {
	it('rend les 5 onglets avec leur label', () => {
		render(TabBar);
		expect(screen.getByText('Le moment')).toBeInTheDocument();
		expect(screen.getByText('Savoir')).toBeInTheDocument();
		expect(screen.getByText('Carnet')).toBeInTheDocument();
		expect(screen.getByText('Duel')).toBeInTheDocument();
		expect(screen.getByText('Profil')).toBeInTheDocument();
	});

	it('affiche une icône SVG dans chaque onglet', () => {
		render(TabBar);
		const liens = screen.getAllByRole('link');
		expect(liens).toHaveLength(5);
		for (const lien of liens) {
			expect(lien.querySelector('svg')).not.toBeNull();
		}
	});

	it("marque l'onglet courant (carnet) comme actif", () => {
		render(TabBar);
		const lien = screen.getByText('Carnet').closest('a');
		expect(lien?.getAttribute('aria-current')).toBe('page');
	});

	it('marque les icônes comme décoratives (aria-hidden)', () => {
		render(TabBar);
		const liens = screen.getAllByRole('link');
		for (const lien of liens) {
			const iconSpan = lien.querySelector('.tab-icon');
			expect(iconSpan?.getAttribute('aria-hidden')).toBe('true');
		}
	});
});
