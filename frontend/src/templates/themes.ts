/**
 * Guest-side UI themes per template.
 *
 * The invitation panels (details, verification, preferences, actions) borrow
 * the selected template's palette and display face instead of rendering as
 * generic chrome — the sidebar then feels like part of the same card. Panels
 * stay on light, tinted paper surfaces so the semantic status chips and
 * form controls remain readable; dark templates lend their identity through
 * accent + ink rather than a dark panel.
 */

export interface TemplateTheme {
  /** Accent for panel titles, labels and primary CTAs (hex). */
  accent: string
  /** Primary readable ink on `surface` (hex). */
  ink: string
  /** Softer secondary ink for body rows and hints (hex). */
  inkSoft: string
  /** Panel background (CSS colour). */
  surface: string
  /** Panel border tint (CSS colour). */
  line: string
  /** Tailwind display classes for panel titles ('' = UI sans). */
  titleClass: string
}

const FALLBACK: TemplateTheme = {
  accent: '#8A6A45',
  ink: '#27221B',
  inkSoft: '#6E6455',
  surface: '#FFFFFF',
  line: '#E7E2D8',
  titleClass: 'font-display',
}

export const TEMPLATE_THEMES: Record<string, TemplateTheme> = {
  'heritage-luxe': {
    accent: '#A67C3D',
    ink: '#2B2620',
    inkSoft: '#7A6A50',
    surface: '#FBF5EA',
    line: '#E4D3AE',
    titleClass: 'font-display',
  },
  'eternite-or': {
    accent: '#A17B33',
    ink: '#2A2115',
    inkSoft: '#7A6B4E',
    surface: '#F7EFDD',
    line: '#E0CDA0',
    titleClass: 'font-display',
  },
  'jardin-olive': {
    accent: '#5B6B4B',
    ink: '#2C3526',
    inkSoft: '#6F7663',
    surface: '#F8F4EA',
    line: '#DAD2B8',
    titleClass: 'font-display',
  },
  'arche-soleil': {
    accent: '#BE5330',
    ink: '#47282B',
    inkSoft: '#8C6154',
    surface: '#F7EAD8',
    line: '#E3C69C',
    titleClass: 'font-display',
  },
  'nuit-celeste': {
    accent: '#B08D45',
    ink: '#1C2749',
    inkSoft: '#5C6689',
    surface: '#ECEFF7',
    line: '#D8DEEC',
    titleClass: 'font-display',
  },
  'jardin-floral': {
    accent: '#B4636F',
    ink: '#4A3238',
    inkSoft: '#8D6C74',
    surface: '#FCF3F1',
    line: '#EBCFD4',
    titleClass: 'font-display italic',
  },
  'ligne-moderne': {
    accent: '#C8102E',
    ink: '#16181D',
    inkSoft: '#6B6F78',
    surface: '#FFFFFF',
    line: '#E4E4E8',
    titleClass: '',
  },
  confetti: {
    accent: '#C2185B',
    ink: '#312E81',
    inkSoft: '#7A74B4',
    surface: '#FFF8E7',
    line: '#F0DFB2',
    titleClass: '',
  },
  'sceau-academique': {
    accent: '#9A7B1C',
    ink: '#14213D',
    inkSoft: '#5A6478',
    surface: '#ECEEF4',
    line: '#D6DAE6',
    titleClass: 'font-display',
  },
  'soiree-formelle': {
    accent: '#8C6F3F',
    ink: '#0E2A22',
    inkSoft: '#5A6B62',
    surface: '#EAF0EC',
    line: '#D2DED7',
    titleClass: 'font-display italic',
  },
  memoire: {
    accent: '#77705F',
    ink: '#4B463F',
    inkSoft: '#8A8377',
    surface: '#F7F5F0',
    line: '#DDD8CE',
    titleClass: 'font-display',
  },
}

export function themeFor(key: string): TemplateTheme {
  return TEMPLATE_THEMES[key] ?? FALLBACK
}

/** Per-template panel corner radius — panels follow the motif's geometry. */
const PANEL_RADIUS: Record<string, string> = {
  'heritage-luxe': '0.9rem',
  'eternite-or': '0.9rem',
  'jardin-olive': '1.35rem',
  'arche-soleil': '1.35rem',
  'nuit-celeste': '1.15rem',
  'jardin-floral': '1.75rem',
  confetti: '1.75rem',
  'ligne-moderne': '0.55rem',
  'sceau-academique': '0.8rem',
  'soiree-formelle': '1.15rem',
  memoire: '1.25rem',
}

export function panelRadiusFor(key: string): string {
  return PANEL_RADIUS[key] ?? '1.25rem'
}
