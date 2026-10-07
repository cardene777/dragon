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

  it.each([undefined, "kinari", "blueprint"] as const)("意匠 %s でも段階の列、担当付きの札、曲線が描かれる", (theme) => {
    const item = 段階の見本()[0];
    expect(item).toBeDefined();
    if (!item) return;
    // 見本は animation を持つため、静的 markup では最初の段の線しか出ない。全ての線を描く
    // 静止図へ変えてから、最後の分岐が列をまたぐ曲線になっていることを確かめる。
    const stillSource = item.source.replace(/\nanimation:[\s\S]*$/, "");
    const source = theme === undefined
      ? stillSource
      : stillSource.replace("type: swimlane", `type: swimlane\ntheme: ${theme}`);
    const diagram = textDslToDiagram(source);
    const markup = renderToStaticMarkup(createElement(CdlDiagramView, { diagram }));
    expect(markup).toContain('data-cdl-lane="stage-');
    // 段階は列の面と見出しで描き、縦列の囲みと見出しの札を使わない (#2831)
    expect(markup).toContain('data-cdl-role="stage-column"');
    expect(markup).toContain('data-cdl-role="stage-name"');
    expect(markup).not.toContain('data-cdl-role="lane-container"');
    expect(markup).not.toContain('data-cdl-role="lane-label"');
    // 担当は札の右の小さな字として添える
    expect(markup).toContain('data-cdl-stage-node="集荷を頼む"');
    const home = /<g data-cdl-edge="e5-在宅-受け取る"[^>]*\sdata-cdl-path-d="([^"]+)"/.exec(markup)?.[1];
    expect(home, "在宅? -> 受け取る の道筋").toBeDefined();
    expect(home).toMatch(/\bC\b/);
  });
});
