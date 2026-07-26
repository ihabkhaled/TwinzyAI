import { describe, expect, it, vi } from 'vitest';

import type { ContactRequest } from '@twinzy/shared';

import type { AppConfigService } from '../../../config';
import { SmtpMailAdapter } from '../adapters/smtp-mail.adapter';
import { SendContactUseCase } from '../application/send-contact.use-case';

const { sendMail } = vi.hoisted(() => ({ sendMail: vi.fn().mockResolvedValue(undefined) }));

vi.mock('nodemailer', () => ({
  default: { createTransport: vi.fn(() => ({ sendMail })) },
}));

const REQUEST: ContactRequest = {
  email: 'sender@example.com',
  subject: 'A useful subject',
  message: 'A sufficiently detailed message.',
};

const buildConfig = (enabled = true): AppConfigService =>
  ({
    contactEmailConfig: {
      enabled,
      from: 'from@example.com',
      to: 'owner@example.com',
      rateLimitMax: 3,
      rateLimitWindowMs: 3_600_000,
      host: 'smtp.example.com',
      port: 587,
      secure: false,
      user: 'smtp-user',
      pass: 'smtp-pass',
    },
  }) as AppConfigService;

describe('contact delivery', () => {
  it('sends only fixed-address plain text with the sender as reply-to', async () => {
    await new SmtpMailAdapter(buildConfig()).send(REQUEST);
    expect(sendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        from: 'from@example.com',
        to: 'owner@example.com',
        replyTo: REQUEST.email,
        text: expect.stringContaining(REQUEST.message),
      }),
    );
  });

  it('returns a stable success response after adapter delivery', async () => {
    const adapter = { send: vi.fn().mockResolvedValue(undefined) } as unknown as SmtpMailAdapter;
    await expect(new SendContactUseCase(adapter).execute(REQUEST)).resolves.toStrictEqual({
      sent: true,
    });
    expect(adapter.send).toHaveBeenCalledWith(REQUEST);
  });

  it('fails closed when contact delivery is disabled', async () => {
    await expect(new SmtpMailAdapter(buildConfig(false)).send(REQUEST)).rejects.toMatchObject({
      status: 503,
    });
  });
});
