/*
 * 箱が全て見本 (`parts`) の図でも、書いた縦列が効くことを見る (#2372)。
 *
 * 判定 (`書いた縦列に置く`) が見本の箱を数から外していたため、箱が全部見本だと
 * 対象が 0 件になり「全ての箱が縦列を書いた」 が成立しなかった。
 *
 * 結果は 3 つ重なる。
 *
 * 1. 書いた縦列に箱が入らない (部品が自分で作った縦列に入る)
 * 2. 宣言した縦列が空のまま残り、縦列が 3 本になる
 * 3. 「どの箱も入らない縦列です」 という **誤った知らせ** が出る
 *
 * 部品が混ざった図では効いていた = 全部が部品の時だけ判定が割れていた。
 */
import { describe, expect, it } from "vitest";
import { compileToCdl } from "../src/compile";
import { parseTextDslV05 } from "../src/v05/parser";

/** 箱の作り 3 通り。 どれも縦列を 1 つ宣言し、全ての箱がその縦列を書く */
const 箱の作り: readonly { 名: string; 箱: string }[] = [
  {
    名: "普通の箱だけ",
    箱: "  - あ: { lane: 振り分け }\n  - い: { lane: 振り分け }",
  },
  {
    名: "見本だけ",
    箱:
      "  - split: { kind: split-router, phase: false, lane: 振り分け }\n" +
      "  - merge: { kind: merge-junction, phase: false, lane: 振り分け }",
  },
  {
    名: "見本と普通の箱が混ざる",
    箱: "  - split: { kind: split-router, phase: false, lane: 振り分け }\n  - あ: { lane: 振り分け }",
  },
];

function 本文(箱: string): string {
  return `title: "縦列に置く"
type: swimlane

lanes:
  振り分け: { label: "振り分け" }

actors:
${箱}
`;
}

type 結果 = { 縦列: string[]; 箱の縦列: string[]; 知: string[] };

function 組む(src: string): 結果 {
  const p = parseTextDslV05(src);
  if (!p.ok) throw new Error(`読めない本文: ${p.errors.map((e) => e.message).join(" / ")}`);
  const 知: string[] = [];
  const d = compileToCdl(p.doc, { onNotice: (n) => 知.push(n.kind) });
  return {
    縦列: d.lanes.map((l) => l.id),
    箱の縦列: [...new Set(d.nodes.map((n) => n.lane))],
    知,
  };
}

describe("箱が全て見本の図でも、書いた縦列が効く (#2372)", () => {
  it("書いた縦列に箱が入る", () => {
    const 入らない = 箱の作り
      .map((t) => ({ 名: t.名, 結果: 組む(本文(t.箱)) }))
      .filter(({ 結果 }) => !結果.箱の縦列.every((l) => l === "振り分け"))
      .map(({ 名, 結果 }) => `${名}: ${結果.箱の縦列.join(" / ")}`);
    expect(入らない, `箱の作り ${箱の作り.length} 通り`).toEqual([]);
  });

  it("空の縦列が増えない", () => {
    const 増えた = 箱の作り
      .map((t) => ({ 名: t.名, 結果: 組む(本文(t.箱)) }))
      .filter(({ 結果 }) => 結果.縦列.length !== 1)
      .map(({ 名, 結果 }) => `${名}: ${結果.縦列.length} 本 (${結果.縦列.join(" / ")})`);
    expect(増えた, `箱の作り ${箱の作り.length} 通り`).toEqual([]);
  });

  it("誤った知らせが出ない", () => {
    const 出た = 箱の作り
      .map((t) => ({ 名: t.名, 知: 組む(本文(t.箱)).知 }))
      .filter(({ 知 }) => 知.length > 0)
      .map(({ 名, 知 }) => `${名}: ${知.join(" / ")}`);
    expect(出た, `箱の作り ${箱の作り.length} 通り`).toEqual([]);
  });

  it("縦列を書かない見本は、いままでどおり自分の縦列を作る (植え込み対照)", () => {
    /*
     * 見本を数に入れる形に変えたので、**書かない図まで巻き込んでいないか** を見る。
     * 縦列を書かない図では組み立て器が並べる形が残る。
     */
    const 結果 = 組む(`title: "縦列を書かない"
type: swimlane

actors:
  - split: { kind: split-router, phase: false }
  - merge: { kind: merge-junction, phase: false }
`);
    expect(結果.箱の縦列.includes("振り分け"), "書いていない縦列に入った").toBe(false);
    expect(結果.箱の縦列.length, "箱ごとに縦列を作っていない").toBe(2);
  });

  it("一部の箱だけが縦列を書いた形は、混ざっていると知らせる (植え込み対照)", () => {
    // 判定を緩めすぎると、この知らせが消える
    const 知 = 組む(`title: "一部だけ書く"
type: swimlane

lanes:
  振り分け: { label: "振り分け" }

actors:
  - split: { kind: split-router, phase: false, lane: 振り分け }
  - merge: { kind: merge-junction, phase: false }
`).知;
    expect(知, "混ざった形の知らせが消えた").toContain("lane-not-honored");
  });
});
