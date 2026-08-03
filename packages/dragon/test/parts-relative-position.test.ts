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
import { partsGridCenters } from "../src/compile";
import type { CompileNotice } from "../src/compile";

/** 大きさを指定して作る見本のパーツ。 実際の catalog と同じ形 (1 lane + 1 node)。 */
function makePart(id: string, w: number, h: number): CdlDiagram {
  return diagram(id, { topic: id })
    .lane("l", { width: w })
    .node("box", { lane: "l", stack: 0, kind: "card", title: id, w, h })
    .build();
}

/** 段を 2 つ持つパーツ。 実際の高さは 1 段の箱の高さより大きい。 */
function makeStackedPart(id: string, w: number, h: number): CdlDiagram {
  return diagram(id, { topic: id })
    .lane("l", { width: w })
    .node("top", { lane: "l", stack: 0, kind: "card", title: "上", w, h })
    .node("bottom", { lane: "l", stack: 1, kind: "card", title: "下", w, h })
    .build();
}

const CATALOG: Record<string, CdlDiagram> = {
  achievement: makePart("achievement", 400, 300),
  "parts-achievement": makePart("achievement", 400, 300),
  clock: makePart("clock", 200, 200),
  "parts-clock": makePart("clock", 200, 200),
  stacked: makeStackedPart("stacked", 400, 200),
  "parts-stacked": makeStackedPart("stacked", 400, 200),
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

describe("パーツの大きさの見積り", () => {
  it("段を持つパーツでも書いた間隔になる", () => {
    // 一番高い箱の高さだけで見ると、 段の分の高さを取りこぼす
    // (実測 = 2 段 400x200 の実高は 420、 200 と見て間隔が 90 になった)
    const { boxes, notices } = boxesOf(`title: "t"
type: flow
actors:
  - Web: service
  - 積:
      kind: stacked
      位置: Web の下 200
flow:
  - Web -> Web: "a"
`);
    const web = boxes.get("Web")!;
    const part = boxes.get("積")!;
    expect(part.y0 - web.y1).toBeCloseTo(200, 0);
    expect(notices).toEqual([]);
  });

  it("段を持つパーツを基準にしても書いた間隔になる", () => {
    const { boxes } = boxesOf(`title: "t"
type: flow
actors:
  - 積:
      kind: stacked
      位置: 1000,1000
  - 時計:
      kind: clock
      位置: 積 の下 150
flow:
  - 積 -> 積: "a"
`);
    const part = boxes.get("積")!;
    const clock = boxes.get("時計")!;
    expect(clock.y0 - part.y1).toBeCloseTo(150, 0);
  });

  it("大きさを書いた時はその大きさで間隔を測る (横)", () => {
    const { boxes } = boxesOf(`title: "t"
type: flow
actors:
  - Web: service
  - 実績:
      kind: achievement
      位置: Web の右 200
      大きさ: 800,600
flow:
  - Web -> Web: "a"
`);
    const web = boxes.get("Web")!;
    const part = boxes.get("実績")!;
    expect(part.x0 - web.x1).toBeCloseTo(200, 0);
  });

  it("大きさを書いた時はその大きさで間隔を測る (縦)", () => {
    // 縦の拡大を無視すると、 元の高さで間隔を測って狙いからずれる
    const { boxes } = boxesOf(`title: "t"
type: flow
actors:
  - Web: service
  - 実績:
      kind: achievement
      位置: Web の下 200
      大きさ: 800,900
flow:
  - Web -> Web: "a"
`);
    const web = boxes.get("Web")!;
    const part = boxes.get("実績")!;
    expect(part.y0 - web.y1).toBeCloseTo(200, 0);
  });
});

describe("片方だけ書いた座標の扱い", () => {
  it("縦だけ / 横だけ書いたパーツは格子の枠を消費しない", () => {
    // 組み立て側が格子に落とすのは両方欠けた時だけ。 条件が食い違うと後続がずれる
    // (実測 = 後続の中心が 200 から 720 に動いた)
    const { boxes } = boxesOf(`title: "t"
type: flow
actors:
  - Web: service
  - x:
      kind: stacked
      posX: 5000
  - y: stacked
flow:
  - Web -> Web: "a"
`);
    const only = boxesOf(`title: "t"
type: flow
actors:
  - Web: service
  - y: stacked
flow:
  - Web -> Web: "a"
`);
    expect(boxes.get("y")!.cx).toBeCloseTo(only.boxes.get("y")!.cx, 0);
  });
});

describe("catalog の値が異常な時", () => {
  it("大きさが数でないパーツでも図は出る", () => {
    const broken = diagram("broken", { topic: "broken" })
      .lane("l", { width: 400 })
      .node("box", { lane: "l", stack: 0, kind: "card", title: "x", w: 400, h: 300 })
      .build();
    // 幅と高さを壊す (catalog は呼出側が渡す値なので、 異常値でも落ちない)
    (broken.lanes[0] as { width: number }).width = Number.NaN;
    (broken.nodes[0] as { h?: number }).h = Number.POSITIVE_INFINITY;
    const catalog = { ...CATALOG, broken, "parts-broken": broken };
    const src = `title: "t"
type: flow
actors:
  - Web: service
  - b:
      kind: broken
      位置: Web の右 200
flow:
  - Web -> Web: "a"
`;
    const d = textDslToDiagram(src, { partsCatalog: catalog });
    // 異常値をそのまま計算に入れると、 座標が非有限になって図が描けない
    const laid = layout(d);
    for (const n of laid.nodes) {
      expect(Number.isFinite(n.cx), `${n.id} の横位置が数でない`).toBe(true);
      expect(Number.isFinite(n.cy), `${n.id} の縦位置が数でない`).toBe(true);
      expect(Number.isFinite(n.w) && Number.isFinite(n.h), `${n.id} の大きさが数でない`).toBe(true);
    }
    // 縦列も見る。 幅が数でないと枠が描けず、 図枠の計算も崩れる
    for (const l of laid.lanes) {
      expect(Number.isFinite(l.width), `${l.id} の幅が数でない`).toBe(true);
      expect(Number.isFinite(l.x ?? 0), `${l.id} の位置が数でない`).toBe(true);
    }
    for (const v of [laid.viewBox.x, laid.viewBox.y, laid.viewBox.w, laid.viewBox.h]) {
      expect(Number.isFinite(v), "図枠が数でない").toBe(true);
    }
  });
});

describe("パーツの形が変わっても間隔は書いた通り", () => {
  /** 段と高さを指定して作るパーツ。 */
  function shaped(id: string, nodes: Array<{ stack: number; h: number }>): CdlDiagram {
    let b = diagram(id, { topic: id }).lane("l", { width: 400 });
    nodes.forEach((n, i) => {
      b = b.node(`n${i}`, { lane: "l", stack: n.stack, kind: "card", title: `n${i}`, w: 400, h: n.h });
    });
    return b.build();
  }

  /**
   * 一番高い箱の高さと段数から概算すると、 形によって間隔が狂う。
   * 実測 = 段 5 だけで 750、 段 0 高さ 0.5 で 299.8、 段 0/5 で高さ違いなら 275 になった。
   */
  const SHAPES: Array<{ label: string; nodes: Array<{ stack: number; h: number }> }> = [
    { label: "段 0 のみ", nodes: [{ stack: 0, h: 200 }] },
    { label: "段 5 のみ", nodes: [{ stack: 5, h: 200 }] },
    { label: "段 -5 のみ", nodes: [{ stack: -5, h: 200 }] },
    { label: "高さが極小", nodes: [{ stack: 0, h: 0.5 }] },
    { label: "段が飛ぶ + 高さ違い", nodes: [{ stack: 0, h: 50 }, { stack: 5, h: 200 }] },
    { label: "段が連続 + 高さ違い", nodes: [{ stack: 0, h: 300 }, { stack: 1, h: 100 }] },
    { label: "段が逆順", nodes: [{ stack: 3, h: 100 }, { stack: 1, h: 250 }] },
  ];

  for (const shape of SHAPES) {
    it(`${shape.label}: 下に 200 空ける`, () => {
      const part = shaped("s", shape.nodes);
      const catalog = { ...CATALOG, s: part, "parts-s": part };
      const d = textDslToDiagram(
        `title: "t"
type: flow
actors:
  - Web: service
  - x:
      kind: s
      位置: Web の下 200
flow:
  - Web -> Web: "a"
`,
        { partsCatalog: catalog },
      );
      const laid = layout(d);
      const span = (pred: (n: { id: string; title?: string }) => boolean): { y0: number; y1: number } => {
        const ns = laid.nodes.filter(pred);
        return {
          y0: Math.min(...ns.map((n) => n.cy - n.h / 2)),
          y1: Math.max(...ns.map((n) => n.cy + n.h / 2)),
        };
      };
      const web = span((n) => n.title === "Web");
      const p = span((n) => n.id.includes("__"));
      expect(p.y0 - web.y1, `${shape.label} の間隔`).toBeCloseTo(200, 0);
    });
  }
});

describe("形が非対称なパーツを基準にする", () => {
  it("基準の中心のずれを反映する", () => {
    // 段ごとに高さが違うパーツは、 渡す座標 (段の中心) と矩形の中心がずれる。
    // 反映しないと基準の位置を取り違えて間隔が狂う
    const part = diagram("asym", { topic: "asym" })
      .lane("l", { width: 400 })
      .node("a", { lane: "l", stack: 0, kind: "card", title: "a", w: 400, h: 50 })
      .node("b", { lane: "l", stack: 5, kind: "card", title: "b", w: 400, h: 300 })
      .build();
    const catalog = { ...CATALOG, asym: part, "parts-asym": part };
    const d = textDslToDiagram(
      `title: "t"
type: flow
actors:
  - 基:
      kind: asym
      位置: 2000,2000
  - 時計:
      kind: clock
      位置: 基 の下 150
flow:
  - 基 -> 基: "a"
`,
      { partsCatalog: catalog },
    );
    const laid = layout(d);
    const span = (prefix: string): { y0: number; y1: number } => {
      const ns = laid.nodes.filter((n) => n.id.startsWith(`${prefix}__`));
      return {
        y0: Math.min(...ns.map((n) => n.cy - n.h / 2)),
        y1: Math.max(...ns.map((n) => n.cy + n.h / 2)),
      };
    };
    const base = span("基");
    const clock = span("時計");
    expect(clock.y0 - base.y1).toBeCloseTo(150, 0);
  });
});

describe("catalog の縦列幅が異常で拡大を書いた時", () => {
  it("拡大の基準が崩れて桁違いの箱にならない", () => {
    // 生値で bbox を出すと拡大の基準が 1 に落ち、 箱が桁違いに大きくなる
    // (実測 = 指定間隔 200 が -31800 になった)
    const broken = diagram("bw", { topic: "bw" })
      .lane("l", { width: 400 })
      .node("box", { lane: "l", stack: 0, kind: "card", title: "x", w: 400, h: 300 })
      .build();
    (broken.lanes[0] as { width: number }).width = Number.NaN;
    const catalog = { ...CATALOG, bw: broken, "parts-bw": broken };
    const d = textDslToDiagram(
      `title: "t"
type: flow
actors:
  - Web: service
  - b:
      kind: bw
      位置: Web の右 200
      大きさ: 800,600
flow:
  - Web -> Web: "a"
`,
      { partsCatalog: catalog },
    );
    const laid = layout(d);
    const part = laid.nodes.filter((n) => n.id.includes("__"));
    for (const n of part) {
      expect(n.w).toBeLessThan(10000);
      expect(Number.isFinite(n.cx)).toBe(true);
    }
    const web = laid.nodes.find((n) => n.title === "Web")!;
    const x0 = Math.min(...part.map((n) => n.cx - n.w / 2));
    expect(x0 - (web.cx + web.w / 2)).toBeCloseTo(200, 0);
  });
});

describe("格子に並べた時の段内の揃い", () => {
  /** 段ごとに箱の高さが違うパーツ。 矩形の中心が段の中心からずれる */
  function twoStack(id: string, h1: number, h2: number): CdlDiagram {
    return diagram(id, { topic: id })
      .lane("l", { width: 400 })
      .node("a", { lane: "l", stack: 0, kind: "card", title: "a", w: 400, h: h1 })
      .node("b", { lane: "l", stack: 1, kind: "card", title: "b", w: 400, h: h2 })
      .build();
  }

  it("段ごとに高さが違うパーツも段内で上端が揃う", () => {
    // 矩形の中心と merge に渡す座標のずれを引かないと揃わない
    // (実測 = 対称なパーツの上端 520 に対して非対称は 507.5)
    const sym = twoStack("sym", 100, 100);
    const asym = twoStack("asym", 100, 50);
    const catalog = { ...CATALOG, sym, "parts-sym": sym, asym, "parts-asym": asym };
    const d = textDslToDiagram(
      `title: "t"
type: flow
actors:
  - Web: service
  - s: sym
  - a: asym
flow:
  - Web -> Web: "x"
`,
      { partsCatalog: catalog },
    );
    const laid = layout(d);
    const topOf = (prefix: string): number => {
      const ns = laid.nodes.filter((n) => n.id.startsWith(`${prefix}__`));
      return Math.min(...ns.map((n) => n.cy - n.h / 2));
    };
    expect(topOf("a")).toBeCloseTo(topOf("s"), 1);
  });
});

describe("格子の規則に異常な値を渡した時", () => {
  it("箱の数が数でなければ 0 として扱う", () => {
    const a = partsGridCenters(Number.NaN, [{ id: "x", w: 100, h: 100 }]).get("x")!;
    const b = partsGridCenters(0, [{ id: "x", w: 100, h: 100 }]).get("x")!;
    expect(a).toEqual(b);
  });

  it("箱の数が負なら 0 として扱う", () => {
    const a = partsGridCenters(-5, [{ id: "x", w: 100, h: 100 }]).get("x")!;
    const b = partsGridCenters(0, [{ id: "x", w: 100, h: 100 }]).get("x")!;
    expect(a).toEqual(b);
  });

  it("桁が溢れる大きさは返さない (描けない座標を渡さない)", () => {
    // 2 個目の列は `送り幅 + 送り幅/2` になるので、 最大値だと桁が溢れる
    const out = partsGridCenters(1, [
      { id: "x", w: Number.MAX_VALUE, h: Number.MAX_VALUE },
      { id: "y", w: Number.MAX_VALUE, h: Number.MAX_VALUE },
    ]);
    expect(out.size, "桁が溢れた分を返している").toBeLessThan(2);
    for (const c of out.values()) {
      expect(Number.isFinite(c.cx) && Number.isFinite(c.cy)).toBe(true);
    }
  });

  it("同じ名前が 2 度来たら先の方を残す", () => {
    const out = partsGridCenters(1, [
      { id: "x", w: 100, h: 100 },
      { id: "x", w: 900, h: 900 },
    ]);
    expect(out.size).toBe(1);
    const only = out.get("x")!;
    const first = partsGridCenters(1, [{ id: "x", w: 100, h: 100 }]).get("x")!;
    expect(only).toEqual(first);
  });

  it("空なら何も返さない", () => {
    expect(partsGridCenters(1, []).size).toBe(0);
  });
});
