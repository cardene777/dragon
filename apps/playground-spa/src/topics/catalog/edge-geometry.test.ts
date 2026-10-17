import { describe, expect, it, vi } from "vitest";
import { layout, visualValidateAll } from "@cardenelabs/cdl";
import type { CdlDiagram } from "@cardenelabs/cdl";
import { textDslToDiagram } from "@cardenelabs/dragon";
import * as カタログの定義 from "./presets.cdl";
import {
  sourceYaml__pattern__textDslFlowchart__縦に積む,
  sourceYaml__pattern__textDslFlowchart__複雑,
  sourceYaml__textDslFlowchart,
} from "./text-dsl.cdl";

type 点 = { x: number; y: number };
type 区間 = { 始点: 点; 終点: 点 };
type 配置済みの関係 = { id: string; d: string; tone?: string };
type 重なり = { 一本目: 配置済みの関係; 二本目: 配置済みの関係; 長さ: number };

const 許容px = 1;
// 角丸の端だけが触れる短い区間は画面上で線の重なりとして読めないため、数えない。
const 数える最小の重なりpx = 8;
const 対象の図id = new Set([
  "delivery-classes-demo",
  "class-complex-demo",
  "delivery-relations-demo",
  "er-complex-demo",
]);

/** 固定端点を記法から渡した線のうち、見本の意図で残す短い折れ。 */
const 認める短い区間: Record<string, string> = {
  "delivery-relations-demo:e4-受付済-仕分け:4":
    "浮彫の実測 path を全配色の骨組みにしたため残る、受付済から左へ出る最初の折れ (#2908)",
};

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

  it("4 見本の 30px 未満の直線区間が理由つきの宣言と一致する", () => {
    const 短い区間 = 対象の見本を配置する().flatMap(({ id: 図id, 関係列 }) =>
      関係列.flatMap(({ id: 線id, d }) => 短い直線区間を測る(d).map((長さ) => ({ 図id, 線id, 長さ }))),
    );
    const 実測 = 短い区間.map(({ 図id, 線id, 長さ }) => `${図id}:${線id}:${長さ}`).sort();
    expect(実測, `短い直線区間: ${実測.join("、")}`).toEqual(Object.keys(認める短い区間).sort());
    expect(Object.values(認める短い区間).filter((理由) => 理由.trim().length === 0)).toEqual([]);
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

type 配置済みの図 = ReturnType<typeof layout>;
type 配置済みの箱 = 配置済みの図["nodes"][number];

const 流れ図の記法 = {
  荷物を届ける流れ: カタログの定義.sourceYaml__presetDeliveryFlow,
  経費申請の承認の簡単: sourceYaml__textDslFlowchart,
  経費申請の承認の縦に積む: sourceYaml__pattern__textDslFlowchart__縦に積む,
  経費申請の承認の複雑: sourceYaml__pattern__textDslFlowchart__複雑,
} as const;

type 流れ図の名前 = keyof typeof 流れ図の記法;
type 流れ図の検査結果 = {
  名前: 流れ図の名前;
  図: 配置済みの図;
  突き抜け: string[];
  隠れた矢じり: string[];
  輪郭から外れる端: string[];
};

const 内側の深さpx = 3;

/** 角丸の Q は直線区間ではないため飛ばし、M/L で引かれた区間だけを読む。 */
function dから直線区間を読む(d: string): 区間[] {
  const token = d.match(/[MLQ]|-?(?:\d+\.?\d*|\.\d+)/g) ?? [];
  const 区間列: 区間[] = [];
  let 現在: 点 | undefined;
  let i = 0;

  while (i < token.length) {
    const 命令 = token[i++];
    if (命令 === "M") {
      現在 = { x: Number(token[i++]), y: Number(token[i++]) };
    } else if (命令 === "L") {
      const 次 = { x: Number(token[i++]), y: Number(token[i++]) };
      if (現在 !== undefined && (現在.x !== 次.x || 現在.y !== 次.y)) {
        区間列.push({ 始点: 現在, 終点: 次 });
      }
      現在 = 次;
    } else if (命令 === "Q") {
      i += 2;
      現在 = { x: Number(token[i++]), y: Number(token[i++]) };
    }
  }
  return 区間列;
}

function 範囲との重なりpx(a: number, b: number, min: number, max: number): number {
  return Math.max(0, Math.min(Math.max(a, b), max) - Math.max(Math.min(a, b), min));
}

/** 区間が箱の輪郭から `深さ` より内側を通る長さ。菱形は辺からの垂直距離で縮める。 */
function 箱の内側を通る長さpx(区間: 区間, 箱: 配置済みの箱, 深さ: number): number {
  const 水平 = Math.abs(区間.始点.y - 区間.終点.y) <= 許容px;
  const 垂直 = Math.abs(区間.始点.x - 区間.終点.x) <= 許容px;
  if (!水平 && !垂直) throw new Error(`斜めの直線区間を測れない: ${JSON.stringify(区間)}`);

  const 半幅 = 箱.w / 2;
  const 半高 = 箱.h / 2;
  if (箱.kind === "decision") {
    const 縮み = 1 - 深さ * Math.hypot(1 / 半幅, 1 / 半高);
    if (縮み <= 0) return 0;
    if (水平) {
      const 幅 = 半幅 * (縮み - Math.abs(区間.始点.y - 箱.cy) / 半高);
      return 幅 <= 0 ? 0 : 範囲との重なりpx(区間.始点.x, 区間.終点.x, 箱.cx - 幅, 箱.cx + 幅);
    }
    const 高さ = 半高 * (縮み - Math.abs(区間.始点.x - 箱.cx) / 半幅);
    return 高さ <= 0 ? 0 : 範囲との重なりpx(区間.始点.y, 区間.終点.y, 箱.cy - 高さ, 箱.cy + 高さ);
  }

  if (水平 && 区間.始点.y > 箱.cy - 半高 + 深さ && 区間.始点.y < 箱.cy + 半高 - 深さ) {
    return 範囲との重なりpx(
      区間.始点.x,
      区間.終点.x,
      箱.cx - 半幅 + 深さ,
      箱.cx + 半幅 - 深さ,
    );
  }
  if (垂直 && 区間.始点.x > 箱.cx - 半幅 + 深さ && 区間.始点.x < 箱.cx + 半幅 - 深さ) {
    return 範囲との重なりpx(
      区間.始点.y,
      区間.終点.y,
      箱.cy - 半高 + 深さ,
      箱.cy + 半高 - 深さ,
    );
  }
  return 0;
}

function 点と線分の距離px(点: 点, a: 点, b: 点): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const 長さ2 = dx * dx + dy * dy;
  const t = 長さ2 === 0 ? 0 : Math.max(0, Math.min(1, ((点.x - a.x) * dx + (点.y - a.y) * dy) / 長さ2));
  return Math.hypot(点.x - (a.x + t * dx), 点.y - (a.y + t * dy));
}

function 箱の輪郭からの距離px(点: 点, 箱: 配置済みの箱): number {
  const 半幅 = 箱.w / 2;
  const 半高 = 箱.h / 2;
  const 輪郭の点 = 箱.kind === "decision"
    ? [
        { x: 箱.cx, y: 箱.cy - 半高 },
        { x: 箱.cx + 半幅, y: 箱.cy },
        { x: 箱.cx, y: 箱.cy + 半高 },
        { x: 箱.cx - 半幅, y: 箱.cy },
      ]
    : [
        { x: 箱.cx - 半幅, y: 箱.cy - 半高 },
        { x: 箱.cx + 半幅, y: 箱.cy - 半高 },
        { x: 箱.cx + 半幅, y: 箱.cy + 半高 },
        { x: 箱.cx - 半幅, y: 箱.cy + 半高 },
      ];
  return Math.min(
    ...輪郭の点.map((a, i) => 点と線分の距離px(点, a, 輪郭の点[(i + 1) % 輪郭の点.length]!)),
  );
}

function 流れ図を配置する(
  名前: 流れ図の名前,
  記法: string = 流れ図の記法[名前],
): 配置済みの図 {
  const 警告を黙らせる = vi.spyOn(console, "warn").mockImplementation(() => undefined);
  try {
    return layout(textDslToDiagram(記法));
  } finally {
    警告を黙らせる.mockRestore();
  }
}

function 流れ図の骨組みを数える(
  名前: 流れ図の名前,
  記法: string = 流れ図の記法[名前],
): 流れ図の検査結果 {
  const 図 = 流れ図を配置する(名前, 記法);
  const 箱 = new Map(図.nodes.map((node) => [node.id, node]));
  const 突き抜け: string[] = [];
  const 隠れた矢じり: string[] = [];
  const 輪郭から外れる端: string[] = [];

  for (const 線 of 図.edges) {
    const 区間列 = dから直線区間を読む(線.d);
    const 点列 = dから点列を読む(線.d);
    if (区間列.length === 0 || 点列.length < 2) throw new Error(`${名前}:${線.id} の道筋を読めない`);
    for (const [区間番号, 区間] of 区間列.entries()) {
      for (const node of 図.nodes) {
        if (箱の内側を通る長さpx(区間, node, 内側の深さpx) > 0) {
          突き抜け.push(`${名前}:${線.id}:区間${区間番号}:${node.id}`);
        }
      }
    }

    const 入る箱 = 箱.get(線.to);
    const 最後の区間 = 区間列.at(-1);
    if (入る箱 === undefined || 最後の区間 === undefined) throw new Error(`${名前}:${線.id} の行き先を読めない`);
    if (箱の内側を通る長さpx(最後の区間, 入る箱, 内側の深さpx) > 0) {
      隠れた矢じり.push(`${名前}:${線.id}`);
    }

    for (const [端, node, point] of [
      ["始点", 箱.get(線.from), 点列[0]],
      ["終点", 入る箱, 点列.at(-1)],
    ] as const) {
      if (node === undefined || point === undefined) throw new Error(`${名前}:${線.id} の${端}を読めない`);
      if (箱の輪郭からの距離px(point, node) > 内側の深さpx) {
        輪郭から外れる端.push(`${名前}:${線.id}:${端}`);
      }
    }
  }
  return { 名前, 図, 突き抜け, 隠れた矢じり, 輪郭から外れる端 };
}

describe("見本帳の流れ図の骨組み (#2889)", () => {
  const 結果 = (Object.keys(流れ図の記法) as 流れ図の名前[]).map((名前) => 流れ図の骨組みを数える(名前));

  it("4 枚すべてで線が箱の内側を 3px より深く通らない", () => {
    expect(結果).toHaveLength(4);
    const 突き抜け = 結果.flatMap((値) => 値.突き抜け);
    expect(突き抜け, `箱を突き抜ける区間: ${突き抜け.join("、")}`).toEqual([]);
  });

  it("4 枚すべてで終点の手前の区間が入る箱の内側に無い", () => {
    const 隠れた矢じり = 結果.flatMap((値) => 値.隠れた矢じり);
    expect(隠れた矢じり, `箱の面に隠れる矢じり: ${隠れた矢じり.join("、")}`).toEqual([]);
  });

  it("4 枚すべてで線の両端が箱の輪郭から 3px 以内にある", () => {
    const 実測 = 結果.flatMap((値) => 値.輪郭から外れる端).sort();
    expect(実測, `輪郭から外れる端: ${実測.join("、")}`).toEqual([]);
  });

  it("荷物の戻る線を両方の箱の右の縁の中ほどで結び、札を縦区間へ重ねる", () => {
    const 配送 = 結果.find((値) => 値.名前 === "荷物を届ける流れ")!.図;
    const 戻る線 = 配送.edges.find((線) => 線.from === "持ち戻る" && 線.to === "便に積む")!;
    const 持ち戻る = 配送.nodes.find((箱) => 箱.id === "持ち戻る")!;
    const 便に積む = 配送.nodes.find((箱) => 箱.id === "便に積む")!;
    const 点列 = dから点列を読む(戻る線.d);
    const 始点 = 点列[0]!;
    const 終点 = 点列.at(-1)!;
    expect(始点.x).toBeCloseTo(持ち戻る.cx + 持ち戻る.w / 2, 6);
    expect(Math.abs(始点.y - 持ち戻る.cy)).toBeLessThanOrEqual(1);
    expect(終点.x).toBeCloseTo(便に積む.cx + 便に積む.w / 2, 6);
    expect(Math.abs(終点.y - 便に積む.cy)).toBeLessThanOrEqual(1);

    const 札を通る縦区間 = dから直線区間を読む(戻る線.d).find(
      ({ 始点: a, 終点: b }) =>
        Math.abs(a.x - b.x) <= 許容px &&
        戻る線.labelY >= Math.min(a.y, b.y) &&
        戻る線.labelY <= Math.max(a.y, b.y),
    );
    expect(札を通る縦区間, "戻る線の札の高さを通る縦区間が無い").toBeDefined();
    expect(Math.abs(戻る線.labelX - 札を通る縦区間!.始点.x)).toBeLessThanOrEqual(1);
  });

  it("間に箱の無い隣の段へ戻る線の通り道を変えない", () => {
    const 複雑 = 結果.find((値) => 値.名前 === "経費申請の承認の複雑")!.図;
    const 出し直す = 複雑.edges.find(
      (線) => 線.from === "直して出し直す" && 線.to === "領収書を添えて申請する",
    );
    expect(出し直す?.d).toBe("M 215 439.5 L 215 279.5");
  });

  it("side を書いた戻る線には自動の戻り道と右の辺を渡さない", () => {
    const 記法 = カタログの定義.sourceYaml__presetDeliveryFlow.replace(
      "{ overlay: true }",
      "{ side: bottom, overlay: true }",
    );
    const 図 = textDslToDiagram(記法);
    const 戻る線 = 図.edges.find((線) => 線.from === "持ち戻る" && 線.to === "便に積む");
    expect(戻る線).toMatchObject({ side: "bottom", overlay: true, tone: "error", style: "dashed" });
    expect(戻る線?.routing).toBeUndefined();
    expect(戻る線?.fromSide).toBeUndefined();
    expect(戻る線?.toSide).toBeUndefined();
  });

  it("side: bottom を戻した配置では箱の突き抜けを見つける", () => {
    const 記法 = カタログの定義.sourceYaml__presetDeliveryFlow.replace(
      "{ overlay: true }",
      "{ side: bottom, overlay: true }",
    );
    const 植え込み = 流れ図の骨組みを数える("荷物を届ける流れ", 記法);
    expect(植え込み.突き抜け.length, "side: bottom を戻しても突き抜けを数えられない").toBeGreaterThan(0);
  });
});
