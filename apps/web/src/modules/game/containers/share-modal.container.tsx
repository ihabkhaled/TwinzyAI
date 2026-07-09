'use client';
// client-boundary-reason: renders a role="dialog" modal with Escape-to-close plus copy-link and native-share actions, all browser interactions.

import type { ReactElement } from 'react';

import { Alert, Button, Input, Spinner, Stack } from '@/packages/ui-primitives';
import { TEST_IDS } from '@/shared/constants/test-ids.constants';
import { useEscapeKey } from '@/shared/hooks/useEscapeKey.hook';

import { SHARE_MODAL_TITLE_ID } from '../model/share.constants';
import type { ShareModalProps } from '../model/share-modal.types';

import {
  modalBackdropClass,
  modalCardClass,
  modalDescriptionClass,
  modalHeaderClass,
  modalTitleClass,
} from './share-modal.variants';
import { SharePlatformLinks } from './share-platform-links.container';

/** The "link ready" state: copy field + copy/native buttons + platform links. */
const renderReadyState = (props: ShareModalProps, shareUrl: string): ReactElement => (
  <Stack gap="md">
    <Input
      readOnly
      value={shareUrl}
      aria-label={props.labels.copyLink}
      testId={TEST_IDS.shareLinkInput}
    />
    <Stack direction="row" gap="sm" wrap="wrap">
      <Button onClick={props.onCopyLink} testId={TEST_IDS.copyLinkButton}>
        {props.labels.copyLink}
      </Button>
      {props.canNativeShare ? (
        <Button
          variant="secondary"
          onClick={props.onNativeShare}
          testId={TEST_IDS.nativeShareButton}
        >
          {props.labels.nativeShare}
        </Button>
      ) : null}
    </Stack>
    {props.labels.copyFeedback === undefined ? null : (
      <p role="status" className={modalDescriptionClass}>
        {props.labels.copyFeedback}
      </p>
    )}
    <SharePlatformLinks title={props.labels.platformsTitle} links={props.platformLinks} />
  </Stack>
);

/** The modal body switches on create state: loading, failure, or ready. */
const renderBody = (props: ShareModalProps): ReactElement => {
  if (props.isCreating) {
    return (
      <Stack direction="row" gap="sm" align="center">
        <Spinner label={props.labels.creating} />
        <span className={modalDescriptionClass}>{props.labels.creating}</span>
      </Stack>
    );
  }
  if (props.errorMessage !== undefined) {
    return <Alert tone="danger">{props.errorMessage}</Alert>;
  }
  if (props.shareUrl !== undefined) {
    return renderReadyState(props, props.shareUrl);
  }
  return <Spinner label={props.labels.creating} />;
};

/**
 * Temporary-link share modal. Creating the link never re-sends the image — it
 * posts only the existing result. Closes on the × button or Escape; the copy
 * field is read-only and the platform buttons carry only the safe URL.
 */
export const ShareModal = (props: Readonly<ShareModalProps>): ReactElement => {
  // Escape-to-close via a window listener rather than a keydown on the
  // non-interactive dialog element.
  useEscapeKey(props.onClose);

  return (
    <div className={modalBackdropClass}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={SHARE_MODAL_TITLE_ID}
        className={modalCardClass}
        data-testid={TEST_IDS.shareModal}
      >
        <Stack gap="md">
          <div className={modalHeaderClass}>
            <h2 id={SHARE_MODAL_TITLE_ID} className={modalTitleClass}>
              {props.labels.title}
            </h2>
            <Button
              variant="ghost"
              onClick={props.onClose}
              aria-label={props.labels.close}
              testId={TEST_IDS.closeShareModal}
            >
              ✕
            </Button>
          </div>
          <p className={modalDescriptionClass}>{props.labels.description}</p>
          {renderBody(props)}
        </Stack>
      </div>
    </div>
  );
};
