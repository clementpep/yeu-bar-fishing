import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import TextField from './TextField.svelte';

describe('TextField', () => {
	it('rend un label lié à un input', () => {
		render(TextField, { props: { label: 'Adresse e-mail', name: 'email', type: 'email' } });
		const input = screen.getByLabelText('Adresse e-mail');
		expect(input).toBeInTheDocument();
		expect(input.getAttribute('type')).toBe('email');
		expect(input.getAttribute('name')).toBe('email');
	});

	it('type texte par défaut', () => {
		render(TextField, { props: { label: 'Nom', name: 'nom' } });
		expect(screen.getByLabelText('Nom').getAttribute('type')).toBe('text');
	});
});
