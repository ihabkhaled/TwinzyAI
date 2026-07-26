export const CONTACT_THROTTLE = {
  default: { limit: 3, ttl: 3_600_000 },
} as const;

export const CONTACT_SUCCESS_RESPONSE = { sent: true } as const;
