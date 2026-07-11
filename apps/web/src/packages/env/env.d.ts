/**
 * Ambient declarations for the public (browser-exposed) environment variables.
 *
 * Declaring the `NEXT_PUBLIC_*` keys explicitly on `NodeJS.ProcessEnv` makes
 * static dot-access (`process.env.NEXT_PUBLIC_APP_ENV`) legal under
 * `noPropertyAccessFromIndexSignature` — which is exactly the access form Next
 * statically inlines into the client bundle at build time.
 *
 * This is a global-scope ambient script (no imports/exports) so the
 * declaration merges directly into the global `NodeJS` namespace.
 */
declare namespace NodeJS {
  interface ProcessEnv {
    readonly NEXT_PUBLIC_APP_ENV?: string;
    readonly NEXT_PUBLIC_API_BASE_URL?: string;
    readonly NEXT_PUBLIC_PAYPAL_ME_USERNAME?: string;
    readonly NEXT_PUBLIC_PAYPAL_CLIENT_ID?: string;
  }
}
