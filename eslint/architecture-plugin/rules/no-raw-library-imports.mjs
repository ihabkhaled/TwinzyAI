import { isInFolder, isTestFile } from "../shared/path-utils.mjs";
import {
  RAW_HTTP_PACKAGES,
  WRAPPED_LIBRARIES,
} from "../shared/policy-utils.mjs";
import { getImportSource } from "../shared/source-utils.mjs";

/**
 * Third-party libraries with a wrapper policy must be imported only inside
 * their wrapper homes (lib/, infrastructure/, adapters/, gateways/, core/ —
 * core/logger and core/http own their vendors on the api side).
 * Business code imports the wrapper, never the raw package.
 */
const WRAPPER_HOMES = ["lib", "infrastructure", "adapters", "gateways", "core"];

export default {
  meta: {
    type: "problem",
    docs: {
      description:
        "Raw wrapped-library imports are only allowed inside wrapper folders.",
    },
    schema: [],
    messages: {
      noRawHttp:
        'Raw HTTP client "{{source}}" is not allowed. Use the HTTP client wrapper (gateway/lib).',
      noRawLibrary:
        'Import "{{source}}" through its wrapper in lib/ or infrastructure/, not directly.',
    },
  },
  create(context) {
    const filename = context.filename;

    if (
      isTestFile(filename) ||
      WRAPPER_HOMES.some((home) => isInFolder(filename, home))
    ) {
      return {};
    }

    return {
      ImportDeclaration(node) {
        const source = getImportSource(node);
        if (source === undefined) {
          return;
        }

        if (
          RAW_HTTP_PACKAGES.some(
            (pkg) => source === pkg || source.startsWith(`${pkg}/`),
          )
        ) {
          context.report({ node, messageId: "noRawHttp", data: { source } });
          return;
        }

        if (
          WRAPPED_LIBRARIES.some(
            (pkg) => source === pkg || source.startsWith(`${pkg}/`),
          )
        ) {
          context.report({ node, messageId: "noRawLibrary", data: { source } });
        }
      },
    };
  },
};
