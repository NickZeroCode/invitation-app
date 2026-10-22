/**
 * « Mandala » — reproduction of `very_beautiful template/Screenshot 2026-10-08 022321.png`.
 *
 * Deep red damask paper, a gold toran of hanging buds along the top edge,
 * gold rosettes flanking the sheet, ceremonial gold serif type (Cinzel
 * Decorative), a line-art cradle and fleuron dividers.
 */
import { messageFontCss } from './messageFonts.ts'
import { TemplateOrnament } from './ornaments.tsx'
import {
  CoverHero,
  DressCodeSection,
  InvitationPaper,
  NoteSection,
  ProgramSection,
  TableSection,
  formatEventTime,
  formatShortDate,
  isEmphasized,
} from './shared.tsx'
import { FloralDamask, LaceMandala, MarigoldToran } from './festiveMotifs.tsx'
import { CradleIcon, FleuronDivider } from './referenceMotifs.tsx'
import type { CSSProperties } from 'react'
import type { TemplateProps } from './types.ts'

const PAPER = '#9E1B22'
const GOLD = '#E9C77B'
const CREAM = '#F3DCA8'

/** Small ceremonial capitals — a classic book serif, lightly tracked. */
const CEREMONIAL: CSSProperties = {
  fontFamily: "'Cormorant Garamond', 'Playfair Display', ui-serif, serif",
  fontWeight: 600,
}

/** Title-case classic serif for names, occasion and date (gold type on red). */
const ROYAL: CSSProperties = {
  fontFamily: "'Playfair Display', ui-serif, serif",
  fontWeight: 400,
}

export function Mandala({ draft }: TemplateProps) {
  const titleEm = isEmphasized(draft, 'title')
  const dateEm = isEmphasized(draft, 'date')
  const venueEm = isEmphasized(draft, 'venue')
  return (
    <InvitationPaper
      style={{
        backgroundColor: PAPER,
        // Velvet red: lit at the heart, deepening toward the edges.
        backgroundImage: 'radial-gradient(ellipse 80% 65% at 50% 48%, #B8262C, #9A1A21 55%, #7E1218)',
        color: CREAM,
      }}
    >
      <FloralDamask color="#6E0F15" opacity={0.42} />

      <CoverHero
        draft={draft}
        bandColor="rgba(70,10,16,0.62)"
        edgeColor="rgba(232,192,106,0.9)"
        eyebrow="Avec la bénédiction des familles"
        paperColor={PAPER}
        titleStyle={{
          fontFamily: "'Cormorant Garamond', ui-serif, serif",
          fontWeight: 600,
          fontSize: titleEm ? '3.4em' : '2.7em',
          color: '#F5E6C8',
          letterSpacing: '0.02em',
          textShadow: '0 0.05em 0.3em rgba(40,4,8,0.6)',
        }}
      />

      {/* Gold toran along the top edge */}
      <MarigoldToran color={GOLD} className="pointer-events-none absolute inset-x-0 top-0 h-[9.5em] w-full" />

      {/* Rosettes flanking the sheet */}
      <LaceMandala color={GOLD} className="pointer-events-none absolute -left-[11.5em] top-[38%] h-[19em] w-[19em]" />
      <LaceMandala color={GOLD} className="pointer-events-none absolute -right-[11.5em] top-[38%] h-[19em] w-[19em]" />

      <div className="relative flex flex-1 flex-col items-center px-[8.5em] pb-[5em] pt-[10em] text-center">
        <h1
          className="break-words text-balance leading-[1.28]"
          style={{ ...ROYAL, fontSize: titleEm ? '3.6em' : '3em', color: CREAM }}
        >
          {draft.title}
        </h1>

        {draft.guestName?.trim() ? (
          <p className="mt-[0.9em] font-display italic" style={{ fontSize: '1.12em', color: CREAM }}>
            {draft.guestName}
          </p>
        ) : null}

        <p
          className="mt-[1.6em] uppercase"
          style={{
            ...CEREMONIAL,
            fontSize: '1.15em',
            letterSpacing: '0.06em',
            lineHeight: 1.6,
            color: CREAM,
          }}
        >
          Cordialement, nous vous invitons à la
          <br />
          cérémonie de notre enfant
        </p>

        <p
          className="mt-[1.3em] break-words"
          style={{ ...ROYAL, fontSize: titleEm ? '2.8em' : '2.4em', color: CREAM }}
        >
          Cérémonie de naissance
        </p>

        {draft.message ? (
          <p
            className="mt-[1.1em] max-w-[25em] text-pretty leading-[1.7] break-words"
            style={{ fontSize: '1.08em', color: CREAM, fontFamily: messageFontCss(draft.messageFont) }}
          >
            {draft.message}
          </p>
        ) : null}

        <CradleIcon color={GOLD} className="mt-[1.6em] h-[7.6em] w-[9em]" />

        <FleuronDivider className="mt-[1.5em] h-[1.3em] w-[12em]" color={GOLD} />

        <p
          className="mt-[1.2em] break-words"
          style={{
            ...ROYAL,
            fontSize: dateEm ? '2.2em' : '1.8em',
            color: CREAM,
          }}
        >
          {formatShortDate(draft.event_date)}
          <span className="mx-[0.45em] opacity-80">|</span>
          {formatEventTime(draft.event_time)}
        </p>

        <FleuronDivider className="mt-[1.2em] h-[1.3em] w-[12em]" color={GOLD} />

        {draft.venue_name || draft.venue_address ? (
          <div
            className="mt-[1.4em] uppercase"
            style={{
              ...CEREMONIAL,
              fontSize: venueEm ? '1.2em' : '1.05em',
              letterSpacing: '0.08em',
              lineHeight: 1.6,
              color: CREAM,
            }}
          >
            {draft.venue_name ? (
              <p>
                Lieu · {draft.venue_name}
                {draft.venue_address ? `, ${draft.venue_address}` : ''}
              </p>
            ) : (
              <p>{draft.venue_address}</p>
            )}
            {draft.venue_details ? (
              <p className="text-[0.92em] italic opacity-80" style={{ letterSpacing: '0.08em' }}>
                {draft.venue_details}
              </p>
            ) : null}
          </div>
        ) : null}

        <NoteSection draft={draft} ink={CREAM} />
        <ProgramSection
          draft={draft}
          accent={GOLD}
          ink={CREAM}
          ornament={<TemplateOrnament templateKey="mandala" color={GOLD} />}
        />
        <TableSection
          draft={draft}
          accent={GOLD}
          ink={CREAM}
          ornament={<TemplateOrnament templateKey="mandala" color={GOLD} />}
        />
        <DressCodeSection
          draft={draft}
          accent={GOLD}
          ink={CREAM}
          ornament={<TemplateOrnament templateKey="mandala" color={GOLD} />}
        />
      </div>
    </InvitationPaper>
  )
}
