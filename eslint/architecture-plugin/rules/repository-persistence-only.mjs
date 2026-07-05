import { isApiFile, isInFolder, isTestFile } from '../shared/path-utils.mjs';
import { SDK_PACKAGES } from '../shared/policy-utils.mjs';
import { getImportSource, importTargetsFolder } from '../shared/source-utils.mjs';

/**
 * Repositories persist data and nothing else. They must not import
 * services, managers, controllers, adapters, or provider SDKs, and must
 * not make AI or file-security decisions.
 */
const FORBIDDEN_FOLDERS = ['services', 'managers', 'controllers', 'adapters'];

export default {
  meta: {
    type: 'problem',
    docs: {
      description: 'Repositories may only persist — no upward imports, no SDKs.',
    },
    schema: [],
    messages: {
      noUpwardImport: 'Repositories must not import from "{{folder}}". Persistence only.',
      noSdk: 'Repositories must never import the provider SDK "{{source}}".',
    },
  },
  create(context) {
    const filename = context.filename;

    if (!isApiFile(filename) || !isInFolder(filename, 'repositories') || isTestFile(filename)) {
      return {};
    }

    return {
      ImportDeclaration(node) {
        const source = getImportSource(node);
        if (source === undefined) {
          return;
        }

        if (SDK_PACKAGES.some((sdk) => source === sdk || source.startsWith(`${sdk}/`))) {
          context.report({ node, messageId: 'noSdk', data: { source } });
          return;
        }

        for (const folder of FORBIDDEN_FOLDERS) {
          if (importTargetsFolder(filename, source, folder)) {
            context.report({ node, messageId: 'noUpwardImport', data: { folder } });
          }
        }
      },
    };
  },
};
