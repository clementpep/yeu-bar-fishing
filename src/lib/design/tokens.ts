export const tokens = {
  color: {
    trench: '#051120',
    abyss: '#0A1722',
    marine: '#0E2A3B',
    slate: '#1B3A4B',
    depthsLight: '#2A4A5B',
    brass: '#C9A24B',
    sand: '#E7D8B8',
    text: '#F2F6F8',
    textMuted: '#9DB2BE',
    danger: '#D94C47',
    success: '#4FA083'
  },
  space: {
    '1': '4px', '2': '8px', '3': '12px', '4': '16px',
    '6': '24px', '8': '32px', '12': '48px', '16': '64px'
  },
  font: {
    display: '"Fraunces Variable", Georgia, serif',
    body: '"Inter Variable", system-ui, sans-serif'
  },
  text: {
    xs: '0.75rem',
    sm: '0.875rem',
    base: '1rem',
    lg: '1.125rem',
    xl: '1.375rem',
    '2xl': '1.75rem',
    '3xl': '2.25rem',
    display: '3rem',
    score: 'clamp(3.5rem, 18vw, 5rem)'
  },
  leading: { tight: '1.1', snug: '1.3', normal: '1.5' },
  tracking: { tight: '-0.02em', normal: '0', wide: '0.08em' },
  radius: { sm: '8px', md: '12px', lg: '16px', xl: '24px', full: '999px' },
  elevation: {
    '1': '0 1px 2px rgba(0, 0, 0, 0.4)',
    '2': '0 4px 16px rgba(0, 0, 0, 0.4)',
    '3': '0 12px 32px rgba(0, 0, 0, 0.5)'
  },
  // Alias visuel d'elevation.2 (rétro-compat des consommateurs de shadow.md).
  shadow: { md: '0 4px 16px rgba(0, 0, 0, 0.4)' },
  motion: {
    durFast: '120ms',
    durBase: '240ms',
    durSlow: '480ms',
    easeOut: 'cubic-bezier(0.22, 1, 0.36, 1)',
    easeSpring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
    easeStandard: 'cubic-bezier(0.4, 0, 0.2, 1)'
  }
} as const;

/**
 * Convert a token path (e.g. "color.brass" or "color.depthsLight") to a CSS variable reference.
 * Converts camelCase to kebab-case for the CSS variable name.
 * Examples:
 *   cssVar('color.brass') => 'var(--color-brass)'
 *   cssVar('space.4') => 'var(--space-4)'
 *   cssVar('color.depthsLight') => 'var(--color-depths-light)'
 *   cssVar('text.2xl')      => 'var(--text-2xl)'
 *   cssVar('motion.easeOut') => 'var(--motion-ease-out)'
 */
export function cssVar(path: string): string {
  const kebabPath = path
    .replace(/\./g, '-')
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .toLowerCase();
  return `var(--${kebabPath})`;
}
