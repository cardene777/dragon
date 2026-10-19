import { test, expect, type Page } from "@playwright/test";

import { EDITOR_SAMPLES } from "../src/data/editor-samples";
import { readCdlThemeRoleTable } from "../src/lib/theme-role-table-test-helpers";
import { 記法をURLに載せる } from "./box-and-edge-figure";
import { 明るい画面の意匠, 暗い画面の意匠, 画面の意匠を付ける } from "./helpers/site-theme-url";
import { readThemeNotes, type ThemeNote } from "./helpers/theme-notes";

/** 画面の意匠で不変であるべき値は、意匠ごとの値表が宣言した共通の役から導く。 */
function fixedVariableNames(name: string): string[] {
  return [...readCdlThemeRoleTable(name).keys()]
    .filter((role) => role.startsWith("--dragon-theme-"));
}

const er = EDITOR_SAMPLES.find((sample) => sample.slug === "er");
if (!er) throw new Error("editor-samples に er の見本が無い");

// 見本は意匠を書かない (#2960) ので、図種の次の行に意匠を書き足す
const source = (name: string): string => er.code.replace(/^(type:.*)$/m, `$1\ntheme: ${name}`);

const fixedThemes = (): Array<Extract<ThemeNote, { mode: "fixed" }>> =>
  [...readThemeNotes().values()].filter(
    (note): note is Extract<ThemeNote, { mode: "fixed" }> => note.mode === "fixed",
  );

const hexToRgb = (hex: string): string => {
  const value = Number.parseInt(hex.slice(1), 16);
  return `rgb(${value >> 16}, ${(value >> 8) & 255}, ${value & 255})`;
};

/** 地の明るい画面の意匠と暗い画面の意匠で開き、画面の変数の値が大きく分かれる 2 つで比べる (#2962) */
async function open(page: Page, source: string, site: string): Promise<void> {
  await page.goto(画面の意匠を付ける(`editor#s=${記法をURLに載せる(source)}`, site));
  await page.waitForSelector("svg[data-cdl-stage]", { timeout: 20_000 });
  await page.waitForFunction(
    (value) => document.documentElement.getAttribute("data-site-theme") === value,
    site,
  );
  await page.waitForTimeout(500);
}

async function ground(page: Page): Promise<string> {
  return page
    .locator("svg[data-cdl-stage]")
    .evaluate((stage) => getComputedStyle(stage).backgroundColor);
}

for (const note of fixedThemes()) {
  test(`${note.name} dark-ground: 台は地の暗い画面の意匠でも変わらず意匠帳と一致する`, async ({ page }) => {
    await open(page, source(note.name), 明るい画面の意匠);
    const light = await ground(page);
    await open(page, source(note.name), 暗い画面の意匠);
    const dark = await ground(page);
    expect(light).toBe(hexToRgb(note.value.ground));
    expect(dark).toBe(hexToRgb(note.value.ground));
  });

  test(`${note.name} dark-ground: 舞台内で図が読む変数は地の暗い画面の意匠でも全て同じ`, async ({ page }) => {
    const names = fixedVariableNames(note.name);
    expect(names.length, "固定を調べる変数を 1 件も導けていない").toBeGreaterThan(0);
    const read = async (site: string): Promise<Record<string, string>> => {
      await open(page, source(note.name), site);
      return page.locator("svg[data-cdl-stage]").evaluate((stage, vars) => {
        const style = getComputedStyle(stage);
        return Object.fromEntries(vars.map((name) => [name, style.getPropertyValue(name).trim()]));
      }, names);
    };

    const light = await read(明るい画面の意匠);
    const dark = await read(暗い画面の意匠);
    expect(Object.keys(light)).toHaveLength(names.length);
    expect(dark).toEqual(light);
  });
}
