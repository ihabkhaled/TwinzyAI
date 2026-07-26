import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { CONTACT_PATH } from '@twinzy/shared';

import * as axiosPackage from '@/packages/axios';

import type { ContactSubmitEvent } from './contact-form.types';
import { useContactForm } from './use-contact-form.hook';

vi.mock('@/packages/axios', async (importActual) => ({
  ...(await importActual<typeof axiosPackage>()),
  postJson: vi.fn(),
}));

beforeEach(() => {
  vi.mocked(axiosPackage.postJson).mockReset();
  vi.mocked(axiosPackage.postJson).mockResolvedValue({ sent: true });
});

describe('useContactForm', () => {
  it('posts the form to the versioned backend contact endpoint', () => {
    const form = document.createElement('form');
    const formData = { email: 'sender@example.com', subject: 'Subject', message: 'Message body' };
    for (const [name, value] of Object.entries(formData)) {
      const input = document.createElement('input');
      input.name = name;
      input.value = value;
      form.append(input);
    }
    const event = { preventDefault: vi.fn(), currentTarget: form } as unknown as ContactSubmitEvent;
    const { result } = renderHook(() => useContactForm());

    act(() => {
      result.current.onSubmit(event);
    });

    expect(axiosPackage.postJson).toHaveBeenCalledWith(
      axiosPackage.httpClient,
      CONTACT_PATH,
      formData,
      expect.anything(),
    );
  });
});
