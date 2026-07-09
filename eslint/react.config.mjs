import jsxA11y from "eslint-plugin-jsx-a11y";
import react from "eslint-plugin-react";

/**
 * React and accessibility rules for the web app.
 */
export default [
  {
    files: ["apps/web/**/*.tsx", "apps/web/**/*.ts"],
    plugins: {
      react,
      "jsx-a11y": jsxA11y,
    },
    settings: {
      react: { version: "19" },
    },
    rules: {
      ...react.configs.flat.recommended.rules,
      ...react.configs.flat["jsx-runtime"].rules,
      ...jsxA11y.flatConfigs.recommended.rules,
      "react/prop-types": "off",
      "react/self-closing-comp": "error",
      "react/jsx-no-useless-fragment": "error",
      "react/no-danger": "error",
      "react/jsx-no-leaked-render": "error",
    },
  },
];
