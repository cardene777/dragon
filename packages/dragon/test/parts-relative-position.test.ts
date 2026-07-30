/**
 * パーツを基準にした相対指定が組み立て側 (library 経由) でも効くことの検証。
 *
 * editor は本文からパーツを抜き出して別に重ねるため、 画面では既に効いていた。
 * `textDslToDiagram` に `partsCatalog` を渡す経路では効かず、 同じ本文が画面と
 * 組み立てで別の絵になっていた (Issue #935)。
 *
 * 座標は配置計算に依存するため固定値との一致では書かない。 「基準より右にある」
 * 「間隔が指定通り」 のように関係で書く。
 */
import { describe, it, expect } from "vitest";
import { diagram, layout } from "@cardenelabs/cdl";
import type { CdlDiagram } from "@cardenelabs/cdl";
import { textDslToDiagram } from "../src/index";
import type { CompileNotice } from "../src/compile";

/** 大きさを指定して作る見本のパーツ。 実際の catalog と同じ形 (1 lane + 1 node)。 */
function makePart(id: string, w: number, h: number): CdlDiagram {
  return diagram(id, { topic: id })
    .lane("l", { width: w })
    .node("box", { lane: "l", stack: 0, kind: "card", title: id, w, h })
    .build();
}

const CATALOG: Record<string, CdlDiagram> = {
  achievement: makePart("achievement", 400, 300),
  "parts-achievement": makePart("achievement", 400, 300),
  clock: makePart("clock", 200, 200),
  "parts-clock": makePart("clock", 200, 200),
};

type Box = { cx: number; cy: number; x0: number; x1: number; y0: number; y1: number; w: number; h: number };

/** 組み立てて配置計算し、 名前ごとの外接矩形を返す。 パーツは id 接頭で拾う。 */
function boxesOf(src: string): { boxes: Map<string, Box>; notices: CompileNotice[] } {
  const notices: CompileNotice[] = [];
  const d = textDslToDiagram(src, { partsCatalog: CATALOG, onNotice: (n) => notices.push(n) });
  const laid = layout(d);
  const acc = new Map<string, { x0: number; y0: number; x1: number; y1: number }>();
  const put = (key: string, n: { cx: number; cy: number; w: number; h: number }): void => {
    const cur = acc.get(key);
    const x0 = n.cx - n.w / 2;
    const y0 = n.cy - n.h / 2;
    const x1 = n.cx + n.w / 2;
    const y1 = n.cy + n.h / 2;
    if (cur) {
      cur.x0 = Math.min(cur.x0, x0);
      cur.y0 = Math.min(cur.y0, y0);
      cur.x1 = Math.max(cur.x1, x1);
      cur.y1 = Math.max(cur.y1, y1);
    } else {
      acc.set(key, { x0, y0, x1, y1 });
    }
  };
  for (const n of laid.nodes) {
    // パーツは `{名前}__{元 id}` で merge される
    const merged = n.id.includes("__") ? n.id.slice(0, n.id.indexOf("__")) : undefined;
    if (merged !== undefined) put(merged, n);
    else if (n.title) put(n.title, n);
  }
  const boxes = new Map<string, Box>();
  for (const [k, b] of acc) {
    boxes.set(k, {
      cx: (b.x0 + b.x1) / 2,
      cy: (b.y0 + b.y1) / 2,
      x0: b.x0,
      x1: b.x1,
      y0: b.y0,
      y1: b.y1,
      w: b.x1 - b.x0,
      h: b.y1 - b.y0,
    });
  }
  return { boxes, notices };
}

describe("パーツの相対指定 (組み立て側)", () => {
  it("箱を基準にしてパーツを置ける", () => {
    const { boxes, notices } = boxesOf(`title: "t"
type: flow
actors:
  - Web: service
  - 実績:
      kind: achievement
      位置: Web の右 200
flow:
  - Web -> Web: "a"
`);
    const web = boxes.get("Web")!;
    const part = boxes.get("実績")!;
    expect(web, "Web が測れない").toBeDefined();
    expect(part, "パーツが測れない").toBeDefined();
    // 縁と縁の間が書いた間隔になる
    expect(part.x0 - web.x1).toBeCloseTo(200, 0);
    expect(part.cy).toBeCloseTo(web.cy, 0);
    expect(notices, "効かないと知らせている").toEqual([]);
  });

  it("向き 4 種すべてが効く", () => {
    const mk = (dir: string): { boxes: Map<string, Box>; notices: CompileNotice[] } =>
      boxesOf(`title: "t"
type: flow
actors:
  - Web: service
  - 実績:
      kind: achievement
      位置: Web の${dir} 200
flow:
  - Web -> Web: "a"
`);
    const right = mk("右");
    expect(right.boxes.get("実績")!.cx).toBeGreaterThan(right.boxes.get("Web")!.cx);
    const left = mk("左");
    expect(left.boxes.get("実績")!.cx).toBeLessThan(left.boxes.get("Web")!.cx);
    const below = mk("下");
    expect(below.boxes.get("実績")!.cy).toBeGreaterThan(below.boxes.get("Web")!.cy);
    const above = mk("上");
    expect(above.boxes.get("実績")!.cy).toBeLessThan(above.boxes.get("Web")!.cy);
  });

  it("パーツを基準にしてパーツを置ける", () => {
    const { boxes, notices } = boxesOf(`title: "t"
type: flow
actors:
  - Web: service
  - 実績:
      kind: achievement
      位置: Web の右 200
  - 時計:
      kind: clock
      位置: 実績 の右 150
flow:
  - Web -> Web: "a"
`);
    const part = boxes.get("実績")!;
    const clock = boxes.get("時計")!;
    expect(clock.x0 - part.x1).toBeCloseTo(150, 0);
    expect(notices).toEqual([]);
  });

  it("パーツを基準にして箱を置ける", () => {
    const { boxes, notices } = boxesOf(`title: "t"
type: flow
actors:
  - 実績:
      kind: achievement
      位置: 1000,500
  - API:
      kind: service
      位置: 実績 の右 200
flow:
  - API -> API: "a"
`);
    const part = boxes.get("実績")!;
    const api = boxes.get("API")!;
    expect(api.x0 - part.x1).toBeCloseTo(200, 0);
    expect(notices).toEqual([]);
  });

  it("自動配置のパーツを基準にもできる", () => {
    // 格子に並ぶパーツの位置は組み立て側が決める。 その値を基準として使えること
    const { boxes, notices } = boxesOf(`title: "t"
type: flow
actors:
  - Web: service
  - 実績: achievement
  - 時計:
      kind: clock
      位置: 実績 の右 150
flow:
  - Web -> Web: "a"
`);
    const part = boxes.get("実績")!;
    const clock = boxes.get("時計")!;
    expect(part, "自動配置のパーツが測れない").toBeDefined();
    expect(clock.x0 - part.x1).toBeCloseTo(150, 0);
    expect(notices).toEqual([]);
  });

  it("座標で書いたパーツはその位置に置かれる (従来の経路を変えない)", () => {
    const { boxes } = boxesOf(`title: "t"
type: flow
actors:
  - Web: service
  - 実績:
      kind: achievement
      位置: 1200,800
flow:
  - Web -> Web: "a"
`);
    const part = boxes.get("実績")!;
    expect(part.cx).toBeCloseTo(1200, 0);
    expect(part.cy).toBeCloseTo(800, 0);
  });

  it("位置を書かないパーツは互いに重ならない (格子の規則を変えない)", () => {
    const { boxes } = boxesOf(`title: "t"
type: flow
actors:
  - Web: service
  - a: achievement
  - b: achievement
  - c: clock
  - d: clock
flow:
  - Web -> Web: "a"
`);
    const names = ["a", "b", "c", "d"];
    for (let i = 0; i < names.length; i += 1) {
      for (let j = i + 1; j < names.length; j += 1) {
        const p = boxes.get(names[i]!)!;
        const q = boxes.get(names[j]!)!;
        const overlap = p.x0 < q.x1 && q.x0 < p.x1 && p.y0 < q.y1 && q.y0 < p.y1;
        expect(overlap, `${names[i]} と ${names[j]} が重なる`).toBe(false);
      }
    }
  });

  it("居ない相手を基準にしたら記法の誤りとして返す", () => {
    // 相手の不在は記法側が行番号付きで捕まえる。 組み立てまで来ない
    expect(() =>
      boxesOf(`title: "t"
type: flow
actors:
  - Web: service
  - 実績:
      kind: achievement
      位置: いない人 の右 200
flow:
  - Web -> Web: "a"
`),
    ).toThrow(/位置の基準が見つかりません/);
  });

  it("パーツどうしが互いを基準にしたら記法の誤りとして返す", () => {
    expect(() =>
      boxesOf(`title: "t"
type: flow
actors:
  - Web: service
  - a:
      kind: achievement
      位置: b の右 200
  - b:
      kind: clock
      位置: a の右 200
flow:
  - Web -> Web: "a"
`),
    ).toThrow(/互いを指しています/);
  });

  it("catalog が無い時も図は出る (パーツは展開されないだけ)", () => {
    const src = `title: "t"
type: flow
actors:
  - Web: service
  - 実績:
      kind: achievement
      位置: Web の右 200
flow:
  - Web -> Web: "a"
`;
    expect(() => textDslToDiagram(src)).not.toThrow();
  });
});
