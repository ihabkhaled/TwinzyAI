#!/bin/sh
set -eu

cd ../..

npm run lint
npm run quality:dead-code
npm run knowledge:build
git diff --exit-code -- .ai
npm run build:api
