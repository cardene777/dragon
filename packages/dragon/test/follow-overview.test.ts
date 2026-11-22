// @vitest-environment jsdom
/**
 * 寄って追う形の全体図に描く部品 (#3849)。
 *
 * 全体図は、寄って追う形の窓の下か右に出る、図の全体を縮めた小さな図。
 * 全体図の部品は、全体図の描く所 (`.dg-mm-world`) の上に描く四角 (`rect`)、円 (`circle`)、塗った形 (`path`)、線 (`polyline`) で、
 * 今見ている所の枠 (`.dg-mm-vp`) は数えない。
 * 量の行き先の図、集合の重なりの図、表どうしの関係の図、量の図、回り続ける図は並べ方が箱を持たないので、種類の部品の組が全体図に描く部品を挙げる。
 * 帯の曲線と円と結びの線は、縮めても元の図と同じ形に見えるよう、細い四角を並べずに曲線と円と線のまま描く
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { api } from "./diagram-support";
import { type Diagramish, place, type Placed, releasePlaced } from "./follow-support";
import "../src/kind-use/chart";
import "../src/kind-use/cycle";
import "../src/kind-use/er";
import "../src/kind-use/mind";
import "../src/kind-use/sankey";
import "../src/kind-use/venn";
import "../src/render/look-all";

afterEach(releasePlaced);

/** 見本の記法の file を読んだ原本 */
function notation(name: string): Diagramish {
  const file = join(process.cwd(), "packages/dragon/examples", `${name}.dragon`);
  const read = api("parseNotation")(readFileSync(file, "utf8"), { lang: "ja" });
  expect(read.ok, `${name} を読めない`).toBe(true);
  return (read as { diagram: Diagramish }).diagram;
}

interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** 全体図の描く所の四角と、その上の部品 */
interface Overview {
  world: Box;
  parts: Element[];
}

const num = (el: Element, attr: string): number => Number(el.getAttribute(attr));

/** 置いた図の全体図。描く所 (`.dg-mm-world`) と同じ切り抜きの中に在り、今見ている所の枠でない部品を挙げる */
function overviewOf(p: Placed): Overview {
  const world = p.figure.querySelector(".dg-mm-world");
  expect(world, `${p.name} / 枠の幅 ${p.width}px に全体図が無い`).not.toBeNull();
  const w = world as Element;
  const parts = [...(w.parentElement?.children ?? [])].filter((el) => el !== w && !el.classList.contains("dg-mm-vp"));
  return { world: { x: num(w, "x"), y: num(w, "y"), w: num(w, "width"), h: num(w, "height") }, parts };
}

/** 部品の描いた範囲の点。四角は四隅、円は中心から半径の上下左右、塗った形と線は全ての点 */
function extent(el: Element): [number, number][] {
  const tag = el.tagName.toLowerCase();
  if (tag === "rect") {
    const [x, y, w, h] = [num(el, "x"), num(el, "y"), num(el, "width"), num(el, "height")];
    return [
      [x, y],
      [x + w, y + h],
    ];
  }
  if (tag === "circle") {
    const [cx, cy, r] = [num(el, "cx"), num(el, "cy"), num(el, "r")];
    return [
      [cx - r, cy - r],
      [cx + r, cy + r],
    ];
  }
  const text = el.getAttribute(tag === "path" ? "d" : "points") ?? "";
  const values = [...text.matchAll(/-?\d+(?:\.\d+)?/gu)].map((m) => Number(m[0]));
  const points: [number, number][] = [];
  for (let i = 0; i + 1 < values.length; i += 2) points.push([values[i] as number, values[i + 1] as number]);
  return points;
}

/** 描く所の四角から外へ出る長さを許す幅。座標を小数 2 桁に丸める分と、線の太さの半分 */
const SLACK = 1;

/** 部品 `el` が描く所 `world` に収まるか */
function inside(el: Element, world: Box): boolean {
  const points = extent(el);
  return (
    points.length > 0 &&
    points.every(([x, y]) => x >= world.x - SLACK && x <= world.x + world.w + SLACK && y >= world.y - SLACK && y <= world.y + world.h + SLACK)
  );
}

/** 部品のうち、要素の名前が `tag` で `cls` の名前を持つ物 */
const pick = (o: Overview, tag: string, cls?: string): Element[] =>
  o.parts.filter((el) => el.tagName.toLowerCase() === tag && (cls === undefined || el.classList.contains(cls)));

/** 検査の名前の後ろ、見本、枠の幅。幅 390 で寄って追う形になると全体図が空だった見本と、幅 760 で空だった nft-sale */
const EMPTY_BEFORE: [string, string, number][] = [
  ...["day-hours", "fee-split", "phone-storage", "revenue", "salary", "token-allocation"].map((n): [string, string, number] => [n, n, 390]),
  ...["hobbies", "l2-chains", "skills", "wallet-dots", "wallet-usage"].map((n): [string, string, number] => [n, n, 390]),
  ...["library-loan", "nft-sale", "order-total", "token-transfer"].map((n): [string, string, number] => [n, n, 390]),
  ["nft-sale-w760", "nft-sale", 760],
  ...["bakery-sales", "device-dots", "shop-funnel", "wallet-onboarding"].map((n): [string, string, number] => [n, n, 390]),
  ...["farm-year", "focus-clock"].map((n): [string, string, number] => [n, n, 390]),
];

describe("寄って追う形の全体図に部品が描かれ、全体図の描く所に収まる (#3849)", () => {
  for (const [id, name, width] of EMPTY_BEFORE) {
    it(`overview-has-parts-${id}`, () => {
      const o = overviewOf(place(name, notation(name), width));
      expect(o.parts.length, `${name} / 枠の幅 ${width}px の全体図に部品が無い`).toBeGreaterThan(0);
      const out = o.parts.filter((el) => !inside(el, o.world)).map((el) => el.outerHTML.slice(0, 120));
      expect(out, `${name} / 枠の幅 ${width}px の全体図の描く所から出る部品`).toEqual([]);
    });
  }
});

describe("種類ごとに全体図に描く部品 (#3849)", () => {
  it("overview-sankey-bars-and-ribbons", () => {
    const p = place("salary", notation("salary"), 390);
    const o = overviewOf(p);
    const layout = p.layout as unknown as { nodes: unknown[]; bands: unknown[] };
    expect([layout.nodes.length, layout.bands.length], "salary の棒と帯の数").toEqual([7, 6]);
    expect(pick(o, "rect", "dg-mm-card").length, "棒の札の数").toBe(7);
    expect(pick(o, "path", "dg-mm-area").length, "塗った帯の形の数").toBe(6);
  });

  it("overview-venn-translucent-discs", () => {
    const p = place("hobbies", notation("hobbies"), 390);
    const o = overviewOf(p);
    expect(pick(o, "circle", "dg-mm-disc").length, "円の数").toBe(3);
    const css = [...p.figure.querySelectorAll("style")].map((s) => s.textContent ?? "").join("");
    const rule = /\.dg-mm-disc\{[^}]*fill-opacity:([\d.]+)/u.exec(css);
    expect(rule, "全体図の円の塗りの濃さの規則").not.toBeNull();
    expect(Number(rule?.[1]), "全体図の円の塗りの濃さ").toBeLessThan(1);
  });

  it("overview-venn-discs-not-stepped", () => {
    const o = overviewOf(place("hobbies", notation("hobbies"), 390));
    expect(pick(o, "circle", "dg-mm-disc").length, "円の数").toBe(3);
    expect(pick(o, "rect").length, "四角の部品の数 (名前の数を超えない)").toBeLessThanOrEqual(3);
  });

  it("overview-er-tables-heads-links", () => {
    const o = overviewOf(place("library-loan", notation("library-loan"), 390));
    expect(pick(o, "rect", "dg-mm-band").length, "表の地の数").toBe(3);
    expect(pick(o, "rect", "dg-mm-card").length, "頭の行の札の数").toBe(3);
    expect(pick(o, "polyline", "dg-mm-line").length, "結びの線の数").toBe(2);
  });

  it("overview-chart-lines-and-points", () => {
    const p = place("bakery-sales", notation("bakery-sales"), 390);
    const o = overviewOf(p);
    const series = (p.layout as unknown as { chart: { line: { series: { points: (object | undefined)[] }[] } } }).chart.line.series;
    const points = series.reduce((n, s) => n + s.points.filter(Boolean).length, 0);
    expect(series.length, "bakery-sales の系列の数").toBe(2);
    expect(pick(o, "polyline", "dg-mm-line").length, "折れ線の数").toBe(2);
    expect(pick(o, "circle", "dg-mm-dot").length, "値の在る点の数").toBe(points);
  });

  it("overview-cycle-segments-and-return", () => {
    const o = overviewOf(place("farm-year", notation("farm-year"), 390));
    expect(pick(o, "rect", "dg-mm-card").length, "山形の札の数").toBe(8);
    expect(pick(o, "polyline", "dg-mm-line").length, "戻る線の数").toBe(1);
  });

  it("overview-mind-unchanged", () => {
    const o = overviewOf(place("wallet-ux", notation("wallet-ux"), 390));
    const cards = pick(o, "rect", "dg-mm-card").map((el) => [num(el, "x"), num(el, "y"), num(el, "width"), num(el, "height")].map((v) => Math.round(v * 100) / 100));
    expect(cards, "wallet-ux の全体図の札の位置と大きさ").toEqual(MIND_CARDS);
  });
});

/** この課題の前の、幅 390 の wallet-ux の全体図の札の位置と大きさ (x、y、幅、高さ)。考え 13 個を 1 つずつ札で描く */
const MIND_CARDS: number[][] = [
  [274.29, 285.84, 35.38, 8.09],
  [249.69, 277.92, 14.49, 6.06],
  [219.29, 275.05, 23, 4.72],
  [218.04, 282.13, 24.24, 4.72],
  [319.78, 277.92, 9.77, 6.06],
  [336.96, 275.05, 20.89, 4.72],
  [336.96, 282.13, 20.89, 4.72],
  [319.78, 296.79, 9.77, 6.06],
  [336.96, 293.92, 23, 4.72],
  [336.96, 301, 25.1, 4.72],
  [254.41, 296.79, 9.77, 6.06],
  [221.39, 293.92, 20.89, 4.72],
  [223.5, 301, 18.78, 4.72],
];
