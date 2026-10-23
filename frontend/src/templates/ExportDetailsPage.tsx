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
import { PanelDecor, panelSkinFor } from './panelSkin.tsx'
import { formatProgramRange, groupDressCode } from './shared.tsx'
import { LuxuryTable } from './tableScene.tsx'
import type { DressCodeEntry, ProgramEntry, TableEntry } from './types.ts'

/** Full A4 height at 96dpi — the page keeps at least one paper height. */
const A4_HEIGHT_PX = 1122

function SectionTitle({ title, templateKey, color, titleClass }: {
  title: string
  templateKey: string
  color: string
  titleClass: string
}) {
  return (
    <div className="flex flex-col items-center text-center">
      <h2
        className={`text-[1.6rem] font-semibold uppercase leading-none ${titleClass}`}
        style={{ letterSpacing: '0.3em', color, paddingLeft: '0.3em' }}
      >
        {title}
      </h2>
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
      <PanelDecor templateKey={templateKey} />
      <div
        className="relative z-10 flex flex-col justify-center px-[3.4rem] py-[3.6rem]"
        style={{ minHeight: A4_HEIGHT_PX }}
      >
        {dressCode.length ? (
          <section>
            <SectionTitle
              title="Dress code"
              templateKey={templateKey}
              color={skin.accent}
              titleClass={skin.titleClass}
            />
            {groupDressCode(dressCode).map((group, groupIndex) => (
              <figure key={groupIndex} className={groupIndex === 0 ? 'mt-8' : 'mt-9'}>
                <div className="flex flex-wrap items-start justify-center gap-5">
                  {group.images.map((image, index) => (
                    <div
                      key={`${image.url}-${index}`}
                      className="w-[12.5rem] overflow-hidden rounded-[10px] border"
                      style={{ borderColor: skin.line }}
                    >
                      <img
                        src={image.url}
                        alt=""
                        crossOrigin="anonymous"
                        className="block h-[16rem] w-full object-cover"
                      />
                    </div>
                  ))}
                </div>
                {group.caption ? (
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
              titleClass={skin.titleClass}
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
              titleClass={skin.titleClass}
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
