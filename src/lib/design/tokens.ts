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
    '1': '4px',
    '2': '8px',
    '3': '12px',
    '4': '16px',
    '6': '24px',
    '8': '32px',
    '12': '48px',
    '16': '64px'
  },
  font: {
    display: '"Fraunces Variable", Georgia, serif',
    body: '"Inter Variable", system-ui, sans-serif'
  },
  shadow: {
    md: '0 6px 24px rgba(0, 0, 0, 0.35)'
  }
} as const;

/**
 * Convert a token path (e.g. "color.brass" or "color.depthsLight") to a CSS variable reference.
 * Converts camelCase to kebab-case for the CSS variable name.
 * Examples:
 *   cssVar('color.brass') => 'var(--color-brass)'
 *   cssVar('space.4') => 'var(--space-4)'
 *   cssVar('color.depthsLight') => 'var(--color-depths-light)'
 */
export function cssVar(path: string): string {
  const kebabPath = path
    .replace(/\./g, '-')
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .toLowerCase();
  return `var(--${kebabPath})`;
}
