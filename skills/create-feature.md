# Skill: Create a Frontend Feature

> Applies rules/01, 02, 03, 04. Feature = self-contained folder under apps/web/src/features.

1. Scaffold features/NAME/{ui,hooks,services,gateways,model,lib,index.ts}.
2. model/ first: constants, enums (as-const), types, interfaces, schemas, query-keys.
3. Gateway: HTTP only via lib/http wrapper; validate responses with shared Zod schemas.
4. Service: orchestrate gateway + mapping (lib/mappers).
5. Hooks: useNameController owning state/handlers; call the service; return one props object.
6. ui/: pure TSX components; container calls the controller hook and spreads props.
7. Wire the route in app/ as pure composition. 8. Strings via i18n. 9. Tests first (web-unit).
Gate: npm run lint && npm run typecheck && npm run test:unit && npm run test:coverage && npm run build && npm run security:scan
