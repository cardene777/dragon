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
  TIMELINE_END_GAP,
  TIMELINE_STEP_GAP,
} from "../src/compile/timeline";
import {
  presetDeliveryTimeline,
  sourceJson__presetDeliveryTimeline,
} from "../../../apps/playground-spa/src/topics/catalog/presets.cdl";

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
    expect(presetDeliveryTimeline.edges.find((edge) => edge.label === "いいえ")).toMatchObject({
      labelCollision: "author",
      labelSize: { width: 96, height: 40, fontSize: 21 },
      labelOffsetY: 64,
    });
    expect(presetDeliveryTimeline.edges.find((edge) => edge.label === "翌日もう一度")).toMatchObject({
      fromSide: "right",
      toSide: "right",
      labelCollision: "author",
      labelSize: { width: 162, height: 40, fontSize: 21 },
      labelOffsetX: 20,
    });
    expect(presetDeliveryTimeline.nodes.find((node) => node.title === "持ち戻る")).toMatchObject({
      subtitlePlacement: "right",
    });
  });

  it("凡例の字を見本の 21 にする", () => {
    expect(presetDeliveryTimeline.legendFontSize).toBe(21);
  });

  it("1800 幅の盤を保ち、いいえの札を対象線の 20 上へ置く", () => {
    expect(presetDeliveryTimeline.viewport).toEqual({ width: 1800, contentOffsetX: 250 });
    const json = JSON.parse(sourceJson__presetDeliveryTimeline);
    expect(json.viewport).toEqual({ width: 1800, contentOffsetX: 250 });
    expect(json.flow.find((edge: { label?: string }) => edge.label === "いいえ")).toMatchObject({
      labelCollision: "author",
      labelOffsetY: 64,
    });

    const markup = renderToStaticMarkup(createElement(CdlDiagramView, {
      diagram: presetDeliveryTimeline,
      focusPhaseId: presetDeliveryTimeline.phases.at(-1)?.id,
    }));
    const viewBox = /data-cdl-viewbox="([^"]+)"/u.exec(markup)?.[1]?.split(" ").map(Number);
    expect(viewBox?.[2]).toBe(1800);

    const edge = /<g data-cdl-edge="e6-在宅-持ち戻る"[^>]+>/u.exec(markup)?.[0];
    if (edge === undefined) throw new Error("いいえの線が無い");
    const pathY = Number(/data-cdl-path-d="M [^ ]+ ([^ ]+) L/u.exec(edge)?.[1]);
    const labelY = Number(/data-cdl-label-y="([^"]+)"/u.exec(edge)?.[1]);
    // 高さ 40 の札の下端が対象線から 20 上 = 中心どうしは 40。
    expect(pathY - labelY).toBe(40);
  });

  it("cdl#1070/#1071: 時間軸の暫定値を見本へ戻す", () => {
    expect({
      axisToCard: TIMELINE_AXIS_TO_CARD,
      stepGap: TIMELINE_STEP_GAP,
      decisionGap: TIMELINE_DECISION_GAP,
      endGap: TIMELINE_END_GAP,
    }).toEqual({ axisToCard: 70, stepGap: 125, decisionGap: 142.5, endGap: 105 });

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
    // 線札を labelCollision: author で固定できるため、時間軸から脇札の内側までを
    // 正解頁の座標 (軸 x=800、持ち戻るの左辺 x=1020) から測った 220 に戻す。
    expect(returnedInnerEdge).toBe(TIMELINE_AXIS_TO_SIDE_CARD);
    expect(TIMELINE_AXIS_TO_SIDE_CARD).toBe(220);
  });

  it("意匠を書かない見本帳で分かれ道の前後を 142.5 にする", () => {
    const item = 時間軸の見本()[0];
    expect(item).toBeDefined();
    if (!item) return;
    const nodes = textDslToDiagram(item.source).nodes;
    const before = nodes.find((node) => node.title === "届けに行く");
    const decision = nodes.find((node) => node.title === "在宅?");
    const after = nodes.find((node) => node.title === "受け取る");
    expect(before).toBeDefined();
    expect(decision).toBeDefined();
    expect(after).toBeDefined();
    // 7 意匠は CSS で切り替えるため、記法に theme を足さず見本帳へ届く一つの値を見る。
    expect((decision?.posY ?? 0) - (before?.posY ?? 0)).toBe(142.5);
    expect((after?.posY ?? 0) - (decision?.posY ?? 0)).toBe(142.5);
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
