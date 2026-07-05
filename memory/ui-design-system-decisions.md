# UI / Design System Decisions

- Theme tokens are CSS custom properties consumed by Tailwind v4 @theme inline; dark mode via
  prefers-color-scheme with a data-theme override attribute.
- Brand: violet primary (#6d28d9 light / #a78bfa dark), pink accent; AA contrast in both themes.
- Mobile-first: 320px baseline, big touch targets (min-h-12), safe-area padding on body.
- Reduced motion globally respected via media query kill-switch.
