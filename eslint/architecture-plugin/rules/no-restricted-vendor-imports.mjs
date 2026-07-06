import { normalizePath } from "../shared/path-utils.mjs";
import {
  compileImportPolicies,
  compileRestrictedAccess,
  importPolicyMatches,
  matchesAny,
} from "../shared/policy-utils.mjs";
import { getImportSource } from "../shared/source-utils.mjs";

/**
 * Config-driven vendor boundary engine. Every third-party library is
 * reachable only through the ONE module that owns it; swapping a vendor then
 * touches exactly one folder. The policies (which vendors, which owning
 * modules) live in eslint/package-boundaries.config.mjs and are passed as
 * rule options — never hardcode vendors here.
 *
 * Options shape:
 *   policies:         [{ from?, forbid, allowIn?, message }]
 *     - forbid    regex list matched against the RAW import source
 *     - from      regex list the (normalized) filename must match, if present
 *     - allowIn   regex list of owning-module paths exempt from the policy
 *   restrictedAccess: [{ object, property, allowIn?, message }]
 *     - flags `object.property` member access outside allowIn paths
 *
 * All patterns compile with the 'u' flag; filenames are normalized to
 * forward slashes so behavior is identical on Windows and POSIX.
 */
const patternList = { type: "array", items: { type: "string" } };

const importPolicySchema = {
  type: "object",
  properties: {
    from: patternList,
    forbid: patternList,
    allowIn: patternList,
    message: { type: "string" },
  },
  required: ["forbid", "message"],
  additionalProperties: false,
};

const restrictedAccessSchema = {
  type: "object",
  properties: {
    object: { type: "string" },
    property: { type: "string" },
    allowIn: patternList,
    message: { type: "string" },
  },
  required: ["object", "property", "message"],
  additionalProperties: false,
};

export default {
  meta: {
    type: "problem",
    docs: {
      description:
        "Enforce configurable vendor import boundaries and restricted runtime access.",
    },
    schema: [
      {
        type: "object",
        properties: {
          policies: { type: "array", items: importPolicySchema },
          restrictedAccess: { type: "array", items: restrictedAccessSchema },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      forbiddenImport: '{{message}} Forbidden import: "{{source}}".',
      restrictedAccess: "{{message}}",
    },
  },
  create(context) {
    const options = context.options[0] ?? {};
    const policies = compileImportPolicies(options.policies);
    const restrictedAccess = compileRestrictedAccess(options.restrictedAccess);
    const filename = normalizePath(
      context.physicalFilename ?? context.filename,
    );
    const visitors = {};

    if (policies.length > 0) {
      visitors.ImportDeclaration = (node) => {
        const source = getImportSource(node);
        if (source === undefined) {
          return;
        }

        for (const policy of policies) {
          if (importPolicyMatches(policy, filename, source)) {
            context.report({
              node,
              messageId: "forbiddenImport",
              data: { source, message: policy.message },
            });
          }
        }
      };
    }

    if (restrictedAccess.length > 0) {
      visitors.MemberExpression = (node) => {
        if (
          node.object.type !== "Identifier" ||
          node.property.type !== "Identifier"
        ) {
          return;
        }

        for (const access of restrictedAccess) {
          if (
            node.object.name === access.object &&
            node.property.name === access.property &&
            !matchesAny(filename, access.allowIn)
          ) {
            context.report({
              node,
              messageId: "restrictedAccess",
              data: { message: access.message },
            });
          }
        }
      };
    }

    return visitors;
  },
};
