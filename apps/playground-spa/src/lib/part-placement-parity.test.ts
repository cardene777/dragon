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
import {
  parseTextDslV05,
  textDslToDiagram,
  measureActorBoxes,
  partScaleFactor,
  partBoxInFrame,
  MAX_PART_SCALE,
} from "@cardenelabs/dragon";
import { extractPartsFromSrc, placeParts, partWorldSize, partBoxRect, partFrameSize } from "./overlay-dsl";
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

  it("上下の相対でも 2 経路で同じになる", () => {
    // 横だけ見ていると、縦の余白 (上 60 / 下 60) を引き忘れた実装が通ってしまう
    const below = `title: "t"
type: flow

actors:
  - Web: service
  - p:
      kind: wide
      位置: Web の下 200

flow:
  - Web -> Web: "x"
`;
    const laid = layout(textDslToDiagram(below, { partsCatalog: CATALOG }));
    const web = laid.nodes.filter((n) => !n.id.startsWith("p__"));
    const part = laid.nodes.filter((n) => n.id.startsWith("p__"));
    const libGap =
      Math.min(...part.map((n) => n.cy - n.h / 2)) - Math.max(...web.map((n) => n.cy + n.h / 2));
    expect(libGap, "組み立て側の間隔が書いた値と違う").toBeCloseTo(200, 1);

    const parsed = extractPartsFromSrc(below, KIND_SET, ITEMS);
    const base = textDslToDiagram(parsed.baseSrc);
    const boxes = measureActorBoxes(base);
    const placed = placeParts(parsed.parts, boxes, partWorldSize, base.nodes.length);
    const p = placed.find((x) => x.id === "p")!;
    const pad = framePadding(p.item.diagram);
    const anchor = boxes.get("Web")!;
    expect(p.posY + pad.top - (anchor.cy + anchor.h / 2), "画面側の縦の間隔が違う").toBeCloseTo(200, 1);

    // 横は基準の中心に揃う。 中心の合わせ方も 2 経路で同じであることを見る
    const libCx =
      (Math.min(...part.map((n) => n.cx - n.w / 2)) + Math.max(...part.map((n) => n.cx + n.w / 2))) / 2;
    const own = layout(p.item.diagram);
    const boxW =
      Math.max(...own.nodes.map((n) => n.cx + n.w / 2)) -
      Math.min(...own.nodes.map((n) => n.cx - n.w / 2));
    expect(p.posX + pad.left + boxW / 2, "画面側の横の中心が違う").toBeCloseTo(libCx, 1);
  });

  it("パーツを基準にした連鎖でも 2 経路で同じになる", () => {
    // 基準として出す矩形が箱ではなく図枠になっていると、連鎖するたびに余白のぶん開いていく
    const chain = `title: "t"
type: flow

actors:
  - Web: service
  - a:
      kind: wide
      位置: Web の右 200
  - b:
      kind: small
      位置: a の右 200
  - c:
      kind: wide
      位置: b の右 200

flow:
  - Web -> Web: "x"
`;
    const laid = layout(textDslToDiagram(chain, { partsCatalog: CATALOG }));
    const leftOf = (alias: string): number => {
      const ns = laid.nodes.filter((n) => n.id.startsWith(`${alias}__`));
      return Math.min(...ns.map((n) => n.cx - n.w / 2));
    };

    const parsed = extractPartsFromSrc(chain, KIND_SET, ITEMS);
    const base = textDslToDiagram(parsed.baseSrc);
    const placed = placeParts(parsed.parts, measureActorBoxes(base), partWorldSize, base.nodes.length);
    for (const id of ["a", "b", "c"]) {
      const p = placed.find((x) => x.id === id)!;
      const pad = framePadding(p.item.diagram);
      expect(p.posX + pad.left, `${id} の横がずれている`).toBeCloseTo(leftOf(id), 1);
    }
  });

  it("倍率を書くと箱も余白も同じだけ伸びる", () => {
    // 倍率は画面側だけの機能 (組み立て側は見ない)。 図枠にだけ掛けて箱や余白に掛け忘れると、
    // 拡大したパーツの位置だけがずれる
    const parsed = extractPartsFromSrc(
      `actors:\n  - p: { kind: wide, posX: 0, posY: 0, scale: 2 }\n`,
      KIND_SET,
      ITEMS,
    );
    const doubled = parsed.parts.find((x) => x.id === "p")!;
    const single = { ...doubled, scale: 1 };
    const b1 = partBoxRect(single);
    const b2 = partBoxRect(doubled);
    expect(b2.w).toBeCloseTo(b1.w * 2, 1);
    expect(b2.h).toBeCloseTo(b1.h * 2, 1);
    expect(b2.left, "余白に倍率が掛かっていない").toBeCloseTo(b1.left * 2, 1);
    expect(b2.top, "余白に倍率が掛かっていない").toBeCloseTo(b1.top * 2, 1);
    expect(partWorldSize(doubled).w).toBeCloseTo(partWorldSize(single).w * 2, 1);
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

  it("大きさを書いたパーツが 2 経路で同じ大きさになる", () => {
    // 画面側が `大きさ:` を読まなかった頃は、組み立て側だけが伸び、それを基準にした
    // 相対指定が 800 ずれていた (#1018)
    const sized = `title: "t"
type: flow

actors:
  - Web: service
  - a:
      kind: wide
      位置: 1000,500
      大きさ: 2000,300

flow:
  - Web -> Web: "x"
`;
    const laid = layout(textDslToDiagram(sized, { partsCatalog: CATALOG }));
    const ns = laid.nodes.filter((n) => n.id.startsWith("a__"));
    const libW =
      Math.max(...ns.map((n) => n.cx + n.w / 2)) - Math.min(...ns.map((n) => n.cx - n.w / 2));

    const parsed = extractPartsFromSrc(sized, KIND_SET, ITEMS);
    const a = parsed.parts.find((x) => x.id === "a")!;
    expect(a.posW, "大きさが読めていない").toBe(2000);
    expect(a.posH, "大きさが読めていない").toBe(300);
    expect(partBoxRect(a).w, "画面側の箱が組み立て側と違う").toBeCloseTo(libW, 1);
  });

  it("大きさを書いたパーツを基準にした相対でも 2 経路で同じになる", () => {
    const chain = `title: "t"
type: flow

actors:
  - Web: service
  - a:
      kind: wide
      位置: 1000,500
      大きさ: 2000,300
  - b:
      kind: small
      位置: a の右 200

flow:
  - Web -> Web: "x"
`;
    const laid = layout(textDslToDiagram(chain, { partsCatalog: CATALOG }));
    const bs = laid.nodes.filter((n) => n.id.startsWith("b__"));
    const libLeft = Math.min(...bs.map((n) => n.cx - n.w / 2));

    const parsed = extractPartsFromSrc(chain, KIND_SET, ITEMS);
    const base = textDslToDiagram(parsed.baseSrc);
    const placed = placeParts(parsed.parts, measureActorBoxes(base), partWorldSize, base.nodes.length);
    const b = placed.find((x) => x.id === "b")!;
    expect(b.posX + partBoxRect(b).left, "基準の幅が経路で違う").toBeCloseTo(libLeft, 1);
  });

  it("大きさを書いたパーツの縦も 2 経路で同じになる", () => {
    // 横だけ見ていると、縦の倍率を常に 1 にする実装が通ってしまう
    const sized = `title: "t"
type: flow

actors:
  - Web: service
  - a:
      kind: wide
      位置: 1000,500
      大きさ: 2000,300

flow:
  - Web -> Web: "x"
`;
    const laid = layout(textDslToDiagram(sized, { partsCatalog: CATALOG }));
    const ns = laid.nodes.filter((n) => n.id.startsWith("a__"));
    const libH =
      Math.max(...ns.map((n) => n.cy + n.h / 2)) - Math.min(...ns.map((n) => n.cy - n.h / 2));
    const libTop = Math.min(...ns.map((n) => n.cy - n.h / 2));

    const parsed = extractPartsFromSrc(sized, KIND_SET, ITEMS);
    const base = textDslToDiagram(parsed.baseSrc);
    const placed = placeParts(parsed.parts, measureActorBoxes(base), partWorldSize, base.nodes.length);
    const a = placed.find((x) => x.id === "a")!;
    expect(partBoxRect(a).h, "画面側の箱の高さが組み立て側と違う").toBeCloseTo(libH, 1);
    // 余白の伸縮は test 側で独立に出す。 実装の値を足し引きすると打ち消し合って見えなくなる
    // (横は縦列の幅 400 に対して 2000 で 5 倍、縦は段の送り幅 220 に対して 300 で 1.36 倍)
    const pad = framePadding(a.item.diagram);
    expect(a.posY + pad.top * (300 / 220), "画面側の箱の上端が組み立て側と違う").toBeCloseTo(
      libTop,
      1,
    );
    const libLeft = Math.min(...ns.map((n) => n.cx - n.w / 2));
    expect(a.posX + pad.left * (2000 / 400), "画面側の箱の左端が組み立て側と違う").toBeCloseTo(
      libLeft,
      1,
    );
  });

  it("大きさを書いても位置を書かなければ 2 経路で同じ場所になる", () => {
    // 格子が確保する場所にも伸縮を掛けないと、置き場所だけ元の大きさで決まる
    const auto = `title: "t"
type: sequence

actors:
  - 本体: {}
  - a:
      kind: wide
      大きさ: 2000,300
`;
    const lib = libraryCenters(auto);

    const parsed = extractPartsFromSrc(auto, KIND_SET, ITEMS);
    const base = textDslToDiagram(parsed.baseSrc);
    const placed = placeParts(parsed.parts, measureActorBoxes(base), partWorldSize, base.nodes.length);
    const a = placed.find((x) => x.id === "a")!;
    // 余白の伸縮は test 側で独立に出す。 実装の値を足し引きすると、
    // 余白の誤りが打ち消し合って見えなくなる。
    // 横は縦列の幅 400 に対して 2000 なので 5 倍、縦は段の送り幅 220 に対して 300 で 1.36 倍
    const pad = framePadding(a.item.diagram);
    expect(a.posX + pad.left * (2000 / 400), "横がずれている").toBeCloseTo(lib.get("a")!.cx, 1);
    expect(a.posY + pad.top * (300 / 220), "縦がずれている").toBeCloseTo(lib.get("a")!.cy, 1);
  });

  it("大きさの縦横は独立して効く", () => {
    // 片方だけ書いた形を「両方無効」 と読むと、組み立て側と食い違う
    const parsed = extractPartsFromSrc(
      `actors:\n  - a:\n      kind: wide\n      大きさ: 2000,0\n`,
      KIND_SET,
      ITEMS,
    );
    const a = parsed.parts.find((x) => x.id === "a")!;
    const base = extractPartsFromSrc(`actors:\n  - b: { kind: wide }\n`, KIND_SET, ITEMS).parts[0]!;
    expect(partBoxRect(a).w / partBoxRect(base).w, "横が効いていない").toBeCloseTo(5, 1);
    expect(partBoxRect(a).h / partBoxRect(base).h, "縦まで効いている").toBeCloseTo(1, 1);
  });

  it("中括弧で書いた寸法も読む", () => {
    // 組み立て側は `{ posW: 2000, posH: 300 }` を受ける。画面側が読まないと大きさが変わる
    const parsed = extractPartsFromSrc(
      `actors:\n  - a: { kind: wide, posW: 2000, posH: 300 }\n`,
      KIND_SET,
      ITEMS,
    );
    const a = parsed.parts.find((x) => x.id === "a")!;
    expect(a.posW, "中括弧の寸法が読めていない").toBe(2000);
    expect(a.posH, "中括弧の寸法が読めていない").toBe(300);
  });

  it("大きさを書くと描く大きさも同じだけ伸びる", () => {
    // 箱だけ伸ばして描く大きさを据え置くと、置き場所と絵が食い違う
    const parsed = extractPartsFromSrc(
      `actors:\n  - a:\n      kind: wide\n      大きさ: 2000,300\n  - b:\n      kind: wide\n`,
      KIND_SET,
      ITEMS,
    );
    const a = parsed.parts.find((x) => x.id === "a")!;
    const b = parsed.parts.find((x) => x.id === "b")!;
    const ratio = partBoxRect(a).w / partBoxRect(b).w;
    expect(partFrameSize(a).w / partFrameSize(b).w, "描く大きさに倍率が掛かっていない").toBeCloseTo(
      ratio,
      1,
    );
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

describe("倍率の意味 (#1026)", () => {
  /** 取り込んだ / 重ねた箱の外接矩形の大きさを、経路ごとに返す。 */
  const libSize = (src: string, alias: string): { w: number; h: number } => {
    const laid = layout(textDslToDiagram(src, { partsCatalog: CATALOG }));
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (const n of laid.nodes) {
      if (!String(n.id ?? "").startsWith(`${alias}__`)) continue;
      x0 = Math.min(x0, n.cx - n.w / 2);
      x1 = Math.max(x1, n.cx + n.w / 2);
      y0 = Math.min(y0, n.cy - n.h / 2);
      y1 = Math.max(y1, n.cy + n.h / 2);
    }
    return { w: x1 - x0, h: y1 - y0 };
  };

  const src = (actor: string): string =>
    `title: "t"\ntype: sequence\n\nactors:\n  - 本体: {}\n  - a: ${actor}\n`;

  it("3 つの書き方が組み立て側で同じ大きさになる", () => {
    // 書き方で意味が変わると、同じ本文を貼り替えただけで絵が変わる
    const forms: Array<[string, string]> = [
      ["中括弧の形", src("{ kind: wide, scale: 2 }")],
      ["空白区切りの形", src("wide scale=2")],
      ["縦に並べた形", `title: "t"\ntype: sequence\n\nactors:\n  - 本体: {}\n  - a:\n      kind: wide\n      scale: 2\n`],
    ];
    const got = forms.map(([name, text]) => [name, libSize(text, "a")] as const);
    const [, first] = got[0]!;
    for (const [name, size] of got) {
      expect(size.w, `${name} だけ幅が違う`).toBeCloseTo(first.w, 1);
      expect(size.h, `${name} だけ高さが違う`).toBeCloseTo(first.h, 1);
    }
  });

  it("倍率を書くと画面側でも組み立て側でも大きくなる", () => {
    // 直す前は、画面側だけが大きくなり組み立て側は状態の上書きとして捨てていた
    const plainLib = libSize(src("{ kind: wide }"), "a");
    const scaledLib = libSize(src("{ kind: wide, scale: 2 }"), "a");
    expect(scaledLib.w, "組み立て側で効いていない").toBeGreaterThan(plainLib.w * 1.5);

    const screenSize = (text: string): { w: number; h: number } => {
      const parsed = extractPartsFromSrc(text, KIND_SET, ITEMS);
      const part = parsed.parts.find((p) => p.id === "a")!;
      return partBoxRect(part);
    };
    const plainScr = screenSize(src("{ kind: wide }"));
    const scaledScr = screenSize(src("{ kind: wide, scale: 2 }"));
    expect(scaledScr.w / plainScr.w, "画面側で効いていない").toBeCloseTo(2, 6);
  });

  it("別名と重複の規則が 2 経路で揃う", () => {
    // 規則は 3 つ = 別名は scale が先 / 同じ名前は後勝ち / 読めない値でも別名に降りない。
    // 実測では 4 例すべてで engine と画面が違う値を返していた
    const cases: Array<[string, string, number]> = [
      ["縦・同じ名前を 2 度", `  - a:\n      kind: wide\n      倍率: 2\n      倍率: 3\n`, 3],
      ["短・同じ名前を 2 度", `  - a: wide scale=2 scale=3\n`, 3],
      ["短・読めない値と別名", `  - a: wide scale=x 倍率=3\n`, 1],
      ["縦・読めない値と別名", `  - a:\n      kind: wide\n      scale: x\n      倍率: 3\n`, 1],
      ["中括弧・別名を両方", `  - a: { kind: wide, scale: 2, 倍率: 3 }\n`, 2],
      ["中括弧・同じ名前を 2 度", `  - a: { kind: wide, scale: 2, scale: 3 }\n`, 3],
      ["縦・値が空と別名", `  - a:\n      kind: wide\n      scale:\n      倍率: 3\n`, 1],
      ["中括弧・値が空と別名", `  - a: { kind: wide, scale:, 倍率: 3 }\n`, 1],
      ["短・値が空と別名", `  - a: wide scale= 倍率=3\n`, 1],
    ];
    for (const [name, actors, want] of cases) {
      const src = `title: "t"\ntype: sequence\n\nactors:\n  - 本体: {}\n${actors}`;
      // 画面側
      const scr = extractPartsFromSrc(src, KIND_SET, ITEMS).parts.find((p) => p.id === "a");
      expect(scr?.scale, `${name} の画面側が違う`).toBe(want);
      // 組み立て側 (読めない値は倍率として書かなかった扱いになる)
      const lib = textDslToDiagram(src, { partsCatalog: CATALOG });
      expect(lib.nodes.some((n) => String(n.id ?? "").startsWith("a__")), `${name} が取り込まれていない`).toBe(true);
    }
  });

  it("上限を跨いでも 2 経路の率が揃う", () => {
    // 率ごとに上限を掛けると、大きさ由来 1000 倍と倍率 2 で画面だけ 2000 倍になる (実測)
    const part = PARTS.wide!;
    const base = 400 * MAX_PART_SCALE;
    const engine = partScaleFactor(part, base, base, 2);
    const screen = partBoxRect({
      id: "a",
      kind: "wide",
      scale: 2,
      rotate: 0,
      posW: base,
      posH: base,
      item: { id: "parts-wide", title: "wide", diagram: part } as CatalogItem,
    });
    const box = partBoxInFrame(part);
    expect(screen.w / box.w, "画面側の率が組み立て側と違う").toBeCloseTo(engine.x, 6);
    expect(engine.x, "合成後の上限を超えている").toBe(MAX_PART_SCALE);
  });

  it("倍率の増え方が 2 経路で揃う", () => {
    // 絶対値は経路で違う (画面は図枠を重ね、組み立ては本体の送り幅で並び直す)。
    // 揃うべきは **倍率を書いた時の伸び方** で、そこがずれると片方だけ大きく見える
    const ratio = (get: (text: string) => number): number =>
      get(src("{ kind: wide, scale: 3 }")) / get(src("{ kind: wide }"));
    const libRatio = ratio((t) => libSize(t, "a").w);
    const scrRatio = ratio((t) => {
      const parsed = extractPartsFromSrc(t, KIND_SET, ITEMS);
      return partBoxRect(parsed.parts.find((p) => p.id === "a")!).w;
    });
    expect(libRatio, `伸び方がずれている (組み立て ${libRatio} / 画面 ${scrRatio})`).toBeCloseTo(scrRatio, 1);
  });
});

describe("名前の行に値を書いた見本の続きの行 (#1028)", () => {
  /** 組み立て側が読んだ値。 */
  const lib = (src: string): { posX?: number; posY?: number; posW?: number; posH?: number; scale?: number } => {
    const r = parseTextDslV05(src);
    if (!r.ok) return {};
    const a = r.doc.actors.find((x) => x.name === "a");
    return { posX: a?.posX, posY: a?.posY, posW: a?.posW, posH: a?.posH, scale: a?.scale };
  };
  /** 画面側が読んだ値。 */
  const scr = (src: string): { posX?: number; posY?: number; posW?: number; posH?: number; scale?: number } => {
    const p = extractPartsFromSrc(src, KIND_SET, ITEMS).parts.find((x) => x.id === "a");
    return { posX: p?.posX, posY: p?.posY, posW: p?.posW, posH: p?.posH, scale: p?.scale };
  };
  const wrap = (actors: string): string => `title: "t"\ntype: flow\n\nactors:\n${actors}\nflow:\n  - a -> a: "x"\n`;

  it("短い形の続きの行を画面も読む", () => {
    // 直す前は画面側だけ全て undefined で、続きの行が本文に残っていた
    const src = wrap(`  - a: wide\n      位置: 300,200\n      大きさ: 800,400\n`);
    const l = lib(src);
    const s = scr(src);
    expect(l.posX, "組み立て側が読めていない").toBe(300);
    expect(s.posX, `画面側が読めていない (${JSON.stringify(s)})`).toBe(l.posX);
    expect(s.posY).toBe(l.posY);
    expect(s.posW).toBe(l.posW);
    expect(s.posH).toBe(l.posH);
  });

  it("中括弧の形の続きの行も読む", () => {
    const src = wrap(`  - a: { kind: wide }\n      位置: 300,200\n`);
    expect(scr(src).posX, "画面側が読めていない").toBe(lib(src).posX);
    expect(scr(src).posY).toBe(lib(src).posY);
  });

  it("続きの行が名前の行に勝つ", () => {
    // 順番どおりの読み方にする。 組み立て側も後に書いた行を採る
    const src = wrap(`  - a: wide @100,100\n      位置: 300,200\n`);
    expect(lib(src).posX, "組み立て側で後の行が勝っていない").toBe(300);
    expect(scr(src).posX, "画面側で後の行が勝っていない").toBe(300);
  });

  it("書いていない項目は名前の行の値を残す", () => {
    const src = wrap(`  - a: wide @100,100\n      倍率: 3\n`);
    expect(scr(src).posX, "名前の行の位置が消えている").toBe(100);
    expect(scr(src).scale, "倍率が読めていない").toBe(3);
  });

  it("次の 1 件の行を前の 1 件に取り込まない", () => {
    const src = wrap(`  - a: wide\n  - b: wide\n      倍率: 5\n`);
    const parts = extractPartsFromSrc(src, KIND_SET, ITEMS).parts;
    expect(parts.map((p) => p.id), "件数が合わない").toEqual(["a", "b"]);
    expect(parts.find((p) => p.id === "a")?.scale, "次の 1 件の倍率を取り込んでいる").toBe(1);
    expect(parts.find((p) => p.id === "b")?.scale).toBe(5);
  });

  it("見本でない箱の続きの行は本文に残す", () => {
    // 画面が重ねるのは見本だけ。 普通の箱の行を落とすと、図から要素が消える
    const src = wrap(`  - Web: service\n      位置: 300,200\n`);
    const r = extractPartsFromSrc(src, KIND_SET, ITEMS);
    expect(r.parts, "普通の箱を見本として抜いている").toHaveLength(0);
    expect(r.baseSrc, "続きの行が本文から消えている").toContain("位置: 300,200");
  });

  it("続きの行の位置が名前の行の位置を打ち消す", () => {
    // 重ねるだけだと座標と相対が同時に立つ。 組み立て側は相対だけを採るのでずれる
    const src = wrap(`  - Web: service\n  - a: wide @100,100\n      位置: Web の右 200\n`);
    const l = lib(src);
    const s = scr(src);
    expect(l.posX, "組み立て側で座標が残っている").toBeUndefined();
    expect(s.posX, `画面側で座標が残っている (${JSON.stringify(s)})`).toBeUndefined();
    expect(s.posY).toBeUndefined();
  });

  it("位置と大きさは後に書いた行を採る", () => {
    // 前を採ると書き直した値が効かない。 組み立て側は後に書いた行で上書きする
    const posSrc = wrap(`  - Web: service\n  - a:\n      kind: wide\n      位置: Web の右 200\n      位置: 300,400\n`);
    expect(lib(posSrc).posX, "組み立て側が後の行を採っていない").toBe(300);
    expect(scr(posSrc).posX, `画面側が後の行を採っていない (${JSON.stringify(scr(posSrc))})`).toBe(300);

    const sizeSrc = wrap(`  - a:\n      kind: wide\n      大きさ: 100,100\n      大きさ: 800,400\n`);
    expect(lib(sizeSrc).posW, "組み立て側が後の行を採っていない").toBe(800);
    expect(scr(sizeSrc).posW, "画面側が後の行を採っていない").toBe(800);
  });

  it("続きの行の kind が名前の行の種類を上書きする", () => {
    // 名前の行の種類を固定すると、続きで別の見本にしても画面だけ元の見本のままになる
    const src = wrap(`  - a: wide\n      kind: small\n`);
    const p = extractPartsFromSrc(src, KIND_SET, ITEMS).parts.find((x) => x.id === "a");
    expect(p?.kind, "続きの kind が効いていない").toBe("small");
  });

  it("続きで見本でない種類にしたら本文に戻す", () => {
    // 抜いたまま捨てると、書いた箱が図から消える
    for (const kind of ["service", "nosuchkind"]) {
      const src = wrap(`  - a: wide\n      kind: ${kind}\n`);
      const r = extractPartsFromSrc(src, KIND_SET, ITEMS);
      expect(r.parts, `${kind} を見本として抜いている`).toHaveLength(0);
      expect(r.baseSrc, `${kind} の行が本文から消えている`).toContain(`kind: ${kind}`);
      expect(r.baseSrc, "名前の行が本文から消えている").toContain("- a: wide");
    }
  });

  it("字下げの形が変わっても境界が壊れない", () => {
    // 4 空白 / タブ / `-` の後に空白を重ねる形。 続きと次の 1 件の境目が書き方で変わらない
    const cases: Array<[string, string, number | undefined]> = [
      ["4 空白の続き", `  - a: wide\n    倍率: 3\n`, 3],
      ["`-` の後に空白を重ねる", `  -   a: wide\n      倍率: 3\n`, 3],
      // タブ 1 文字は空白 2 つより浅いので続きにならない (組み立て側も同じ)
      ["タブ字下げ", `  - a: wide\n\t倍率: 3\n`, 1],
    ];
    for (const [name, actors, want] of cases) {
      const src = wrap(actors);
      const p = extractPartsFromSrc(src, KIND_SET, ITEMS).parts.find((x) => x.id === "a");
      expect(p?.scale, `${name} の倍率が違う`).toBe(want);
      const l = lib(src);
      expect(l.scale ?? 1, `${name} で組み立て側とずれている`).toBe(want);
    }
  });

  it("種類だけ知っていて見本が無い時は本文に残す", () => {
    // catalog の名前は知っているが実体を引けない形。 抜くと図から消える
    const kinds: Record<string, unknown> = { ...KIND_SET, ghost: {} };
    const src = wrap(`  - a: ghost\n      倍率: 3\n`);
    const r = extractPartsFromSrc(src, kinds, ITEMS);
    expect(r.parts, "実体が無いのに抜いている").toHaveLength(0);
    expect(r.baseSrc, "行が本文から消えている").toContain("- a: ghost");
    expect(r.baseSrc, "続きの行が本文から消えている").toContain("倍率: 3");
  });

  it("読めない値を書いた見本は本文に残して知らせを出させる", () => {
    // 抜くと組み立て側に届かず、行番号付きの知らせが消える
    const cases: Array<[string, string]> = [
      ["位置 (負の間隔)", `  - Web: service\n  - a: wide\n      位置: Web の右 -200\n`],
      ["位置 (読めない形)", `  - a: wide\n      位置: あちこち\n`],
      ["大きさ (1 つしか書かない)", `  - a: wide\n      大きさ: 800\n`],
    ];
    for (const [name, actors] of cases) {
      const src = wrap(actors);
      const r = extractPartsFromSrc(src, KIND_SET, ITEMS);
      expect(r.parts, `${name} を抜いている`).toHaveLength(0);
      expect(r.baseSrc, `${name} の行が本文から消えている`).toContain("- a: wide");
    }
    // 実際に知らせが出ることまで見る
    const bad = wrap(`  - Web: service\n  - a: wide\n      位置: Web の右 -200\n`);
    const parsed = parseTextDslV05(extractPartsFromSrc(bad, KIND_SET, ITEMS).baseSrc);
    expect(parsed.ok, "知らせが出ていない").toBe(false);
    if (parsed.ok) return;
    expect(parsed.errors.some((e) => e.message.includes("負の数")), "知らせの中身が違う").toBe(true);
  });

  it("読める値なら従来どおり抜く", () => {
    // 読めない形を本文に残す判定が、正しい本文まで巻き込まないことを見る
    const src = wrap(`  - Web: service\n  - a: wide\n      位置: Web の右 200\n      大きさ: 800,400\n`);
    const r = extractPartsFromSrc(src, KIND_SET, ITEMS);
    expect(r.parts, "読める本文を抜いていない").toHaveLength(1);
    expect(r.baseSrc, "見本の行が本文に残っている").not.toContain("- a: wide");
  });

  it("引用符の外し方が組み立て側と揃う", () => {
    // 先頭と末尾を別々に外すと、対応しない形が中身だけ取り出せてしまう。
    // 画面側だけ読めると、組み立て側が知らせる誤りが画面では通ってしまう
    const cases: Array<[string, string, boolean]> = [
      ["一重引用符の kind", `  - a: wide\n      kind: 'small'\n`, true],
      ["二重引用符の kind", `  - a: wide\n      kind: "small"\n`, true],
      ["日本語の項目名", `  - a: wide\n      種類: 'small'\n`, true],
      ["対応しない引用符の kind", `  - a: wide\n      kind: 'small"\n`, false],
      ["対応しない引用符の位置", `  - a: wide\n      位置: '300,200"\n`, false],
      ["対応しない引用符の大きさ", `  - a: wide\n      大きさ: '800,400"\n`, false],
    ];
    for (const [name, actors, extracted] of cases) {
      const src = wrap(actors);
      const r = extractPartsFromSrc(src, KIND_SET, ITEMS);
      expect(r.parts.length > 0, `${name} の抜き方が違う`).toBe(extracted);
      if (extracted) {
        expect(r.parts[0]?.kind, `${name} の種類が引けていない`).toBe("small");
        continue;
      }
      // 抜かなかった分は、組み立て側が知らせるか、見本として解決できないかのどちらか
      const parsed = parseTextDslV05(src);
      const unresolved =
        parsed.ok && parsed.doc.actors.find((x) => x.name === "a")?.partId !== "small";
      expect(!parsed.ok || unresolved, `${name} が組み立て側では通っている`).toBe(true);
    }
  });

  it("名前だけの block でも kind は後に書いた方を採る", () => {
    // 先を採ると書き直した種類が効かない。 組み立て側は後に書いた行で上書きする
    const src = wrap(`  - a:\n      kind: wide\n      kind: small\n`);
    const p = extractPartsFromSrc(src, KIND_SET, ITEMS).parts.find((x) => x.id === "a");
    expect(p?.kind, "画面側が先の種類を採っている").toBe("small");
    const r = parseTextDslV05(src);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.doc.actors.find((x) => x.name === "a")?.partId, "組み立て側とずれている").toBe("small");
  });

  it("読めない大きさは組み立て側も知らせる", () => {
    // 画面側が本文に戻しても、組み立て側が黙って無視すると誰も知らせない
    const src = wrap(`  - a: wide\n      大きさ: 800\n`);
    const r = parseTextDslV05(src);
    expect(r.ok, "知らせが出ていない").toBe(false);
    if (r.ok) return;
    expect(
      r.errors.some((e) => e.message.includes("大きさの書き方が読めません")),
      `知らせの中身が違う (${r.errors.map((e) => e.message).join(" / ")})`,
    ).toBe(true);
  });

  it("落とした行の数だけ行番号が飛ぶ", () => {
    // 続きの行も落とすようになったので、行番号の対応がずれていないことを見る
    const src = wrap(`  - a: wide\n      位置: 300,200\n  - Web: service\n`);
    const r = extractPartsFromSrc(src, KIND_SET, ITEMS);
    expect(r.baseSrc.split("\n").length, "行番号の対応が本文と合っていない").toBe(r.lineMap.length);
    const lines = src.split("\n");
    r.baseSrc.split("\n").forEach((l, i) => {
      expect(lines[r.lineMap[i]! - 1], `${i} 行目の対応がずれている`).toBe(l);
    });
  });
});
