import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/svelte';
import Card from './Card.svelte';

describe('Card', () => {
	it('applique la variante raised par défaut', () => {
		const { container } = render(Card);
		const card = container.querySelector('.card');
		expect(card).not.toBeNull();
		expect(card?.classList.contains('raised')).toBe(true);
	});

	it('applique la variante inset quand demandée', () => {
		const { container } = render(Card, { props: { variant: 'inset' } });
		expect(container.querySelector('.card')?.classList.contains('inset')).toBe(true);
	});
});
