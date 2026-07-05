import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { useImageUploadController } from '@/features/game/hooks/useImageUploadController';
import { en } from '@/i18n/en';

import { buildImageFile } from './fixtures/game-fixtures';
import { objectUrlMocks } from './setup';

const buildFileList = (files: File[]): FileList =>
  ({
    length: files.length,
    item: (index: number) => files[index] ?? null,
    ...Object.fromEntries(files.map((file, index) => [index, file])),
  }) as unknown as FileList;

describe('useImageUploadController', () => {
  it('creates a preview object URL for a valid file', () => {
    const { result } = renderHook(() => useImageUploadController());

    act(() => {
      result.current.onFileSelected(buildFileList([buildImageFile()]));
    });

    expect(result.current.file).toBeDefined();
    expect(result.current.previewUrl).toContain('blob:');
    expect(result.current.fileError).toBeUndefined();
    expect(objectUrlMocks.create).toHaveBeenCalledTimes(1);
  });

  it('revokes the previous object URL when the file changes', () => {
    const { result } = renderHook(() => useImageUploadController());

    act(() => {
      result.current.onFileSelected(buildFileList([buildImageFile('a.jpg')]));
    });
    const firstPreview = result.current.previewUrl;

    act(() => {
      result.current.onFileSelected(buildFileList([buildImageFile('b.jpg')]));
    });

    expect(objectUrlMocks.revoke).toHaveBeenCalledWith(firstPreview);
  });

  it('revokes the object URL on unmount', () => {
    const { result, unmount } = renderHook(() => useImageUploadController());

    act(() => {
      result.current.onFileSelected(buildFileList([buildImageFile()]));
    });
    const preview = result.current.previewUrl;

    unmount();

    expect(objectUrlMocks.revoke).toHaveBeenCalledWith(preview);
  });

  it('rejects multiple files with a friendly message', () => {
    const { result } = renderHook(() => useImageUploadController());

    act(() => {
      result.current.onFileSelected(buildFileList([buildImageFile('a.jpg'), buildImageFile('b.jpg')]));
    });

    expect(result.current.file).toBeUndefined();
    expect(result.current.fileError).toBe(en['error.multipleFiles']);
  });

  it('clears everything on clearFile and revokes the preview', () => {
    const { result } = renderHook(() => useImageUploadController());

    act(() => {
      result.current.onFileSelected(buildFileList([buildImageFile()]));
    });
    act(() => {
      result.current.clearFile();
    });

    expect(result.current.file).toBeUndefined();
    expect(result.current.previewUrl).toBeUndefined();
    expect(objectUrlMocks.revoke).toHaveBeenCalledTimes(1);
  });

  it('never touches browser storage with image data', () => {
    const localSet = vi.spyOn(Storage.prototype, 'setItem');
    const { result } = renderHook(() => useImageUploadController());

    act(() => {
      result.current.onFileSelected(buildFileList([buildImageFile()]));
    });

    expect(localSet).not.toHaveBeenCalled();
  });
});
