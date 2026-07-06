/**
 * Verdict returned by the ClamAV adapter's INSTREAM scan. `clean` is the
 * only field the virus-scan policy reads; `signature` carries the raw clamd
 * response for diagnostics when a scan is not clean.
 */
export interface ClamAvScanResult {
  clean: boolean;
  signature?: string;
}
