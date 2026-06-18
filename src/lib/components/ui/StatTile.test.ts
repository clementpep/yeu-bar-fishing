import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import StatTile from './StatTile.svelte';

describe('StatTile', () => {
	it('rend la valeur, l\'unité et le label', () => {
		render(StatTile, { props: { value: '15', unit: 'nds', label: 'Vent' } });
		expect(screen.getByText('15')).toBeInTheDocument();
		expect(screen.getByText('nds')).toBeInTheDocument();
		expect(screen.getByText('Vent')).toBeInTheDocument();
	});

	it('fonctionne sans unité', () => {
		render(StatTile, { props: { value: 'Belle', label: 'Mer' } });
		expect(screen.getByText('Belle')).toBeInTheDocument();
		expect(screen.getByText('Mer')).toBeInTheDocument();
	});
});
