/**
 * Single swap surface for the OpenAPI decorator vendor (@nestjs/swagger).
 * Controllers and DTOs import these re-exports — the vendor package itself
 * is importable only here and in src/bootstrap (document setup).
 */
export { ApiProperty, ApiPropertyOptional, ApiTags } from '@nestjs/swagger';
