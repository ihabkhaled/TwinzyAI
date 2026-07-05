# Mobile & PWA Standards

- Breakpoints tested: 320, 375, 390, 414 px + tablet + desktop. No horizontal scroll ever.
- Touch targets >= 44px (Tailwind min-h-12 on primary actions); safe-area insets on body.
- Dark and light themes; prefers-reduced-motion respected; skeleton loading states.
- PWA: manifest.webmanifest (standalone, icons, theme colors) + installability smoke test in e2e.
- Uploads: input accept="image/jpeg,image/png,image/webp" with capture support on mobile so the
  camera/gallery sheet opens; clear friendly error states and retry.
