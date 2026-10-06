/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Base URL of the Django API. Empty = same-origin (dev proxy / prod rewrite). */
  readonly VITE_API_BASE_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
