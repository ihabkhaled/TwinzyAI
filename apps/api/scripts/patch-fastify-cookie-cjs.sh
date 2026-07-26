#!/bin/sh
set -eu

node <<'NODE'
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const fastifyCookieRoot = path.dirname(
  require.resolve('@fastify/cookie/package.json', {
    paths: [path.resolve('apps/api')],
  }),
);
const entryPath = require.resolve('cookie', { paths: [fastifyCookieRoot] });
const packageRoot = path.dirname(path.dirname(entryPath));
const packagePath = path.join(packageRoot, 'package.json');

let source = fs.readFileSync(entryPath, 'utf8');
if (!source.includes('module.exports = { parseCookie, stringifyCookie, stringifySetCookie };')) {
  source = source
    .replace(/\bexport\s*\{[^}]*\};?/g, '')
    .replace(/\bexport\s+(?=(?:async\s+)?(?:function|class|const|let|var)\b)/g, '');
  source += '\nmodule.exports = { parseCookie, stringifyCookie, stringifySetCookie };\n';
  fs.writeFileSync(entryPath, source);
}

const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
packageJson.type = 'commonjs';
fs.writeFileSync(packagePath, `${JSON.stringify(packageJson, null, 2)}\n`);

execFileSync(
  process.execPath,
  [
    '-e',
    `const value = require(${JSON.stringify(entryPath)}); for (const name of ['parseCookie', 'stringifyCookie', 'stringifySetCookie']) { if (typeof value[name] !== 'function') throw new TypeError('Missing cookie compatibility export: ' + name); }`,
  ],
  { stdio: 'inherit' },
);
NODE
