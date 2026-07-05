/**
 * Central policy lists for the architecture rules. Adding a new external
 * SDK or wrapped library means updating exactly one file: this one.
 */

/** Packages that may only be imported inside adapter files. */
export const SDK_PACKAGES = ['@google/genai', '@google/generative-ai', 'openai', '@anthropic-ai/sdk'];

/** Raw HTTP clients — business code must use the gateway/http wrapper. */
export const RAW_HTTP_PACKAGES = ['axios', 'ky', 'got', 'node-fetch', 'undici', 'superagent'];

/** Libraries that must be wrapped in lib/ (web) or infrastructure/ (api). */
export const WRAPPED_LIBRARIES = ['dayjs', 'moment', 'date-fns', 'luxon', 'winston', 'pino'];

/** React built-in hooks banned inside TSX component files. */
export const BANNED_TSX_HOOKS = [
  'useState',
  'useEffect',
  'useMemo',
  'useCallback',
  'useRef',
  'useReducer',
  'useLayoutEffect',
  'useImperativeHandle',
  'useContext',
];

/** Folders whose files count as backend layer members. */
export const API_LAYER_FOLDERS = ['controllers', 'managers', 'services', 'repositories', 'adapters'];

/**
 * Backend layer import policy: key imports from listed folders are FORBIDDEN.
 * Controller → Manager → Service → Repository; adapters are leaves.
 */
export const FORBIDDEN_API_LAYER_IMPORTS = {
  controllers: ['services', 'repositories', 'adapters'],
  managers: ['controllers', 'repositories', 'adapters'],
  services: ['controllers', 'managers'],
  repositories: ['controllers', 'managers', 'services', 'adapters'],
  adapters: ['controllers', 'managers', 'services', 'repositories'],
};

/**
 * Frontend layer import policy (Component → Hook → Service → Gateway).
 */
export const FORBIDDEN_WEB_LAYER_IMPORTS = {
  components: ['services', 'gateways'],
  hooks: ['gateways'],
  services: ['hooks', 'components'],
  gateways: ['hooks', 'components', 'services'],
  utils: ['hooks', 'components', 'services', 'gateways'],
};
