import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import TideCurve from './TideCurve.svelte';
import type { TidePoint } from '$lib/types/conditions';

const points: TidePoint[] = [
	{ t: '04:12', height: 1.1, type: 'low' },
	{ t: '07:30', height: 2.8 },
	{ t: '10:36', height: 5.2, type: 'high' },
	{ t: '13:40', height: 2.9 },
	{ t: '16:48', height: 1.0, type: 'low' }
];

describe('TideCurve', () => {
	it('affiche les heures des étales', () => {
		render(TideCurve, { props: { points, nowFraction: 0.4, coefficient: 95 } });
		expect(screen.getByText('04:12')).toBeInTheDocument();
		expect(screen.getByText('10:36')).toBeInTheDocument();
		expect(screen.getByText('16:48')).toBeInTheDocument();
	});

	it('affiche la valeur du coefficient', () => {
		render(TideCurve, { props: { points, nowFraction: 0.4, coefficient: 95 } });
		expect(screen.getByText('95')).toBeInTheDocument();
	});

	it('rend un repère « maintenant »', () => {
		const { container } = render(TideCurve, { props: { points, nowFraction: 0.4, coefficient: 95 } });
		expect(container.querySelector('[data-now]')).not.toBeNull();
	});
});
