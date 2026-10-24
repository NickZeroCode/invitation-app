/**
 * PDF page 3 — dress code, programme and table on the selected template's own
 * paper tone (LAC MUNKAMBA reference, p.3).
 *
 * The dress-code gallery sits centered under its title; the programme is a
 * symmetric two-column grid with mirrored badge bullets: the left column
 * leads with the badge, the right column mirrors it. The table is a luxury
 * table with the assigned number on it and the optional text under it. The
 * page is built at the A4 width with a full A4 height floor and grows with
 * the content.
 */
import { TemplateOrnament } from './ornaments.tsx'
import { PageDecor, pageInset } from './pageDecor.tsx'
import { panelSkinFor } from './panelSkin.tsx'
import type { PanelSkin } from './panelSkin.tsx'
import { formatProgramRange, groupDressCode } from './shared.tsx'
import { LuxuryTable } from './tableScene.tsx'
import type { DressCodeEntry, ProgramEntry, TableEntry } from './types.ts'

/** Full A4 height at 96dpi — the page keeps at least one paper height. */
const A4_HEIGHT_PX = 1122

function SectionTitle({ title, templateKey, color, skin }: {
  title: string
  templateKey: string
  color: string
  skin: PanelSkin
}) {
  return (
    <div className="flex flex-col items-center text-center">
      {/* Titles follow the template: spaced capitals in its display face,
          or — for a script template — one large script line. */}
      {skin.titleScript ? (
        <h2 className="leading-[1.05]" style={{ fontFamily: skin.titleFont, fontSize: '4.6rem', fontWeight: 400, color }}>
          {title}
        </h2>
      ) : (
        <h2
          className={`text-[1.6rem] font-semibold uppercase leading-none ${skin.titleClass}`}
          style={{ letterSpacing: '0.3em', color, paddingLeft: '0.3em', fontFamily: skin.titleFont }}
        >
          {title}
        </h2>
      )}
      <TemplateOrnament
        templateKey={templateKey}
        color={color}
        className="mx-auto mt-4 block h-auto w-52"
      />
    </div>
  )
}

export function ExportDetailsPage({
  templateKey,
  dressCode,
  program,
  table,
}: {
  templateKey: string
  dressCode: DressCodeEntry[]
  program: ProgramEntry[]
  table?: TableEntry
}) {
  const skin = panelSkinFor(templateKey)
  const inset = pageInset(templateKey)

  return (
    <div
      className="relative overflow-hidden"
      style={{
        background: skin.paper,
        color: skin.ink,
        fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif",
        minHeight: A4_HEIGHT_PX,
      }}
    >
      <PageDecor templateKey={templateKey} />
      <div
        className="relative z-10 flex flex-col justify-center"
        style={{
          minHeight: A4_HEIGHT_PX,
          // Clear the template's own corner decoration, as its card does.
          padding: `${inset.top}px ${inset.x}px ${inset.bottom}px`,
        }}
      >
        {dressCode.length ? (
          <section>
            <SectionTitle
              title="Dress code"
              templateKey={templateKey}
              color={skin.accent}
              skin={skin}
            />
            {groupDressCode(dressCode).map((group, groupIndex) => (
              <figure key={groupIndex} className={groupIndex === 0 ? 'mt-8' : group.first ? 'mt-9' : 'mt-4'}>
                <div className="flex items-start justify-center gap-4">
                  {group.images.map((image, index) => (
                    <div
                      key={`${image.url}-${index}`}
                      className="min-w-0 max-w-[12.5rem] flex-1 overflow-hidden rounded-[10px] border"
                      style={{ borderColor: skin.line }}
                    >
                      <img
                        src={image.url}
                        alt=""
                        crossOrigin="anonymous"
                        className="block aspect-[25/32] w-full object-cover"
                      />
                    </div>
                  ))}
                </div>
                {group.caption && group.last ? (
                  <figcaption
                    className="mt-3 text-center text-[0.85rem] italic leading-[1.5]"
                    style={{ color: skin.inkSoft }}
                  >
                    {group.caption}
                  </figcaption>
                ) : null}
              </figure>
            ))}
          </section>
        ) : null}

        {program.length ? (
          <section className={dressCode.length ? 'mt-12' : ''}>
            <SectionTitle
              title="Programme"
              templateKey={templateKey}
              color={skin.accent}
              skin={skin}
            />
            <div className="mx-auto mt-9 grid w-full max-w-[36rem] grid-cols-2 gap-x-12 gap-y-8">
              {program.map((item, index) => {
                const mirrored = index % 2 === 1
                const solo = program.length % 2 === 1 && index === program.length - 1
                return (
                  <div
                    key={index}
                    className={`flex items-center gap-4 ${solo ? 'col-span-2 justify-center' : ''} ${
                      mirrored ? 'flex-row-reverse text-right' : ''
                    }`}
                  >
                    <span
                      className="flex h-[2.75rem] w-[2.75rem] shrink-0 items-center justify-center rounded-full"
                      style={{ backgroundColor: skin.accent }}
                      aria-hidden="true"
                    >
                      <span
                        style={{
                          width: '0.62rem',
                          height: '0.62rem',
                          backgroundColor: skin.onAccent,
                          transform: 'rotate(45deg)',
                        }}
                      />
                    </span>
                    <div className="min-w-0">
                      <p
                        className="text-[0.85rem] font-semibold uppercase"
                        style={{ color: skin.accent, letterSpacing: '0.14em' }}
                      >
                        {formatProgramRange(item.start_time, item.end_time)}
                      </p>
                      <p className="mt-1 text-[1.02rem] leading-[1.5]" style={{ color: skin.ink }}>
                        {item.description}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        ) : null}

        {table?.number ? (
          <section className={dressCode.length || program.length ? 'mt-12' : ''}>
            <SectionTitle
              title="Votre table"
              templateKey={templateKey}
              color={skin.accent}
              skin={skin}
            />
            <div className="mx-auto mt-9 flex w-full max-w-[26rem] flex-col items-center">
              <LuxuryTable number={table.number} accent={skin.accent} ink={skin.ink} className="w-full" />
              {table.text ? (
                <p
                  className="mt-5 text-center text-[1.02rem] italic leading-[1.5]"
                  style={{ color: skin.inkSoft }}
                >
                  {table.text}
                </p>
              ) : null}
            </div>
          </section>
        ) : null}
      </div>
    </div>
  )
}
