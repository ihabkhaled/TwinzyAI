/** One flattened, loggable validation failure: which field broke which rule. */
export interface ValidationIssue {
  readonly field: string;
  readonly constraint: string;
}
