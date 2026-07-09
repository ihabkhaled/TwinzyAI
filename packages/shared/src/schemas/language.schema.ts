import { z } from 'zod';

import { LANGUAGE_CODES } from '../constants/language.constants';

/** Strict supported-language-code schema (`en` | `ar`). */
export const LanguageCodeSchema = z.enum(LANGUAGE_CODES);
