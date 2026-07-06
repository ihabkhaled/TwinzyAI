/**
 * Rule: frontend-architecture/no-inline-declarations
 *
 * Layered implementation files (components, containers, hooks, services,
 * gateways, queries, mutations, route handlers) must not declare module-level
 * types, interfaces, enums, or non-function constants. Those declarations live
 * in the types/, enums/, and constants/ layers so they can be shared, tested,
 * and reviewed in one place.
 *
 * Component files are additionally forbidden from declaring anything inside
 * the component body: a component receives props and returns JSX.
 */

import { isFunctionValue } from "../shared/ast-utils.mjs";
import {
  getSourcePath,
  isComponentFile,
  isContainerFile,
  isGatewayFile,
  isQueryFile,
  isRouteHandlerFile,
  isServiceFile,
  isTestFile,
  toPosixPath,
} from "../shared/source-utils.mjs";

const APPROVED_CONST_NAMES = new Set(["LOG_PREFIX"]);

function isHookImplementationFile(sourcePath) {
  return /\.hook\.tsx?$/.test(sourcePath ?? "");
}

function isTargetFile(sourcePath) {
  return (
    isComponentFile(sourcePath) ||
    isContainerFile(sourcePath) ||
    isHookImplementationFile(sourcePath) ||
    isServiceFile(sourcePath) ||
    isGatewayFile(sourcePath) ||
    isQueryFile(sourcePath) ||
    isRouteHandlerFile(sourcePath)
  );
}

function reportInlineConsts(context, node) {
  if (node.kind !== "const") {
    return;
  }

  for (const declaration of node.declarations) {
    if (isFunctionValue(declaration.init)) {
      continue;
    }
    if (declaration.init && declaration.init.type === "CallExpression") {
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
      data: { name },
    });
  }
}

function reportInlineType(context, node, kind) {
  context.report({ node, messageId: "inlineType", data: { kind } });
}

function componentBodyVisitors(context) {
  const report = (node) =>
    context.report({ node, messageId: "componentBodyDeclaration" });
  return {
    "FunctionDeclaration BlockStatement > VariableDeclaration": report,
    "ArrowFunctionExpression BlockStatement > VariableDeclaration": report,
    "FunctionExpression BlockStatement > VariableDeclaration": report,
  };
}

export default {
  meta: {
    type: "problem",
    docs: {
      description:
        "Implementation layers must not declare inline types/interfaces/enums/constants; move declarations to types/, enums/, constants/ files.",
    },
    schema: [],
    messages: {
      inlineType:
        "Move this {{kind}} into the types/ (or enums/) layer. Implementation files must not declare shapes inline.",
      inlineConst:
        "Move module-level constant '{{name}}' into a constants/ file. Implementation files must not embed configuration values.",
      componentBodyDeclaration:
        "Component bodies must not declare variables or functions. Compute values in the container/hook and pass them as props.",
    },
  },
  create(context) {
    const sourcePath = getSourcePath(toPosixPath(context.filename));

    if (!sourcePath || isTestFile(sourcePath) || !isTargetFile(sourcePath)) {
      return {};
    }

    const checkConst = (node) => reportInlineConsts(context, node);

    return {
      TSEnumDeclaration: (node) => reportInlineType(context, node, "enum"),
      "Program > TSInterfaceDeclaration": (node) =>
        reportInlineType(context, node, "interface"),
      "Program > ExportNamedDeclaration > TSInterfaceDeclaration": (node) =>
        reportInlineType(context, node, "interface"),
      "Program > TSTypeAliasDeclaration": (node) =>
        reportInlineType(context, node, "type alias"),
      "Program > ExportNamedDeclaration > TSTypeAliasDeclaration": (node) =>
        reportInlineType(context, node, "type alias"),
      "Program > VariableDeclaration": checkConst,
      "Program > ExportNamedDeclaration > VariableDeclaration": checkConst,
      ...(isComponentFile(sourcePath) ? componentBodyVisitors(context) : {}),
    };
  },
};
