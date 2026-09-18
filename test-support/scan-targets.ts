import { execFileSync } from "node:child_process";
import { basename, join } from "node:path";

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

/**
 * 説明書として走査しない md。
 *
 * 変更履歴は「その版で何が起きたか」 を書く場所で、決めた日の記録そのもの。
 * 今を指す数として読むと、過去の版の記述を今の実物に合わせて書き換えることになる。
 *
 * **ここが唯一の置き場所** (#2240)。 同じ集合を検査ごとに組み立てていた間、
 * 2 本が同じ 1 行を持っており、片方に外す md を足しても もう片方は見続ける形だった。
 */
const 説明書として走査しない = new Set(["CHANGELOG.md"]);

/**
 * 説明書として走査する md の絶対 path。
 *
 * **置き場所を名指ししない** (`rules/quality.md § 全件走査は除外を書く`)。
 * 見る先を挙げる形は、書き手が思い付いた場所が上限になる。 #1801 は意匠帳だけを見て
 * 紹介文を落とし、#1803 は `docs/` と `.claude/` と根の直下を挙げて
 * **配る package の説明書** (`packages/dragon/README.md` と `examples/`) を落とした (#2236)。
 */
export function 説明書のfile(repo: string): string[] {
  return 絶対path(
    repo,
    走査するfile(repo, "*.md").filter((p) => !説明書として走査しない.has(basename(p))),
  );
}

/**
 * 注釈を読む source の拡張子。
 *
 * **`.mjs` と `.mts` を入れる** (#2242)。 入れていなかった間、`scripts/` の 26 file を
 * 1 つも見ておらず、撮影の道具の注釈に古い件数が 3 つ残っていた
 * (catalog の図を 328 件、分類を 8 と書いており、実物は分類だけで 11)。
 *
 * 注記を見る検査 (`notes-no-review-finding-id` / `notes-no-this-pr-reference`) は
 * 最初からこの 4 つを見ており、**同じ「source の注釈を読む」 目的で集合が 2 通りあった**。
 */
const 注釈を読む拡張子 = ["*.ts", "*.tsx", "*.mts", "*.mjs"];

/**
 * 注釈を読む source の絶対 path。
 *
 * 注釈の言い回しを見る検査が使う。 入口を並べていた頃は `test-support/` と根の設定 file と
 * 意匠帳の見本が外に残っており、そこに書いた注釈は止まらなかった (#2238)。
 */
export function 注釈を読むfile(repo: string): string[] {
  return 絶対path(repo, 走査するfile(repo, ...注釈を読む拡張子));
}

/**
 * 注釈を読む source のうち、追跡しているものだけ。
 *
 * 「repo に残っているもの」 を数える検査が使う。 手元で作った file を母数に入れると、
 * 作業中の file が判定に混ざる。
 */
export function 追跡している注釈を読むfile(repo: string): string[] {
  return 絶対path(repo, 追跡しているfile(repo, ...注釈を読む拡張子));
}

/** 注釈を読む source のうち、未追跡だが無視されていないもの */
export function 未追跡の注釈を読むfile(repo: string): string[] {
  return 絶対path(repo, 未追跡のfile(repo, ...注釈を読む拡張子));
}
