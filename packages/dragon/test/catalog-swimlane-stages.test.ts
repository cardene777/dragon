import { CdlDiagramView } from "@cardenelabs/cdl";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import * as textDsl from "../../../apps/playground-spa/src/topics/catalog/text-dsl.cdl";
import { textDslToDiagram } from "../src/index";

const 段階の見本 = (): Array<{ key: string; source: string }> =>
  Object.entries(textDsl)
    .filter(([key, value]) => key.startsWith("sourceYaml__") && typeof value === "string" && value.includes("shape: stages"))
    .map(([key, value]) => ({ key: key.slice("sourceYaml__".length), source: value as string }));

describe("見本帳の段階ごとの箱 (#2797)", () => {
  it("shape: stages を記法と JSON の両方で持つ見本がある", () => {
    const items = 段階の見本();
    expect(items.length).toBeGreaterThan(0);
    for (const item of items) expect(textDsl[`sourceJson__${item.key}` as keyof typeof textDsl]).toEqual(expect.any(String));
  });

  it.each([undefined, "kinari", "blueprint"] as const)("意匠 %s でも段階の箱、担当付きの札、曲線が描かれる", (theme) => {
    const item = 段階の見本()[0];
    expect(item).toBeDefined();
    if (!item) return;
    const source = theme === undefined ? item.source : item.source.replace("type: swimlane", `type: swimlane\ntheme: ${theme}`);
    const diagram = textDslToDiagram(source);
    const markup = renderToStaticMarkup(createElement(CdlDiagramView, { diagram }));
    expect(markup).toContain('data-cdl-lane="stage-');
    expect(markup).toContain('data-cdl-role="lane-container"');
    expect(markup).toMatch(/data-cdl-role="lane-label"[^>]*>[\s\S]*・/);
    const paths = [...markup.matchAll(/<path(?=[^>]*data-cdl-role="edge-line")(?=[^>]*\sd="([^"]+)")[^>]*>/g)].map(
      (match) => match[1],
    );
    expect(paths.some((path) => path !== undefined && /\bC\b/.test(path))).toBe(true);
  });
});
