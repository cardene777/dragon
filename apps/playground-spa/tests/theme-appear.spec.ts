import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { test, expect, type Page } from "@playwright/test";

import { 記法をURLに載せる } from "./box-and-edge-figure";
import { readThemeNotes, type ThemeNote } from "./helpers/theme-notes";

const source = (theme: string): string => `title: "現れ方"
type: flow
theme: ${theme}
reveal: all

states:
  shown: 0

actors:
  - a: { kind: card, title: "A" }
  - b: { kind: card, title: "B" }
  - c: { kind: card, title: "C", 出す条件: "{shown}" }

flow:
  - a -> b
  - b -> c

animation:
  - step: "1" 2.0s
    focus: [a]
  - step: "2" 2.0s
    focus: [b]
    set:
      shown: 1
  - step: "3" 2.0s
    focus: [a]
`;

const fixedThemes = (): Array<Extract<ThemeNote, { mode: "fixed" }>> =>
  [...readThemeNotes().values()].filter(
    (note): note is Extract<ThemeNote, { mode: "fixed" }> => note.mode === "fixed",
  );

const css = readFileSync(
  fileURLToPath(new URL("../src/styles/cdl-theme.css", import.meta.url)),
  "utf8",
).replace(/\/\*[\s\S]*?\*\//g, "");

const edgeAppearingThemes = (): Array<Extract<ThemeNote, { mode: "fixed" }>> =>
  fixedThemes().filter((note) =>
    [...css.matchAll(/([^{}]*)\{([^{}]*)\}/g)].some((block) =>
      (block[1] ?? "").trim() === `svg[data-cdl-stage][data-cdl-palette="${note.name}"]` &&
      /--theme-edge-appear\s*:/.test(block[2] ?? "")));

async function capture(page: Page): Promise<void> {
  await page.addInitScript(() => {
    const counts: Record<string, number> = {};
    (window as unknown as { __themeAppearCounts: Record<string, number> }).__themeAppearCounts =
      counts;
    const edgeCounts: Record<string, number> = {};
    (window as unknown as { __themeEdgeAppearCounts: Record<string, number> })
      .__themeEdgeAppearCounts = edgeCounts;
    document.addEventListener(
      "animationstart",
      (event) => {
        if (!(event instanceof AnimationEvent)) return;
        const target =
          event.target instanceof Element ? event.target.closest("[data-cdl-node]") : null;
        const stage = target?.closest("svg[data-cdl-stage]");
        const animation = stage
          ? getComputedStyle(stage).getPropertyValue("--theme-appear").trim()
          : "";
        if (animation && animation !== "none" && event.animationName === animation) {
          const id = target?.getAttribute("data-cdl-node");
          if (id) counts[id] = (counts[id] ?? 0) + 1;
        }

        const edge = event.target instanceof Element
          ? event.target.closest("[data-cdl-edge]")
          : null;
        const edgeStage = edge?.closest("svg[data-cdl-stage]");
        const edgeAnimation = edgeStage
          ? getComputedStyle(edgeStage).getPropertyValue("--theme-edge-appear").trim()
          : "";
        if (edgeAnimation && edgeAnimation !== "none" && event.animationName === edgeAnimation) {
          const edgeId = edge?.getAttribute("data-cdl-edge");
          if (edgeId) edgeCounts[edgeId] = (edgeCounts[edgeId] ?? 0) + 1;
        }
      },
      true,
    );
  });
}

async function edgeCounts(page: Page): Promise<Record<string, number>> {
  return page.evaluate(() => ({
    ...(window as unknown as { __themeEdgeAppearCounts?: Record<string, number> })
      .__themeEdgeAppearCounts,
  }));
}

async function counts(page: Page): Promise<Record<string, number>> {
  return page.evaluate(() => ({
    ...(window as unknown as { __themeAppearCounts?: Record<string, number> }).__themeAppearCounts,
  }));
}

async function animationName(page: Page, name: string): Promise<string> {
  return page
    .locator(`svg[data-cdl-stage][data-cdl-palette="${name}"]`)
    .evaluate((stage) => getComputedStyle(stage).getPropertyValue("--theme-appear").trim());
}

for (const note of fixedThemes()) {
  test(`${note.name} initial-animation: 箱は開いた時か新しく現れた時の 1 回だけ動く`, async ({
    page,
  }) => {
    await capture(page);
    await page.goto(`editor#s=${記法をURLに載せる(source(note.name))}`);
    await page.waitForSelector(`svg[data-cdl-stage][data-cdl-palette="${note.name}"]`);
    const animation = await animationName(page, note.name);
    expect(animation, `${note.name} の --theme-appear を読めない`).not.toBe("");
    expect(animation).not.toBe("none");
    await page.waitForFunction(
      () => {
        const c = document.querySelector('[data-cdl-node="c"]');
        return c !== null && !c.hasAttribute("data-cdl-hidden");
      },
      undefined,
      { timeout: 5_000 },
    );
    await page.waitForTimeout(1_000);

    await expect(page.locator("[data-cdl-phase-index]").first()).toHaveAttribute(
      "data-cdl-phase-index",
      "1",
    );
    expect(await counts(page)).toMatchObject({ a: 1, b: 1, c: 1 });
    expect(Object.values(await counts(page)).reduce((sum, value) => sum + value, 0)).toBe(3);
  });

  test(`${note.name} initial-animation: 動きを減らす時は止めても箱を描く`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await capture(page);
    await page.goto(`editor#s=${記法をURLに載せる(source(note.name))}`);
    await page.waitForSelector(`svg[data-cdl-stage][data-cdl-palette="${note.name}"]`);
    const animation = await animationName(page, note.name);
    expect(animation, `${note.name} の --theme-appear を読めない`).not.toBe("");
    expect(animation).not.toBe("none");
    await page.waitForTimeout(1_000);

    expect(Object.values(await counts(page)).reduce((sum, value) => sum + value, 0)).toBe(0);
    await expect(page.locator('[data-cdl-role="node-body"]')).not.toHaveCount(0);
  });
}

for (const note of edgeAppearingThemes()) {
  test(`${note.name} initial-animation: 線は開いた時に 1 本ずつ 1 回だけ灯る`, async ({
    page,
  }) => {
    await capture(page);
    await page.goto(`editor#s=${記法をURLに載せる(source(note.name))}`);
    await page.waitForSelector(`svg[data-cdl-stage][data-cdl-palette="${note.name}"]`);
    await page.waitForTimeout(1_800);

    const edgeIds = await page.locator("[data-cdl-edge]").evaluateAll((edges) =>
      edges.flatMap((edge) => edge.getAttribute("data-cdl-edge") ?? []));
    expect(edgeIds.length, "灯る線を 1 本も描いていない").toBeGreaterThan(0);
    const actual = await edgeCounts(page);
    expect(Object.keys(actual).sort()).toEqual([...edgeIds].sort());
    expect(Object.values(actual)).toHaveLength(edgeIds.length);
    expect(Object.values(actual).every((count) => count === 1)).toBe(true);
  });

  test(`${note.name} initial-animation: 動きを減らす時は線を灯さない`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await capture(page);
    await page.goto(`editor#s=${記法をURLに載せる(source(note.name))}`);
    await page.waitForSelector(`svg[data-cdl-stage][data-cdl-palette="${note.name}"]`);
    await page.waitForTimeout(1_800);

    expect(Object.values(await edgeCounts(page))).toEqual([]);
    await expect(page.locator('[data-cdl-role="edge-line"]')).not.toHaveCount(0);
  });
}

test("kinari initial-animation: 生成りには固定の意匠の現れ方を足さない (#2790)", async ({
  page,
}) => {
  await capture(page);
  await page.goto(`editor#s=${記法をURLに載せる(source("kinari"))}`);
  await page.waitForSelector('svg[data-cdl-stage][data-cdl-palette="kinari"]');
  await page.waitForTimeout(1_000);

  expect(Object.values(await counts(page)).reduce((sum, value) => sum + value, 0)).toBe(0);
  await expect(page.locator('[data-cdl-role="node-body"]')).not.toHaveCount(0);
});
