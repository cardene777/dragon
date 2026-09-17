import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { 走査するfile } from "../../../test-support/scan-targets";

/**
 * 注記と検査の題が、いま出している変更を指す書き方を持たないことの検証 (#2081)。
 *
 * 探すのは「本」 と `PR` を並べた形。 書いている間はその字で自分の変更を指せるが、取り込んだ後の
 * 読み手はどの変更かを辿れない。 辿れたとしても、注記が説明すべきなのは「何を直したか」 ではなく
 * 「今どう動くか」 なので、読んでも仕様が読み取れない。 実測では 10 か所 / 9 file が残っていた。
 *
 * ## 探す字は繋いで作る
 *
 * この file に通しの綴りを書くと、自分自身が検出されて宣言が 1 件増える。 繋いだ形なら
 * 走査対象に入ったままでも自分を拾わない (`screen-words.test.ts` が同じ形を採っている)。
 *
 * ## 持ってよい箇所は理由と一緒に宣言する
 *
 * 変更履歴の書き方を説明する検査は、commit の件名の例として この字を文字列の中に写す。
 * 例外を別の場所に書くと片方だけ直って食い違うので、宣言と理由を同じ表に置く。
 */

const ここ = dirname(fileURLToPath(import.meta.url));
const REPO = join(ここ, "..", "..", "..");

/** 探す字 (「本」 と `PR` を並べた形、間の空白は有無を問わない) */
const 探す字 = new RegExp(["本", "\\s?", "PR"].join(""), "u");

/** 探す字を持ってよい file と、その理由 */
const 例外: Record<string, string> = {
  "packages/dragon/test/changelog-covers-commits.test.ts":
    "変更履歴に書く commit の件名の例として、文字列の中に写している (注記が自分の変更を指しているのではない)",
};

/**
 * 走査対象 = 追跡している `ts` / `tsx` / `mts` / `mjs` と、未追跡だが無視されていない同じ拡張子。
 *
 * 集め方は `test-support/scan-targets.ts` が 1 か所で持つ (#2095)。
 * 配布物 (`dist`) は無視設定に載っているので、どちらの一覧にも入らない。
 */
const 走査したfile: string[] = 走査するfile(REPO, "*.ts", "*.tsx", "*.mts", "*.mjs");

function 持っているfile(): string[] {
  return 走査したfile.filter((p) => 探す字.test(readFileSync(join(REPO, p), "utf8")));
}

describe("注記がいま出している変更を指していない (#2081)", () => {
  it("走査対象を集められている", () => {
    // 集められていなければ、以下の検査は通って当然になる
    expect(走査したfile.length, "走査する file を 1 件も集められていない").toBeGreaterThan(100);
  });

  it("宣言した file が実在し、理由を持つ", () => {
    // 消えた file の宣言が残ると、同じ字が別の file に出た時に黙って通る
    for (const [p, 理由] of Object.entries(例外)) {
      expect(走査したfile, `宣言した file が走査対象に無い: ${p}`).toContain(p);
      expect(理由.length, `宣言に理由が無い: ${p}`).toBeGreaterThan(10);
    }
  });

  it("宣言した file が実際にその字を持っている (空振り防止)", () => {
    // 持っていない file を宣言していると、宣言が効いているかを確かめられない
    for (const p of Object.keys(例外)) {
      expect(探す字.test(readFileSync(join(REPO, p), "utf8")), `宣言した file が字を持たない: ${p}`).toBe(
        true,
      );
    }
  });

  it("宣言していない file がその字を持っていない", () => {
    const 残る = 持っているfile().filter((p) => !(p in 例外));
    expect(残る, "注記がいま出している変更を指している").toEqual([]);
  });

  it("字を拾えている (植え込み対照)", () => {
    // 拾えない判定だと、上の検査は残っていても通る。
    // 対照の字も繋いで作る = 通しの綴りを書くとこの file 自身が検出される
    const 字 = ["本", " ", "PR"].join("");
    const 字空白なし = ["本", "PR"].join("");
    expect(探す字.test(`// ${字} で足した経路`), "空白ありを拾えていない").toBe(true);
    expect(探す字.test(`// ${字空白なし}で足した経路`), "空白なしを拾えていない").toBe(true);
    expect(探す字.test("// この PR で足した経路"), "別の書き方を拾っている").toBe(false);
  });
});
