/**
 * YAML loading for authored knowledge definitions and document frontmatter.
 *
 * Wraps the `yaml` package (the repository's single YAML entrypoint per the
 * library-wrapping rule) so the rest of the compiler never imports the vendor
 * API directly.
 */
import YAML from 'yaml';

import { fileExists, readText } from './fs-walk.mjs';
import { splitFrontmatter } from './markdown.mjs';

const parseYaml = (text) => YAML.parse(text);

export const loadYamlFile = (relPath) => parseYaml(readText(relPath));

export const loadYamlFileOptional = (relPath, fallback) =>
  fileExists(relPath) ? loadYamlFile(relPath) : fallback;

/**
 * Parse a Markdown document's frontmatter.
 *
 * @returns {{ frontmatter: Record<string, unknown> | null, body: string }}
 *   `frontmatter: null` when the document has none or it fails to parse
 *   (parse failures are reported by `validate-frontmatter`, not thrown here).
 */
export const parseDocumentFrontmatter = (text) => {
  const { frontmatterText, body } = splitFrontmatter(text);
  if (frontmatterText === null) {
    return { frontmatter: null, body };
  }
  try {
    const parsed = parseYaml(frontmatterText);
    const isRecord = typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed);
    return { frontmatter: isRecord ? parsed : null, body };
  } catch {
    return { frontmatter: null, body };
  }
};
