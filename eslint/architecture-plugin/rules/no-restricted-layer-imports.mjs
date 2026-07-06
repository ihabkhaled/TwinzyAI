import {
  isApiFile,
  isTestFile,
  isWebFile,
  srcRelativePath,
} from "../shared/path-utils.mjs";
import {
  API_LAYER_FOLDERS,
  FORBIDDEN_API_LAYER_IMPORTS,
  FORBIDDEN_WEB_LAYER_IMPORTS,
} from "../shared/policy-utils.mjs";
import {
  getImportSource,
  getLayerFolder,
  importTargetsFolder,
} from "../shared/source-utils.mjs";

const WEB_LAYER_FOLDERS = Object.keys(FORBIDDEN_WEB_LAYER_IMPORTS);

/**
 * Enforces the one-directional layer flow on both sides:
 * API (legacy): Controller → Manager → Service → Repository (adapters leaves).
 * API (canonical anatomy): api/ never imports infrastructure/ or adapters/
 * directly; dto/ never imports application/ or infrastructure/.
 * Web: Component → Hook → Service → Gateway.
 *
 * API layers are detected on the src-relative path so the "api" layer folder
 * never collides with the apps/api workspace segment.
 */
export default {
  meta: {
    type: "problem",
    docs: {
      description:
        "Forbid imports that break the layered architecture direction.",
    },
    schema: [],
    messages: {
      forbidden:
        'Files in "{{fromLayer}}" must not import from "{{toLayer}}". Follow the layer order.',
    },
  },
  create(context) {
    const filename = context.filename;

    if (isTestFile(filename)) {
      return {};
    }

    let policy;
    let fromLayer;

    if (isApiFile(filename)) {
      policy = FORBIDDEN_API_LAYER_IMPORTS;
      fromLayer = getLayerFolder(srcRelativePath(filename), API_LAYER_FOLDERS);
    } else if (isWebFile(filename)) {
      policy = FORBIDDEN_WEB_LAYER_IMPORTS;
      fromLayer = getLayerFolder(filename, WEB_LAYER_FOLDERS);
    } else {
      return {};
    }

    if (fromLayer === undefined) {
      return {};
    }

    const forbiddenTargets = policy[fromLayer] ?? [];

    return {
      ImportDeclaration(node) {
        const source = getImportSource(node);
        if (source === undefined) {
          return;
        }

        for (const target of forbiddenTargets) {
          if (importTargetsFolder(filename, source, target)) {
            context.report({
              node,
              messageId: "forbidden",
              data: { fromLayer, toLayer: target },
            });
          }
        }
      },
    };
  },
};
