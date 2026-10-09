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
});
