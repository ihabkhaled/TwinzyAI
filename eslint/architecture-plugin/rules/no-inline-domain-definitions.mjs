import {
  isApiFile,
  isInFolder,
  isInSrcFolder,
  isTestFile,
  normalizePath,
} from "../shared/path-utils.mjs";

/**
 * Domain definitions (interfaces, type aliases, enums, schema/config object
 * constants) must live in their dedicated folders (types/, interfaces/,
 * enums/, constants/, dto/, schemas/, model/, domain/) — not inline in layer
 * files (controllers, services, repositories, gateways, components, or the
 * canonical backend layers api/, application/, infrastructure/, adapters/).
 *
 * A single local Props interface is allowed in a TSX component file: it is
 * a view contract, not a domain definition (documented in rules/05).
 */
const LAYER_FOLDERS = [
  "controllers",
  "managers",
  "services",
  "repositories",
  "gateways",
  "components",
  "ui",
];

/**
 * Canonical backend anatomy layers, applied to apps/api files only and
 * matched src-relative so "api" never collides with the apps/api workspace
 * segment (or a Next.js app/api route folder on the web side).
 */
const API_ANATOMY_LAYER_FOLDERS = [
  "application",
  "infrastructure",
  "adapters",
  "api",
];

const DEFINITION_HOMES = [
  "types",
  "interfaces",
  "enums",
  "constants",
  "dto",
  "schemas",
  "model",
  "domain",
  "config",
];

export default {
  meta: {
    type: "problem",
    docs: {
      description:
        "Forbid inline domain type/interface/enum/constant-object definitions in layer files.",
    },
    schema: [],
    messages: {
      noInline:
        "Do not define {{kind}} inline in a {{layer}} file. Move it to the module types/interfaces/enums/constants/dto/schemas folder.",
    },
  },
  create(context) {
    const filename = normalizePath(context.filename);

    if (isTestFile(filename)) {
      return {};
    }

    if (DEFINITION_HOMES.some((home) => isInFolder(filename, home))) {
      return {};
    }

    const layer =
      LAYER_FOLDERS.find((folder) => isInFolder(filename, folder)) ??
      (isApiFile(filename)
        ? API_ANATOMY_LAYER_FOLDERS.find((folder) =>
            isInSrcFolder(filename, folder),
          )
        : undefined);
    if (layer === undefined) {
      return {};
    }

    const isTsx = filename.endsWith(".tsx");

    return {
      TSInterfaceDeclaration(node) {
        if (isTsx && node.id.name.endsWith("Props")) {
          return;
        }
        context.report({
          node,
          messageId: "noInline",
          data: { kind: "an interface", layer },
        });
      },
      TSTypeAliasDeclaration(node) {
        if (isTsx && node.id.name.endsWith("Props")) {
          return;
        }
        context.report({
          node,
          messageId: "noInline",
          data: { kind: "a type alias", layer },
        });
      },
      TSEnumDeclaration(node) {
        context.report({
          node,
          messageId: "noInline",
          data: { kind: "an enum", layer },
        });
      },
    };
  },
};
