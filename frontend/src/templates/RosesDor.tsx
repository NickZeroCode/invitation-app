/**
 * « Roses d'Or » — reproduction of `very_beautiful template/Screenshot 2026-10-08 022102.png`.
 *
 * Ivory linen paper with engraved gold rose clusters in three corners and an
 * ornate filigree corner with hanging charm, gold-gradient calligraphy names
 * stacked behind a giant ghost ampersand, a fleuron divider, dark script
 * occasion line and a three-cell date row divided by thin rules.
 */
import { GoldRoseCorner, PaperGrain } from './florals.tsx'
import { FiligreeCorner } from './FiligreeCorner.tsx'
import { messageFontCss } from './messageFonts.ts'
import { TemplateOrnament } from './ornaments.tsx'
import {
  CoverHero,
  DressCodeSection,
  InvitationPaper,
  NoteSection,
  ProgramSection,
  TableSection,
  formatDayNumber,
  formatEventTime,
  isEmphasized,
} from './shared.tsx'
import {
  FleuronDivider,
  GOLD,
  SCRIPT_FONT,
  formatMonthShort,
  formatYearOnly,
  splitNames,
} from './referenceMotifs.tsx'
import { LuxePattern, VellumHalo } from './luxeMotifs.tsx'
import type { CSSProperties } from 'react'
import type { TemplateProps } from './types.ts'

const PAPER = '#F4F2ED'
const INK = '#7A6A55'
const DARK = '#4E4234'

const GOLD_GRADIENT: CSSProperties = {
  backgroundImage:
    'linear-gradient(155deg, #96702F 0%, #E2C27C 34%, #A98543 58%, #E7CE96 78%, #8C6B2F 100%)',
  WebkitBackgroundClip: 'text',
  backgroundClip: 'text',
  color: 'transparent',
}

export function RosesDor({ draft }: TemplateProps) {
  const titleEm = isEmphasized(draft, 'title')
  const dateEm = isEmphasized(draft, 'date')
  const venueEm = isEmphasized(draft, 'venue')
  const names = splitNames(draft.title)
  return (
    <InvitationPaper style={{ backgroundColor: PAPER, color: INK }}>
      <PaperGrain opacity={0.05} blend="multiply" />
      <LuxePattern templateKey="roses-dor" />
      <VellumHalo color={PAPER} />

      <CoverHero
        draft={draft}
        bandColor="rgba(52,42,32,0.6)"
        edgeColor="rgba(226,194,124,0.85)"
        eyebrow="Réservez la date"
        titleStyle={{
          fontFamily: SCRIPT_FONT,
          fontSize: titleEm ? '4.6em' : '3.7em',
          color: '#F8EFDD',
          textShadow: '0 0.05em 0.3em rgba(40,30,20,0.55)',
        }}
      />

      {/* Engraved gold roses + filigree corner with hanging charm */}
      <GoldRoseCorner
        className="pointer-events-none absolute -left-[1.2em] -top-[1.2em] h-[17em] w-[20.5em]"
        strokeWidth={1.6}
      />
      <GoldRoseCorner
        className="pointer-events-none absolute -bottom-[2.8em] -left-[2.8em] h-[18.5em] w-[22em]"
        strokeWidth={1.6}
        style={{ transform: 'scaleY(-1)' }}
      />
      <GoldRoseCorner
        className="pointer-events-none absolute -bottom-[2.8em] -right-[2.8em] h-[18.5em] w-[22em]"
        strokeWidth={1.6}
        style={{ transform: 'rotate(180deg)' }}
      />
      <FiligreeCorner corner="tr" color={GOLD} opacity={0.85} />

      <div className="relative flex flex-1 flex-col items-center px-[6.4em] pb-[4em] pt-[5em] text-center">
        <p className="font-display italic" style={{ fontSize: '1.12em', color: INK }}>
          Nous vous invitons à célébrer
        </p>

        <p
          className="mt-[0.55em] uppercase"
          style={{ fontSize: titleEm ? '1.85em' : '1.5em', letterSpacing: '0.32em', color: DARK }}
        >
          Réservez la date
        </p>

        <div className="relative mt-[1.5em] flex w-full flex-col items-center">
          {/* Giant ghost ampersand behind the names */}
          <span
            aria-hidden="true"
            className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 select-none"
            style={{
              fontFamily: SCRIPT_FONT,
              fontSize: '15em',
              lineHeight: 1,
              color: '#B9A88C',
              opacity: 0.28,
            }}
          >
            &amp;
          </span>
          <h1 className="relative break-words text-balance leading-[1.14]">
            <span className="sr-only">{draft.title}</span>
            {names ? (
              <span aria-hidden="true" className="flex flex-col items-center">
                <span
                  style={{
                    fontFamily: SCRIPT_FONT,
                    fontSize: titleEm ? '5.4em' : '4.5em',
                    ...GOLD_GRADIENT,
                  }}
                >
                  {names[0]}
                </span>
                <span
                  style={{
                    fontFamily: SCRIPT_FONT,
                    fontSize: titleEm ? '5.4em' : '4.5em',
                    ...GOLD_GRADIENT,
                  }}
                >
                  {names[1]}
                </span>
              </span>
            ) : (
              <span
                style={{
                  fontFamily: SCRIPT_FONT,
                  fontSize: titleEm ? '5.4em' : '4.5em',
                  ...GOLD_GRADIENT,
                }}
              >
                {draft.title}
              </span>
            )}
          </h1>
        </div>

        {draft.guestName?.trim() ? (
          <p className="mt-[1em] font-display italic" style={{ fontSize: '1.12em' }}>
            {draft.guestName}
          </p>
        ) : null}

        <FleuronDivider className="mt-[1.6em] h-[1.3em] w-[13em]" color={GOLD} />

        <p
          className="mt-[1.1em]"
          style={{ fontFamily: SCRIPT_FONT, fontSize: '2.9em', color: DARK }}
        >
          Cérémonie de mariage
        </p>

        {draft.message ? (
          <p
            className="mt-[1.1em] max-w-[26em] text-pretty leading-[1.7] break-words"
            style={{ fontSize: '1.1em', fontFamily: messageFontCss(draft.messageFont) }}
          >
            {draft.message}
          </p>
        ) : null}

        <div
          className="mt-[1.7em] flex items-stretch justify-center"
          style={{ transform: dateEm ? 'scale(1.12)' : undefined, color: DARK }}
        >
          <p className="flex items-center px-[1em] font-display" style={{ fontSize: '1.35em', fontWeight: 600 }}>
            {formatEventTime(draft.event_time)}
          </p>
          <span style={{ width: 1, backgroundColor: DARK, opacity: 0.5 }} />
          <div className="flex flex-col items-center px-[1.1em]">
            <p className="font-display leading-none" style={{ fontSize: '2.35em', fontWeight: 700 }}>
              {formatDayNumber(draft.event_date)}
            </p>
            <p className="mt-[0.25em] uppercase" style={{ letterSpacing: '0.18em', fontSize: '0.95em' }}>
              {formatMonthShort(draft.event_date)}
            </p>
          </div>
          <span style={{ width: 1, backgroundColor: DARK, opacity: 0.5 }} />
          <p className="flex items-center px-[1em] font-display" style={{ fontSize: '1.35em', fontWeight: 600 }}>
            {formatYearOnly(draft.event_date)}
          </p>
        </div>

        {draft.venue_name || draft.venue_address ? (
          <div
            className="mt-[1.5em] uppercase"
            style={{ fontSize: venueEm ? '1.12em' : '0.98em', color: DARK, lineHeight: 1.9 }}
          >
            {draft.venue_name ? (
              <p style={{ letterSpacing: '0.28em', fontWeight: 600 }}>{draft.venue_name}</p>
            ) : null}
            {draft.venue_address ? (
              <p style={{ letterSpacing: '0.22em', fontSize: '0.88em', opacity: 0.85 }}>
                {draft.venue_address}
              </p>
            ) : null}
            {draft.venue_details ? (
              <p className="italic opacity-80" style={{ letterSpacing: '0.08em', fontSize: '0.86em' }}>
                {draft.venue_details}
              </p>
            ) : null}
          </div>
        ) : null}

        <NoteSection draft={draft} ink={DARK} />
        <ProgramSection
          draft={draft}
          accent={GOLD}
          ink={DARK}
          ornament={<TemplateOrnament templateKey="roses-dor" color={GOLD} />}
        />
        <TableSection
          draft={draft}
          accent={GOLD}
          ink={DARK}
          ornament={<TemplateOrnament templateKey="roses-dor" color={GOLD} />}
        />
        <DressCodeSection
          draft={draft}
          accent={GOLD}
          ink={DARK}
          ornament={<TemplateOrnament templateKey="roses-dor" color={GOLD} />}
        />
      </div>
    </InvitationPaper>
  )
}
