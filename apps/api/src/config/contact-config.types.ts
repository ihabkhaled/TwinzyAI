export interface ContactEmailConfig {
  enabled: boolean;
  from: string;
  to: string;
  rateLimitMax: number;
  rateLimitWindowMs: number;
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
}
