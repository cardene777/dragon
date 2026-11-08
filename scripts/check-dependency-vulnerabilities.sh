#!/usr/bin/env bash
# 束ねた依存に既知の脆弱性が残っていないかを 1 つの command で見る (#1642)。
#
# 週に 1 度の監査だけでは、依存を上げた直後の検出に追いつかない (実測 = 1 週間で 112 の
# 取り込みがあり、その間に新しい 2 package が入った)。 依存を上げたらこれを走らせる。
#
# 版を動かせない脆弱性は `osv-scanner.toml` に理由と期限つきで記録する。
# 記録した分は検出から外れるので、この command は 0 で終わる。 書き方は `docs/maintaining.md` の「版を動かせない時は受容記録に残す」 を見る。
#
# 使い方
#   bash scripts/check-dependency-vulnerabilities.sh            # repo 全体を見る
#   bash scripts/check-dependency-vulnerabilities.sh <dir>      # 別の場所を見る (検査用)
#
# 終了状態
#   0 = 検出なし
#   1 = 検出あり (出力に一覧が出る)
#   2 = 走らせられない (osv-scanner が無い / 見る場所が無い / 走査そのものが失敗した)
#   3 = 検出は無いが、受容記録に今の依存のどれにも当たらない記録が残っている (#3072、#3498)
#
# 版を出す前の一式 (`.ikkan/checks.md`) が最後にこれを 1 回走らせ、0 で終わることを確かめる (#3498)。
# 外の脆弱性の一覧に問い合わせるので、1 件 10 秒の上限がある検査の中では走らせない。
#
# **検出ありと走らせられないを同じ 1 にしない**。 道具が入っていないだけの時に「脆弱性が
# 見つかった」 と読まれると、直す先が違う方へ向かう。
#
# 変数名を英字にしているのは bash が多 byte の識別子を受けないため (実測 =
# `対象=...` が `No such file or directory` になる)。 説明は日本語で書く。
set -uo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
target="${1:-$repo_root}"

if ! command -v osv-scanner > /dev/null 2>&1; then
  echo "osv-scanner が見つからない。 \`brew install osv-scanner\` で入れる" >&2
  exit 2
fi

if [ ! -d "$target" ]; then
  echo "見る場所が無い: $target" >&2
  exit 2
fi

# `--config` を明示する = 既定では見る場所の `osv-scanner.toml` を読むため、別の場所を
# 見る時 (検査用の脆弱な束ね) に受容記録が読まれず検出がそのまま出る。
# 明示しておけば、どこを見ても同じ受容記録で判定できる。
config="$repo_root/osv-scanner.toml"
args=(scan source -r "$target")
[ -f "$config" ] && args+=(--config "$config")

output="$(osv-scanner "${args[@]}" 2>&1)"
status=$?

echo "$output"

# osv-scanner は検出ありで 1、検出なしで 0 を返す。 それ以外 (走査そのものの失敗) は
# 検出と区別して 2 に倒す。
case "$status" in
  0)
    # osv-scanner は使われない受容記録を終了状態に出さず、`<toml> has unused ignores:` の行でしか知らせない。
    # 直る版が出て依存を上げた後も記録が残ると、外す理由の無い検出の外し方が積み上がるので、検出と別の 3 で止める
    if printf '%s\n' "$output" | grep -q 'has unused ignores:'; then
      echo "受容記録に、今の依存に当たらない記録が残っている。上の一覧の id を \`osv-scanner.toml\` から外す" >&2
      exit 3
    fi
    exit 0
    ;;
  1) exit 1 ;;
  *)
    echo "osv-scanner が走査に失敗した (終了状態 $status)" >&2
    exit 2
    ;;
esac
