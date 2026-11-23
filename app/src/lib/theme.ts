/**
 * Design tokens — Accent ladder style for Joy Ministries.
 *
 * One brand hue at full strength only on small marks; its pale tints do all
 * the area work. Ground is warm off-white, ink is deep petrol, brand blue
 * is the sole accent. No shadows on things at rest.
 */
export const palette = {
  // Core surfaces
  ground: '#FAF8F5',
  surface: '#FFFFFF',
  raised: '#F3F2ED',
  paper: '#FFFFFF',
  canvas: '#FAF8F5',

  // Text and lines
  ink: '#1C1915',
  muted: '#8C8275',
  border: '#E7E2D8',
  line: '#E7E2D8',
  rule: '#EFEAE1',
  control: '#D6D0C5',

  // Accent — brand blue is the sole hue
  accent: '#2C97C5',
  brandBlue: '#2C97C5',
  accentSoft: '#EAF4FA',
  accentTrack: '#D6E8F4',
  accentInk: '#1B6F94',

  // Semantic
  positive: '#2E7D4E',
  negative: '#C2410C',
  danger: '#C2410C',
  warning: '#B45309',

  // Charts
  chart1: '#2C97C5',
  chart2: '#8C8275',
  chart3: '#7FC4E0',

  // Ministry accents — each group carries one 2px rule
  worship: '#8A4B2A',
  outreach: '#3F6B4A',
  media: '#2F4E6B',

  // Pills
  pillPositiveBg: '#DCFCE7',
  pillPositiveInk: '#14532D',
  pillNegativeBg: '#FEF2F2',
  pillNegativeInk: '#831C1E',
  pillWarningBg: '#FFF8E7',
  pillWarningInk: '#92400E',
  pillNeutralBg: '#F3F2ED',
  pillNeutralInk: '#3D3630',
  pillAccentBg: '#EAF4FA',
  pillAccentInk: '#1B6F94',

  // Dark mode surfaces
  onDark: '#F7F4EF',
  onDarkMuted: '#B3A99C',
  hairlineDark: 'rgba(255,255,255,0.12)',
  glassDark: 'rgba(255,255,255,0.07)',
  deep: '#123C4F',
  sky: '#7FC4E0',

  // Legacy aliases (unique keys only)
  white: '#FFFFFF',
  badgeBg: '#EAF4FA',
  navy: '#1B6F94',
  orange: '#B4551F',
  teal: '#1F5F5B',
  plum: '#7A3355',
  steel: '#2C3E63',
  amber: '#9A6A12',
  violet: '#5A3E8C',
  sand: '#F3EDE4',
  mist: '#EDF3F6',
  blush: '#F6EDEA',
  soft: '#EFEAE1',
  highlight: '#F6E2A8',
  toggleOff: '#DCD5C8',

  // Player chrome
  video: '#12100E',
  overlayDark: 'rgba(28,25,23,0.75)',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  xxxxl: 40,
  gap: 24,
  pad: 24,
  controlHeight: 32,
};

export const radius = {
  card: 8,
  control: 6,
  pill: 999,
  sm: 6,
  md: 8,
  lg: 12,
  fab: 26,
  full: 999,
};

export const typeScale = {
  fsSmall: 12,
  fsBody: 14,
  fsSection: 18,
  fsKpi: 24,
  fsTitle: 32,
  xs: 11,
  sm: 12,
  base: 13,
  md: 14,
  lg: 15,
  xl: 16,
  xxl: 17,
  title: 20,
  hero: 26,
  amount: 44,
  display: 44,
};

export const fonts = {
  regular: 'Plus Jakarta Sans',
  medium: 'Plus Jakarta Sans Medium',
  semi: 'Plus Jakarta Sans SemiBold',
  bold: 'Plus Jakarta Sans Bold',
  extra: 'Plus Jakarta Sans ExtraBold',
  serif: 'Instrument Serif',
  body: 'Plus Jakarta Sans',
  bodySemi: 'Plus Jakarta Sans SemiBold',
  display: 'Instrument Serif',
  mono: 'Courier New',
};

export const shadow = {
  sm: {
    shadowColor: '#1C1915',
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    shadowOpacity: 0.05,
    elevation: 1,
  },
  md: {
    shadowColor: '#1C1915',
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 20,
    shadowOpacity: 0.08,
    elevation: 4,
  },
  lg: {
    shadowColor: '#1C1915',
    shadowOffset: { width: 0, height: 16 },
    shadowRadius: 36,
    shadowOpacity: 0.12,
    elevation: 8,
  },
};

export const theme = { palette, spacing, radius, typeScale, fonts, shadow };

export type Theme = typeof theme;