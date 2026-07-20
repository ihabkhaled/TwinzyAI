/** Props of the AdSense loader tag. */
export interface AdsenseScriptProps {
  /**
   * The per-request CSP nonce. Required in practice: the policy uses
   * `strict-dynamic`, so an un-nonced third-party tag is refused by the browser.
   */
  readonly nonce: string | undefined;
}
