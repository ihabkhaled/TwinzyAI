import { UNCLEAR_TRAIT_VALUE_MARKERS } from '../constants/trait.constants';

const isObservedTraitValue = (value: unknown): boolean => {
  if (typeof value !== 'string') {
    return false;
  }
  const normalized = value.trim().toLocaleLowerCase();
  return (
    normalized.length > 0 &&
    UNCLEAR_TRAIT_VALUE_MARKERS.every((marker) => !normalized.startsWith(marker))
  );
};

/** Count observed trait fields, excluding uncertainty notes and unclear markers. */
export const countPopulatedTraitFields = (traits: Record<string, unknown>): number =>
  Object.entries(traits).reduce((count, [key, value]) => {
    if (key === 'uncertaintyNotes' || typeof value !== 'object' || value === null) {
      return count;
    }
    return (
      count +
      Object.values(value as Record<string, unknown>).filter((fieldValue) =>
        isObservedTraitValue(fieldValue),
      ).length
    );
  }, 0);
