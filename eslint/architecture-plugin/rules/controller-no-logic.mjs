import { isApiControllerFile } from "../shared/path-utils.mjs";

/**
 * Controllers are thin transport adapters. Every method (except the
 * constructor) must contain exactly one return statement whose value is a
 * direct delegation (`return this.useCase.execute(dto)`), an identifier, a
 * member access, or a literal. No branching, no transformation, no
 * orchestration — that logic belongs in the application layer.
 *
 * Targeting is suffix-based (apps/api files ending in .controller.ts) so it
 * holds in any folder, before and after the anatomy migration. Broaden the
 * allowed return shapes only when controller delegation genuinely needs it.
 */
const ALLOWED_RETURN_NODE_TYPES = new Set([
  "CallExpression",
  "ChainExpression",
  "Identifier",
  "Literal",
  "MemberExpression",
]);

const isAllowedReturnExpression = (node) => {
  if (!node) {
    return false;
  }

  if (node.type === "AwaitExpression") {
    return isAllowedReturnExpression(node.argument);
  }

  return ALLOWED_RETURN_NODE_TYPES.has(node.type);
};

export default {
  meta: {
    type: "problem",
    docs: {
      description:
        "Controller methods must be a single return statement that delegates directly.",
    },
    schema: [],
    messages: {
      singleReturnOnly:
        "Controller methods must contain exactly one return statement and no extra logic.",
      invalidReturn:
        "Controller methods may only return a direct delegation, identifier, member access, or literal.",
    },
  },
  create(context) {
    if (!isApiControllerFile(context.filename)) {
      return {};
    }

    return {
      MethodDefinition(node) {
        if (node.kind === "constructor" || node.value.body === null) {
          return;
        }

        const statements = node.value.body.body;

        if (
          statements.length !== 1 ||
          statements[0].type !== "ReturnStatement"
        ) {
          context.report({ node, messageId: "singleReturnOnly" });
          return;
        }

        if (!isAllowedReturnExpression(statements[0].argument)) {
          context.report({ node: statements[0], messageId: "invalidReturn" });
        }
      },
    };
  },
};
