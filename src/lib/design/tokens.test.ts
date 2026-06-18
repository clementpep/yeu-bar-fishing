import { describe, it, expect } from 'vitest';
import { tokens, cssVar } from './tokens';

describe('design tokens', () => {
  it('expose les couleurs signature de la palette nautique', () => {
    expect(tokens.color.abyss).toMatch(/^#[0-9a-fA-F]{6}$/);
    expect(tokens.color.brass).toMatch(/^#[0-9a-fA-F]{6}$/);
    expect(tokens.color.sand).toMatch(/^#[0-9a-fA-F]{6}$/);
  });

  it('expose une échelle typographique en rem', () => {
    expect(tokens.text.base).toBe('1rem');
    expect(tokens.text['2xl']).toMatch(/rem$/);
    expect(tokens.text.score).toContain('clamp');
  });

  it('expose rayons, élévation et motion', () => {
    expect(tokens.radius.md).toBe('12px');
    expect(tokens.elevation['2']).toContain('rgba');
    expect(tokens.motion.easeOut).toContain('cubic-bezier');
  });

  it('cssVar convertit un chemin pointé en variable CSS kebab-case', () => {
    expect(cssVar('color.brass')).toBe('var(--color-brass)');
    expect(cssVar('space.4')).toBe('var(--space-4)');
    expect(cssVar('color.depthsLight')).toBe('var(--color-depths-light)');
  });

  it('cssVar gère les nouveaux groupes', () => {
    expect(cssVar('text.2xl')).toBe('var(--text-2xl)');
    expect(cssVar('radius.md')).toBe('var(--radius-md)');
    expect(cssVar('motion.easeOut')).toBe('var(--motion-ease-out)');
  });
});
