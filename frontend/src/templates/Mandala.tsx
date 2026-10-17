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
import {
  CradleIcon,
  DamaskPattern,
  FleuronDivider,
  HangingOrnaments,
  MandalaRosette,
} from './referenceMotifs.tsx'
import type { CSSProperties } from 'react'
import type { TemplateProps } from './types.ts'

const PAPER = '#8E1F2B'
const GOLD = '#E8C06A'
const CREAM = '#F5E6C8'

const CEREMONIAL: CSSProperties = {
  fontFamily: "'Cinzel Decorative', 'Playfair Display', ui-serif, serif",
}

/** Title-case classic serif for names, occasion and date (gold type on red). */
const ROYAL: CSSProperties = {
  fontFamily: "'Cormorant Garamond', ui-serif, serif",
  fontWeight: 600,
}

export function Mandala({ draft }: TemplateProps) {
  const titleEm = isEmphasized(draft, 'title')
  const dateEm = isEmphasized(draft, 'date')
  const venueEm = isEmphasized(draft, 'venue')
  return (
    <InvitationPaper style={{ backgroundColor: PAPER, color: CREAM }}>
      <DamaskPattern color={GOLD} opacity={0.14} />

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
      <HangingOrnaments
        color={GOLD}
        className="pointer-events-none absolute inset-x-0 top-0 h-[5.6em] w-full"
      />

      {/* Rosettes flanking the sheet */}
      <MandalaRosette
        color={GOLD}
        className="pointer-events-none absolute -left-[13em] top-[16.5em] h-[19em] w-[19em]"
      />
      <MandalaRosette
        color={GOLD}
        className="pointer-events-none absolute -right-[13em] top-[16.5em] h-[19em] w-[19em]"
      />

      <div className="relative flex flex-1 flex-col items-center px-[5.6em] pb-[3.6em] pt-[6.4em] text-center">
        <h1
          className="break-words text-balance leading-[1.28]"
          style={{ ...ROYAL, fontSize: titleEm ? '3.6em' : '2.9em', color: GOLD }}
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
            fontSize: '0.98em',
            letterSpacing: '0.3em',
            lineHeight: 2.1,
            color: CREAM,
          }}
        >
          Cordialement, nous vous invitons à la
          <br />
          cérémonie de notre enfant
        </p>

        <p
          className="mt-[1.3em] break-words"
          style={{ ...ROYAL, fontSize: titleEm ? '2.6em' : '2.1em', color: CREAM }}
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
          {formatShortDate(draft.event_date)} · {formatEventTime(draft.event_time)}
        </p>

        <FleuronDivider className="mt-[1.2em] h-[1.3em] w-[12em]" color={GOLD} />

        {draft.venue_name || draft.venue_address ? (
          <div
            className="mt-[1.4em] uppercase"
            style={{
              ...CEREMONIAL,
              fontSize: venueEm ? '1.08em' : '0.94em',
              letterSpacing: '0.24em',
              lineHeight: 1.9,
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
