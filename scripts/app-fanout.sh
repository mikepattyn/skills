#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"

if ! command -v node >/dev/null 2>&1; then
  echo "node is required to plan app-fanout skill runs" >&2
  exit 1
fi

exec node "$ROOT/scripts/app-fanout.mjs" "$@"
