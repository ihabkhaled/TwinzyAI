module.exports = {
  '*.{ts,tsx,mjs,js}': ['eslint --fix --no-warn-ignored --max-warnings=0', 'prettier --write'],
  '*.{json,md,css,yml,yaml}': ['prettier --write'],
};
