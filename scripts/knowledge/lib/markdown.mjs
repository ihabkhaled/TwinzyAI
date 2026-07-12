/**
 * Minimal Markdown structure extraction for the document scanner.
 *
 * Extracts only what routing needs: frontmatter block, title, headings, and
 * relative links. This is intentionally not a full Markdown parser.
 */
const FRONTMATTER_OPEN = '---';

/** Split `---` frontmatter from the body. Returns `frontmatterText: null` when absent. */
export const splitFrontmatter = (text) => {
  const normalized = text.replaceAll('\r\n', '\n');
  if (!normalized.startsWith(`${FRONTMATTER_OPEN}\n`)) {
    return { frontmatterText: null, body: normalized };
  }
  const closeIndex = normalized.indexOf(`\n${FRONTMATTER_OPEN}\n`, FRONTMATTER_OPEN.length);
  if (closeIndex === -1) {
    return { frontmatterText: null, body: normalized };
  }
  return {
    frontmatterText: normalized.slice(FRONTMATTER_OPEN.length + 1, closeIndex),
    body: normalized.slice(closeIndex + FRONTMATTER_OPEN.length + 2),
  };
};

const HEADING_PATTERN = /^(#{1,6})\s+(\S.*)$/;

export const extractHeadings = (body) => {
  const headings = [];
  let isInCodeFence = false;
  for (const line of body.split('\n')) {
    if (line.startsWith('```')) {
      isInCodeFence = !isInCodeFence;
      continue;
    }
    if (isInCodeFence) {
      continue;
    }
    const match = HEADING_PATTERN.exec(line);
    if (match !== null && match[1] !== undefined && match[2] !== undefined) {
      headings.push({ depth: match[1].length, text: match[2].trim() });
    }
  }
  return headings;
};

export const extractTitle = (body) => {
  const first = extractHeadings(body).find((heading) => heading.depth === 1);
  return first === undefined ? null : first.text;
};

const LINK_PATTERN = /\[[^\]]*\]\(([^()\s]+)(?:\s+"[^"]*")?\)/g;

/** All link targets in the body (deduplicated, sorted), excluding external URLs and anchors. */
export const extractRelativeLinkTargets = (body) => {
  const targets = new Set();
  for (const match of body.matchAll(LINK_PATTERN)) {
    const target = match[1];
    if (target === undefined || target.startsWith('#') || target.includes('://')) {
      continue;
    }
    if (target.startsWith('mailto:')) {
      continue;
    }
    targets.add(target.split('#', 1)[0]);
  }
  return [...targets].filter((target) => target !== '').toSorted((a, b) => a.localeCompare(b));
};
