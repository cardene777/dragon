/**
 * 部品の名前の名札を部品のすぐ上に 1 つだけ出すことの検証 (#1990)。
 *
 * 部品用の縦列は登場人物の名前を名札に持つが、部品の要素は座標で置かれ、縦列は描画側が左から
 * 詰めて並べ直していた。 そのため名札が部品の位置を追わなかった。
 *
 * | 形 | 直す前 (実測) |
 * |---|---|
 * | 部品 4 つだけの流れ図 | `稼働2` の名札が `稼働3` の上、`稼働4` の名札が `稼働2` の上 |
 * | 同上 | 図の右に 875 の何も描かない幅 |
 * | 箱 2 つと部品 7 つの順序図 | 図の右に 4119 の何も描かない幅 |
 * | 見本「流れの途中に置く」 | 名札が図の上端 (先頭の箱の上)、部品は 800 下 |
 * | 縦列を 5 本持つ部品 (`wifi-signal`) | 同じ名前の名札が 5 つ |
 *
 * 見るのは **配置した後の座標**。 組み立てた図の縦列の欄だけを見ると、描画側が縦列を
 * 並べ直した後の位置を見落とす (直す前の状態がそれだった)。
 *
 * 部品は実物 (`parts.cdl.ts`) を使う。 大きさと縦列の数は実物のものを測る。
 */
import { describe, it, expect } from "vitest";
import { layout } from "@cardenelabs/cdl";
import type { CdlDiagram } from "@cardenelabs/cdl";
import { textDslToDiagram } from "../src/index";
import type { CompileNotice } from "../src/compile";
import { 部品の一覧を作る } from "../../../apps/playground-spa/src/lib/parts-catalog";
import * as 部品 from "../../../apps/playground-spa/src/topics/catalog/parts.cdl";
import {
  sourceYaml__pattern__partInBox__流れの途中に置く as 流れの途中に置く,
  sourceYaml__pattern__partInBox__縦列に置く as 縦列に置く,
  sourceYaml__pattern__partInBox__矢印を繋ぐ as 矢印を繋ぐ,
  sourceYaml__pattern__partInBox__繋ぐ要素を名指しする as 繋ぐ要素を名指しする,
} from "../../../apps/playground-spa/src/topics/catalog/parts-in-box.cdl";

const 一覧 = 部品の一覧を作る(Object.values(部品));

/** 名札の縦列の左端と部品の左端の差の上限と、名札の分の上の余白 */
const 横の余白 = 25;
const 上の余白 = 60;

type 配置 = ReturnType<typeof layout>;

function 組み立てる(本文: string, 部品の一覧: Record<string, CdlDiagram> = 一覧) {
  const 知らせ: CompileNotice[] = [];
  const 図 = textDslToDiagram(本文, { partsCatalog: 部品の一覧, onNotice: (n) => 知らせ.push(n) });
  return { 図, 配置: layout(図), 知らせ };
}

/** 登場人物 `名前` の部品の要素の、配置した後の範囲 */
function 部品の範囲(配置: 配置, 名前: string) {
  const 箱 = 配置.nodes.filter((n) => n.id.startsWith(`${名前}__`));
  expect(箱.length, `部品 "${名前}" の要素が 1 つも無い (検査が空振りしている)`).toBeGreaterThan(0);
  return {
    x0: Math.min(...箱.map((n) => n.cx - n.w / 2)),
    x1: Math.max(...箱.map((n) => n.cx + n.w / 2)),
    y0: Math.min(...箱.map((n) => n.cy - n.h / 2)),
    y1: Math.max(...箱.map((n) => n.cy + n.h / 2)),
  };
}

/** 名札が `名札` の縦列 (配置した後) */
function 名札の縦列(配置: 配置, 名札: string) {
  return 配置.lanes.filter((l) => (l as { label?: string }).label === 名札);
}

/**
 * 名札の縦列が部品のすぐ上にあるか。 縦列は部品の要素を横に含み (左端は部品の左端から 25 以内)、
 * 上端は部品の上端から 60 上
 */
function 部品の上にある(
  縦列: 配置["lanes"][number],
  範囲: ReturnType<typeof 部品の範囲>,
  名前: string,
) {
  expect(縦列.x, `"${名前}" の名札の縦列が部品の左端より右から始まる`).toBeLessThanOrEqual(
    範囲.x0 + 0.5,
  );
  expect(範囲.x0 - 縦列.x, `"${名前}" の名札の縦列が部品の左端から離れている`).toBeLessThanOrEqual(
    横の余白,
  );
  expect(
    縦列.x + 縦列.width,
    `"${名前}" の名札の縦列が部品の右端まで届かない`,
  ).toBeGreaterThanOrEqual(範囲.x1 - 0.5);
  expect(縦列.y, `"${名前}" の名札の縦列の上端`).toBeCloseTo(範囲.y0 - 上の余白, 0);
}

const 部品だけ = (数: number, type = "flow") =>
  `title: "t"\ntype: ${type}\n\nactors:\n${Array.from({ length: 数 }, (_, i) => `  - 稼働${i + 1}: { kind: state-indicator }`).join("\n")}\n`;

describe("部品の名前の名札は、その部品のすぐ上に出る (#1990)", () => {
  it("部品 4 つだけの流れ図で、各部品の名札の縦列が部品を横に含み、部品の上端から 60 上にある", () => {
    const { 配置, 知らせ } = 組み立てる(部品だけ(4));
    for (const 名前 of ["稼働1", "稼働2", "稼働3", "稼働4"]) {
      const 範囲 = 部品の範囲(配置, 名前);
      const 縦列 = 名札の縦列(配置, 名前);
      expect(縦列, `"${名前}" の名札が 1 つではない`).toHaveLength(1);
      部品の上にある(縦列[0]!, 範囲, 名前);
    }
    // 2 段目に並ぶ部品で確かめる = 1 段目だけだと、縦列を送らない配置でも名札が合う
    expect(
      部品の範囲(配置, "稼働4").y0,
      "稼働4 が 2 段目に並んでいない (前提が崩れた)",
    ).toBeGreaterThan(部品の範囲(配置, "稼働1").y1);
    expect(知らせ).toEqual([]);
  });

  it.each([
    ["部品 4 つだけの流れ図", 部品だけ(4)],
    ["部品 7 つだけの流れ図", 部品だけ(7)],
    [
      "箱 2 つと部品 7 つの順序図",
      `title: "t"\ntype: sequence\n\nactors:\n  - 受付: { kind: card }\n  - 出荷: { kind: card }\n${Array.from({ length: 7 }, (_, i) => `  - 稼働${i + 1}: { kind: state-indicator }`).join("\n")}\n\nflow:\n  - 受付 -> 出荷: "渡す"\n`,
    ],
  ])("%s で、図の右端と箱の右端の差が 100 以下になる", (_, 本文) => {
    const { 配置 } = 組み立てる(本文);
    const 右端 = Math.max(...配置.nodes.map((n) => n.cx + n.w / 2));
    expect(配置.viewBox.x + 配置.viewBox.w - 右端).toBeLessThanOrEqual(100);
  });

  it("見本「流れの途中に置く」 で、名札が部品の上にあり、図の上端に名札が無い", () => {
    const { 配置, 知らせ } = 組み立てる(流れの途中に置く);
    const 範囲 = 部品の範囲(配置, "設備の稼働");
    const 縦列 = 名札の縦列(配置, "設備の稼働");
    expect(縦列).toHaveLength(1);
    部品の上にある(縦列[0]!, 範囲, "設備の稼働");
    // 部品でない箱より上に名札が出ない = 流れ図の見出しに見えない
    const 箱の上端 = Math.min(
      ...配置.nodes.filter((n) => !n.id.startsWith("設備の稼働__")).map((n) => n.cy - n.h / 2),
    );
    const 上に出る名札 = 配置.lanes.filter(
      (l) => (l as { label?: string }).label !== undefined && l.y + 26 < 箱の上端,
    );
    expect(上に出る名札.map((l) => l.id)).toEqual([]);
    expect(知らせ).toEqual([]);
  });

  it("位置を書いた部品も、名札が部品の上にある", () => {
    const { 配置 } = 組み立てる(
      `title: "t"\ntype: flow\n\nactors:\n  - 受付: { kind: card }\n  - 稼働1:\n      kind: state-indicator\n      位置: 1000,500\n`,
    );
    const 範囲 = 部品の範囲(配置, "稼働1");
    const 縦列 = 名札の縦列(配置, "稼働1");
    expect(縦列).toHaveLength(1);
    部品の上にある(縦列[0]!, 範囲, "稼働1");
  });
});

/**
 * 固定した縦列の高さ。 縦列の枠は塗りも線も持たず絵に出ないが、図の大きさには数えられる。
 * 高さを書かないと縦列は名札の分に縮んで要素が外に出て、下に余白を足すと部品が一番下にある
 * 図だけ図の下の空きが広がる
 */
describe("固定した部品用の縦列は、部品の要素を縦に収め、図の下の空きを変えない (#1990)", () => {
  it.each([
    ["部品 4 つだけの流れ図", 部品だけ(4), ["稼働1", "稼働2", "稼働3", "稼働4"]],
    [
      "縦列を 5 本持つ wifi-signal",
      `title: "t"\ntype: flow\n\nactors:\n  - 受付: { kind: card }\n  - 電波: { kind: wifi-signal }\n`,
      ["電波"],
    ],
  ])("%s で、部品の要素が自分の縦列の中に縦に収まる", (_, 本文, 名前たち) => {
    const { 配置 } = 組み立てる(本文);
    let 見た = 0;
    for (const 名前 of 名前たち) {
      for (const 縦列 of 配置.lanes.filter((l) => l.id.startsWith(`${名前}__`))) {
        const 要素 = 配置.nodes.filter((n) => n.lane === 縦列.id);
        if (要素.length === 0) continue;
        見た += 1;
        const 上端 = Math.min(...要素.map((n) => n.cy - n.h / 2));
        const 下端 = Math.max(...要素.map((n) => n.cy + n.h / 2));
        expect(縦列.y, `${縦列.id} の上端が要素より下にある`).toBeLessThanOrEqual(上端 + 0.5);
        expect(縦列.y + 縦列.height, `${縦列.id} の下端が要素より上にある`).toBeGreaterThanOrEqual(
          下端 - 0.5,
        );
      }
    }
    expect(
      見た,
      "要素を持つ部品用の縦列を 1 本も見ていない (検査が空振りしている)",
    ).toBeGreaterThan(0);
  });

  it.each([
    ["部品 4 つだけの流れ図", 部品だけ(4)],
    [
      "箱の後に部品を置いた流れ図",
      `title: "t"\ntype: flow\n\nactors:\n  - 受付: { kind: card }\n  - 稼働1: { kind: state-indicator }\n  - 出荷: { kind: card }\n\nflow:\n  - 受付 -> 出荷\n`,
    ],
  ])("%s で、図の下の空きが箱だけの図と同じ", (_, 本文) => {
    const 下の空き = (配置: 配置) =>
      配置.viewBox.y + 配置.viewBox.h - Math.max(...配置.nodes.map((n) => n.cy + n.h / 2));
    const 基準 = 下の空き(
      組み立てる(
        `title: "t"\ntype: flow\n\nactors:\n  - 受付: { kind: card }\n  - 出荷: { kind: card }\n\nflow:\n  - 受付 -> 出荷\n`,
      ).配置,
    );
    const { 配置 } = 組み立てる(本文);
    // 部品が一番下にある = 部品の縦列が図の下端を決める形で比べている
    const 部品の下端 = Math.max(
      ...配置.nodes.filter((n) => n.id.includes("__")).map((n) => n.cy + n.h / 2),
    );
    expect(部品の下端, "部品が図の一番下に無い (前提が崩れた)").toBe(
      Math.max(...配置.nodes.map((n) => n.cy + n.h / 2)),
    );
    expect(下の空き(配置)).toBeCloseTo(基準, 0);
  });
});

describe("縦列を 2 本以上持つ部品は、名前の名札を 1 つだけ出す (#1990)", () => {
  it("縦列を 5 本持つ wifi-signal を置くと、名前の名札が部品の左上に 1 つだけ出る", () => {
    expect(
      一覧["wifi-signal"]?.lanes.length,
      "wifi-signal の縦列が 5 本ではない (前提が崩れた)",
    ).toBe(5);
    const { 配置 } = 組み立てる(
      `title: "t"\ntype: flow\n\nactors:\n  - 受付: { kind: card }\n  - 電波: { kind: wifi-signal }\n`,
    );
    const 範囲 = 部品の範囲(配置, "電波");
    const 縦列 = 名札の縦列(配置, "電波");
    expect(縦列).toHaveLength(1);
    // 名札は左端の縦列に付く = 縦列が部品の左端を含み、部品の頁と同じだけ左に出る。
    // 頁は要素の間を空けるため縦列を広げる (#1992) ので、縦列の余白 (25) より広い
    const 頁 = layout(一覧["wifi-signal"]!);
    const 頁の余白 =
      Math.min(...頁.nodes.map((n) => n.cx - n.w / 2)) - Math.min(...頁.lanes.map((l) => l.x));
    expect(縦列[0]!.x).toBeLessThanOrEqual(範囲.x0 + 0.5);
    expect(範囲.x0 - 縦列[0]!.x).toBeCloseTo(頁の余白, 0);
    expect(縦列[0]!.y).toBeCloseTo(範囲.y0 - 上の余白, 0);
  });

  /**
   * 左の縦列の要素が右より低い部品。 名前の名札を左の縦列の要素に合わせると、名札が右の縦列の
   * 要素の上端より下に来て、右へ伸びた字が要素と重なる
   */
  const 左が低い: CdlDiagram = {
    id: "parts-low-left",
    topic: "low-left",
    lanes: [
      { id: "a", x: 0, width: 220 },
      { id: "b", x: 240, width: 220 },
    ],
    nodes: [
      { id: "low", lane: "a", stack: 1, kind: "card", title: "低", w: 200, h: 120 },
      { id: "high", lane: "b", stack: 0, kind: "card", title: "高", w: 200, h: 120 },
    ] as CdlDiagram["nodes"],
    edges: [],
    states: [],
    phases: [],
  };

  it("左の縦列の要素が低い部品でも、名前の名札は部品全体の上端から 60 上にある", () => {
    const { 配置 } = 組み立てる(
      `title: "t"\ntype: flow\n\nactors:\n  - 受付: { kind: card }\n  - 段違い: { kind: low-left }\n`,
      { "low-left": 左が低い, "parts-low-left": 左が低い },
    );
    const 範囲 = 部品の範囲(配置, "段違い");
    const 低い要素 = 配置.nodes.find((n) => n.id === "段違い__low")!;
    expect(低い要素.cy - 低い要素.h / 2, "左の要素が右より低くない (前提が崩れた)").toBeGreaterThan(
      範囲.y0,
    );
    const 縦列 = 名札の縦列(配置, "段違い");
    expect(縦列).toHaveLength(1);
    expect(縦列[0]!.id).toBe("段違い__a");
    expect(縦列[0]!.y).toBeCloseTo(範囲.y0 - 上の余白, 0);
  });

  it("部品が自分の縦列に書いた名札は、そのまま残る", () => {
    const 見出し付き: CdlDiagram = {
      ...左が低い,
      id: "parts-headed",
      lanes: [
        { id: "a", x: 0, width: 220, label: "左の列" },
        { id: "b", x: 240, width: 220, label: "右の列" },
      ],
    };
    const { 配置 } = 組み立てる(
      `title: "t"\ntype: flow\n\nactors:\n  - 受付: { kind: card }\n  - 表: { kind: headed }\n`,
      { headed: 見出し付き, "parts-headed": 見出し付き },
    );
    const 部品の名札 = 配置.lanes
      .filter((l) => l.id.startsWith("表__"))
      .map((l) => [l.id, (l as { label?: string }).label]);
    expect(部品の名札).toEqual([
      ["表__a", "左の列"],
      ["表__b", "右の列"],
    ]);
  });

  /*
   * 部品の頁では縦列が全て同じ上端から始まり、縦列の名札は 1 列に並ぶ。 右の縦列の要素だけが低い
   * 部品で、右の名札が自分の要素に合わせて下がらないことを見る (左の縦列は名前の名札を持つ縦列で、
   * 元から部品全体の上端に合う)
   */
  it("部品が自分の縦列に書いた名札は、要素の高さが違っても部品の頁と同じく 1 列に並ぶ", () => {
    const 右が低い: CdlDiagram = {
      ...左が低い,
      id: "parts-headed-low-right",
      lanes: [
        { id: "a", x: 0, width: 220, label: "左の列" },
        { id: "b", x: 240, width: 220, label: "右の列" },
      ],
      nodes: [
        { id: "high", lane: "a", stack: 0, kind: "card", title: "高", w: 200, h: 120 },
        { id: "low", lane: "b", stack: 1, kind: "card", title: "低", w: 200, h: 120 },
      ] as CdlDiagram["nodes"],
    };
    const { 配置 } = 組み立てる(
      `title: "t"\ntype: flow\n\nactors:\n  - 表: { kind: headed-low-right }\n`,
      { "headed-low-right": 右が低い, "parts-headed-low-right": 右が低い },
    );
    const 範囲 = 部品の範囲(配置, "表");
    const 低い要素 = 配置.nodes.find((n) => n.id === "表__low")!;
    expect(低い要素.cy - 低い要素.h / 2, "右の要素が左より低くない (前提が崩れた)").toBeGreaterThan(
      範囲.y0,
    );
    const 縦列 = 配置.lanes.filter((l) => l.id.startsWith("表__"));
    expect(縦列.map((l) => (l as { label?: string }).label)).toEqual(["左の列", "右の列"]);
    for (const l of 縦列) {
      expect(l.y, `${l.id} の名札が 1 列に並んでいない`).toBeCloseTo(範囲.y0 - 上の余白, 0);
    }
  });
});

describe("縦列に置く部品の縦列は変わらない (#1990)", () => {
  it.each([
    ["縦列に置く", 縦列に置く, ["受付", "出荷"]],
    ["矢印を繋ぐ", 矢印を繋ぐ, ["点検", "設備の稼働", "保全"]],
    ["繋ぐ要素を名指しする", 繋ぐ要素を名指しする, ["受注", "在庫の内訳", "出荷"]],
  ])("見本「%s」 の縦列は位置を固定せず、名札も今どおり", (_, 本文, 名札) => {
    const { 図 } = 組み立てる(本文);
    expect(図.lanes.map((l) => l.label)).toEqual(名札);
    expect(
      図.lanes.filter((l) => l.posX !== undefined || l.posY !== undefined).map((l) => l.id),
    ).toEqual([]);
  });

  /*
   * 縦列に置く部品は、配置した縦列の中心に合わせる (#1980)。 部品用の縦列を固定すると描画側の
   * 縦列の詰め方が変わるので、固定する前の配置で合わせると描いた図の縦列からずれる。
   * 縦列に置く部品と格子の部品を同じ図に置いて、描いた図で中心に来ることを見る
   */
  it("縦列に置く部品と格子の部品が同じ図に居ても、縦列に置く部品は縦列の中心に来る", () => {
    const { 配置 } = 組み立てる(
      [
        'title: "t"',
        "type: flow",
        "",
        "lanes:",
        '  受付: { label: "受付" }',
        '  出荷: { label: "出荷" }',
        "",
        "actors:",
        "  - 注文を受ける: { kind: card, lane: 受付 }",
        "  - 梱包する: { kind: card, lane: 出荷 }",
        "  - 印: { kind: state-indicator, lane: 出荷 }",
        "  - 灯: { kind: state-indicator }",
        "",
      ].join("\n"),
    );
    const 出荷 = 配置.lanes.find((l) => l.id === "出荷");
    expect(出荷, "出荷の縦列が無い (前提が崩れた)").toBeDefined();
    const 印 = 部品の範囲(配置, "印");
    expect((印.x0 + 印.x1) / 2, "印が出荷の縦列の中心に無い").toBeCloseTo(
      出荷!.x + 出荷!.width / 2,
      0,
    );
    // 灯は部品用の縦列を持ち、固定されている (前提が崩れていない)
    const 灯の名札 = 名札の縦列(配置, "灯");
    expect(灯の名札, "灯が格子に置かれていない (前提が崩れた)").toHaveLength(1);
    部品の上にある(灯の名札[0]!, 部品の範囲(配置, "灯"), "灯");
  });
});
