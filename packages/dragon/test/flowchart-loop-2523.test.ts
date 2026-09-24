/**
 * 分かれ道の図で繰り返しの箱を書けることの検査 (#2523)。
 *
 * 描画側は繰り返しを **形** としてだけ持ち、箱の種類 (`NODE_KINDS`) には持たない。
 * そのため記法に `loop` と書くと種類として読まれず、**部品の名前として扱われて**
 * 「部品の一覧を渡していないため部品として描けません」 と言われるだけだった (実測)。
 *
 * 一覧の複雑な版 (`pattern__presetFlowchart__複雑`) はこの箱を持つため、
 * 記法に移せず泳路の図のまま取り残されていた。
 *
 * ## 何を見るか
 *
 * 1. `loop` が記法の受ける種類に入っている (一覧は実物から導く)
 * 2. 分かれ道の図で書くと、描画側の繰り返しの形になる
 * 3. 分かれ道の図以外で書くと札に落ちる (描画側が大きさを引けずに落ちない)
 * 4. 知らない種類は今までどおり部品の名前として扱われる (対照)
 *
 * 4 つ目を置くのは、`loop` を通すために種類の判定そのものを緩めていないことを見るため。
 */
import { describe, it, expect } from "vitest";

import { NODE_KIND_VALID, textDslToDiagram, type CdlDiagram } from "../src";
import { DSL_ONLY_KINDS } from "../src/v05/parser";

/** 記法を組み立てて、箱と知らせを返す */
function 組み立てる(code: string): { 箱: CdlDiagram["nodes"]; 知らせ: string[] } {
  const 知らせ: string[] = [];
  const 図 = textDslToDiagram(code, { onNotice: (n) => 知らせ.push(n.kind) });
  return { 箱: 図.nodes, 知らせ };
}

/** 指定した種類を 1 つ持つ分かれ道の図 */
function 分かれ道の図(種類: string): string {
  return `title: "繰り返し"
type: flowchart

actors:
  - 始め: mark-start
    lane: 申請者
  - 明細を見る: ${種類}
    lane: 経理
  - 終わり: mark-end
    lane: 経理

flow:
  - 始め -> 明細を見る
  - 明細を見る -> 終わり
`;
}

describe("分かれ道の図で繰り返しの箱を書ける (#2523)", () => {
  it("loop が記法の受ける種類に入っている", () => {
    // 一覧は実物から導く = 手で並べた期待値を置くと、種類を外した時に検査だけが残る
    expect(
      DSL_ONLY_KINDS.length,
      "記法だけが持つ種類を 1 件も読めていない (検査が空振りしている)",
    ).toBeGreaterThan(0);
    expect([...DSL_ONLY_KINDS], "記法だけが持つ種類に loop が無い").toContain("loop");
    expect(NODE_KIND_VALID.has("loop"), "記法が受ける種類の全体に loop が無い").toBe(true);
  });

  it("分かれ道の図で書くと繰り返しの形になる", () => {
    const { 箱, 知らせ } = 組み立てる(分かれ道の図("loop"));

    const 真ん中 = 箱.find((n) => n.title === "明細を見る");
    expect(真ん中, "書いた箱が図に出ていない").toBeDefined();
    // 描画側の繰り返しの形は、札 (`card`) に「繰り返し」 の小見出しが付いた姿になる
    expect(真ん中?.kind).toBe("card");
    expect(真ん中?.eyebrow).toBe("繰り返し");
    expect(知らせ, `知らせが出ている: ${知らせ.join(" / ")}`).toEqual([]);
  });

  it("分かれ道の図以外で書くと札に落ちる", () => {
    // 読み替えずに描画側へ渡すと、大きさを引けずに図の組み立てが落ちる (#1420)
    const { 箱, 知らせ } = 組み立てる(`title: "別の図種で書く"
type: flow

actors:
  - 受付: card
  - 明細を見る: loop

flow:
  - 受付 -> 明細を見る
`);

    const 真ん中 = 箱.find((n) => n.title === "明細を見る");
    expect(真ん中?.kind, "描画側に渡せる種類へ読み替わっていない").toBe("card");
    expect(知らせ, `知らせが出ている: ${知らせ.join(" / ")}`).toEqual([]);
  });

  it("知らない種類は部品の名前として扱われる (対照)", () => {
    // `loop` を通すために種類の判定そのものを緩めていないことを見る。
    // 部品の一覧を渡していないので、部品として描けない知らせが出るのが正しい姿
    const 知らせ: string[] = [];
    const 図 = textDslToDiagram(分かれ道の図("no-such-kind"), {
      onNotice: (n) => 知らせ.push(n.kind),
    });

    const 真ん中 = 図.nodes.find((n) => n.title === "明細を見る");
    // 種類を書かなかった箱として描かれる = 普通の手順の箱
    expect(真ん中?.eyebrow, "知らない種類が繰り返しの箱になっている").not.toBe("繰り返し");
  });
});
