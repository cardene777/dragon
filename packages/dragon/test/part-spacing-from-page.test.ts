/**
 * 部品を図に置くと、部品の中の要素が部品の頁と同じ間で並ぶことの検証 (#1992)。
 *
 * 組み込み (`mergePartIntoDiagram`) は部品の要素を座標で置く。 直す前は、横を部品が書いた縦列の
 * 中心、縦を段の番号に近似の送り幅 220 を掛けた位置で置いていた。 部品の頁では描画側が縦列を
 * 広げ、段の間を箱の高さに合わせて取るので、頁で空いた分が置いた図で消えていた。
 *
 * | 部品 | 部品の頁の要素の間 | 直す前に置いた図 (実測) |
 * |---|---|---|
 * | `wifi-signal` | 横 80 | 横 40 |
 * | `bind-equalizer-5` | 横 80 | 横 20 |
 * | `bind-grid-4` | 縦 100 | 縦 40 |
 * | `traffic-light-stack` | 縦 100 | 縦 60 |
 *
 * 部品は実物 (`parts.cdl.ts`) を一覧から集めて使う。 見るのは配置した後の座標。
 */
import { describe, it, expect } from "vitest";
import { layout, visualValidateAll } from "@cardenelabs/cdl";
import type { CdlDiagram } from "@cardenelabs/cdl";
import { partScaleFactor, partVisualSize, textDslToDiagram } from "../src/index";
import { 部品の一覧を作る } from "../../../apps/playground-spa/src/lib/parts-catalog";
import * as 部品 from "../../../apps/playground-spa/src/topics/catalog/parts.cdl";

const 一覧 = 部品の一覧を作る(Object.values(部品));
/** 部品の種類。 一覧は同じ部品を `parts-` で始まる名前でも引けるので、そちらを除く */
const 種類 = Object.keys(一覧)
  .filter((k) => !k.startsWith("parts-"))
  .sort();

/** 直す前に、置いた時だけ間隔の検査に掛かっていた部品 (実測) */
const 詰まっていた部品 = [
  "bind-equalizer-5",
  "bind-5-digit-counter",
  "wifi-signal",
  "circle-size-race",
  "edge-chain",
  "bind-comprehensive",
  "bind-2state-mirror",
  "gauge-cluster",
  "progress-dots",
  "comparison-bars",
  "bandwidth-meter",
  "bind-grid-4",
  "bind-split-fill",
  "traffic-light-stack",
];

type 配置 = ReturnType<typeof layout>;
type 箱 = 配置["nodes"][number];

/** `受付` の箱と部品を 1 つ並べた流れ図 */
function 置く(本文の部品: string, 部品の一覧: Record<string, CdlDiagram> = 一覧) {
  const 図 = textDslToDiagram(
    `title: "t"\ntype: flow\n\nactors:\n  - 受付: { kind: card }\n  - 部品:\n${本文の部品}`,
    { partsCatalog: 部品の一覧 },
  );
  return { 図, 配置: layout(図) };
}

const 種類で置く = (kind: string) => 置く(`      kind: ${kind}\n`);

/** 置いた図の部品の要素 (配置した後)。 id は部品の中の名前に戻す */
function 部品の要素(配置: 配置): Map<string, 箱> {
  return new Map(
    配置.nodes
      .filter((n) => n.id.startsWith("部品__"))
      .map((n) => [n.id.slice("部品__".length), n]),
  );
}

/** 間隔の検査の指摘のうち、2 つとも部品の要素を指すもの */
function 部品の中の間隔の指摘(図: CdlDiagram): string[] {
  return visualValidateAll([図], { profile: "catalog" })
    .reports.flatMap((r) => r.violations)
    .filter((v) => v.axis === "clearance" && v.severity === "error")
    .map((v) => v.detail)
    .filter((d) => {
      const ids = [...d.matchAll(/node:(\S+)/g)].map((m) => m[1]!);
      return ids.length === 2 && ids.every((id) => id.startsWith("部品__"));
    });
}

/** 横に並んだ箱の、隣どうしの端の間 */
function 横の間(箱たち: 箱[]): number[] {
  const 並び = [...箱たち].sort((a, b) => a.cx - b.cx);
  return 並び.slice(1).map((b, i) => b.cx - b.w / 2 - (並び[i]!.cx + 並び[i]!.w / 2));
}

/** 縦に並んだ箱の、隣どうしの端の間 */
function 縦の間(箱たち: 箱[]): number[] {
  const 並び = [...箱たち].sort((a, b) => a.cy - b.cy);
  return 並び.slice(1).map((b, i) => b.cy - b.h / 2 - (並び[i]!.cy + 並び[i]!.h / 2));
}

describe("部品の一覧の全ての部品", () => {
  it("部品の一覧から 86 種を集め、直す前に詰まっていた 14 種を含む", () => {
    expect(種類, "部品の種類が 86 ではない (集め方が崩れた)").toHaveLength(86);
    expect(詰まっていた部品.filter((k) => !種類.includes(k))).toEqual([]);
  });

  it.each(種類)("%s を置いても、部品の要素どうしの間隔の指摘が出ない", (kind) => {
    const { 図 } = 種類で置く(kind);
    expect(
      図.nodes.filter((n) => n.id.startsWith("部品__")),
      `${kind} の要素が図に無い (検査が空振りしている)`,
    ).toHaveLength(一覧[kind]!.nodes.length);
    expect(部品の中の間隔の指摘(図)).toEqual([]);
  });

  it.each(種類)("%s を置くと、要素と縦列の並びが部品の頁と同じになる", (kind) => {
    const 頁 = layout(一覧[kind]!);
    const 配置 = 種類で置く(kind).配置;
    const 置いた = 部品の要素(配置);
    const [基準, ...残り] = 頁.nodes;
    expect(基準, `${kind} の頁に要素が無い (検査が空振りしている)`).toBeDefined();
    const 置いた基準 = 置いた.get(基準!.id)!;
    for (const n of 残り) {
      const p = 置いた.get(n.id);
      expect(p, `${kind} の ${n.id} が置いた図に無い`).toBeDefined();
      expect(p!.cx - 置いた基準.cx, `${kind} の ${n.id} の横`).toBeCloseTo(n.cx - 基準!.cx, 6);
      expect(p!.cy - 置いた基準.cy, `${kind} の ${n.id} の縦`).toBeCloseTo(n.cy - 基準!.cy, 6);
    }
    // 部品用の縦列も頁と同じ位置と幅で置く = 要素が自分の縦列の中の同じ所に来る
    for (const l of 頁.lanes) {
      const 置いた縦列 = 配置.lanes.find((x) => x.id === `部品__${l.id}`);
      expect(置いた縦列, `${kind} の縦列 ${l.id} が置いた図に無い`).toBeDefined();
      expect(置いた縦列!.x - 置いた基準.cx, `${kind} の縦列 ${l.id} の左端`).toBeCloseTo(
        l.x - 基準!.cx,
        6,
      );
      expect(置いた縦列!.width, `${kind} の縦列 ${l.id} の幅`).toBeCloseTo(l.width, 6);
    }
  });

  it.each(種類)("%s の大きさの見積りが、置いた図の要素の外接矩形と同じになる", (kind) => {
    // 格子は見積りで場所を確保する。 見積りと組み込みが別の置き方を読むと、隣の部品と重なる
    const 要素 = [...部品の要素(種類で置く(kind).配置).values()];
    expect(要素.length, `${kind} の要素が図に無い (検査が空振りしている)`).toBeGreaterThan(0);
    const w =
      Math.max(...要素.map((n) => n.cx + n.w / 2)) - Math.min(...要素.map((n) => n.cx - n.w / 2));
    const h =
      Math.max(...要素.map((n) => n.cy + n.h / 2)) - Math.min(...要素.map((n) => n.cy - n.h / 2));
    const 見積り = partVisualSize(一覧[kind]!);
    expect(見積り.w).toBeCloseTo(w, 3);
    expect(見積り.h).toBeCloseTo(h, 3);
  });

  it("要素を詰めて置いた図では、同じ探し方が部品の中の間隔の指摘を見つける (植え込み対照)", () => {
    const { 図 } = 種類で置く("wifi-signal");
    const 詰めた = structuredClone(図);
    const b1 = 詰めた.nodes.find((n) => n.id === "部品__b1")!;
    const b2 = 詰めた.nodes.find((n) => n.id === "部品__b2")!;
    // b1 と b2 の端の間を 40 にする (下限は 70)
    b2.posX = b1.posX! + (b1.w! + b2.w!) / 2 + 40;
    expect(部品の中の間隔の指摘(詰めた).length).toBeGreaterThan(0);
  });
});

describe("完了条件の間", () => {
  it("wifi-signal を置いた図の横の要素の間は 80 で、部品の頁と同じ", () => {
    const 頁 = 横の間(layout(一覧["wifi-signal"]!).nodes);
    const 置いた = 横の間([...部品の要素(種類で置く("wifi-signal").配置).values()]);
    expect(置いた, "要素が 5 つ横に並んでいない (前提が崩れた)").toHaveLength(4);
    for (const 間 of 置いた) expect(間).toBeCloseTo(80, 6);
    expect(置いた.map((v) => Math.round(v))).toEqual(頁.map((v) => Math.round(v)));
  });

  it("bind-grid-4 を置いた図の縦の要素の間は 100 で、部品の頁と同じ", () => {
    const 列ごと = (箱たち: 箱[]) => {
      const 列 = new Map<number, 箱[]>();
      for (const b of 箱たち) 列.set(Math.round(b.cx), [...(列.get(Math.round(b.cx)) ?? []), b]);
      return [...列.values()];
    };
    const 頁の列 = 列ごと(layout(一覧["bind-grid-4"]!).nodes);
    const 置いた列 = 列ごと([...部品の要素(種類で置く("bind-grid-4").配置).values()]);
    expect(置いた列, "要素が 2 列に並んでいない (前提が崩れた)").toHaveLength(2);
    for (const 列 of 置いた列) {
      expect(列, "列に要素が 2 つ無い (前提が崩れた)").toHaveLength(2);
      expect(縦の間(列)[0]).toBeCloseTo(100, 6);
    }
    expect(頁の列.map((列) => Math.round(縦の間(列)[0]!))).toEqual([100, 100]);
  });
});

describe("大きさを書いた部品", () => {
  it("縦列を 5 本持つ部品に大きさを書くと、縦列を並べた幅が書いた幅になり、画面側と同じ倍率で伸びる", () => {
    const 部品の図 = 一覧["wifi-signal"]!;
    const { 図, 配置 } = 置く("      kind: wifi-signal\n      大きさ: 1600,220\n");
    const 縦列 = 図.lanes.filter((l) => l.id.startsWith("部品__"));
    expect(縦列, "部品の縦列が 5 本ではない (前提が崩れた)").toHaveLength(5);
    const 幅 =
      Math.max(...縦列.map((l) => (l.x ?? 0) + l.width)) - Math.min(...縦列.map((l) => l.x ?? 0));
    expect(幅).toBeCloseTo(1600, 6);
    // 要素の幅に掛かる倍率が、画面側が重ねて描く時の倍率 (`partScaleFactor`) と同じ
    const 倍率 = partScaleFactor(部品の図, 1600, 220, undefined).x;
    const b1 = 図.nodes.find((n) => n.id === "部品__b1")!;
    expect(b1.w! / 部品の図.nodes.find((n) => n.id === "b1")!.w!).toBeCloseTo(倍率, 6);
    // 頁の縦列の外接矩形を基準にする = 書いた縦列 (680) を基準にすると倍率は 1600 / 680
    expect(倍率).toBeLessThan(1600 / 680);
    // 要素の間も同じ倍率で伸びる
    const 置いた = 横の間([...部品の要素(配置).values()]);
    for (const 間 of 置いた) expect(間).toBeCloseTo(80 * 倍率, 6);
  });
});

/**
 * 描画側は書いた値が数でない時に止めずに数でない座標を返す。 その部品は、頁ではなく書いた値で置く。
 *
 * 部品は縦列 2 本 (`a` = 左端 0 幅 120、`b` = 左端 140 幅 120) に、幅 100 の要素 `na` (段 0) と
 * `nb` (段 1) を置く。 頁は縦列を広げて要素の中心の間を 180 にするので、書いた値 (中心の間 140) と
 * 見分けられる。 書いた値では、縦列の幅は数でなければ既定の 400、段は数でなければ 0 になる。
 */
describe("部品の頁の位置が数にならない部品は、全体を書いた値で置く", () => {
  const 部品を作る = (
    縦列aの上書き: Record<string, unknown>,
    要素の上書き: Record<string, unknown>,
    足す要素: readonly Record<string, unknown>[],
    足す縦列: readonly Record<string, unknown>[],
  ) =>
    ({
      id: "parts-odd",
      topic: "odd",
      lanes: [
        { id: "a", x: 0, width: 120, ...縦列aの上書き },
        { id: "b", x: 140, width: 120 },
        ...足す縦列,
      ],
      nodes: [
        { id: "na", lane: "a", stack: 0, ...要素の上書き },
        { id: "nb", lane: "b", stack: 1 },
        ...足す要素,
      ].map((n) => ({ kind: "card", title: "t", w: 100, h: 50, ...n })),
      edges: [],
      states: [],
      phases: [],
    }) as unknown as CdlDiagram;

  it.each([
    // [形, 縦列 a の上書き, na の上書き, 足す要素, 足す縦列, 書いた値での nb と na の中心の横の差]
    ["縦列の左端が数でない", { x: Number.NaN }, {}, [], [], 140],
    ["縦列の幅を書かない", { width: undefined }, {}, [], [], 0],
    ["縦列の幅が無限", { width: Number.POSITIVE_INFINITY }, {}, [], [], 0],
    ["縦列の幅が負 (中の要素の幅も負)", { width: -1e308 }, { w: -1e308 }, [], [], 0],
    ["要素の段が数でない", {}, { stack: Number.NaN }, [], [], 140],
    [
      "位置を書いた要素の横位置が無限",
      {},
      {},
      [{ id: "nc", lane: "a", stack: 2, posX: Number.POSITIVE_INFINITY, posY: 0 }],
      [],
      140,
    ],
  ] as const)("%s", (_, 縦列aの上書き, 要素の上書き, 足す要素, 足す縦列, 横の差) => {
    const d = 部品を作る(縦列aの上書き, 要素の上書き, 足す要素, 足す縦列);
    const 頁 = layout(d);
    const 数にならない =
      頁.lanes.some((l) => !Number.isFinite(l.x) || !Number.isFinite(l.width) || !(l.width > 0)) ||
      頁.nodes.some((n) => !Number.isFinite(n.cx) || !Number.isFinite(n.cy));
    expect(数にならない, "頁の位置が全て数になった (前提が崩れた)").toBe(true);
    const 図 = textDslToDiagram(
      `title: "t"\ntype: flow\n\nactors:\n  - 受付: { kind: card }\n  - 部品: { kind: odd }\n`,
      { partsCatalog: { odd: d, "parts-odd": d } },
    );
    const na = 図.nodes.find((n) => n.id === "部品__na")!;
    const nb = 図.nodes.find((n) => n.id === "部品__nb")!;
    expect(
      [na.posX, na.posY, nb.posX, nb.posY].every(Number.isFinite),
      "数でない座標を置いた",
    ).toBe(true);
    expect(nb.posX! - na.posX!).toBe(横の差);
    // 縦は段の番号に送り幅 220 を掛けた位置。 na は段 0 (数でない段も 0)、nb は段 1
    expect(nb.posY! - na.posY!).toBe(220);
    const 縦列 = 図.lanes.filter((l) => l.id.startsWith("部品__"));
    expect(縦列.length, "部品の縦列が図に無い (検査が空振りしている)").toBe(d.lanes.length);
    expect(
      縦列.filter((l) => !Number.isFinite(l.x) || !Number.isFinite(l.width)).map((l) => l.id),
      "数でない縦列を置いた",
    ).toEqual([]);
  });

  /**
   * 要素を持たない部品は、縦列だけが数にならない形を作れる。 縦列の左端と幅を別々に確かめる形で、
   * 縦列を 2 本以上持つ部品や要素を持つ部品では、1 つ壊すと隣の縦列か要素の位置まで数にならない
   * (実測 = 左端が数でない縦列は幅も `NaN`、幅が無限の縦列は隣の縦列の左端が `Infinity`)
   */
  it.each([
    // [形, 縦列, 書いた値での縦列の幅]
    ["縦列の左端が数でない", { id: "a", x: Number.NaN, width: 120 }, 120],
    ["縦列の左端が無限", { id: "a", x: Number.POSITIVE_INFINITY, width: 120 }, 120],
    ["縦列の幅が無限", { id: "a", x: 0, width: Number.POSITIVE_INFINITY }, 400],
  ] as const)("要素を持たない部品で%s時は、書いた値の縦列を置く", (_, 縦列, 幅) => {
    const d = {
      id: "parts-empty",
      topic: "empty",
      lanes: [縦列],
      nodes: [],
      edges: [],
      states: [],
      phases: [],
    } as unknown as CdlDiagram;
    const 頁の縦列 = layout(d).lanes[0]!;
    expect(
      [頁の縦列.x, 頁の縦列.width].filter((v) => !Number.isFinite(v)),
      "頁の縦列の左端か幅のどちらか 1 つだけが数にならない形ではない (前提が崩れた)",
    ).toHaveLength(1);
    const 図 = textDslToDiagram(
      `title: "t"\ntype: flow\n\nactors:\n  - 受付: { kind: card }\n  - 部品: { kind: empty }\n`,
      { partsCatalog: { empty: d, "parts-empty": d } },
    );
    const 置いた = 図.lanes.find((l) => l.id === "部品__a");
    expect(置いた, "部品の縦列が図に無い (検査が空振りしている)").toBeDefined();
    expect(Number.isFinite(置いた!.x), "数でない左端の縦列を置いた").toBe(true);
    expect(置いた!.width).toBe(幅);
  });
});
