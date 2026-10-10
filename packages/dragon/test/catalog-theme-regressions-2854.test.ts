import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const css = readFileSync(
  fileURLToPath(new URL("../../../apps/playground-spa/src/styles/cdl-theme.css", import.meta.url)),
  "utf8",
);

const rules = [...css.matchAll(/([^{}]+)\{([^{}]*)\}/gu)].map((match) => ({
  selector: match[1] ?? "",
  body: match[2] ?? "",
}));

const leadRule = (role: string): { selector: string; body: string } | undefined =>
  rules.find(({ selector, body }) => selector.includes(`data-cdl-role="${role}"`) && body.includes("--theme-lead"));

const paletteBlocks = (palette: string): string =>
  rules
    .filter(({ selector }) => selector.includes(`[data-cdl-palette="${palette}"]`))
    .map(({ body }) => body)
    .join("\n");

describe("#2854 5段目a の意匠 selector", () => {
  it("主役色を図形の stroke と文字の fill にだけ当てる", () => {
    const slopeName = leadRule("chart-slope-name");
    const journeyLine = leadRule("journey-line");
    const journeyNote = leadRule("journey-opportunity");
    expect(slopeName?.body).toContain("fill:");
    // 文字の輪郭を確実に消す none は許し、色付き stroke へは流さない。
    expect(slopeName?.body).toContain("stroke: none");
    expect(journeyLine?.body).toContain("stroke:");
    expect(journeyLine?.body).not.toContain("fill:");
    expect(journeyNote?.body).toContain("fill:");
    expect(journeyNote?.body).not.toContain("stroke:");
  });

  it.each(["accent", "teal", "success", "warning"])(
    "放射の %s 系列を枝と葉の下線へ同時に流す",
    (tone) => {
      const rule = rules.find(({ selector }) =>
        selector.includes(`stroke*="--cdl-tone-${tone}"`) &&
        selector.includes('data-cdl-role="mind-edge"') &&
        selector.includes('data-cdl-role="mind-leaf-underline"'));
      expect(rule, `${tone} の枝と下線を同じ規則で選ぶ`).toBeDefined();
    },
  );

  it("漏斗の主役色を値の字だけへ当てる", () => {
    const rule = rules.find(({ selector, body }) =>
      selector.includes('data-cdl-role="funnel-proportional-bar"') &&
      selector.includes('text[font-weight="700"]') &&
      body.includes("--theme-lead"));
    expect(rule).toBeDefined();
  });

  it.each(["blueprint", "letterpress", "catalog", "terminal", "sketch", "neon", "relief"])(
    "%s は傾き図の主役色を定義する",
    (palette) => {
      expect(paletteBlocks(palette), `${palette} の変数の塊`).toContain("--theme-lead:");
    },
  );

  it("傾き図の字体は名札 role だけへ当てる", () => {
    const blanket = rules.find(({ selector }) =>
      selector.includes('[data-cdl-kind="chart-slope"] text'));
    expect(blanket).toBeUndefined();
    for (const role of ["chart-slope-name", "chart-slope-value", "chart-slope-delta"]) {
      expect(
        rules.some(({ selector, body }) =>
          selector.includes(`data-cdl-role="${role}"`) &&
          body.includes("font-weight: 400")),
        `${role} だけに通常の太さを当てる`,
      ).toBe(true);
    }
  });

  it("手描きの内訳と升目を模様にせず、漏斗だけを斜線にする", () => {
    const patterned = rules.filter(({ body }) => body.includes("url(#dragon-sketch-pen)"));
    expect(patterned.some(({ selector }) => selector.includes('chart-stacked-bar-slice'))).toBe(false);
    expect(patterned.some(({ selector }) => selector.includes('chart-waffle-cell'))).toBe(false);
    expect(patterned.some(({ selector }) => selector.includes('funnel-proportional-bar'))).toBe(true);
  });

  it("全意匠の路線図の凡例駅は専用の面色を使う", () => {
    const station = rules.find(({ selector, body }) =>
      selector.includes('[data-cdl-legend-mark="station"]') &&
      body.includes("fill: var(--metro-station-face)"));
    expect(station, "凡例駅の面を指定する規則").toBeDefined();
    expect(station?.selector).toContain("[data-cdl-palette]");
  });

  it("棒の 0 基線だけは実線に戻す", () => {
    const baseline = rules.find(({ selector, body }) =>
      selector.includes('[data-cdl-kind="chart-bar"]') &&
      selector.includes('line:not([data-cdl-role])') &&
      body.includes("stroke-dasharray: none"));
    expect(baseline).toBeDefined();
  });
});
