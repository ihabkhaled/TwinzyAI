module.exports = {
  '*.{ts,tsx,mjs,js}': ['eslint --fix --no-warn-ignored', 'prettier --write'],
  '*.{json,md,css,yml,yaml}': ['prettier --write'],
};
