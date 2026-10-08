import { CdlDiagramView } from "@cardenelabs/cdl";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import * as textDsl from "../../../apps/playground-spa/src/topics/catalog/text-dsl.cdl";
import { textDslToDiagram } from "../src/index";
import {
  TIMELINE_AXIS_TO_CARD,
  TIMELINE_DECISION_GAP,
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

  it("cdl#1033: 凡例の字を箱の題 32 に対する見本の比にする", () => {
    expect(presetDeliveryTimeline.legendFontSize).toBe(25.8461538462);
  });

  it("cdl#1070/#1071: 時間軸の暫定値を見本へ戻す", () => {
    expect({
      axisToCard: TIMELINE_AXIS_TO_CARD,
      stepGap: TIMELINE_STEP_GAP,
      decisionGap: TIMELINE_DECISION_GAP,
      endGap: TIMELINE_END_GAP,
    }).toEqual({ axisToCard: 70, stepGap: 125, decisionGap: 145, endGap: 105 });

    const axis = presetDeliveryTimeline.lanes.find((lane) => lane.timelineAxis === true);
    const returned = presetDeliveryTimeline.nodes.find((node) => node.title === "持ち戻る");
    expect(axis).toBeDefined();
    expect(returned).toBeDefined();
    if (!axis || !returned) return;
    const axisCenter = (axis.posX ?? 0) + (axis.posW ?? 0) / 2;
    const returnedInnerEdge = Math.abs((returned.posX ?? 0) - axisCenter) - (returned.w ?? 0) / 2;
    expect(returnedInnerEdge).toBe(220);
  });

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
