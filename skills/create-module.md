# Skill: Create a Backend Module

> Applies rules/16.

1. modules/NAME/ with only the folders needed + NAME.module.ts + index.ts barrel.
2. Providers registered in the module; cross-module access via exports only.
3. Follow Controller -> Manager -> Service order from day one (even for trivial modules —
   see health/ as the reference).
4. Add to AppModule imports; write tests alongside.
Gate: npm run lint && npm run typecheck && npm run test:unit && npm run build
