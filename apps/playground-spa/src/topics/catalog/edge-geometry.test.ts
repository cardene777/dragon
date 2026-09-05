import { describe, expect, it, vi } from "vitest";
import { layout } from "@cardenelabs/cdl";
import type { CdlDiagram } from "@cardenelabs/cdl";
import * as 見本帳の定義 from "./presets.cdl";

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

/** export 全体を走査して対象 id の図を集める。export の追加・削除で検査対象が黙って変わらないようにする。 */
function 対象の見本を配置する(): Array<{ id: string; 関係列: 配置済みの関係[] }> {
  const 図列 = Object.values(見本帳の定義).filter(
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

describe("見本帳の関係線の幾何 (#1600)", () => {
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
});
