# Agent Code Map

Mirror of context/code-map.md. Key anchors:
- Game API flow: apps/api/src/modules/game/managers/game.manager.ts
- Only Gemini touchpoint: apps/api/src/modules/ai/adapters/gemini.adapter.ts
- Prompt files: apps/api/src/modules/ai/prompts/*.md (+ prompt-loader.service.ts)
- Upload checks: apps/api/src/modules/file-security/services/
- Only env reader: apps/api/src/config/app-config.service.ts
- Frontend flow: apps/web/src/features/game/ (ui -> hooks -> services -> gateways)
- Strings: apps/web/src/i18n/en.ts ; shared contracts: packages/shared/src/schemas/
