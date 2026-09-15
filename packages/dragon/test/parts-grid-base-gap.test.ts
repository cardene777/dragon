/**
 * 部品を格子に並べ始める位置を、既存の図の **実際の下端** から決める (#2002)。
 *
 * 直す前は「箱の数 × 280」 で概算していた。 `flow` の箱は実際には高さ 68 で 168 おきに
 * 並ぶため、1 段あたり 112 ずつ余分に見積もる。 誤差は箱の数に比例して積み上がり、
 * 実測で箱 2 つの図に 496、箱 4 つの図に 720 の空きが入っていた。
 *
 * ## 値そのものを書かない
 *
 * 期待する空きは **部品の段と段の間** から出す。 格子は図枠どうしを一定の間で並べるので、
 * 既存の図との間もそれと同じになるのが揃った状態。 数字を書くと、図枠の余白や段の送り幅を
 * 変えた時に検査だけが古くなる。
 *
 * ## 既存の箱が無い図は変えない
 *
 * 測る対象が無い時に 0 を下端として使うと、部品が図の上端に貼り付く。
 * 「箱が無い」 と「下端が 0」 を同じ値に潰さないことを、部品だけを並べた図で固定する。
 */
import { describe, it, expect } from "vitest";
import { diagram, layout, visualValidateAll } from "@cardenelabs/cdl";
import type { CdlDiagram } from "@cardenelabs/cdl";

import { textDslToDiagram } from "../src/index";
import { partsBaseBottom, partsGridCenters } from "../src/compile";
import * as partsInBox from "../../../apps/playground-spa/src/topics/catalog/parts-in-box.cdl";

/** 1 lane + 1 node の見本。 実際のカタログと同じ形。 */
const 見本 = (id: string, w: number, h: number): CdlDiagram =>
  diagram(id, { topic: id })
    .lane("l", { width: w })
    .node("box", { lane: "l", stack: 0, kind: "card", title: id, w, h })
    .build();

const 一覧: Record<string, CdlDiagram> = {
  計器: 見本("計器", 400, 300),
  "parts-計器": 見本("計器", 400, 300),
};

const 組み立てる = (本文: string): ReturnType<typeof layout> =>
  layout(textDslToDiagram(本文, { partsCatalog: 一覧 }) as unknown as CdlDiagram);

/** `名前__` で始まる箱の上端 / 下端。 */
const 上端 = (laid: ReturnType<typeof layout>, 前置き: string): number =>
  Math.min(...laid.nodes.filter((n) => n.id.startsWith(前置き)).map((n) => n.cy - n.h / 2));
const 下端 = (laid: ReturnType<typeof layout>, 前置き: string): number =>
  Math.max(...laid.nodes.filter((n) => n.id.startsWith(前置き)).map((n) => n.cy + n.h / 2));

/** 箱を `n` 個ならべ、矢印で繋いだ本文。 最後に部品を 1 つ足す。 */
const 箱と部品 = (n: number, 部品の数 = 1): string => {
  const 名 = Array.from({ length: n }, (_, i) => `箱${i}`);
  const 部品 = Array.from({ length: 部品の数 }, (_, i) => `計器${i}`);
  return [
    `title: "t"`,
    `type: flow`,
    ``,
    `actors:`,
    ...名.map((x) => `  - ${x}: { kind: card }`),
    ...部品.map((x) => `  - ${x}: { kind: 計器 }`),
    ``,
    `flow:`,
    ...名.slice(1).map((x, i) => `  - ${名[i]} -> ${x}: "渡す"`),
    ``,
  ].join("\n");
};

/** 既存の箱の下端と、最初の部品の上端の間。 */
const 図と部品の間 = (laid: ReturnType<typeof layout>): number => {
  const 既存 = laid.nodes.filter((n) => !n.id.startsWith("計器"));
  expect(既存.length, "既存の箱を 1 つも測れていない (検査が空振りしている)").toBeGreaterThan(0);
  return 上端(laid, "計器0__") - Math.max(...既存.map((n) => n.cy + n.h / 2));
};

/**
 * 部品の段と段の間 (実測)。
 *
 * 1 行は 3 個なので、4 個目が 2 段目に落ちる。 その段の上端と 1 段目の下端の差を取る。
 */
const 段と段の間 = (): number => {
  const laid = 組み立てる(箱と部品(2, 4));
  return 上端(laid, "計器3__") - 下端(laid, "計器0__");
};

describe("既存の図の下端から並べ始める (#2002)", () => {
  const 図の形: Array<{ 名: string; 本文: string }> = [
    { 名: "箱 2 つ", 本文: 箱と部品(2) },
    { 名: "箱 4 つ", 本文: 箱と部品(4) },
    {
      名: "高さ 600 の箱 1 つ",
      本文: `title: "t"\ntype: flow\n\nactors:\n  - 板: { kind: card, posX: 0, posY: 0, posW: 400, posH: 600 }\n  - 計器0: { kind: 計器 }\n`,
    },
  ];

  it.each(図の形)("$名 の下に、部品の段と段と同じ間で置く", ({ 本文 }) => {
    const 期待 = 段と段の間();
    expect(期待, "段と段の間を測れていない (検査が空振りしている)").toBeGreaterThan(0);
    expect(図と部品の間(組み立てる(本文))).toBe(期待);
  });

  it("空きが箱の数で増えない", () => {
    /*
     * 数で概算していた時は、箱を増やすほど空きが広がった (2 つで 496、4 つで 720)。
     * 図の形を変えても間が動かないことを、1 件ずつの期待値とは別に固定する。
     */
    const 間たち = [1, 2, 3, 4, 5].map((n) => 図と部品の間(組み立てる(箱と部品(n))));
    expect(間たち.length, "1 件も測れていない (検査が空振りしている)").toBe(5);
    expect([...new Set(間たち)], "箱の数で空きが変わる").toEqual([段と段の間()]);
  });

  it("位置を書いた部品は、格子に並ぶ部品を押し下げない", () => {
    /*
     * 下端を測る対象は **部品を除いた図**。 部品を含めて測ると、位置を書いた部品を深くするほど
     * 格子が下へ逃げる。 深さを変えても格子の位置が動かないことを見る。
     */
    const 本文 = (深さ: number | null): string =>
      [
        `title: "t"`,
        `type: flow`,
        ``,
        `actors:`,
        `  - 箱0: { kind: card }`,
        `  - 箱1: { kind: card }`,
        ...(深さ === null ? [] : [`  - 書いた: { kind: 計器, posX: 0, posY: ${深さ} }`]),
        `  - 計器0: { kind: 計器 }`,
        ``,
        `flow:`,
        `  - 箱0 -> 箱1: "渡す"`,
        ``,
      ].join("\n");
    const 上端たち = [null, 0, 1000, 3000].map((d) => 上端(組み立てる(本文(d)), "計器0__"));
    expect(上端たち.length, "1 件も測れていない (検査が空振りしている)").toBe(4);
    expect([...new Set(上端たち)], "位置を書いた部品の深さで格子が動く").toHaveLength(1);
  });

  it("既存の箱が無い図は置き場所が変わらない", () => {
    /*
     * 「箱が無い」 を下端 0 に潰すと、部品が図の上端へ貼り付く。
     * 部品だけを並べた図の置き場所が、下端を渡さない時の格子と一致することを見る。
     */
    const laid = 組み立てる(`title: "t"\ntype: flow\n\nactors:\n  - 計器0: { kind: 計器 }\n`);
    expect(
      laid.nodes.filter((n) => n.id.startsWith("計器0__")).length,
      "部品の箱を 1 つも測れていない",
    ).toBeGreaterThan(0);
    const 図枠 = layout(一覧["計器"]!);
    const 格子 = partsGridCenters(undefined, [
      { id: "計器0", w: 図枠.viewBox.w, h: 図枠.viewBox.h },
    ]).get("計器0")!;
    // 格子が返すのは図枠の中心。 箱の上端は図枠の上端に余白を足した位置
    const 余白 = 上端(図枠, "box") - 図枠.viewBox.y;
    expect(上端(laid, "計器0__")).toBe(格子.cy - 図枠.viewBox.h / 2 + 余白);
  });
});

describe("下端の測り方 (#2002)", () => {
  it("箱が 1 つも無い図は下端を持たない", () => {
    const 空 = layout(diagram("空", { topic: "空" }).lane("l", { width: 400 }).build());
    expect(partsBaseBottom(空)).toBeUndefined();
  });

  it("箱の下端ではなく図枠の下端を返す", () => {
    /*
     * 箱で測ると、既存の図の下余白と部品の上余白が空きに数えられず、部品どうしの段の間より
     * 狭くなる。 図枠で測れば両方が同じ物差しになる。
     */
    const laid = layout(見本("計器", 400, 300));
    const 箱の下端 = 下端(laid, "box");
    expect(partsBaseBottom(laid)).toBe(laid.viewBox.y + laid.viewBox.h);
    expect(
      partsBaseBottom(laid)!,
      "図枠の下端が箱の下端と同じ (余白を数えていない)",
    ).toBeGreaterThan(箱の下端);
  });

  it("下端が数でない時は、箱が無い時と同じ置き場所に倒す", () => {
    const 無し = partsGridCenters(undefined, [{ id: "x", w: 100, h: 100 }]).get("x")!;
    for (const 壊れた of [Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY]) {
      expect(partsGridCenters(壊れた, [{ id: "x", w: 100, h: 100 }]).get("x")!).toEqual(無し);
    }
  });

  it("下端が負でも、そこから間を空けて置く (負を捨てない)", () => {
    // 図は原点より上にも置ける。 0 で下げ止めると、上にある図の下に無駄な空きが入る
    const 上 = partsGridCenters(-500, [{ id: "x", w: 100, h: 100 }]).get("x")!;
    const 下 = partsGridCenters(0, [{ id: "x", w: 100, h: 100 }]).get("x")!;
    expect(下.cy - 上.cy).toBe(500);
  });
});

describe("カタログの見本が読める大きさに戻る (#2002)", () => {
  const 図か = (v: unknown): v is CdlDiagram =>
    typeof v === "object" && v !== null && Array.isArray((v as CdlDiagram).nodes);
  const 全図 = Object.values(partsInBox as Record<string, unknown>).filter(図か);
  const 対象 = 全図.find((d) => d.id === "注文を受けてから出荷するまでの間に設備の稼働を置く");

  it("見本を 1 枚以上集められている (空振り防止)", () => {
    expect(全図.length, "部品を箱に使う見本を 1 枚も集められていない").toBeGreaterThan(0);
    expect(対象, "`流れの途中に置く` の見本が見つからない").toBeDefined();
  });

  it("拡大の器で軸 responsive-viewport の注意が出ない", () => {
    /*
     * 直す前は viewBox 525x1232 で、拡大の器 (1150x630) に収めると倍率 0.511、
     * 題 22 world が 11.3px になっていた (下限 12px)。
     */
    const 指摘 = visualValidateAll([対象!], { profile: "catalog" }).reports.flatMap((r) =>
      r.violations
        .filter((v) => v.axis === "responsive-viewport")
        .map((v) => `${r.diagramId} ${v.axis}:${v.severity}`),
    );
    expect(指摘).toEqual([]);
  });
});
