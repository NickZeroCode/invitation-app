import '@fontsource-variable/inter'
import '@fontsource/playfair-display/400.css'
import '@fontsource/playfair-display/500.css'
import '@fontsource/playfair-display/600.css'
import '@fontsource/playfair-display/700.css'
import '@fontsource/cormorant-garamond/400.css'
import '@fontsource/cormorant-garamond/600.css'
import '@fontsource/dancing-script/400.css'
import '@fontsource/dancing-script/700.css'
import '@fontsource/great-vibes/400.css'
import '@fontsource/parisienne/400.css'
import '@fontsource/cinzel-decorative/400.css'
import '@fontsource/cinzel-decorative/700.css'
import '@fontsource/montserrat/400.css'
import '@fontsource/montserrat/600.css'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { getTemplate, sampleDraft } from './templates/registry.tsx'

const params = new URLSearchParams(window.location.search)
const templateKey = params.get('t') ?? 'mood-board'
const width = Number(params.get('w') ?? 420)
const definition = getTemplate(templateKey)
const draft = sampleDraft(templateKey)

// QA-only: give the mood-board a cover photo + dress-code photos from the
// reference art so the full magazine layout renders (monogram overlaps the
// photo melt; outfit galleries appear).
if (templateKey === 'mood-board') {
  draft.cover_url = '/important-template/IMG_9952.png'
  draft.coverTitle = ''
  draft.note =
    'Aimer, ce n\u2019est pas se regarder l\u2019un l\u2019autre, c\u2019est regarder dans la m\u00eame direction. Antoine de Saint-Exup\u00e9ry'
  draft.dressCode = [
    { url: '/important-template/IMG_9953.png', caption: 'Tenue d\u2019honneur' },
    { url: '/important-template/IMG_9954.png', caption: 'Cocktail' },
    { url: '/important-template/IMG_9952.png', caption: 'Soir\u00e9e' },
  ]
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <div style={{ display: 'flex', gap: 32, padding: 24, background: '#DDD', alignItems: 'flex-start' }}>
      {definition ? (
        <div style={{ width, flexShrink: 0, border: '1px solid #999' }}>
          <definition.Component draft={draft} />
        </div>
      ) : (
        <p>unknown template {templateKey}</p>
      )}
    </div>
  </StrictMode>,
)
