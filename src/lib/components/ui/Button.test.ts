import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import Button from './Button.svelte';

describe('Button', () => {
	it('rend un élément bouton', () => {
		render(Button);
		expect(screen.getByRole('button')).toBeInTheDocument();
	});

	it('applique la variante primary et la taille md par défaut', () => {
		render(Button);
		const btn = screen.getByRole('button');
		expect(btn.className).toContain('primary');
		expect(btn.className).toContain('md');
	});

	it('applique la taille sm quand demandée', () => {
		render(Button, { props: { size: 'sm' } });
		expect(screen.getByRole('button').className).toContain('sm');
	});
});
