import { CdlDiagramView } from "@cardenelabs/cdl";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import * as textDsl from "../../../apps/playground-spa/src/topics/catalog/text-dsl.cdl";
import { textDslToDiagram } from "../src/index";
import {
  TIMELINE_AXIS_TO_CARD,
  TIMELINE_AXIS_TO_SIDE_CARD,
  TIMELINE_DECISION_GAP,
  TIMELINE_DECISION_GAPS,
  TIMELINE_END_GAP,
  TIMELINE_STEP_GAP,
} from "../src/compile/timeline";
import { presetDeliveryTimeline } from "../../../apps/playground-spa/src/topics/catalog/presets.cdl";

const 時間軸の見本 = (): Array<{ key: string; source: string }> =>
  Object.entries(textDsl)
    .filter(
      ([key, value]) =>
        key.startsWith("sourceYaml__") &&
        typeof value === "string" &&
        value.includes("type: swimlane") &&
        value.includes("shape: timeline"),
    )
    .map(([key, value]) => ({ key: key.slice("sourceYaml__".length), source: value as string }));

describe("見本帳の時間軸の形 (#2798)", () => {
  it("cdl#1031/#1032: 戻る線を右どうしで結び、持ち戻るの担当を右へ置く", () => {
    expect(presetDeliveryTimeline.edges.find((edge) => edge.label === "翌日もう一度")).toMatchObject({
      fromSide: "right",
      toSide: "right",
    });
    expect(presetDeliveryTimeline.nodes.find((node) => node.title === "持ち戻る")).toMatchObject({
      subtitlePlacement: "right",
    });
  });

  it("凡例の字を見本の 21 にする", () => {
    expect(presetDeliveryTimeline.legendFontSize).toBe(21);
  });

  it("cdl#1070/#1071: 時間軸の暫定値を見本へ戻す", () => {
    expect({
      axisToCard: TIMELINE_AXIS_TO_CARD,
      stepGap: TIMELINE_STEP_GAP,
      decisionGap: TIMELINE_DECISION_GAP,
      endGap: TIMELINE_END_GAP,
    }).toEqual({ axisToCard: 70, stepGap: 125, decisionGap: 145, endGap: 105 });

    // catalog の export は build 済み dist を読むため、変更した組み立て自身から測る。
    const source = 時間軸の見本()[0];
    expect(source).toBeDefined();
    if (!source) return;
    const diagram = textDslToDiagram(source.source);
    const axis = diagram.lanes.find((lane) => lane.timelineAxis === true);
    const returned = diagram.nodes.find((node) => node.title === "持ち戻る");
    expect(axis).toBeDefined();
    expect(returned).toBeDefined();
    if (!axis || !returned) return;
    const axisCenter = (axis.posX ?? 0) + (axis.posW ?? 0) / 2;
    const returnedInnerEdge = Math.abs((returned.posX ?? 0) - axisCenter) - (returned.w ?? 0) / 2;
    // CDL の標準線札は幅 108、node-label clearance は左右 32。横線を 172 にして
    // 札が衝突回避で上へ逃げず、見本どおり線の上 20 に留まる値と対にする。
    expect(returnedInnerEdge).toBe(TIMELINE_AXIS_TO_SIDE_CARD);
    expect(TIMELINE_AXIS_TO_SIDE_CARD).toBe(242);
  });

  it.each(Object.entries(TIMELINE_DECISION_GAPS))(
    "%s の分かれ道の前後を見本帳の距離にする",
    (theme, gaps) => {
      const item = 時間軸の見本()[0];
      expect(item).toBeDefined();
      if (!item) return;
      const source = item.source.replace("type: swimlane", `type: swimlane\ntheme: ${theme}`);
      const nodes = textDslToDiagram(source).nodes;
      const before = nodes.find((node) => node.title === "届けに行く");
      const decision = nodes.find((node) => node.title === "在宅?");
      const after = nodes.find((node) => node.title === "受け取る");
      expect(before).toBeDefined();
      expect(decision).toBeDefined();
      expect(after).toBeDefined();
      expect((decision?.posY ?? 0) - (before?.posY ?? 0)).toBe(gaps.before);
      expect((after?.posY ?? 0) - (decision?.posY ?? 0)).toBe(gaps.after);
    },
  );

  it("shape: timeline を記法と JSON の対でちょうど1件持つ", () => {
    const items = 時間軸の見本();
    expect(items).toHaveLength(1);
    for (const item of items)
      expect(textDsl[`sourceJson__${item.key}` as keyof typeof textDsl]).toEqual(expect.any(String));
  });

  it.each([undefined, "kinari", "blueprint"] as const)(
    "意匠 %s でも軸・番号・札を描く",
    (theme) => {
      const item = 時間軸の見本()[0];
      expect(item).toBeDefined();
      if (!item) return;
      const source =
        theme === undefined
          ? item.source
          : item.source.replace("type: swimlane", `type: swimlane\ntheme: ${theme}`);
      const markup = renderToStaticMarkup(
        createElement(CdlDiagramView, { diagram: textDslToDiagram(source) }),
      );
      expect(markup).toContain('data-cdl-role="timeline-axis"');
      expect(markup).not.toContain('data-cdl-role="lane-lifeline"');
      expect(markup).toContain('data-cdl-node="timeline-number-1"');
      expect(markup).toContain('data-cdl-mark="timeline-number"');
      expect(markup).toContain('data-cdl-kind="card"');
      expect(markup).toContain('data-cdl-lane="timeline-steps"');
    },
  );
});
