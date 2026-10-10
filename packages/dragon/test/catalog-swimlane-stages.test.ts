import { CdlDiagramView } from "@cardenelabs/cdl";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import * as textDsl from "../../../apps/playground-spa/src/topics/catalog/text-dsl.cdl";
import {
  presetDeliveryStages,
  sourceJson__presetDeliveryStages,
  sourceYaml__presetDeliveryStages,
} from "../../../apps/playground-spa/src/topics/catalog/presets.cdl";
import { textDslToDiagram } from "../src/index";

const 段階の見本 = (): Array<{ key: string; source: string }> =>
  Object.entries(textDsl)
    .filter(([key, value]) => key.startsWith("sourceYaml__") && typeof value === "string" && value.includes("shape: stages"))
    .map(([key, value]) => ({ key: key.slice("sourceYaml__".length), source: value as string }));

describe("見本帳の段階ごとの箱 (#2797)", () => {
  it("cdl#1031/#1072/#1157/#1158: 線札と段の列を見本の寸法へ合わせる", () => {
    expect(presetDeliveryStages.edges.find((edge) => edge.label === "翌日もう一度")).toMatchObject({
      fromSide: "right",
      toSide: "top",
    });
    expect(presetDeliveryStages.edges.find((edge) => edge.label === "いいえ")).toMatchObject({
      labelCollision: "author",
      labelSize: { width: 96, height: 40, fontSize: 21 },
      labelOffsetY: 44,
    });
    expect(presetDeliveryStages.stageLayout).toEqual({
      columnWidths: { 申し込み: 300, 受付: 360, 配送: 400, 結果: 420 },
      columnGap: 64,
      backDetourTopGap: 34,
      backDetourSideGap: 58,
    });
  });

  it("凡例の字を見本の 21 にする", () => {
    expect(presetDeliveryStages.legendFontSize).toBe(21);
  });

  it("盤を 1100 高に戻し、明示した列幅から左右 24 ずつ空けた札幅を作る", () => {
    expect(presetDeliveryStages.viewport).toEqual({ width: 1800, height: 1048.118 });
    expect(JSON.parse(sourceJson__presetDeliveryStages).viewport).toEqual({
      width: 1800,
      height: 1048.118,
    });

    // preset export は build 済み dist を読むため、変更した組み立て自身から札幅を測る。
    const diagram = textDslToDiagram(sourceYaml__presetDeliveryStages);
    expect(diagram.nodes.map((node) => [node.title, node.w])).toEqual([
      ["集荷を頼む", 252],
      ["受け付ける", 312],
      ["送り状を起こす", 312],
      ["便に積む", 352],
      ["届けに行く", 352],
      ["在宅?", 352],
      ["受け取る", 372],
      ["持ち戻る", 372],
    ]);
  });

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

  it("見本と同じ順の3項目を記法に持ち、組み立てた凡例へ渡す", () => {
    const item = 段階の見本()[0];
    expect(item).toBeDefined();
    if (!item) return;
    expect(item.source).toContain(`legend:
  - { mark: rounded-label, text: "札 = 段。 右の小さな字が担当" }
  - { mark: curved-line, text: "段階をまたぐ線" }
  - { mark: dotted-line, text: "点線 = 前の段へ戻る" }`);

    const diagram = textDslToDiagram(item.source);
    expect(diagram.legend).toEqual([
      { mark: "rounded-label", text: "札 = 段。 右の小さな字が担当" },
      { mark: "curved-line", text: "段階をまたぐ線" },
      { mark: "dotted-line", text: "点線 = 前の段へ戻る" },
    ]);
    const markup = renderToStaticMarkup(createElement(CdlDiagramView, { diagram }));
    expect(
      [...markup.matchAll(/data-cdl-legend-mark="([^"]+)"/g)].map((match) => match[1]),
    ).toEqual(["rounded-label", "curved-line", "dotted-line"]);
    expect(markup).toMatch(
      /data-cdl-legend-mark="rounded-label"[\s\S]*?<rect[^>]+stroke-width="2"/,
    );
    expect(markup).toMatch(
      /data-cdl-legend-mark="dotted-line"[\s\S]*?<path[^>]+stroke-width="6"[^>]+stroke-linecap="round"[^>]+stroke-dasharray="0 9\.6"/,
    );
    expect(markup).toContain('stroke="var(--cdl-text-accent, #143a52)"');
    expect(markup).toContain('fill="var(--cdl-text-mute, #4d7187)"');
  });
});
