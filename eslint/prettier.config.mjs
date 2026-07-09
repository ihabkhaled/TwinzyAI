import prettierConfig from "eslint-config-prettier";

/**
 * Must stay LAST in the composition: disables formatting rules that
 * conflict with Prettier.
 */
export default [prettierConfig];
