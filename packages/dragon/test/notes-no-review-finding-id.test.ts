import { describe, it, expect } from "vitest";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

/**
 * 注記と検査の題が、指摘に振った番号で中身を名乗っていないことの検証 (#2082)。
 *
 * 探すのは指摘の重さを表す語 (`CRITICAL` / `MAJOR` / `MINOR`) と、指摘の束を指す言い回し
 * (`fix lock` / `codex-review`)。 これらを主語にした題は、一覧が repo の中にも外にも残っていないため
 * 読み手が辿れない。 実測では 36 か所 / 12 file が残っていた。
 *
 * ## 出所を添える形は止めない
 *
 * 規則を本文に書いた上で出所を括弧で添える形 (`… を破壊した (cc-codex #879 Round 5 指摘)`) は残す。
 * 規則が読めるので、出所を辿れなくても中身が分かる。 探す語を上の 5 つに絞ったのはこのため =
 * `Round` や `指摘` まで止めると、この形を巻き込む。
 *
 * ## 探す語は繋いで作る
 *
 * この file に通しの綴りを書くと、自分自身が検出される。 繋いだ形なら走査対象に入ったままでも
 * 自分を拾わない (`notes-no-this-pr-reference.test.ts` が同じ形を採っている)。
 */

const ここ = dirname(fileURLToPath(import.meta.url));
const REPO = join(ここ, "..", "..", "..");

/** 探す語 (指摘の重さを表す 3 語と、指摘の束を指す 2 つの言い回し) */
const 探す語 = [
  ["CRITI", "CAL"].join(""),
  ["MAJ", "OR"].join(""),
  ["MIN", "OR"].join(""),
  ["fix", " ", "lock"].join(""),
  ["codex", "-", "review"].join(""),
];

/** 探す語を 1 つでも持つか (重さの 3 語は語の切れ目で見る = 別の語の一部を拾わないため) */
function 指摘の番号を名乗る(中身: string): boolean {
  return 探す語.some((語) => new RegExp(`\\b${語}\\b`, "u").test(中身));
}

/**
 * 走査対象 = 追跡している `ts` / `tsx` / `mts` / `mjs`。
 * 配布物 (`dist`) は追跡外なので、除外を書かなくても入らない。
 */
const 走査したfile: string[] = execFileSync(
  "git",
  ["-C", REPO, "ls-files", "*.ts", "*.tsx", "*.mts", "*.mjs"],
  { encoding: "utf8" },
)
  .split("\n")
  .filter((p) => p !== "");

function 持っているfile(): string[] {
  return 走査したfile.filter((p) => 指摘の番号を名乗る(readFileSync(join(REPO, p), "utf8")));
}

describe("注記と題が指摘の番号を名乗っていない (#2082)", () => {
  it("走査対象を集められている", () => {
    // 集められていなければ、以下の検査は通って当然になる
    expect(走査したfile.length, "走査する file を 1 件も集められていない").toBeGreaterThan(100);
  });

  it("指摘の番号が実際に残っていた 2 か所の両方を走査している", () => {
    // 片側だけを見る形だと、もう片側に同じ書き方が戻っても通る。
    // 実測では `packages/dragon/src` と `apps/playground-spa/src` の両方に残っていた
    expect(
      走査したfile.some((p) => p.startsWith("packages/dragon/")),
      "packages 側を走査していない",
    ).toBe(true);
    expect(
      走査したfile.some((p) => p.startsWith("apps/playground-spa/")),
      "apps 側を走査していない",
    ).toBe(true);
    for (const 拡張子 of [".ts", ".tsx", ".mts", ".mjs"]) {
      expect(
        走査したfile.some((p) => p.endsWith(拡張子)),
        `拡張子 ${拡張子} を走査していない`,
      ).toBe(true);
    }
  });

  it("どの file も指摘の番号を名乗っていない", () => {
    expect(持っているfile(), "注記または検査の題が指摘の番号を名乗っている").toEqual([]);
  });

  it("語を拾えている (植え込み対照)", () => {
    // 拾えない判定だと、上の検査は残っていても通る。
    // 対照の語も繋いで作る = 通しの綴りを書くとこの file 自身が検出される
    for (const 語 of 探す語) {
      expect(指摘の番号を名乗る(`// ${語} = 何かを直した`), `語を拾えていない: ${語}`).toBe(true);
    }
  });

  it("出所を添えただけの形は拾わない (陰性対照)", () => {
    // 規則が本文にある形まで落とすと、辿れる注記まで書き直すことになる
    expect(
      指摘の番号を名乗る("// 無条件正規化は改行を含む label を破壊した (cc-codex #879 Round 5 指摘)"),
      "出所を添えた形を拾っている",
    ).toBe(false);
    expect(
      指摘の番号を名乗る("// 長さを先に見てから降りる (Round 6 の指摘)"),
      "規則を述べた形を拾っている",
    ).toBe(false);
  });
});
