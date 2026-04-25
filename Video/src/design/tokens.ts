/** Visual design tokens — single source of truth for the pitch video. */

export const C = {
  bg: '#0B0F1F',
  bgMid: '#10162A',
  surface: '#141A2E',
  surfaceElev: '#1B2240',
  surfaceLight: '#222B4A',

  border: 'rgba(255, 255, 255, 0.08)',
  borderStrong: 'rgba(255, 255, 255, 0.18)',

  accent: '#E5B45C',
  accentSoft: '#F4D58D',
  accentGlow: 'rgba(229, 180, 92, 0.35)',

  success: '#34D399',
  warning: '#F59E0B',
  blocker: '#F87171',
  info: '#60A5FA',
  electric: '#A78BFA',

  textPrimary: '#F4F4F5',
  textSecondary: '#CBD5E1',
  textMuted: '#7A869F',
  textFaint: '#475569',
};

/**
 * Lovable design tokens — mirrors the dark-mode palette of the actual
 * FlowDesk product UI in `Lovable/src/index.css` so the in-video
 * "product" scenes are visually identical to what investors see when
 * they open the app.
 */
export const LV = {
  bg: 'hsl(224, 35%, 7%)',
  bgChrome: 'hsl(224, 38%, 5%)',
  surface: 'hsl(224, 32%, 10%)',
  surfaceMuted: 'hsl(224, 30%, 13%)',
  surfaceElev: 'hsl(224, 30%, 12%)',
  card: 'hsl(224, 32%, 10%)',
  popover: 'hsl(224, 32%, 11%)',
  sidebar: 'hsl(224, 38%, 6%)',
  sidebarAccent: 'hsl(224, 32%, 12%)',
  sidebarBorder: 'hsl(224, 30%, 14%)',

  border: 'hsl(224, 25%, 18%)',
  borderSoft: 'hsl(224, 25%, 22%)',
  ring: 'hsl(243, 85%, 70%)',

  primary: 'hsl(243, 85%, 70%)',
  primarySoft: 'hsl(243, 85%, 70%, 0.18)',
  primaryGlow: 'hsl(252, 90%, 75%)',
  accent: 'hsl(262, 85%, 70%)',
  accentSoft: 'hsl(262, 85%, 70%, 0.16)',

  success: 'hsl(152, 60%, 50%)',
  successSoft: 'hsl(152, 60%, 50%, 0.16)',
  warning: 'hsl(38, 92%, 60%)',
  warningSoft: 'hsl(38, 92%, 60%, 0.16)',
  destructive: 'hsl(0, 70%, 60%)',
  destructiveSoft: 'hsl(0, 70%, 60%, 0.16)',
  info: 'hsl(210, 90%, 65%)',
  infoSoft: 'hsl(210, 90%, 65%, 0.16)',

  scoreHigh: 'hsl(152, 60%, 50%)',
  scoreMed: 'hsl(38, 92%, 58%)',
  scoreLow: 'hsl(0, 72%, 62%)',

  textPrimary: 'hsl(220, 25%, 96%)',
  textSecondary: 'hsl(220, 22%, 84%)',
  textMuted: 'hsl(220, 15%, 65%)',
  textFaint: 'hsl(220, 12%, 46%)',

  gradientPrimary:
    'linear-gradient(135deg, hsl(243, 85%, 70%) 0%, hsl(252, 90%, 75%) 100%)',
  gradientAccent:
    'linear-gradient(135deg, hsl(243, 85%, 70%) 0%, hsl(262, 85%, 70%) 100%)',
  shadowCard: '0 1px 3px hsl(0 0% 0% / 0.5), 0 1px 2px -1px hsl(0 0% 0% / 0.3)',
  shadowElev: '0 14px 40px -16px hsl(0 0% 0% / 0.7), 0 4px 12px -4px hsl(0 0% 0% / 0.4)',
  shadowGlow: '0 0 0 4px hsl(243 85% 70% / 0.18)',
  radius: 10,
};

export const FONT = {
  sans: '"Inter", system-ui, -apple-system, sans-serif',
  mono: '"JetBrains Mono", "Fira Code", monospace',
};

export const W = {
  thin: 300,
  regular: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
  black: 900,
};
