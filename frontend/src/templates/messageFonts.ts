/**
 * Message fonts — the typefaces a guest sees on the invitation message.
 *
 * The organizer picks one per event in the editor; templates apply it to the
 * message block only (titles keep the template's own display face). Families
 * are bundled via @fontsource (see main.tsx) so exports embed them as
 * same-origin webfonts and the downloaded picture matches the screen.
 *
 * Keys mirror `MESSAGE_FONT_KEYS` in `backend/events/models.py`.
 */

export interface MessageFont {
  key: string
  label: string
  /** CSS `font-family` stack applied to the message block. */
  css: string
}

export const MESSAGE_FONTS: MessageFont[] = [
  { key: 'classique', label: 'Classique', css: "'Playfair Display', ui-serif, Georgia, serif" },
  { key: 'elegante', label: 'Élégante', css: "'Cormorant Garamond', ui-serif, Georgia, serif" },
  { key: 'ronde', label: 'Ronde', css: "'Dancing Script', 'Segoe Script', cursive" },
  { key: 'scripte', label: 'Scripte', css: "'Great Vibes', 'Segoe Script', cursive" },
  { key: 'parisienne', label: 'Parisienne', css: "'Parisienne', 'Segoe Script', cursive" },
  {
    key: 'ceremonie',
    label: 'Cérémonie',
    css: "'Cinzel Decorative', 'Playfair Display', ui-serif, serif",
  },
  {
    key: 'moderne',
    label: 'Moderne',
    css: "'Montserrat', 'Inter Variable', ui-sans-serif, system-ui, sans-serif",
  },
]

/**
 * CSS family stack for a stored font key. Unknown/empty keys resolve to
 * `undefined` so the template's own typography stands untouched.
 */
export function messageFontCss(key: string | undefined): string | undefined {
  return MESSAGE_FONTS.find((font) => font.key === key)?.css
}
