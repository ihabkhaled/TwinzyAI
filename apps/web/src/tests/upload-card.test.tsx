import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { UploadCard } from '@/features/game/ui/UploadCard';
import { en } from '@/i18n/en';

import { buildImageFile } from './fixtures/game-fixtures';

describe('UploadCard camera capture', () => {
  it('offers both an upload control and a camera control', () => {
    render(<UploadCard previewUrl={undefined} fileError={undefined} onFileInputChange={vi.fn()} />);

    expect(screen.getByText(en['game.uploadLabel'])).toBeInTheDocument();
    expect(screen.getByText(en['game.cameraLabel'])).toBeInTheDocument();
  });

  it('exposes a camera input that requests the rear camera and an unrestricted upload input', () => {
    render(<UploadCard previewUrl={undefined} fileError={undefined} onFileInputChange={vi.fn()} />);

    const cameraInput = screen.getByLabelText(en['game.cameraLabel'], { exact: false });
    expect(cameraInput).toHaveAttribute('capture', 'environment');
    expect(cameraInput).toHaveAttribute('accept', 'image/*');

    const uploadInput = screen.getByLabelText(en['game.uploadLabel'], { exact: false });
    expect(uploadInput).not.toHaveAttribute('capture');
    expect(uploadInput).toHaveAttribute('accept', 'image/jpeg,image/png,image/webp');
  });

  it('routes a photo taken with the camera through the same change handler', async () => {
    const onFileInputChange = vi.fn();
    render(
      <UploadCard
        previewUrl={undefined}
        fileError={undefined}
        onFileInputChange={onFileInputChange}
      />,
    );

    await userEvent.upload(
      screen.getByLabelText(en['game.cameraLabel'], { exact: false }),
      buildImageFile(),
    );

    expect(onFileInputChange).toHaveBeenCalledTimes(1);
  });
});
