# ADRs

Store architectural decision records here. Create a new ADR whenever a change introduces or alters an architectural decision that future engineers will need to understand. Start from [`adr-template.md`](./adr-template.md); number sequentially (`adr-001`, `adr-002`, ...).

## Index

| ADR | Title | Status |
| --- | --- | --- |
| [ADR-001](./adr-001-strict-engineering-os.md) | Adopt the Strict Layered Engineering OS for the Backend | Accepted |
| [ADR-002](./adr-002-zod-validation-vendor.md) | Zod as the Single Validation Vendor (Including the HTTP Boundary) | Accepted |
| [ADR-003](./adr-003-horizontal-scaling-plan.md) | Horizontal Scaling Plan for Twinzy API | Accepted (deferred) |
| [ADR-004](./adr-004-parallel-ai-pipeline.md) | Parallel AI Pipeline (Release A: async candidate-generation lanes) | Accepted (flag-gated, off by default) |

### Frontend ADRs (`apps/web`)

Frontend decisions use an `adr-fe-NNNN` prefix so they never collide with the backend `adr-NNN` series.

| ADR | Title | Status |
| --- | --- | --- |
| [ADR-FE-0001](./adr-fe-0001-strict-next-architecture.md) | Strict Next.js frontend architecture (module-first, JSX-only components, owner wrappers, ESLint enforcement, BFF gateway) | Accepted |
| [ADR-FE-0002](./adr-fe-0002-component-workbench-over-storybook.md) | Component workbench route instead of Storybook | Accepted |
