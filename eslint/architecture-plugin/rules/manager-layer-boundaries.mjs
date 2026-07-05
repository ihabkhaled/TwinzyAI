import { isApiFile, isInFolder } from '../shared/path-utils.mjs';
import { SDK_PACKAGES } from '../shared/policy-utils.mjs';
import { getImportSource, importTargetsFolder } from '../shared/source-utils.mjs';

/**
 * Managers orchestrate use cases through services. They must not reach
 * around the service layer into repositories or adapters, and must never
 * import provider SDKs directly.
 */
export default {
  meta: {
    type: 'problem',
    docs: {
      description: 'Managers may only coordinate services — no repositories, adapters, or SDKs.',
    },
    schema: [],
    messages: {
      noRepository: 'Managers must not import repositories. Go through a service.',
      noAdapter: 'Managers must not import adapters directly. Go through a service.',
      noSdk: 'Managers must never import the provider SDK "{{source}}". Use the adapter via a service.',
    },
  },
  create(context) {
    if (!isApiFile(context.filename) || !isInFolder(context.filename, 'managers')) {
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

        if (importTargetsFolder(context.filename, source, 'repositories')) {
          context.report({ node, messageId: 'noRepository' });
        }

        if (importTargetsFolder(context.filename, source, 'adapters')) {
          context.report({ node, messageId: 'noAdapter' });
        }
      },
    };
  },
};
