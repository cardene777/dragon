/**
 * ER 図でも書いた縦列に表を置けることの検証 (#1571)。
 *
 * `er` の組み立て器は実体 1 つにつき帯を 1 本作り、必ず段 0 に置く = 表が横 1 列にしか
 * 並ばない。 関係を 4 本持つ実体があると、どう並べ替えても 2 本は隣を飛び越す
 * (意匠帳 `docs/design/er/note.md` § 記法の制約 が 4 通りを実測している)。
 *
 * ## 3 通りを見る
 *
 * 書いた場合だけを見ると、全ての図が書いた縦列に置かれる変異でも通る。
 * 書かない場合に 1 列のままであること、一部だけ書いた場合に知らせが出ることを併せて見る。
 */
import { describe, it, expect } from "vitest";
import { textDslToDiagram } from "../src/index";
import type { CompileNotice } from "../src/compile";

/** 記法から図を組み、箱の縦列と知らせを返す */
function 組む(src: string): { 縦列: string[]; 知らせ: CompileNotice[] } {
  const 出た: CompileNotice[] = [];
  const d = textDslToDiagram(src, { onNotice: (n) => 出た.push(n) });
  return { 縦列: d.nodes.map((n) => n.lane), 知らせ: 出た };
}

/** 表を 3 つ持つ ER 図。 縦列の書き方だけを差し替えて比べる */
const ER = (箱: readonly string[]): string =>
  [
    'title: "縦列の確かめ"',
    "type: er",
    "",
    "lanes:",
    "  c0: { width: 470 }",
    "  c1: { width: 470 }",
    "",
    "actors:",
    ...箱,
    "",
    "flow:",
    '  - a -> b: "繋ぐ"',
    "",
    "animation:",
    '  - step: "1" 1.0s',
    "    focus: [a, b, c]",
    "",
  ].join("\n");

const 行 = (名: string, 縦列?: string, 段?: number): string =>
  `  - ${名}: { ${縦列 === undefined ? "" : `lane: ${縦列}, stack: ${段 ?? 0}, `}kind: storage, rows: ["id: bigint"], marks: ["pk"] }`;

describe("ER 図でも書いた縦列に表を置ける (#1571)", () => {
  it("全ての箱が縦列を書けば、書いたとおりに置かれる", () => {
    const { 縦列 } = 組む(ER([行("a", "c0", 0), 行("b", "c1", 0), 行("c", "c0", 1)]));
    expect(縦列.length, "箱が 1 つも無い (検査が空振りしている)").toBe(3);
    // `a` と `c` が同じ縦列、`b` だけ別 = 書いたとおり
    expect(縦列[0], "a と c が同じ縦列に無い").toBe(縦列[2]);
    expect(縦列[1], "b が a と同じ縦列にある").not.toBe(縦列[0]);
  });

  it("縦列を書かなければ 1 箱 1 縦列のまま", () => {
    /*
     * 陰性対照。 書いた場合だけを見ると、全ての図が書いた縦列に置かれる変異でも通る。
     *
     * 組み立て器は実体 1 つにつき帯を 1 本作るので、縦列は全て別になる。
     */
    const { 縦列 } = 組む(ER([行("a"), 行("b"), 行("c")]));
    expect(縦列.length, "箱が 1 つも無い (検査が空振りしている)").toBe(3);
    expect(new Set(縦列).size, "縦列を書いていないのに同じ縦列へ入っている").toBe(3);
  });

  it("一部の箱だけ縦列を書くと知らせが出る", () => {
    // 既存の経路 (#1263)。 ER を足しても同じ扱いになることを見る
    const { 知らせ } = 組む(ER([行("a", "c0", 0), 行("b"), 行("c", "c1", 0)]));
    expect(
      知らせ.some((n) => n.kind === "lane-not-honored"),
      "一部だけ書いた形が黙って通っている",
    ).toBe(true);
  });
});
