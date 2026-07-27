import type { PublicFigureProfile } from '@twinzy/shared';

const OVAL_FACE_TAG = 'oval face';
const SHORT_BEARD_TAG = 'short beard';

/**
 * Reviewable, text-only seed catalog. Entity IDs and identity metadata are
 * anchored to Wikidata; qualitative appearance/style tags are curated game
 * descriptors, never biometric templates or image-derived measurements.
 */
export const VERIFIED_PUBLIC_FIGURE_CATALOG = [
  {
    entityId: 'Q170515',
    canonicalName: 'Omar Sharif',
    aliases: ['Omar el-Sherief', 'Omar Cherif'],
    localizedNames: { ar: 'عمر الشريف', en: 'Omar Sharif' },
    countryOrRegion: 'Egypt',
    publicCategories: ['actor'],
    stableAppearanceTags: [OVAL_FACE_TAG, 'prominent brows', 'deep-set eyes'],
    mutableStyleTags: ['dark wavy hair', 'mustache', 'formal tailoring'],
    presentationTags: ['warm smile', 'composed expression'],
    signatureLooks: [
      {
        label: 'classic cinema',
        stableTags: [OVAL_FACE_TAG, 'prominent brows'],
        mutableStyleTags: ['dark wavy hair', 'mustache'],
        facialHairStyle: 'mustache',
        hairstyle: 'dark wavy hair',
      },
    ],
    sourceReferences: [
      {
        source: 'wikidata',
        sourceId: 'Q170515',
        url: 'https://www.wikidata.org/wiki/Q170515',
      },
    ],
  },
  {
    entityId: 'Q1354960',
    canonicalName: 'Mohamed Salah',
    aliases: ['Mohammed Salah'],
    localizedNames: { ar: 'محمد صلاح', en: 'Mohamed Salah' },
    countryOrRegion: 'Egypt',
    publicCategories: ['footballer'],
    stableAppearanceTags: [OVAL_FACE_TAG, 'strong brows', 'dark eyes'],
    mutableStyleTags: ['curly dark hair', SHORT_BEARD_TAG, 'sportswear'],
    presentationTags: ['broad smile', 'energetic presentation'],
    signatureLooks: [
      {
        label: 'sporting',
        stableTags: [OVAL_FACE_TAG, 'strong brows'],
        mutableStyleTags: ['curly dark hair', SHORT_BEARD_TAG],
        facialHairStyle: SHORT_BEARD_TAG,
        hairstyle: 'curly dark hair',
      },
    ],
    sourceReferences: [
      {
        source: 'wikidata',
        sourceId: 'Q1354960',
        url: 'https://www.wikidata.org/wiki/Q1354960',
      },
    ],
  },
  {
    entityId: 'Q2732233',
    canonicalName: 'Yousra',
    aliases: ['Yosra'],
    localizedNames: { ar: 'يسرا', en: 'Yousra' },
    countryOrRegion: 'Egypt',
    publicCategories: ['actor', 'singer'],
    stableAppearanceTags: [OVAL_FACE_TAG, 'defined cheekbones', 'dark eyes'],
    mutableStyleTags: ['shoulder-length hair', 'formal fashion'],
    presentationTags: ['bright smile', 'polished presentation'],
    signatureLooks: [
      {
        label: 'formal',
        stableTags: [OVAL_FACE_TAG, 'defined cheekbones'],
        mutableStyleTags: ['shoulder-length hair', 'formal fashion'],
        hairstyle: 'shoulder-length hair',
      },
    ],
    sourceReferences: [
      {
        source: 'wikidata',
        sourceId: 'Q2732233',
        url: 'https://www.wikidata.org/wiki/Q2732233',
      },
    ],
  },
  {
    entityId: 'Q432780',
    canonicalName: 'Hend Sabry',
    aliases: ['Hend Sabri'],
    localizedNames: { ar: 'هند صبري', en: 'Hend Sabry' },
    countryOrRegion: 'Tunisia / Egypt',
    publicCategories: ['actor'],
    stableAppearanceTags: [OVAL_FACE_TAG, 'defined brows', 'dark eyes'],
    mutableStyleTags: ['dark straight hair', 'contemporary fashion'],
    presentationTags: ['warm smile', 'expressive presentation'],
    signatureLooks: [
      {
        label: 'contemporary',
        stableTags: [OVAL_FACE_TAG, 'defined brows'],
        mutableStyleTags: ['dark straight hair', 'contemporary fashion'],
        hairstyle: 'dark straight hair',
      },
    ],
    sourceReferences: [
      {
        source: 'wikidata',
        sourceId: 'Q432780',
        url: 'https://www.wikidata.org/wiki/Q432780',
      },
    ],
  },
  {
    entityId: 'Q43416',
    canonicalName: 'Keanu Reeves',
    aliases: ['Keanu Charles Reeves'],
    localizedNames: { ar: 'كيانو ريفز', en: 'Keanu Reeves' },
    countryOrRegion: 'Canada',
    publicCategories: ['actor', 'musician'],
    stableAppearanceTags: ['long face', 'deep-set eyes', 'straight brows'],
    mutableStyleTags: ['long dark hair', SHORT_BEARD_TAG, 'dark tailoring'],
    presentationTags: ['reserved expression', 'gentle smile'],
    signatureLooks: [
      {
        label: 'modern',
        stableTags: ['long face', 'deep-set eyes'],
        mutableStyleTags: ['long dark hair', SHORT_BEARD_TAG],
        facialHairStyle: SHORT_BEARD_TAG,
        hairstyle: 'long dark hair',
      },
    ],
    sourceReferences: [
      {
        source: 'wikidata',
        sourceId: 'Q43416',
        url: 'https://www.wikidata.org/wiki/Q43416',
      },
    ],
  },
  {
    entityId: 'Q200534',
    canonicalName: 'Tilda Swinton',
    aliases: ['Katherine Matilda Swinton'],
    localizedNames: { ar: 'تيلدا سوينتون', en: 'Tilda Swinton' },
    countryOrRegion: 'United Kingdom',
    publicCategories: ['actor'],
    stableAppearanceTags: ['long face', 'high cheekbones', 'light brows'],
    mutableStyleTags: ['short light hair', 'minimal styling', 'tailoring'],
    presentationTags: ['composed expression', 'editorial presentation'],
    signatureLooks: [
      {
        label: 'editorial',
        stableTags: ['long face', 'high cheekbones'],
        mutableStyleTags: ['short light hair', 'minimal styling'],
        hairstyle: 'short light hair',
      },
    ],
    sourceReferences: [
      {
        source: 'wikidata',
        sourceId: 'Q200534',
        url: 'https://www.wikidata.org/wiki/Q200534',
      },
    ],
  },
] as const satisfies readonly PublicFigureProfile[];
