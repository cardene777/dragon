import { CdlDiagramView } from "@cardenelabs/cdl";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import * as textDsl from "../../../apps/playground-spa/src/topics/catalog/text-dsl.cdl";
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
});
