// ─── App theme: refined light & dark palettes ────────────────────────────────
export const PALETTE = {
  light: {
    bg: '#EFEFF3', // soft grey so white cards lift off the background
    card: '#FFFFFF',
    surface: '#FFFFFF',
    surfaceAlt: '#E7E7EE',
    text: '#12121A',
    textMuted: '#6B6B77',
    textFaint: '#9A9AA6',
    border: '#E6E6EC',
    accent: '#E11D48',
    accentSoft: '#FCE7EC',
    accentText: '#FFFFFF',
    chipBg: '#F1F1F5',
    chipText: '#3A3A46',
    tabBar: '#FFFFFF',
    tabInactive: '#A0A0AC',
    overlay: 'rgba(8,8,12,0.55)',
    imgPlaceholder: '#DDDDE4',
  },
  dark: {
    bg: '#050508',
    card: '#101016',
    surface: '#16161D',
    surfaceAlt: '#1E1E27',
    text: '#F4F4F7',
    textMuted: '#9A9AA6',
    textFaint: '#6B6B77',
    border: '#242430',
    accent: '#FB6F84',
    accentSoft: '#2A1720',
    accentText: '#0B0B0F',
    chipBg: '#1D1D27',
    chipText: '#C9C9D4',
    tabBar: '#0B0B10',
    tabInactive: '#5E5E6B',
    overlay: 'rgba(0,0,0,0.55)',
    imgPlaceholder: '#1A1A22',
  },
} as const;

export type Palette = { [K in keyof typeof PALETTE.light]: string };
export type ThemeMode = 'light' | 'dark' | 'system';
