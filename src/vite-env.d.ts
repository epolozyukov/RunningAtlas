/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Optional Groq API key for the trip planner (local .env only — never commit). */
  readonly VITE_GROQ_API_KEY?: string;
  /** "true" turns on adding/editing/deleting results in a production build. */
  readonly VITE_ENABLE_EDITING?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
