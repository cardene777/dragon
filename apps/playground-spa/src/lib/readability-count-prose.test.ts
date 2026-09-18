import { readFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it, expect } from "vitest";
import { 走査するfile, 絶対path } from "../../../../test-support/scan-targets";

/**
 * 読みにくい図の枚数を、注釈に手で書き戻させない (#2214)。
 *
 * 「箱の題が下限を割る図が何枚あるか」 と「基準の画面の高さを超える図が何枚あるか」 は
 * カタログに図を足すたびに動く。 どこにも検査が無かったため、3 つの file が別々の数字で
 * 止まっていた。
 *
 * | どこ | 何の数 | 書いてあった | 実物 |
 * |---|---|---|---|
 * | `diagram-zoom.ts` | 拡大表示で下限を割る | 20 | 27 |
 * | `diagram-zoom.ts` | 並べて見る側で下限を割る | 53 | 71 |
 * | `CategoryPage.tsx` | 並べて見る側で下限を割る | 53 | 71 |
 * | `CategoryPage.tsx` | 高さの線を超える | 39 | 80 |
 * | `catalog-inline-zoom.spec.ts` | 上の 2 つと同じ | 53 と 39 | 71 と 80 |
 *
 * `CategoryPage.tsx` の高さの線は 1200px と書いてあったが、実際の線は基準の画面の高さ
 * (900px) で、値そのものも違っていた。
 *
 * 実数は `packages/dragon/test/support/responsive-accepted.ts` の `受け入れた一覧` と
 * `縦に長い一覧` が **名前で** 持つ (`rules/quality.md § 導出可能記述は人手で書かない` の
 * 経路 2)。
 *
 * ## 何を止めるか
 *
 * 止めるのは **下限や高さの線を割る図の枚数を数字で書く形** だけ。 個々の図を実測した注釈や、
 * 枚数を持たない説明は止めない。
 *
 * 表の列見出しに枚数の欄を作る形も止める = 見出しと数字が別の行に入るため、1 行だけを見ても
 * 数字の側からは拾えない。
 *
 * **拾う形と拾わない形の実例は、下の植え込み対照が文字列として持つ**。 注釈に書くと、この
 * file 自身が走査に引っかかる。
 *
 * ## 走査は対象ではなく除外で決める
 *
 * 走査する file を並べると、書き手が思い付いた場所が上限になる
 * (`rules/quality.md § 全件走査は除外を書く`)。
 *
 * **入口を 4 つ並べていた間、説明文だけがこう書いてあった** (#2238)。 集め方は
 * `test-support/scan-targets.ts` が 1 か所で持つ (#2095)。
 *
 * ## 走査した件数を出す
 *
 * 0 件は「該当なし」 と「測っていない」 の両方になりうるので、読んだ注釈の行数を併記する。
 */

const ここ = dirname(fileURLToPath(import.meta.url));
const 根 = join(ここ, "..", "..", "..", "..");

/** 注釈の 1 行 (`//` の行と、ブロック注釈の `*` 始まりの行) */
const 注釈の行か = (行: string): boolean => /^\s*(\/\/|\*|\/\*)/.test(行);

const 走査したfile = 絶対path(根, 走査するfile(根, "*.ts", "*.tsx"));

const 注釈: Array<{ file: string; 行: string }> = 走査したfile.flatMap((p) =>
  readFileSync(p, "utf8")
    .split("\n")
    .filter(注釈の行か)
    .map((行) => ({ file: relative(根, p), 行: 行.trim() })),
);

/**
 * 下限や高さの線を割る図の枚数を書いた形。
 *
 * 数えた枚数と読みにくさの述語が **句点を挟まずに** 並んだ形だけを拾う。 間に句点が入る書き方
 * (個々の図を測った結果に続けて別の話で枚数を出す形) には届かない。
 */
const 枚数の形 = [
  /[0-9]+\s*[枚件][がは]?[^。\n]{0,16}(12px\s*未満|12px\s*を割|下限を割|px\s*超)/,
  /(12px\s*未満|下限を割る図|下限未満)[^。\n]{0,16}[0-9]+\s*[枚件]/,
  /箱の題が\s*[0-9]+px\s*(未満|以下)/,
];

const 拾う = (行: string): boolean => 枚数の形.some((r) => r.test(行));

describe("読みにくい図の枚数を注釈に書かない (#2214)", () => {
  it("注釈を 1 行以上走査できている", () => {
    // 走査できていなければ、下の 0 件は「該当なし」 ではなく「測っていない」 になる
    console.log(`[枚数の注釈] file=${走査したfile.length} 注釈=${注釈.length} 行`);
    expect(注釈.length, "走査した dir から注釈を 1 行も読めていない").toBeGreaterThan(1000);
    // 入口を並べていた頃に外れていた場所 (#2238)。 減らすと同じ抜けに戻る
    expect(
      走査したfile.some((p) => p === join(根, "test-support", "scan-targets.ts")),
      "走査の集め方そのものを見ていない (#2238 が広げた先)",
    ).toBe(true);
    expect(
      走査したfile.some((p) => p === join(根, "vitest.config.ts")),
      "根の設定 file を見ていない (#2238 が広げた先)",
    ).toBe(true);
    expect(
      走査したfile.filter((p) => p.includes("/node_modules/") || p.includes("/dist/")),
      "無視設定の dir の file が混ざっている",
    ).toEqual([]);
  });

  it("枚数を書いた注釈が無い", () => {
    const 見つけた = 注釈.filter(({ 行 }) => 拾う(行)).map((x) => `${x.file}: ${x.行}`);
    expect(
      見つけた,
      `注釈 ${注釈.length} 行を走査した。 下限や高さの線を割る図の枚数は書かず、` +
        `responsive-accepted.ts の 受け入れた一覧 / 縦に長い一覧 を名指しする ` +
        `(図を足すたびに動くので、書いた時点で古くなる)`,
    ).toEqual([]);
  });

  it("植え込み対照 — 枚数を書き戻すと拾える", () => {
    const 植えた = [
      " * 実測で 53 枚が箱の題 12px 未満、39 枚が高さ 1200px 超になる。",
      "// 広い図は縮み (53 枚が 12px 未満)、細い図は伸びる (39 枚が高さ 1200px 超)。",
      " * | どこ | 器 | 既定 | 箱の題が 12px 未満 |",
    ];
    expect(植えた.filter(拾う)).toHaveLength(3);
  });

  it("植え込み対照 — 実測や別の話の枚数は拾わない", () => {
    const 植えた = [
      " * どちらの器にも箱の題が下限の 12px を割る図がある。 枚数は書かない。",
      " * 9 本を 1 枚に縦に積むと台の高さを超え、横に 2 列に分ける。",
      " * 対象が 1 枚も無い状態で通らないよう、下限も課す。",
      " * (実測 = 2634 × 780 で箱の題が 9.6px)。 2 枚に割ったのはそのため。",
      " * 繋ぎ方の部品は 26 枚あり、20 枚が繋いだ見本を持つ。",
    ];
    expect(植えた.filter(拾う)).toEqual([]);
  });
});
