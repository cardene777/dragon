import { PRESET_TYPES } from "@cardenelabs/dragon";
import { expect, type Locator, type Page } from "@playwright/test";
import { PNG } from "pngjs";

import { EDITOR_SAMPLES } from "../../src/data/editor-samples";
import { 記法をURLに載せる } from "../box-and-edge-figure";
import { effectivePaint, parseColor, readPaints, type Rgb } from "./effective-color";
import {
  THEME_PORTS,
  readFixedThemeChartSeries,
  readFixedThemeLead,
  readFixedThemeOutline,
  readFlowchartDecisionStyles,
  readThemeNotes,
  type ThemeNote,
} from "./theme-notes";
import {
  contrast,
  cores,
  luminance,
  requiredRatio,
  shoot,
  type Box,
  type Measured,
} from "./pixel-contrast";

export function color(value: string): Rgb {
  const parsed = parseColor(value);
  if (parsed === null) throw new Error(`色として読めない: ${value}`);
  return parsed.rgb;
}

export const colorKey = (value: string): string =>
  color(value).map((part) => Math.round(part)).join(",");

export function samplesByType(): Map<string, string> {
  const out = new Map<string, string>();
  for (const sample of EDITOR_SAMPLES) {
    const type = /^type:\s*([^\s#]+)/m.exec(sample.code)?.[1];
    if (type && PRESET_TYPES.has(type as never) && !out.has(type)) out.set(type, sample.code);
  }
  return out;
}

export function withTheme(source: string, theme: string): string {
  const withoutTheme = source.replace(/^(?:theme|palette):[^\n]*(?:\n|$)/gm, "");
  return withoutTheme.replace(/^(type:[^\n]*)$/m, `$1\ntheme: ${theme}`);
}

export async function openEditorTheme(
  page: Page,
  source: string,
  theme: string,
  dark: boolean,
): Promise<void> {
  await page.goto(`editor#s=${記法をURLに載せる(withTheme(source, theme))}`);
  await page.reload();
  const stoppedDocumentSurvived = await page.evaluate(
    () => "__dragonFixedThemeContrastStopped" in window,
  );
  expect(
    stoppedDocumentSurvived,
    `${theme} を開いた文書に前の図種を止めた印が残っている`,
  ).toBe(false);
  await page.waitForSelector(`svg[data-cdl-stage][data-cdl-palette="${theme}"]`, { timeout: 20_000 });
  await page.evaluate((value) => document.documentElement.classList.toggle("dark", value), dark);
  await page.waitForFunction(
    (value) => document.documentElement.classList.contains("dark") === value,
    dark,
  );
  await page.evaluate(() => document.fonts.ready);
  // 最も長い固定意匠の現れ方が終わり、終端の clip-path が外れてから測る。
  await page.waitForTimeout(700);
}

/** 写しの前に段と SVG の動きを止める。札の数は図種で違うので待たない。 */
export async function stopDiagram(page: Page): Promise<void> {
  await page.evaluate(() => {
    const w = window as unknown as {
      requestAnimationFrame: (callback: FrameRequestCallback) => number;
      setTimeout: typeof setTimeout;
      __dragonFixedThemeContrastStopped: true;
    };
    w.__dragonFixedThemeContrastStopped = true;
    w.requestAnimationFrame = () => 0;
    const maxId = Number(w.setTimeout(() => {}, 0));
    for (let id = 0; id <= maxId; id += 1) {
      clearInterval(id);
      clearTimeout(id);
    }
    for (const animation of document.getAnimations()) {
      if (animation.effect?.getComputedTiming().endTime === Infinity) animation.pause();
      else animation.finish();
    }
  });
  await page.waitForTimeout(100);
}

type VisibleText = { text: string; box: Box; px: number; weight: number };

export async function visibleTexts(page: Page): Promise<VisibleText[]> {
  return page.locator("svg[data-cdl-stage]").evaluate((stage) => {
    const out: VisibleText[] = [];
    for (const node of stage.querySelectorAll("text")) {
      const text = (node.textContent ?? "").trim();
      const rect = node.getBoundingClientRect();
      if (!text || rect.width < 1 || rect.height < 1) continue;
      let visible = true;
      let opacity = 1;
      for (let current: Element | null = node; current && current !== stage.parentElement; current = current.parentElement) {
        const style = getComputedStyle(current);
        if (style.display === "none" || style.visibility === "hidden" || style.visibility === "collapse") {
          visible = false;
          break;
        }
        opacity *= Number(style.opacity || 1);
      }
      if (!visible || opacity === 0) continue;
      const style = getComputedStyle(node);
      const ctm = (node as SVGGraphicsElement).getScreenCTM();
      const scaleY = ctm === null ? 1 : Math.hypot(ctm.c, ctm.d);
      out.push({
        text: text.slice(0, 30),
        box: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
        px: Number.parseFloat(style.fontSize) * scaleY,
        weight: Number.parseInt(style.fontWeight, 10) || 400,
      });
    }
    return out;
  });
}

export async function setAllTextHidden(page: Page, hidden: boolean): Promise<void> {
  await page.locator("svg[data-cdl-stage]").evaluate((stage, hide) => {
    for (const node of stage.querySelectorAll<SVGTextElement>("text")) {
      if (hide) {
        node.dataset.themeTestVisibility = node.style.visibility;
        node.style.visibility = "hidden";
      } else {
        node.style.visibility = node.dataset.themeTestVisibility ?? "";
        delete node.dataset.themeTestVisibility;
      }
    }
  }, hidden);
}

export function measureStrongestCore(visible: PNG, hidden: PNG, range: Box): Measured {
  const candidates = cores(visible, hidden, range);
  if (candidates.kind !== "ok") return candidates;

  let strongest: Extract<Measured, { kind: "ok" }> | null = null;
  let largestDifference = -1;
  for (const pixel of candidates.画素) {
    const difference = Math.abs(luminance(pixel.fg) - luminance(pixel.bg));
    if (difference <= largestDifference) continue;
    largestDifference = difference;
    strongest = { kind: "ok", ...pixel, ratio: contrast(pixel.fg, pixel.bg) };
  }
  return strongest ?? { kind: "unmeasurable", reason: "字の芯を特定できない" };
}

export async function checkTextContrast(
  page: Page,
  type: string,
  mode: string,
): Promise<{ measured: number; failures: string[] }> {
  await stopDiagram(page);
  const stageBox = await page.locator("svg[data-cdl-stage]").boundingBox();
  if (!stageBox) return { measured: 0, failures: [`${type}/${mode}: 舞台の矩形が無い`] };
  const viewport = page.viewportSize();
  if (!viewport) return { measured: 0, failures: [`${type}/${mode}: viewport の矩形が無い`] };
  if (
    stageBox.x < 0 || stageBox.y < 0 ||
    stageBox.x + stageBox.width > viewport.width ||
    stageBox.y + stageBox.height > viewport.height
  ) {
    return {
      measured: 0,
      failures: [
        `${type}/${mode}: 舞台 (${stageBox.x.toFixed(1)}, ${stageBox.y.toFixed(1)}, ` +
        `${stageBox.width.toFixed(1)} × ${stageBox.height.toFixed(1)}) が viewport ` +
        `(${viewport.width} × ${viewport.height}) に収まらない`,
      ],
    };
  }
  const texts = await visibleTexts(page);

  await setAllTextHidden(page, true);
  const hidden = await shoot(page, stageBox);
  await setAllTextHidden(page, false);
  const visible = await shoot(page, stageBox);
  const originX = Math.floor(stageBox.x);
  const originY = Math.floor(stageBox.y);
  const cssWidth = Math.ceil(stageBox.x + stageBox.width) - originX;
  const scale = visible.width / cssWidth;
  expect(scale, `${type}/${mode}: 写しの拡大率`).toBeCloseTo(FIXED_THEME_DEVICE_SCALE_FACTOR, 5);
  const failures: string[] = [];
  let measured = 0;
  for (const text of texts) {
    const range = {
      x: (text.box.x - originX) * scale,
      y: (text.box.y - originY) * scale,
      width: text.box.width * scale,
      height: text.box.height * scale,
    };
    const result = measureStrongestCore(visible, hidden, range);
    const need = requiredRatio(text.px, text.weight);
    if (result.kind === "ok") {
      measured += 1;
      if (result.ratio < need) {
        failures.push(
          `${type}/${mode}/${text.text}: rgb(${result.fg.join(",")}) on rgb(${result.bg.join(",")}) ` +
          `${result.ratio.toFixed(2)}:1 < ${need}:1`,
        );
      }
    } else failures.push(`${type}/${mode}/${text.text}: ${result.kind}`);
  }
  return { measured, failures };
}

export function fixedThemes(): Array<Extract<ThemeNote, { mode: "fixed" }>> {
  return [...readThemeNotes().values()].filter(
    (note): note is Extract<ThemeNote, { mode: "fixed" }> => note.mode === "fixed",
  );
}

export const BOX_PAINT_SELECTOR = [
  '[data-cdl-role="node-body"]:not([data-cdl-look]):not([data-cdl-mark]):is(rect, path, ellipse, circle, polygon, polyline, line)',
  '[data-cdl-role="node-body"]:not([data-cdl-look]):not([data-cdl-mark]) > rect',
  '[data-cdl-role="node-body"]:not([data-cdl-look]):not([data-cdl-mark]) > path',
  '[data-cdl-role="node-body"]:not([data-cdl-look]):not([data-cdl-mark]) > ellipse',
  '[data-cdl-role="node-body"]:not([data-cdl-look]):not([data-cdl-mark]) > circle',
  '[data-cdl-role="node-body"]:not([data-cdl-look]):not([data-cdl-mark]) > g:not(:where([data-cdl-role="node-kind-icon"])) > rect',
  '[data-cdl-role="node-body"]:not([data-cdl-look]):not([data-cdl-mark]) > g:not(:where([data-cdl-role="node-kind-icon"])) > path',
  '[data-cdl-role="node-body"]:not([data-cdl-look]):not([data-cdl-mark]) > g:not(:where([data-cdl-role="node-kind-icon"])) > ellipse',
  '[data-cdl-role="node-body"]:not([data-cdl-look]):not([data-cdl-mark]) > g:not(:where([data-cdl-role="node-kind-icon"])) > circle',
].join(", ");

type FixedTheme = Extract<ThemeNote, { mode: "fixed" }>;
type ShapeContrast = { boxes: number; halfFrames: number; outlineless: number; lines: number; failures: string[] };

const flowchartDecisionStyles = readFlowchartDecisionStyles();

function paintMatches(actual: string, expected: string): boolean {
  return expected === "none" ? parseColor(actual) === null : colorKey(actual) === colorKey(expected);
}

export async function checkBoxAndLineContrast(
  page: Page,
  stage: Locator,
  type: string,
  mode: string,
  note: FixedTheme,
  lead: string,
): Promise<ShapeContrast> {
  await stopDiagram(page);
  const groundValue = await stage.evaluate((element) => getComputedStyle(element).backgroundColor);
  const ground = color(groundValue);
  const palette = new Set([...Object.values(note.value), lead].map(colorKey));
  const failures: string[] = [];
  const readBoxes = await stage.locator(BOX_PAINT_SELECTOR).evaluateAll(readPaints);
  const outline = readFixedThemeOutline().get(note.name) ?? "frame";
  if (outline === "none") {
    for (const paint of readBoxes) {
      const stroke = parseColor(paint.stroke);
      const visibleStroke = (stroke?.alpha ?? 0) * paint.strokeOpacity * paint.opacity;
      if (visibleStroke > 0) {
        failures.push(
          `${type}/${mode}: 箱 ${paint.node ?? "不明"} (${paint.kind ?? "不明"}) が縁線を引いている ` +
          `(stroke ${paint.stroke} / stroke-opacity ${paint.strokeOpacity} / opacity ${paint.opacity})`,
        );
      }
      if (colorKey(paint.fill) !== colorKey(note.value.face)) {
        failures.push(
          `${type}/${mode}: 箱 ${paint.node ?? "不明"} (${paint.kind ?? "不明"}) ` +
          `fill ${paint.fill} / 箱の面 ${note.value.face}`,
        );
      }
    }

    const readLines = await stage.locator('[data-cdl-role="edge-line"]').evaluateAll(readPaints);
    const lines = readLines.filter((paint) => parseColor(paint.stroke) !== null);
    for (const paint of lines) {
      if (!palette.has(colorKey(paint.stroke))) {
        failures.push(`${type}/${mode}: 線 ${paint.stroke} が意匠帳の 9 色と一に無い`);
      }
      if (!paint.rendered) continue;
      const effective = effectivePaint({ ...paint, fill: "none" }, ground);
      if (effective.frame === null) continue;
      const ratio = contrast(effective.frame, ground);
      if (ratio < 3) {
        failures.push(
          `${type}/${mode}: 線 ${paint.stroke} の実効は台と ${ratio.toFixed(2)}:1 < 3 ` +
          `(stroke-opacity ${paint.strokeOpacity} / opacity ${paint.opacity})`,
        );
      }
    }

    return {
      boxes: readBoxes.length,
      halfFrames: 0,
      outlineless: readBoxes.length,
      lines: lines.length,
      failures,
    };
  }
  const boxes = readBoxes.filter((paint) => parseColor(paint.stroke) !== null);
  let halfFrames = 0;
  for (const paint of boxes) {
    const attrOpacity = paint.attrStrokeOpacity === null ? null : Number(paint.attrStrokeOpacity);
    if (attrOpacity !== null && attrOpacity < 1) halfFrames += 1;

    const decisionStyle =
      type === "flowchart" && paint.kind === "decision" && !paint.active
        ? flowchartDecisionStyles.get(note.name)
        : undefined;
    const expectedFrame = decisionStyle?.frame ?? note.value.frame;
    const expectedFace = decisionStyle?.face ?? note.value.face;
    const strokeMatches = paint.active
      ? palette.has(colorKey(paint.stroke))
      : paintMatches(paint.stroke, expectedFrame);
    const widthMatches = decisionStyle === undefined || paint.strokeWidth === decisionStyle.width;
    if (!strokeMatches || !paintMatches(paint.fill, expectedFace) || !widthMatches) {
      failures.push(
        `${type}/${mode}: 箱 ${paint.node ?? "不明"} (${paint.kind ?? "不明"}) ` +
        `stroke ${paint.stroke} / fill ${paint.fill} / stroke-width ${paint.strokeWidth}`,
      );
    }
    if (!paint.rendered) continue;
    const effective = effectivePaint(paint, ground);
    if (effective.frame === null) continue;
    const ratio = contrast(effective.frame, effective.face);
    if (ratio < 4.61) {
      failures.push(
        `${type}/${mode}: 箱の枠 ${paint.node ?? "不明"} (${paint.kind ?? "不明"}) ` +
        `実効 ${ratio.toFixed(2)}:1 < 4.61 (stroke ${paint.stroke} / ` +
        `stroke-opacity ${paint.strokeOpacity} / opacity ${paint.opacity})`,
      );
    }
  }

  const readLines = await stage.locator('[data-cdl-role="edge-line"]').evaluateAll(readPaints);
  const lines = readLines.filter((paint) => parseColor(paint.stroke) !== null);
  for (const paint of lines) {
    if (!palette.has(colorKey(paint.stroke))) {
      failures.push(`${type}/${mode}: 線 ${paint.stroke} が意匠帳の 9 色と一に無い`);
    }
    if (!paint.rendered) continue;
    const effective = effectivePaint({ ...paint, fill: "none" }, ground);
    if (effective.frame === null) continue;
    const ratio = contrast(effective.frame, ground);
    if (ratio < 3) {
      failures.push(
        `${type}/${mode}: 線 ${paint.stroke} の実効は台と ${ratio.toFixed(2)}:1 < 3 ` +
        `(stroke-opacity ${paint.strokeOpacity} / opacity ${paint.opacity})`,
      );
    }
  }

  return { boxes: boxes.length, halfFrames, outlineless: 0, lines: lines.length, failures };
}

export const FIXED_THEME_DEVICE_SCALE_FACTOR = 3;

export type FixedThemeAcrossTypesResult = {
  applied: number;
  boxTypes: number;
  edgeTypes: number;
  halfFrames: number;
  outlineless: number;
  failures: string[];
  groundByType: Map<string, string>;
};

export async function checkFixedThemeAcrossTypes(
  page: Page,
  note: FixedTheme,
  dark: boolean,
): Promise<FixedThemeAcrossTypesResult> {
  const mode = dark ? "暗" : "明";
  const samples = samplesByType();
  const lead = readFixedThemeLead().get(note.name);
  if (!lead) throw new Error(`${note.name} の一を読めない`);
  const expectedChart = readFixedThemeChartSeries().get(note.name);
  if (!expectedChart) throw new Error(`${note.name} の図表の系列色を読めない`);
  const failures: string[] = [];
  const groundByType = new Map<string, string>();
  let applied = 0;
  let boxTypes = 0;
  let edgeTypes = 0;
  let halfFrames = 0;
  let outlineless = 0;

  for (const [type, source] of samples) {
    await openEditorTheme(page, source, note.name, dark);
    const stage = page.locator(`svg[data-cdl-stage][data-cdl-palette="${note.name}"]`);
    if ((await stage.count()) === 1) applied += 1;
    const stageValues = await stage.evaluate((element, ports) => {
      const style = getComputedStyle(element);
      return {
        ground: style.backgroundColor,
        now: style.getPropertyValue("--cdl-now").trim(),
        chart: Array.from({ length: 6 }, (_, index) =>
          style.getPropertyValue(`--cdl-chart-${index + 1}`).trim()),
        ports: Object.fromEntries(ports.map((port) => [port, style.getPropertyValue(`--er-${port}`).trim()])),
      };
    }, [...THEME_PORTS]);
    groundByType.set(type, stageValues.ground);
    if (colorKey(stageValues.ground) !== colorKey(note.value.ground)) {
      failures.push(`${type}/${mode}: 舞台 ${stageValues.ground} / 台 ${note.value.ground}`);
    }
    if (colorKey(stageValues.now) !== colorKey(lead)) {
      failures.push(`${type}/${mode}: --cdl-now ${stageValues.now} / 一 ${lead}`);
    }
    for (const [index, expected] of expectedChart.colors.entries()) {
      const actual = stageValues.chart[index] ?? "";
      if (colorKey(actual) !== colorKey(expected)) {
        failures.push(`${type}/${mode}: --cdl-chart-${index + 1} ${actual} / ${expected}`);
      }
    }
    for (const port of THEME_PORTS) {
      if (colorKey(stageValues.ports[port] ?? "") !== colorKey(note.value[port])) {
        failures.push(`${type}/${mode}: --er-${port} ${stageValues.ports[port]} / ${note.value[port]}`);
      }
    }

    const shapes = await checkBoxAndLineContrast(page, stage, type, mode, note, lead);
    if (shapes.boxes > 0) boxTypes += 1;
    if (shapes.lines > 0) edgeTypes += 1;
    halfFrames += shapes.halfFrames;
    outlineless += shapes.outlineless;
    failures.push(...shapes.failures);

    const text = await checkTextContrast(page, type, mode);
    if (text.measured === 0 && text.failures.length === 0) {
      failures.push(`${type}/${mode}: 字を 1 件も測れていない`);
    }
    failures.push(...text.failures);
  }

  return { applied, boxTypes, edgeTypes, halfFrames, outlineless, failures, groundByType };
}
