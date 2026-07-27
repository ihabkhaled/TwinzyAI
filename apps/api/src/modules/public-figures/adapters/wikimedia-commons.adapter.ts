import { Injectable } from '@nestjs/common';

import type { PublicFigureImage } from '@twinzy/shared';
import { PublicFigureImageSchema } from '@twinzy/shared';

import { AppConfigService } from '../../../config/app-config.service';
import { fetchBoundedJson } from '../lib/bounded-json-fetch.util';
import { assertAllowedPublicFigureUrl } from '../lib/public-figure-url.util';
import { COMMONS_API_ORIGIN, COMMONS_API_PATH } from '../model/public-figure.constants';
import { CommonsImageInfoSchema } from '../model/public-figure-remote.schemas';

@Injectable()
export class WikimediaCommonsAdapter {
  public constructor(private readonly config: AppConfigService) {}

  public async image(fileName: string, alt: string): Promise<PublicFigureImage | undefined> {
    const url = this.buildUrl(fileName);
    const raw = await fetchBoundedJson(
      url,
      this.config.advancedMatching.requestTimeoutMs,
      this.config.advancedMatching.maxResponseBytes,
    );
    const root = raw as { query?: { pages?: Record<string, { imageinfo?: unknown[] }> } };
    const page = Object.values(root.query?.pages ?? {})[0];
    const parsed = CommonsImageInfoSchema.safeParse(page?.imageinfo?.[0]);
    if (!parsed.success) {
      return undefined;
    }
    const metadata = parsed.data.extmetadata;
    const license = metadata.LicenseShortName;
    if (license === undefined) {
      return undefined;
    }
    return PublicFigureImageSchema.parse({
      thumbnailUrl: assertAllowedPublicFigureUrl(parsed.data.thumburl),
      fullUrl: assertAllowedPublicFigureUrl(parsed.data.url),
      alt,
      author: metadata.Artist?.value,
      credit: metadata.Credit?.value,
      licenseName: license.value,
      licenseUrl:
        metadata.LicenseUrl === undefined
          ? undefined
          : assertAllowedPublicFigureUrl(metadata.LicenseUrl.value),
      sourcePageUrl: assertAllowedPublicFigureUrl(parsed.data.descriptionurl),
    });
  }

  private buildUrl(fileName: string): string {
    const url = new URL(COMMONS_API_PATH, COMMONS_API_ORIGIN);
    url.search = new URLSearchParams({
      action: 'query',
      format: 'json',
      iiprop: 'url|extmetadata',
      iiurlwidth: '320',
      origin: '*',
      prop: 'imageinfo',
      redirects: '1',
      titles: `File:${fileName}`,
    }).toString();
    return url.href;
  }
}
