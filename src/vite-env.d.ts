/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Optional Groq API key for the trip planner (local .env only — never commit). */
  readonly VITE_GROQ_API_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
