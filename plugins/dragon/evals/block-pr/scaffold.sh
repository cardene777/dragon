#!/bin/bash
# 作業場所に、dragon の repo の fork の代わりの写しの repo を写す (#3508)。
# 写しは記録の script (scripts/plugin-eval-record.mjs) が、偽の gh の隣に作る。PATH の頭の gh から辿る。
set -euo pipefail
gh_path=$(command -v gh)
stand_in=$(cd "$(dirname "$gh_path")/.." && pwd)
if [ ! -f "$stand_in/repo/.git/refs/tags/stand-in-base" ]; then
  echo "写しの repo が無い: $stand_in/repo (scripts/plugin-eval-record.mjs から回す)" >&2
  exit 1
fi
cp -R "$stand_in/repo/." .
git remote set-url origin "$PWD/.git/fork.git"
