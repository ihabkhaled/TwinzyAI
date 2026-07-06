import type { zodResolver } from '@hookform/resolvers/zod';
import type {
  DefaultValues,
  FieldErrors,
  FieldValues,
  UseFormRegisterReturn,
  UseFormReturn,
} from 'react-hook-form';

/** Field-level validation errors for a form's value shape. */
export type AppFieldErrors<TFieldValues extends FieldValues> = FieldErrors<TFieldValues>;

/** Props spread onto a native input by `register(...)`. */
export type AppRegisteredFieldProps = UseFormRegisterReturn;

/** The full form controller returned by {@link useAppZodForm}. */
export type AppFormReturn<TFieldValues extends FieldValues> = UseFormReturn<TFieldValues>;

/**
 * The validation schema shape accepted by the zod resolver. It is derived from
 * `@hookform/resolvers/zod` so the forms package never imports the `zod` vendor
 * directly — `zod` is owned by `src/packages/zod`. When that facade lands, this
 * can tighten to `ZodType<TFieldValues>` re-exported from it.
 */
export type AppZodSchema = Parameters<typeof zodResolver>[0];

/** Options for {@link useAppZodForm}: a validation schema and initial values. */
export interface AppZodFormOptions<TFieldValues extends FieldValues> {
  schema: AppZodSchema;
  defaultValues: DefaultValues<TFieldValues>;
}
