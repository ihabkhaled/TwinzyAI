import type { Route } from 'next';

/**
 * Each guide slug is declared once here and referenced everywhere else in this
 * file, so the catalog, namespace map, and related-guide graph can never drift
 * from a typo'd literal.
 */
const BEST_PHOTO = 'best-photo' as const;
const LIGHTING = 'lighting' as const;
const CAMERA_ANGLES = 'camera-angles' as const;
const SIMILARITY_SCORES = 'similarity-scores' as const;
const AI_VS_FACE_RECOGNITION = 'ai-vs-face-recognition' as const;
const HAIRSTYLES_FACE_SHAPE = 'hairstyles-face-shape' as const;
const GLASSES_FACE_SHAPE = 'glasses-face-shape' as const;
const WEAK_RESULTS_CHECKLIST = 'weak-results-checklist' as const;

/**
 * The Guides catalog: one entry per long-form educational article. The slug is
 * both the URL segment and the key into the `guides` i18n namespace (camelCase),
 * so adding a guide is one slug here plus its content in every locale file.
 */
export const GUIDE_SLUGS = [
  BEST_PHOTO,
  LIGHTING,
  CAMERA_ANGLES,
  SIMILARITY_SCORES,
  AI_VS_FACE_RECOGNITION,
  HAIRSTYLES_FACE_SHAPE,
  GLASSES_FACE_SHAPE,
  WEAK_RESULTS_CHECKLIST,
] as const;

export type GuideSlug = (typeof GUIDE_SLUGS)[number];

/** Guide slug -> its key under the `guides` messages namespace. */
export const GUIDE_NAMESPACE_BY_SLUG: Readonly<Record<GuideSlug, string>> = {
  [BEST_PHOTO]: 'bestPhoto',
  [LIGHTING]: 'lighting',
  [CAMERA_ANGLES]: 'cameraAngles',
  [SIMILARITY_SCORES]: 'similarityScores',
  [AI_VS_FACE_RECOGNITION]: 'aiVsFaceRecognition',
  [HAIRSTYLES_FACE_SHAPE]: 'hairstylesFaceShape',
  [GLASSES_FACE_SHAPE]: 'glassesFaceShape',
  [WEAK_RESULTS_CHECKLIST]: 'weakResultsChecklist',
};

/** Body section keys shared by every guide, matching the site's `Title`/`Body1`/`Body2` editorial template. */
export const GUIDE_SECTION_KEYS = ['section1', 'section2', 'section3', 'section4'] as const;

/** Numbered checklist/key-takeaway bullets shown near the top of every guide. */
export const GUIDE_TIP_NUMBERS = [1, 2, 3, 4] as const;

/** Two to three related guides per guide, for the "keep reading" cross-links. Never includes itself. */
export const RELATED_GUIDE_SLUGS: Readonly<Record<GuideSlug, readonly GuideSlug[]>> = {
  [BEST_PHOTO]: [LIGHTING, CAMERA_ANGLES, WEAK_RESULTS_CHECKLIST],
  [LIGHTING]: [BEST_PHOTO, CAMERA_ANGLES, WEAK_RESULTS_CHECKLIST],
  [CAMERA_ANGLES]: [BEST_PHOTO, LIGHTING, SIMILARITY_SCORES],
  [SIMILARITY_SCORES]: [AI_VS_FACE_RECOGNITION, WEAK_RESULTS_CHECKLIST, BEST_PHOTO],
  [AI_VS_FACE_RECOGNITION]: [SIMILARITY_SCORES, WEAK_RESULTS_CHECKLIST, HAIRSTYLES_FACE_SHAPE],
  [HAIRSTYLES_FACE_SHAPE]: [GLASSES_FACE_SHAPE, BEST_PHOTO, SIMILARITY_SCORES],
  [GLASSES_FACE_SHAPE]: [HAIRSTYLES_FACE_SHAPE, BEST_PHOTO, SIMILARITY_SCORES],
  [WEAK_RESULTS_CHECKLIST]: [BEST_PHOTO, LIGHTING, CAMERA_ANGLES],
};

/** The three guides featured in the homepage's "learn more" teaser section. */
export const HOME_FEATURED_GUIDE_SLUGS: readonly GuideSlug[] = [
  BEST_PHOTO,
  SIMILARITY_SCORES,
  AI_VS_FACE_RECOGNITION,
];

/** True for any string that is actually one of the guide catalog's slugs. */
export const isGuideSlug = (value: string): value is GuideSlug =>
  (GUIDE_SLUGS as readonly string[]).includes(value);

/** Build the route for one guide's detail page. */
export const buildGuidePath = (slug: GuideSlug): Route => `/guides/${slug}` as Route;
