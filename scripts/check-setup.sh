#!/usr/bin/env bash
set -euo pipefail

preferred_file="${1:-${KPARENT_SECRETS_FILE:-$HOME/.config/k-parent-skills/secrets.env}}"
legacy_file="$HOME/.config/k-parent-skill/secrets.env"
selected_file="$preferred_file"

if ! command -v node >/dev/null 2>&1; then
  echo "missing runtime: node >= 18"
  exit 1
fi

if ! command -v npm >/dev/null 2>&1; then
  echo "missing runtime: npm"
  exit 1
fi

node_major="$(node -p 'Number(process.versions.node.split(".")[0])')"
if (( node_major < 18 )); then
  echo "unsupported Node.js major: $node_major (expected >= 18)"
  exit 1
fi

if [[ ! -f "$selected_file" && $# -eq 0 && -z "${KPARENT_SECRETS_FILE:-}" && -f "$legacy_file" ]]; then
  selected_file="$legacy_file"
  echo "using legacy read-compatible secrets path: $legacy_file"
fi

if [[ -f "$selected_file" ]]; then
  perms="$(stat -f '%Lp' "$selected_file" 2>/dev/null || stat -c '%a' "$selected_file" 2>/dev/null)"
  if [[ "$perms" != "600" ]]; then
    echo "insecure permissions on $selected_file: $perms (expected 600)"
    exit 1
  fi
  echo "credential file permissions are valid: $selected_file"
else
  echo "credential file not found; fixture-first mode remains available"
  echo "optional live configuration: $preferred_file (chmod 0600)"
fi

echo "K-Parent Skills setup looks usable (Node.js $(node -p 'process.versions.node'))."
