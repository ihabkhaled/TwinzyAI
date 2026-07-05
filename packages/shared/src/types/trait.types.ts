import type { TRAIT_KEYS } from '../constants/trait.constants';

export type TraitKey = (typeof TRAIT_KEYS)[number];

export type TraitMap = Record<TraitKey, string>;
