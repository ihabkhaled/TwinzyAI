/** Options for {@link createTestApp}. */
export interface CreateTestAppOptions {
  /** Also mount the OpenAPI/Swagger UI (exercises its `@fastify/static` dep). */
  readonly withSwagger?: boolean;
}
