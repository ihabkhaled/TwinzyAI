/**
 * Camera wrapper configuration. Kept in one constants file so the getUserMedia
 * and canvas-capture modules never embed magic values inline.
 */

/**
 * The two logical cameras. `environment` is the rear (default) camera and
 * `user` is the front/selfie camera — the standard getUserMedia `facingMode`
 * values, so switching never needs to enumerate device ids.
 */
export const CAMERA_FACING_MODES = {
  Front: 'user',
  Back: 'environment',
} as const;

export type CameraFacingMode = (typeof CAMERA_FACING_MODES)[keyof typeof CAMERA_FACING_MODES];

/** Opens the rear camera first (matches the previous single-camera behaviour). */
export const DEFAULT_CAMERA_FACING_MODE: CameraFacingMode = CAMERA_FACING_MODES.Back;

/** Video constraints for one facing mode; audio is never requested. */
export const buildCameraConstraints = (facingMode: CameraFacingMode): MediaStreamConstraints => ({
  video: { facingMode },
  audio: false,
});

/** Captured frames are encoded as JPEG so they are identical to an upload. */
export const CAPTURE_MIME = 'image/jpeg';

/** JPEG quality for the captured frame (0–1). */
export const CAPTURE_QUALITY = 0.92;

/** Filename given to the in-memory captured photo File. */
export const CAPTURE_FILENAME = 'camera-photo.jpg';
