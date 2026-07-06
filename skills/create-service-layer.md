# Skill: Create a Frontend Service → moved

The strict frontend operating system defines the React-free service layer under a module's
`services/` folder (gateway → mapper → domain), composed by TanStack Query and consumed by hooks.

**Use [create-service-frontend.md](./create-service-frontend.md)** for the full playbook (wire
types + Zod schema + gateway via `@/packages/axios` + mapper + one exported use-case per function,
domain types only, errors propagated for the hook layer to translate).

Related layers:
[create-query.md](./create-query.md) (reads) ·
[create-mutation.md](./create-mutation.md) (writes) ·
[create-hook.md](./create-hook.md) (view models).

Frontend skill index: [README-frontend.md](./README-frontend.md).
