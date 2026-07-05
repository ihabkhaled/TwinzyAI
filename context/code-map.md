# Code Map

- apps/web/src/app — routes/layouts/providers (composition only)
- apps/web/src/features/game — the game flow (ui/hooks/services/gateways/model/lib)
- apps/web/src/components/ui — reusable presentational primitives
- apps/web/src/lib — wrapped libraries (http, config, storage, share, react-query)
- apps/web/src/i18n — typed string dictionary
- apps/api/src/modules — health, game, ai, file-security, result-aggregation, privacy
- apps/api/src/config — AppConfigService (only process.env reader)
- apps/api/src/infrastructure/logger — LoggerService wrapper
- apps/api/src/common — filters, exceptions, shared constants
- packages/shared/src — constants, enums, schemas, types, interfaces, utils
- eslint/ — split flat config + architecture plugin; docs/rules/skills/memory/context — knowledge
