import {
  isApiFile,
  isInFolder,
  isInSrcFolder,
  isTestFile,
  normalizePath,
} from "../shared/path-utils.mjs";

/**
 * Domain definitions (interfaces, type aliases, enums, and module-level
 * value/config constants) must live in their dedicated folders (types/,
 * interfaces/, enums/, constants/, dto/, schemas/, model/, domain/) — not
 * inline in layer files (controllers, services, repositories, gateways,
 * components, or the canonical backend layers api/, application/,
 * infrastructure/, adapters/).
 *
 * The const clause is the backend twin of the frontend no-inline-declarations
 * rule: a reusable constant, config object, or `as const` map declared at the
 * top of a layer file is a domain definition living in the wrong place — move
 * it to constants/ (or model/). Function-valued consts, `new`/call-expression
 * wiring, and the approved logging-context constant are exempt because they are
 * collaborators, not shared definitions.
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

/**
 * The only module-level value constants a layer file may declare inline — a
 * logging context/prefix. Every other reusable value belongs in constants/.
 */
const APPROVED_CONST_NAMES = new Set(["LOG_CONTEXT", "LOG_PREFIX"]);

/** A const whose initializer is a function is a collaborator, not a definition. */
const isFunctionValue = (init) =>
  init !== null &&
  (init.type === "ArrowFunctionExpression" ||
    init.type === "FunctionExpression");

const isInlineZodSchema = (init) =>
  init?.type === "CallExpression" &&
  init.callee.type === "MemberExpression" &&
  init.callee.object.type === "Identifier" &&
  init.callee.object.name === "z";

/** `new X()` / non-schema `factory()` wiring is collaborator setup. */
const isWiringValue = (init) =>
  init !== null &&
  (init.type === "NewExpression" ||
    (init.type === "CallExpression" && !isInlineZodSchema(init)));

/**
 * Report each module-level `const` value/config declaration in a layer file.
 * Function- and wiring-valued consts and the approved logging constant are
 * exempt; everything else (values, config objects, `as const` maps) must move
 * to a constants/ file.
 */
function reportInlineConst(context, node, layer) {
  if (node.kind !== "const") {
    return;
  }
  for (const declaration of node.declarations) {
    if (isFunctionValue(declaration.init) || isWiringValue(declaration.init)) {
      continue;
    }
    const name =
      declaration.id.type === "Identifier" ? declaration.id.name : "(pattern)";
    if (APPROVED_CONST_NAMES.has(name)) {
      continue;
    }
    context.report({
      node: declaration,
      messageId: "inlineConst",
      data: { name, layer },
    });
  }
}

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
      inlineConst:
        "Do not declare the module-level constant '{{name}}' inline in a {{layer}} file. Move reusable values/config to a constants/ file.",
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
      // The const clause is apps/api-only: on the web side the frontend
      // no-inline-declarations rule owns this concern and (unlike this rule)
      // correctly exempts *.variants.ts class-string bundles under components/.
      ...(isApiFile(filename) && {
        "Program > VariableDeclaration": (node) =>
          reportInlineConst(context, node, layer),
        "Program > ExportNamedDeclaration > VariableDeclaration": (node) =>
          reportInlineConst(context, node, layer),
      }),
    };
  },
};
