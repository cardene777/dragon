import { test, expect, type Page } from "@playwright/test";

import { EDITOR_SAMPLES } from "../src/data/editor-samples";
import { 記法をURLに載せる } from "./box-and-edge-figure";
import { checkEdgeLabelTones, checkSingleSeriesBars } from "./helpers/label-tone-checks";
import { readFixedThemeGroundText } from "./helpers/theme-notes";

const TYPES = ["class", "flowchart", "chart"] as const;

function sample(type: (typeof TYPES)[number]): string {
  const found = EDITOR_SAMPLES.find((value) =>
    new RegExp(`^type:\\s*${type}\\s*$`, "m").test(value.code));
  if (!found) throw new Error(`editor-samples に ${type} の見本が無い`);
  return found.code;
}

function withCatalog(source: string): string {
  const withoutTheme = source.replace(/^(?:theme|palette):[^\n]*(?:\n|$)/gm, "");
  return withoutTheme.replace(/^(type:[^\n]*)$/m, "$1\ntheme: catalog");
}

async function open(page: Page, type: (typeof TYPES)[number]): Promise<void> {
  await page.goto(`editor#s=${記法をURLに載せる(withCatalog(sample(type)))}`);
  await page.waitForSelector('svg[data-cdl-stage][data-cdl-palette="catalog"]', {
    timeout: 20_000,
  });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(1_800);
}

const stage = (page: Page) =>
  page.locator('svg[data-cdl-stage][data-cdl-palette="catalog"]');

function positiveShadowOffsets(filter: string): number[] {
  const withoutRgb = filter.replace(/rgba?\([^)]*\)/g, "");
  return [...withoutRgb.matchAll(/drop-shadow\(([^)]*)\)/g)].flatMap((shadow) => {
    const lengths = [...(shadow[1] ?? "").matchAll(/([-\d.]+)px/g)];
    const y = lengths[1]?.[1];
    return y === undefined ? [] : [Number(y)];
  });
}

test("catalog: 関係図・流れ図・図表の札は下へ影を落とし、字には filter を掛けない", async ({
  page,
}) => {
  for (const type of TYPES) {
    await open(page, type);
    const body = stage(page)
      .locator('[data-cdl-role="node-body"]:not([data-cdl-look]):not([data-cdl-mark])')
      .first();
    await expect(body, `${type} に札の面が無い`).toHaveCount(1);
    const filter = await body.evaluate((element) => getComputedStyle(element).filter);
    expect(filter, `${type} の札に影が無い`).toContain("drop-shadow");
    expect(positiveShadowOffsets(filter), `${type} の札の影が下へ落ちていない`)
      .toEqual(expect.arrayContaining([expect.any(Number)]));
    expect(positiveShadowOffsets(filter).every((offset) => offset > 0)).toBe(true);

    const textFilters = await stage(page).locator("text").evaluateAll((texts) =>
      [...new Set(texts.map((text) => getComputedStyle(text).filter))]);
    expect(textFilters, `${type} の字へ filter が掛かっている`).toEqual(["none"]);

    const labelFilters = await stage(page)
      .locator('[data-cdl-role="edge-label-bg"]')
      .evaluateAll((labels) => [...new Set(labels.map((label) => getComputedStyle(label).filter))]);
    if (labelFilters.length > 0) {
      expect(labelFilters, `${type} の線に添える札へ filter が掛かっている`).toEqual(["none"]);
    }
  }
});

test("catalog: 関係図と流れ図は線が線の色で光る", async ({
  page,
}) => {
  for (const type of ["class", "flowchart"] as const) {
    await open(page, type);
    const lines = stage(page).locator('[data-cdl-role="edge-line"]');
    expect(await lines.count(), `${type} に線が無い`).toBeGreaterThan(0);
    const lineFilters = await lines.evaluateAll((elements) =>
      elements.map((element) => getComputedStyle(element).filter));
    expect(lineFilters.every((filter) => filter.includes("drop-shadow")), `${type} の線の光`)
      .toBe(true);

  }
});

test("catalog: 図録・手描き・電飾・浮彫の非強調札と主役札が意匠帳どおりになる", async ({
  page,
}, testInfo) => {
  for (const theme of ["catalog", "sketch", "neon", "relief"] as const) {
    const report = await checkEdgeLabelTones(page, theme);
    console.log(report);
    testInfo.annotations.push({ type: `${theme} labels`, description: report });
  }
});

test("catalog: 活版・図録・手描き・電飾・浮彫の単系列の棒を意味属性で選ぶ", async ({
  page,
}, testInfo) => {
  for (const theme of ["letterpress", "catalog", "sketch", "neon", "relief"] as const) {
    const report = await checkSingleSeriesBars(page, theme);
    console.log(report);
    testInfo.annotations.push({ type: `${theme} bars`, description: report });
  }
});

test("catalog: 図表の題は台の上の地の字で描く", async ({ page }) => {
  const groundText = readFixedThemeGroundText().get("catalog");
  if (!groundText) throw new Error("図録の地の字を意匠帳から読めない");
  await open(page, "chart");
  const titles = stage(page).locator('[data-cdl-role="figure-title"]');
  expect(await titles.count(), "図表に図の題が無い").toBeGreaterThan(0);
  const fills = await titles.evaluateAll((elements) =>
    [...new Set(elements.map((element) => getComputedStyle(element).fill))]);
  const expected = await stage(page).evaluate((element) => {
    const value = getComputedStyle(element).getPropertyValue("--theme-ground-ink").trim();
    const probe = document.createElement("span");
    probe.style.color = value;
    document.body.append(probe);
    const color = getComputedStyle(probe).color;
    probe.remove();
    return color;
  });
  expect(expected).toBe(`rgb(${Number.parseInt(groundText.ink.slice(1, 3), 16)}, ${Number.parseInt(groundText.ink.slice(3, 5), 16)}, ${Number.parseInt(groundText.ink.slice(5, 7), 16)})`);
  expect(fills).toEqual([expected]);
});
