// @vitest-environment jsdom
import { act, cleanup, render } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";
import { CdlDiagramView, layout, type CdlDiagram } from "@cardenelabs/cdl";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  CatalogSkeletonParts,
  colorHex,
  readSnapshot,
} from "@/components/CatalogSkeletonParts";
import {
  presetDeliveryClasses,
  presetDeliveryComponents,
  presetDeliveryFlow,
  presetDeliveryRelations,
  presetDeliverySequence,
} from "@/topics/catalog/presets.cdl";
import {
  pattern__textDslFlowchart__縦に積む,
  pattern__textDslFlowchart__複雑,
  textDslFlowchart,
} from "@/topics/catalog/text-dsl.cdl";
import {
  FLOWCHART_SKELETON_PARTS,
  INFRASTRUCTURE_SKELETON_PARTS,
  MIND_SKELETON_PARTS,
  RECORD_SKELETON_PARTS,
  SEQUENCE_SKELETON_PARTS,
  TREE_SKELETON_PARTS,
  avoidCatalogSkeletonBadgeOverlaps,
  catalogSkeletonLineBadgePoint,
  catalogSkeletonPartBadgeTarget,
  catalogSkeletonPartTarget,
  catalogSkeletonPartsFor,
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
    const svg = 器.querySelector<SVGSVGElement>("svg[data-cdl-type]");
    if (!svg) throw new Error(`${図.id} を SVG として描けない`);
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

function 矩形(left: number, top: number, width: number, height: number): DOMRect {
  return {
    x: left,
    y: top,
    left,
    top,
    width,
    height,
    right: left + width,
    bottom: top + height,
    toJSON: () => ({}),
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
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
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
    vi.spyOn(lines[0]!, "getBoundingClientRect").mockReturnValue(矩形(0, 0, 200, 1));
    vi.spyOn(lines[1]!, "getBoundingClientRect").mockReturnValue(矩形(0, 0, 100, 1));
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

  it("最も長い線を選ぶ時も、大きさ 0 の線は候補から外す", () => {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.innerHTML = `
      <g data-cdl-edge data-cdl-from="start" data-cdl-to="hidden" data-cdl-path-d="M 0 0 L 300 0">
        <path data-cdl-role="edge-line" d="M 0 0 L 300 0"></path>
      </g>
      <g data-cdl-edge data-cdl-from="start" data-cdl-to="visible" data-cdl-path-d="M 0 0 L 100 0">
        <path data-cdl-role="edge-line" d="M 0 0 L 100 0"></path>
      </g>
    `;
    const part = FLOWCHART_SKELETON_PARTS.find(({ label }) => label === "主な流れの線");
    if (!part) throw new Error("主な流れの線の定義が無い");
    const lines = Array.from(svg.querySelectorAll<SVGElement>(part.selector));
    vi.spyOn(lines[0]!, "getBoundingClientRect").mockReturnValue(矩形(0, 0, 0, 0));
    vi.spyOn(lines[1]!, "getBoundingClientRect").mockReturnValue(矩形(0, 0, 100, 1));
    const 元へ戻す = SVGの長さを補う({
      "M 0 0 L 100 0": 100,
      "M 0 0 L 300 0": 300,
    });
    try {
      expect(catalogSkeletonPartBadgeTarget(svg, part)).toBe(lines[1]);
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

describe("階層図とマインドマップで骨組みの部品を選ぶ", () => {
  it("階層図の各部品を役から選ぶ", () => {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.innerHTML = `
      <g data-cdl-role="tree-node">
        <text data-cdl-role="tree-node-title"></text>
        <text data-cdl-role="tree-node-subtitle"></text>
      </g>
      <path data-cdl-role="tree-edge"></path>
      <path data-cdl-role="tree-edge-head"></path>
      <text data-cdl-role="figure-title"></text>
      <text data-cdl-role="figure-kind-label"></text>
    `;

    expect(
      TREE_SKELETON_PARTS.map((part) => [part.label, catalogSkeletonPartTarget(svg, part)]),
    ).toEqual(TREE_SKELETON_PARTS.map((part) => [part.label, expect.any(SVGElement)]));
  });

  it("マインドマップの各部品を役から選ぶ", () => {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.innerHTML = `
      <g data-cdl-role="mind-root"><text data-cdl-role="mind-root-title"></text></g>
      <path data-cdl-role="mind-edge"></path>
      <g data-cdl-role="mind-box"><text data-cdl-role="mind-box-title"></text></g>
      <text data-cdl-role="mind-leaf-title"></text>
      <path data-cdl-role="mind-leaf-underline"></path>
      <text data-cdl-role="figure-title"></text>
    `;

    expect(
      MIND_SKELETON_PARTS.map((part) => [part.label, catalogSkeletonPartTarget(svg, part)]),
    ).toEqual(MIND_SKELETON_PARTS.map((part) => [part.label, expect.any(SVGElement)]));
  });

  it("図の種類に対応する一覧だけを返す", () => {
    expect(catalogSkeletonPartsFor("flowchart")).toBe(FLOWCHART_SKELETON_PARTS);
    expect(catalogSkeletonPartsFor("tree")).toBe(TREE_SKELETON_PARTS);
    expect(catalogSkeletonPartsFor("mind")).toBe(MIND_SKELETON_PARTS);
    expect(catalogSkeletonPartsFor("sequence")).toBe(SEQUENCE_SKELETON_PARTS);
    expect(catalogSkeletonPartsFor("infrastructure")).toBe(INFRASTRUCTURE_SKELETON_PARTS);
    expect(catalogSkeletonPartsFor("record")).toBe(RECORD_SKELETON_PARTS);
    expect(catalogSkeletonPartsFor(null)).toBeNull();
  });

  it("大きさ 0 の候補を飛ばして、画面に大きさのある候補を番号の対象にする", () => {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.innerHTML = `
      <path data-cdl-role="tree-edge-head"></path>
      <path data-cdl-role="tree-edge-head"></path>
    `;
    const part = TREE_SKELETON_PARTS.find(({ label }) => label === "枝の矢じり");
    if (!part) throw new Error("枝の矢じりの定義が無い");
    const heads = Array.from(svg.querySelectorAll<SVGElement>(part.selector));
    vi.spyOn(heads[0]!, "getBoundingClientRect").mockReturnValue(矩形(0, 0, 0, 0));
    vi.spyOn(heads[1]!, "getBoundingClientRect").mockReturnValue(矩形(20, 30, 8, 4));

    expect(catalogSkeletonPartBadgeTarget(svg, part)).toBe(heads[1]);
  });

  it("大きさ 0 の要素しかない部品は丸を出さず、表の番号を白抜きにする", () => {
    class 大きさの見張り {
      observe(): void {}
      unobserve(): void {}
      disconnect(): void {}
    }
    let frame: FrameRequestCallback | null = null;
    vi.stubGlobal("ResizeObserver", 大きさの見張り);
    vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
      frame = callback;
      return 1;
    });
    vi.stubGlobal("cancelAnimationFrame", () => {});

    const stageMarkup = `
      <svg data-cdl-stage data-cdl-type="tree">
        <path data-cdl-role="tree-edge-head"></path>
      </svg>
    `;
    const skeletonStage = document.createElement("div");
    skeletonStage.innerHTML = stageMarkup;
    const designStage = document.createElement("div");
    designStage.innerHTML = stageMarkup;
    document.body.append(skeletonStage, designStage);
    vi.spyOn(Element.prototype, "getBoundingClientRect").mockImplementation(function (
      this: Element,
    ) {
      if (this.getAttribute("data-cdl-role") === "tree-edge-head") return 矩形(20, 30, 0, 0);
      return 矩形(0, 0, 200, 200);
    });

    const { container } = render(
      <CatalogSkeletonParts
        skeletonStage={skeletonStage}
        designStage={designStage}
        refreshKey="tree-zero-size"
      />,
    );
    act(() => frame?.(0));

    const row = Array.from(container.querySelectorAll("tbody tr")).find((candidate) =>
      candidate.textContent?.includes("枝の矢じり"),
    );
    const number = row?.querySelector(".catalog-skeleton-number span");
    expect(number?.textContent).toBe("2");
    expect(number?.classList.contains("is-unplaced")).toBe(true);
    expect(row?.textContent).toContain("骨組みの上に出ない");
    expect(
      Array.from(skeletonStage.querySelectorAll(".catalog-skeleton-badge")).some(
        (badge) => badge.textContent === "2",
      ),
    ).toBe(false);
  });

  it("途中の部品が図に無くても表と丸を 1 から飛ばさず同じ番号で並べる", () => {
    const stageMarkup = `
      <svg data-cdl-stage data-cdl-type="tree">
        <g data-cdl-role="tree-node">
          <text data-cdl-role="tree-node-subtitle"></text>
        </g>
        <path data-cdl-role="tree-edge"></path>
        <path data-cdl-role="tree-edge-head"></path>
        <text data-cdl-role="figure-title"></text>
        <text data-cdl-role="figure-kind-label"></text>
      </svg>
    `;
    const skeletonStage = document.createElement("div");
    skeletonStage.innerHTML = stageMarkup;
    const designStage = document.createElement("div");
    designStage.innerHTML = stageMarkup;
    document.body.append(skeletonStage, designStage);
    vi.spyOn(Element.prototype, "getBoundingClientRect").mockReturnValue(矩形(0, 0, 200, 200));

    const skeletonEdge = skeletonStage.querySelector<SVGElement>('[data-cdl-role="tree-edge"]');
    if (!skeletonEdge) throw new Error("検査用の枝を描けない");
    Object.defineProperties(skeletonEdge, {
      getTotalLength: { configurable: true, value: () => 100 },
      getPointAtLength: { configurable: true, value: (distance: number) => ({ x: distance, y: 20 }) },
      getScreenCTM: {
        configurable: true,
        value: () => ({ a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 }),
      },
    });

    const snapshot = readSnapshot(skeletonStage, designStage);

    expect(snapshot.rows.map(({ number }) => number)).toEqual([1, 2, 3, 4, 5, 6, 7]);
    expect(snapshot.badges.map(({ number }) => number)).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });
});

describe("宅配の 4 記法で骨組みの部品を選ぶ", () => {
  const 図と一覧 = [
    [presetDeliverySequence, "sequence", SEQUENCE_SKELETON_PARTS, ["動作中の帯", "生命線", "言づての線"]],
    [presetDeliveryComponents, "infrastructure", INFRASTRUCTURE_SKELETON_PARTS, ["区画", "部品の箱", "つながりの線"]],
    [presetDeliveryRelations, "record", RECORD_SKELETON_PARTS, ["箱", "行", "関係の線"]],
    [presetDeliveryClasses, "record", RECORD_SKELETON_PARTS, ["箱", "行", "関係の線"]],
  ] as const;

  it("3 図種の一覧は 8〜12 部品を持ち、4 図の主な部品へ当たる", () => {
    expect(new Set(図と一覧.map(([, type]) => type))).toEqual(
      new Set(["sequence", "infrastructure", "record"]),
    );
    for (const 一覧 of [SEQUENCE_SKELETON_PARTS, INFRASTRUCTURE_SKELETON_PARTS, RECORD_SKELETON_PARTS]) {
      expect(一覧.length).toBeGreaterThanOrEqual(8);
      expect(一覧.length).toBeLessThanOrEqual(12);
    }

    for (const [図, type, 一覧, 主な部品] of 図と一覧) {
      const svg = 描く(図);
      expect(svg.getAttribute("data-cdl-type"), 図.id).toBe(type);
      const 当たった = 一覧.filter((part) => catalogSkeletonPartTarget(svg, part)).map(({ label }) => label);
      expect(当たった, `${図.id} の主な部品`).toEqual(expect.arrayContaining([...主な部品]));
    }
  });

  it("3 図種の一覧は役を選び、小さな行頭の印を一覧に含めない", () => {
    for (const 一覧 of [SEQUENCE_SKELETON_PARTS, INFRASTRUCTURE_SKELETON_PARTS, RECORD_SKELETON_PARTS]) {
      expect(一覧[0]).toMatchObject({ label: "地", selector: ":scope" });
      expect(一覧.every(({ selector }) => selector === ":scope" || selector.includes("data-cdl-role"))).toBe(true);
    }
    expect(RECORD_SKELETON_PARTS.some(({ selector }) => selector.includes("node-row-glyph"))).toBe(false);
    expect(RECORD_SKELETON_PARTS.some(({ selector }) => selector.includes("node-row-well"))).toBe(false);
    expect(INFRASTRUCTURE_SKELETON_PARTS.some(({ selector }) => selector.includes("lane-label"))).toBe(false);
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

  it("台の外で求めた丸を、半径 12px が台に収まる位置へ直す", () => {
    expect(
      avoidCatalogSkeletonBadgeOverlaps(
        [
          { number: 1, left: -483, top: -565 },
          { number: 2, left: 423, top: 352 },
        ],
        台,
      ),
    ).toEqual([
      { number: 1, left: 0, top: 0 },
      { number: 2, left: 176, top: 176 },
    ]);
  });
});

describe("表へ出す色を 16 進数へ直す", () => {
  it("color(srgb) の各色を 0〜255 に写す", () => {
    expect(colorHex("color(srgb 1 0.713137 0.857255)")).toBe("#ffb6db");
  });

  it("color(srgb) の濃さを今の表示の形で残す", () => {
    expect(colorHex("color(srgb 0 0 0 / 0.5)")).toBe("#000000 (濃さ 0.5)");
  });
});
