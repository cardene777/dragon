#!/bin/bash
# editor 全 4 層 test を まとめ実行 + summary 出力する dashboard script。
#
# 使い方:
#   pnpm test:editor         # 全 4 層一括
#   pnpm test:editor --layer 2  # 特定 layer のみ
#
# 前提:
#   - dev server (localhost:4323) 起動済
#   - AI_VERIFY_BASE_URL env 変数で URL override 可 (default localhost:4323)

set -e
set -o pipefail
cd "$(dirname "$0")/.."

# CAR-2158 = /tmp log の並列 collision fix。 実行ごとに固有 dir を作り、 終了時に必ず消す。
LOG_DIR="$(mktemp -d "${TMPDIR:-/tmp}/editor-test.XXXXXX")"
trap 'rm -rf -- "$LOG_DIR"' EXIT

# vitest / playwright が失敗した時、 summary の件数抽出 (grep) は 0 match で exit 1 を返す。
# `set -e` 下でそれを素の代入に書くと dashboard が summary を出す前に落ちる = silent red になる。
# 抽出は必ず本 helper 経由にして、 失敗時は 0 を返す。
extract_count() {
  local log_file="$1" pattern="$2" n
  n="$(grep -oE "$pattern" "$log_file" 2>/dev/null | grep -oE '[0-9]+' | head -1 || true)"
  echo "${n:-0}"
}

BASE_URL="${AI_VERIFY_BASE_URL:-http://localhost:4323}"
LAYER_FILTER="${LAYER:-all}"

# 引数 parse
while [[ $# -gt 0 ]]; do
  case "$1" in
    --layer) LAYER_FILTER="$2"; shift 2 ;;
    *) shift ;;
  esac
done

echo "═══════════════════════════════════════════════════════════"
echo "  editor 4 層 test dashboard"
echo "  BASE_URL = $BASE_URL"
echo "  LAYER    = $LAYER_FILTER (all / 1 / 2 / 3 / 4)"
echo "═══════════════════════════════════════════════════════════"

RESULT_L1="skip"
RESULT_L2="skip"
RESULT_L3="skip"
RESULT_L4="skip"
COUNT_L1=0
COUNT_L2=0
COUNT_L3=0
COUNT_L4=0

if [[ "$LAYER_FILTER" == "all" || "$LAYER_FILTER" == "1" ]]; then
  echo ""
  echo "───────────────────────────────────────────────────────────"
  echo "  Layer 1 = geometry / DSL parse unit test (overlay-dsl)"
  echo "───────────────────────────────────────────────────────────"
  if npx vitest run src/lib/overlay-dsl.test.ts 2>&1 | tee "$LOG_DIR/editor-test-l1.log"; then
    RESULT_L1="pass"
  else
    RESULT_L1="fail"
  fi
  COUNT_L1="$(extract_count "$LOG_DIR/editor-test-l1.log" 'Tests[[:space:]]+[0-9]+ passed')"
fi

if [[ "$LAYER_FILTER" == "all" || "$LAYER_FILTER" == "2" ]]; then
  echo ""
  echo "───────────────────────────────────────────────────────────"
  echo "  Layer 2 = state machine + align pure test"
  echo "───────────────────────────────────────────────────────────"
  if npx vitest run src/lib/overlay-reducer.test.ts src/lib/overlay-align.test.ts src/lib/text-edit-replace.test.ts src/lib/overlay-duplicate.test.ts src/lib/cdl-actor-move.test.ts src/lib/cdl-actor-move-layout.test.ts 2>&1 | tee "$LOG_DIR/editor-test-l2.log"; then
    RESULT_L2="pass"
  else
    RESULT_L2="fail"
  fi
  COUNT_L2="$(extract_count "$LOG_DIR/editor-test-l2.log" 'Tests[[:space:]]+[0-9]+ passed')"
fi

if [[ "$LAYER_FILTER" == "all" || "$LAYER_FILTER" == "3" ]]; then
  echo ""
  echo "───────────────────────────────────────────────────────────"
  echo "  Layer 3 = Playwright E2E flagship + cdl element selection"
  echo "───────────────────────────────────────────────────────────"
  if AI_VERIFY_BASE_URL="$BASE_URL" npx playwright test tests/editor-flagship.spec.ts tests/editor-cdl-element-selection.spec.ts tests/editor-cdl-resize.spec.ts tests/editor-selection-grouping.spec.ts tests/editor-miro-features.spec.ts tests/editor-figma-features.spec.ts tests/editor-cdl-selection-text-edit.spec.ts --reporter=list --timeout=45000 2>&1 | tee "$LOG_DIR/editor-test-l3.log"; then
    RESULT_L3="pass"
  else
    RESULT_L3="fail"
  fi
  COUNT_L3="$(extract_count "$LOG_DIR/editor-test-l3.log" '^[[:space:]]*[0-9]+ passed')"
fi

if [[ "$LAYER_FILTER" == "all" || "$LAYER_FILTER" == "4" ]]; then
  echo ""
  echo "───────────────────────────────────────────────────────────"
  echo "  Layer 4 = visual regression (4 baseline snapshot)"
  echo "───────────────────────────────────────────────────────────"
  if AI_VERIFY_BASE_URL="$BASE_URL" npx playwright test tests/editor-visual.spec.ts --reporter=list --timeout=60000 2>&1 | tee "$LOG_DIR/editor-test-l4.log"; then
    RESULT_L4="pass"
  else
    RESULT_L4="fail"
  fi
  COUNT_L4="$(extract_count "$LOG_DIR/editor-test-l4.log" '^[[:space:]]*[0-9]+ passed')"
fi

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "  SUMMARY"
echo "═══════════════════════════════════════════════════════════"
printf "  %-40s %-6s %s\n" "Layer 1 = geometry / DSL parse (fast)" "$RESULT_L1" "$COUNT_L1 tests"
printf "  %-40s %-6s %s\n" "Layer 2 = state machine (fast)"        "$RESULT_L2" "$COUNT_L2 tests"
printf "  %-40s %-6s %s\n" "Layer 3 = E2E flagship (medium)"       "$RESULT_L3" "$COUNT_L3 tests"
printf "  %-40s %-6s %s\n" "Layer 4 = visual regression (slow)"    "$RESULT_L4" "$COUNT_L4 tests"
echo "═══════════════════════════════════════════════════════════"

if [[ "$RESULT_L1" == "fail" || "$RESULT_L2" == "fail" || "$RESULT_L3" == "fail" || "$RESULT_L4" == "fail" ]]; then
  echo "  ✗ overall = FAIL"
  echo "═══════════════════════════════════════════════════════════"
  exit 1
else
  echo "  ✓ overall = PASS"
  echo "═══════════════════════════════════════════════════════════"
  exit 0
fi
