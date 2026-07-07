/**
 * Camera wrapper configuration. Kept in one constants file so the getUserMedia
 * and canvas-capture modules never embed magic values inline.
 */

/** Rear-camera video constraints; audio is never requested. */
export const CAMERA_CONSTRAINTS: MediaStreamConstraints = {
  video: { facingMode: 'environment' },
  audio: false,
};

/** Captured frames are encoded as JPEG so they are identical to an upload. */
export const CAPTURE_MIME = 'image/jpeg';

/** JPEG quality for the captured frame (0–1). */
export const CAPTURE_QUALITY = 0.92;

/** Filename given to the in-memory captured photo File. */
export const CAPTURE_FILENAME = 'camera-photo.jpg';
