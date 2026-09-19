import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
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
 * 履歴として残したと自分で宣言している印 (#2264)。
 *
 * 仕様書は先頭で `status` を名乗る決まりで、`superseded` は
 * 「別の文書に置き換わったが、当時の検討を残すために置いてある」 ことを指す。
 * 実際に `spec-widgets-syntax.md` は「本 file は履歴として残している」 と本文にも書く。
 */
const 履歴の印 = /^\*\*status\*\*\s*=\s*superseded\b/mu;

/**
 * 履歴として残した説明書かどうか。
 *
 * **中身の宣言で決める**。 file 名や置き場所で決めると、印を書いた文書が増えても
 * 一覧を書き換えるまで外れない (`いまを述べないfile` は名前で決める形なので、
 * 変更履歴のように名前が決まっているものだけを持つ)。
 */
export function 履歴として残したfile(path: string): boolean {
  try {
    return 履歴の印.test(readFileSync(path, "utf8"));
  } catch {
    // 読めない file は「履歴ではない」 側に倒す = 走査の母数から黙って消えないようにする
    return false;
  }
}

/**
 * いまの実物を述べている説明書の絶対 path (#2264)。
 *
 * `説明書のfile` から、履歴として残したと宣言している md を外す。
 * 当時の数や一覧がそのまま書いてあるのが正しい文書なので、
 * 「いまの実物と合っているか」 を見る判定の母数に入れない。
 *
 * **見本が組み立つかのような、いまを問わない判定は `説明書のfile` のままにする**。
 * 履歴の文書に書いた見本も組み立てられるべきで、外すと母数が減るだけになる。
 */
export function いまを述べる説明書(repo: string): string[] {
  return 説明書のfile(repo).filter((p) => !履歴として残したfile(p));
}

/**
 * いまの実物を述べていない file と、外す理由 (#2246)。
 *
 * **理由を entry の隣に置く**。 外す file の一覧と理由を別の場所に分けると、
 * 片方だけ直って食い違う。 理由が空の entry は `scan-targets.test.ts` が落とす。
 */
export const いまを述べないfile: Record<string, string> = {
  "CHANGELOG.md": "その版で何が起きたかの記録。 過去の版の記述で、いまの実物を指す文ではない",
  "pnpm-lock.yaml":
    "機械が書く一覧。 依存の依存まで全ての名前を持つので、人が述べた文として数えない",
};

/**
 * いまの実物を述べている file の絶対 path。
 *
 * 「書いた綴りが実物に在るか」 のように、**置き場所も拡張子も限れない判定**が使う。
 * package 名は説明書にも source にも `.github` 配下の用紙 (YAML) にも書けるので、
 * 見る先を挙げた瞬間に書き手が思い付いた場所が上限になる (#2236 / #2242)。
 *
 * 中身が文字でない file (画像など) は、読む側が 1 つ目の 0 byte を見て落とす。
 * 拡張子を並べて外す形にすると、並べ忘れた形式がそのまま母数から消える。
 */
export function いまを述べるfile(repo: string): string[] {
  return 絶対path(
    repo,
    走査するfile(repo).filter((p) => !(basename(p) in いまを述べないfile)),
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
