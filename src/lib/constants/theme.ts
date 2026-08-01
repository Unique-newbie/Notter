/**
 * @module ThemeConstants
 * @description Curated lists and constants related to application theming, typography, and UI configuration.
 */

/**
 * Curated list of application themes.
 */
export const THEMES = {
  LIGHT: 'light',
  DARK: 'dark',
  SYSTEM: 'system',
} as const;

/**
 * Supported font families for the editor and application.
 */
export const FONT_FAMILIES = {
  SANS: 'Inter, sans-serif',
  SERIF: 'Merriweather, serif',
  MONO: 'Fira Code, monospace',
} as const;

/**
 * Supported font sizes for the editor.
 */
export const FONT_SIZES = {
  SMALL: '14px',
  MEDIUM: '16px',
  LARGE: '18px',
  XLARGE: '20px',
} as const;

/**
 * Supported line heights for the editor.
 */
export const LINE_HEIGHTS = {
  TIGHT: 1.25,
  NORMAL: 1.5,
  RELAXED: 1.75,
  DOUBLE: 2.0,
} as const;

/**
 * Auto-save timer configurations (in milliseconds).
 */
export const AUTO_SAVE_TIMERS = {
  SHORT: 5000,
  MEDIUM: 15000,
  LONG: 30000,
} as const;
