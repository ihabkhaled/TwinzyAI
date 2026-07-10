import {
  hasFileSuffix,
  isApplicationLayerFile,
  isInApplicationFolder,
  isTestFile,
} from "../shared/path-utils.mjs";
import { SDK_PACKAGES } from "../shared/policy-utils.mjs";
import {
  getImportSource,
  importTargetsModuleFolder,
} from "../shared/source-utils.mjs";

/**
 * The application layer (use cases and services) orchestrates the domain.
 * It may depend downward on infrastructure/, adapters/, domain/, model/, and
 * lib/, but never back up into the HTTP boundary (api/ controllers or DTOs)
 * and never directly on provider SDKs.
 *
 * Targeting: apps/api files inside an application/ folder or ending in
 * .use-case.ts / .service.ts — suffix-based so it holds during the folder
 * migration.
 */
export default {
  meta: {
    type: "problem",
    docs: {
      description:
        "Application-layer files must not import the api/ boundary or provider SDKs.",
    },
    schema: [],
    messages: {
      noApiImport:
        "Application-layer files must not import from api/. Controllers and DTOs stay at the HTTP boundary.",
      noSdk:
        'Application-layer files must never import the provider SDK "{{source}}". Use the adapter.',
      imageOutsideExtraction:
        "Only trait-extraction.service.ts may call image-capable AI provider methods. Candidate generation, judging, translation, and other application services are text-only.",
    },
  },
  create(context) {
    const filename = context.filename;

    if (!isApplicationLayerFile(filename) || isTestFile(filename)) {
      return {};
    }

    const isTraitExtractionService = hasFileSuffix(
      filename,
      "/modules/ai/application/trait-extraction.service.ts",
    );
    const enforcesImageBoundary = isInApplicationFolder(filename);

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

        if (importTargetsModuleFolder(filename, source, "api")) {
          context.report({ node, messageId: "noApiImport" });
        }
      },
      CallExpression(node) {
        if (
          !enforcesImageBoundary ||
          isTraitExtractionService ||
          node.callee.type !== "MemberExpression"
        ) {
          return;
        }
        const property = node.callee.property;
        let propertyName;
        if (property.type === "Identifier") {
          propertyName = property.name;
        } else if (
          property.type === "Literal" &&
          typeof property.value === "string"
        ) {
          propertyName = property.value;
        }
        if (
          propertyName === "generateFromImage" ||
          propertyName === "generateFromImageStream"
        ) {
          context.report({ node, messageId: "imageOutsideExtraction" });
        }
      },
    };
  },
};
