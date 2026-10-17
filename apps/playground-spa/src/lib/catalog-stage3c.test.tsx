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

  it("11 図の図表札は従来の外枠を保ち、角の意匠切替を札全体へ重ねない", () => {
    for (const key of Object.keys(cards) as (keyof typeof cards)[]) {
      expect(node(chart(key)).cornerForm, key).toBeUndefined();
      const yaml = Charts[`sourceYaml__${key}` as keyof typeof Charts];
      const json = Charts[`sourceJson__${key}` as keyof typeof Charts];
      expect(yaml, `${key}: YAML`).not.toContain("cornerForm:");
      expect(json, `${key}: JSON`).not.toContain('"cornerForm"');
    }
    expect(node(Charts.deliveryOfficeTree).cornerForm).toBe("theme-variants");
    expect(node(Charts.redeliveryIdeasMind).cornerForm).toBe("theme-variants");
  });

  it("見出しと足を除いた描画面へ棒・折れ線・四象限・半円の実測余白を渡す", () => {
    expect(node(Charts.branchParcelsBar).chartBarSize?.plotPadding).toEqual({
      top: 75.891,
      right: 32,
      bottom: 64,
      left: 82,
    });
    expect(node(Charts.monthlyDeliveriesLine).chartLineSize?.plotPadding).toEqual({
      top: 45.891,
      right: 60,
      bottom: 46,
      left: 92,
    });
    expect(node(Charts.measureEffortQuadrant).quadrantSize?.plotOffset).toEqual({ x: 70, y: 19.891 });
    expect(node(Charts.onTimeShareGauge).chartGaugeSize?.plotTop).toBe(104);

    const jsonNodes = [
      JSON.parse(Charts.sourceJson__branchParcelsBar),
      JSON.parse(Charts.sourceJson__monthlyDeliveriesLine),
      JSON.parse(Charts.sourceJson__measureEffortQuadrant),
      JSON.parse(Charts.sourceJson__onTimeShareGauge),
    ];
    expect(jsonNodes.map((item) => item.chartBarSize?.plotPadding?.top)).toContain(75.891);
    expect(jsonNodes.map((item) => item.chartLineSize?.plotPadding?.top)).toContain(45.891);
    expect(jsonNodes.map((item) => item.quadrantSize?.plotOffset?.y)).toContain(19.891);
    expect(jsonNodes.map((item) => item.chartGaugeSize?.plotTop)).toContain(104);
  });

  it("ガントの工程名を正解頁の左揃えと x=36 に戻す", () => {
    expect(node(Charts.sortingShelfGantt).ganttSize).toMatchObject({
      taskLabelAlign: "start",
      taskLabelX: 36,
    });
    const jsonNode = JSON.parse(Charts.sourceJson__sortingShelfGantt);
    expect(jsonNode.ganttSize).toMatchObject({ taskLabelAlign: "start", taskLabelX: 36 });
  });

  it("cdl 0.133.0 の配置欄へ見本帳で測った値を YAML / JSON の両方から渡す", () => {
    const cases = [
      [Charts.branchParcelsBar, Charts.sourceJson__branchParcelsBar, { chartBarShape: "top-rounded", chartBarSize: { cornerRadius: 4 } }],
      [Charts.monthlyDeliveriesLine, Charts.sourceJson__monthlyDeliveriesLine, { chartLineSize: { tickGap: 12, pointPadding: { left: 46, right: 0 }, periodY: 355.988 } }],
      [Charts.parcelStatusPie, Charts.sourceJson__parcelStatusPie, { chartPieSize: { centerX: 227 } }],
      [Charts.sortingShelfGantt, Charts.sourceJson__sortingShelfGantt, { ganttSize: { taskColumnWidth: 330, timelinePaddingRight: 64 } }],
      [Charts.shipperFeelingJourney, Charts.sourceJson__shipperFeelingJourney, { figureInset: { top: 0, bottom: 0 }, journeySize: { plotPadding: { left: 120, right: 44 }, pointPadding: { left: 100, right: 70 } } }],
      [Charts.parcelSizeWaffle, Charts.sourceJson__parcelSizeWaffle, { chartWaffleSize: { gridLeft: 42.5, cellPitch: 30 } }],
      [Charts.deliveryResultStacked, Charts.sourceJson__deliveryResultStacked, { chartStackedLayout: { legendOffsetY: -20.609375 } }],
      [Charts.onTimeRateSlope, Charts.sourceJson__onTimeRateSlope, { chartSlopeSize: { plotPadding: { top: 54.036, bottom: 12.552 }, pointPadding: { top: 46.707, bottom: 42.862 } } }],
    ] as const;
    for (const [diagram, jsonSource, expected] of cases) {
      expect(node(diagram)).toMatchObject(expected);
      expect(JSON.parse(jsonSource)).toMatchObject(expected);
    }
  });

  it("浮彫の凹み面は図表を動かさない飾りとして渡す", () => {
    const expected = [
      [Charts.monthlyDeliveriesLine, {}],
      [Charts.parcelStatusPie, { right: 328, left: 18, radius: 18 }],
      [Charts.parcelSizeWaffle, { right: 203, left: 18, radius: 18 }],
      [Charts.deliveryResultStacked, {}],
    ] as const;
    for (const [diagram, inset] of expected) expect(node(diagram).figureInset).toEqual(inset);

    expect(JSON.parse(Charts.sourceJson__monthlyDeliveriesLine).figureInset).toEqual({});
    expect(JSON.parse(Charts.sourceJson__parcelStatusPie).figureInset).toEqual(expected[1][1]);
    expect(JSON.parse(Charts.sourceJson__parcelSizeWaffle).figureInset).toEqual(expected[2][1]);
    expect(JSON.parse(Charts.sourceJson__deliveryResultStacked).figureInset).toEqual({});
  });

  it("凹み面を持つ 9 図は意匠別の配置値を運ばない", () => {
    const inside = [
      "branchParcelsBar",
      "monthlyDeliveriesLine",
      "orderToDeliveryFunnel",
      "sortingShelfGantt",
      "shipperFeelingJourney",
      "measureEffortQuadrant",
      "onTimeShareGauge",
      "deliveryResultStacked",
      "onTimeRateSlope",
    ] as const;
    for (const key of inside) {
      expect(Charts[key], key).not.toHaveProperty("figureInsetByTheme");
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

  it("電飾の線は自色の二段の光と芯、図表札は水色の外光と内光を別に持つ", () => {
    const defs = renderToStaticMarkup(<SvgDefs />);
    const tube = /<filter id="dragon-neon-tube"[\s\S]*?<\/filter>/u.exec(defs)?.[0];
    const frame = /<filter id="dragon-neon-figure-frame"[\s\S]*?<\/filter>/u.exec(defs)?.[0];
    expect(tube).toBeDefined();
    expect(frame).toBeDefined();
    expect(tube).toContain('x="-10%" y="-10%" width="120%" height="120%"');
    expect(tube).toContain('stdDeviation="1.5" result="tube-halo"');
    expect(tube).toContain('stdDeviation="5" result="tube-haze"');
    expect(tube).not.toContain("feColorMatrix");
    expect(tube).not.toContain("feComponentTransfer");
    expect(tube).toContain('<feMergeNode in="tube-haze"></feMergeNode>');
    expect(tube).toContain('<feMergeNode in="tube-halo"></feMergeNode>');
    expect(tube).toContain('<feMergeNode in="SourceGraphic"></feMergeNode>');

    expect(frame).toContain('operator="dilate" radius="1" result="frame-near-spread"');
    expect(frame).toContain('stdDeviation="1" result="frame-near-blur"');
    expect(frame).toContain('operator="dilate" radius="2" result="frame-haze-spread"');
    expect(frame).toContain('stdDeviation="5" result="frame-haze-blur"');
    expect(frame).toContain('operator="erode" radius="1" result="frame-inner-spread"');
    expect(frame).toContain('stdDeviation="6" result="frame-inner-blur"');
    expect(frame).toContain('flood-color="#00e5ff" flood-opacity=".32" result="frame-inner-color"');
    expect(frame?.indexOf('in="SourceGraphic"')).toBeLessThan(frame?.indexOf('in="frame-inner"') ?? -1);
  });

  it("電飾の題は管色の SourceAlpha 光、段と時間軸の枠は広がりを含む外光と内光を持つ", () => {
    const defs = renderToStaticMarkup(<SvgDefs />);
    for (const [name, color] of [
      ["cyan", "#00e5ff"],
      ["pink", "#ff2e97"],
      ["violet", "#b26bff"],
    ] as const) {
      const title = new RegExp(`<filter id="dragon-neon-title-${name}"[\\s\\S]*?<\\/filter>`, "u")
        .exec(defs)?.[0];
      expect(title).toContain(`in="SourceAlpha" stdDeviation="2.5" result="title-${name}-near-blur"`);
      expect(title).toContain(`flood-color="${color}" flood-opacity="1"`);
      expect(title).toContain(`in="SourceAlpha" stdDeviation="6" result="title-${name}-haze-blur"`);
      expect(title).toContain(`flood-color="${color}" flood-opacity=".6"`);
      expect(title?.indexOf(`in="title-${name}-haze"`)).toBeLessThan(
        title?.indexOf('in="SourceGraphic"') ?? -1,
      );
    }

    const pink = /<filter id="dragon-neon-pink-frame"[\s\S]*?<\/filter>/u.exec(defs)?.[0];
    expect(pink).toContain('operator="dilate" radius="1" result="pink-frame-near-spread"');
    expect(pink).toContain('stdDeviation="1" result="pink-frame-near-blur"');
    expect(pink).toContain('operator="dilate" radius="2" result="pink-frame-haze-spread"');
    expect(pink).toContain('stdDeviation="5" result="pink-frame-haze-blur"');
    expect(pink).toContain('flood-color="#ff2e97" flood-opacity=".55"');
    expect(pink).toContain('operator="dilate" radius="4" result="pink-frame-far-spread"');
    expect(pink).toContain('stdDeviation="12" result="pink-frame-far-blur"');
    expect(pink).toContain('flood-color="#ff2e97" flood-opacity=".22"');
    expect(pink).toContain('operator="erode" radius="1" result="pink-frame-inner-near-spread"');
    expect(pink).toContain('stdDeviation="5" result="pink-frame-inner-haze-blur"');
    expect(pink).toContain('flood-color="#ff2e97" flood-opacity=".2"');

    const violet = /<filter id="dragon-neon-violet-frame"[\s\S]*?<\/filter>/u.exec(defs)?.[0];
    expect(violet).toContain('operator="dilate" radius="1" result="violet-frame-near-spread"');
    expect(violet).toContain('stdDeviation="1" result="violet-frame-near-blur"');
    expect(violet).toContain('operator="dilate" radius="2" result="violet-frame-haze-spread"');
    expect(violet).toContain('stdDeviation="5" result="violet-frame-haze-blur"');
    expect(violet).toContain('flood-color="#b26bff" flood-opacity=".6"');
    expect(violet).toContain('operator="erode" radius="1" result="violet-frame-inner-spread"');
    expect(violet).toContain('stdDeviation="6" result="violet-frame-inner-blur"');
    expect(violet).toContain('flood-color="#b26bff" flood-opacity=".32"');
  });

  it("浮彫の図表札は 7/15 の外影、凹みは 5/11 の内影を使う", () => {
    const defs = renderToStaticMarkup(<SvgDefs />);
    const frame = /<filter id="dragon-relief-figure-frame"[\s\S]*?<\/filter>/u.exec(defs)?.[0];
    const inset = /<filter id="dragon-relief-figure-inset"[\s\S]*?<\/filter>/u.exec(defs)?.[0];
    expect(frame).toContain('stdDeviation="7.5" result="figure-frame-dark-blur"');
    expect(frame).toContain('dx="7" dy="7"');
    expect(frame).toContain('dx="-7" dy="-7"');
    expect(frame).toContain('flood-opacity=".92" result="figure-frame-light-color"');
    expect(inset).toContain('stdDeviation="5.5" result="figure-inset-dark-blur"');
    expect(inset).toContain('dx="5" dy="5"');
    expect(inset).toContain('dx="-5" dy="-5"');
    expect(inset).toContain('flood-opacity=".42" result="figure-inset-dark-color"');
    expect(inset).toContain('flood-opacity=".88" result="figure-inset-light-color"');
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
        contentOffset: { x: 20, y: 24.5 },
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
    const 説明つき放射 = node(Charts.pattern__redeliveryIdeasMind__説明つき);
    const 共通の放射寸法 = { ...node(Charts.redeliveryIdeasMind).mindSize };
    delete 共通の放射寸法.contentOffset;
    expect(説明つき放射).toMatchObject({
      w: 1680,
      h: 470,
      mindSize: 共通の放射寸法,
    });
    expect(Object.hasOwn(説明つき放射.mindSize ?? {}, "contentOffset")).toBe(false);

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
    expect(一覧の級.円の名前).toBe(22);
    expect(一覧の級.円の値).toBe(19);
    expect(一覧の級.升目の名前).toBe(22);
    expect(一覧の級.升目の値).toBe(19);
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
