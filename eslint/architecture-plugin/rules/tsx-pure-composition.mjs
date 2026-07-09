import {
  isInFolder,
  isTestFile,
  normalizePath,
} from "../shared/path-utils.mjs";
import { BANNED_TSX_HOOKS } from "../shared/policy-utils.mjs";

/**
 * TSX component files are pure JSX composition:
 * - no React built-in hooks (state and effects live in hooks/ files)
 * - no fetch/XHR calls
 * - no nested ternaries (also enforced by core no-nested-ternary)
 *
 * Calling a feature controller hook (use*Controller) from a container
 * component is allowed — that is the documented wiring point.
 */
const SCOPED_FOLDERS = ["components", "features", "app"];

const isComponentFile = (filename) => {
  const normalized = normalizePath(filename);
  return (
    normalized.endsWith(".tsx") &&
    SCOPED_FOLDERS.some((folder) => isInFolder(normalized, folder))
  );
};

export default {
  meta: {
    type: "problem",
    docs: {
      description:
        "TSX files must stay pure composition — no built-in hooks, no fetch.",
    },
    schema: [],
    messages: {
      noBuiltinHook:
        '"{{hook}}" is not allowed in TSX. Move state/effects into a hook under hooks/.',
      noFetch:
        "Do not call fetch from TSX. Use the gateway through a service and hook.",
    },
  },
  create(context) {
    if (!isComponentFile(context.filename) || isTestFile(context.filename)) {
      return {};
    }

    return {
      CallExpression(node) {
        if (node.callee.type !== "Identifier") {
          return;
        }

        if (BANNED_TSX_HOOKS.includes(node.callee.name)) {
          context.report({
            node,
            messageId: "noBuiltinHook",
            data: { hook: node.callee.name },
          });
          return;
        }

        if (node.callee.name === "fetch") {
          context.report({ node, messageId: "noFetch" });
        }
      },
    };
  },
};
