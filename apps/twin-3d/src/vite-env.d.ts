/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Where the twin's "back to site" control returns to. */
  readonly VITE_SITE_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
