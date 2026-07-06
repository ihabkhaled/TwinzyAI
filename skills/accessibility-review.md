# Skill: Accessibility Review

> Applies rules/13.

1. Keyboard-only pass through the whole game flow.
2. Labels/roles on every control (file input, consent checkbox, buttons); heading order.
3. Contrast AA in both themes; focus visible; touch targets >= 44px.
4. Reduced-motion pass; screen-reader smoke on results; run the axe e2e test.

Gate: npm run lint && npm run typecheck && npm run test:unit && npm run test:coverage && npm run build && npm run security:scan
