# Skill: Create a Frontend Feature → moved

The strict frontend operating system replaces the old `features/NAME/{ui,hooks,services,...}` layout
with the module architecture under `apps/web/src/modules/<feature>/`.

**Use [create-module-frontend.md](./create-module-frontend.md)** to scaffold a feature module
(types → enums/constants → api/schemas → gateway → mapper → service → query keys → queries/mutations
→ store → hooks → components → container, behind a single `index.ts` public surface).

Supporting skills for the individual layers:
[create-component.md](./create-component.md) ·
[create-container.md](./create-container.md) ·
[create-hook.md](./create-hook.md) ·
[create-service-frontend.md](./create-service-frontend.md) ·
[create-query.md](./create-query.md) ·
[create-mutation.md](./create-mutation.md) ·
[create-zustand-store.md](./create-zustand-store.md) ·
[add-route.md](./add-route.md).

Frontend skill index: [README-frontend.md](./README-frontend.md).
