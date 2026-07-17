import type { CameraFacingMode } from './camera.constants';
import { buildCameraConstraints } from './camera.constants';

/**
 * Thin wrapper around the browser camera stream APIs (getUserMedia), kept in
 * one place so components/hooks never touch the raw APIs and the whole thing is
 * easy to mock in tests. This is the ONLY place allowed to open a live camera
 * stream; the captured image never leaves the device except through the normal
 * analyze flow, and no stream is ever retained.
 */

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

/** Opens the requested camera (front/back); rejects when the browser cannot stream. */
export const requestCameraStream = async (facingMode: CameraFacingMode): Promise<MediaStream> => {
  if (!isCameraSupported()) {
    throw new Error('CAMERA_UNSUPPORTED');
  }
  return globalThis.navigator.mediaDevices.getUserMedia(buildCameraConstraints(facingMode));
};

/** Stops every track so the camera light turns off and the device is released. */
export const stopCameraStream = (stream?: MediaStream): void => {
  if (stream === undefined) {
    return;
  }
  for (const track of stream.getTracks()) {
    track.stop();
  }
};
