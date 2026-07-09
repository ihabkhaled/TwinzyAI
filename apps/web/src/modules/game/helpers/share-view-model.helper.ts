import type { TranslateMessage } from '../model/game.types';
import type { ShareCreateController } from '../model/share.types';
import type { ShareModalViewModel } from '../model/share-modal.types';

import { buildPlatformLinks } from './share-platform.helper';

/**
 * Assembles the fully-translated share-modal view model from the raw
 * create-share controller: resolves all copy, translates the error/copy-feedback
 * keys, and builds the encoded platform links from the created URL + share text.
 * The container just renders it.
 */
export const buildShareModalViewModel = (
  controller: ShareCreateController,
  shareText: string,
  translate: TranslateMessage,
): ShareModalViewModel => ({
  isOpen: controller.isOpen,
  isCreating: controller.isCreating,
  shareUrl: controller.shareUrl,
  canNativeShare: controller.canNativeShare,
  errorMessage: controller.errorKey === undefined ? undefined : translate(controller.errorKey),
  platformLinks:
    controller.shareUrl === undefined
      ? []
      : buildPlatformLinks({ url: controller.shareUrl, text: shareText }),
  labels: {
    title: translate('share.modalTitle'),
    description: translate('share.modalDescription'),
    creating: translate('share.creating'),
    copyLink: translate('share.copyLink'),
    nativeShare: translate('share.nativeShare'),
    platformsTitle: translate('share.platformsTitle'),
    close: translate('share.close'),
    createFailed: translate('share.createFailed'),
    copyFeedback:
      controller.copyFeedbackKey === undefined ? undefined : translate(controller.copyFeedbackKey),
  },
  onCopyLink: controller.copyLink,
  onNativeShare: controller.nativeShare,
  onClose: controller.close,
});
