/** @vitest-environment node */

import { describe, it, expect } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { JSDOM } from "jsdom";
import { CdlDiagramView, type CdlDiagram } from "@cardenelabs/cdl";
import { jsonToDiagram, parseTextDslV05, textDslToDiagram } from "@cardenelabs/dragon";
import * as presetCatalog from "@/topics/catalog/presets.cdl";
import { ITEM_NAME_JA, ITEM_NAME_EN } from "./i18n";
import { ITEM_SUBTITLE_EN } from "./catalog-item-en";
import { PHASE_TITLE_EN } from "./catalog-phase-en";
import { 図の配色を変える } from "./palette-switch";

const 宅配のひな形 = [
  {
    key: "presetDeliveryFlow",
    id: "deliveryFlow",
    diagramId: "delivery-flow-demo",
    title: "荷物を届ける流れ",
    ja: "荷物を届けるフローチャート",
    en: "Parcel delivery flowchart",
  },
  {
    key: "presetDeliveryStages",
    id: "deliveryStages",
    diagramId: "delivery-stages-demo",
    title: "荷物を届ける段階",
    ja: "荷物を届ける段の箱",
    en: "Parcel delivery stages",
  },
  {
    key: "presetDeliveryMetro",
    id: "deliveryMetro",
    diagramId: "delivery-metro-demo",
    title: "荷物を届ける路線",
    ja: "荷物を届ける路線図",
    en: "Parcel delivery metro map",
  },
  {
    key: "presetDeliveryTimeline",
    id: "deliveryTimeline",
    diagramId: "delivery-timeline-demo",
    title: "荷物を届ける順番",
    ja: "荷物を届ける時間軸",
    en: "Parcel delivery timeline",
  },
] as const;

type 宅配の鍵 = (typeof 宅配のひな形)[number]["key"];

function exportを引く(name: string): unknown {
  return presetCatalog[name as keyof typeof presetCatalog];
}

function 記法を引く(key: 宅配の鍵): { yaml: string; json: string; diagram: CdlDiagram } {
  const yaml = exportを引く(`sourceYaml__${key}`);
  const json = exportを引く(`sourceJson__${key}`);
  const diagram = exportを引く(key);
  expect(yaml, `${key} の YAML が無い`).toEqual(expect.any(String));
  expect(json, `${key} の JSON が無い`).toEqual(expect.any(String));
  expect(diagram, `${key} の図が無い`).toBeDefined();
  return { yaml: yaml as string, json: json as string, diagram: diagram as CdlDiagram };
}

describe("宅配のひな形 4 件 (#2835)", () => {
  it("cdl#1109/#1110/#1111: 流れ図へ縦列の補足・札と凡例の字・印の間を渡す", () => {
    const { diagram } = 記法を引く("presetDeliveryFlow");
    expect(diagram.lanes.map((lane) => [lane.label, lane.flowchart?.subtitle])).toEqual([
      ["荷主", "頼む人"],
      ["営業所", "受け付ける"],
      ["配送便", "運ぶ"],
    ]);
    expect(
      diagram.nodes
        .filter((node) => node.kind === "function")
        .map((node) => node.titleFontSize),
    ).toEqual(Array(7).fill(32.93));
    expect(diagram.legendFontSize).toBe(26.6);
    expect(diagram.nodes.find((node) => node.kind === "mark-start")?.markGap).toBe(73.47);
    expect(diagram.nodes.find((node) => node.kind === "mark-end")?.markGap).toBe(87.4);
  });

  it("段の箱の全配色へ共通の見出し寸法を渡す", () => {
    const { diagram } = 記法を引く("presetDeliveryStages");
    expect(diagram.edgeEndGap).toBe(2);
    const header = { leftPad: 26, topPad: 20, numberSize: 16, gap: 10, nameSize: 29, bottomPad: 12 };
    const palettes = [
      "kinari", "celadon", "blueprint", "letterpress", "catalog",
      "terminal", "sketch", "neon", "relief", "site-colours",
    ] as const;
    for (const palette of palettes) {
      const themed = 図の配色を変える(diagram, palette);
      expect(themed.lanes.map((lane) => lane.stage?.header), palette).toEqual(
        Array(themed.lanes.length).fill(header),
      );
    }
  });

  it("cdl 0.137.0: 段と時間軸へ線端の隙間、時間軸へ凡例のずらしを渡す", () => {
    const stages = 記法を引く("presetDeliveryStages").diagram;
    const timeline = 記法を引く("presetDeliveryTimeline").diagram;
    expect(stages.edgeEndGap).toBe(2);
    expect(timeline.edgeEndGap).toBe(2);
    expect(timeline.legendOffset).toEqual({ x: -252, y: 0 });
  });

  it.each(宅配のひな形)("$key が id と YAML・JSON の対を持つ", (item) => {
    const { yaml, json, diagram } = 記法を引く(item.key);
    expect(diagram).toEqual({ ...textDslToDiagram(yaml), id: item.diagramId });
    expect({ ...jsonToDiagram(JSON.parse(json)), id: item.diagramId }).toEqual(diagram);
    expect(diagram.topic).toBe(item.title);
  });

  it.each(宅配のひな形)("$key が宅配の担当 3 つ・印を除く段 8 つ・分かれ道 1 つを持つ", (item) => {
    const { yaml } = 記法を引く(item.key);
    const parsed = parseTextDslV05(yaml);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;

    expect([
      ...new Set(
        parsed.doc.actors.map((actor) =>
          actor.lane === undefined
            ? undefined
            : (parsed.doc.lanes?.[actor.lane]?.label ?? actor.lane),
        ),
      ),
    ]).toEqual(["荷主", "営業所", "配送便"]);
    expect(
      parsed.doc.actors.filter((actor) => actor.kind !== "mark-start" && actor.kind !== "mark-end"),
    ).toHaveLength(8);
    expect(parsed.doc.actors.filter((actor) => actor.kind === "decision")).toHaveLength(1);
  });

  it.each(宅配のひな形)("$key の日本語名・英語名・説明・段の題を英語表から引ける", (item) => {
    expect(ITEM_NAME_JA[item.key]).toBe(item.ja);
    expect(ITEM_NAME_EN[item.key]).toBe(item.en);
    expect(ITEM_SUBTITLE_EN[item.key]).toEqual(expect.any(String));

    const { diagram } = 記法を引く(item.key);
    for (const phase of diagram.phases) {
      expect(PHASE_TITLE_EN[phase.title], `${item.key} の段「${phase.title}」の英訳が無い`).toEqual(
        expect.any(String),
      );
    }
  });
});

type 要素の照合 = {
  key: 宅配の鍵;
  element: string;
  expected: number;
  selector: string;
  drawable: boolean;
  reason?: string;
};

/**
 * 見本の要素を最終段の DOM と照合する表。
 *
 * 描けない行は専用の selector が 0 件である間だけ残せる。描画側が対応して 1 件でも現れたら
 * 検査が落ち、この宣言を外して通常の件数照合へ移すよう知らせる。
 */
const 宅配の要素: readonly 要素の照合[] = [
  {
    key: "presetDeliveryFlow",
    element: "縦列の見出し",
    expected: 3,
    selector: '[data-cdl-role="flow-lane-heading"]',
    drawable: false,
    reason: "流れ図の縦列の見出しは描く側 (cdl) で直す",
  },
  {
    key: "presetDeliveryFlow",
    element: "縦列の区切り",
    expected: 2,
    selector: '[data-cdl-role="flow-lane-divider"]',
    drawable: false,
    reason: "流れ図の縦列の区切りは描く側 (cdl) で直す",
  },
  {
    key: "presetDeliveryFlow",
    element: "段階の列",
    expected: 0,
    selector: '[data-cdl-role="stage-column"]',
    drawable: true,
  },
  {
    key: "presetDeliveryFlow",
    element: "段",
    expected: 7,
    selector: '[data-cdl-kind="function"]',
    drawable: true,
  },
  {
    key: "presetDeliveryFlow",
    element: "札の右の小さな字",
    expected: 0,
    selector: '[data-cdl-role="stage-note"]',
    drawable: true,
  },
  {
    key: "presetDeliveryFlow",
    element: "分かれ道",
    expected: 1,
    selector: '[data-cdl-kind="decision"]',
    drawable: true,
  },
  {
    key: "presetDeliveryFlow",
    element: "始まりの印",
    expected: 1,
    selector: '[data-cdl-kind="mark-start"]',
    drawable: true,
  },
  {
    key: "presetDeliveryFlow",
    element: "終わりの印",
    expected: 1,
    selector: '[data-cdl-kind="mark-end"]',
    drawable: true,
  },
  {
    key: "presetDeliveryFlow",
    element: "はい / いいえの札",
    expected: 2,
    selector: '[data-cdl-role="edge-label"]:はい|いいえ',
    drawable: true,
  },
  {
    key: "presetDeliveryFlow",
    element: "戻る点線と札",
    expected: 1,
    selector: '[data-cdl-edge-label="翌日もう一度"] [data-cdl-role="edge-line"][stroke-dasharray]',
    drawable: true,
  },
  {
    key: "presetDeliveryFlow",
    element: "札と丸を繋ぐ細い点線",
    expected: 0,
    selector: '[data-cdl-role="timeline-leader"]',
    drawable: true,
  },
  {
    key: "presetDeliveryFlow",
    element: "凡例の項目",
    expected: 4,
    selector: '[data-cdl-role="legend-item"]',
    drawable: true,
  },

  {
    key: "presetDeliveryStages",
    element: "縦列の見出し",
    expected: 0,
    selector: '[data-cdl-role="metro-lane-badge"]',
    drawable: true,
  },
  {
    key: "presetDeliveryStages",
    element: "縦列の区切り",
    expected: 0,
    selector: '[data-cdl-role="metro-lane-guide"]',
    drawable: true,
  },
  {
    key: "presetDeliveryStages",
    element: "段階の列",
    expected: 4,
    selector: '[data-cdl-role="stage-column"]',
    drawable: true,
  },
  {
    key: "presetDeliveryStages",
    element: "段",
    expected: 8,
    selector: '[data-cdl-kind="card"]',
    drawable: true,
  },
  {
    key: "presetDeliveryStages",
    element: "札の右の小さな字",
    expected: 8,
    selector: '[data-cdl-role="stage-note"]',
    drawable: true,
  },
  {
    key: "presetDeliveryStages",
    element: "分かれ道",
    expected: 1,
    selector: '[data-cdl-role="stage-note"]:分かれ道',
    drawable: true,
  },
  {
    key: "presetDeliveryStages",
    element: "始まりの印",
    expected: 0,
    selector: '[data-cdl-kind="mark-start"]',
    drawable: true,
  },
  {
    key: "presetDeliveryStages",
    element: "終わりの印",
    expected: 0,
    selector: '[data-cdl-kind="mark-end"]',
    drawable: true,
  },
  {
    key: "presetDeliveryStages",
    element: "はい / いいえの札",
    expected: 2,
    selector: '[data-cdl-role="edge-label"]:はい|いいえ',
    drawable: true,
  },
  {
    key: "presetDeliveryStages",
    element: "戻る点線と札",
    expected: 1,
    selector: '[data-cdl-edge-label="翌日もう一度"] [data-cdl-role="edge-line"][stroke-dasharray]',
    drawable: true,
  },
  {
    key: "presetDeliveryStages",
    element: "札と丸を繋ぐ細い点線",
    expected: 0,
    selector: '[data-cdl-role="timeline-leader"]',
    drawable: true,
  },
  {
    key: "presetDeliveryStages",
    element: "凡例の項目",
    expected: 3,
    selector: '[data-cdl-role="legend-item"]',
    drawable: true,
  },

  {
    key: "presetDeliveryMetro",
    element: "縦列の見出し",
    expected: 3,
    selector: '[data-cdl-role="metro-lane-badge"]',
    drawable: true,
  },
  {
    key: "presetDeliveryMetro",
    element: "縦列の区切り",
    expected: 3,
    selector: '[data-cdl-role="metro-lane-guide"]',
    drawable: true,
  },
  {
    key: "presetDeliveryMetro",
    element: "段階の列",
    expected: 0,
    selector: '[data-cdl-role="stage-column"]',
    drawable: true,
  },
  {
    key: "presetDeliveryMetro",
    element: "段",
    expected: 7,
    selector: '[data-cdl-kind="station"]',
    drawable: true,
  },
  {
    key: "presetDeliveryMetro",
    element: "札の右の小さな字",
    expected: 0,
    selector: '[data-cdl-role="stage-note"]',
    drawable: true,
  },
  {
    key: "presetDeliveryMetro",
    element: "分かれ道",
    expected: 1,
    selector: '[data-cdl-kind="decision"]',
    drawable: true,
  },
  {
    key: "presetDeliveryMetro",
    element: "始まりの印",
    expected: 1,
    selector: '[data-cdl-kind="mark-start"]',
    drawable: true,
  },
  {
    key: "presetDeliveryMetro",
    element: "終わりの印",
    expected: 1,
    selector: '[data-cdl-kind="mark-end"]',
    drawable: true,
  },
  {
    key: "presetDeliveryMetro",
    element: "はい / いいえの札",
    expected: 2,
    selector: '[data-cdl-role="edge-label"]:はい|いいえ',
    drawable: true,
  },
  {
    key: "presetDeliveryMetro",
    element: "戻る点線と札",
    expected: 1,
    selector: '[data-cdl-edge-label="翌日もう一度"] [data-cdl-role="edge-line"][stroke-dasharray]',
    drawable: true,
  },
  {
    key: "presetDeliveryMetro",
    element: "札と丸を繋ぐ細い点線",
    expected: 0,
    selector: '[data-cdl-role="timeline-leader"]',
    drawable: true,
  },
  {
    key: "presetDeliveryMetro",
    element: "凡例の項目",
    expected: 4,
    selector: '[data-cdl-role="legend-item"]',
    drawable: true,
  },

  {
    key: "presetDeliveryTimeline",
    element: "縦列の見出し",
    expected: 0,
    selector: '[data-cdl-role="metro-lane-badge"]',
    drawable: true,
  },
  {
    key: "presetDeliveryTimeline",
    element: "縦列の区切り",
    expected: 0,
    selector: '[data-cdl-role="metro-lane-guide"]',
    drawable: true,
  },
  {
    key: "presetDeliveryTimeline",
    element: "段階の列",
    expected: 0,
    selector: '[data-cdl-role="stage-column"]',
    drawable: true,
  },
  {
    key: "presetDeliveryTimeline",
    element: "段",
    expected: 13,
    selector: '[data-cdl-kind="timeline-number"], [data-cdl-kind="card"]',
    drawable: true,
  },
  {
    key: "presetDeliveryTimeline",
    element: "札の右の小さな字",
    expected: 7,
    selector: '[data-cdl-role="stage-note"], [data-cdl-node="持ち戻る"] [data-cdl-role="node-subtitle"]',
    drawable: true,
  },
  {
    key: "presetDeliveryTimeline",
    element: "分かれ道",
    expected: 1,
    selector: '[data-cdl-kind="decision"]',
    drawable: true,
  },
  {
    key: "presetDeliveryTimeline",
    element: "始まりの印",
    expected: 0,
    selector: '[data-cdl-kind="mark-start"]',
    drawable: true,
  },
  {
    key: "presetDeliveryTimeline",
    element: "終わりの印",
    expected: 1,
    selector: '[data-cdl-kind="mark-end"]',
    drawable: true,
  },
  {
    key: "presetDeliveryTimeline",
    element: "はい / いいえの札",
    expected: 2,
    selector: '[data-cdl-role="edge-label"]:はい|いいえ',
    drawable: true,
  },
  {
    key: "presetDeliveryTimeline",
    element: "戻る点線と札",
    expected: 1,
    selector: '[data-cdl-edge-label="翌日もう一度"] [data-cdl-role="edge-line"][stroke-dasharray]',
    drawable: true,
  },
  {
    key: "presetDeliveryTimeline",
    element: "札と丸を繋ぐ細い点線",
    expected: 6,
    selector: '[data-cdl-role="timeline-leader"]',
    drawable: true,
  },
  {
    key: "presetDeliveryTimeline",
    element: "凡例の項目",
    expected: 3,
    selector: '[data-cdl-role="legend-item"]',
    drawable: true,
  },
];

function selectorで数える(svgDocument: Document, selector: string): number {
  const 文字条件 = selector.match(/:(はい\|いいえ|分かれ道)$/);
  if (!文字条件) return svgDocument.querySelectorAll(selector).length;

  const css = selector.slice(0, -文字条件[0].length);
  const nodes = [...svgDocument.querySelectorAll(css)];
  const choices = 文字条件[1]?.split("|") ?? [];
  return nodes.filter((node) => choices.includes(node.textContent?.trim() ?? "")).length;
}

describe("宅配のひな形と見本の形の要素 (#2835)", () => {
  for (const item of 宅配のひな形) {
    const rows = 宅配の要素.filter((row) => row.key === item.key);
    it(`${item.key} の表が 12 要素を漏れなく持つ`, () => {
      expect(rows).toHaveLength(12);
    });

    it(`${item.key} の最終段に描ける要素が見本と同じ数だけある`, () => {
      const { diagram } = 記法を引く(item.key);
      const markup = renderToStaticMarkup(
        createElement(CdlDiagramView, {
          diagram,
          focusPhaseId: diagram.phases.at(-1)?.id,
        }),
      );
      const svgDocument = new JSDOM(markup).window.document;
      const 描ける = rows.filter((entry) => entry.drawable);
      expect(描ける.length, "描ける要素を 1 件も照合していない").toBeGreaterThan(0);
      for (const row of 描ける) {
        expect(
          selectorで数える(svgDocument, row.selector),
          `${row.element}: ${row.selector}`,
        ).toBe(row.expected);
      }
    });
  }

  it("流れの送り状を起こすから便に積むまでを段差の無い横線で結ぶ", () => {
    const { diagram } = 記法を引く("presetDeliveryFlow");
    const markup = renderToStaticMarkup(
      createElement(CdlDiagramView, {
        diagram,
        focusPhaseId: diagram.phases.at(-1)?.id,
      }),
    );
    const svgDocument = new JSDOM(markup).window.document;
    const path = svgDocument.querySelector(
      '[data-cdl-edge][data-cdl-from="送り状を起こす"][data-cdl-to="便に積む"]',
    );
    const d = path?.getAttribute("data-cdl-path-d") ?? "";
    const 点 = [...d.matchAll(/[ML]\s*(-?[\d.]+)\s*(-?[\d.]+)/g)].map((match) => ({
      x: Number(match[1]),
      y: Number(match[2]),
    }));

    expect(d, "対象の path を読めない").not.toBe("");
    expect(点).toHaveLength(2);
    expect(点[0]?.y).toBe(点[1]?.y);
  });

  it("描けない宣言は理由を持ち、DOM が現れたら外す", () => {
    const 描けない = 宅配の要素.filter((entry) => !entry.drawable);
    expect(描けない.length, "描けない宣言を 1 件も照合していない").toBeGreaterThan(0);
    for (const row of 描けない) {
      const { diagram } = 記法を引く(row.key);
      const markup = renderToStaticMarkup(
        createElement(CdlDiagramView, {
          diagram,
          focusPhaseId: diagram.phases.at(-1)?.id,
        }),
      );
      const svgDocument = new JSDOM(markup).window.document;
      expect(row.reason).toEqual(expect.any(String));
      expect(row.reason).toContain("描く側 (cdl) で直す");
      expect(
        selectorで数える(svgDocument, row.selector),
        `${row.element} を描く DOM が現れたため、描けない宣言を外して ${row.expected} 件を照合する`,
      ).toBe(0);
    }
  });
});
