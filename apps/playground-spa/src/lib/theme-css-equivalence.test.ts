import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, test } from "vitest";

import {
  CHROMIUM_LAUNCH_ARGS,
  COMPARISON_PROPERTIES,
  SELECTION_CACHE_VERSION,
  collectCssVariableNames,
  completedSelectionKeys,
  compareComputedSnapshots,
  countReferenceFixtureFiles,
  expectedStateCount,
  greedySelectFigures,
  normalizeSelectorForCoverage,
  parseCssRules,
  phaseResetStatus,
  recordSelectionResult,
  resolvePhaseCount,
  selectionCacheKey,
  selectionCacheForCss,
  stateCaptureDecision,
  whileSmilAnimationsPaused,
} from "../../scripts/theme-css-equivalence-core.mjs";

const REQUIRED_PROPERTIES = [
  "fill", "fill-opacity", "stroke", "stroke-opacity", "stroke-width", "stroke-dasharray",
  "stroke-linecap", "stroke-linejoin", "opacity", "filter", "font-family", "font-size",
  "font-weight", "letter-spacing", "paint-order", "r", "rx", "ry", "display", "visibility",
  "overflow", "pointer-events", "clip-path", "shape-rendering", "transform", "transform-box",
  "transform-origin", "translate", "scale", "color", "background-color", "background-image",
  "background-position", "background-repeat", "background-size", "width", "height", "animation-name",
  "animation-duration", "animation-delay", "animation-fill-mode", "animation-timing-function",
  "stroke-dashoffset", "mix-blend-mode", "marker-start", "marker-end", "stop-color", "stop-opacity",
  "flood-color",
] as const;

describe("theme CSS equivalence core", () => {
  test("CLI and spec share the Chromium raster stabilization arguments", () => {
    expect(CHROMIUM_LAUNCH_ARGS).toEqual([
      "--disable-gpu",
      "--disable-partial-raster",
      "--disable-skia-runtime-opts",
      "--force-color-profile=srgb",
    ]);
  });

  test("SMIL remains paused through both captures and resumes afterward", async () => {
    const steps: string[] = [];
    const result = await whileSmilAnimationsPaused(
      () => {
        steps.push("pause");
        return { pausedSvgCount: 2, smilElementCount: 6 };
      },
      () => {
        steps.push("old values", "old pixels", "new values", "new pixels");
        return "compared";
      },
      () => {
        steps.push("unpause");
      },
    );

    expect(steps).toEqual(["pause", "old values", "old pixels", "new values", "new pixels", "unpause"]);
    expect(result).toEqual({
      paused: { pausedSvgCount: 2, smilElementCount: 6 },
      value: "compared",
    });
  });

  test("SMIL resumes when comparison fails", async () => {
    const steps: string[] = [];
    await expect(whileSmilAnimationsPaused(
      () => {
        steps.push("pause");
      },
      () => {
        steps.push("compare");
        throw new Error("capture failed");
      },
      () => {
        steps.push("unpause");
      },
    )).rejects.toThrow("capture failed");
    expect(steps).toEqual(["pause", "compare", "unpause"]);
  });

  test("required computed properties are all compared", () => {
    expect(new Set(COMPARISON_PROPERTIES)).toEqual(new Set(REQUIRED_PROPERTIES));
  });

  test("CSS parser counts nested rules and excludes keyframes and font-face", () => {
    const css = `/* { ignored } */\n.a { content: "}"; }\n@media (min-width: 1px) {\n  .b:hover::before { color: red; }\n}\n@supports (display: grid) {\n  .c { display: grid; }\n}\n@keyframes turn { from { opacity: 0 } to { opacity: 1 } }\n@font-face { font-family: demo; src: url("x"); }`;
    const parsed = parseCssRules(css, "fixture.css");

    expect(parsed.rules.map((rule) => [rule.selector, rule.line])).toEqual([
      [".a", 2],
      [".b:hover::before", 4],
      [".c", 7],
    ]);
    expect(parsed.ignored.map((entry) => entry.type)).toEqual(["keyframes", "font-face"]);
  });

  test("current theme CSS has rules with positive start lines", () => {
    const css = readFileSync(resolve(process.cwd(), "apps/playground-spa/src/styles/cdl-theme.css"), "utf8");
    const parsed = parseCssRules(css, "cdl-theme.css");

    expect(parsed.rules.length).toBeGreaterThan(0);
    expect(parsed.rules.every((rule) => rule.line > 0)).toBe(true);
  });

  test("coverage selector removes pseudo elements and dynamic pseudo classes", () => {
    const result = normalizeSelectorForCoverage(".button:hover::before, .card:not(:focus-visible) > rect");

    expect(result.selector).toBe(".button, .card > rect");
    expect(new Set(result.removals)).toEqual(new Set([":hover", "::before", ":not(:focus-visible)"]));
  });

  test("computed snapshot differences name element property and both values", () => {
    const element = { path: "svg:nth-of-type(1)>rect:nth-of-type(1)", dataAttributes: { "data-cdl-role": "node-body" } };
    const result = compareComputedSnapshots(
      [{ key: "0/0", element, values: { fill: "rgb(0, 0, 0)", stroke: "none" } }],
      [{ key: "0/0", element, values: { fill: "rgb(255, 0, 0)", stroke: "none" } }],
      { figure: "demo", palette: "blueprint", phase: 0 },
    );

    expect(result.differences).toEqual([
      expect.objectContaining({
        figure: "demo",
        property: "fill",
        oldValue: "rgb(0, 0, 0)",
        newValue: "rgb(255, 0, 0)",
        element,
      }),
    ]);
    expect(result.variableDifferences).toHaveLength(0);
  });

  test("CSS variable differences are kept out of visual differences", () => {
    const element = { path: "html", dataAttributes: {} };
    const result = compareComputedSnapshots(
      [{ key: "variables:html", element, values: { "--cdl-fill": "red" } }],
      [{ key: "variables:html", element, values: { "--cdl-fill": "blue" } }],
      { figure: "demo", palette: "blueprint", phase: 0 },
    );

    expect(result.differences).toHaveLength(0);
    expect(result.variableDifferences).toEqual([
      expect.objectContaining({
        figure: "demo",
        property: "--cdl-fill",
        oldValue: "red",
        newValue: "blue",
        element,
      }),
    ]);
  });

  test("greedy selection keeps mandatory figures then covers the largest gain", () => {
    const figures = [
      { page: "presets", itemId: "mandatory", phaseCount: 1, ruleIds: new Set(["a"]) },
      { page: "charts", itemId: "wide", phaseCount: 2, ruleIds: new Set(["b", "c"]) },
      { page: "charts", itemId: "narrow", phaseCount: 1, ruleIds: new Set(["b"]) },
    ];
    const result = greedySelectFigures(figures, new Set(["a", "b", "c"]), ["presets/mandatory"]);

    expect(result.selected.map((figure) => figure.itemId)).toEqual(["mandatory", "wide"]);
    expect(result.uncovered.size).toBe(0);
    expect(result.selected.map((figure) => figure.newlyCovered)).toEqual([1, 2]);
  });

  test("expected state count sums phases across the seven palettes", () => {
    expect(expectedStateCount({ first: 2, second: 3 }, 7)).toBe(35);
  });

  test("phase reset requires a full loop when observation starts at phase zero", () => {
    const initial = phaseResetStatus(3, 0, 0);
    const middle = phaseResetStatus(3, 0, 2, initial.sawNonZero);
    const reset = phaseResetStatus(3, 0, 0, middle.sawNonZero);

    expect(initial.ready).toBe(false);
    expect(middle.ready).toBe(false);
    expect(reset.ready).toBe(true);
    expect(phaseResetStatus(3, 2, 0).ready).toBe(true);
    expect(phaseResetStatus(1, 0, 0).ready).toBe(true);
  });

  test("state capture settles early or uses the exact timed sample", () => {
    expect(stateCaptureDecision(200, 3, false)).toEqual({ status: "capture", mode: "settled" });
    expect(stateCaptureDecision(1_100, 2, false)).toEqual({ status: "wait" });
    expect(stateCaptureDecision(1_200, 2, false)).toEqual({ status: "capture", mode: "timed" });
    expect(stateCaptureDecision(1_100, 2, true)).toEqual({ status: "advanced" });
  });

  test("phase count uses one phase for no labels that stay at phase zero", () => {
    expect(resolvePhaseCount(0, false)).toEqual({ status: "resolved", phaseCount: 1 });
  });

  test("phase count uses the number of visible phase labels", () => {
    expect(resolvePhaseCount(3, false)).toEqual({ status: "resolved", phaseCount: 3 });
  });

  test("phase count is unreadable when an unlabeled diagram advances", () => {
    expect(resolvePhaseCount(0, true)).toEqual({
      status: "unreadable",
      reason: "段の札 .cdl-phase-seg が 0 個なのに data-cdl-phase-index が 0 以外へ進んだ",
    });
  });

  test("selection cache reuses only results for the same CSS hash", () => {
    const fresh = selectionCacheForCss(undefined, "old-css-a");
    const completed = recordSelectionResult(fresh.cache, {
      page: "presets",
      itemId: "demo",
      status: "complete",
      phaseCount: 2,
      ruleIds: ["a"],
      elapsedMs: 42,
    });
    const same = selectionCacheForCss(completed, "old-css-a");
    const changed = selectionCacheForCss(completed, "old-css-b");

    expect(same.reused).toBe(true);
    expect(completedSelectionKeys(same.cache)).toEqual(new Set(["presets/demo"]));
    expect(changed.reused).toBe(false);
    expect(changed.cache.results).toEqual([]);
  });

  test("selection cache key includes both the tool version and CSS hash", () => {
    expect(selectionCacheKey("old-css-a")).toContain(`v${SELECTION_CACHE_VERSION}`);
    expect(selectionCacheKey("old-css-a")).not.toBe(selectionCacheKey("old-css-a", SELECTION_CACHE_VERSION + 1));
    expect(selectionCacheKey("old-css-a")).not.toBe(selectionCacheKey("old-css-b"));
  });

  test("selection cache retries figures recorded as undrawable", () => {
    const fresh = selectionCacheForCss(undefined, "old-css-a");
    const withUndrawable = recordSelectionResult(fresh.cache, {
      page: "primitives",
      itemId: "no-phase-label",
      status: "undrawable",
      reason: "段の数が読めない",
      elapsedMs: 21,
    });

    expect(completedSelectionKeys(withUndrawable)).toEqual(new Set());
  });

  test("selection cache reuses rows known not to contain a CDL SVG", () => {
    const fresh = selectionCacheForCss(undefined, "old-css-a");
    const withoutCdlSvg = recordSelectionResult(fresh.cache, {
      page: "parts",
      itemId: "parts-countup",
      status: "without-cdl-svg",
      stageSummary: { tagCounts: { div: 2 } },
      elapsedMs: 21,
    });

    expect(completedSelectionKeys(withoutCdlSvg)).toEqual(new Set(["parts/parts-countup"]));
  });

  test("CSS variable names are collected from declarations and references without comments or strings", () => {
    expect(collectCssVariableNames([
      ':root { --cdl-fill: var(--d-surface); content: "--not-a-variable"; } /* --commented */',
      "svg { --diagram-tone: var(--cdl-fill); }",
    ])).toEqual(["--cdl-fill", "--d-surface", "--diagram-tone"]);
  });

  test("reference fixture count only includes known kind and palette file pairs", () => {
    expect(countReferenceFixtureFiles(
      ["路線-図面.html", "路線-端末.html", "図表-図面.html", "路線-未知.html", "README.md"],
      ["路線", "図表"],
      ["図面", "端末"],
    )).toBe(3);
  });
});
