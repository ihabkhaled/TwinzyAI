declare namespace NodeJS {
  interface ProcessEnv {
    /** Public API origin baked into the bundle at build time. */
    readonly NEXT_PUBLIC_API_BASE_URL?: string;
  }
}
