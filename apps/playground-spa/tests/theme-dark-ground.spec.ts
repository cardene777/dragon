import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { test, expect, type Page } from "@playwright/test";

import { EDITOR_SAMPLES } from "../src/data/editor-samples";
import { 記法をURLに載せる } from "./box-and-edge-figure";

const css = readFileSync(
  fileURLToPath(new URL("../src/styles/cdl-theme.css", import.meta.url)),
  "utf8",
).replace(/\/\*[\s\S]*?\*\//g, "");

/** 変数名は実装から導く。意匠を足すたびに検査側の一覧を書き直さない (#2790)。 */
function fixedVariableNames(): string[] {
  const root = /:root\s*\{([^{}]*)\}/.exec(css)?.[1] ?? "";
  const cdl = [...root.matchAll(/(--cdl-[\w-]+)\s*:/g)]
    .map((m) => m[1]!)
    .filter((name) => !name.startsWith("--cdl-thumbnail-"));
  const d = [...css.matchAll(/var\((--d-[\w-]+)/g)]
    .map((m) => m[1]!)
    .filter((name) => name !== "--d-body");
  return [...new Set([...cdl, ...d])].sort();
}

const er = EDITOR_SAMPLES.find((sample) => sample.slug === "er");
if (!er) throw new Error("editor-samples に er の見本が無い");

const blueprintSource = er.code.replace(/^palette:.*$/m, "theme: blueprint");

async function open(page: Page, source: string, dark: boolean): Promise<void> {
  await page.goto(`editor#s=${記法をURLに載せる(source)}`);
  await page.waitForSelector("svg[data-cdl-stage]", { timeout: 20_000 });
  await page.evaluate((value) => document.documentElement.classList.toggle("dark", value), dark);
  await page.waitForFunction(
    (value) => document.documentElement.classList.contains("dark") === value,
    dark,
  );
  await page.waitForTimeout(500);
}

async function ground(page: Page): Promise<string> {
  return page.locator("svg[data-cdl-stage]").evaluate((stage) => getComputedStyle(stage).backgroundColor);
}

test("図面の地は明暗で変わらず、生成りの地は変わる (#2790)", async ({ page }) => {
  await open(page, blueprintSource, false);
  const blueprintLight = await ground(page);
  await open(page, blueprintSource, true);
  const blueprintDark = await ground(page);
  expect(blueprintDark).toBe(blueprintLight);

  await open(page, er.code, false);
  const kinariLight = await ground(page);
  await open(page, er.code, true);
  const kinariDark = await ground(page);
  expect(kinariDark).not.toBe(kinariLight);
});

test("図面の舞台内で図が読む変数は明暗で全て同じ (#2790)", async ({ page }) => {
  const names = fixedVariableNames();
  expect(names.length, "固定を調べる変数を 1 件も導けていない").toBeGreaterThan(0);
  const read = async (dark: boolean): Promise<Record<string, string>> => {
    await open(page, blueprintSource, dark);
    return page.locator("svg[data-cdl-stage]").evaluate((stage, vars) => {
      const style = getComputedStyle(stage);
      return Object.fromEntries(vars.map((name) => [name, style.getPropertyValue(name).trim()]));
    }, names);
  };

  const light = await read(false);
  const dark = await read(true);
  expect(Object.keys(light)).toHaveLength(names.length);
  expect(dark).toEqual(light);
});
