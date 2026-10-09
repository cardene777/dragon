import { CdlDiagramView } from "@cardenelabs/cdl";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import * as textDsl from "../../../apps/playground-spa/src/topics/catalog/text-dsl.cdl";
import { presetDeliveryMetro } from "../../../apps/playground-spa/src/topics/catalog/presets.cdl";
import { textDslToDiagram } from "../src/index";

const 路線図の見本 = (): Array<{ key: string; source: string }> =>
  Object.entries(textDsl)
    .filter(
      ([key, value]) =>
        key.startsWith("sourceYaml__") &&
        typeof value === "string" &&
        value.includes("type: swimlane") &&
        value.includes("shape: metro"),
    )
    .map(([key, value]) => ({ key: key.slice("sourceYaml__".length), source: value as string }));

describe("見本帳の路線図の形 (#2799)", () => {
  it("cdl#1028: 届けに行くの駅名を下へ置く", () => {
    expect(presetDeliveryMetro.nodes.find((node) => node.title === "届けに行く")).toMatchObject({
      stationNamePosition: "bottom",
    });
  });

  it("cdl#1029: はいの札を下へ 110 ずらす", () => {
    expect(presetDeliveryMetro.edges.find((edge) => edge.label === "はい")).toMatchObject({
      labelOffsetY: 110,
    });
  });

  it("凡例の字を見本の 21 にする", () => {
    expect(presetDeliveryMetro.legendFontSize).toBe(21);
  });

  it("shape: metro を記法と JSON の対でちょうど1件持つ", () => {
    const items = 路線図の見本();
    expect(items).toHaveLength(1);
    for (const item of items) expect(textDsl[`sourceJson__${item.key}` as keyof typeof textDsl]).toEqual(expect.any(String));
  });

  it.each([undefined, "kinari", "blueprint"] as const)("意匠 %s でも駅、路線、線路を描く", (theme) => {
    const item = 路線図の見本()[0];
    expect(item).toBeDefined();
    if (!item) return;
    const source = theme === undefined ? item.source : item.source.replace("type: swimlane", `type: swimlane\ntheme: ${theme}`);
    const markup = renderToStaticMarkup(createElement(CdlDiagramView, { diagram: textDslToDiagram(source) }));
    expect(markup).toContain('data-cdl-role="node-body"');
    expect(markup).toContain('data-cdl-mark="station"');
    expect(markup).toContain('data-cdl-routing="metro"');
    expect(markup).toContain('data-cdl-lane="track-');
  });

  it("見本と同じ 4 項目の凡例を順番どおり持つ", () => {
    const item = 路線図の見本()[0];
    expect(item).toBeDefined();
    if (!item) return;

    expect(textDslToDiagram(item.source).legend).toEqual([
      { mark: "station", text: "駅 = 段。 載っている線路が担当" },
      { mark: "diamond", text: "分かれ道" },
      { mark: "dotted-line", text: "点線 = 前の駅へ戻る" },
      { mark: "arrow", text: "時間は左から右へ進む" },
    ]);
  });
});
