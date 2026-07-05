import reactHooks from 'eslint-plugin-react-hooks';

/**
 * Rules of hooks and exhaustive dependencies for the web app.
 */
export default [
  {
    files: ['apps/web/**/*.tsx', 'apps/web/**/*.ts'],
    plugins: {
      'react-hooks': reactHooks,
    },
    rules: {
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'error',
    },
  },
];
