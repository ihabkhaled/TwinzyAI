import { isInFolder, isTestFile } from '../shared/path-utils.mjs';
import { SDK_PACKAGES } from '../shared/policy-utils.mjs';
import { getImportSource } from '../shared/source-utils.mjs';

/**
 * Provider SDKs (Gemini etc.) may only be imported inside adapter files.
 * Everything else uses the adapter through its interface, so the provider
 * can be swapped and mocked in one place.
 */
export default {
  meta: {
    type: 'problem',
    docs: {
      description: 'Provider SDK imports are only allowed inside adapters.',
    },
    schema: [],
    messages: {
      noSdk:
        'Direct SDK import "{{source}}" is only allowed in adapters/. Inject the adapter instead.',
    },
  },
  create(context) {
    const filename = context.filename;

    if (isInFolder(filename, 'adapters') || isTestFile(filename)) {
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
        }
      },
    };
  },
};
