/**
 * Shared style recipes for the static content routes (help, privacy, terms,
 * not-found). Route files compose these named classes instead of embedding raw
 * className strings, keeping the visual language reviewable in one place.
 */
export const contentTitleClass = 'mb-2 text-3xl font-bold';

export const contentLeadClass = 'text-muted-foreground';

export const contentListClass = 'list-disc space-y-3 ps-5 text-muted-foreground';

export const contentDefinitionListClass = 'space-y-5';

export const contentTermClass = 'font-semibold';

export const contentDescriptionClass = 'mt-1 text-muted-foreground';

/** One editorial section: an h2 plus one or two body paragraphs. */
export const contentSectionClass = 'space-y-2';

export const contentSectionTitleClass = 'text-xl font-semibold';

export const contentBodyClass = 'leading-relaxed text-muted-foreground';

/** Wrapper for the editorial sections appended below the landing hero. */
export const homeSectionsClass = 'mt-12';
