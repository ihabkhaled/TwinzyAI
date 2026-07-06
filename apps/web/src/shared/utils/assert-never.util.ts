/**
 * Exhaustiveness helper. Placed in the `default`/`else` branch of a discriminated
 * union so the compiler errors if a new case is added but not handled; at runtime
 * it throws, turning an impossible value into a loud failure instead of silence.
 */
export function assertNever(value: never): never {
  throw new Error(`Unexpected value: ${String(value)}`);
}
