/**
 * 箱の中の要素ごとの位置 (`nodes`) を外したことの検証 (#1976)。
 *
 * `nodes: { header: { posX: 100, posY: 50 } }` は、1 人に複数の箱 (名札 / 余白 / 足) を作る図種で
 * 要素ごとに位置を決める欄だった。 `#1466` で順序図が 1 枚の板になってから、`{名前}-{要素名}` の
 * 形の箱を作る図種は 1 つも無く、書くと必ず「当たる箱が無い」 と知らせるだけの欄になっていた。
 *
 * 部品 (parts) の中の要素に当てる形は採らなかった。 欄は絶対座標で、部品は位置と倍率ごと
 * まとめて動くため、要素 1 つだけを絶対座標で止めると部品を動かした時にその要素だけが取り残される。
 *
 * ## 何を見るか
 *
 * | 書き方 | 外した後 |
 * |---|---|
 * | 普通の箱の中括弧の形 | 行番号付きで「項目名が読めません: "nodes"」 |
 * | 普通の箱の縦に並べた形 | 同じ |
 * | 部品 | 部品が持たない状態の名前として知らせる (`part-state-missing`) |
 * | JSON | `$.actors[0].nodes` を知らない項目として返す |
 */
import { describe, it, expect } from "vitest";
import type { CdlDiagram } from "@cardenelabs/cdl";
import { parseTextDslV05 } from "../src/v05/parser";
import { compileToCdl, validateDragonJson } from "../src/index";

/** 箱 1 行を差し替えた本文。 箱の行は 5 行目 */
const 本文 = (箱の行: string): string => `title: "t"
type: topology

actors:
${箱の行}
  - API

flow:
  - User -> API: "req"
`;

/** `nodes` を知らせる誤りの行番号 */
function nodesの誤り(src: string): number[] {
  const r = parseTextDslV05(src);
  if (r.ok) return [];
  return r.errors.filter((e) => e.message.includes('"nodes"')).map((e) => e.line);
}

describe("箱の中の要素ごとの位置 (nodes) を外した (#1976)", () => {
  describe("記法", () => {
    it("中括弧の形に nodes を書くと、その行を指して項目名が読めないと知らせる", () => {
      expect(nodesの誤り(本文("  - User: { nodes: { header: { posX: 100, posY: 50, posW: 220, posH: 70 } } }"))).toEqual([5]);
    });

    it("要素名を幾つ書いても、知らせは nodes の 1 件", () => {
      expect(
        nodesの誤り(本文("  - User: { nodes: { header: { posX: 10, posY: 20 }, footer: { posX: 30, posY: 40 }, spacer: { posX: 50, posY: 60 } } }")),
      ).toEqual([5]);
    });

    it("箱そのものの座標と並べて書くと、座標は知らせず nodes だけを知らせる", () => {
      const r = parseTextDslV05(本文("  - User: { posX: 300, posY: 200, nodes: { header: { posX: 320, posY: 210 } } }"));
      expect(r.ok).toBe(false);
      if (r.ok) return;
      expect(r.errors.map((e) => e.message)).toEqual(['項目名が読めません: "nodes"']);
    });

    it("縦に並べた形に nodes を書いても、項目名が読めないと知らせる", () => {
      const r = parseTextDslV05(`title: "t"
type: topology

actors:
  - User:
      kind: service
      nodes: { header: { posX: 100, posY: 50 } }
  - API

flow:
  - User -> API: "req"
`);
      expect(r.ok, "縦に並べた形の nodes が黙って通っている").toBe(false);
      if (r.ok) return;
      expect(r.errors.some((e) => e.message.includes("nodes"))).toBe(true);
    });

    it("nodes を書かない箱は知らせず、状態の上書きも持たない", () => {
      const r = parseTextDslV05(本文("  - User"));
      expect(r.ok).toBe(true);
      if (!r.ok) return;
      expect(r.doc.actors[0]!).not.toHaveProperty("nodes");
      expect(r.doc.actors[0]!.stateOverride).toBeUndefined();
    });
  });

  describe("部品と JSON", () => {
    it("部品に nodes を書くと、部品が持たない状態の名前として知らせる", () => {
      const 部品: CdlDiagram = {
        id: "parts-one",
        topic: "t",
        lanes: [{ id: "l", x: 0, width: 200 }],
        nodes: [{ id: "n", lane: "l", stack: 0, kind: "card", title: "{v}" }],
        edges: [],
        states: [{ id: "v", initial: 1 }],
        phases: [],
      };
      const r = parseTextDslV05(`title: "t"
type: flow

actors:
  - 印: { kind: one, nodes: { header: { posX: 100, posY: 50 } } }
`);
      expect(r.ok).toBe(true);
      if (!r.ok) return;
      const 出た: string[] = [];
      compileToCdl(r.doc, {
        partsCatalog: { one: 部品 },
        onNotice: (n) => 出た.push(`${n.kind} ${n.line} ${n.message}`),
      });
      expect(出た).toEqual([
        'part-state-missing 5 "印" (one) は "nodes" という状態を持たないため、書いた値は効きません',
      ]);
    });

    it("JSON に nodes を書くと、知らない項目として $.actors[0].nodes を返す", () => {
      const r = validateDragonJson({
        title: "t",
        type: "topology",
        actors: [{ name: "User", nodes: { header: { posX: 100, posY: 50 } } }, { name: "API" }],
        flow: [{ from: "User", to: "API", label: "req" }],
      });
      expect(r.ok).toBe(false);
      if (r.ok) return;
      expect(r.errors.map((e) => e.path)).toEqual(["$.actors[0].nodes"]);
    });
  });
});
