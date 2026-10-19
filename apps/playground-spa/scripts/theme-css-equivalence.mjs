#!/usr/bin/env node
/**
 * 同じ見本帳 DOM へ旧 CSS と新 CSS を順に当て、計算後の値と画素を比較する。
 * Vite 開発 server が file ごとに作る style 要素を使うため、build 済み preview では動かない。
 */
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { chromium } from "playwright";
import pngjs from "pngjs";

import {
  CHROMIUM_LAUNCH_ARGS,
  COMPARISON_PROPERTIES,
  collectCssVariableNames,
  completedSelectionKeys,
  compareComputedSnapshots,
  expectedStateCount,
  greedySelectFigures,
  normalizeSelectorForCoverage,
  parseCssRules,
  phaseResetStatus,
  recordSelectionResult,
  resolvePhaseCount,
  selectionCacheForCss,
  stateCaptureDecision,
  summarizeCoverage,
  whileSmilAnimationsPaused,
} from "./theme-css-equivalence-core.mjs";

export { CHROMIUM_LAUNCH_ARGS, COMPARISON_PROPERTIES } from "./theme-css-equivalence-core.mjs";

const { PNG } = pngjs;
const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(HERE, "../../..");
const FIXTURES = resolve(REPO, "apps/playground-spa/tests/fixtures/theme-css-equivalence");
const STYLE_FILES = Object.freeze([
  "apps/playground-spa/src/styles/cdl-theme.css",
  "apps/playground-spa/src/styles/theme-motion.css",
]);
const CLOCK_STEP_MS = 100;
const MAX_CATALOG_WAIT_MS = 15_000;
const MAX_DRAWABLE_WAIT_MS = 15_000;
const MAX_PHASE_WAIT_MS = 120_000;
const DEFAULT_WORKERS = 4;
const CLOCK_TIME = new Date("2026-10-14T09:00:00+09:00");

export const PALETTES = Object.freeze([
  { value: "blueprint", label: "図面", reference: true },
  { value: "letterpress", label: "活版", reference: true },
  { value: "catalog", label: "図録", reference: true },
  { value: "terminal", label: "端末", reference: true },
  { value: "sketch", label: "手描き", reference: true },
  { value: "neon", label: "電飾", reference: true },
  { value: "relief", label: "浮彫", reference: true },
]);

/**
 * 静的見本が表す種と見本帳の図。
 * charts の複数項目は、1 枚の静的見本に並ぶ複数の図形をそれぞれ受け持つ。
 */
export const REFERENCE_FIGURES = Object.freeze([
  { kind: "路線", page: "presets", itemId: "delivery-metro-demo", evidence: "presets.cdl.ts の題「荷物を届ける路線」と match.json" },
  { kind: "図表", page: "charts", itemId: "荷物の状態", evidence: "charts.cdl.ts の pie 定義と match.json" },
  { kind: "図表", page: "charts", itemId: "営業所ごとの取扱数", evidence: "charts.cdl.ts の bar 定義の題と図表見本の棒" },
  { kind: "図表", page: "charts", itemId: "月ごとの配達数", evidence: "charts.cdl.ts の line 定義の題と図表見本の折れ線" },
  { kind: "段箱", page: "presets", itemId: "delivery-stages-demo", evidence: "presets.cdl.ts の題「荷物を届ける段階」と match.json" },
  { kind: "時間軸", page: "presets", itemId: "delivery-timeline-demo", evidence: "presets.cdl.ts の題「荷物を届ける順番」と match.json" },
  { kind: "流れ", page: "presets", itemId: "delivery-flow-demo", evidence: "presets.cdl.ts の flowchart 定義と stage-theme-contract.test.ts" },
  { kind: "関係", page: "presets", itemId: "delivery-relations-demo", evidence: "presets.cdl.ts の題「契約と荷物と配送状態の関係」" },
  { kind: "型", page: "presets", itemId: "delivery-classes-demo", evidence: "presets.cdl.ts の題「荷物を運ぶ型」" },
  { kind: "構成", page: "presets", itemId: "delivery-components-demo", evidence: "presets.cdl.ts の題「配送システムの部品」" },
  { kind: "順序", page: "presets", itemId: "delivery-sequence-demo", evidence: "presets.cdl.ts の題「集荷から配達までの呼び出し順」" },
  { kind: "階層", page: "charts", itemId: "営業所の階層", evidence: "charts.cdl.ts の tree 定義の題" },
  { kind: "階層", page: "charts", itemId: "再配達を減らす", evidence: "charts.cdl.ts の mind 定義の題" },
  { kind: "工程", page: "charts", itemId: "仕分け棚を入れ替える工程", evidence: "charts.cdl.ts の gantt 定義の題" },
  { kind: "工程", page: "charts", itemId: "荷主の気持ち", evidence: "charts.cdl.ts の journey 定義の題" },
  { kind: "数", page: "charts", itemId: "申し込みから届くまで", evidence: "charts.cdl.ts の funnel 定義の題" },
  { kind: "数", page: "charts", itemId: "打ち手の手間と効き目", evidence: "charts.cdl.ts の quadrant 定義の題" },
  { kind: "数", page: "charts", itemId: "営業所ごとの定時率", evidence: "charts.cdl.ts の slope 定義の題" },
  { kind: "数", page: "charts", itemId: "定時に届いた割合", evidence: "charts.cdl.ts の gauge 定義の題" },
  { kind: "数", page: "charts", itemId: "配達の結果", evidence: "charts.cdl.ts の stacked 定義の題" },
]);

const referenceByKey = new Map();
for (const figure of REFERENCE_FIGURES) {
  const key = `${figure.page}/${figure.itemId}`;
  const current = referenceByKey.get(key) ?? { kinds: [], evidence: [] };
  current.kinds.push(figure.kind);
  current.evidence.push(figure.evidence);
  referenceByKey.set(key, current);
}

class FigureTraversalError extends Error {}

class FigureWithoutCdlSvgError extends Error {
  constructor(message, stageSummary) {
    super(message);
    this.stageSummary = stageSummary;
  }
}

function cssObject(input) {
  if (!input || typeof input !== "object") return null;
  const theme = input[STYLE_FILES[0]] ?? input["cdl-theme.css"] ?? input.theme;
  const motion = input[STYLE_FILES[1]] ?? input["theme-motion.css"] ?? input.motion;
  if (typeof theme !== "string" || typeof motion !== "string") {
    throw new Error("CSS の直接指定には cdl-theme.css と theme-motion.css の両方が必要です");
  }
  return { [STYLE_FILES[0]]: theme, [STYLE_FILES[1]]: motion };
}

/** git 基準または直接渡された文字列から旧 CSS と新 CSS を読む。 */
export function readCssInputs(options = {}) {
  const repoRoot = options.repoRoot ?? REPO;
  const baseline = options.baseline ?? process.env.THEME_CSS_BASE ?? "origin/main";
  const directOld = cssObject(options.oldCss);
  const directNew = cssObject(options.newCss);
  const oldCss = directOld ?? Object.fromEntries(
    STYLE_FILES.map((path) => [
      path,
      execFileSync("git", ["show", `${baseline}:${path}`], { cwd: repoRoot, encoding: "utf8" }),
    ]),
  );
  const newCss = directNew ?? Object.fromEntries(
    STYLE_FILES.map((path) => [path, readFileSync(resolve(repoRoot, path), "utf8")]),
  );
  return { baseline, oldCss, newCss };
}

/** Vite 開発 server が file ごとに挿入した style の中身を差し替える。 */
export async function applyThemeCss(page, css) {
  const replaced = await page.evaluate(({ entries, paths }) => {
    const found = [];
    for (const style of document.querySelectorAll("style[data-vite-dev-id]")) {
      const raw = style.getAttribute("data-vite-dev-id") ?? "";
      const clean = decodeURIComponent(raw).split("?", 1)[0].replaceAll("\\", "/");
      const path = paths.find((candidate) => clean.endsWith(`/${candidate.replace("apps/playground-spa/", "")}`));
      if (!path) continue;
      style.textContent = entries[path];
      found.push(path);
    }
    return found;
  }, { entries: css, paths: STYLE_FILES });
  const missing = STYLE_FILES.filter((path) => !replaced.includes(path));
  if (missing.length > 0) {
    throw new Error(`対象 CSS の style 要素がありません。開発サーバーを使ってください: ${missing.join(", ")}`);
  }
}

function catalogUrl(baseUrl, pageName) {
  const base = new URL(baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`);
  return new URL(`catalog/${pageName}`, base).toString();
}

function catalogIndexUrl(baseUrl) {
  const base = new URL(baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`);
  return new URL("catalog", base).toString();
}

async function preparePage(page) {
  await page.clock.install({ time: CLOCK_TIME });
  await page.clock.pauseAt(CLOCK_TIME);
  await page.setViewportSize({ width: 1440, height: 1000 });
}

async function stageState(page) {
  return page.evaluate(() => {
    const stage = document.querySelector(".catalog-preview-stage:not([hidden])");
    const svg = stage?.querySelector("svg[data-cdl-stage]");
    const rawPhase = svg?.closest("[data-cdl-diagram]")?.getAttribute("data-cdl-phase-index") ?? null;
    const phase = rawPhase !== null && /^\d+$/.test(rawPhase) ? Number(rawPhase) : null;
    let summary = null;
    if (svg) {
      const body = svg.innerHTML;
      // DOM 本文を Node へ渡さず、独立した 2 hash と長さだけを返して衝突も抑える。
      let firstHash = 2166136261;
      let secondHash = 5381;
      for (let index = 0; index < body.length; index += 1) {
        const code = body.charCodeAt(index);
        firstHash ^= code;
        firstHash = Math.imul(firstHash, 16777619);
        secondHash = Math.imul(secondHash, 33) ^ code;
      }
      const first = (firstHash >>> 0).toString(16).padStart(8, "0");
      const second = (secondHash >>> 0).toString(16).padStart(8, "0");
      summary = { length: body.length, hash: `${first}${second}` };
    }
    return {
      hasStage: stage !== null,
      hasSvg: svg !== null,
      phase,
      rawPhase,
      palette: svg?.getAttribute("data-cdl-palette") ?? null,
      phaseSegmentCount: stage?.querySelectorAll(".cdl-phase-seg").length ?? 0,
      summary,
    };
  });
}

async function stageContentsSummary(page) {
  return page.evaluate(() => {
    const stage = document.querySelector(".catalog-preview-stage:not([hidden])");
    if (!stage) return null;
    const elements = [...stage.querySelectorAll("*")];
    const describe = (element) => {
      const id = element.id ? `#${element.id}` : "";
      const classes = [...element.classList].map((name) => `.${name}`).join("");
      const data = [...element.attributes]
        .filter((attribute) => attribute.name.startsWith("data-"))
        .map((attribute) => `[${attribute.name}${attribute.value === "" ? "" : `=${JSON.stringify(attribute.value)}`}]`)
        .join("");
      return `${element.tagName.toLowerCase()}${id}${classes}${data}`;
    };
    const tagCounts = {};
    for (const element of elements) {
      const tag = element.tagName.toLowerCase();
      tagCounts[tag] = (tagCounts[tag] ?? 0) + 1;
    }
    return {
      elementCount: elements.length,
      tagCounts,
      topLevel: [...stage.children].map(describe),
      svgElements: elements.filter((element) => element.tagName.toLowerCase() === "svg").map(describe),
    };
  });
}

function figureLabel(figure) {
  return `${figure.page}/${figure.itemId}`;
}

function stateLabel(figure, palette, phase) {
  return `${figureLabel(figure)}、色味 ${palette}、段 ${phase}`;
}

function errorMessage(error) {
  return error instanceof Error ? error.message : String(error);
}

async function waitForCatalogRows(page, pageName, itemId) {
  const rows = itemId === undefined
    ? page.locator(".catalog-list-item")
    : page.locator(`.catalog-list-item[data-item-id=${JSON.stringify(itemId)}]`);
  for (let elapsed = 0; elapsed <= MAX_CATALOG_WAIT_MS; elapsed += CLOCK_STEP_MS) {
    if (await rows.count() > 0) return;
    await page.clock.runFor(CLOCK_STEP_MS);
  }
  throw new FigureTraversalError(`見本帳の行が ${MAX_CATALOG_WAIT_MS}ms 内に出ません: 頁 ${pageName}、item id ${itemId ?? "<一覧取得前>"}`);
}

async function waitForDrawable(page, figure) {
  let reason = "svg が出ない";
  let lastState;
  for (let elapsed = 0; elapsed <= MAX_DRAWABLE_WAIT_MS; elapsed += CLOCK_STEP_MS) {
    const state = await stageState(page);
    lastState = state;
    if (!state.hasStage) reason = "表示中の stage が無い";
    else if (!state.hasSvg) reason = "svg が出ない";
    else if (state.phase === null) reason = `段の札 data-cdl-phase-index が読めない (${String(state.rawPhase)})`;
    else return state;
    await page.clock.runFor(CLOCK_STEP_MS);
  }
  if (lastState?.hasStage && !lastState.hasSvg) {
    throw new FigureWithoutCdlSvgError(
      `cdl の図を持たない行: 頁 ${figure.page}、item id ${figure.itemId}`,
      await stageContentsSummary(page),
    );
  }
  throw new FigureTraversalError(`描けない図: 頁 ${figure.page}、item id ${figure.itemId}、理由 ${reason}`);
}

async function openFigure(page, baseUrl, figure, initialCss) {
  await page.goto(catalogUrl(baseUrl, figure.page), { waitUntil: "networkidle" });
  await waitForCatalogRows(page, figure.page, figure.itemId);
  await applyThemeCss(page, initialCss);

  const row = page.locator(`.catalog-list-item[data-item-id=${JSON.stringify(figure.itemId)}]`).first();
  if ((await row.count()) === 0) {
    throw new FigureTraversalError(`見本帳の図がありません: 頁 ${figure.page}、item id ${figure.itemId}`);
  }
  try {
    await row.click();
  } catch (error) {
    throw new FigureTraversalError(`描けない図: 頁 ${figure.page}、item id ${figure.itemId}、理由 行を押せない: ${errorMessage(error)}`);
  }
  await waitForDrawable(page, figure);
  await page.evaluate(() => document.fonts.ready);
  return {
    stage: page.locator(".catalog-preview-stage:not([hidden])").first(),
  };
}

async function configureCombination(page, figure, palette) {
  const paletteOption = PALETTES.find((entry) => entry.value === palette);
  if (!paletteOption) throw new Error(`色味が不明です: ${palette}`);
  try {
    await page.getByRole("combobox", { name: "図の色味" }).selectOption({ label: paletteOption.label });
  } catch (error) {
    throw new FigureTraversalError(`${figureLabel(figure)} の色味欄を操作できません: ${errorMessage(error)}`);
  }
  for (let elapsed = 0; elapsed <= MAX_DRAWABLE_WAIT_MS; elapsed += CLOCK_STEP_MS) {
    const value = (await stageState(page)).palette;
    if (value === palette) return;
    await page.clock.runFor(CLOCK_STEP_MS);
  }
  throw new FigureTraversalError(`${figureLabel(figure)} を色味 ${paletteOption.label} に切り替えられません`);
}

async function waitForPhaseZero(page, figure, palette, phaseCount) {
  const initial = await stageState(page);
  if (initial.phase === null) {
    throw new FigureTraversalError(`${stateLabel(figure, palette, 0)}: data-cdl-phase-index が読めません`);
  }
  let sawNonZero = false;
  for (let elapsed = 0; elapsed <= MAX_PHASE_WAIT_MS; elapsed += CLOCK_STEP_MS) {
    const state = await stageState(page);
    if (state.phase === null) {
      throw new FigureTraversalError(`${stateLabel(figure, palette, 0)}: data-cdl-phase-index が読めません`);
    }
    const status = phaseResetStatus(phaseCount, initial.phase, state.phase, sawNonZero);
    sawNonZero = status.sawNonZero;
    if (status.ready) return;
    await page.clock.runFor(CLOCK_STEP_MS);
  }
  throw new FigureTraversalError(`${stateLabel(figure, palette, 0)}: 段 0 に ${MAX_PHASE_WAIT_MS}ms 内で戻りません`);
}

async function validateUnlabeledSinglePhase(page, figure, palette) {
  let observedPhase = 0;
  for (let elapsed = 0; elapsed <= MAX_PHASE_WAIT_MS; elapsed += CLOCK_STEP_MS) {
    const state = await stageState(page);
    if (state.phase === null) {
      throw new FigureTraversalError(`${stateLabel(figure, palette, 0)}: data-cdl-phase-index が読めません`);
    }
    observedPhase = state.phase;
    if (observedPhase !== 0 || elapsed === MAX_PHASE_WAIT_MS) break;
    await page.clock.runFor(CLOCK_STEP_MS);
  }

  const decision = resolvePhaseCount(0, observedPhase !== 0);
  if (decision.status === "unreadable") {
    throw new FigureTraversalError(
      `${stateLabel(figure, palette, 0)}: ${decision.reason} (観測した段 ${observedPhase})`,
    );
  }
}

async function settleAtPhase(page, figure, palette, target) {
  let previousKey = null;
  let stable = 0;
  for (let elapsed = 0; ; elapsed += CLOCK_STEP_MS) {
    const state = await stageState(page);
    if (state.phase === null || state.summary === null) {
      throw new FigureTraversalError(`${stateLabel(figure, palette, target)}: svg の要約または段の札が読めません`);
    }
    const phaseChanged = state.phase !== target;
    if (!phaseChanged) {
      const key = `${state.summary.length}:${state.summary.hash}`;
      stable = key === previousKey ? stable + 1 : 1;
      previousKey = key;
    }
    const decision = stateCaptureDecision(elapsed, stable, phaseChanged);
    if (decision.status === "advanced") {
      throw new FigureTraversalError(`${stateLabel(figure, palette, target)}: 静止前に段 ${state.phase} へ進みました`);
    }
    if (decision.status === "capture") return decision.mode;
    await page.clock.runFor(CLOCK_STEP_MS);
  }
}

async function waitForNextPhase(page, figure, palette, current) {
  for (let elapsed = 0; elapsed <= MAX_PHASE_WAIT_MS; elapsed += CLOCK_STEP_MS) {
    await page.clock.runFor(CLOCK_STEP_MS);
    const state = await stageState(page);
    if (state.phase === null) {
      throw new FigureTraversalError(`${stateLabel(figure, palette, current)}: data-cdl-phase-index が読めません`);
    }
    if (state.phase === current) continue;
    if (state.phase !== current + 1) {
      throw new FigureTraversalError(`${stateLabel(figure, palette, current)}: 次の段 ${current + 1} を飛ばして段 ${state.phase} へ進みました`);
    }
    return;
  }
  throw new FigureTraversalError(`${stateLabel(figure, palette, current)}: 次の段へ ${MAX_PHASE_WAIT_MS}ms 内に進みません`);
}

async function forEachFigureState(page, options, visit) {
  const palettes = options.palettes ?? PALETTES.map((entry) => entry.value);
  let phaseCount;
  let phaseSegmentCount;
  let singlePhaseCaptureMode;
  let unlabeledPalette;
  for (const palette of palettes) {
    await applyThemeCss(page, options.oldCss);
    await configureCombination(page, options.figure, palette);
    const before = await stageState(page);
    if (phaseCount === undefined) {
      phaseSegmentCount = before.phaseSegmentCount;
      phaseCount = resolvePhaseCount(phaseSegmentCount, false).phaseCount;
      if (phaseSegmentCount === 0) unlabeledPalette = palette;
    } else if (before.phaseSegmentCount !== phaseSegmentCount) {
      throw new FigureTraversalError(
        `${figureLabel(options.figure)} の段の札の数が状態によって変わりました: ${phaseSegmentCount} / ${before.phaseSegmentCount}`,
      );
    }
    if (phaseCount === 1 && singlePhaseCaptureMode !== undefined) {
      if (before.phase !== 0) {
        throw new FigureTraversalError(`${stateLabel(options.figure, palette, 0)}: 1段図なのに段 ${before.phase} へ進みました`);
      }
      await visit({
        page: options.figure.page,
        figure: options.figure.itemId,
        palette,
        phase: 0,
        captureMode: singlePhaseCaptureMode,
      });
      continue;
    }
    await waitForPhaseZero(page, options.figure, palette, phaseCount);
    for (let phase = 0; phase < phaseCount; phase += 1) {
      const captureMode = await settleAtPhase(page, options.figure, palette, phase);
      await visit({ page: options.figure.page, figure: options.figure.itemId, palette, phase, captureMode });
      if (phaseCount === 1) singlePhaseCaptureMode = captureMode;
      if (phase + 1 < phaseCount) {
        await applyThemeCss(page, options.oldCss);
        await waitForNextPhase(page, options.figure, palette, phase);
      }
    }
  }
  if (phaseCount === undefined) throw new Error(`${figureLabel(options.figure)} に走査する色味がありません`);
  if (unlabeledPalette !== undefined) await validateUnlabeledSinglePhase(page, options.figure, unlabeledPalette);
  return phaseCount;
}

async function normalizeAnimations(page) {
  await page.evaluate(() => {
    const stage = document.querySelector(".catalog-preview-stage:not([hidden])");
    if (!stage) throw new Error("表示中の stage がありません");
    for (const animation of stage.getAnimations({ subtree: true })) {
      const timing = animation.effect?.getComputedTiming();
      if (typeof timing?.endTime === "number" && Number.isFinite(timing.endTime)) {
        if (animation.playState !== "idle") animation.finish();
      } else {
        animation.pause();
        animation.currentTime = 0;
      }
    }
  });
}

async function pauseSmilAnimations(page) {
  return page.evaluate(() => {
    const defsSvg = [...document.querySelectorAll("svg")].find((svg) => svg.querySelector('[id^="dragon-"]')) ?? null;
    if (!defsSvg) throw new Error("SMIL を止める SvgDefs がありません");
    const outerSvgs = [...document.querySelectorAll("svg")].filter((svg) => svg.ownerSVGElement === null);
    let smilElementCount = 0;
    for (const svg of outerSvgs) {
      smilElementCount += svg.querySelectorAll("animate, animateTransform, animateMotion, set").length;
      svg.pauseAnimations();
    }
    return { pausedSvgCount: outerSvgs.length, smilElementCount };
  });
}

async function unpauseSmilAnimations(page) {
  await page.evaluate(() => {
    for (const svg of document.querySelectorAll("svg")) {
      if (svg.ownerSVGElement === null) svg.unpauseAnimations();
    }
  });
}

async function domSummary(page) {
  const state = await stageState(page);
  if (state.summary === null) throw new FigureTraversalError("DOM 要約の対象 SVG がありません");
  return state.summary;
}

async function computedSnapshot(page, variableNames) {
  return page.evaluate(({ properties, variables }) => {
    const stage = document.querySelector(".catalog-preview-stage:not([hidden])");
    const defsSvg = [...document.querySelectorAll("svg")].find((svg) => svg.querySelector('[id^="dragon-"]')) ?? null;
    if (!stage) throw new Error("計算後の値を取る stage がありません");
    if (!defsSvg) throw new Error("計算後の値を取る SvgDefs がありません");

    const dataAttributes = (element) => Object.fromEntries(
      [...element.attributes]
        .filter((attribute) => attribute.name.startsWith("data-cdl-"))
        .map((attribute) => [attribute.name, attribute.value]),
    );
    const pathWithin = (root, element, label) => {
      const parts = [];
      let current = element;
      while (current && current !== root) {
        const siblings = current.parentElement
          ? [...current.parentElement.children].filter((child) => child.tagName === current.tagName)
          : [];
        parts.push(`${current.tagName.toLowerCase()}:nth-of-type(${siblings.indexOf(current) + 1})`);
        current = current.parentElement;
      }
      return `${label} > ${parts.reverse().join(" > ")}`;
    };
    const entries = [];
    const addScope = (root, label) => {
      if (!root) return;
      for (const element of root.querySelectorAll("*")) {
        const path = pathWithin(root, element, label);
        const style = getComputedStyle(element);
        entries.push({
          key: path,
          element: { path, dataAttributes: dataAttributes(element) },
          values: Object.fromEntries(properties.map((property) => [property, style.getPropertyValue(property).trim()])),
        });
      }
    };
    addScope(stage, ".catalog-preview-stage:not([hidden])");
    addScope(defsSvg, "SvgDefs");

    const figureSvg = stage?.querySelector("svg[data-cdl-stage]") ?? null;
    if (!figureSvg) throw new Error("CSS 変数を取る図の svg[data-cdl-stage] がありません");
    for (const [key, path, element] of [
      ["variables:html", "html", document.documentElement],
      ["variables:figure-svg", pathWithin(stage, figureSvg, ".catalog-preview-stage:not([hidden])"), figureSvg],
    ]) {
      const style = getComputedStyle(element);
      entries.push({
        key,
        element: { path, dataAttributes: dataAttributes(element) },
        values: Object.fromEntries(variables.map((name) => [name, style.getPropertyValue(name).trim()])),
      });
    }
    return entries;
  }, { properties: COMPARISON_PROPERTIES, variables: variableNames });
}

async function coverageForState(page, rules, matchedIds, undecidableReasons, adjustments) {
  const candidates = [];
  for (const rule of rules) {
    if (matchedIds.has(rule.id) || undecidableReasons.has(rule.id)) continue;
    const normalized = normalizeSelectorForCoverage(rule.selector);
    if (normalized.removals.length > 0 && !adjustments.has(rule.id)) {
      adjustments.set(rule.id, { id: rule.id, original: rule.selector, tested: normalized.selector, removed: normalized.removals });
    }
    if (normalized.selector === "") {
      undecidableReasons.set(rule.id, "擬似要素または動きの擬似クラスを外すと選択子が空になる");
      continue;
    }
    candidates.push({ id: rule.id, selector: normalized.selector });
  }

  const result = await page.evaluate((entries) => {
    const stage = document.querySelector(".catalog-preview-stage:not([hidden])");
    const defsSvg = [...document.querySelectorAll("svg")].find((svg) => svg.querySelector('[id^="dragon-"]')) ?? null;
    if (!stage) throw new Error("coverage の対象 stage がありません");
    if (!defsSvg) throw new Error("coverage の対象 SvgDefs がありません");
    const targets = new Set([
      document.documentElement,
      document.body,
      ...(stage ? stage.querySelectorAll("*") : []),
      ...(defsSvg ? defsSvg.querySelectorAll("*") : []),
    ]);
    return entries.map((entry) => {
      try {
        const matched = [...document.querySelectorAll(entry.selector)].some((element) => targets.has(element));
        return { id: entry.id, matched, error: null };
      } catch (error) {
        return { id: entry.id, matched: false, error: error instanceof Error ? error.message : String(error) };
      }
    });
  }, candidates);
  for (const entry of result) {
    if (entry.matched) matchedIds.add(entry.id);
    else if (entry.error) undecidableReasons.set(entry.id, `選択子を解釈できない: ${entry.error}`);
  }
}

function pixelDifference(oldBuffer, newBuffer) {
  const oldImage = PNG.sync.read(oldBuffer);
  const newImage = PNG.sync.read(newBuffer);
  if (oldImage.width !== newImage.width || oldImage.height !== newImage.height) {
    return { differentPixels: oldImage.width * oldImage.height, oldSize: [oldImage.width, oldImage.height], newSize: [newImage.width, newImage.height] };
  }
  let differentPixels = 0;
  for (let offset = 0; offset < oldImage.data.length; offset += 4) {
    if (
      oldImage.data[offset] !== newImage.data[offset] ||
      oldImage.data[offset + 1] !== newImage.data[offset + 1] ||
      oldImage.data[offset + 2] !== newImage.data[offset + 2] ||
      oldImage.data[offset + 3] !== newImage.data[offset + 3]
    ) differentPixels += 1;
  }
  return { differentPixels, oldSize: [oldImage.width, oldImage.height], newSize: [newImage.width, newImage.height] };
}

function rulesFromCss(css) {
  const parsed = STYLE_FILES.map((path) => parseCssRules(css[path], path));
  return {
    rules: parsed.flatMap((entry) => entry.rules),
    ignored: parsed.flatMap((entry) => entry.ignored),
    ignoredTypes: [...new Set(parsed.flatMap((entry) => entry.ignoredTypes))],
  };
}

async function compareOneFigure(page, options, parsed) {
  const startedAt = Date.now();
  const figureKey = figureLabel(options.figure);
  const opened = await openFigure(page, options.baseUrl, options.figure, options.oldCss);
  const matchedIds = new Set();
  const undecidableReasons = new Map();
  const adjustments = new Map();
  const differences = [];
  const variableDifferences = [];
  const incomparableStates = [];
  const pixelDetails = [];
  const referencePageKeys = new Set();
  const captureModes = { settled: 0, timed: 0 };
  const smilStates = [];
  let pixelComparisons = 0;
  let differentPixels = 0;
  let stateCount = 0;

  const phaseCount = await forEachFigureState(page, options, async (state) => {
    await applyThemeCss(page, options.oldCss);
    await normalizeAnimations(page);
    const reference = referenceByKey.get(figureKey);
    const palette = PALETTES.find((entry) => entry.value === state.palette);
    const shouldComparePixels = options.pixelComparison !== false && reference !== undefined && palette?.reference === true;
    const { paused } = await whileSmilAnimationsPaused(
      () => pauseSmilAnimations(page),
      async () => {
        const oldDom = await domSummary(page);
        const oldSnapshot = await computedSnapshot(page, options.variableNames);
        const oldPng = shouldComparePixels ? await opened.stage.screenshot() : null;

        await coverageForState(page, parsed.rules, matchedIds, undecidableReasons, adjustments);
        await applyThemeCss(page, options.newCss);
        await normalizeAnimations(page);
        const newDom = await domSummary(page);
        const newSnapshot = await computedSnapshot(page, options.variableNames);
        if (oldDom.length !== newDom.length || oldDom.hash !== newDom.hash) {
          incomparableStates.push({ ...state, oldDomHash: oldDom, newDomHash: newDom });
        } else {
          const snapshotDifferences = compareComputedSnapshots(oldSnapshot, newSnapshot, state);
          differences.push(...snapshotDifferences.differences);
          variableDifferences.push(...snapshotDifferences.variableDifferences);
        }

        if (oldPng) {
          const result = pixelDifference(oldPng, await opened.stage.screenshot());
          pixelComparisons += 1;
          differentPixels += result.differentPixels;
          if (result.differentPixels > 0) pixelDetails.push({ ...state, ...result });
          for (const kind of reference.kinds) referencePageKeys.add(`${kind}\0${palette.label}`);
        }
      },
      () => unpauseSmilAnimations(page),
    );
    smilStates.push({ ...state, ...paused });
    captureModes[state.captureMode] += 1;
    stateCount += 1;
    options.onStateProgress?.({ stateCount, state });
  });

  return {
    figure: options.figure,
    phaseCount,
    stateCount,
    differences,
    variableDifferences,
    incomparableStates,
    matchedIds,
    undecidableReasons,
    adjustments,
    pixelComparisons,
    differentPixels,
    pixelDetails,
    referencePageKeys,
    captureModes,
    smilStates,
    elapsedMs: Date.now() - startedAt,
  };
}

function combinedComparison(results, parsed, paletteCount) {
  const matchedIds = new Set();
  const undecidableReasons = new Map();
  const adjustments = new Map();
  const phaseCounts = {};
  for (const result of results) {
    phaseCounts[figureLabel(result.figure)] = result.phaseCount;
    for (const id of result.matchedIds) matchedIds.add(id);
    for (const [id, reason] of result.undecidableReasons) if (!undecidableReasons.has(id)) undecidableReasons.set(id, reason);
    for (const [id, adjustment] of result.adjustments) if (!adjustments.has(id)) adjustments.set(id, adjustment);
  }
  const stateCount = results.reduce((sum, result) => sum + result.stateCount, 0);
  const expectedStates = expectedStateCount(phaseCounts, paletteCount);
  if (stateCount !== expectedStates) throw new Error(`状態数が一致しません: 実際 ${stateCount} / 期待 ${expectedStates}`);
  const referencePageKeys = new Set(results.flatMap((result) => [...result.referencePageKeys]));
  const captureModes = {
    settled: results.reduce((sum, result) => sum + result.captureModes.settled, 0),
    timed: results.reduce((sum, result) => sum + result.captureModes.timed, 0),
  };
  const smilStates = results.flatMap((result) => result.smilStates);
  return {
    stateCount,
    expectedStateCount: expectedStates,
    captureModes,
    smil: {
      pausedSvgCount: smilStates.reduce((sum, state) => sum + state.pausedSvgCount, 0),
      smilElementCount: smilStates.reduce((sum, state) => sum + state.smilElementCount, 0),
      states: smilStates,
    },
    phaseCounts,
    differences: results.flatMap((result) => result.differences),
    variableDifferences: results.flatMap((result) => result.variableDifferences),
    incomparableStates: results.flatMap((result) => result.incomparableStates),
    coverage: {
      ...summarizeCoverage(parsed.rules, matchedIds, undecidableReasons),
      ignoredAtRules: parsed.ignored,
      ignoredTypes: parsed.ignoredTypes,
      selectorAdjustments: [...adjustments.values()],
    },
    pixels: {
      referencePageCount: referencePageKeys.size,
      referencePages: [...referencePageKeys].sort().map((key) => {
        const [kind, palette] = key.split("\0");
        return { kind, palette };
      }),
      comparisons: results.reduce((sum, result) => sum + result.pixelComparisons, 0),
      differentPixels: results.reduce((sum, result) => sum + result.differentPixels, 0),
      differences: results.flatMap((result) => result.pixelDetails),
    },
  };
}

/** 指定された図を、図ごとに一度だけ開いて全色味・全段で比較する。 */
export async function compareFigures(page, options) {
  const palettes = options.palettes ?? PALETTES.map((entry) => entry.value);
  const parsed = rulesFromCss(options.oldCss);
  const variableNames = collectCssVariableNames([...Object.values(options.oldCss), ...Object.values(options.newCss)]);
  const results = [];
  await preparePage(page);
  for (const figure of options.figures) {
    const result = await compareOneFigure(page, { ...options, figure, palettes, variableNames }, parsed);
    results.push(result);
    options.onProgress?.({ figure, matched: result.matchedIds.size, elapsedMs: result.elapsedMs });
  }
  return combinedComparison(results, parsed, palettes.length);
}

async function discoverFigures(page, baseUrl, pages) {
  const figures = [];
  for (const pageName of pages) {
    await page.goto(catalogUrl(baseUrl, pageName), { waitUntil: "networkidle" });
    await waitForCatalogRows(page, pageName);
    const itemIds = await page.locator(".catalog-list .catalog-list-item").evaluateAll(
      (rows) => rows.map((row) => row.getAttribute("data-item-id")).filter((value) => value !== null),
    );
    for (const itemId of itemIds) figures.push({ page: pageName, itemId });
  }
  return figures;
}

async function discoverCatalogPages(page, baseUrl) {
  await page.goto(catalogIndexUrl(baseUrl), { waitUntil: "networkidle" });
  const cards = page.locator("a.catalog-index-card");
  for (let elapsed = 0; elapsed <= MAX_CATALOG_WAIT_MS; elapsed += CLOCK_STEP_MS) {
    if (await cards.count() > 0) {
      return cards.evaluateAll((links) => links
        .map((link) => link.getAttribute("href")?.split("/catalog/")[1] ?? "")
        .filter((slug) => slug !== ""));
    }
    await page.clock.runFor(CLOCK_STEP_MS);
  }
  throw new FigureTraversalError(`見本帳の分類が ${MAX_CATALOG_WAIT_MS}ms 内に出ません: 頁 catalog、item id <分類一覧>`);
}

async function scanFigureCoverage(page, options, parsed) {
  const startedAt = Date.now();
  try {
    await openFigure(page, options.baseUrl, options.figure, options.oldCss);
    const matchedIds = new Set();
    const undecidableReasons = new Map();
    const adjustments = new Map();
    const phaseCount = await forEachFigureState(page, options, async () => {
      await normalizeAnimations(page);
      await coverageForState(page, parsed.rules, matchedIds, undecidableReasons, adjustments);
    });
    return {
      page: options.figure.page,
      itemId: options.figure.itemId,
      status: "complete",
      phaseCount,
      ruleIds: [...matchedIds],
      elapsedMs: Date.now() - startedAt,
    };
  } catch (error) {
    if (error instanceof FigureWithoutCdlSvgError) {
      return {
        page: options.figure.page,
        itemId: options.figure.itemId,
        status: "without-cdl-svg",
        stageSummary: error.stageSummary,
        elapsedMs: Date.now() - startedAt,
      };
    }
    if (!(error instanceof FigureTraversalError)) throw error;
    return {
      page: options.figure.page,
      itemId: options.figure.itemId,
      status: "undrawable",
      reason: error.message,
      elapsedMs: Date.now() - startedAt,
    };
  }
}

function buildSelectionOutput(results, parsed, baseline, pages) {
  const drawable = results
    .filter((result) => result.status === "complete")
    .map((result) => ({ page: result.page, itemId: result.itemId, phaseCount: result.phaseCount, ruleIds: new Set(result.ruleIds) }));
  const undrawableFigures = results
    .filter((result) => result.status === "undrawable")
    .map(({ page, itemId, reason }) => ({ page, itemId, reason }));
  const figuresWithoutCdlSvg = results
    .filter((result) => result.status === "without-cdl-svg")
    .map(({ page, itemId, stageSummary }) => ({ page, itemId, stageSummary }));
  const allRuleIds = new Set(parsed.rules.map((rule) => rule.id));
  const chosen = greedySelectFigures(drawable, allRuleIds, [...referenceByKey.keys()]);
  const selected = chosen.selected.map((figure) => {
    const reference = referenceByKey.get(`${figure.page}/${figure.itemId}`);
    return {
      page: figure.page,
      itemId: figure.itemId,
      phaseCount: figure.phaseCount,
      reason: figure.reason,
      newlyCoveredRules: figure.newlyCovered,
      referenceKinds: reference?.kinds ?? [],
      evidence: reference?.evidence ?? [],
    };
  });
  const ruleById = new Map(parsed.rules.map((rule) => [rule.id, rule]));
  const unreachableRules = [...chosen.uncovered].map((id) => {
    const rule = ruleById.get(id);
    return { id, source: rule.source, selector: rule.selector, line: rule.line, reason: "描ける全図・全色味・全段のどれにも一致しない" };
  });
  return {
    figures: { version: 3, generatedFrom: baseline, pages, figures: selected, figuresWithoutCdlSvg, undrawableFigures },
    unmatched: {
      version: 3,
      totalRules: parsed.rules.length,
      coveredRules: chosen.covered.size,
      unmatchedRules: unreachableRules,
      ignoredAtRules: parsed.ignored,
      ignoredTypes: parsed.ignoredTypes,
      figuresWithoutCdlSvg,
      undrawableFigures,
    },
  };
}

/** 全見本を走査し、規則 coverage を保つ図を貪欲法で選ぶ。 */
export async function selectFigures(page, options) {
  const parsed = rulesFromCss(options.oldCss);
  await preparePage(page);
  const pages = options.pages?.length ? options.pages : await discoverCatalogPages(page, options.baseUrl);
  const figures = await discoverFigures(page, options.baseUrl, pages);
  const results = [];
  for (const figure of figures) {
    const result = await scanFigureCoverage(page, { ...options, figure }, parsed);
    results.push(result);
    options.onProgress?.({
      finished: results.length,
      total: figures.length,
      figure,
      matched: result.ruleIds?.length ?? 0,
      elapsedMs: result.elapsedMs,
      status: result.status,
      reason: result.reason,
    });
  }
  return buildSelectionOutput(results, parsed, options.baseline, pages);
}

async function pagesForWorkers(browser, workers) {
  const pages = [];
  for (let index = 0; index < workers; index += 1) {
    const page = await browser.newPage();
    await preparePage(page);
    pages.push(page);
  }
  return pages;
}

async function parallelByFigure(pages, figures, run, onComplete) {
  const results = new Array(figures.length);
  let nextIndex = 0;
  await Promise.all(pages.map(async (page) => {
    while (nextIndex < figures.length) {
      const index = nextIndex;
      nextIndex += 1;
      const result = await run(page, figures[index]);
      results[index] = result;
      await onComplete?.(result, figures[index]);
    }
  }));
  return results;
}

export async function compareFiguresWithWorkers(browser, options) {
  const palettes = options.palettes ?? PALETTES.map((entry) => entry.value);
  const parsed = rulesFromCss(options.oldCss);
  const variableNames = collectCssVariableNames([...Object.values(options.oldCss), ...Object.values(options.newCss)]);
  const pages = await pagesForWorkers(browser, Math.min(options.workers, options.figures.length));
  try {
    let finished = 0;
    const results = await parallelByFigure(
      pages,
      options.figures,
      (page, figure) => compareOneFigure(page, { ...options, figure, palettes, variableNames }, parsed),
      (result, figure) => {
        finished += 1;
        options.onProgress?.({
          finished,
          total: options.figures.length,
          figure,
          matched: result.matchedIds.size,
          elapsedMs: result.elapsedMs,
        });
      },
    );
    return combinedComparison(results, parsed, palettes.length);
  } finally {
    await Promise.all(pages.map((page) => page.close()));
  }
}

function cssHash(css) {
  const digest = createHash("sha256");
  for (const path of STYLE_FILES) digest.update(path).update("\0").update(css[path]).update("\0");
  return digest.digest("hex");
}

async function selectFiguresWithWorkers(browser, options) {
  const pages = await pagesForWorkers(browser, options.workers);
  const selectedPages = options.pages?.length ? options.pages : await discoverCatalogPages(pages[0], options.baseUrl);
  const parsed = rulesFromCss(options.oldCss);
  const figures = await discoverFigures(pages[0], options.baseUrl, selectedPages);
  const rawCache = existsSync(options.cachePath) ? JSON.parse(readFileSync(options.cachePath, "utf8")) : undefined;
  let { cache, reused } = selectionCacheForCss(rawCache, cssHash(options.oldCss));
  if (!reused) writeJson(options.cachePath, cache);

  const figureKeys = new Set(figures.map(figureLabel));
  const cachedKeys = completedSelectionKeys(cache);
  const cachedByKey = new Map(cache.results.filter((result) => figureKeys.has(figureLabel(result))).map((result) => [figureLabel(result), result]));
  let finished = 0;
  for (const figure of figures) {
    if (!cachedKeys.has(figureLabel(figure))) continue;
    const result = cachedByKey.get(figureLabel(figure));
    finished += 1;
    options.onProgress?.({
      finished,
      total: figures.length,
      figure,
      matched: result?.ruleIds?.length ?? 0,
      elapsedMs: result?.elapsedMs ?? 0,
      status: result?.status ?? "complete",
      reason: result?.reason,
      cached: true,
    });
  }

  const remaining = figures.filter((figure) => !cachedKeys.has(figureLabel(figure)));
  await parallelByFigure(
    pages,
    remaining,
    (page, figure) => scanFigureCoverage(page, { ...options, figure }, parsed),
    (result, figure) => {
      cache = recordSelectionResult(cache, result);
      writeJson(options.cachePath, cache);
      cachedByKey.set(figureLabel(figure), result);
      finished += 1;
      options.onProgress?.({
        finished,
        total: figures.length,
        figure,
        matched: result.ruleIds?.length ?? 0,
        elapsedMs: result.elapsedMs,
        status: result.status,
        reason: result.reason,
        cached: false,
      });
    },
  );
  return buildSelectionOutput(figures.map((figure) => cachedByKey.get(figureLabel(figure))), parsed, options.baseline, selectedPages);
}

function argumentValues(args, name) {
  return args.flatMap((value, index) => value === `--${name}` && args[index + 1] ? [args[index + 1]] : []);
}

function argumentValue(args, name, fallback) {
  return argumentValues(args, name)[0] ?? fallback;
}

function positiveInteger(value, name) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1) throw new Error(`--${name} は 1 以上の整数で指定してください: ${value}`);
  return parsed;
}

function writeJson(path, value) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`);
}

function progressLine(progress) {
  const seconds = (progress.elapsedMs / 1000).toFixed(1);
  const suffix = progress.status === "undrawable"
    ? `、描けない図: ${progress.reason}`
    : progress.status === "without-cdl-svg" ? "、cdl の図を持たない行" : "";
  const cached = progress.cached ? "、cache" : "";
  return `[${progress.finished}/${progress.total}] ${figureLabel(progress.figure)}: ${progress.matched} 規則、${seconds}秒${cached}${suffix}\n`;
}

async function main() {
  const args = process.argv.slice(2);
  const mode = args[0];
  if (!["選ぶ", "比べる", "select", "compare"].includes(mode)) {
    throw new Error("使い方: theme-css-equivalence.mjs <選ぶ|比べる> [--url URL] [--base git-ref] [--workers N] [--cache file] [--out file] [--page slug]");
  }
  const baseUrl = argumentValue(args, "url", process.env.DEV_SPA_URL ?? "http://localhost:4323/");
  const baseline = argumentValue(args, "base", process.env.THEME_CSS_BASE ?? "origin/main");
  const workers = positiveInteger(argumentValue(args, "workers", String(DEFAULT_WORKERS)), "workers");
  const css = readCssInputs({ baseline });
  const browser = await chromium.launch({ headless: true, args: CHROMIUM_LAUNCH_ARGS });
  try {
    if (mode === "選ぶ" || mode === "select") {
      const out = resolve(argumentValue(args, "out", resolve(FIXTURES, "figures.json")));
      const cachePath = resolve(argumentValue(args, "cache", resolve(REPO, ".context/theme-css-equivalence/select-cache.json")));
      const result = await selectFiguresWithWorkers(browser, {
        baseUrl,
        baseline,
        oldCss: css.oldCss,
        pages: argumentValues(args, "page"),
        workers,
        cachePath,
        onProgress: (progress) => process.stdout.write(progressLine(progress)),
      });
      writeJson(out, result.figures);
      writeJson(resolve(dirname(out), "unmatched-rules.json"), result.unmatched);
      process.stdout.write(
        `選択 ${result.figures.figures.length} 図 / cdl の図を持たない ${result.figures.figuresWithoutCdlSvg.length} 行 / 描けない ${result.figures.undrawableFigures.length} 図 / 未命中 ${result.unmatched.unmatchedRules.length} 規則\n`,
      );
      return;
    }

    const figuresPath = resolve(argumentValue(args, "figures", resolve(FIXTURES, "figures.json")));
    const fixture = JSON.parse(readFileSync(figuresPath, "utf8"));
    if (!Array.isArray(fixture.figures) || fixture.figures.length === 0) {
      throw new Error(`${figuresPath} が空です。先に「選ぶ」mode を実行してください`);
    }
    const result = await compareFiguresWithWorkers(browser, {
      baseUrl,
      figures: fixture.figures,
      oldCss: css.oldCss,
      newCss: css.newCss,
      workers,
      onProgress: (progress) => process.stdout.write(progressLine({ ...progress, status: "complete" })),
    });
    const out = resolve(argumentValue(args, "out", resolve(REPO, ".context/theme-css-equivalence/result.json")));
    writeJson(out, result);
    process.stdout.write(
      `状態 ${result.stateCount}/${result.expectedStateCount} (settled ${result.captureModes.settled} / timed ${result.captureModes.timed})、SMIL停止 svg ${result.smil.pausedSvgCount} / 要素 ${result.smil.smilElementCount}、計算後の値の差 ${result.differences.length}、変数の差 ${result.variableDifferences.length}、比較不能 ${result.incomparableStates.length}、画素差 ${result.pixels.differentPixels}\n`,
    );
    if (result.differences.length > 0 || result.incomparableStates.length > 0 || result.pixels.differentPixels > 0) process.exitCode = 1;
  } finally {
    await browser.close();
  }
}

const invokedPath = process.argv[1] ? resolve(process.argv[1]) : "";
if (invokedPath === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    process.stderr.write(`${error instanceof Error ? error.stack ?? error.message : String(error)}\n`);
    process.exitCode = 1;
  });
}
