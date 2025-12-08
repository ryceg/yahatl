/**
 * Design tokens for YAHATL mobile app
 * These values match the CSS variables in global.css
 */

export const colors = {
  primary: {
    DEFAULT: 'hsl(262, 83%, 58%)',
    foreground: 'hsl(0, 0%, 98%)',
  },
  secondary: {
    DEFAULT: 'hsl(240, 4.8%, 95.9%)',
    foreground: 'hsl(240, 5.9%, 10%)',
  },
  destructive: {
    DEFAULT: 'hsl(0, 84.2%, 60.2%)',
    foreground: 'hsl(0, 0%, 98%)',
  },
  muted: {
    DEFAULT: 'hsl(240, 4.8%, 95.9%)',
    foreground: 'hsl(240, 3.8%, 46.1%)',
  },
  accent: {
    DEFAULT: 'hsl(240, 4.8%, 95.9%)',
    foreground: 'hsl(240, 5.9%, 10%)',
  },
  card: {
    DEFAULT: 'hsl(0, 0%, 100%)',
    foreground: 'hsl(240, 10%, 3.9%)',
  },
  background: 'hsl(0, 0%, 100%)',
  foreground: 'hsl(240, 10%, 3.9%)',
  border: 'hsl(240, 5.9%, 90%)',
  input: 'hsl(240, 5.9%, 90%)',
  ring: 'hsl(262, 83%, 58%)',
} as const;

export const darkColors = {
  primary: {
    DEFAULT: 'hsl(262, 83%, 58%)',
    foreground: 'hsl(0, 0%, 98%)',
  },
  secondary: {
    DEFAULT: 'hsl(240, 3.7%, 15.9%)',
    foreground: 'hsl(0, 0%, 98%)',
  },
  destructive: {
    DEFAULT: 'hsl(0, 62.8%, 30.6%)',
    foreground: 'hsl(0, 0%, 98%)',
  },
  muted: {
    DEFAULT: 'hsl(240, 3.7%, 15.9%)',
    foreground: 'hsl(240, 5%, 64.9%)',
  },
  accent: {
    DEFAULT: 'hsl(240, 3.7%, 15.9%)',
    foreground: 'hsl(0, 0%, 98%)',
  },
  card: {
    DEFAULT: 'hsl(240, 10%, 3.9%)',
    foreground: 'hsl(0, 0%, 98%)',
  },
  background: 'hsl(240, 10%, 3.9%)',
  foreground: 'hsl(0, 0%, 98%)',
  border: 'hsl(240, 3.7%, 15.9%)',
  input: 'hsl(240, 3.7%, 15.9%)',
  ring: 'hsl(262, 83%, 58%)',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 48,
  '3xl': 64,
} as const;

export const radius = {
  sm: 4,
  md: 6,
  lg: 8,
  xl: 12,
  full: 9999,
} as const;

export const fontSize = {
  xs: 12,
  sm: 14,
  base: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 30,
  '4xl': 36,
} as const;
