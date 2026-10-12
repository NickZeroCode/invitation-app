/**
 * Luxury table scene — the visual heart of the per-guest "table" section.
 *
 * An elegant round table in fine linen with a floral centerpiece, two lit
 * candles and a standing table-number card: the guest's assigned number is
 * displayed ON the table, exactly like a real table card at a reception.
 * The scene is a single inline SVG (no filters, no external refs) so it
 * rasterises pixel-perfect in the PDF export and scales from the guest
 * sidebar to the full invitation paper via `em`-free viewBox geometry.
 */
import type { CSSProperties } from 'react'

const SERIF = "'Playfair Display', ui-serif, Georgia, serif"

/** Numeral size inside the card — shrinks for longer numbers/labels. */
function numeralSize(number: string): number {
  if (number.length <= 2) return 30
  if (number.length <= 4) return 24
  if (number.length <= 8) return 17
  return 12
}

export function LuxuryTable({
  number,
  accent,
  ink,
  className,
  style,
}: {
  /** The guest's table number (or label) — drawn on the table card. */
  number: string
  /** Template accent (gold) — lines, card frame and numeral. */
  accent: string
  /** Template ink — soft shading under the linen. */
  ink: string
  className?: string
  style?: CSSProperties
}) {
  return (
    <svg
      viewBox="0 0 320 214"
      className={className}
      style={style}
      role="img"
      aria-label={`Votre table : ${number}`}
    >
      {/* Soft floor shadow */}
      <ellipse cx="160" cy="198" rx="138" ry="12" fill={ink} opacity="0.07" />

      {/* Draped linen skirt with gentle folds and a stitched hem */}
      <path
        d="M 30 134 C 32 182 90 200 160 200 C 230 200 288 182 290 134 Z"
        fill="#ffffff"
        opacity="0.92"
      />
      <path
        d="M 30 134 C 32 182 90 200 160 200 C 230 200 288 182 290 134 Z"
        fill={accent}
        opacity="0.08"
      />
      <g stroke={accent} strokeWidth="1.1" fill="none" opacity="0.16">
        <path d="M 76 146 C 78 168 84 182 94 191" />
        <path d="M 116 156 C 118 176 122 188 128 196" />
        <path d="M 204 156 C 202 176 198 188 192 196" />
        <path d="M 244 146 C 242 168 236 182 226 191" />
      </g>
      <g stroke={accent} fill="none" strokeLinecap="round">
        <path
          d="M 48 168 C 64 188 104 198 160 199 C 216 198 256 188 272 168"
          opacity="0.35"
          strokeWidth="1"
        />
        <path
          d="M 52 161 C 68 181 106 191 160 192 C 214 191 252 181 268 161"
          opacity="0.2"
          strokeWidth="0.9"
        />
      </g>

      {/* Tabletop */}
      <ellipse
        cx="160"
        cy="134"
        rx="130"
        ry="33"
        fill="#ffffff"
        opacity="0.96"
        stroke={accent}
        strokeOpacity="0.5"
        strokeWidth="1.2"
      />
      <ellipse cx="160" cy="134" rx="122" ry="27" fill="none" stroke={accent} strokeOpacity="0.18" strokeWidth="0.8" />

      {/* Floral centerpiece — stems and leaves (mirrored around the card) */}
      <g stroke={accent} strokeWidth="1.4" fill="none" opacity="0.6" strokeLinecap="round">
        <path d="M 156 118 C 136 104 120 96 102 92" />
        <path d="M 160 116 C 159 106 160 98 160 90" />
      </g>
      <g fill={accent} opacity="0.32">
        <path d="M 122 100 C 116 93 108 91 101 93 C 105 100 113 103 122 100 Z" />
        <path d="M 138 110 C 132 103 124 101 117 103 C 121 110 129 113 138 110 Z" />
        <path d="M 152 104 C 148 97 142 94 136 95 C 139 101 145 105 152 104 Z" />
      </g>
      <g>
        <circle cx="100" cy="91" r="5.5" fill={accent} opacity="0.8" />
        <circle cx="100" cy="91" r="1.7" fill="#ffffff" opacity="0.9" />
        <circle cx="160" cy="88" r="4.5" fill={accent} opacity="0.75" />
        <circle cx="160" cy="88" r="1.4" fill="#ffffff" opacity="0.9" />
        <circle cx="132" cy="84" r="2.6" fill={accent} opacity="0.5" />
      </g>
      {/* Mirrored half of the centerpiece */}
      <g transform="translate(320,0) scale(-1,1)">
        <g stroke={accent} strokeWidth="1.4" fill="none" opacity="0.6" strokeLinecap="round">
          <path d="M 156 118 C 136 104 120 96 102 92" />
        </g>
        <g fill={accent} opacity="0.32">
          <path d="M 122 100 C 116 93 108 91 101 93 C 105 100 113 103 122 100 Z" />
          <path d="M 138 110 C 132 103 124 101 117 103 C 121 110 129 113 138 110 Z" />
          <path d="M 152 104 C 148 97 142 94 136 95 C 139 101 145 105 152 104 Z" />
        </g>
        <g>
          <circle cx="100" cy="91" r="5.5" fill={accent} opacity="0.8" />
          <circle cx="100" cy="91" r="1.7" fill="#ffffff" opacity="0.9" />
          <circle cx="132" cy="84" r="2.6" fill={accent} opacity="0.5" />
        </g>
      </g>

      {/* Two lit candles flanking the table card */}
      <g>
        <circle cx="76" cy="92" r="11" fill={accent} opacity="0.12" />
        <path d="M 76 82 C 80 88 81 92 76 96 C 71 92 72 88 76 82 Z" fill={accent} opacity="0.9" />
        <rect x="73" y="96" width="6" height="34" rx="2.5" fill="#ffffff" opacity="0.95" stroke={accent} strokeOpacity="0.45" />
        <ellipse cx="76" cy="131" rx="8" ry="2.5" fill={accent} opacity="0.35" />
      </g>
      <g>
        <circle cx="244" cy="92" r="11" fill={accent} opacity="0.12" />
        <path d="M 244 82 C 248 88 249 92 244 96 C 239 92 240 88 244 82 Z" fill={accent} opacity="0.9" />
        <rect x="241" y="96" width="6" height="34" rx="2.5" fill="#ffffff" opacity="0.95" stroke={accent} strokeOpacity="0.45" />
        <ellipse cx="244" cy="131" rx="8" ry="2.5" fill={accent} opacity="0.35" />
      </g>

      {/* The table-number card on its stand — the number sits on the table */}
      <path d="M 147 126 L 173 126 L 179 132 L 141 132 Z" fill={accent} opacity="0.5" />
      <rect x="117" y="77" width="88" height="54" rx="5" fill={ink} opacity="0.06" />
      <rect
        x="116"
        y="76"
        width="88"
        height="54"
        rx="5"
        fill="#ffffff"
        opacity="0.98"
        stroke={accent}
        strokeOpacity="0.85"
        strokeWidth="1.4"
      />
      <rect
        x="121.5"
        y="81.5"
        width="77"
        height="43"
        rx="2.5"
        fill="none"
        stroke={accent}
        strokeOpacity="0.45"
        strokeWidth="0.9"
      />
      <path d="M 160 71 L 165 76 L 160 81 L 155 76 Z" fill={accent} opacity="0.85" />
      <text
        x="160"
        y="104.5"
        textAnchor="middle"
        dominantBaseline="central"
        fontFamily={SERIF}
        fontSize={numeralSize(number)}
        fontWeight="600"
        letterSpacing="1"
        fill={accent}
      >
        {number}
      </text>
    </svg>
  )
}
