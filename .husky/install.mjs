// Husky installer guard (run from the root `prepare` script).
//
// Husky is a devDependency. Managed hosts (Vercel, Railway) install with
// production settings or `--omit=dev`, so the `husky` binary is absent and a
// bare `husky` in `prepare` exits 127 ("husky: command not found"), aborting
// the whole `npm install`. This guard skips setup on CI/deploy and never fails:
// it imports husky as a module (no shelling out, no scary stderr) and installs
// git hooks only in a normal local dev checkout.
if (process.env.CI || process.env.VERCEL || process.env.RAILWAY_ENVIRONMENT) {
  process.exit(0);
}

try {
  const { default: husky } = await import('husky');
  husky();
} catch {
  // husky not installed (e.g. --omit=dev): nothing to set up.
}
