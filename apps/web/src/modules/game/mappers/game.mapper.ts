import type { FinalGameResult, FinalResultItem, TraitCategoryKey, Traits } from '@twinzy/shared';
import { TRAIT_CATEGORY_FIELDS, UNCERTAINTY_NOTE_FIELDS } from '@twinzy/shared';

import {
  buildShareText,
  resolveCategoryLabel,
  resolveConfidenceLabel,
  resolveTraitCategoryTitle,
  resolveTraitFieldLabel,
  resolveUncertaintyLabel,
  resolveVerdictLabel,
} from '../helpers/game-display.helper';
import type {
  GameResultView,
  ResultView,
  TraitCategoryView,
  TraitFieldView,
  TranslateMessage,
  UncertaintyGroupView,
} from '../model/game.types';

/** Shape one category's fields into translated, display-ready rows (in order). */
const toCategoryFields = (
  traits: Traits,
  category: TraitCategoryKey,
  translate: TranslateMessage,
): TraitFieldView[] => {
  const values = traits[category];
  return TRAIT_CATEGORY_FIELDS[category].map((field) => ({
    key: field,
    label: resolveTraitFieldLabel(translate, category, field),
    value: values[field] ?? '',
  }));
};

/** All detail categories for the accordion — imageQuality gets its own section. */
const toCategoryViews = (traits: Traits, translate: TranslateMessage): TraitCategoryView[] =>
  (Object.keys(TRAIT_CATEGORY_FIELDS) as TraitCategoryKey[])
    .filter((category) => category !== 'imageQuality')
    .map((category) => ({
      key: category,
      title: resolveTraitCategoryTitle(translate, category),
      fields: toCategoryFields(traits, category, translate),
    }));

/** Non-empty uncertainty-notes groups with translated labels. */
const toUncertaintyGroups = (traits: Traits, translate: TranslateMessage): UncertaintyGroupView[] =>
  UNCERTAINTY_NOTE_FIELDS.map((field) => ({
    key: field,
    label: resolveUncertaintyLabel(translate, field),
    notes: [...traits.uncertaintyNotes[field]],
  })).filter((group) => group.notes.length > 0);

/** Shape one backend match into its translated, display-ready view. */
const toResultView = (item: FinalResultItem, translate: TranslateMessage): ResultView => ({
  name: item.name,
  rank: item.rank,
  scorePercent: item.finalStyleVibeFitScore,
  verdictLabel: resolveVerdictLabel(translate, item.verdict),
  confidenceLabel: resolveConfidenceLabel(translate, item.confidenceLevel),
  countryOrRegion: item.countryOrRegion,
  categoryLabel: resolveCategoryLabel(translate, item.publicCategory),
  reason: item.finalReason,
  topMatchingTraits: item.topMatchingTraits,
  secondaryMatchingTraits: item.secondaryMatchingTraits,
  weakOrUncertainTraits: item.weakOrUncertainTraits,
  mismatchWarnings: item.mismatchWarnings,
});

/**
 * Map the backend DTO to the view model — the UI never sees the raw DTO.
 * Translations are injected so this stays a pure function (no i18n hook).
 */
export const mapFinalResultToView = (
  result: FinalGameResult,
  translate: TranslateMessage,
): GameResultView => {
  const results: ResultView[] = result.results.map((item) => toResultView(item, translate));

  return {
    traitCount: result.traitCount,
    compactTraitSummary: [...result.compactTraitSummary],
    categories: toCategoryViews(result.traits, translate),
    imageQuality: toCategoryFields(result.traits, 'imageQuality', translate),
    uncertainty: toUncertaintyGroups(result.traits, translate),
    results,
    fallbackMessage: result.fallbackMessage,
    disclaimer: result.disclaimer,
    hasResults: results.length > 0,
    shareText: buildShareText(results, translate),
  };
};
