import { isApiControllerFile } from "../shared/path-utils.mjs";

/**
 * Controllers are thin transport adapters. Every method (except the
 * constructor) must contain exactly one return statement whose value is a
 * direct delegation (`return this.useCase.execute(dto)`). No branching,
 * nested mapper calls, literals/member-only returns, constructor side effects, or
 * orchestration — that logic belongs in the application layer.
 *
 * Targeting is suffix-based (apps/api files ending in .controller.ts) so it
 * holds in any folder, before and after the anatomy migration. Broaden the
 * allowed return shapes only when controller delegation genuinely needs it.
 */
const unwrapExpression = (node) => {
  if (node?.type === "AwaitExpression" || node?.type === "ChainExpression") {
    return unwrapExpression(node.expression ?? node.argument);
  }
  return node;
};

const countCalls = (node, visitorKeys) => {
  if (!node) {
    return 0;
  }
  const ownCount = node.type === "CallExpression" ? 1 : 0;
  return (visitorKeys[node.type] ?? []).reduce((count, key) => {
    const child = node[key];
    if (Array.isArray(child)) {
      return (
        count +
        child.reduce(
          (childCount, entry) => childCount + countCalls(entry, visitorKeys),
          0,
        )
      );
    }
    return count + countCalls(child, visitorKeys);
  }, ownCount);
};

const isDirectDelegation = (node, visitorKeys) => {
  const expression = unwrapExpression(node);
  if (
    expression?.type !== "CallExpression" ||
    countCalls(expression, visitorKeys) !== 1
  ) {
    return false;
  }
  const callee = expression.callee;
  return (
    callee.type === "MemberExpression" &&
    callee.object.type === "MemberExpression" &&
    callee.object.object.type === "ThisExpression"
  );
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
        "Controller methods must return exactly one direct this.<collaborator>.<method>(...) delegation with no nested calls.",
      constructorWiringOnly:
        "Controller constructors may declare injected collaborators but must not execute statements.",
    },
  },
  create(context) {
    if (!isApiControllerFile(context.filename)) {
      return {};
    }

    return {
      MethodDefinition(node) {
        if (node.value.body === null) {
          return;
        }
        if (node.kind === "constructor") {
          if (node.value.body.body.length > 0) {
            context.report({ node, messageId: "constructorWiringOnly" });
          }
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

        if (
          !isDirectDelegation(
            statements[0].argument,
            context.sourceCode.visitorKeys,
          )
        ) {
          context.report({ node: statements[0], messageId: "invalidReturn" });
        }
      },
    };
  },
};
