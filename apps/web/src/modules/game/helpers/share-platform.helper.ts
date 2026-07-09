import { SHARE_PLATFORM_LABEL_KEYS, SHARE_PLATFORM_ORDER } from '../model/share.constants';
import { SharePlatform, type SharePlatformValue } from '../model/share.enums';
import type { ShareLinkContent, SharePlatformLink } from '../model/share-modal.types';

/**
 * Builds one platform's web-intent href. Every dynamic segment is
 * URL-encoded, and the ONLY identifier in the URL is the temporary share link —
 * no photo, no private data, no raw query injection.
 */
const buildHref = (platform: SharePlatformValue, content: ShareLinkContent): string => {
  const url = encodeURIComponent(content.url);
  const text = encodeURIComponent(content.text);
  const textWithUrl = encodeURIComponent(`${content.text} ${content.url}`);

  switch (platform) {
    case SharePlatform.WhatsApp: {
      return `https://wa.me/?text=${textWithUrl}`;
    }
    case SharePlatform.Telegram: {
      return `https://t.me/share/url?url=${url}&text=${text}`;
    }
    case SharePlatform.Facebook: {
      return `https://www.facebook.com/sharer/sharer.php?u=${url}`;
    }
    case SharePlatform.X: {
      return `https://twitter.com/intent/tweet?text=${text}&url=${url}`;
    }
    case SharePlatform.LinkedIn: {
      return `https://www.linkedin.com/sharing/share-offsite/?url=${url}`;
    }
    case SharePlatform.Reddit: {
      return `https://www.reddit.com/submit?url=${url}&title=${text}`;
    }
    case SharePlatform.Email: {
      return `mailto:?subject=${text}&body=${textWithUrl}`;
    }
    default: {
      return content.url;
    }
  }
};

/** Builds the ordered, encoded fallback platform links for a share. */
export const buildPlatformLinks = (content: ShareLinkContent): SharePlatformLink[] =>
  SHARE_PLATFORM_ORDER.map((platform) => ({
    platform,
    labelKey: SHARE_PLATFORM_LABEL_KEYS[platform],
    href: buildHref(platform, content),
  }));
