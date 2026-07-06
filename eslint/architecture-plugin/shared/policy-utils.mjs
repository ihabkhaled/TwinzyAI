/**
 * Central policy lists for the architecture rules. Adding a new external
 * SDK or wrapped library means updating exactly one file: this one.
 */

/** Packages that may only be imported inside adapter files. */
export const SDK_PACKAGES = [
  "@google/genai",
  "@google/generative-ai",
  "openai",
  "@anthropic-ai/sdk",
];

/** Raw HTTP clients — business code must use the gateway/http wrapper. */
export const RAW_HTTP_PACKAGES = [
  "axios",
  "ky",
  "got",
  "node-fetch",
  "undici",
  "superagent",
];

/** Libraries that must be wrapped in lib/ (web) or infrastructure/ (api). */
export const WRAPPED_LIBRARIES = [
  "dayjs",
  "moment",
  "date-fns",
  "luxon",
  "winston",
  "pino",
];

/** React built-in hooks banned inside TSX component files. */
export const BANNED_TSX_HOOKS = [
  "useState",
  "useEffect",
  "useMemo",
  "useCallback",
  "useRef",
  "useReducer",
  "useLayoutEffect",
  "useImperativeHandle",
  "useContext",
];

/**
 * Folders whose files count as backend layer members. Matched on the
 * src-relative path (see path-utils srcRelativePath) so the "api" entry never
 * collides with the apps/api workspace segment. Order matters: more specific
 * folders (dto) must precede the folders that contain them (api).
 */
export const API_LAYER_FOLDERS = [
  "controllers",
  "managers",
  "services",
  "repositories",
  "adapters",
  "dto",
  "api",
];

/**
 * Backend layer import policy: key imports from listed folders are FORBIDDEN.
 * Legacy layout: Controller → Manager → Service → Repository (adapters leaves).
 * Canonical anatomy: api/ is the HTTP boundary (delegates to application/,
 * never reaches into infrastructure/ or adapters/); dto/ stays declarative.
 */
export const FORBIDDEN_API_LAYER_IMPORTS = {
  controllers: ["services", "repositories", "adapters"],
  managers: ["controllers", "repositories", "adapters"],
  services: ["controllers", "managers"],
  repositories: ["controllers", "managers", "services", "adapters"],
  adapters: ["controllers", "managers", "services", "repositories"],
  api: ["infrastructure", "adapters"],
  dto: ["application", "infrastructure"],
};

/**
 * Frontend layer import policy (Component → Hook → Service → Gateway).
 */
export const FORBIDDEN_WEB_LAYER_IMPORTS = {
  components: ["services", "gateways"],
  hooks: ["gateways"],
  services: ["hooks", "components"],
  gateways: ["hooks", "components", "services"],
  utils: ["hooks", "components", "services", "gateways"],
};

/* ------------------------------------------------------------------------ *
 * Config-driven policy engine (no-restricted-vendor-imports).
 * Rules receive pattern strings from eslint/package-boundaries.config.mjs and
 * compile them here — vendors are never hardcoded in rule implementations.
 * ------------------------------------------------------------------------ */

/** Compile pattern strings to unicode-aware regexes. */
export const toRegExps = (patterns) =>
  (patterns ?? []).map((pattern) => new RegExp(pattern, "u"));

/** True when any compiled regex matches the value. */
export const matchesAny = (value, regexps) =>
  regexps.some((regexp) => regexp.test(value));

/** Compile {from?, forbid, allowIn?, message} import policies. */
export const compileImportPolicies = (policies) =>
  (policies ?? []).map((policy) => ({
    from: toRegExps(policy.from),
    forbid: toRegExps(policy.forbid),
    allowIn: toRegExps(policy.allowIn),
    message: policy.message,
  }));

/** Compile {object, property, allowIn?, message} runtime-access rules. */
export const compileRestrictedAccess = (rules) =>
  (rules ?? []).map((rule) => ({
    object: rule.object,
    property: rule.property,
    allowIn: toRegExps(rule.allowIn),
    message: rule.message,
  }));

/** True when a compiled import policy forbids `source` for `filename`. */
export const importPolicyMatches = (policy, filename, source) => {
  if (policy.from.length > 0 && !matchesAny(filename, policy.from)) {
    return false;
  }

  if (policy.allowIn.length > 0 && matchesAny(filename, policy.allowIn)) {
    return false;
  }

  return matchesAny(source, policy.forbid);
};
