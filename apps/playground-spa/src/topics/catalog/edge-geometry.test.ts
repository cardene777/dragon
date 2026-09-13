import { describe, expect, it, vi } from "vitest";
import { layout, visualValidateAll } from "@cardenelabs/cdl";
import type { CdlDiagram } from "@cardenelabs/cdl";
import * as カタログの定義 from "./presets.cdl";

type 点 = { x: number; y: number };
type 区間 = { 始点: 点; 終点: 点 };
type 配置済みの関係 = { id: string; d: string; tone?: string };
type 重なり = { 一本目: 配置済みの関係; 二本目: 配置済みの関係; 長さ: number };

const 許容px = 1;
// 角丸の端だけが触れる短い区間は画面上で線の重なりとして読めないため、数えない。
const 数える最小の重なりpx = 8;
const 対象の図id = new Set(["class-demo", "class-complex-demo", "er-demo", "er-complex-demo"]);

/** SVG path の命令から、線が実際に通る点だけを読む。 */
function dから点列を読む(d: string): 点[] {
  const token = d.match(/[MLQ]|-?(?:\d+\.?\d*|\.\d+)/g) ?? [];
  const 点列: 点[] = [];
  let i = 0;

  while (i < token.length) {
    const 命令 = token[i++];
    if (命令 === "M" || 命令 === "L") {
      点列.push({ x: Number(token[i++]), y: Number(token[i++]) });
    } else if (命令 === "Q") {
      // 制御点は角丸のふくらみを決めるだけで線の折れ点ではないので、終点だけを拾う。
      i += 2;
      点列.push({ x: Number(token[i++]), y: Number(token[i++]) });
    }
  }
  return 点列;
}

function dから区間を読む(d: string): 区間[] {
  const 点列 = dから点列を読む(d);
  const 区間列: 区間[] = [];
  for (let i = 1; i < 点列.length; i += 1) {
    const 始点 = 点列[i - 1]!;
    const 終点 = 点列[i]!;
    if (始点.x !== 終点.x || 始点.y !== 終点.y) 区間列.push({ 始点, 終点 });
  }
  return 区間列;
}

/** 軸に平行で同じ直線上にある二つの区間だけ、重なった長さを返す。 */
function 区間の重なりpx(一本目: 区間, 二本目: 区間): number {
  const 一本目が水平 = Math.abs(一本目.始点.y - 一本目.終点.y) <= 許容px;
  const 二本目が水平 = Math.abs(二本目.始点.y - 二本目.終点.y) <= 許容px;
  if (一本目が水平 && 二本目が水平) {
    if (Math.abs(一本目.始点.y - 二本目.始点.y) > 許容px) return 0;
    return Math.max(
      0,
      Math.min(Math.max(一本目.始点.x, 一本目.終点.x), Math.max(二本目.始点.x, 二本目.終点.x)) -
        Math.max(Math.min(一本目.始点.x, 一本目.終点.x), Math.min(二本目.始点.x, 二本目.終点.x)),
    );
  }

  const 一本目が垂直 = Math.abs(一本目.始点.x - 一本目.終点.x) <= 許容px;
  const 二本目が垂直 = Math.abs(二本目.始点.x - 二本目.終点.x) <= 許容px;
  if (一本目が垂直 && 二本目が垂直) {
    if (Math.abs(一本目.始点.x - 二本目.始点.x) > 許容px) return 0;
    return Math.max(
      0,
      Math.min(Math.max(一本目.始点.y, 一本目.終点.y), Math.max(二本目.始点.y, 二本目.終点.y)) -
        Math.max(Math.min(一本目.始点.y, 一本目.終点.y), Math.min(二本目.始点.y, 二本目.終点.y)),
    );
  }
  return 0;
}

/** 二本の path の区間を総当たりし、その組で最大の重なりだけを採る。 */
function dどうしの最大重なりpx(一本目のd: string, 二本目のd: string): number {
  let 最大px = 0;
  for (const 一本目の区間 of dから区間を読む(一本目のd)) {
    for (const 二本目の区間 of dから区間を読む(二本目のd)) {
      最大px = Math.max(最大px, 区間の重なりpx(一本目の区間, 二本目の区間));
    }
  }
  return 最大px;
}

function 重なりを測る(関係列: 配置済みの関係[]): 重なり[] {
  const 結果: 重なり[] = [];
  for (let i = 0; i < 関係列.length; i += 1) {
    for (let j = i + 1; j < 関係列.length; j += 1) {
      const 一本目 = 関係列[i]!;
      const 二本目 = 関係列[j]!;
      const 長さ = dどうしの最大重なりpx(一本目.d, 二本目.d);
      if (長さ >= 数える最小の重なりpx) 結果.push({ 一本目, 二本目, 長さ });
    }
  }
  return 結果;
}

function 重なりの説明(重なり列: 重なり[]): string {
  return 重なり列
    .map(({ 一本目, 二本目, 長さ }) => `${一本目.id} (${一本目.tone}) × ${二本目.id} (${二本目.tone}) が ${長さ}px`)
    .join("、");
}

function 短い直線区間を測る(d: string): number[] {
  const 点列 = dから点列を読む(d);
  const 長さ列: number[] = [];
  for (let i = 1; i < 点列.length; i += 1) {
    const 始点 = 点列[i - 1]!;
    const 終点 = 点列[i]!;
    const 長さ = Math.max(Math.abs(終点.x - 始点.x), Math.abs(終点.y - 始点.y));
    // Q の終点の直前は半径 14px の角丸なので、14px ちょうどの区間は数えない。
    if (長さ > 0 && 長さ < 30 && Math.abs(長さ - 14) > 0.5) 長さ列.push(長さ);
  }
  return 長さ列;
}

/** export 全体を走査して対象 id の図を集める。export の追加・削除で検査対象が黙って変わらないようにする。 */
function 対象の見本を配置する(): Array<{ id: string; 関係列: 配置済みの関係[] }> {
  const 図列 = Object.values(カタログの定義).filter(
    (候補): 候補 is CdlDiagram =>
      typeof 候補 === "object" && 候補 !== null && "id" in 候補 && 対象の図id.has((候補).id),
  );
  const 警告を黙らせる = vi.spyOn(console, "warn").mockImplementation(() => undefined);
  try {
    return 図列.map((図) => ({
      id: 図.id,
      関係列: (layout(図).edges),
    }));
  } finally {
    警告を黙らせる.mockRestore();
  }
}

/** 走査対象の図そのものを集める。 札の重なりは配置前の図を cdl に渡して測る。 */
function 対象の見本を集める(): CdlDiagram[] {
  return Object.values(カタログの定義).filter(
    (候補): 候補 is CdlDiagram =>
      typeof 候補 === "object" && 候補 !== null && "id" in 候補 && 対象の図id.has(候補.id),
  );
}

/**
 * 札が別の関係の線に乗っている件数を数える (#1608)。
 *
 * 上の 4 つの検査は線と線しか見ておらず、 札と線は 1 つも見ていなかった。
 * そのため取り込み前にここが緑でも、 `packages/dragon` の sweep だけが落ちる状態が作れた。
 * 実測 = クラス図 (複雑) で 2 件 (継承 の札と 実装 の札が互いの線に乗っていた)。
 *
 * 測り方を自前で組み直さず cdl の判定をそのまま呼ぶ。 sweep が門にしている軸と同じものを
 * 見るためで、 別の式で近似すると片方だけが通る状態に戻る。
 */
function 札と線の重なりを数える(図列: CdlDiagram[]): string[] {
  const 警告を黙らせる = vi.spyOn(console, "warn").mockImplementation(() => undefined);
  const 記録を黙らせる = vi.spyOn(console, "log").mockImplementation(() => undefined);
  try {
    const 結果 = visualValidateAll(図列, { profile: "catalog" });
    return 結果.reports.flatMap((報告) =>
      報告.violations
        .filter((違反) => 違反.severity === "error" && 違反.axis === "edge-label-overlap")
        .map((違反) => `${報告.diagramId}: ${違反.detail}`),
    );
  } finally {
    警告を黙らせる.mockRestore();
    記録を黙らせる.mockRestore();
  }
}

/** 箱を別の縦列・別の段へ移した図を作る。 植え込み対照で取り込み前の配置を作り直すのに使う。 */
function 箱を動かす(
  図: CdlDiagram,
  位置: Readonly<Record<string, { 列: number; 段: number }>>,
): CdlDiagram {
  const 未知 = Object.keys(位置).filter((id) => !図.nodes.some((箱) => 箱.id === id));
  if (未知.length > 0) throw new Error(`図 "${図.id}" に無い箱を動かそうとした: ${未知.join(", ")}`);
  return {
    ...図,
    nodes: 図.nodes.map((箱) => {
      const 先 = 位置[箱.id];
      return 先 ? { ...箱, lane: `col-${先.列}`, stack: 先.段 } : 箱;
    }),
  };
}

/**
 * #1608 で直す前の配置。 植え込み対照に使う。
 *
 * カード払いと財布払いが互いの親の真下に入れ替わって置かれ、 継承の線と実装の線が
 * 同じ区画で交差していた。 その区画の真ん中に両方の札が載る。
 */
const 直す前の配置 = {
  CardPayment: { 列: 2, 段: 1 },
  WalletPayment: { 列: 3, 段: 1 },
  Transaction: { 列: 1, 段: 3 },
  LedgerEntry: { 列: 1, 段: 4 },
  Receipt: { 列: 2, 段: 4 },
} as const;

describe("カタログの関係線の幾何 (#1600)", () => {
  it("4 見本すべてで色違いの線が重ならない", () => {
    const 色違いの重なり = 対象の見本を配置する().flatMap(({ id, 関係列 }) =>
      重なりを測る(関係列)
        .filter(({ 一本目, 二本目 }) => 一本目.tone !== 二本目.tone)
        .map((重なり) => ({ ...重なり, 図id: id })),
    );
    expect(
      色違いの重なり,
      `色違いの重なり: ${色違いの重なり.map(({ 図id, ...重なり }) => `${図id}: ${重なりの説明([重なり])}`).join("、")}`,
    ).toHaveLength(0);
  });

  it("class-complex-demo の同色の重なりは 2 件以下", () => {
    const 見本 = 対象の見本を配置する().find(({ id }) => id === "class-complex-demo")!;
    const 同色の重なり = 重なりを測る(見本.関係列).filter(({ 一本目, 二本目 }) => 一本目.tone === 二本目.tone);
    expect(同色の重なり.length, `同色の重なり: ${重なりの説明(同色の重なり)}`).toBeLessThanOrEqual(2);
  });

  it("class-complex-demo の折れは 32 個以下", () => {
    const 見本 = 対象の見本を配置する().find(({ id }) => id === "class-complex-demo")!;
    const 折れの数 = 見本.関係列.reduce((合計, 関係) => 合計 + Math.max(0, dから点列を読む(関係.d).length - 2), 0);
    expect(折れの数, `class-complex-demo の折れが ${折れの数} 個ある`).toBeLessThanOrEqual(32);
  });

  it("4 見本すべてで 30px 未満の直線区間が無い", () => {
    const 短い区間 = 対象の見本を配置する().flatMap(({ id: 図id, 関係列 }) =>
      関係列.flatMap(({ id: 線id, d }) => 短い直線区間を測る(d).map((長さ) => ({ 図id, 線id, 長さ }))),
    );
    expect(
      短い区間,
      `短い直線区間: ${短い区間.map(({ 図id, 線id, 長さ }) => `${図id} の ${線id} が ${長さ}px`).join("、")}`,
    ).toHaveLength(0);
  });

  it("4 件を走査し、指定された id の集合と一致する", () => {
    const 見本id = 対象の見本を配置する().map(({ id }) => id).sort();
    expect(見本id.length, "検査が空振りしている: 走査できた見本が 4 件ではない").toBe(4);
    expect(見本id, "検査が空振りしている: 走査した id の集合が指定と違う").toEqual([...対象の図id].sort());
  });

  it("手組みの d で重なりを測れる", () => {
    expect(dどうしの最大重なりpx("M 425 786 L 562 786", "M 562 786 L 425 786")).toBe(137);
    expect(dどうしの最大重なりpx("M 0 100 L 50 100", "M 80 100 L 130 100")).toBe(0);
    expect(dどうしの最大重なりpx("M 0 0 L 100 0", "M 50 -50 L 50 50")).toBe(0);
  });

  it("4 見本すべてで札が別の関係の線に乗らない", () => {
    const 図列 = 対象の見本を集める();
    expect(図列.length, "検査が空振りしている: 走査できた見本が 4 件ではない").toBe(4);
    const 重なり = 札と線の重なりを数える(図列);
    expect(重なり, `札が線に乗っている: ${重なり.join("、")}`).toHaveLength(0);
  });

  it("直す前の配置に当てると札の重なりを見つける", () => {
    // 「0 件」 を期待する検査なので、 見つけられることを別に確かめる (植え込み対照)。
    // 探し方は本番と同じ関数を使う。 2 度書くと片方だけ直って気付けなくなる。
    const 複雑 = 対象の見本を集める().find((図) => 図.id === "class-complex-demo")!;
    const 重なり = 札と線の重なりを数える([箱を動かす(複雑, 直す前の配置)]);
    expect(
      重なり.length,
      "検査が恒真になっている: 取り込み前の配置でも札の重なりを 1 件も見つけられない",
    ).toBeGreaterThan(0);
  });

  it("直す前の配置でも線と線の重なりは 0 件だった", () => {
    // 上の 4 検査が緑のまま札の重なりだけが残せたことを、 実物で示す。
    // ここが 0 でなくなったら、 札の検査を足した理由の説明が実物と食い違っている。
    const 複雑 = 対象の見本を集める().find((図) => 図.id === "class-complex-demo")!;
    const 警告を黙らせる = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const 関係列 = (() => {
      try {
        return layout(箱を動かす(複雑, 直す前の配置)).edges;
      } finally {
        警告を黙らせる.mockRestore();
      }
    })();
    const 色違い = 重なりを測る(関係列).filter(({ 一本目, 二本目 }) => 一本目.tone !== 二本目.tone);
    expect(色違い, `色違いの重なり: ${重なりの説明(色違い)}`).toHaveLength(0);
  });

  it("手組みの d で短い区間を測れる", () => {
    expect(短い直線区間を測る("M 425 1317 L 711 1317 L 711 1289 L 751 1289")).toEqual([28]);
    expect(短い直線区間を測る("M 0 0 L 100 0 Q 114 0, 114 14 L 114 114")).toHaveLength(0);
    expect(短い直線区間を測る("M 0 0 L 100 0 L 100 100")).toHaveLength(0);
  });
});
