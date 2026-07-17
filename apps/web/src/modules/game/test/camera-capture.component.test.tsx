import { fireEvent, render, screen } from '@testing-library/react';
import { createRef } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { CameraCapture } from '../components/camera-capture.component';

const baseProps = {
  title: 'Take a photo',
  previewLabel: 'Live camera preview',
  startingLabel: 'Starting the camera…',
  captureButton: 'Capture photo',
  cancelButton: 'Cancel',
  switchButton: 'Switch camera',
  mirrorButton: 'Mirror',
  isStarting: false,
  isMirrored: false,
  errorMessage: undefined,
  videoRef: createRef<HTMLVideoElement | null>(),
  onSwitchCamera: vi.fn(),
  onToggleMirror: vi.fn(),
  testId: 'camera-card',
};

describe('CameraCapture', () => {
  it('renders the live preview and both actions', () => {
    render(<CameraCapture {...baseProps} onCapture={vi.fn()} onCancel={vi.fn()} />);

    expect(screen.getByLabelText('Live camera preview')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Capture photo' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
  });

  it('invokes the capture and cancel handlers on click', () => {
    const onCapture = vi.fn();
    const onCancel = vi.fn();
    render(<CameraCapture {...baseProps} onCapture={onCapture} onCancel={onCancel} />);

    fireEvent.click(screen.getByRole('button', { name: 'Capture photo' }));
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(onCapture).toHaveBeenCalledTimes(1);
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('disables capture and shows the starting hint while the camera warms up', () => {
    render(<CameraCapture {...baseProps} isStarting onCapture={vi.fn()} onCancel={vi.fn()} />);

    expect(screen.getByText('Starting the camera…')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Capture photo' })).toBeDisabled();
  });

  it('surfaces the error message when the stream fails', () => {
    render(
      <CameraCapture
        {...baseProps}
        errorMessage="We could not open your camera."
        onCapture={vi.fn()}
        onCancel={vi.fn()}
      />,
    );

    expect(screen.getByText('We could not open your camera.')).toBeInTheDocument();
  });

  it('invokes the switch and mirror handlers on click', () => {
    const onSwitchCamera = vi.fn();
    const onToggleMirror = vi.fn();
    render(
      <CameraCapture
        {...baseProps}
        onCapture={vi.fn()}
        onCancel={vi.fn()}
        onSwitchCamera={onSwitchCamera}
        onToggleMirror={onToggleMirror}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Switch camera' }));
    fireEvent.click(screen.getByRole('button', { name: 'Mirror' }));

    expect(onSwitchCamera).toHaveBeenCalledTimes(1);
    expect(onToggleMirror).toHaveBeenCalledTimes(1);
  });

  it('marks the mirror control pressed when the preview is mirrored', () => {
    render(<CameraCapture {...baseProps} isMirrored onCapture={vi.fn()} onCancel={vi.fn()} />);

    expect(screen.getByRole('button', { name: 'Mirror', pressed: true })).toBeInTheDocument();
  });
});
