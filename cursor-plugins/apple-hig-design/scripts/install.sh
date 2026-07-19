#!/usr/bin/env bash
# Apple HIG Design スキルをプロジェクトまたはグローバルにインストールする
set -euo pipefail

PLUGIN_ROOT="$(cd "$(dirname "$0")" && pwd)"
SKILL_SRC="${PLUGIN_ROOT}/skills/apple-hig-design"
TARGET="${1:-project}"

case "$TARGET" in
  project)
    DEST="$(pwd)/.cursor/skills/apple-hig-design"
  ;;
  global)
    DEST="${HOME}/.cursor/skills/apple-hig-design"
  ;;
  plugin)
    DEST="${HOME}/.cursor/plugins/local/apple-hig-design"
    mkdir -p "$(dirname "$DEST")"
    rm -rf "$DEST"
    cp -R "$PLUGIN_ROOT" "$DEST"
    echo "Installed plugin to: $DEST"
    exit 0
  ;;
  *)
    echo "Usage: $0 [project|global|plugin]" >&2
    exit 1
  ;;
esac

mkdir -p "$(dirname "$DEST")"
rm -rf "$DEST"
cp -R "$SKILL_SRC" "$DEST"
echo "Installed skill to: $DEST"
