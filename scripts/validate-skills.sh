#!/usr/bin/env bash
set -euo pipefail

root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
status=0

while IFS= read -r -d '' skill_dir; do
  skill_name="$(basename "$skill_dir")"
  skill_file="$skill_dir/SKILL.md"

  if [[ "$skill_name" != k-parent-* ]]; then
    echo "non-parent skill directory is not allowed: $skill_name"
    status=1
  fi

  if [[ ! -f "$skill_file" ]]; then
    echo "missing SKILL.md: $skill_name"
    status=1
    continue
  fi

  if ! head -n 1 "$skill_file" | grep -qx -- "---"; then
    echo "missing frontmatter start: $skill_file"
    status=1
  fi

  if ! grep -q '^name: ' "$skill_file"; then
    echo "missing name field: $skill_file"
    status=1
  fi

  if ! grep -q '^description: ' "$skill_file"; then
    echo "missing description field: $skill_file"
    status=1
  fi

  declared_name="$(sed -n 's/^name: //p' "$skill_file" | head -n 1 | tr -d '"')"
  if [[ "$declared_name" != "$skill_name" ]]; then
    echo "name mismatch: $skill_file declares '$declared_name' but directory is '$skill_name'"
    status=1
  fi

  if [[ "$skill_name" == k-parent-* ]]; then
    if ! grep -q '^license: MIT$' "$skill_file"; then
      echo "missing parent MIT license: $skill_file"
      status=1
    fi

    if ! grep -q '^metadata:$' "$skill_file"; then
      echo "missing parent metadata block: $skill_file"
      status=1
    fi

    if ! grep -q '^  category: parenting$' "$skill_file"; then
      echo "missing parent category metadata: $skill_file"
      status=1
    fi

    if ! grep -q '^  locale: ko-KR$' "$skill_file"; then
      echo "missing parent locale metadata: $skill_file"
      status=1
    fi

    if ! grep -Eq '^  phase: (p0|implemented|concept)$' "$skill_file"; then
      echo "missing or unsupported parent phase metadata: $skill_file"
      status=1
    fi
  fi
done < <(
  find "$root/skills" -mindepth 1 -maxdepth 1 -type d \
    ! -name '.*' \
    -print0
)

if [[ "$status" -ne 0 ]]; then
  exit "$status"
fi

echo "skill layout looks valid"
