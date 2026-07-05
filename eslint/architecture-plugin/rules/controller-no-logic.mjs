import { isInFolder } from '../shared/path-utils.mjs';

/**
 * Controllers are thin transport adapters: each public method may only
 * delegate (a single return/await of a manager call). Conditionals, loops,
 * try/catch, and multi-statement bodies are business logic and belong in
 * the manager/service layers.
 */
const BANNED_STATEMENTS = new Set([
  'IfStatement',
  'SwitchStatement',
  'ForStatement',
  'ForOfStatement',
  'ForInStatement',
  'WhileStatement',
  'DoWhileStatement',
  'TryStatement',
]);

export default {
  meta: {
    type: 'problem',
    docs: {
      description: 'Controller methods must only delegate to a manager — no business logic.',
    },
    schema: [],
    messages: {
      noLogic:
        'Controllers must not contain {{construct}}. Move logic into a manager or service.',
      tooManyStatements:
        'Controller method bodies must be a single delegation statement (found {{count}}).',
    },
  },
  create(context) {
    if (!isInFolder(context.filename, 'controllers')) {
      return {};
    }

    return {
      MethodDefinition(node) {
        if (node.kind !== 'method' || node.value.type !== 'FunctionExpression') {
          return;
        }

        const body = node.value.body?.body ?? [];

        if (body.length > 1) {
          context.report({
            node,
            messageId: 'tooManyStatements',
            data: { count: String(body.length) },
          });
        }

        for (const statement of body) {
          if (BANNED_STATEMENTS.has(statement.type)) {
            context.report({
              node: statement,
              messageId: 'noLogic',
              data: { construct: statement.type },
            });
          }
        }
      },
    };
  },
};
