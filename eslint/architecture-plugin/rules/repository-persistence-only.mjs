import { isRepositoryLayerFile, isTestFile } from "../shared/path-utils.mjs";
import { SDK_PACKAGES } from "../shared/policy-utils.mjs";
import {
  getImportSource,
  importTargetsModuleFolder,
} from "../shared/source-utils.mjs";

/**
 * Repositories persist data and nothing else. They must not import the HTTP
 * boundary (api/), the application layer, or adapters, and must never import
 * provider SDKs.
 *
 * Targeting: apps/api files inside an infrastructure/ folder or ending in
 * .repository.ts — suffix-based so it holds during the folder migration.
 */
const FORBIDDEN_FOLDERS = ["api", "application", "adapters"];

export default {
  meta: {
    type: "problem",
    docs: {
      description:
        "Repositories may only persist — no upward imports, no SDKs.",
    },
    schema: [],
    messages: {
      noUpwardImport:
        'Repositories must not import from "{{folder}}". Persistence only.',
      noSdk: 'Repositories must never import the provider SDK "{{source}}".',
    },
  },
  create(context) {
    const filename = context.filename;

    if (!isRepositoryLayerFile(filename) || isTestFile(filename)) {
      return {};
    }

    return {
      ImportDeclaration(node) {
        const source = getImportSource(node);
        if (source === undefined) {
          return;
        }

        if (
          SDK_PACKAGES.some(
            (sdk) => source === sdk || source.startsWith(`${sdk}/`),
          )
        ) {
          context.report({ node, messageId: "noSdk", data: { source } });
          return;
        }

        for (const folder of FORBIDDEN_FOLDERS) {
          if (importTargetsModuleFolder(filename, source, folder)) {
            context.report({
              node,
              messageId: "noUpwardImport",
              data: { folder },
            });
          }
        }
      },
    };
  },
};
