#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
NODE="$ROOT/node-v24.16.0-darwin-arm64/bin/node"

if command -v node >/dev/null 2>&1; then
  exec node "$(dirname "$0")/server.js"
fi

if [[ ! -x "$NODE" ]]; then
  echo "Node not found. Extracting bundled Node..."
  tar -xzf "$ROOT/node-v24.16.0-darwin-arm64.tar.gz" -C "$ROOT"
fi

exec "$NODE" "$(dirname "$0")/server.js"
