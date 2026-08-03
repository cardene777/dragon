import { describe, it, expect } from "vitest";
import { parseTextDslV05 } from "../src/v05/parser";
import { compileToCdl } from "../src/compile";
import type { CdlDiagram } from "@cardenelabs/cdl";

/**
 * 位置を書かなかったパーツの並べ方。
 *
 * 以前は「既存の右端 + 隙間」 に 1 つずつ置いていた。 折り返しが無いので、 足すたびに図が右へ
 * 伸び続けた (実測 = 8 個で幅 6140、 1 個の 5.5 倍)。 canvas で座標を渡していた頃はこの経路に
 * 入らなかったが、 canvas を外して全てここを通るようになった。
 *
 * 測るのは「並べる処理が走ったか」 ではなく、 **足しても図が壊れないか**。 具体的には
 * 重ならないこと、 横に伸び続けないこと、 縦位置が揃うこと。
 */

const part = (id: string, w: number, h: number): CdlDiagram => ({
  id: `parts-${id}`,
  topic: id,
  lanes: [{ id: "l", x: 0, width: w }],
  nodes: [{ id: "body", lane: "l", stack: 0, kind: "service", title: id, w, h } as never],
  edges: [],
  states: [],
  phases: [],
});

const CATALOG: Record<string, CdlDiagram> = {
  a: part("a", 380, 380),
  b: part("b", 380, 300),
  c: part("c", 380, 380),
  d: part("d", 380, 300),
  e: part("e", 380, 380),
  f: part("f", 380, 300),
  g: part("g", 380, 380),
  h: part("h", 380, 300),
};

const build = (kinds: string[]) => {
  const actors = kinds.map((k, i) => `  - p${i + 1}: ${k}`);
  const src = [
    `title: "t"`, `type: flow`, ``, `actors:`, ...actors, `  - X`, ``,
    `flow:`, `  - X -> X: "y"`,
  ].join("\n");
  const r = parseTextDslV05(src);
  if (!r.ok) throw new Error(`parse 失敗: ${r.errors.map((e) => e.message).join(" / ")}`);
  return compileToCdl(r.doc, { partsCatalog: CATALOG });
};

/** パーツ由来の箱だけ取り出す (id が `{alias}__` で始まる)。 */
const partNodes = (d: CdlDiagram) => d.nodes.filter((n) => n.id.includes("__"));

const overlapCount = (d: CdlDiagram): number => {
  const boxes = partNodes(d).map((n) => ({
    l: (n.posX ?? 0) - (n.posW ?? n.w ?? 0) / 2,
    r: (n.posX ?? 0) + (n.posW ?? n.w ?? 0) / 2,
    t: (n.posY ?? 0) - (n.posH ?? n.h ?? 0) / 2,
    b: (n.posY ?? 0) + (n.posH ?? n.h ?? 0) / 2,
  }));
  let n = 0;
  for (let i = 0; i < boxes.length; i++) {
    for (let j = i + 1; j < boxes.length; j++) {
      const a = boxes[i]!, b = boxes[j]!;
      if (a.l < b.r && a.r > b.l && a.t < b.b && a.b > b.t) n += 1;
    }
  }
  return n;
};

const width = (d: CdlDiagram): number => {
  const xs = partNodes(d).map((n) => (n.posX ?? 0) + (n.posW ?? n.w ?? 0) / 2);
  return xs.length > 0 ? Math.max(...xs) : 0;
};

describe("位置を書かなければ格子に並ぶ", () => {
  it("何個足しても重ならない", () => {
    for (const n of [1, 2, 3, 5, 8]) {
      const d = build(["a", "b", "c", "d", "e", "f", "g", "h"].slice(0, n));
      expect(overlapCount(d), `${n} 個で重なった`).toBe(0);
    }
  });

  it("横に伸び続けない", () => {
    // 3 個で折り返すので、 4 個目以降は幅が増えない
    const w3 = width(build(["a", "b", "c"]));
    const w8 = width(build(["a", "b", "c", "d", "e", "f", "g", "h"]));
    expect(w8, `3 個 ${w3} → 8 個 ${w8} で幅が増えた`).toBe(w3);
  });

  it("同じ段は上端が揃う", () => {
    // 座標は中心なので、 高さが違えば中心もずれる。 揃うべきは上端
    const d = build(["a", "b", "c"]);
    const tops = partNodes(d).map((n) => (n.posY ?? 0) - (n.posH ?? n.h ?? 0) / 2);
    expect(new Set(tops).size, `上端がばらついた: ${tops.join(",")}`).toBe(1);
  });

  it("高さが違っても段がずれない", () => {
    // 高さの違うパーツが混ざると、 次の段の位置が自分の高さで決まって重なっていた
    const d = build(["a", "b", "c", "d"]);
    const tops = partNodes(d).map((n) => (n.posY ?? 0) - (n.posH ?? n.h ?? 0) / 2);
    // 1 段目 3 個 + 2 段目 1 個 = 上端は 2 種類
    expect(new Set(tops).size, `段が ${new Set(tops).size} 種類: ${tops.join(",")}`).toBe(2);
  });

  it("置き場所がパーツの数で変わらない", () => {
    // パーツ自身の仮の箱を数えると、 足すたびに下へずれる
    const y1 = partNodes(build(["a"]))[0]!.posY;
    const y3 = partNodes(build(["a", "b", "c"]))[0]!.posY;
    expect(y3, `1 個 ${y1} → 3 個 ${y3} でずれた`).toBe(y1);
  });

  it("既存の図と重ならない", () => {
    const d = build(["a"]);
    // 既存の箱は自動配置なので座標を持たない。 パーツは十分下に置かれる
    const p = partNodes(d)[0]!;
    expect(p.posY! - (p.posH ?? p.h ?? 0) / 2, "既存の図に被る高さ").toBeGreaterThan(280);
  });
});

describe("位置を書けばそこに置く", () => {
  it("書いた位置が優先される", () => {
    const src = [
      `title: "t"`, `type: flow`, ``, `actors:`,
      `  - p1: a @900,700`, `  - X`, ``,
      `flow:`, `  - X -> X: "y"`,
    ].join("\n");
    const r = parseTextDslV05(src);
    if (!r.ok) throw new Error("parse 失敗");
    const d = compileToCdl(r.doc, { partsCatalog: CATALOG });
    expect(partNodes(d)[0]!.posX).toBe(900);
    expect(partNodes(d)[0]!.posY).toBe(700);
  });

  it("書いたものと書かないものを混ぜられる", () => {
    const src = [
      `title: "t"`, `type: flow`, ``, `actors:`,
      `  - p1: a @900,700`, `  - p2: b`, `  - X`, ``,
      `flow:`, `  - X -> X: "y"`,
    ].join("\n");
    const r = parseTextDslV05(src);
    if (!r.ok) throw new Error("parse 失敗");
    const d = compileToCdl(r.doc, { partsCatalog: CATALOG });
    const [p1, p2] = partNodes(d);
    expect([p1!.posX, p1!.posY], "書いた方がずれた").toEqual([900, 700]);
    expect(p2!.posX, "書かない方が置かれていない").toBeDefined();
  });
});
