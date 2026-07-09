import { isTestFile, normalizePath } from "../shared/path-utils.mjs";
import { getImportSource } from "../shared/source-utils.mjs";

/**
 * A source that resolves to the React runtime (react / react-dom and their
 * deep entrypoints), which carries a runtime coupling to the UI framework.
 */
const isReactRuntimeSource = (source) =>
  source === "react" ||
  source === "react-dom" ||
  source.startsWith("react/") ||
  source.startsWith("react-dom/");

/**
 * A pure-logic file is any `.ts` that is not a component (`.tsx`), a hook
 * (`*.hook.ts` — hooks legitimately consume React), a type declaration
 * (`.d.ts`), or a test. Backend and shared-package `.ts` files are always pure;
 * on the frontend the pure layers are helpers, mappers, models, services, and
 * gateways — everything except components and hooks.
 */
const isPureLogicFile = (filename) => {
  const normalized = normalizePath(filename);
  if (isTestFile(normalized)) {
    return false;
  }
  if (!normalized.endsWith(".ts") || normalized.endsWith(".d.ts")) {
    return false;
  }
  return !normalized.endsWith(".hook.ts");
};

/**
 * Reports a value (runtime) import of a React specifier — a default/namespace
 * import, a side-effect import, or any named binding that is not `import type`.
 * Type-only imports (`import type { ReactNode }`, or fully-inline
 * `import { type ReactNode }`) are erased at compile time, carry no runtime
 * framework coupling, and are allowed so prop/view types can live in `.ts`
 * `model/`/`types/` files.
 */
const hasReactRuntimeBinding = (node) => {
  if (node.importKind === "type") {
    return false;
  }
  if (node.specifiers.length === 0) {
    return true;
  }
  return node.specifiers.some((specifier) => specifier.importKind !== "type");
};

/**
 * Pure logic layers must not carry a runtime dependency on React. Value imports
 * of react/react-dom are only allowed in components (`.tsx`) and hooks
 * (`*.hook.ts`); everywhere else (backend, shared package, and the frontend's
 * helper/mapper/model/service/gateway layers) logic stays framework-agnostic
 * so it is portable and unit-testable without a DOM. Type-only React imports
 * are permitted — they disappear at compile time.
 */
export default {
  meta: {
    type: "problem",
    docs: {
      description:
        "Pure logic layers must not import the React runtime (type-only React imports are allowed).",
    },
    schema: [],
    messages: {
      noReactRuntime:
        'Runtime React import "{{source}}" is not allowed in a pure logic file. Move React usage into a component (.tsx) or hook (*.hook.ts), or import the type only.',
    },
  },
  create(context) {
    if (!isPureLogicFile(context.filename)) {
      return {};
    }

    return {
      ImportDeclaration(node) {
        const source = getImportSource(node);
        if (source === undefined || !isReactRuntimeSource(source)) {
          return;
        }
        if (hasReactRuntimeBinding(node)) {
          context.report({
            node,
            messageId: "noReactRuntime",
            data: { source },
          });
        }
      },
    };
  },
};
