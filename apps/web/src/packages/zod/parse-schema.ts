import type { z } from 'zod';

export interface SchemaParseIssue {
  path: string;
  message: string;
}

export type SafeParseResult<TData> =
  { success: true; data: TData } | { success: false; issues: SchemaParseIssue[] };

function toIssues(error: z.ZodError): SchemaParseIssue[] {
  return error.issues.map((issue) => ({
    message: issue.message,
    path: issue.path.map(String).join('.'),
  }));
}

export class SchemaParseError extends Error {
  public override readonly name = 'SchemaParseError';
  public readonly issues: readonly SchemaParseIssue[];

  public constructor(subject: string, issues: readonly SchemaParseIssue[]) {
    super(`Failed to parse ${subject}`);
    this.issues = issues;
  }
}

export function parseSchema<TSchema extends z.ZodType>(
  schema: TSchema,
  value: unknown,
  subject: string,
): z.output<TSchema> {
  const result = schema.safeParse(value);

  if (!result.success) {
    throw new SchemaParseError(subject, toIssues(result.error));
  }

  return result.data;
}

export function safeParseSchema<TSchema extends z.ZodType>(
  schema: TSchema,
  value: unknown,
): SafeParseResult<z.output<TSchema>> {
  const result = schema.safeParse(value);

  if (result.success) {
    return { data: result.data, success: true };
  }

  return { issues: toIssues(result.error), success: false };
}
