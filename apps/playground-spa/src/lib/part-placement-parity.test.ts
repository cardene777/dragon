/**
 * 位置を書かなかったパーツが、 画面経路と組み立て経路で同じ場所に来ることの検証 (#937)。
 *
 * 画面はパーツを本文から抜いて別に重ね、 組み立ては catalog の図を本体に取り込む。 2 つが
 * 別々に置き場所を決めていたため、 同じ本文でも通った経路で絵が変わっていた。
 *
 * 比べるのは **箱の外接矩形の左上**。 画面側は図枠を置くので、 図枠の中の余白を足して箱の
 * 位置に直してから比べる。 図枠そのものを比べると、 余白が左右で違う分 (実測 = 左 60 / 右 85)
 * だけ常にずれて見える。
 *
 * 中心ではなく左上を比べるのは、 段を 2 つ以上持つパーツが取り込んだ後に本体の送り幅で
 * 並び直すため (実測 = 単体では高さ 300、 取り込むと 320)。 高さが変わる以上、 中心と左上を
 * 同時には合わせられない。 上端を合わせる方を選ぶと、 段内で並べた時の揃いも保たれる。
 */
import { describe, it, expect } from "vitest";
import { diagram, layout } from "@cardenelabs/cdl";
import type { CdlDiagram } from "@cardenelabs/cdl";
import { textDslToDiagram, measureActorBoxes } from "@cardenelabs/dragon";
import { extractPartsFromSrc, placeParts, partWorldSize } from "./overlay-dsl";
import type { CatalogItem } from "@/lib/catalog-items";

/** 見本のパーツ。 段の数と大きさを変えて作る。 */
function makePart(id: string, w: number, h: number, stacks = 1): CdlDiagram {
  const b = diagram(id, { topic: id }).lane("l", { width: w });
  for (let i = 0; i < stacks; i += 1) {
    b.node(`n${i}`, { lane: "l", stack: i, kind: "card", title: `${id}${i}`, w, h });
  }
  return b.build();
}

const PARTS: Record<string, CdlDiagram> = {
  wide: makePart("wide", 400, 300),
  small: makePart("small", 200, 100),
  tall: makePart("tall", 400, 200, 2),
};

/** 組み立て側が受け取る形 (`kind` と `parts-{kind}` の両方を引ける)。 */
const CATALOG: Record<string, CdlDiagram> = Object.fromEntries(
  Object.entries(PARTS).flatMap(([k, v]) => [
    [k, v],
    [`parts-${k}`, v],
  ]),
);

/** 画面側が受け取る形。 */
const ITEMS = Object.entries(PARTS).map(
  ([k, v]) => ({ id: `parts-${k}`, title: k, diagram: v }) as CatalogItem,
);
const KIND_SET: Record<string, unknown> = Object.fromEntries(
  Object.keys(PARTS).flatMap((k) => [
    [k, {}],
    [`parts-${k}`, {}],
  ]),
);

/** 図枠の左上から、 箱の外接矩形の左上までの余白。 */
function framePadding(part: CdlDiagram): { left: number; top: number } {
  const own = layout(part);
  let x0 = Infinity;
  let y0 = Infinity;
  for (const n of own.nodes) {
    x0 = Math.min(x0, n.cx - n.w / 2);
    y0 = Math.min(y0, n.cy - n.h / 2);
  }
  return { left: x0 - own.viewBox.x, top: y0 - own.viewBox.y };
}

/** 組み立て経路。 取り込まれた箱の外接矩形の左上を別名ごとに返す。 */
function libraryCenters(src: string): Map<string, { cx: number; cy: number }> {
  const laid = layout(textDslToDiagram(src, { partsCatalog: CATALOG }));
  const acc = new Map<string, { x0: number; y0: number; x1: number; y1: number }>();
  for (const n of laid.nodes) {
    const id = String(n.id ?? "");
    if (!id.includes("__")) continue;
    const alias = id.split("__")[0]!;
    const cur = acc.get(alias) ?? { x0: Infinity, y0: Infinity, x1: -Infinity, y1: -Infinity };
    acc.set(alias, {
      x0: Math.min(cur.x0, n.cx - n.w / 2),
      x1: Math.max(cur.x1, n.cx + n.w / 2),
      y0: Math.min(cur.y0, n.cy - n.h / 2),
      y1: Math.max(cur.y1, n.cy + n.h / 2),
    });
  }
  const out = new Map<string, { cx: number; cy: number }>();
  for (const [alias, b] of acc) {
    out.set(alias, { cx: b.x0, cy: b.y0 });
  }
  return out;
}

/** 画面経路。 重ねた図枠の中の、 箱の外接矩形の左上を別名ごとに返す。 */
function screenCenters(src: string): Map<string, { cx: number; cy: number }> {
  const parsed = extractPartsFromSrc(src, KIND_SET, ITEMS);
  const base = textDslToDiagram(parsed.baseSrc);
  const placed = placeParts(
    parsed.parts,
    measureActorBoxes(base),
    partWorldSize,
    base.nodes.length,
  );
  const out = new Map<string, { cx: number; cy: number }>();
  for (const p of placed) {
    // `placeParts` が返すのは図枠の左上。 余白を足して箱の左上に直す
    const pad = framePadding(p.item.diagram);
    out.set(p.id, { cx: p.posX + pad.left, cy: p.posY + pad.top });
  }
  return out;
}

describe("位置を書かないパーツの置き場所 (#937)", () => {
  const src = `title: "t"
type: sequence

actors:
  - 本体: {}
  - a: { kind: wide }
  - b: { kind: small }
  - c: { kind: tall }
`;

  it("画面と組み立てで同じ場所になる", () => {
    const lib = libraryCenters(src);
    const scr = screenCenters(src);
    expect([...scr.keys()].sort(), "画面側でパーツが読めていない").toEqual(["a", "b", "c"]);
    for (const id of ["a", "b", "c"]) {
      const l = lib.get(id);
      const s = scr.get(id);
      expect(l, `組み立て側に ${id} が無い`).toBeDefined();
      expect(s, `画面側に ${id} が無い`).toBeDefined();
      expect(s!.cx, `${id} の横がずれている`).toBeCloseTo(l!.cx, 1);
      expect(s!.cy, `${id} の縦がずれている`).toBeCloseTo(l!.cy, 1);
    }
  });

  it("段の中で上端が揃う", () => {
    // 高さの違うパーツを並べた時、 段の中で上が揃っていないと図として読みにくい。
    // 段を 2 つ持つパーツ (c) も含めて揃うことを見る = 中心で合わせるとここが 12.5 ずれる
    const lib = libraryCenters(src);
    const tops = ["a", "b", "c"].map((id) => lib.get(id)!.cy);
    expect(tops[1], "a と b で上端が揃っていない").toBeCloseTo(tops[0]!, 1);
    expect(tops[2], "段を 2 つ持つパーツだけ上端がずれている").toBeCloseTo(tops[0]!, 1);
  });

  it("記号を含む名前でも同じ場所になる", () => {
    // 列の id は名前を slug に変換して作るため、 名前で引くと記号を含む名前だけ取りこぼす。
    // 取りこぼすと格子の起点が 1 段ぶん下がる (実測 = 1140 に対し 1420)
    const named = `title: "t"
type: sequence

actors:
  - 本体: {}
  - "My Part": { kind: wide }
`;
    const lib = libraryCenters(named);
    const scr = screenCenters(named);
    expect(scr.get("My Part")!.cx, "横がずれている").toBeCloseTo(lib.get("My Part")!.cx, 1);
    expect(scr.get("My Part")!.cy, "縦がずれている").toBeCloseTo(lib.get("My Part")!.cy, 1);
  });

  it("相対で書いた間隔が 2 経路で同じになる", () => {
    // 間隔は見えている箱の縁から測る。 図枠の縁で測ると余白のぶん広がる
    // (実測 = 200 と書いて画面側は 260 空いた)
    const rel = `title: "t"
type: flow

actors:
  - Web: service
  - p:
      kind: wide
      位置: Web の右 200

flow:
  - Web -> Web: "x"
`;
    const laid = layout(textDslToDiagram(rel, { partsCatalog: CATALOG }));
    const web = laid.nodes.filter((n) => !n.id.startsWith("p__"));
    const part = laid.nodes.filter((n) => n.id.startsWith("p__"));
    const libGap =
      Math.min(...part.map((n) => n.cx - n.w / 2)) - Math.max(...web.map((n) => n.cx + n.w / 2));
    expect(libGap, "組み立て側の間隔が書いた値と違う").toBeCloseTo(200, 1);

    const parsed = extractPartsFromSrc(rel, KIND_SET, ITEMS);
    const base = textDslToDiagram(parsed.baseSrc);
    const boxes = measureActorBoxes(base);
    const placed = placeParts(parsed.parts, boxes, partWorldSize, base.nodes.length);
    const p = placed.find((x) => x.id === "p")!;
    const pad = framePadding(p.item.diagram);
    const anchor = boxes.get("Web")!;
    const scrGap = p.posX + pad.left - (anchor.cx + anchor.w / 2);
    expect(scrGap, "画面側の間隔が書いた値と違う").toBeCloseTo(200, 1);
  });

  it("座標で書いたパーツも 2 経路で同じ場所になる", () => {
    // 書いた座標は箱の中心を指す。 画面側が図枠の中心として扱うと、
    // 余白が左右で違う分 (実測 12.5) だけずれる
    const fixed = `title: "t"
type: flow

actors:
  - Web: service
  - p:
      kind: wide
      位置: 1000,500

flow:
  - Web -> Web: "x"
`;
    const laid = layout(textDslToDiagram(fixed, { partsCatalog: CATALOG }));
    const part = laid.nodes.filter((n) => n.id.startsWith("p__"));
    const libCx =
      (Math.min(...part.map((n) => n.cx - n.w / 2)) + Math.max(...part.map((n) => n.cx + n.w / 2))) /
      2;

    const parsed = extractPartsFromSrc(fixed, KIND_SET, ITEMS);
    const base = textDslToDiagram(parsed.baseSrc);
    const placed = placeParts(parsed.parts, measureActorBoxes(base), partWorldSize, base.nodes.length);
    const p = placed.find((x) => x.id === "p")!;
    const pad = framePadding(p.item.diagram);
    const own = layout(p.item.diagram);
    const boxW =
      Math.max(...own.nodes.map((n) => n.cx + n.w / 2)) -
      Math.min(...own.nodes.map((n) => n.cx - n.w / 2));
    const scrCx = p.posX + pad.left + boxW / 2;
    expect(scrCx, "書いた座標の指す場所が経路で違う").toBeCloseTo(libCx, 1);
  });

  it("本体と同じ名前のパーツでも本体に重ならない", () => {
    // 名札でも列でも本体と区別できない。 区別できない時に「パーツのもの」 として数から外すと、
    // 本体の箱まで消えてパーツが本体の中に入る (実測 = 上端が 1140 から 300 に飛んだ)。
    // 外さない側に倒すと間隔が広がるだけで済む
    const dup = `title: "t"
type: sequence

actors:
  - p: {}
  - p: { kind: wide }
`;
    const laid = layout(textDslToDiagram(dup, { partsCatalog: CATALOG }));
    const part = laid.nodes.filter((n) => n.id.startsWith("p__"));
    expect(part.length, "パーツが取り込まれていない").toBeGreaterThan(0);
    const partTop = Math.min(...part.map((n) => n.cy - n.h / 2));
    const baseBottom = Math.max(
      ...laid.nodes.filter((n) => !n.id.startsWith("p__")).map((n) => n.cy + n.h / 2),
    );
    expect(partTop, `パーツが本体に重なっている (${partTop} < ${baseBottom})`).toBeGreaterThan(
      baseBottom,
    );
  });

  it("大きさを書いて図枠より大きくしても隣に重ならない", () => {
    // 図枠だけを確保すると、 大きさで広げた箱が隣に重なる
    // (実測 = x=60..2060 の箱の隣が 725 から始まり 1335 重なった)
    const sized = `title: "t"
type: sequence

actors:
  - 本体: {}
  - big:
      kind: wide
      大きさ: 2000,300
  - next: { kind: small }
`;
    const laid = layout(textDslToDiagram(sized, { partsCatalog: CATALOG }));
    const spanOf = (alias: string): { x0: number; x1: number } => {
      const ns = laid.nodes.filter((n) => n.id.startsWith(`${alias}__`));
      return {
        x0: Math.min(...ns.map((n) => n.cx - n.w / 2)),
        x1: Math.max(...ns.map((n) => n.cx + n.w / 2)),
      };
    };
    const big = spanOf("big");
    const next = spanOf("next");
    expect(big.x1 - big.x0, "大きさが効いていない").toBeGreaterThan(1000);
    expect(next.x0, `隣に重なっている (${big.x1} と ${next.x0})`).toBeGreaterThanOrEqual(big.x1);
  });

  it("箱を持たないパーツでも場所が決まる", () => {
    // 実体を readout で描くパーツは箱が 1x1 しかない。 箱を物差しにすると場所が潰れる
    const boxless: CdlDiagram = {
      id: "parts-ring",
      topic: "ring",
      lanes: [{ id: "l", x: 0, width: 400 }],
      nodes: [
        { id: "hidden", lane: "l", stack: 0, kind: "actor", w: 1, h: 1 },
      ] as CdlDiagram["nodes"],
      edges: [],
      states: [{ id: "v", initial: 50 }],
      phases: [
        { id: "p", duration: 1000, title: "静止", body: "", activate: [], tweens: [], sets: [] },
      ] as CdlDiagram["phases"],
      readouts: [
        { id: "ring", kind: "gauge", source: "{v}", nodeId: "hidden" },
      ] as unknown as CdlDiagram["readouts"],
    };
    const cat = { ...CATALOG, ring: boxless, "parts-ring": boxless };
    const items = [...ITEMS, { id: "parts-ring", title: "ring", diagram: boxless } as CatalogItem];
    const kinds = { ...KIND_SET, ring: {}, "parts-ring": {} };
    const withRing = `title: "t"
type: sequence

actors:
  - 本体: {}
  - r: { kind: ring }
  - w: { kind: wide }
`;
    const laid = layout(textDslToDiagram(withRing, { partsCatalog: cat }));
    const ring = laid.nodes.filter((n) => n.id.startsWith("r__"));
    expect(ring.length, "パーツが取り込まれていない").toBeGreaterThan(0);

    const parsed = extractPartsFromSrc(withRing, kinds, items);
    const base = textDslToDiagram(parsed.baseSrc);
    const placed = placeParts(parsed.parts, measureActorBoxes(base), partWorldSize, base.nodes.length);
    const r = placed.find((p) => p.id === "r")!;
    const w = placed.find((p) => p.id === "w")!;
    // 箱を物差しにすると幅 1 の列になって重なる。 図枠なら離れる
    expect(Math.abs(r.posX - w.posX), "画面側でパーツが重なっている").toBeGreaterThan(100);
  });

  it("パーツを 4 個置くと 2 段目に折り返す", () => {
    // 1 段 3 個。 折り返しの規則も 2 経路で同じであることを見る
    const four = `title: "t"
type: sequence

actors:
  - 本体: {}
  - a: { kind: wide }
  - b: { kind: small }
  - c: { kind: wide }
  - d: { kind: small }
`;
    const lib = libraryCenters(four);
    const scr = screenCenters(four);
    expect(lib.get("d")!.cy, "4 個目が 2 段目に落ちていない").toBeGreaterThan(lib.get("a")!.cy);
    for (const id of ["a", "b", "c", "d"]) {
      expect(scr.get(id)!.cx, `${id} の横がずれている`).toBeCloseTo(lib.get(id)!.cx, 1);
      expect(scr.get(id)!.cy, `${id} の縦がずれている`).toBeCloseTo(lib.get(id)!.cy, 1);
    }
  });
});
