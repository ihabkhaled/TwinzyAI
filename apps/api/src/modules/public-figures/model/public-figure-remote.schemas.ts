import { z } from 'zod';

const localizedValueSchema = z.object({ language: z.string(), value: z.string() });
const sitelinkSchema = z.object({ title: z.string() });
const dataValueSchema = z.object({ value: z.string() });
const mainSnakSchema = z.object({ datavalue: dataValueSchema.optional() });
const claimValueSchema = z.object({
  mainsnak: mainSnakSchema,
});

export const WikidataEntitySchema = z.object({
  labels: z.record(z.string(), localizedValueSchema).default({}),
  descriptions: z.record(z.string(), localizedValueSchema).default({}),
  sitelinks: z.record(z.string(), sitelinkSchema).default({}),
  claims: z
    .object({
      P18: z.array(claimValueSchema).optional(),
    })
    .default({}),
});

const commonsMetadataValueSchema = z.object({ value: z.string() });
const wikipediaDesktopContentSchema = z.object({ page: z.url() });
const wikipediaContentUrlsSchema = z.object({
  desktop: wikipediaDesktopContentSchema,
});
export const WikipediaSummarySchema = z.object({
  extract: z.string(),
  content_urls: wikipediaContentUrlsSchema,
});

export const CommonsImageInfoSchema = z.object({
  url: z.url(),
  thumburl: z.url(),
  descriptionurl: z.url(),
  extmetadata: z
    .object({
      Artist: commonsMetadataValueSchema.optional(),
      Credit: commonsMetadataValueSchema.optional(),
      LicenseShortName: commonsMetadataValueSchema.optional(),
      LicenseUrl: commonsMetadataValueSchema.optional(),
    })
    .default({}),
});
