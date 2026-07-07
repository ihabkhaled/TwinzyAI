import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { UploadCard } from '@/features/game/ui/UploadCard';
import { en } from '@/i18n/en';

describe('UploadCard', () => {
  it('offers both an upload control and a "Take a photo" camera button', () => {
    render(
      <UploadCard
        previewUrl={undefined}
        fileError={undefined}
        onFileInputChange={vi.fn()}
        onOpenCamera={vi.fn()}
      />,
    );

    expect(screen.getByLabelText(en['game.uploadLabel'], { exact: false })).toHaveAttribute(
      'accept',
      'image/jpeg,image/png,image/webp',
    );
    expect(screen.getByRole('button', { name: /take a photo/i })).toBeInTheDocument();
  });

  it('opens the camera (does not open the file picker) when "Take a photo" is clicked', async () => {
    const onOpenCamera = vi.fn();
    render(
      <UploadCard
        previewUrl={undefined}
        fileError={undefined}
        onFileInputChange={vi.fn()}
        onOpenCamera={onOpenCamera}
      />,
    );

    await userEvent.click(screen.getByRole('button', { name: /take a photo/i }));

    expect(onOpenCamera).toHaveBeenCalledTimes(1);
  });
});
