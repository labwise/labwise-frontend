#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd -P)"
cd "$ROOT"
OUT="$(node -e 'process.stdout.write(require("path").resolve(process.argv[1]))' "${1:?output required}")"
[ ! -e "$OUT" ] || { echo out_exists >&2; exit 2; }
case "$OUT" in "$ROOT/.next"|"$ROOT/.next/"*) echo out_inside_build >&2; exit 2 ;; esac
node node_modules/next/dist/bin/next build --webpack >&2
[ -f .next/standalone/server.js ] && [ ! -L .next/standalone/server.js ] || { echo standalone_root_invalid >&2; exit 2; }
mkdir -- "$OUT"
mkdir -- "$OUT/dist"
cp -R .next/standalone/. "$OUT/dist/"
cp -R public "$OUT/dist/public"
cp -R .next/static "$OUT/dist/.next/static"
mkdir -p -- "$OUT/scripts/release"
cp scripts/release/manifest.cjs scripts/release/switch.cjs "$OUT/scripts/release/"
node scripts/release/manifest.cjs create "$OUT"
