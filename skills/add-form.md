# Skill: Add a Form

Use this skill for any user-input form. Twinzy's **photo-upload + consent** flow is the end-to-end
reference — follow its files layer by layer. Doctrine:
[rules/frontend/02-components-and-containers.md](../rules/frontend/02-components-and-containers.md),
[rules/frontend/03-hooks.md](../rules/frontend/03-hooks.md). (There is no login form — Twinzy has no
identity or accounts.)

## Reference implementation (game upload form)

| Layer        | File                                                                          |
| ------------ | ----------------------------------------------------------------------------- |
| Schema       | `apps/web/src/modules/game/schemas/upload-form.schema.ts` (`uploadFormSchema`)|
| Message keys | `apps/web/src/modules/game/constants/game-message-keys.constants.ts`          |
| Field ids    | `apps/web/src/modules/game/constants/game.constants.ts` (`UPLOAD_FIELD_IDS`)  |
| Mutation     | `apps/web/src/modules/game/queries/game.mutations.ts` (`useSubmitPhotoMutation`) |
| Hook         | `apps/web/src/modules/game/hooks/use-upload-form.hook.ts` (`useUploadForm`)   |
| Component    | `apps/web/src/modules/game/components/upload-form.component.tsx` (JSX-only)    |
| Container    | `apps/web/src/modules/game/containers/upload-form.container.tsx`               |

## Steps

1. **Schema with i18n-key messages.** Define the form schema in
   `apps/web/src/modules/<feature>/schemas/` using `z` from `@/packages/zod`. Every error message is
   an i18n KEY from the module's `*-message-keys.constants.ts`, never copy:

   ```ts
   consentGiven: z.literal(true, GAME_VALIDATION_MESSAGE_KEYS.consentRequired),
   photo: z
     .instanceof(File, GAME_VALIDATION_MESSAGE_KEYS.photoRequired)
     .refine((file) => file.size <= MAX_UPLOAD_BYTES, GAME_VALIDATION_MESSAGE_KEYS.photoTooLarge),
   ```

   Add the corresponding keys to both catalogs per
   [skills/add-i18n-message-key.md](./add-i18n-message-key.md). Numeric limits (`MAX_UPLOAD_BYTES`)
   live in `constants/`, not inline. Client-side checks are UX only — the backend is the
   authoritative validator for size/MIME/magic-bytes/consent.

2. **Wire react-hook-form through the wrapper.** In the hook, call `useAppZodForm` from
   `@/packages/forms` with `schema` and `defaultValues` — never raw `useForm` or ad-hoc validate
   callbacks (the wrapper fixes `mode: 'onSubmit'`, `reValidateMode: 'onChange'`).
3. **Create the submit mutation** in `queries/` via `useAppMutation` from `@/packages/query`,
   delegating to a React-free service ([skills/create-mutation.md](./create-mutation.md)).
   `useSubmitPhotoMutation` is the minimal example.
4. **Build field view models in the hook.** The hook (`use-upload-form.hook.ts`) returns one
   fully-translated view model: per-field `{ fieldId, label, error, testId, inputProps }` plus
   `title`, `submitLabel`, `isSubmitting`, `formError`, and `onSubmit`. Key rules:
   - Field error keys come off `form.formState.errors.<field>?.message` and are translated with
     `t(...)` before display.
   - `inputProps` is `form.register('<field>')` (`AppRegisteredFieldProps`); the file input is
     wired with `setValue` on `change` since files are not native RHF values.
   - On valid submit: `await mutateAsync(values)`, `showToast` with translated copy, then navigate
     to the result view via `@/packages/navigation`. Drop the `File` reference afterward — never
     stash the image in a store or cache.
   - `formError` is the translated generic error when `mutation.isError` — never the raw error
     message (error-sanitization doctrine,
     [rules/frontend/18-error-handling.md](../rules/frontend/18-error-handling.md)).
5. **Render through `FormField` for accessibility.** The JSX-only component wraps each control in
   `FormField` (`apps/web/src/shared/components/forms/form-field.component.tsx`), which binds `Label`
   via `htmlFor={fieldId}` and renders the error in a `role="alert"` region whose id is the field id
   suffixed with `-error`. The control MUST carry `aria-invalid` and the matching
   `aria-describedby`, plus `data-testid` from `TEST_IDS`. The `<form>` uses `noValidate` (the schema
   is the validator) and the submit `Button` is `disabled={isSubmitting}`. The consent control is a
   real, labeled checkbox — not a styled `div`.
6. **Container connects hook to component.** A `'use client'` file with a
   `// client-boundary-reason:` comment that calls the hook and passes the view model — nothing else.
7. **Test both paths.**
   - Unit tests: schema table-driven cases (valid, each invalid variant → expected key) at 100%
     coverage ([skills/write-unit-tests-frontend.md](./write-unit-tests-frontend.md)).
   - Integration: `renderWithProviders`, submit with consent unchecked / no file → assert the
     translated validation copy in the alert regions; submit valid → assert the success flow. Drive
     the negative server path with a rejection sentinel in the mock fixtures
     (`apps/web/src/modules/game/api/game.mock.ts`) so the failure branch is deterministic — assert
     the generic form error appears. See
     [skills/write-integration-tests-frontend.md](./write-integration-tests-frontend.md).
   - E2e: happy submit + rejected-submit negative path per
     [skills/write-e2e-tests-frontend.md](./write-e2e-tests-frontend.md).

## Definition of done

- Schema keys translated in the hook; component JSX-only; `FormField` wiring intact; consent is a
  labeled checkbox.
- Negative-path test exists at integration and e2e level; the image is never persisted client-side.

## Validation (gate)

```bash
npm run lint                # ESLint flat config — 0 errors, 0 warnings
npm run typecheck           # tsgo, strict
npm run test:coverage       # Vitest — 95% global, 100% for the schema
npm run build               # next build
npm run quality:dead-code   # knip — no orphaned exports
npm run quality:circular    # madge — no import cycles
npm run test:e2e            # upload happy + rejected paths (+ test:a11y for the form)
```
