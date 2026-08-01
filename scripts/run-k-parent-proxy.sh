#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SECRETS_FILE="${KPARENT_SECRETS_FILE:-$HOME/.config/k-parent-skills/secrets.env}"

if [[ -f "$SECRETS_FILE" ]]; then
  set -a
  # shellcheck disable=SC1090
  source "$SECRETS_FILE"
  set +a
fi

cd "$ROOT_DIR"
exec node packages/k-parent-proxy/src/server.js
