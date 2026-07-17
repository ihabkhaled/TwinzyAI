/** Class bundles for the live-camera capture card. */
export const cameraTitleClass = 'mb-2 text-base font-semibold text-foreground';

export const cameraStageClass = 'overflow-hidden rounded-xl bg-black';

export const cameraVideoClass = 'mx-auto max-h-72 w-full object-contain';

/** Horizontal flip for the preview when the mirror toggle is on. */
export const cameraVideoMirroredClass = '-scale-x-100';

/** Preview class with the mirror flip appended when mirrored (keeps JSX logic-free). */
export const resolveCameraVideoClass = (isMirrored: boolean): string =>
  isMirrored ? `${cameraVideoClass} ${cameraVideoMirroredClass}` : cameraVideoClass;

export const cameraStartingClass = 'mt-2 text-sm text-muted-foreground';

export const cameraErrorClass = 'mt-3';

/** Row of camera controls (switch front/back, mirror) above the capture actions. */
export const cameraControlsClass = 'mt-3 flex flex-wrap gap-2';

export const cameraActionsClass = 'mt-4 flex flex-wrap gap-3';
