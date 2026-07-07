/**
 * Thin wrapper around the browser camera APIs (getUserMedia + canvas capture),
 * kept in one place so components/hooks never touch the raw APIs and the whole
 * thing is easy to mock in tests. The captured image never leaves the device
 * except through the normal analyze flow, and no stream is ever retained.
 */

export const CAMERA_CONSTRAINTS: MediaStreamConstraints = {
  video: { facingMode: 'environment' },
  audio: false,
};

const CAPTURE_MIME = 'image/jpeg';

const CAPTURE_QUALITY = 0.92;

const CAPTURE_FILENAME = 'camera-photo.jpg';

/**
 * True when this browser can open a live camera stream. The DOM lib types
 * navigator/mediaDevices as always-present, but they are absent under SSR and
 * in insecure contexts — so we widen to a nullable type to make the runtime
 * guard legitimate rather than a "provably unnecessary" check.
 */
export const isCameraSupported = (): boolean => {
  const mediaDevices = (globalThis.navigator as Navigator | undefined)?.mediaDevices;
  return typeof mediaDevices?.getUserMedia === 'function';
};

export const requestCameraStream = async (): Promise<MediaStream> => {
  if (!isCameraSupported()) {
    throw new Error('CAMERA_UNSUPPORTED');
  }
  return globalThis.navigator.mediaDevices.getUserMedia(CAMERA_CONSTRAINTS);
};

/** Stops every track so the camera light turns off and the device is released. */
export const stopCameraStream = (stream: MediaStream | undefined): void => {
  if (stream === undefined) {
    return;
  }
  for (const track of stream.getTracks()) {
    track.stop();
  }
};

/**
 * Draws the current video frame to an off-screen canvas and returns it as a
 * JPEG File — structurally identical to an uploaded photo, so it flows through
 * the exact same client validation and backend security chain.
 */
export const captureFrameToFile = (video: HTMLVideoElement): Promise<File> =>
  new Promise<File>((resolve, reject) => {
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

    context.drawImage(video, 0, 0, width, height);
    canvas.toBlob(
      (blob) => {
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
