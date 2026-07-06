'use client';
// client-boundary-reason: builds a react-hook-form instance whose field state and validation run in the browser.
import { zodResolver } from '@hookform/resolvers/zod';
import type { FieldValues, Resolver } from 'react-hook-form';
import { useForm } from 'react-hook-form';

import type { AppFormReturn, AppZodFormOptions } from './form-types';

/**
 * Create a zod-validated form controller. Validation runs on submit, then
 * re-validates on change once a field has errored.
 */
export const useAppZodForm = <TFieldValues extends FieldValues>(
  options: AppZodFormOptions<TFieldValues>,
): AppFormReturn<TFieldValues> =>
  useForm<TFieldValues>({
    resolver: zodResolver(options.schema) as Resolver<TFieldValues>,
    defaultValues: options.defaultValues,
    mode: 'onSubmit',
    reValidateMode: 'onChange',
  });
