// @vitest-environment jsdom
import { renderToStaticMarkup } from "react-dom/server";
import { CdlDiagramView, layout, type CdlDiagram } from "@cardenelabs/cdl";
import { afterEach, describe, expect, it, vi } from "vitest";

import { readSnapshot } from "@/components/CatalogSkeletonParts";
import { presetDeliveryFlow } from "@/topics/catalog/presets.cdl";
import {
  pattern__textDslFlowchart__縦に積む,
  pattern__textDslFlowchart__複雑,
  textDslFlowchart,
} from "@/topics/catalog/text-dsl.cdl";
import {
  FLOWCHART_SKELETON_PARTS,
  avoidCatalogSkeletonBadgeOverlaps,
  catalogSkeletonLineBadgePoint,
  catalogSkeletonPartBadgeTarget,
  catalogSkeletonPartTarget,
} from "./catalog-skeleton-parts";

const 流れ図 = [
  ["荷物を届ける流れ", presetDeliveryFlow],
  ["経費申請の承認の簡単", textDslFlowchart],
  ["経費申請の承認の縦に積む", pattern__textDslFlowchart__縦に積む],
  ["経費申請の承認の複雑", pattern__textDslFlowchart__複雑],
] as const satisfies readonly (readonly [string, CdlDiagram])[];

const 共通の部品 = [
  "地",
  "箱",
  "箱の字",
  "主な流れの線",
];

function 描く(図: CdlDiagram): SVGSVGElement {
  const 警告を黙らせる = vi.spyOn(console, "warn").mockImplementation(() => undefined);
  try {
    const 配置済み = layout(図);
    const 器 = document.createElement("div");
    器.innerHTML = renderToStaticMarkup(
      <CdlDiagramView
        diagram={配置済み}
        focusPhaseId={配置済み.phases.at(-1)?.id}
        hideHeader
        hideMiniPhaseIndicator
      />,
    );
    const svg = 器.querySelector<SVGSVGElement>('svg[data-cdl-type="flowchart"]');
    if (!svg) throw new Error(`${図.id} を flowchart の SVG として描けない`);
    return svg;
  } finally {
    警告を黙らせる.mockRestore();
  }
}

function SVGの長さを補う(長さ: Readonly<Record<string, number>>): () => void {
  const 元の長さ = Object.getOwnPropertyDescriptor(SVGElement.prototype, "getTotalLength");
  const 元の位置 = Object.getOwnPropertyDescriptor(SVGElement.prototype, "getPointAtLength");
  Object.defineProperties(SVGElement.prototype, {
    getTotalLength: {
      configurable: true,
      value(this: SVGElement) {
        return 長さ[this.getAttribute("d") ?? ""] ?? 0;
      },
    },
    getPointAtLength: {
      configurable: true,
      value(distance: number) {
        return { x: distance, y: 0 };
      },
    },
  });
  return () => {
    if (元の長さ) Object.defineProperty(SVGElement.prototype, "getTotalLength", 元の長さ);
    else delete (SVGElement.prototype as SVGElement & { getTotalLength?: () => number })
      .getTotalLength;
    if (元の位置) Object.defineProperty(SVGElement.prototype, "getPointAtLength", 元の位置);
    else
      delete (
        SVGElement.prototype as SVGElement & {
          getPointAtLength?: (distance: number) => DOMPoint;
        }
      ).getPointAtLength;
  };
}

function 線の番号地点を測る(札の位置?: { x: number; y: number }): { x: number; y: number } | null {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  const 札の属性 = 札の位置
    ? `data-cdl-label-x="${札の位置.x}" data-cdl-label-y="${札の位置.y}"`
    : "";
  svg.innerHTML = `
    <g data-cdl-edge ${札の属性} data-cdl-path-d="M 0 0 L 200 0">
      <path data-cdl-role="edge-line" d="M 0 0 L 10 0"></path>
    </g>
  `;
  const line = svg.querySelector<SVGElement>('[data-cdl-role="edge-line"]');
  if (!line) throw new Error("検査用の線を描けない");
  Object.defineProperty(line, "getScreenCTM", {
    configurable: true,
    value: () => ({ a: 2, b: 0, c: 0, d: 2, e: 10, f: 20 }),
  });
  const 元へ戻す = SVGの長さを補う({ "M 0 0 L 200 0": 200 });
  try {
    return catalogSkeletonLineBadgePoint(line);
  } finally {
    元へ戻す();
  }
}

afterEach(() => {
  vi.restoreAllMocks();
  document.head.querySelector("[data-test-catalog-skeleton-style]")?.remove();
  document.body.replaceChildren();
});

describe("見本帳の流れ図で骨組みの部品を選ぶ", () => {
  const 結果 = 流れ図.map(([名前, 図]) => {
    const svg = 描く(図);
    const 当たった = FLOWCHART_SKELETON_PARTS.filter((part) =>
      catalogSkeletonPartTarget(svg, part),
    ).map((part) => part.label);
    return { 名前, 当たった };
  });

  it("4 枚すべてで共通する 4 部品に 1 つ以上当たる", () => {
    expect(結果).toHaveLength(4);
    for (const { 名前, 当たった } of 結果) {
      expect(当たった, `${名前} で共通部品に当たらない`).toEqual(
        expect.arrayContaining(共通の部品),
      );
    }
    const 一度でも当たった = new Set(結果.flatMap(({ 当たった }) => 当たった));
    expect([...一度でも当たった]).toEqual(
      expect.arrayContaining(FLOWCHART_SKELETON_PARTS.map((part) => part.label)),
    );
  });

  it("図に在る札・戻る線・凡例だけを選び、無い部品は選ばない", () => {
    expect(結果).toEqual([
      {
        名前: "荷物を届ける流れ",
        当たった: FLOWCHART_SKELETON_PARTS.map((part) => part.label),
      },
      {
        名前: "経費申請の承認の簡単",
        当たった: ["地", "列の見出し", "箱", "箱の字", "主な流れの線", "分かれ道"],
      },
      { 名前: "経費申請の承認の縦に積む", 当たった: 共通の部品 },
      {
        名前: "経費申請の承認の複雑",
        当たった: [
          "地",
          "列の見出し",
          "箱",
          "箱の字",
          "主な流れの線",
          "分かれ道",
          "「はい」の札",
          "「いいえ」の札",
        ],
      },
    ]);
  });

  it("線の番号は今の線が短くても描き終えた形が最も長い線へ置く", () => {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.innerHTML = `
      <g data-cdl-edge data-cdl-from="start" data-cdl-to="long" data-cdl-path-d="M 0 0 L 200 0">
        <path data-cdl-role="edge-line" d="M 0 0 L 10 0"></path>
      </g>
      <g data-cdl-edge data-cdl-from="start" data-cdl-to="short" data-cdl-path-d="M 0 0 L 100 0">
        <path data-cdl-role="edge-line" d="M 0 0 L 80 0"></path>
      </g>
    `;
    const part = FLOWCHART_SKELETON_PARTS.find(({ label }) => label === "主な流れの線");
    if (!part) throw new Error("主な流れの線の定義が無い");
    const lines = Array.from(svg.querySelectorAll<SVGElement>(part.selector));
    const 元へ戻す = SVGの長さを補う({
      "M 0 0 L 10 0": 10,
      "M 0 0 L 80 0": 80,
      "M 0 0 L 100 0": 100,
      "M 0 0 L 200 0": 200,
    });
    try {
      expect(catalogSkeletonPartBadgeTarget(svg, part)).toBe(lines[0]);
    } finally {
      元へ戻す();
    }
  });

  it("札の位置が 4 分の 1 の地点に近い時は 4 分の 3 の地点に置く", () => {
    expect(線の番号地点を測る({ x: 40, y: 0 })).toEqual({ x: 310, y: 20 });
  });

  it("札の位置が 4 分の 3 の地点に近い時は 4 分の 1 の地点に置く", () => {
    expect(線の番号地点を測る({ x: 160, y: 0 })).toEqual({ x: 110, y: 20 });
  });

  it("札の位置を持たない時は 4 分の 1 の地点に置く", () => {
    expect(線の番号地点を測る()).toEqual({ x: 110, y: 20 });
  });

  it("骨組みだけでも動きを止めて意匠の線の値を読み、骨組みへ戻してから印を外す", () => {
    const style = document.createElement("style");
    style.dataset.testCatalogSkeletonStyle = "";
    style.textContent = `
      [data-cdl-role="edge-line"] {
        stroke: var(--cdl-edge-stroke);
        stroke-width: var(--cdl-edge-width);
      }
    `;
    document.head.append(style);

    const stageMarkup = `
      <svg data-cdl-stage data-cdl-type="flowchart">
        <g data-cdl-edge data-cdl-from="start" data-cdl-to="end">
          <path data-cdl-role="edge-line"></path>
        </g>
      </svg>
    `;
    const skeletonStage = document.createElement("div");
    skeletonStage.innerHTML = stageMarkup;
    const designStage = document.createElement("div");
    designStage.setAttribute("data-catalog-skeleton", "on");
    designStage.innerHTML = stageMarkup;
    document.body.append(skeletonStage, designStage);

    const designSvg = designStage.querySelector<SVGSVGElement>("svg");
    const designLine = designStage.querySelector<SVGElement>('[data-cdl-role="edge-line"]');
    if (!designSvg || !designLine) throw new Error("検査用の線を描けない");

    const nativeGetComputedStyle = window.getComputedStyle.bind(window);
    const states: { element: Element; skeleton: boolean; reading: boolean }[] = [];
    vi.spyOn(window, "getComputedStyle").mockImplementation((element) => {
      const skeleton = designStage.getAttribute("data-catalog-skeleton") === "on";
      const reading = designStage.hasAttribute("data-catalog-skeleton-reading");
      if (element === designSvg || element === designLine) states.push({ element, skeleton, reading });
      if (element !== designLine) return nativeGetComputedStyle(element);

      const stroke = skeleton ? "rgb(180, 184, 191)" : "rgb(12, 34, 56)";
      const strokeWidth = skeleton ? "2.5px" : "4px";
      return {
        stroke,
        getPropertyValue(property: string) {
          if (property === "stroke") return stroke;
          if (property === "stroke-width") return strokeWidth;
          return "";
        },
      } as unknown as CSSStyleDeclaration;
    });

    const snapshot = readSnapshot(skeletonStage, designStage);
    const lineValues = snapshot.rows.find(({ part }) => part.label === "主な流れの線")?.values;

    expect(lineValues).toEqual(
      expect.arrayContaining([
        { kind: "線と枠の色", value: "rgb(12, 34, 56)" },
        { kind: "線と枠の太さ", value: "4px" },
      ]),
    );
    expect(states).toContainEqual({ element: designLine, skeleton: false, reading: true });
    expect(states).toContainEqual({ element: designLine, skeleton: true, reading: true });
    expect(designStage.getAttribute("data-catalog-skeleton")).toBe("on");
    expect(designStage.hasAttribute("data-catalog-skeleton-reading")).toBe(false);
  });
});

describe("骨組みの番号の重なりを避ける", () => {
  const 台 = { width: 200, height: 200 };

  it("重なる 2 つ目を中心間が 24px 以上離れた位置へ動かす", () => {
    const 結果 = avoidCatalogSkeletonBadgeOverlaps(
      [
        { number: 1, left: 50, top: 50 },
        { number: 2, left: 55, top: 50 },
      ],
      台,
    );

    expect(結果).toEqual([
      { number: 1, left: 50, top: 50 },
      { number: 2, left: 81, top: 50 },
    ]);
    expect(Math.hypot(結果[1]!.left - 結果[0]!.left, 結果[1]!.top - 結果[0]!.top)).toBeGreaterThanOrEqual(
      24,
    );
  });

  it("重ならない丸は動かさない", () => {
    const 丸 = [
      { number: 1, left: 20, top: 20 },
      { number: 2, left: 80, top: 80 },
    ];

    expect(avoidCatalogSkeletonBadgeOverlaps(丸, 台)).toEqual(丸);
  });

  it("同じ入力には同じ結果を返す", () => {
    const 丸 = [
      { number: 2, left: 40, top: 40 },
      { number: 1, left: 40, top: 40 },
      { number: 3, left: 40, top: 40 },
    ];

    expect(avoidCatalogSkeletonBadgeOverlaps(丸, 台)).toEqual(
      avoidCatalogSkeletonBadgeOverlaps(丸, 台),
    );
  });
});
