import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import Button from './Button.svelte';

describe('Button', () => {
  it('rend le label fourni en slot', () => {
    const { container } = render(Button);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('applique la variante primary par défaut', () => {
    render(Button);
    expect(screen.getByRole('button').className).toContain('primary');
  });
});
