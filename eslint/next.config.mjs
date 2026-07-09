import nextPlugin from "@next/eslint-plugin-next";

/**
 * Next.js best-practice and Core Web Vitals rules for the web app.
 */
export default [
  {
    files: ["apps/web/**/*.ts", "apps/web/**/*.tsx"],
    plugins: {
      "@next/next": nextPlugin,
    },
    settings: {
      next: { rootDir: "apps/web" },
    },
    rules: {
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs["core-web-vitals"].rules,
      "@next/next/no-html-link-for-pages": "off",
    },
  },
];
