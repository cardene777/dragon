import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";

import { expect, test } from "@playwright/test";

import {
  CHROMIUM_LAUNCH_ARGS,
  PALETTES,
  REFERENCE_FIGURES,
  compareFigures,
  compareFiguresWithWorkers,
  readCssInputs,
  type CssPair,
  type FigureInput,
} from "../scripts/theme-css-equivalence.mjs";
import { countReferenceFixtureFiles } from "../scripts/theme-css-equivalence-core.mjs";

const REPO = resolve(import.meta.dirname, "../../..");
const FIXTURES = resolve(import.meta.dirname, "fixtures/theme-css-equivalence");
const LONG_TIMEOUT = 6 * 60 * 60 * 1000;
const args = [...CHROMIUM_LAUNCH_ARGS];

interface FiguresFixture {
  figures: FigureInput[];
}

interface PositiveControl {
  file: string;
  search: string;
  replacement: string;
  figure: FigureInput;
  palette: string;
  expected: {
    elementAttribute: string;
    elementValue: string;
    property: string;
  };
}

function fixture<T>(name: string): T {
  return JSON.parse(readFileSync(resolve(FIXTURES, name), "utf8")) as T;
}

function configuredBaseUrl(value: string | undefined): string {
  if (value === undefined) throw new Error("playwright.config.ts の dev project に baseURL が必要");
  return value;
}

function changedCss(source: CssPair, control: PositiveControl): CssPair {
  const original = source[control.file];
  if (original === undefined) throw new Error(`陽性対照の CSS がありません: ${control.file}`);
  const occurrences = original.split(control.search).length - 1;
  expect(occurrences, "陽性対照の置換元は1箇所だけでなければならない").toBe(1);
  return { ...source, [control.file]: original.replace(control.search, control.replacement) };
}

function comparisonWorkerCount(): number {
  const raw = process.env.THEME_CSS_EQUIVALENCE_WORKERS ?? "4";
  const value = Number(raw);
  if (!Number.isInteger(value) || value < 1) {
    throw new Error(`THEME_CSS_EQUIVALENCE_WORKERS は 1 以上の整数で指定する: ${raw}`);
  }
  return value;
}

test.describe.configure({ mode: "serial" });
test.use({ launchOptions: { args } });
test.setTimeout(LONG_TIMEOUT);

test("同一CSSは全状態の計算後の値と静的見本相当の画素が一致する", async ({ browser, baseURL }) => {
  const serverUrl = configuredBaseUrl(baseURL);
  const figures = fixture<FiguresFixture>("figures.json").figures;
  expect(figures.length, "先に theme-css-equivalence.mjs の「選ぶ」modeで figures.json を作る").toBeGreaterThan(0);
  const current = readCssInputs({ repoRoot: REPO }).newCss;
  const referencePageCount = countReferenceFixtureFiles(
    readdirSync(resolve(REPO, "docs/design/proposal/static")),
    new Set(REFERENCE_FIGURES.map((figure) => figure.kind)),
    PALETTES.filter((palette) => palette.reference).map((palette) => palette.label),
  );
  expect(referencePageCount).toBeGreaterThan(0);

  const result = await compareFiguresWithWorkers(browser, {
    baseUrl: serverUrl,
    figures,
    oldCss: current,
    newCss: current,
    workers: comparisonWorkerCount(),
  });

  expect(result.differences).toHaveLength(0);
  expect(result.variableDifferences).toHaveLength(0);
  expect(result.incomparableStates).toHaveLength(0);
  expect(result.stateCount).toBe(result.expectedStateCount);
  expect(result.captureModes.settled + result.captureModes.timed).toBe(result.stateCount);
  expect(result.smil.states).toHaveLength(result.stateCount);
  expect(result.smil.pausedSvgCount).toBeGreaterThan(0);
  expect(result.smil.smilElementCount).toBeGreaterThan(0);
  expect(result.pixels.referencePageCount).toBe(referencePageCount);
  expect(result.pixels.comparisons).toBeGreaterThan(0);
  expect(result.pixels.differentPixels).toBe(0);
});

test("陽性対照は図面の棒のstrokeを旧値と新値つきで名指しする", async ({ page, baseURL }) => {
  const serverUrl = configuredBaseUrl(baseURL);
  const control = fixture<PositiveControl>("positive-control.json");
  const oldCss = readCssInputs({ repoRoot: REPO }).newCss;
  const result = await compareFigures(page, {
    baseUrl: serverUrl,
    figures: [control.figure],
    oldCss,
    newCss: changedCss(oldCss, control),
    palettes: [control.palette],
    pixelComparison: false,
  });

  const named = result.differences.filter((difference) => {
    const element = difference.element as { dataAttributes?: Record<string, string> } | undefined;
    return difference.palette === control.palette &&
      difference.property === control.expected.property &&
      element?.dataAttributes?.[control.expected.elementAttribute] === control.expected.elementValue &&
      typeof difference.oldValue === "string" &&
      typeof difference.newValue === "string" &&
      difference.oldValue !== difference.newValue;
  });
  expect(named.length).toBeGreaterThan(0);
  expect(result.incomparableStates).toHaveLength(0);
  expect(result.stateCount).toBe(result.expectedStateCount);
});

test("規則の当たり方は全規則を命中か未命中へ分類する", async ({ page, baseURL }) => {
  const serverUrl = configuredBaseUrl(baseURL);
  const control = fixture<PositiveControl>("positive-control.json");
  const current = readCssInputs({ repoRoot: REPO }).newCss;
  const result = await compareFigures(page, {
    baseUrl: serverUrl,
    figures: [control.figure],
    oldCss: current,
    newCss: current,
    palettes: ["blueprint"],
    pixelComparison: false,
  });

  expect(result.coverage.total).toBe(result.coverage.matched + result.coverage.unmatched);
  expect(result.coverage.unclassified).toBe(0);
});
