/**
 * 図枠の中で箱がどこにどれだけの大きさで描かれるか (`partBoxInFrame`) の検証 (#1014)。
 *
 * 書いた座標と相対指定の間隔は、この値を基準に解く。 図枠の値と取り違えると、間隔が
 * 余白のぶんだけ広がる (実測 = 200 と書いて 260 空いた)。
 *
 * **配置計算の結果と直接突き合わせる**。 置き場所を通した検証だけでは、間隔を足す時と
 * 左上に直す時で同じ値を使うため、箱の大きさを図枠の大きさに変えても打ち消し合って
 * 気付けない (実測で `boxH` を図枠の高さにしても 16823 件が全て通った)。
 */
import { describe, it, expect } from "vitest";
import { diagram, layout } from "@cardenelabs/cdl";
import type { CdlDiagram } from "@cardenelabs/cdl";
import { partBoxInFrame, partRenderSize } from "../src/index";

/** 箱の外接矩形を配置計算から直接測る。 */
function measuredBox(part: CdlDiagram): { w: number; h: number; left: number; top: number } {
  const own = layout(part);
  let x0 = Infinity;
  let y0 = Infinity;
  let x1 = -Infinity;
  let y1 = -Infinity;
  for (const n of own.nodes) {
    x0 = Math.min(x0, n.cx - n.w / 2);
    x1 = Math.max(x1, n.cx + n.w / 2);
    y0 = Math.min(y0, n.cy - n.h / 2);
    y1 = Math.max(y1, n.cy + n.h / 2);
  }
  return { w: x1 - x0, h: y1 - y0, left: x0 - own.viewBox.x, top: y0 - own.viewBox.y };
}

/** 段の数と箱の大きさを変えて作る見本。 */
function makePart(id: string, w: number, h: number, stacks = 1): CdlDiagram {
  const b = diagram(id, { topic: id }).lane("l", { width: w });
  for (let i = 0; i < stacks; i += 1) {
    b.node(`n${i}`, { lane: "l", stack: i, kind: "card", title: `${id}${i}`, w, h });
  }
  return b.build();
}

describe("partBoxInFrame", () => {
  const cases: Array<[string, CdlDiagram]> = [
    ["1 段 / 横長", makePart("wide", 400, 200)],
    ["1 段 / 縦長", makePart("tall", 200, 400)],
    ["2 段", makePart("two", 300, 150, 2)],
    ["3 段", makePart("three", 300, 100, 3)],
  ];

  for (const [label, part] of cases) {
    it(`${label} で配置計算の箱と一致する`, () => {
      const got = partBoxInFrame(part);
      const want = measuredBox(part);
      expect(got.w, "幅が違う").toBeCloseTo(want.w, 1);
      expect(got.h, "高さが違う").toBeCloseTo(want.h, 1);
      expect(got.left, "左の余白が違う").toBeCloseTo(want.left, 1);
      expect(got.top, "上の余白が違う").toBeCloseTo(want.top, 1);
    });
  }

  it("箱は図枠より小さく、余白の分だけ内側にある", () => {
    // 図枠の値をそのまま返す実装を弾く。 高さが変わっても幅が変わらない見本で見ると、
    // 図枠と箱を取り違えた実装は必ずどちらかの辺で外れる
    for (const [label, part] of cases) {
      const box = partBoxInFrame(part);
      const frame = partRenderSize(part);
      expect(box.w, `${label} の幅が図枠と同じ`).toBeLessThan(frame.w);
      expect(box.h, `${label} の高さが図枠と同じ`).toBeLessThan(frame.h);
      expect(box.left + box.w, `${label} の箱が図枠から右へ出ている`).toBeLessThanOrEqual(frame.w);
      expect(box.top + box.h, `${label} の箱が図枠から下へ出ている`).toBeLessThanOrEqual(frame.h);
    }
  });

  it("段を増やすと箱の高さだけが伸びる", () => {
    // 図枠の高さを返す実装では、余白のぶん多く伸びる
    const one = partBoxInFrame(makePart("s1", 300, 100, 1));
    const three = partBoxInFrame(makePart("s3", 300, 100, 3));
    expect(three.w, "段を増やして幅が変わっている").toBeCloseTo(one.w, 1);
    expect(three.top, "段を増やして上の余白が変わっている").toBeCloseTo(one.top, 1);
    expect(three.h - one.h, "伸びた高さが配置計算と違う").toBeCloseTo(
      measuredBox(makePart("s3", 300, 100, 3)).h - measuredBox(makePart("s1", 300, 100, 1)).h,
      1,
    );
  });

  it("箱を持たない図では図枠をそのまま返す", () => {
    const boxless: CdlDiagram = {
      id: "parts-empty",
      topic: "empty",
      lanes: [{ id: "l", x: 0, width: 400 }],
      nodes: [],
      edges: [],
      states: [],
      phases: [] as CdlDiagram["phases"],
    };
    const box = partBoxInFrame(boxless);
    const frame = partRenderSize(boxless);
    expect(box.w).toBeCloseTo(frame.w, 1);
    expect(box.h).toBeCloseTo(frame.h, 1);
    expect(box.left).toBe(0);
    expect(box.top).toBe(0);
  });
});
