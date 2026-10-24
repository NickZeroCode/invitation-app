import type { MoodBoardAttributes } from './types.ts'

/** The board of the reference: terracotta, sand to burnt orange. */
export const MOOD_BOARD_DEFAULTS: MoodBoardAttributes = {
  theme: 'Terracotta',
  palette: ['#B99470', '#FBE8D0', '#7E4539', '#5A352F', '#C17F48'],
}

export const MOOD_BOARD_THEME_MAX = 40
export const MOOD_BOARD_PALETTE_MAX = 5
