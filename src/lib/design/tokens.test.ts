import { describe, it, expect } from 'vitest';
import { tokens, cssVar } from './tokens';

describe('design tokens', () => {
  it('expose les couleurs signature de la palette nautique', () => {
    expect(tokens.color.abyss).toMatch(/^#[0-9a-fA-F]{6}$/);
    expect(tokens.color.brass).toMatch(/^#[0-9a-fA-F]{6}$/);
    expect(tokens.color.sand).toMatch(/^#[0-9a-fA-F]{6}$/);
  });

  it('cssVar convertit un chemin pointé en variable CSS kebab-case', () => {
    expect(cssVar('color.brass')).toBe('var(--color-brass)');
    expect(cssVar('space.4')).toBe('var(--space-4)');
  });

  it('cssVar handles camelCase keys by converting to kebab-case', () => {
    expect(cssVar('color.depthsLight')).toBe('var(--color-depths-light)');
  });

  it('cssVar converts shadow.md to correct CSS variable reference', () => {
    expect(cssVar('shadow.md')).toBe('var(--shadow-md)');
  });
});
