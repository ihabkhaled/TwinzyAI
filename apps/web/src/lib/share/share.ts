export const ShareOutcome = {
  Shared: 'shared',
  Copied: 'copied',
  Failed: 'failed',
} as const;

export type ShareOutcomeValue = (typeof ShareOutcome)[keyof typeof ShareOutcome];

/**
 * Web Share API with clipboard fallback — the only wrapper around both
 * browser APIs. Only plain text ever leaves the app; never the photo,
 * never raw trait JSON.
 */
export const shareText = async (text: string): Promise<ShareOutcomeValue> => {
  if (typeof navigator.share === 'function') {
    try {
      await navigator.share({ text });
      return ShareOutcome.Shared;
    } catch {
      // fall through to clipboard
    }
  }

  try {
    await navigator.clipboard.writeText(text);
    return ShareOutcome.Copied;
  } catch {
    return ShareOutcome.Failed;
  }
};
