/**
 * 版に入る commit が変更履歴から辿れること (#1277)。
 *
 * `0.8.0` を切る時点で **55 commit のうち 43 件が変更履歴に載っていなかった**。
 * 既存の `changelog-covers-notation.test.ts` (#1206) は「記法に書ける項目」 と
 * 「cdl の依存の版」 が載っているかだけを見るため、commit の記載漏れは素通りする。
 *
 * ## 何を見るか
 *
 * 前の版から HEAD までの各 commit について、その commit が持つ番号 (`(#N)`) のどれかが
 * **変更履歴に載っている** か **「利用者から見えない」 と宣言されている** ことを見る。
 *
 * commit が持つ番号は Issue と PR の両方で、どちらで書いても辿れる = 変更履歴は Issue で
 * 書くことが多いのに、PR 番号だけを求めると書き方を縛ることになる。
 *
 * ## 宣言は両方向で見る
 *
 * 宣言に「実際には範囲に無い番号」 が残ると、消えた commit の宣言が残り続ける。
 * 同じ番号が別の変更で再び現れた時に黙って除外されるので、そちらも落とす。
 */
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { describe, it, expect } from "vitest";

const ここ = dirname(fileURLToPath(import.meta.url));
const REPO = join(ここ, "..", "..", "..");
const CHANGELOG = readFileSync(join(REPO, "CHANGELOG.md"), "utf8");
const 版 = (JSON.parse(readFileSync(join(ここ, "..", "package.json"), "utf8")) as { version: string })
  .version;

const git = (...args: string[]): string =>
  execFileSync("git", ["-C", REPO, ...args], { encoding: "utf8" }).trim();

/**
 * 前の版の位置。
 *
 * **いま切ろうとしている版の tag は使わない** (Round 1 の指摘)。 使うと `v0.8.0` を
 * 打った直後に `v0.8.0..HEAD` が空になり、検査が何も見なくなる。
 *
 * 1 つ前の版の tag があればそれを使う。 **無い時は版を最後に変えた commit へ落とす** =
 * この repo は tag を 1 つも持たない状態で 55 commit 積んだ実績があり、tag が無いと
 * 検査ごと止まる形にすると同じことが起きる。
 */
/** 版を最後に変えた commit。 tag が無い時の起点に使う */
function 版を上げたcommit(): string | undefined {
  return git("log", "--format=%H", `-S"version": "${版}"`, "--", "packages/dragon/package.json")
    .split("\n")
    .filter((l) => l !== "")
    .pop();
}

/**
 * いま切ろうとしている版に属する tag か。
 *
 * `v0.8.0` だけでなく `v0.8.0-rc1` のような前触れの tag も含む (Round 2 の指摘)。
 * 含めないと、前触れを前の版とみなして範囲がその後ろだけに縮む。
 */
function 今の版のtag(tag: string): boolean {
  return tag === `v${版}` || tag.startsWith(`v${版}-`);
}

function 前の版(): string {
  const 前 = git("tag", "--list", "v*", "--sort=-v:refname")
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l !== "" && !今の版のtag(l))[0];
  if (前) return 前;
  const 上げた = 版を上げたcommit();
  if (!上げた) throw new Error(`版 ${版} へ上げた commit が見つからない`);
  // **その commit 自身も範囲に含める** = 版を上げたcommit は次の版の一部で、
  // `..` は始点を含まないため 1 件取りこぼす
  return `${上げた}^`;
}

/**
 * 履歴が切り詰められていないか (Round 1 の指摘)。
 *
 * `--depth 1` の clone では版を変えた commit を辿れず、範囲が空になって検査が通ってしまう。
 * **通してはいけない** ので、その場で止めて理由を出す。
 */
function 履歴が揃っている(): void {
  const shallow = git("rev-parse", "--is-shallow-repository");
  if (shallow === "true") {
    throw new Error(
      "履歴が切り詰められている (shallow clone)。 版の範囲を導けないため検査できない。 " +
        "`git fetch --unshallow` で完全な履歴を取ってから実行する",
    );
  }
}

/** 変更履歴のうち、いま切ろうとしている版の節 */
function 版の節(): string {
  const 始 = CHANGELOG.indexOf(`## [${版}]`);
  if (始 < 0) throw new Error(`変更履歴に [${版}] の節が無い`);
  const 次 = CHANGELOG.indexOf("\n## [", 始 + 1);
  return CHANGELOG.slice(始, 次 < 0 ? undefined : 次);
}

/**
 * 利用者から見えない commit。 変更履歴に書かない代わりにここへ理由付きで宣言する。
 *
 * **書かない判断も残す**。 宣言が無いと「書き忘れ」 と「書かないと決めた」 が区別できない。
 *
 * ## 書く番号は PR 番号 (#1279)
 *
 * squash merge した commit の件名は **PR の題 + PR 番号** になるため、branch 上で
 * `(#1277)` (Issue 番号) だった commit は取り込み後に `(#1278)` になる。
 * Issue 番号で宣言すると、取り込んだ瞬間に「範囲に無い宣言」 として落ちる (実際に踏んだ)。
 *
 * PR を作った後に宣言を書き、**PR 番号を使う**。
 *
 * その番号は取り込むまで範囲に現れないので、`宣言が実物の範囲に残っている` は
 * **範囲の最大より大きい番号を「これから入るもの」 として通す**。 古くなった宣言
 * (範囲の最大より小さいのに範囲に無い) だけを落とす。
 *
 * 併せて **範囲の終端は `main`** にしてある (下記)。 作業中の branch の commit は
 * squash で件名が変わるため、範囲に入れると取り込み前後で必ず食い違う。
 */
const 利用者から見えない: Record<string, string> = {
  "1208": "spec の例を分けただけ。 記法も出力も変わらない",
  "1210": "変更履歴そのものの更新",
  "1211": "spec の注記を実際の原因に合わせただけ",
  "1212": "検査が判定に到達していなかったのを直した。 出力は変わらない",
  "1214": "検査の判定材料から badge を外した。 出力は変わらない",
  "1235": "spec の記述が実装と食い違っていたのを直しただけ",
  "1245": "一致検査に比べる軸を足した。 出力は変わらない",
  "1270": "組み立て 3 経路の死んだ受け渡しを外した。 出力は 98 形で 1 文字も変わらない",
  "1278": "版を切る commit そのもの。 変更履歴の更新が中身",
  "1280": "宣言に書く番号を PR 番号へ直した commit。 記法も出力も変わらない",
};

/**
 * 範囲の終端。 **`main` にする** (#1279)。
 *
 * 作業中の branch の commit は squash merge で件名が変わる (Issue 番号 → PR 番号) ため、
 * 範囲に入れると取り込み前と後で必ず食い違う。 版に入るのは `main` に載ったものなので、
 * そこまでを見れば足りる。
 *
 * `main` が無い環境 (単独 clone の別 branch 等) では `HEAD` に落とす。
 */
function 終端(): string {
  // `rev-parse --verify` は無い時に非 0 で終わるので、例外を握って `HEAD` に落とす
  try {
    git("rev-parse", "--verify", "main^{commit}");
    return "main";
  } catch {
    return "HEAD";
  }
}

describe("版に入る commit が変更履歴から辿れる (#1277)", () => {
  履歴が揃っている();
  const 範囲 = `${前の版()}..${終端()}`;
  const commit = git("log", "--format=%s", 範囲)
    .split("\n")
    .filter((l) => l !== "");

  it("commit を 1 件以上集められている", () => {
    // 集められていなければ、以下の検査は通って当然になる
    expect(commit.length, `${範囲} の commit が 1 件も無い (検査が空振りしている)`).toBeGreaterThan(0);
  });

  it("全ての commit が変更履歴か宣言のどちらかから辿れる", () => {
    const 載っている = new Set([...版の節().matchAll(/#(\d+)/g)].map((m) => m[1]!));
    const 辿れない = commit.filter((s) => {
      const 番号 = [...s.matchAll(/#(\d+)/g)].map((m) => m[1]!);
      return !番号.some((n) => 載っている.has(n) || n in 利用者から見えない);
    });
    expect(辿れない, "変更履歴にも宣言にも無い commit がある").toEqual([]);
  });

  it("宣言が実物の範囲に残っている", () => {
    // 宣言が古くなったまま残らないようにする。 同じ番号が別の変更で再び現れた時に
    // 黙って除外されるのを防ぐ
    const 範囲の番号 = new Set(commit.flatMap((s) => [...s.matchAll(/#(\d+)/g)].map((m) => m[1]!)));
    expect(範囲の番号.size, "commit から番号を 1 つも読めていない (検査が空振りしている)").toBeGreaterThan(0);
    // **範囲の最大より大きい番号は通す** = 取り込む前の PR 番号を宣言に書けるようにする。
    // 落としたいのは古くなった宣言なので、小さい側だけを見れば足りる
    const 最大 = Math.max(...[...範囲の番号].map((n) => Number(n)));
    const 古い宣言 = Object.keys(利用者から見えない).filter(
      (n) => !範囲の番号.has(n) && Number(n) < 最大,
    );
    expect(古い宣言, "宣言に、この版の範囲から消えた番号がある").toEqual([]);
  });

  it("版を上げた commit が範囲に入っている", () => {
    // **範囲を狭める向きの誤りは、上の検査では捕まらない** (Round 1 の指摘)。
    // 覆う対象が減るだけなので「全て辿れる」 は通ってしまう。 下端を直接固定する。
    //
    // **tag を使っている時も見る** (Round 2 の指摘)。 前の版の tag から測っても、版を
    // 上げた commit はその後ろにあるので範囲に入るはず。 入らないなら起点が誤っている
    const 上げた = 版を上げたcommit();
    expect(上げた, "版を上げた commit が見つからない (検査が空振りしている)").toBeDefined();
    if (!上げた) return;
    const 範囲のsha = new Set(git("log", "--format=%H", 範囲).split("\n").filter((l) => l !== ""));
    expect(範囲のsha.size, "範囲の commit を 1 件も読めていない (検査が空振りしている)").toBeGreaterThan(0);
    expect(範囲のsha.has(上げた), "版を上げた commit が範囲から漏れている").toBe(true);
  });

  it("宣言に理由が書かれている", () => {
    const 理由なし = Object.entries(利用者から見えない).filter(([, v]) => v.trim() === "");
    expect(理由なし, "宣言に理由の無い項目がある").toEqual([]);
  });
});
