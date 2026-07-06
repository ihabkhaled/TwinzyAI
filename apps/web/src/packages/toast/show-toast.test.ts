import { toast } from 'sonner';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { showToast, ToastType } from './show-toast';

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
  },
}));

describe('showToast', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it.each([
    [ToastType.Success, toast.success],
    [ToastType.Error, toast.error],
    [ToastType.Info, toast.info],
    [ToastType.Warning, toast.warning],
  ])('routes the %s intent to the matching sonner method', (type, method) => {
    showToast({ type, message: 'already-translated' });

    expect(method).toHaveBeenCalledWith('already-translated', undefined);
  });

  it('forwards a provided id to sonner for dedupe/update', () => {
    showToast({ type: ToastType.Error, message: 'boom', id: 7 });

    expect(toast.error).toHaveBeenCalledWith('boom', { id: 7 });
  });
});
