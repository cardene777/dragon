#!/bin/bash
# editor 全 4 層 test を まとめ実行 + summary 出力する dashboard script。
#
# 使い方:
#   pnpm test:editor         # 全 4 層一括
#   pnpm test:editor --layer 2  # 特定 layer のみ
#
# 前提:
#   - dev server (`ports.ts` の `DEV_URL`) 起動済
#   - AI_VERIFY_BASE_URL env 変数で URL override 可 (default は `ports.ts` の `DEV_URL`)
#     spec 側へは `SPA_URL` として渡す = 見に行く先は playwright.config.ts が 1 箇所で持つ

set -e
set -o pipefail
cd "$(dirname "$0")/.."

# 設定と同じ `ports.ts` から既定 URL を読む。 ここに数字を複製すると、 port を変えた時に
# dashboard だけ古い server を見続け、今回と同じ不整合が戻る。
DEFAULT_URLS="$(pnpm exec tsx -e 'import { DEV_URL, PREVIEW_URL } from "./ports.ts"; process.stdout.write(`${DEV_URL}\n${PREVIEW_URL}`)')"
DEFAULT_DEV_URL="${DEFAULT_URLS%%$'\n'*}"
DEFAULT_PREVIEW_URL="${DEFAULT_URLS#*$'\n'}"

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

BASE_URL="${AI_VERIFY_BASE_URL:-$DEFAULT_DEV_URL}"
LAYER_FILTER="${LAYER:-all}"

# server が落ちていると E2E が全滅するが、 失敗理由が assertion に見えて原因を追いにくい
# (実測 = ERR_CONNECTION_REFUSED が 1 件だけ混ざり、 test の欠陥と誤認した)。
# 先に疎通を確認して、 落ちていれば理由を明示して止める。
require_server() {
  local url="$1" label="$2"
  local code
  code="$(curl -s -o /dev/null -w '%{http_code}' --max-time 5 "$url" 2>/dev/null || echo 000)"
  if [[ "$code" != "200" ]]; then
    echo "✗ $label が応答しない (HTTP $code)" >&2
    echo "  URL = $url" >&2
    echo "  起動 = cd apps/playground-spa && npm run dev  (本番検証は npm run build && npm run preview)" >&2
    exit 1
  fi
}

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
echo "  LAYER    = $LAYER_FILTER (all / 1 / 2 / 3 / 4 / 5)"
echo "═══════════════════════════════════════════════════════════"

RESULT_L1="skip"
RESULT_L2="skip"
RESULT_L3="skip"
RESULT_L4="skip"
COUNT_L1=0
COUNT_L2=0
COUNT_L3=0
COUNT_L4=0
RESULT_L5="skip"
COUNT_L5=0

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
  echo "  Layer 2 = diagram scale pure test"
  echo "───────────────────────────────────────────────────────────"
  if npx vitest run src/lib/diagram-scale.test.ts 2>&1 | tee "$LOG_DIR/editor-test-l2.log"; then
    RESULT_L2="pass"
  else
    RESULT_L2="fail"
  fi
  COUNT_L2="$(extract_count "$LOG_DIR/editor-test-l2.log" 'Tests[[:space:]]+[0-9]+ passed')"
fi

if [[ "$LAYER_FILTER" == "all" || "$LAYER_FILTER" == "3" || "$LAYER_FILTER" == "4" ]]; then
  require_server "$BASE_URL/editor" "dev server"
fi

if [[ "$LAYER_FILTER" == "all" || "$LAYER_FILTER" == "3" ]]; then
  echo ""
  echo "───────────────────────────────────────────────────────────"
  echo "  Layer 3 = Playwright E2E core editor rendering"
  echo "───────────────────────────────────────────────────────────"
  # **group 分割はやめた** (#1339)。 分けていたのは 1 回で 100 件超を回すと browser が
  # メモリ不足で落ちるためだったが、`#923` で図の直接操作を外した際に group A の 7 spec が
  # 全て消え、残ったのは group B の 5 spec だけになった。 100 件に届かないので分ける理由が無い。
  L3_SPECS=(
    tests/editor-all-types.spec.ts
    tests/ethereum.spec.ts
    tests/editor-stage-svg.spec.ts
    tests/editor-initial-animation.spec.ts
    tests/editor-yaml-tab.spec.ts
  )
  RESULT_L3="pass"
  : > "$LOG_DIR/editor-test-l3.log"
  echo "  --- ${#L3_SPECS[@]} spec ---"
  if SPA_URL="$BASE_URL" npx playwright test "${L3_SPECS[@]}" --reporter=list --timeout=45000 2>&1 | tee -a "$LOG_DIR/editor-test-l3.log"; then
    :
  else
    RESULT_L3="fail"
  fi
  COUNT_L3="$(grep -oE '^[[:space:]]*[0-9]+ passed' "$LOG_DIR/editor-test-l3.log" 2>/dev/null | grep -oE '[0-9]+' | awk '{s+=$1} END{print s+0}')"
fi

if [[ "$LAYER_FILTER" == "all" || "$LAYER_FILTER" == "4" ]]; then
  echo ""
  echo "───────────────────────────────────────────────────────────"
  echo "  Layer 4 = visual regression (4 baseline snapshot)"
  echo "───────────────────────────────────────────────────────────"
  if SPA_URL="$BASE_URL" npx playwright test tests/editor-visual.spec.ts --reporter=list --timeout=60000 2>&1 | tee "$LOG_DIR/editor-test-l4.log"; then
    RESULT_L4="pass"
  else
    RESULT_L4="fail"
  fi
  COUNT_L4="$(extract_count "$LOG_DIR/editor-test-l4.log" '^[[:space:]]*[0-9]+ passed')"
fi

if [[ "$LAYER_FILTER" == "all" || "$LAYER_FILTER" == "5" ]]; then
  echo ""
  echo "───────────────────────────────────────────────────────────"
  echo "  Layer 5 = 本番 build + a11y (公開前ゲート)"
  echo "───────────────────────────────────────────────────────────"
  # 本番 build は base path (/dragon/) が付き code split も効くため dev とは経路が違う。
  # PROD_BASE_URL 未設定時は skip = dev だけ回したい時に落とさない。
  if [[ -z "${PROD_BASE_URL:-}" ]]; then
    echo "  (PROD_BASE_URL 未設定のため skip。 本番検証は npm run build && npm run preview の後に"
    echo "   PROD_BASE_URL=$DEFAULT_PREVIEW_URL で再実行する)"
    RESULT_L5="skip"
  else
    require_server "$PROD_BASE_URL/editor" "本番 preview"
    if npx playwright test tests/prod-check.spec.ts tests/a11y-check.spec.ts tests/final-check.spec.ts --reporter=list --timeout=45000 2>&1 | tee "$LOG_DIR/editor-test-l5.log"; then
      RESULT_L5="pass"
    else
      RESULT_L5="fail"
    fi
    COUNT_L5="$(extract_count "$LOG_DIR/editor-test-l5.log" '^[[:space:]]*[0-9]+ passed')"
  fi
fi

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "  SUMMARY"
echo "═══════════════════════════════════════════════════════════"
printf "  %-40s %-6s %s\n" "Layer 1 = geometry / DSL parse (fast)" "$RESULT_L1" "$COUNT_L1 tests"
printf "  %-40s %-6s %s\n" "Layer 2 = diagram scale (fast)"        "$RESULT_L2" "$COUNT_L2 tests"
printf "  %-40s %-6s %s\n" "Layer 3 = core editor E2E (medium)"    "$RESULT_L3" "$COUNT_L3 tests"
printf "  %-40s %-6s %s\n" "Layer 4 = visual regression (slow)"    "$RESULT_L4" "$COUNT_L4 tests"
printf "  %-40s %-6s %s\n" "Layer 5 = 本番 build + a11y"            "$RESULT_L5" "$COUNT_L5 tests"
echo "═══════════════════════════════════════════════════════════"

if [[ "$RESULT_L1" == "fail" || "$RESULT_L2" == "fail" || "$RESULT_L3" == "fail" || "$RESULT_L4" == "fail" || "$RESULT_L5" == "fail" ]]; then
  echo "  ✗ overall = FAIL"
  echo "═══════════════════════════════════════════════════════════"
  exit 1
else
  echo "  ✓ overall = PASS"
  echo "═══════════════════════════════════════════════════════════"
  exit 0
fi
