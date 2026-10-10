import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { renderToStaticMarkup } from "react-dom/server";
import { CdlDiagramView, computeStateValues, layout, visualValidate, type CdlDiagram } from "@cardenelabs/cdl";
import { describe, expect, it } from "vitest";
import { SvgDefs } from "../components/SvgDefs";
import * as Charts from "@/topics/catalog/charts.cdl";

const css = readFileSync(fileURLToPath(new URL("../styles/cdl-theme.css", import.meta.url)), "utf8")
  .replace(/\/\*[\s\S]*?\*\//gu, "");

const 放射の枠 = {
  blueprint: { radius: "12px", rootWidth: "2.25px", boxWidth: "1px", rootStroke: "#143a52", boxStroke: "#143a52" },
  letterpress: { radius: "12px", rootWidth: "3px", boxWidth: "1.5px", rootStroke: "#1a1510", boxStroke: "#1a1510" },
  catalog: { radius: "12px", rootWidth: "0", boxWidth: "0", rootStroke: "transparent", boxStroke: "transparent" },
  terminal: { radius: "6px", rootWidth: "1px", boxWidth: "1px", rootStroke: "#4ade80", boxStroke: "rgba(74, 222, 128, 0.3)" },
  sketch: { radius: "19px", rootWidth: "3px", boxWidth: "2px", rootStroke: "#2b2620", boxStroke: "#2b2620" },
  neon: { radius: "16px", rootWidth: "2px", boxWidth: "2px", rootStroke: "#ff2e97", boxStroke: "#ff2e97" },
  relief: { radius: "22px", rootWidth: "0", boxWidth: "0", rootStroke: "transparent", boxStroke: "transparent" },
} as const;

function 意匠の宣言(name: keyof typeof 放射の枠): Map<string, string> {
  const selector = `svg[data-cdl-stage][data-cdl-palette="${name}"]`;
  const bodies = [...css.matchAll(/([^{}]*)\{([^{}]*)\}/gu)]
    .filter((match) => (match[1] ?? "").split(",").map((part) => part.trim()).includes(selector))
    .map((match) => match[2] ?? "");
  const declarations = new Map<string, string>();
  for (const body of bodies) {
    for (const declaration of body.matchAll(/--([a-z0-9-]+)\s*:\s*([^;]+);/giu)) {
      if (declaration[1] && declaration[2]) declarations.set(declaration[1], declaration[2].trim().toLowerCase());
    }
  }
  return declarations;
}

const cards = {
  branchParcelsBar: { label: "棒", note: "今月 / 単位 件" },
  monthlyDeliveriesLine: { label: "折れ線", note: "計画 と 実績" },
  parcelStatusPie: { label: "内訳", note: "合計 1,284 件" },
  sortingShelfGantt: { label: "ガント", note: "色の付いた棒が遅れると本番も遅れる" },
  shipperFeelingJourney: { label: "ジャーニー", note: "最高 から 怒り の 5 段" },
  orderToDeliveryFunnel: { label: "漏斗", note: "先月 / 件" },
  measureEffortQuadrant: { label: "四象限", note: "左上から手を付ける" },
  onTimeRateSlope: { label: "傾き", note: "先月 → 今月" },
  onTimeShareGauge: { label: "半円", note: "目標 80%" },
  parcelSizeWaffle: { label: "升目", note: "1 マス = 1%" },
  deliveryResultStacked: { label: "内訳の帯", note: "月ごと / %" },
} as const;

const sizes = {
  branchParcelsBar: { w: 896, h: 1008 },
  monthlyDeliveriesLine: { w: 768, h: 464 },
  parcelStatusPie: { w: 768, h: 496 },
  orderToDeliveryFunnel: { w: 544, h: 496 },
  sortingShelfGantt: { w: 1712, h: 592 },
  shipperFeelingJourney: { w: 1712, h: 384 },
  redeliveryIdeasMind: { w: 1680, h: 470 },
  measureEffortQuadrant: { w: 544, h: 496 },
  deliveryOfficeTree: { w: 1680, h: 392 },
  onTimeShareGauge: { w: 544, h: 496 },
  parcelSizeWaffle: { w: 544, h: 496 },
  deliveryResultStacked: { w: 544, h: 496 },
  onTimeRateSlope: { w: 544, h: 496 },
} as const;

const chart = (key: keyof typeof cards): CdlDiagram => Charts[key];
const node = (diagram: CdlDiagram) => diagram.nodes[0]!;
const render = (diagram: CdlDiagram, 最後 = false) => {
  if (!最後) return renderToStaticMarkup(<CdlDiagramView diagram={diagram} hideHeader />);
  const 配置済み = layout(diagram);
  const 最後の値 = computeStateValues(配置済み, Math.max(0, 配置済み.phases.length - 1), 1);
  const 静止図: CdlDiagram = {
    ...diagram,
    states: (diagram.states ?? []).map((state) => ({
      ...state,
      initial: 最後の値[state.id] ?? state.initial,
    })),
    phases: [{ id: "最後", duration: 1, title: "最後", body: "", activate: [], tweens: [], sets: [] }],
  };
  return renderToStaticMarkup(<CdlDiagramView diagram={layout(静止図)} hideHeader />);
};

const 数の属性 = (tag: string, name: string): number => {
  const value = new RegExp(`${name}="([^"]+)"`, "u").exec(tag)?.[1];
  if (value === undefined) throw new Error(`${name} 属性が無い: ${tag}`);
  return Number(value);
};

const 字の属性 = (tag: string, name: string): string => {
  const value = new RegExp(`${name}="([^"]+)"`, "u").exec(tag)?.[1];
  if (value === undefined) throw new Error(`${name} 属性が無い: ${tag}`);
  return value;
};

describe("宅配の見本へ 3 段目 c の値を当てる (#2854)", () => {
  it("図表・数・工程の 11 図が見出し帯と見本どおりの足を持つ", () => {
    for (const [key, expected] of Object.entries(cards) as [keyof typeof cards, (typeof cards)[keyof typeof cards]][]) {
      const diagram = chart(key);
      expect(node(diagram).figureCard, key).toEqual(expected);
      const markup = render(diagram);
      expect(markup, `${key}: figure-footer`).toContain('data-cdl-role="figure-footer"');
      expect(markup, `${key}: label`).toContain(`>${expected.label}<`);
      expect(markup, `${key}: note`).toContain(`>${expected.note}<`);
    }
  });

  it("見本帳の 13 図の札を指定した大きさで渡す", () => {
    for (const [key, expected] of Object.entries(sizes) as [keyof typeof sizes, (typeof sizes)[keyof typeof sizes]][]) {
      expect(node(Charts[key]), key).toMatchObject(expected);
    }
  });

  it("階層図とマインドマップは見本どおり外題を描かず、板に収まる大きさを保つ", () => {
    const targets = [
      {
        diagram: Charts.deliveryOfficeTree,
        sourceTitles: ['title: "営業所の階層"', '"title": "営業所の階層"'],
        name: "営業所の階層",
        id: "営業所の階層-chart",
        w: 1680,
        h: 392,
      },
      {
        diagram: Charts.redeliveryIdeasMind,
        sourceTitles: ['title: "再配達を減らす"', '"title": "再配達を減らす"'],
        name: "再配達を減らす",
        id: "再配達を減らす-chart",
        w: 1680,
        h: 470,
      },
    ] as const;

    for (const target of targets) {
      expect(node(target.diagram), target.name).toMatchObject({
        title: target.name,
        w: target.w,
        h: target.h,
      });
      for (const sourceTitle of target.sourceTitles) {
        expect(
          [Charts.sourceYaml__deliveryOfficeTree, Charts.sourceJson__deliveryOfficeTree,
            Charts.sourceYaml__redeliveryIdeasMind, Charts.sourceJson__redeliveryIdeasMind]
            .some((source) => source.includes(sourceTitle)),
          `${target.name}: 記法の題`,
        ).toBe(true);
      }
      const markup = render(target.diagram);
      expect(markup, `${target.name}: 対象を絞る id`).toContain(`data-cdl-node="${target.id}"`);
      expect(markup, `${target.name}: 図の外題の描画対象`).toContain('data-cdl-role="figure-title"');
      const 外題を隠す = [...css.matchAll(/([^{}]*)\{([^{}]*)\}/gu)].some(
        ([, selector = "", body = ""]) =>
          selector.includes(`data-cdl-node="${target.id}"`) &&
          selector.includes('data-cdl-role="figure-title"') &&
          /display\s*:\s*none\s*!important/u.test(body),
      );
      expect(外題を隠す, `${target.name}: 見本には無い外題を画面で隠す`).toBe(true);
      const overflow = visualValidate(target.diagram).violations.filter(
        (violation) => violation.axis === "node-inside-viewbox",
      );
      expect(overflow, `${target.name}: 板からはみ出す節`).toEqual([]);
    }
  });

  it("端末の階層図とマインドマップの札は見本の暗い階調を参照できる", () => {
    const defs = renderToStaticMarkup(<SvgDefs />);
    expect(defs).toContain('id="dragon-terminal-card-gradient"');
    expect(defs).toContain('stop-color="rgb(10, 21, 14)"');
    expect(defs).toContain('stop-color="rgb(7, 15, 10)"');
    expect(defs).toContain('id="dragon-catalog-tree-shadow"');
    expect(defs).toContain('id="dragon-relief-raised"');
    expect(defs).not.toContain('id="dragon-relief-raised-line-safe"');
  });

  it("13 図の YAML・JSON・変種の全てに同じ札の大きさを書く", () => {
    let count = 0;
    for (const [sourceName, source] of Object.entries(Charts)) {
      if (!sourceName.startsWith("sourceYaml__") && !sourceName.startsWith("sourceJson__")) continue;
      if (typeof source !== "string") continue;
      const sizeEntry = (Object.entries(sizes) as [keyof typeof sizes, (typeof sizes)[keyof typeof sizes]][])
        .find(([key]) => sourceName.includes(key));
      if (sizeEntry === undefined) continue;
      const [, expected] = sizeEntry;
      expect(source, sourceName).toMatch(
        new RegExp(`figureSize["']?\\s*:\\s*\\{\\s*["']?width["']?\\s*:\\s*${expected.w}\\s*,\\s*["']?height["']?\\s*:\\s*${expected.h}`, "u"),
      );
      count += 1;
    }
    expect(count).toBe(52);
  });

  it("木は同じ枠・段ごとの枝色・6 本の三角矢じりを使う", () => {
    const diagram = Charts.deliveryOfficeTree;
    expect(node(diagram)).toMatchObject({
      treeNodeForm: "frame",
      treeEdgeTone: "depth",
      treeEdgeHead: "triangle",
      treeSize: {
        nodeWidths: [260, 240, 220],
        nodeHeight: 91.891,
        titleFontSize: 29,
        subtitleFontSize: 19,
        siblingGap: 180,
        levelGap: 58.109,
      },
      w: 1680,
      h: 392,
    });
    const markup = render(diagram, true);
    const edges = (markup.match(/<[^>]+>/gu) ?? [])
      .filter((tag) => tag.includes('data-cdl-role="tree-edge"'));
    expect(edges.filter((tag) => tag.includes("marker-end="))).toHaveLength(6);
    const strokes = edges
      .map((tag) => /stroke="([^"]+)"/u.exec(tag)?.[1])
      .filter((stroke): stroke is string => stroke !== undefined);
    expect(new Set(strokes).size).toBe(2);
  });

  it("放射を outline で描く", () => {
    const diagram = Charts.redeliveryIdeasMind;
    expect(node(diagram).mindForm).toBe("outline");
    expect(node(diagram)).toMatchObject({
      mindSize: {
        root: { width: 330, height: 61.891, fontSize: 29 },
        branch: { width: 220, height: 62.891, fontSize: 29 },
        leaf: { fontSize: 23 },
        rootBranchGap: 155,
        branchLeafGap: 70,
        branchRowGap: 290,
        branchRowOffset: 10,
        leafRowGap: 92,
        leafRowOffset: 6,
      },
      w: 1680,
      h: 470,
    });
    expect(render(diagram)).toContain('data-cdl-mind-form="outline"');
  });

  it("切替形も同じ見本寸法に収まり、説明つき放射の補足を落とさない", () => {
    expect(node(Charts.pattern__deliveryOfficeTree__見出しだけ)).toMatchObject({
      w: 1680,
      h: 392,
      treeSize: node(Charts.deliveryOfficeTree).treeSize,
    });
    expect(node(Charts.pattern__redeliveryIdeasMind__説明つき)).toMatchObject({
      w: 1680,
      h: 470,
      mindSize: node(Charts.redeliveryIdeasMind).mindSize,
    });

    const markup = render(Charts.pattern__redeliveryIdeasMind__説明つき, true);
    expect(markup).toContain("受け取りやすくする");
    expect(markup).toContain("宅配箱");
    for (const diagram of [
      Charts.pattern__deliveryOfficeTree__見出しだけ,
      Charts.pattern__redeliveryIdeasMind__説明つき,
    ]) {
      expect(
        visualValidate(diagram).violations.filter((violation) => violation.axis === "node-inside-viewbox"),
      ).toEqual([]);
    }
  });

  it("円と升目の一覧の級は cdl が計算した SVG 値を意匠で上書きしない", () => {
    const labels = /:is\(\[data-cdl-role="chart-pie-table-label"\], \[data-cdl-role="chart-waffle-item-label"\]\)\s*\{([^}]*)\}/u.exec(css)?.[1];
    const values = /:is\(\[data-cdl-role="chart-pie-table-value"\], \[data-cdl-role="chart-waffle-item-share"\]\)\s*\{([^}]*)\}/u.exec(css)?.[1];
    expect(labels, "一覧名の意匠規則").toBeDefined();
    expect(values, "一覧値の意匠規則").toBeDefined();
    expect(labels).not.toMatch(/font-size\s*:/u);
    expect(values).not.toMatch(/font-size\s*:/u);
    const pie = render(Charts.parcelStatusPie, true);
    const waffle = render(Charts.parcelSizeWaffle, true);
    const 一覧の級 = {
      円の名前: 数の属性(/<text[^>]*data-cdl-role="chart-pie-table-label"[^>]*>/u.exec(pie)?.[0] ?? "", "font-size"),
      円の値: 数の属性(/<text[^>]*data-cdl-role="chart-pie-table-value"[^>]*>/u.exec(pie)?.[0] ?? "", "font-size"),
      升目の名前: 数の属性(/<text[^>]*data-cdl-role="chart-waffle-item-label"[^>]*>/u.exec(waffle)?.[0] ?? "", "font-size"),
      升目の値: 数の属性(/<text[^>]*data-cdl-role="chart-waffle-item-share"[^>]*>/u.exec(waffle)?.[0] ?? "", "font-size"),
    };
    expect(一覧の級.円の名前).toBe(15);
    expect(一覧の級.円の値).toBeCloseTo(12.9545454545, 10);
    expect(一覧の級.升目の名前).toBeCloseTo(22.9541455336, 10);
    expect(一覧の級.升目の値).toBeCloseTo(19.824034779, 10);
  });

  it("放射の札を見本の横長の比にし、中心・枝・葉を全て残す", () => {
    const diagram = Charts.redeliveryIdeasMind;
    const markup = render(diagram, true);
    expect(node(diagram)).toMatchObject({ w: 1680, h: 470 });
    expect(markup.match(/data-cdl-role="mind-root"/gu)).toHaveLength(1);
    expect(markup.match(/data-cdl-role="mind-box"/gu)).toHaveLength(4);
    expect(markup.match(/data-cdl-role="mind-leaf-title"/gu)).toHaveLength(8);
  });

  it.each(Object.entries(放射の枠))("%s の放射の角・太さ・色を見本の値にする", (theme, expected) => {
    const declarations = 意匠の宣言(theme as keyof typeof 放射の枠);
    expect(declarations.get("theme-mind-radius"), `${theme}: 角`).toBe(expected.radius);
    expect(declarations.get("theme-mind-root-stroke-width"), `${theme}: 中心の太さ`).toBe(expected.rootWidth);
    expect(declarations.get("theme-mind-box-stroke-width"), `${theme}: 枝の太さ`).toBe(expected.boxWidth);
    expect(declarations.get("theme-mind-root-stroke"), `${theme}: 中心の色`).toBe(expected.rootStroke);
    expect(declarations.get("theme-mind-box-stroke"), `${theme}: 枝の色`).toBe(expected.boxStroke);
  });

  it("ジャーニーは 5 段名・直線・罫と、谷の点の下に全文の注記を持つ", () => {
    const diagram = Charts.shipperFeelingJourney;
    expect(node(diagram)).toMatchObject({
      journeyForm: "rules",
      journeyLineForm: "straight",
      journeyLabels: {
        delighted: "最高",
        happy: "満足",
        neutral: "普通",
        frustrated: "不満",
        angry: "怒り",
      },
      w: 1712,
      h: 384,
    });
    const opportunity = node(diagram).journeyData?.find((item) => item.opportunity !== undefined);
    expect(opportunity).toMatchObject({
      opportunity: "不在票に気づかなかった",
      opportunityPosition: "below-point",
    });
    const markup = render(diagram, true);
    expect(markup).toContain("不在票に気づかなかった");
    expect(markup).toContain('data-cdl-role="journey-opportunity"');
  });

  it("谷の注記は点と同じ横位置で中心から 34 下に置く", () => {
    const diagram = Charts.shipperFeelingJourney;
    const opportunityIndex = node(diagram).journeyData?.findIndex(
      (item) => item.opportunity === "不在票に気づかなかった",
    ) ?? -1;
    expect(opportunityIndex).toBeGreaterThanOrEqual(0);

    const markup = render(diagram, true);
    const pointTags = markup.match(/<circle[^>]*r="9"[^>]*>/gu) ?? [];
    const pointTag = pointTags[opportunityIndex];
    if (pointTag === undefined) throw new Error("谷の点が無い");
    const annotationTag = /(<text[^>]*>)不在票に気づかなかった<\/text>/u.exec(markup)?.[1];
    if (annotationTag === undefined) throw new Error("谷の注記が無い");

    expect(数の属性(annotationTag, "x"), "注記の中心 x").toBe(数の属性(pointTag, "cx"));
    expect(数の属性(annotationTag, "y"), "注記の中心からの y 差")
      .toBe(数の属性(pointTag, "cy") + 34);
  });

  it("ジャーニーの字・段間・主線・点を見本の寸法と色で描く", () => {
    const markup = render(Charts.shipperFeelingJourney, true);
    const levelTags = (markup.match(/<text[^>]*data-cdl-role="journey-level-name"[^>]*>/gu) ?? []);
    const ruleTags = (markup.match(/<line[^>]*data-cdl-role="journey-level-rule"[^>]*>/gu) ?? []);
    const lineTag = /<path[^>]*data-cdl-role="journey-line"[^>]*>/u.exec(markup)?.[0];
    const pointTags = markup.match(/<circle[^>]*r="9"[^>]*>/gu) ?? [];
    const opportunityTag = /(<text[^>]*>)不在票に気づかなかった<\/text>/u.exec(markup)?.[1];
    const actorTag = /(<text[^>]*>)申し込む<\/text>/u.exec(markup)?.[1];
    if (lineTag === undefined || opportunityTag === undefined || actorTag === undefined) {
      throw new Error("ジャーニーの寸法を測る要素が無い");
    }

    expect(levelTags).toHaveLength(5);
    expect(levelTags.map((tag) => 数の属性(tag, "font-size"))).toEqual([19, 19, 19, 19, 19]);
    const ruleY = ruleTags.map((tag) => 数の属性(tag, "y1"));
    for (const [index, y] of ruleY.slice(1).entries()) {
      expect(y - ruleY[index]!).toBeCloseTo(40, 10);
    }
    expect(数の属性(actorTag, "font-size"), "横の名前の級").toBe(20);
    expect(数の属性(opportunityTag, "font-size"), "注記の級").toBe(18);
    expect(数の属性(lineTag, "stroke-width"), "主線の太さ").toBe(5);
    expect(pointTags).toHaveLength(6);
    expect(pointTags.map((tag) => 数の属性(tag, "stroke-width"))).toEqual([3.5, 3.5, 3.5, 3.5, 3.5, 3.5]);
    expect(pointTags.map((tag) => 字の属性(tag, "stroke")))
      .toEqual(Array.from({ length: 6 }, () => 字の属性(lineTag, "stroke")));
    expect(markup).not.toContain('data-cdl-role="journey-line-glow"');
  });

  it("見本帳だけが見本実測の横長の札を指定する", () => {
    const journey = node(Charts.shipperFeelingJourney);
    const tree = node(Charts.deliveryOfficeTree);
    const mind = node(Charts.redeliveryIdeasMind);
    expect([journey.w, journey.h]
      .every((value) => typeof value === "number" && value % 16 === 0)).toBe(true);
    expect(tree).toMatchObject({ w: 1680, h: 392 });
    expect(mind).toMatchObject({ w: 1680, h: 470 });
    expect(journey.w).toBeGreaterThan(journey.h ?? 0);
    expect(mind.w).toBeGreaterThan((mind.h ?? 0) * 3);
  });
});
