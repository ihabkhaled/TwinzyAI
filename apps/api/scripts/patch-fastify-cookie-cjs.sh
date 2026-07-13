#!/bin/sh
set -eu

node <<'NODE'
const fs = require('node:fs');
const path = require('node:path');

const packageRoot = path.resolve('node_modules/@fastify/cookie/node_modules/cookie');
const entryPath = path.join(packageRoot, 'dist/index.js');
const packagePath = path.join(packageRoot, 'package.json');

let source = fs.readFileSync(entryPath, 'utf8');
source = source
  .replace(/\bexport\s*\{[^}]*\};?/g, '')
  .replace(/\bexport\s+(?=(?:async\s+)?(?:function|class|const|let|var)\b)/g, '');
source += '\nmodule.exports = { parseCookie, stringifyCookie, stringifySetCookie };\n';
fs.writeFileSync(entryPath, source);

const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
packageJson.type = 'commonjs';
fs.writeFileSync(packagePath, `${JSON.stringify(packageJson, null, 2)}\n`);

const compatibilityModule = require(entryPath);
for (const exportName of ['parseCookie', 'stringifyCookie', 'stringifySetCookie']) {
  if (typeof compatibilityModule[exportName] !== 'function') {
    throw new TypeError(`Missing cookie compatibility export: ${exportName}`);
  }
}
NODE
