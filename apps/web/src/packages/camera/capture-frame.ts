import { CAPTURE_FILENAME, CAPTURE_MIME, CAPTURE_QUALITY } from './camera.constants';

/**
 * Draws the current video frame to an off-screen canvas and returns it as a
 * JPEG File — structurally identical to an uploaded photo, so it flows through
 * the exact same client validation and backend security chain. Lives in the
 * camera package because it is the only other place allowed to touch the raw
 * canvas/document APIs.
 *
 * `isMirrored` flips the frame horizontally so the saved photo matches a
 * mirrored preview (WYSIWYG). `drawImage` ignores the CSS transform on the
 * <video>, so the flip is applied to the canvas here instead.
 */
export const captureFrameToFile = (video: HTMLVideoElement, isMirrored: boolean): Promise<File> =>
  new Promise<File>((resolve, reject): void => {
    const width = video.videoWidth;
    const height = video.videoHeight;
    if (width === 0 || height === 0) {
      reject(new Error('CAMERA_NOT_READY'));
      return;
    }

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d');
    if (context === null) {
      reject(new Error('CAMERA_CAPTURE_FAILED'));
      return;
    }

    if (isMirrored) {
      context.translate(width, 0);
      context.scale(-1, 1);
    }
    context.drawImage(video, 0, 0, width, height);
    canvas.toBlob(
      (blob): void => {
        if (blob === null) {
          reject(new Error('CAMERA_CAPTURE_FAILED'));
          return;
        }
        resolve(new File([blob], CAPTURE_FILENAME, { type: CAPTURE_MIME }));
      },
      CAPTURE_MIME,
      CAPTURE_QUALITY,
    );
  });
