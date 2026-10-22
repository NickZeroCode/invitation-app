/**
 * Flat editorial illustration of the couple for « Romance »
 * (`very_beautiful template/il_340x270.7607318611_qmy1.webp`): the groom in
 * a blue suit, white shirt and navy tie, the bride in a blush off-shoulder
 * gown with a low chignon, arms linked. Simple faces (brows, closed eyes,
 * a soft smile) and two-tone shading keep it warm without caricature.
 */
import type { CSSProperties } from 'react'

const SKIN = '#F2C7A8'
const SKIN_SHADE = '#E2AE8D'
const SUIT = '#3E64A8'
const SUIT_SHADE = '#2E4E8A'
const TROUSER = '#335A9C'
const SHIRT = '#FFFFFF'
const TIE = '#1F2F5C'
const HAIR_HIM = '#3A281E'
const HAIR_HER = '#5B3A2B'
const GOWN = '#F2A9B8'
const GOWN_LIGHT = '#F8C9D2'
const GOWN_SHADE = '#E28FA2'
const FEATURE = '#5A3B2E'

export function CoupleArt({ className, style }: { className?: string; style?: CSSProperties }) {
  return (
    <svg viewBox="0 0 150 230" className={className} style={style} aria-hidden="true">
      {/* ground shadow */}
      <ellipse cx="78" cy="224" rx="62" ry="4" fill="#1F2F5C" opacity="0.08" />

      {/* ---------- groom ---------- */}
      <g>
        {/* trousers + shoes */}
        <path d="M 30 146 L 58 146 L 56 214 L 46 214 L 44 168 L 42 214 L 32 214 Z" fill={TROUSER} />
        <path d="M 44 168 L 44 214" stroke={SUIT_SHADE} strokeWidth="1" />
        <path d="M 30 214 C 30 218, 34 220, 44 219 L 44 213 L 32 213 Z" fill="#1E2433" />
        <path d="M 46 213 L 46 219 C 54 220, 60 218, 58 213 Z" fill="#1E2433" />
        {/* left arm (hanging) */}
        <path d="M 24 76 C 18 92, 17 118, 20 140 L 27 140 C 26 120, 27 98, 31 84 Z" fill={SUIT_SHADE} />
        <ellipse cx="23.5" cy="143" rx="4" ry="4.5" fill={SKIN} />
        {/* jacket */}
        <path d="M 26 74 C 34 68, 54 68, 62 74 L 64 150 L 24 150 Z" fill={SUIT} />
        <path d="M 44 74 L 44 150" stroke={SUIT_SHADE} strokeWidth="0.8" />
        {/* shirt V, lapels, tie */}
        <path d="M 37 70 L 44 96 L 51 70 Z" fill={SHIRT} />
        <path d="M 37 70 L 44 96 L 39 100 L 33 78 Z" fill={SUIT_SHADE} />
        <path d="M 51 70 L 44 96 L 49 100 L 55 78 Z" fill={SUIT_SHADE} />
        <path d="M 42.5 72 L 45.5 72 L 46.5 88 L 44 92 L 41.5 88 Z" fill={TIE} />
        <path d="M 41.8 70 L 46.2 70 L 45.4 74 L 42.6 74 Z" fill={TIE} />
        <circle cx="44" cy="118" r="1.1" fill={SUIT_SHADE} />
        <circle cx="44" cy="128" r="1.1" fill={SUIT_SHADE} />
        {/* pocket square */}
        <path d="M 54 92 L 60 92 L 59 95 L 55 95 Z" fill={SHIRT} />
        {/* neck + head */}
        <path d="M 40 58 L 48 58 L 48 70 L 40 70 Z" fill={SKIN_SHADE} />
        <ellipse cx="44" cy="46" rx="12" ry="14" fill={SKIN} />
        <ellipse cx="32.5" cy="47" rx="2.2" ry="3.4" fill={SKIN_SHADE} />
        <ellipse cx="55.5" cy="47" rx="2.2" ry="3.4" fill={SKIN_SHADE} />
        {/* hair: short, swept */}
        <path d="M 31 44 C 30 30, 40 24, 48 27 C 56 28, 59 36, 57 44 C 54 38, 48 35, 42 36 C 37 37, 34 40, 31 44 Z" fill={HAIR_HIM} />
        {/* face */}
        <path d="M 37.5 42 Q 40 40.6 42 42" fill="none" stroke={FEATURE} strokeWidth="0.9" strokeLinecap="round" />
        <path d="M 46 42 Q 48 40.6 50.5 42" fill="none" stroke={FEATURE} strokeWidth="0.9" strokeLinecap="round" />
        <path d="M 38.4 46 Q 40 47.2 41.6 46" fill="none" stroke={FEATURE} strokeWidth="0.9" strokeLinecap="round" />
        <path d="M 46.4 46 Q 48 47.2 49.6 46" fill="none" stroke={FEATURE} strokeWidth="0.9" strokeLinecap="round" />
        <path d="M 41 53 Q 44 55.4 47 53" fill="none" stroke="#C0705E" strokeWidth="1" strokeLinecap="round" />
      </g>

      {/* ---------- bride ---------- */}
      <g>
        {/* skirt: A-line, a lighter fold catching the light */}
        <path d="M 86 108 C 80 140, 70 180, 66 216 L 138 216 C 132 180, 120 140, 112 108 Z" fill={GOWN} />
        <path d="M 99 112 C 98 150, 92 190, 90 216 L 102 216 C 102 186, 102 150, 101 112 Z" fill={GOWN_LIGHT} opacity="0.75" />
        <path d="M 112 108 C 120 140, 132 180, 138 216 L 128 216 C 124 180, 116 146, 108 112 Z" fill={GOWN_SHADE} opacity="0.7" />
        {/* bodice: off-shoulder, fitted */}
        <path d="M 84 80 C 90 77, 108 77, 114 80 L 112 110 L 86 110 Z" fill={GOWN} />
        <path d="M 84 80 C 92 84, 106 84, 114 80" fill="none" stroke={GOWN_SHADE} strokeWidth="1.2" />
        {/* shoulders + arms */}
        <path d="M 84 80 C 80 82, 78 86, 78 92 L 84 90 Z" fill={SKIN} />
        <path d="M 114 80 C 118 82, 120 86, 120 92 L 114 90 Z" fill={SKIN} />
        {/* her right arm linking his: crosses to the groom */}
        <path d="M 79 90 C 74 100, 66 106, 58 106 L 58 112 C 68 113, 78 106, 84 96 Z" fill={SKIN} />
        {/* his right sleeve over her hand (arms linked) */}
        <path d="M 62 78 C 66 90, 66 100, 62 110 L 56 108 C 59 98, 59 90, 57 82 Z" fill={SUIT_SHADE} />
        {/* her left arm down, holding the skirt */}
        <path d="M 120 92 C 123 106, 122 120, 118 132 L 113 130 C 116 120, 117 106, 114 94 Z" fill={SKIN} />
        {/* neck + head */}
        <path d="M 95 62 L 103 62 L 103 77 L 95 77 Z" fill={SKIN_SHADE} />
        <ellipse cx="99" cy="50" rx="11" ry="13" fill={SKIN} />
        {/* hair: centre part, swept into a low chignon, a loose lock */}
        <path d="M 87 50 C 85 36, 93 30, 100 30 C 108 30, 113 36, 111 50 C 108 42, 104 38, 99 38 C 94 38, 90 43, 87 50 Z" fill={HAIR_HER} />
        <circle cx="111" cy="55" r="6" fill={HAIR_HER} />
        <path d="M 88 48 C 85 56, 86 66, 90 72 C 89 64, 89 56, 90 50 Z" fill={HAIR_HER} />
        <circle cx="110.5" cy="52" r="1.3" fill="#FFFFFF" opacity="0.9" />
        {/* face */}
        <path d="M 93 47 Q 95.2 45.8 97 47" fill="none" stroke={FEATURE} strokeWidth="0.8" strokeLinecap="round" />
        <path d="M 101 47 Q 102.8 45.8 105 47" fill="none" stroke={FEATURE} strokeWidth="0.8" strokeLinecap="round" />
        <path d="M 93.6 50.6 Q 95.2 51.8 96.8 50.6" fill="none" stroke={FEATURE} strokeWidth="0.9" strokeLinecap="round" />
        <path d="M 101.2 50.6 Q 102.8 51.8 104.4 50.6" fill="none" stroke={FEATURE} strokeWidth="0.9" strokeLinecap="round" />
        <ellipse cx="94" cy="54" rx="2" ry="1.2" fill="#F08F9A" opacity="0.35" />
        <ellipse cx="104" cy="54" rx="2" ry="1.2" fill="#F08F9A" opacity="0.35" />
        <path d="M 96.5 57 Q 99 59 101.5 57" fill="none" stroke="#C0505E" strokeWidth="1.1" strokeLinecap="round" />
        {/* earring */}
        <circle cx="88.5" cy="57" r="0.9" fill="#E9C46A" />
      </g>
    </svg>
  )
}
