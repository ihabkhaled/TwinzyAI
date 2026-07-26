import type { LanguageCodeValue } from '@/packages/i18n';

export interface SitemapDocumentOptions {
  baseUrl: string;
  locale: LanguageCodeValue;
  lastModified: Date;
}

export interface RssMessages {
  app: {
    name: string;
    subtitle: string;
  };
  nav: Record<string, string>;
  home: {
    metaDescription: string;
  };
}

export interface RssDocumentOptions {
  baseUrl: string;
  locale: LanguageCodeValue;
  messages: RssMessages;
  publishedAt: Date;
}
