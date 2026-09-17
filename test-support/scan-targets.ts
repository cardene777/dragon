import { execFileSync } from "node:child_process";
import { join } from "node:path";

/**
 * 走査する検査が集める file の一覧 (#2095)。
 *
 * ## 未追跡の file も返す
 *
 * `git ls-files` だけを見ると、**追跡される前の file は一覧に入らない**。
 * 書き方を見張る検査はそこに落ちる = 書いている最中は自分も新しい file も判定を受けず、
 * 取り込んだ回で初めて落ちる。 2026-09-17 に 2 回踏んだ (#2092 / #2089)。
 *
 * `--others --exclude-standard` を足すと、無視設定 (`.gitignore`) を尊重したまま
 * 未追跡の file が入る。 配布物 (`dist`) や `.context/` は無視設定に載っているので入らない。
 *
 * ## 追跡のみに留めたい検査もある
 *
 * 「repo に残っているもの」 を見る検査は、手元で作った file を対象にしてはいけない。
 * その時は `追跡しているfile` を呼び、**なぜ未追跡を外すかを呼び出しの場所に書く**。
 *
 * ## 参照を探す処理には使えない
 *
 * `git grep` は追跡している file しか読まない。 「名指しされているか」 を見る検査は、
 * 対象の一覧をここから取り、参照の有無は `git grep` で見る形になる (対象は広く、参照は狭く)。
 */

/**
 * git の一覧を引いて、空行を落とした一覧を返す。
 *
 * `core.quotePath=false` を渡すのは、既定では ASCII 以外を含む path が
 * `"\350\277\275..."` の形で返るため。 この repo は日本語の file 名を持つ検査を書けるので、
 * 返り値をそのまま `readFileSync` に渡せる形に揃える。
 */
function ls(repo: string, 追加: readonly string[], glob: readonly string[]): string[] {
  return execFileSync(
    "git",
    ["-C", repo, "-c", "core.quotePath=false", "ls-files", ...追加, ...glob],
    { encoding: "utf8" },
  )
    .split("\n")
    .filter((p) => p !== "");
}

/**
 * 追跡している file だけを返す。
 *
 * 呼ぶ時は、なぜ未追跡を外すかを呼び出しの場所に書く。 書かずに使うと、
 * 「未追跡を入れ忘れた」 のか「意図して外した」 のかが読み手に分からない。
 */
export function 追跡しているfile(repo: string, ...glob: string[]): string[] {
  return ls(repo, [], glob);
}

/** 未追跡だが無視されていない file だけを返す */
export function 未追跡のfile(repo: string, ...glob: string[]): string[] {
  return ls(repo, ["--others", "--exclude-standard"], glob);
}

/**
 * 追跡している file と、未追跡だが無視されていない file をまとめて返す。
 *
 * 重複は落とし、並びは path 順に揃える (落ちた時の出力が実行ごとに変わらないようにする)。
 */
export function 走査するfile(repo: string, ...glob: string[]): string[] {
  return [...new Set([...ls(repo, [], glob), ...未追跡のfile(repo, ...glob)])].sort();
}

/** `走査するfile` が返した path を、絶対 path に直す */
export function 絶対path(repo: string, 相対: readonly string[]): string[] {
  return 相対.map((p) => join(repo, p));
}
