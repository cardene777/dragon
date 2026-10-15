import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { 意匠の字の測り方 } from "@cardenelabs/dragon";
import { describe, expect, it } from "vitest";

import { parseCssRules } from "../../scripts/theme-css-equivalence-core.mjs";

const root = process.cwd();
const cssPath = resolve(root, "apps/playground-spa/src/styles/cdl-theme.css");
const motionPath = resolve(root, "apps/playground-spa/src/styles/theme-motion.css");
const defsPath = resolve(root, "apps/playground-spa/src/components/SvgDefs.tsx");
const exportPath = resolve(root, "apps/playground-spa/scripts/design-export.mjs");

const css = readFileSync(cssPath, "utf8");
const motionCss = readFileSync(motionPath, "utf8");

const fixedThemes = [
  "blueprint",
  "letterpress",
  "catalog",
  "terminal",
  "sketch",
  "neon",
  "relief",
] as const;
const colorOnlyThemes = ["kinari", "celadon"] as const;
const themes = [...fixedThemes, ...colorOnlyThemes] as const;
const excludedFromCommonRules = ["site-colours", "kinari", "celadon"] as const;

const fixedThemeRoles = [
  "--dragon-theme-ground",
  "--dragon-theme-box-fill",
  "--dragon-theme-stripe",
  "--dragon-theme-box-frame",
  "--dragon-theme-line",
  "--dragon-theme-own",
  "--dragon-theme-link",
  "--dragon-theme-accent",
  "--dragon-theme-text",
  "--dragon-theme-muted-text",
  "--dragon-theme-font",
  "--dragon-theme-box-radius",
  "--dragon-theme-box-frame-width",
  "--dragon-theme-selected-box-frame-width",
  "--dragon-theme-row-divider-width",
  "--dragon-theme-line-width",
  "--dragon-theme-box-frame-opacity",
  "--dragon-theme-lane-fill",
  "--dragon-theme-lane-frame",
  "--dragon-theme-lane-frame-width",
  "--dragon-theme-lane-dash",
  "--dragon-theme-tag-fill",
  "--dragon-theme-tag-frame",
  "--dragon-theme-tag-frame-width",
  "--dragon-theme-tag-text",
  "--dragon-theme-tag-faced-text",
  "--dragon-theme-tag-faced-text-weight",
  "--dragon-theme-tag-line-fill",
  "--dragon-theme-tag-line-frame",
  "--dragon-theme-tag-line-text",
  "--dragon-theme-tag-link-fill",
  "--dragon-theme-tag-link-frame",
  "--dragon-theme-tag-link-text",
  "--dragon-theme-tag-own-fill",
  "--dragon-theme-tag-own-frame",
  "--dragon-theme-tag-own-text",
  "--dragon-theme-edge-motion",
  "--dragon-theme-ground-pattern",
  "--dragon-theme-ground-pattern-size",
  "--dragon-theme-box-effect",
  "--dragon-theme-box-group-effect",
  "--dragon-theme-box-part-effect",
  "--dragon-theme-selected-box-effect",
  "--dragon-theme-selected-box-non-rect-effect",
  "--dragon-theme-selected-box-group-effect",
  "--dragon-theme-selected-box-part-effect",
  "--dragon-theme-selected-box-circle-group-part-effect",
  "--dragon-theme-line-effect",
  "--dragon-theme-timeline-number-line-effect",
  "--dragon-theme-box-text-effect",
  "--dragon-theme-tag-effect",
  "--dragon-flow-main",
  "--dragon-flow-mark",
  "--dragon-flow-return-legend",
  "--dragon-flow-lane-divider-dash",
  "--dragon-flow-edge-width",
  "--dragon-flow-return-width",
  "--dragon-flow-return-dash",
  "--dragon-flow-return-cap",
  "--dragon-flow-end-radius",
  "--dragon-flow-end-frame-width",
  "--dragon-flow-end-core-radius",
  "--dragon-flow-decision-fill",
  "--dragon-flow-decision-frame",
  "--dragon-flow-decision-frame-width",
  "--dragon-flow-decision-font-size",
  "--dragon-flow-decision-font-weight",
  "--dragon-flow-label-success-fill",
  "--dragon-flow-label-error-fill",
  "--dragon-flow-label-success-text",
  "--dragon-flow-label-error-text",
  "--dragon-flow-label-success-frame",
  "--dragon-flow-label-error-frame",
  "--dragon-flow-label-radius",
  "--dragon-flow-label-frame-width",
  "--dragon-running-dot-label-backdrop",
  "--dragon-running-dot-label-backdrop-width",
  "--theme-timeline-label-success-fill",
  "--theme-timeline-label-error-fill",
  "--theme-timeline-label-success-text",
  "--theme-timeline-label-error-text",
  "--theme-timeline-label-success-frame",
  "--theme-timeline-label-error-frame",
  "--theme-timeline-label-radius",
  "--theme-timeline-label-frame-width",
  "--theme-timeline-label-height",
  "--theme-timeline-label-font-size",
  "--theme-timeline-label-font-weight",
  "--theme-timeline-yes-width",
  "--theme-timeline-no-width",
  "--theme-timeline-return-width",
  "--theme-timeline-arrow-scale-x",
  "--theme-timeline-arrow-scale-y",
  "--theme-timeline-small-arrow-scale-x",
  "--theme-timeline-small-arrow-scale-y",
] as const;

// 生成りと青磁は共通部品の規則から外す色だけの意匠なので、現在の変数の塊が宣言する役だけを契約にする。
const colorOnlyRoles = [
  "--er-ground",
  "--er-face",
  "--er-stripe",
  "--er-frame",
  "--er-line",
  "--er-own",
  "--er-link",
  "--er-ink",
  "--er-type",
] as const;

type CssRule = { selector: string; body: string };

function withoutComments(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, "");
}

function flatRules(source: string): CssRule[] {
  return [...withoutComments(source).matchAll(/([^{}]+)\{([^{}]*)\}/g)].map((match) => ({
    selector: (match[1] ?? "").trim(),
    body: match[2] ?? "",
  }));
}

function declarations(body: string): Map<string, string> {
  return new Map(
    [...body.matchAll(/(--[a-z0-9-]+)\s*:\s*([^;]+);/gi)].map((match) => [
      match[1]!,
      match[2]!.trim(),
    ]),
  );
}

function normalized(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function sectionAfter(heading: string): string {
  const headingAt = css.indexOf(heading);
  if (headingAt < 0) throw new Error(`節の見出しが無い: ${heading}`);
  const bodyAt = css.indexOf("*/", headingAt) + 2;
  const endAt = css.indexOf("/* ─────────────────", bodyAt);
  return css.slice(bodyAt, endAt < 0 ? css.length : endAt);
}

function exactRule(source: string): { selector: string; body: string } {
  const rules = flatRules(source);
  expect(rules).toHaveLength(1);
  return { selector: normalized(rules[0]!.selector), body: normalized(rules[0]!.body) };
}

function directStyleValues(source: string): string[] {
  const fixedThemeName = new RegExp(`\\[data-cdl-palette="(?:${fixedThemes.join("|")})"\\]`);
  const colorProperty = /^(?:fill|stroke|color|background(?:-color)?|border(?:-[a-z]+)?-color|outline-color|text-decoration-color)$/i;
  const colorRole = /(?:^|-)(?:fill|stroke|color|ink|ground|face|frame|text|mark|main|link|own|accent|backdrop)$/i;
  const widthOrCornerProperty = /(?:^|-)(?:width|radius|rx|ry|r)$/i;
  const colorFunctionOrHex = /(?:#[0-9a-f]{3,8}\b|\b(?:rgba?|hsla?|hwb|lab|lch|oklab|oklch|color|color-mix)\()/i;
  const direct: string[] = [];

  for (const rule of flatRules(source)) {
    if (!fixedThemeName.test(rule.selector)) continue;
    for (const match of withoutComments(rule.body).matchAll(/(^|;)\s*([a-z-]+)\s*:\s*([^;]+)/gi)) {
      const property = match[2]!.trim();
      const value = match[3]!.replace(/\s*!important\s*$/i, "").trim();
      const isDirectColor = !/\bvar\(/i.test(value) &&
        (colorFunctionOrHex.test(value) ||
          ((colorProperty.test(property) || colorRole.test(property)) &&
            /^[a-z]+$/i.test(value) &&
            !/^(?:none|transparent|currentcolor|inherit|initial|unset|revert)$/i.test(value)));
      const isDirectWidthOrCorner = widthOrCornerProperty.test(property) &&
        !/\bvar\(/i.test(value) &&
        /(?:^|\s)-?(?:\d*\.)?\d+(?:[a-z%]+)?(?:\s|$)/i.test(value);
      const isDirectShadow = /(?:url\(#|drop-shadow\()/i.test(value);
      if (isDirectColor || isDirectWidthOrCorner || isDirectShadow) {
        direct.push(`${normalized(rule.selector)} { ${property}: ${value} }`);
      }
    }
  }
  return direct;
}

function tableDeclarations(theme: typeof themes[number]): Map<string, string> {
  const selector = `svg[data-cdl-stage][data-cdl-palette="${theme}"]`;
  const blocks = flatRules(css).filter(({ selector: actual }) => {
    const value = normalized(actual);
    return value === selector || value === `html.dark ${selector}`;
  });
  const result = new Map<string, string>();
  for (const block of blocks) {
    for (const [name, value] of declarations(block.body)) result.set(name, value);
  }
  return result;
}

function fixedTableRules(): CssRule[] {
  return flatRules(css).filter(({ selector, body }) =>
    fixedThemes.some((theme) => normalized(selector) === `svg[data-cdl-stage][data-cdl-palette="${theme}"]`) &&
    body.includes("--dragon-theme-ground:"));
}

function skipComment(source: string, start: number): number {
  const end = source.indexOf("*/", start + 2);
  return end < 0 ? source.length : end + 2;
}

function skipString(source: string, start: number): number {
  const quote = source[start];
  let cursor = start + 1;
  while (cursor < source.length) {
    if (source[cursor] === "\\") cursor += 2;
    else if (source[cursor] === quote) return cursor + 1;
    else cursor += 1;
  }
  return source.length;
}

function matchingBrace(source: string, open: number): number {
  let depth = 1;
  let cursor = open + 1;
  while (cursor < source.length) {
    if (source.startsWith("/*", cursor)) {
      cursor = skipComment(source, cursor);
      continue;
    }
    if (source[cursor] === '"' || source[cursor] === "'") {
      cursor = skipString(source, cursor);
      continue;
    }
    if (source[cursor] === "{") depth += 1;
    else if (source[cursor] === "}" && --depth === 0) return cursor;
    cursor += 1;
  }
  throw new Error("CSS の閉じ波括弧が無い");
}

/** 条件 at-rule は許し、通常の選択子の中へ別の選択子を入れた CSS nesting だけを数える。 */
function nestedQualifiedRuleCount(source: string): number {
  const walk = (from: number, to: number, parentIsQualified: boolean): number => {
    let count = 0;
    let cursor = from;
    let statementStart = from;
    while (cursor < to) {
      if (source.startsWith("/*", cursor)) {
        const commentStart = cursor;
        cursor = skipComment(source, cursor);
        if (source.slice(statementStart, commentStart).trim() === "") statementStart = cursor;
        continue;
      }
      if (source[cursor] === '"' || source[cursor] === "'") {
        cursor = skipString(source, cursor);
        continue;
      }
      if (source[cursor] === ";") {
        cursor += 1;
        statementStart = cursor;
        continue;
      }
      if (source[cursor] !== "{") {
        cursor += 1;
        continue;
      }
      const close = matchingBrace(source, cursor);
      const header = withoutComments(source.slice(statementStart, cursor)).trim();
      const qualified = header !== "" && !header.startsWith("@");
      if (parentIsQualified && header !== "") count += 1;
      count += walk(cursor + 1, close, qualified);
      cursor = close + 1;
      statementStart = cursor;
    }
    return count;
  };
  return walk(0, source.length, false);
}

describe("意匠の値表と共通規則の契約 (#2874)", () => {
  it("9 意匠の表は宣言した役を全て持ち、不足は 0 件", () => {
    const missing: string[] = [];
    for (const theme of themes) {
      const expected = fixedThemes.includes(theme as typeof fixedThemes[number])
        ? fixedThemeRoles
        : colorOnlyRoles;
      const actual = tableDeclarations(theme);
      for (const role of expected) {
        if (!actual.has(role)) missing.push(`${theme}: ${role}`);
      }
    }
    expect(themes).toHaveLength(9);
    expect(missing).toEqual([]);
  });

  it("共通規則が読む役は対象 7 意匠の全表に在り、不足は 0 件", () => {
    const readers = [...flatRules(css), ...flatRules(motionCss)].filter(({ selector, body }) =>
      selector.includes("[data-cdl-palette]:not(") &&
      /var\(--dragon-(?:theme|flow|running-dot)-[a-z0-9-]+/i.test(body));
    const roles = new Set(
      readers.flatMap(({ body }) =>
        [...body.matchAll(/var\((--dragon-(?:theme|flow|running-dot)-[a-z0-9-]+)/gi)]
          .map((match) => match[1]!)),
    );
    const missing: string[] = [];
    for (const rule of readers) {
      const where = /:where\(([^)]*)\)/.exec(rule.selector)?.[1] ?? "";
      const excluded = [...where.matchAll(/\[data-cdl-palette="([^"]+)"\]/g)].map((match) => match[1]!);
      expect([...new Set(excluded)].sort(), normalized(rule.selector)).toEqual(
        [...excludedFromCommonRules].sort(),
      );
    }
    for (const theme of fixedThemes) {
      const table = tableDeclarations(theme);
      for (const role of roles) {
        if (!table.has(role)) missing.push(`${theme}: ${role}`);
      }
    }
    expect(readers.length).toBeGreaterThan(0);
    expect(roles.size).toBeGreaterThan(0);
    expect(missing).toEqual([]);
  });

  it("走る丸の字の下敷きは 7 意匠とも台の色・幅 8 を表に持つ", () => {
    for (const theme of fixedThemes) {
      const table = tableDeclarations(theme);
      expect(table.get("--dragon-running-dot-label-backdrop"), theme).toBe("var(--er-ground)");
      expect(table.get("--dragon-running-dot-label-backdrop-width"), theme).toBe("8");
    }
  });

  it("共通規則は外す 3 配色を除き意匠名を 0 件持つ", () => {
    const commonRuleSource = String.raw`svg\[data-cdl-stage\]\[data-cdl-palette\]:not\(\s*:where\(\s*\[data-cdl-palette="site-colours"\],\s*\[data-cdl-palette="kinari"\],\s*\[data-cdl-palette="celadon"\]\s*\)\s*\)`;
    const rules = [...flatRules(css), ...flatRules(motionCss)]
      .filter(({ selector }) => new RegExp(commonRuleSource).test(selector));
    const named = rules.flatMap(({ selector }) => {
      const withoutExclusions = selector.replace(new RegExp(commonRuleSource, "g"), "");
      return [...withoutExclusions.matchAll(/\[data-cdl-palette="([^"]+)"\]/g)].map((match) => match[1]!);
    });
    console.log(`共通規則: ${rules.length} 件、意匠名指し: ${named.length} 件`);
    expect(rules.length).toBeGreaterThan(0);
    expect(named).toEqual([]);
  });

  it("「図だけの規則」の見出しは 1 件で、節の規則は 0 件", () => {
    const heading = " * 図だけの規則\n";
    expect(css.split(heading)).toHaveLength(2);
    const start = css.indexOf(heading);
    const bodyStart = css.indexOf("*/", start) + 2;
    const end = css.indexOf(" * 共通の部品の決まり (#2874)", bodyStart);
    expect(parseCssRules(css.slice(bodyStart, end), "diagram-only-section").rules).toHaveLength(0);
  });

  it("持ち越し 7 件を同じ選択子と宣言で持ち、危険な規則は基準 41 件を超えない", () => {
    const carryoverMarkers = css.match(/\/\* 持ち越しの目印:/g) ?? [];
    expect(carryoverMarkers).toHaveLength(7);

    const actual = flatRules(css).map((rule) => ({
      selector: normalized(rule.selector),
      body: normalized(rule.body),
    }));
    const expected = [
      `[data-cdl-role="edge-arrowhead"]:is(
        [data-cdl-edge-head="triangle"],
        [data-cdl-edge-head="diamond"],
        [data-cdl-edge-head="open"],
        :not([data-cdl-edge-head])
      ) { transform: scale(2); transform-origin: 9px 5px; }`,
      `[data-cdl-role="edge-arrowhead"][data-cdl-edge-head="crow"] {
        transform: scale(2); transform-origin: 10px 5px;
      }`,
      `[data-cdl-role="edge-glow"] { display: none !important; }`,
      `svg[data-cdl-stage][data-cdl-type="flowchart"]:is([data-cdl-palette="blueprint"], [data-cdl-palette="letterpress"], [data-cdl-palette="catalog"], [data-cdl-palette="terminal"], [data-cdl-palette="sketch"], [data-cdl-palette="neon"], [data-cdl-palette="relief"]) [data-cdl-role="edge-arrowhead"]:is([data-cdl-edge-head="triangle"], :not([data-cdl-edge-head])) {
        transform: scale(1.2142857143, 1.3571428571); transform-origin: 9px 5px;
      }`,
      `svg[data-cdl-stage][data-cdl-palette] [data-cdl-role="edge-flow"] circle[r="12"] {
        fill: var(--er-line) !important; stroke: var(--er-ground) !important;
        stroke-width: 3.5px; filter: drop-shadow(0 0 6px var(--er-line));
      }`,
      `svg[data-cdl-stage][data-cdl-palette] [data-cdl-role="edge-flow"] circle[r="28"] {
        fill: none !important; stroke: var(--er-line) !important; filter: blur(1.2px);
        animation: running-dot-wave-outer 1.4s linear infinite;
      }`,
      `svg[data-cdl-stage][data-cdl-palette] [data-cdl-role="edge-flow"] circle[r="18"] {
        fill: none !important; stroke: var(--er-line) !important; filter: blur(0.6px);
        animation: running-dot-wave-inner 1.4s linear infinite -0.7s;
      }`,
    ].map(exactRule);
    for (const rule of expected) expect(actual).toContainEqual(rule);

    // 注釈を除いた全ての宣言 block を 1 規則とする。keyframes の from/to も各 1 規則に含め、
    // display:none、transform、translate の宣言か、r/rx/ry 属性値で選ぶ選択子を持つ和集合を数える。
    const risky = flatRules(css).filter(({ selector, body }) =>
      /(?:^|;)\s*(?:display\s*:\s*none|transform\s*:|translate\s*:)/m.test(body) ||
      /\[(?:r|rx|ry)\s*[*^$|~]?=/i.test(selector));
    expect(risky.length).toBeGreaterThanOrEqual(7);
    expect(risky.length).toBeLessThanOrEqual(41);
  });

  it("流れ図と走る丸の意匠名付き規則に直書きの色・太さ・角・影は 0 件", () => {
    const flow = sectionAfter(" * 役を持つ意匠の流れ図。");
    const runningDot = sectionAfter(" * 線の上を走る丸 (#2537 / #2770)");
    const direct = [...directStyleValues(flow), ...directStyleValues(runningDot)];
    console.log(`#2875 の 2 節に残る直書きの色・太さ・角・影: ${direct.length} 件`);
    expect(direct).toEqual([]);
  });

  it("持ち越し 4 件を移しても競合規則との前後関係は変わらない", () => {
    const rules = flatRules(css);
    const flowTransform = rules.findIndex(({ selector }) =>
      selector.includes('[data-cdl-type="flowchart"]:is([data-cdl-palette="blueprint"]'));
    const globalTransform = rules.findIndex(({ selector }) =>
      normalized(selector).startsWith('[data-cdl-role="edge-arrowhead"]:is('));
    const stageTransform = rules.findIndex(({ selector }) => selector.includes('[data-cdl-role="stage-column"]'));
    const timelineTransform = rules.findIndex(({ selector }) =>
      selector.includes('[data-cdl-role="timeline-axis"]') && selector.includes("marker:not("));
    const radiusRules = rules.filter(({ selector }) =>
      /\[data-cdl-role="edge-flow"\] circle\[r="(?:12|18|28)"\]/.test(selector));

    // 移動前も、全図の scale(2) より後、舞台・時間軸の上書きより前だった。
    expect(globalTransform).toBeGreaterThanOrEqual(0);
    expect(flowTransform).toBeGreaterThan(globalTransform);
    expect(stageTransform).toBeGreaterThan(flowTransform);
    expect(timelineTransform).toBeGreaterThan(flowTransform);
    // 半径で選ぶ円には同じ半径を選ぶ競合規則が無い。
    expect(radiusRules.map(({ selector }) => selector.match(/circle\[r="(\d+)"\]/)?.[1]).sort())
      .toEqual(["12", "18", "28"]);
  });

  it("表の filter ID は全て定義済みで、元から無い ID は 0 件", () => {
    const ids = new Set(
      [...readFileSync(defsPath, "utf8").matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]!),
    );
    const tableIds = new Set(
      fixedTableRules().flatMap(({ body }) =>
        [...body.matchAll(/url\(#([^)]+)\)/g)].map((match) => match[1]!)),
    );
    const originalTableIds = new Set([
      "dragon-sketch-wobble",
      "dragon-neon-tube",
      "dragon-relief-raised",
      "dragon-relief-dome",
      "dragon-relief-raised-sm",
    ]);
    expect([...tableIds].filter((id) => !ids.has(id))).toEqual([]);
    expect([...tableIds].filter((id) => !originalTableIds.has(id))).toEqual([]);
  });

  it("端末だけが表と字の測り方の両方で等幅を選ぶ", () => {
    const tableMonospace = themes.filter((theme) =>
      /mono/i.test(tableDeclarations(theme).get("--dragon-theme-font") ?? ""));
    const metricsMonospace = themes.filter((theme) => 意匠の字の測り方(theme) === "monospace");
    expect(tableMonospace).toEqual(["terminal"]);
    expect(metricsMonospace).toEqual(["terminal"]);
  });

  it("書き出しは cdl-theme.css だけを読み、2 CSS の入れ子規則は 0 件", () => {
    const exporter = readFileSync(exportPath, "utf8");
    const inputs = [...exporter.matchAll(/resolve\(REPO,\s*"apps\/playground-spa\/src\/styles\/([^"]+\.css)"\)/g)]
      .map((match) => match[1]!);
    expect(inputs).toEqual(["cdl-theme.css"]);
    expect(nestedQualifiedRuleCount(css)).toBe(0);
    expect(nestedQualifiedRuleCount(motionCss)).toBe(0);
  });
});
