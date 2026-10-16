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
  "--theme-stage-column-radius",
  "--theme-stage-card-radius",
  "--theme-stage-face",
  "--theme-stage-frame",
  "--theme-stage-frame-width",
  "--theme-stage-divider",
  "--theme-stage-divider-width",
  "--theme-stage-number",
  "--theme-stage-name",
  "--theme-stage-name-glow",
  "--theme-stage-note",
  "--theme-stage-shadow",
  "--theme-stage-label-success-fill",
  "--theme-stage-label-error-fill",
  "--theme-stage-label-success-text",
  "--theme-stage-label-error-text",
  "--theme-stage-label-success-frame",
  "--theme-stage-label-error-frame",
  "--theme-stage-label-radius",
  "--theme-stage-label-frame-width",
  "--theme-stage-label-font-weight",
  "--dragon-stage-edge-width",
  "--dragon-stage-return-width",
  "--dragon-stage-return-dash",
  "--dragon-stage-return-cap",
  "--dragon-stage-legend-mark",
  "--dragon-stage-return-legend",
  "--dragon-stage-legend-text",
  "--dragon-stage-legend-label-fill",
  "--dragon-stage-legend-curve-width",
  "--dragon-stage-error-line",
  "--dragon-timeline-axis",
  "--dragon-timeline-axis-width",
  "--dragon-timeline-number-fill",
  "--dragon-timeline-number-frame",
  "--dragon-timeline-number-frame-width",
  "--dragon-timeline-number-text",
  "--dragon-timeline-number-font",
  "--dragon-timeline-number-font-weight",
  "--dragon-timeline-leader",
  "--dragon-timeline-leader-width",
  "--dragon-timeline-leader-dash",
  "--dragon-timeline-leader-opacity",
  "--dragon-timeline-note-text",
  "--dragon-timeline-note-font",
  "--dragon-timeline-note-font-size",
  "--dragon-timeline-note-font-weight",
  "--dragon-timeline-card-font-size",
  "--dragon-timeline-card-font-weight",
  "--dragon-timeline-decision-font-size",
  "--dragon-timeline-end-fill",
  "--dragon-timeline-end-frame",
  "--dragon-timeline-end-frame-width",
  "--dragon-timeline-end-core-fill",
  "--dragon-timeline-end-core-radius",
  "--dragon-timeline-legend-mark",
  "--dragon-timeline-return-legend",
  "--dragon-timeline-legend-text",
  "--dragon-timeline-sign-effect",
  "--dragon-timeline-decision-effect",
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
  "--dragon-gantt-series-1",
  "--dragon-gantt-series-2",
  "--dragon-gantt-series-3",
  "--dragon-gantt-series-4",
  "--dragon-gantt-series-5",
  "--dragon-gantt-series-6",
  "--dragon-funnel-series-1",
  "--dragon-funnel-series-2",
  "--dragon-funnel-series-3",
  "--dragon-funnel-series-4",
  "--dragon-funnel-series-5",
  "--dragon-funnel-series-6",
  "--dragon-schedule-opacity",
  "--dragon-gantt-owner-text",
  "--dragon-gantt-secondary-owner-text",
  "--dragon-hierarchy-edge-width",
  "--dragon-hierarchy-card-fill",
  "--dragon-hierarchy-card-frame",
  "--dragon-hierarchy-card-frame-width",
  "--dragon-hierarchy-card-radius",
  "--dragon-hierarchy-card-effect",
  "--dragon-tree-sales-office-card-effect",
  "--dragon-hierarchy-title-text",
  "--dragon-hierarchy-subtitle-text",
  "--dragon-hierarchy-title-effect",
  "--dragon-hierarchy-edge-head-effect",
  "--dragon-hierarchy-edge-head-series-1",
  "--dragon-hierarchy-edge-head-series-2",
  "--dragon-tree-sales-office-ground-pattern",
  "--dragon-mind-redelivery-ground-pattern",
  "--dragon-mind-redelivery-root-fill",
  "--dragon-mind-redelivery-root-effect",
  "--dragon-delivery-relation-state",
  "--dragon-delivery-relation-use",
  "--dragon-delivery-warning",
  "--dragon-delivery-tag-frame-width",
  "--dragon-delivery-terminal-tag-text",
  "--dragon-delivery-row-well-effect",
  "--dragon-delivery-row-glyph-radius",
  "--dragon-delivery-lane-fill",
  "--dragon-delivery-lane-frame",
  "--dragon-delivery-lane-frame-width",
  "--dragon-delivery-lane-dash",
  "--dragon-delivery-lane-effect",
  "--dragon-delivery-body-frame-width",
  "--dragon-delivery-focus-frame-width",
  "--dragon-delivery-focus-effect",
  "--dragon-delivery-cyan-frame",
  "--dragon-delivery-cyan-effect",
  "--dragon-delivery-violet-frame",
  "--dragon-delivery-violet-effect",
  "--dragon-delivery-own-effect",
  "--dragon-delivery-divider-width",
  "--dragon-delivery-group-divider",
  "--dragon-delivery-group-divider-width",
  "--dragon-delivery-sequence-label-radius",
  "--dragon-delivery-sequence-band-fill",
  "--dragon-delivery-sequence-band-frame",
  "--dragon-delivery-sequence-band-frame-width",
  "--dragon-delivery-sequence-band-radius",
  "--dragon-delivery-sequence-band-effect",
  "--dragon-delivery-sequence-thread",
  "--dragon-delivery-sequence-actor-effect",
  "--dragon-delivery-sequence-main-text",
  "--dragon-delivery-sequence-main-text-effect",
  "--dragon-delivery-active-body-frame-width",
  "--dragon-delivery-active-body-effect",
  "--dragon-delivery-component-divider-width",
  "--dragon-delivery-tag-radius",
  "--dragon-chart-secondary-effect",
  "--dragon-chart-primary-effect",
  "--dragon-funnel-primary-effect",
  "--dragon-chart-glow-effect",
  "--dragon-chart-line-effect",
  "--dragon-chart-frame-effect",
  "--dragon-chart-title-effect",
  "--dragon-chart-name-font",
  "--dragon-chart-value-font",
  "--dragon-chart-name-text",
  "--dragon-chart-primary-hatch-fill",
  "--dragon-gantt-default-effect",
  "--dragon-chart-value-text",
  "--dragon-chart-axis-text",
  "--dragon-chart-gauge-value-text",
  "--dragon-chart-gauge-delta-text",
  "--dragon-chart-slope-osaka",
  "--dragon-chart-table-mark-radius",
  "--dragon-chart-table-rule",
  "--dragon-chart-table-rule-width",
  "--dragon-chart-waffle-cell-radius",
  "--dragon-chart-primary-value-text",
  "--dragon-chart-primary-pattern-size",
  "--dragon-chart-primary-pattern-mark-width",
  "--dragon-chart-figure-head-divider",
  "--dragon-chart-figure-footer-divider",
  "--dragon-metro-label-effect",
  "--dragon-chart-series-1-fill",
  "--dragon-chart-series-2-fill",
  "--dragon-chart-series-3-fill",
  "--dragon-chart-series-4-fill",
  "--dragon-chart-band-frame",
  "--dragon-chart-band-frame-width",
  "--dragon-funnel-bar-frame-width",
  "--dragon-chart-stacked-bar-frame-width",
  "--dragon-chart-band-effect",
  "--dragon-chart-stacked-bar-effect",
  "--dragon-chart-band-radius",
  "--dragon-gantt-bar-radius",
  "--dragon-gantt-primary-radius",
  "--dragon-gantt-primary-frame-width",
  "--dragon-gantt-bar-effect",
  "--dragon-gantt-today-mark",
  "--dragon-chart-decision-frame",
  "--dragon-chart-decision-frame-width",
  "--dragon-chart-bar-top-radius",
  "--dragon-chart-bar-bottom-radius",
  "--dragon-stage-detail-card-radius",
  "--dragon-stage-detail-card-effect",
  "--dragon-stage-detail-card-frame-width",
  "--dragon-stage-name-effect",
  "--dragon-stage-card-name-effect",
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
      /\[data-cdl-palette\]:not\(\s*:where\(/.test(selector) &&
      /var\(--(?:dragon-(?:theme|flow|running-dot|stage|timeline|gantt|funnel|schedule|chart)|theme-stage)-[a-z0-9-]+/i.test(body));
    const roles = new Set(
      readers.flatMap(({ body }) =>
        [...body.matchAll(/var\((--(?:dragon-(?:theme|flow|running-dot|stage|timeline|gantt|funnel|schedule|chart)|theme-stage)-[a-z0-9-]+)/gi)]
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

  it("時間軸の表に置いた全役は規則から少なくとも 1 回読まれる", () => {
    const declared = new Set(
      fixedThemes.flatMap((theme) =>
        [...tableDeclarations(theme).keys()].filter((role) =>
          /^(?:--dragon-timeline-|--theme-timeline-)/.test(role)),
      ),
    );
    const read = new Set(
      flatRules(css).flatMap(({ body }) =>
        [...body.matchAll(/var\((--(?:dragon|theme)-timeline-[a-z0-9-]+)/gi)]
          .map((match) => match[1]!),
      ),
    );
    expect([...declared].filter((role) => !read.has(role))).toEqual([]);
  });

  it("段の箱の表に置いた全役は規則から少なくとも 1 回読まれる", () => {
    const declared = new Set(
      fixedThemes.flatMap((theme) =>
        [...tableDeclarations(theme).keys()].filter((role) =>
          /^(?:--dragon-stage-|--theme-stage-)/.test(role)),
      ),
    );
    const read = new Set(
      flatRules(css).flatMap(({ body }) =>
        [...body.matchAll(/var\((--(?:dragon-stage|theme-stage)-[a-z0-9-]+)/gi)]
          .map((match) => match[1]!),
      ),
    );
    expect([...declared].filter((role) => !read.has(role))).toEqual([]);
  });

  it("日程と漏斗の表に置いた全役は規則から少なくとも 1 回読まれる", () => {
    const declared = new Set(
      fixedThemes.flatMap((theme) =>
        [...tableDeclarations(theme).keys()].filter((role) =>
          /^--dragon-(?:gantt|funnel|schedule)-/.test(role)),
      ),
    );
    const read = new Set(
      flatRules(css).flatMap(({ body }) =>
        [...body.matchAll(/var\((--dragon-(?:gantt|funnel|schedule)-[a-z0-9-]+)/gi)]
          .map((match) => match[1]!),
      ),
    );
    expect([...declared].filter((role) => !read.has(role))).toEqual([]);
  });

  it("階層図・マインドマップ・宅配と同じ節で足した表の全役は規則から少なくとも 1 回読まれる", () => {
    const addedRole = /^--dragon-(?:hierarchy-|tree-sales-office-|mind-redelivery-|delivery-|chart-|metro-label-|stage-detail-|stage-name-|stage-card-name-)/;
    const declared = new Set(fixedThemeRoles.filter((role) => addedRole.test(role)));
    const read = new Set(
      flatRules(css).flatMap(({ body }) =>
        [...body.matchAll(/var\((--dragon-[a-z0-9-]+)/gi)].map((match) => match[1]!),
      ),
    );
    expect([...declared].filter((role) => !read.has(role))).toEqual([]);
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

  it("図だけの規則 243 件を移動先だけに持ち、移動元 6 節は 0 件", () => {
    const heading = " * 図だけの規則\n";
    expect(css.split(heading)).toHaveLength(2);
    const namedDiagramRule = /data-cdl-diagram="|data-cdl-node="[^"]*-chart"/;
    const diagramRules = parseCssRules(
      sectionAfter(heading.trimEnd()),
      "diagram-only-section",
    ).rules;
    const firstSourceRules = parseCssRules(
      sectionAfter(" * 見本帳の階層図とマインドマップ (#2854 6a)"),
      "hierarchy-source-6a",
    ).rules;
    const secondSourceRules = parseCssRules(
      sectionAfter(" * 見本帳の階層図とマインドマップ (#2854 7c / round 5)"),
      "hierarchy-source-7c",
    ).rules;
    const deliverySourceRules = parseCssRules(
      sectionAfter(" * 宅配の 4 つの記法見本 (#2836)"),
      "delivery-source",
    ).rules;
    const chartSourceRules = [
      parseCssRules(
        sectionAfter("── 宅配の図表を意匠帳の役割色へ揃える (#2837)"),
        "chart-source-2837",
      ).rules,
      parseCssRules(
        sectionAfter(" * #2854 3段目b: 図表と数の見本を cdl 0.128.0 の role へ当てる。"),
        "chart-source-3b",
      ).rules,
      parseCssRules(
        sectionAfter(" * 見本帳 3 段目 k: 図表の意匠だけを補正する。"),
        "chart-source-3k",
      ).rules,
    ];

    expect(diagramRules).toHaveLength(246);
    expect(diagramRules.filter(({ selector }) => namedDiagramRule.test(selector))).toHaveLength(243);
    expect(firstSourceRules.filter(({ selector }) => namedDiagramRule.test(selector))).toHaveLength(0);
    expect(secondSourceRules.filter(({ selector }) => namedDiagramRule.test(selector))).toHaveLength(0);
    expect(deliverySourceRules.filter(({ selector }) => namedDiagramRule.test(selector))).toHaveLength(0);
    for (const sourceRules of chartSourceRules) {
      expect(sourceRules.filter(({ selector }) => namedDiagramRule.test(selector))).toHaveLength(0);
    }

    const firstHeadingAt = css.indexOf(" * 見本帳の階層図とマインドマップ (#2854 6a)");
    const secondHeadingAt = css.indexOf(" * 見本帳の階層図とマインドマップ (#2854 7c / round 5)");
    const diagramHeadingAt = css.indexOf(heading);
    expect(secondHeadingAt).toBeGreaterThan(firstHeadingAt);
    expect(diagramHeadingAt).toBeGreaterThan(secondHeadingAt);
  });

  it("持ち越し 34 件を同じ選択子と宣言で持ち、危険な規則は基準 41 件を超えない", () => {
    const carryoverMarkers = css.match(/\/\* 持ち越しの目印:/g) ?? [];
    expect(carryoverMarkers).toHaveLength(34);

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
      `svg[data-cdl-stage]:is([data-cdl-palette="blueprint"], [data-cdl-palette="letterpress"], [data-cdl-palette="catalog"], [data-cdl-palette="terminal"], [data-cdl-palette="sketch"], [data-cdl-palette="neon"], [data-cdl-palette="relief"]):has([data-cdl-role="stage-column"]) [data-cdl-role="edge-arrowhead"]:is([data-cdl-edge-head="triangle"], :not([data-cdl-edge-head])) {
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
      `svg[data-cdl-stage][data-cdl-palette]
        [data-cdl-lane="timeline-axis"][data-cdl-kind="decision"]
        [data-cdl-role="node-kind-icon"] { display: none; }`,
      `from { opacity: 0; translate: 0 22px; scale: 0.985; }`,
      `to { translate: 0 0; scale: 1; }`,
      `svg[data-cdl-stage]:is([data-cdl-palette="blueprint"], [data-cdl-palette="letterpress"], [data-cdl-palette="catalog"], [data-cdl-palette="terminal"], [data-cdl-palette="sketch"], [data-cdl-palette="neon"], [data-cdl-palette="relief"]):has([data-cdl-role="timeline-axis"])
        marker:not([id$="-sm"])
        > [data-cdl-role="edge-arrowhead"][data-cdl-edge-head="triangle"] {
        transform: scale(var(--theme-timeline-arrow-scale-x), var(--theme-timeline-arrow-scale-y));
        transform-origin: 9px 5px;
      }`,
      `svg[data-cdl-stage]:is([data-cdl-palette="blueprint"], [data-cdl-palette="letterpress"], [data-cdl-palette="catalog"], [data-cdl-palette="terminal"], [data-cdl-palette="sketch"], [data-cdl-palette="neon"], [data-cdl-palette="relief"]):has([data-cdl-role="timeline-axis"])
        marker[id$="-sm"]
        > [data-cdl-role="edge-arrowhead"][data-cdl-edge-head="triangle"] {
        transform: scale(var(--theme-timeline-small-arrow-scale-x), var(--theme-timeline-small-arrow-scale-y));
        transform-origin: 9px 5px;
      }`,
      `svg[data-cdl-stage]:is( [data-cdl-palette="blueprint"], [data-cdl-palette="letterpress"], [data-cdl-palette="catalog"], [data-cdl-palette="terminal"], [data-cdl-palette="sketch"], [data-cdl-palette="neon"], [data-cdl-palette="relief"] )
        :is([data-cdl-node="営業所の階層-chart"], [data-cdl-node="再配達を減らす-chart"])
        [data-cdl-role="node-body"] { display: none !important; }`,
      `svg[data-cdl-stage]:is( [data-cdl-palette="blueprint"], [data-cdl-palette="letterpress"], [data-cdl-palette="catalog"], [data-cdl-palette="terminal"], [data-cdl-palette="sketch"], [data-cdl-palette="neon"], [data-cdl-palette="relief"] )
        :is([data-cdl-node="営業所の階層-chart"], [data-cdl-node="再配達を減らす-chart"])
        [data-cdl-role="figure-title"] { display: none !important; }`,
      `svg[data-cdl-stage]:is( [data-cdl-palette="blueprint"], [data-cdl-palette="letterpress"], [data-cdl-palette="catalog"], [data-cdl-palette="terminal"], [data-cdl-palette="sketch"], [data-cdl-palette="neon"], [data-cdl-palette="relief"] )
        [data-cdl-node="営業所の階層-chart"] [data-cdl-role="tree-edge-head"] {
        transform: translateY(-12.5px);
      }`,
      `svg[data-cdl-stage]:is( [data-cdl-palette="blueprint"], [data-cdl-palette="letterpress"], [data-cdl-palette="catalog"], [data-cdl-palette="terminal"], [data-cdl-palette="sketch"], [data-cdl-palette="neon"], [data-cdl-palette="relief"] )
        [data-cdl-node="営業所の階層-chart"] { translate: 0 -14px; }`,
      `svg[data-cdl-stage]:is( [data-cdl-palette="blueprint"], [data-cdl-palette="letterpress"], [data-cdl-palette="catalog"], [data-cdl-palette="terminal"], [data-cdl-palette="sketch"], [data-cdl-palette="neon"], [data-cdl-palette="relief"] )
        [data-cdl-node="再配達を減らす-chart"] { translate: 20px -32px; }`,
      `svg[data-cdl-stage]:is( [data-cdl-palette="blueprint"], [data-cdl-palette="letterpress"], [data-cdl-palette="catalog"], [data-cdl-palette="terminal"], [data-cdl-palette="sketch"], [data-cdl-palette="neon"], [data-cdl-palette="relief"] )
        [data-cdl-node="再配達を減らす-chart"]
        :is([data-cdl-role="mind-root-title"], [data-cdl-role="mind-box-title"]) { translate: 0 7px; }`,
      `svg[data-cdl-stage][data-cdl-palette="terminal"] [data-cdl-node="再配達を減らす-chart"]
        :is([data-cdl-role="mind-root-title"], [data-cdl-role="mind-box-title"]) { translate: 0 0; }`,
      `svg[data-cdl-stage][data-cdl-palette="relief"] [data-cdl-node="営業所の階層-chart"]
        :is([data-cdl-role="tree-node-title"], [data-cdl-role="tree-node-subtitle"]) { translate: 0 3px; }`,
      `svg[data-cdl-stage][data-cdl-palette="relief"] [data-cdl-node="再配達を減らす-chart"]
        :is([data-cdl-role="mind-root-title"], [data-cdl-role="mind-box-title"]) { translate: 0 11px; }`,
      `svg[data-cdl-stage][data-cdl-palette="terminal"] [data-cdl-role="chart-waffle-item-share"] {
        transform: translateX(-16px);
      }`,
      `svg[data-cdl-stage][data-cdl-palette] [data-cdl-kind="chart-bar"] [data-cdl-role="chart-bar-label"] {
        transform: translateY(var(--catalog-bar-label-y));
      }`,
      `svg[data-cdl-stage][data-cdl-palette] [data-cdl-kind="chart-bar"] [data-cdl-role="chart-bar-value"] {
        transform: translateY(var(--catalog-bar-value-y));
      }`,
      `:is([data-cdl-diagram="delivery-relations-demo"], [data-cdl-diagram="delivery-classes-demo"])
        svg[data-cdl-stage][data-cdl-palette="blueprint"] [data-cdl-role="node-row-glyph"] {
        rx: var(--dragon-delivery-row-glyph-radius);
        ry: var(--dragon-delivery-row-glyph-radius);
        transform-box: fill-box;
        transform-origin: center;
        transform: rotate(45deg) !important;
      }`,
      `[data-cdl-diagram="delivery-sequence-demo"]
        svg[data-cdl-stage][data-cdl-palette="blueprint"] [data-cdl-role="sequence-label-mark"] {
        transform: rotate(45deg) !important;
      }`,
      `svg[data-cdl-stage]:is(
        [data-cdl-palette="blueprint"], [data-cdl-palette="letterpress"],
        [data-cdl-palette="catalog"], [data-cdl-palette="terminal"],
        [data-cdl-palette="sketch"], [data-cdl-palette="neon"], [data-cdl-palette="relief"]
      ) [data-cdl-node="営業所の階層-chart"][data-cdl-kind="tree-hierarchy"] [data-cdl-role="tree-node"] + rect,
      svg[data-cdl-stage]:is(
        [data-cdl-palette="blueprint"], [data-cdl-palette="letterpress"],
        [data-cdl-palette="catalog"], [data-cdl-palette="terminal"],
        [data-cdl-palette="sketch"], [data-cdl-palette="neon"], [data-cdl-palette="relief"]
      ) [data-cdl-node="営業所の階層-chart"][data-cdl-kind="tree-hierarchy"] [data-cdl-role="tree-edge"] + circle {
        display: none;
      }`,
      `svg[data-cdl-stage]:is(
        [data-cdl-palette="blueprint"], [data-cdl-palette="letterpress"],
        [data-cdl-palette="catalog"], [data-cdl-palette="terminal"],
        [data-cdl-palette="sketch"], [data-cdl-palette="neon"], [data-cdl-palette="relief"]
      ) [data-cdl-kind="journey-map"] :is([data-cdl-role="journey-band"], [data-cdl-role="node-column-divider"]),
      svg[data-cdl-stage]:is(
        [data-cdl-palette="blueprint"], [data-cdl-palette="letterpress"],
        [data-cdl-palette="catalog"], [data-cdl-palette="terminal"],
        [data-cdl-palette="sketch"], [data-cdl-palette="neon"], [data-cdl-palette="relief"]
      ) [data-cdl-kind="journey-map"] [data-cdl-role="journey-step"] > circle + circle {
        display: none;
      }`,
      `svg[data-cdl-stage]:is(
        [data-cdl-palette="letterpress"], [data-cdl-palette="catalog"],
        [data-cdl-palette="terminal"], [data-cdl-palette="neon"], [data-cdl-palette="relief"]
      ) [data-cdl-role="gantt-bar-hatch"] { display: none; }`,
      `svg[data-cdl-stage][data-cdl-palette="blueprint"]
        :is([data-cdl-role="chart-pie-table-mark"], [data-cdl-role="chart-waffle-item-mark"]) {
        transform: rotate(45deg);
      }`,
      `svg[data-cdl-stage]:is([data-cdl-palette="catalog"], [data-cdl-palette="neon"], [data-cdl-palette="relief"])
        :is([data-cdl-role="chart-pie-table-rule"], [data-cdl-role="chart-waffle-item-rule"]) {
        display: none;
      }`,
      `svg[data-cdl-stage]:is(
        [data-cdl-palette="letterpress"], [data-cdl-palette="catalog"],
        [data-cdl-palette="terminal"], [data-cdl-palette="neon"], [data-cdl-palette="relief"]
      ) :is([data-cdl-role="funnel-stage-hatch"], [data-cdl-role="chart-stacked-bar-slice-hatch"]) {
        display: none;
      }`,
      `svg[data-cdl-stage][data-cdl-palette] [data-cdl-kind="gantt-timeline"] [data-cdl-role="gantt-row"],
      svg[data-cdl-stage][data-cdl-palette] [data-cdl-kind="gantt-timeline"] line:not([data-cdl-role]) {
        display: none;
      }`,
    ].map(exactRule);
    for (const rule of expected) expect(actual).toContainEqual(rule);

    // 注釈を除いた全ての宣言 block を 1 規則とする。keyframes の from/to も各 1 規則に含め、
    // display:none、transform、translate の宣言か、r/rx/ry 属性値で選ぶ選択子を持つ和集合を数える。
    const risky = flatRules(css).filter(({ selector, body }) =>
      /(?:^|;)\s*(?:display\s*:\s*none|transform\s*:|translate\s*:)/m.test(body) ||
      /\[(?:r|rx|ry)\s*[*^$|~]?=/i.test(selector));
    expect(risky.length).toBeGreaterThanOrEqual(12);
    expect(risky.length).toBeLessThanOrEqual(41);
  });

  it("流れ図と走る丸の意匠名付き規則に直書きの色・太さ・角・影は 0 件", () => {
    const flow = sectionAfter(" * 役を持つ意匠の流れ図。");
    const runningDot = sectionAfter(" * 線の上を走る丸 (#2537 / #2770)");
    const direct = [...directStyleValues(flow), ...directStyleValues(runningDot)];
    console.log(`#2875 の 2 節に残る直書きの色・太さ・角・影: ${direct.length} 件`);
    expect(direct).toEqual([]);
  });

  it("時間軸の 2 節の意匠名付き規則に直書きの色・太さ・角・影は 0 件", () => {
    const timeline = sectionAfter(" * 時間軸。");
    const fixedTimeline = sectionAfter(" * 固定 7 意匠の時間軸。");
    const direct = [...directStyleValues(timeline), ...directStyleValues(fixedTimeline)];
    console.log(`#2876 の 2 節に残る直書きの色・太さ・角・影: ${direct.length} 件`);
    expect(direct).toEqual([]);
  });

  it("段の箱の節の意匠名付き規則に直書きの色・太さ・角・影は 0 件", () => {
    const stage = sectionAfter(" * 段の箱の列 (#2831)");
    const direct = directStyleValues(stage);
    console.log(`#2877 の段の箱の節に残る直書きの色・太さ・角・影: ${direct.length} 件`);
    expect(direct).toEqual([]);
  });

  it("日程の 2 節の意匠名付き規則に直書きの色・太さ・角・影は 0 件で、持ち越し対象も 0 件", () => {
    const schedule = [
      sectionAfter(" * 固定の意匠の日程の棒と漏斗の段 (#2801)"),
      sectionAfter(" * 日程の帯と帯の上の担当の字 (#2826)"),
    ];
    const direct = schedule.flatMap(directStyleValues);
    const risky = schedule.flatMap((source) => flatRules(source)).filter(({ selector, body }) =>
      /(?:^|;)\s*(?:display\s*:\s*none|transform\s*:|translate\s*:)/m.test(body) ||
      /\[(?:r|rx|ry)\s*[*^$|~]?=/i.test(selector));
    console.log(`#2878 の 2 節に残る直書きの色・太さ・角・影: ${direct.length} 件、持ち越し対象: ${risky.length} 件`);
    expect(direct).toEqual([]);
    expect(risky).toEqual([]);
  });

  it("図表と数の 3 節の意匠名付き規則に直書きの色・太さ・角・影は 0 件で、持ち越し対象も 0 件", () => {
    const chart = [
      sectionAfter("── 宅配の図表を意匠帳の役割色へ揃える (#2837)"),
      sectionAfter(" * #2854 3段目b: 図表と数の見本を cdl 0.128.0 の role へ当てる。"),
      sectionAfter(" * 見本帳 3 段目 k: 図表の意匠だけを補正する。"),
    ];
    const direct = chart.flatMap(directStyleValues);
    const risky = chart.flatMap((source) => flatRules(source)).filter(({ selector, body }) =>
      /(?:^|;)\s*(?:display\s*:\s*none|transform\s*:|translate\s*:)/m.test(body) ||
      /\[(?:r|rx|ry)\s*[*^$|~]?=/i.test(selector));
    console.log(`#2881 の 3 節に残る直書きの色・太さ・角・影: ${direct.length} 件、持ち越し対象: ${risky.length} 件`);
    expect(direct).toEqual([]);
    expect(risky).toEqual([]);
  });

  it("階層図の 2 節と図だけの規則（宅配を含む）に直書きの色・太さ・角・影は 0 件", () => {
    const hierarchy = [
      sectionAfter(" * 見本帳の階層図とマインドマップ (#2854 6a)"),
      sectionAfter(" * 見本帳の階層図とマインドマップ (#2854 7c / round 5)"),
      sectionAfter(" * 図だけの規則"),
    ];
    const direct = hierarchy.flatMap(directStyleValues);
    console.log(`#2879 / #2880 の 3 節に残る直書きの色・太さ・角・影: ${direct.length} 件`);
    expect(direct).toEqual([]);
  });

  it("持ち越し 34 件を移しても競合規則との前後関係は変わらない", () => {
    const rules = flatRules(css);
    const flowTransform = rules.findIndex(({ selector }) =>
      selector.includes('[data-cdl-type="flowchart"]:is([data-cdl-palette="blueprint"]'));
    const globalTransform = rules.findIndex(({ selector }) =>
      normalized(selector).startsWith('[data-cdl-role="edge-arrowhead"]:is('));
    const stageTransform = rules.findIndex(({ selector }) => selector.includes('[data-cdl-role="stage-column"]'));
    const timelineTransform = rules.findIndex(({ selector }) =>
      selector.includes('[data-cdl-role="timeline-axis"]') && selector.includes("marker:not("));
    const timelineSmallTransform = rules.findIndex(({ selector }) =>
      selector.includes('[data-cdl-role="timeline-axis"]') && selector.includes('marker[id$="-sm"]'));
    const timelineHiddenIcon = rules.findIndex(({ selector, body }) =>
      selector.includes('[data-cdl-lane="timeline-axis"][data-cdl-kind="decision"]') &&
      body.includes("display: none"));
    const radiusRules = rules.filter(({ selector }) =>
      /\[data-cdl-role="edge-flow"\] circle\[r="(?:12|18|28)"\]/.test(selector));
    const deliveryGlyphTransform = rules.filter(({ selector, body }) =>
      selector.includes('[data-cdl-diagram="delivery-relations-demo"]') &&
      selector.includes('[data-cdl-role="node-row-glyph"]') &&
      body.includes("transform: rotate(45deg)"));
    const deliverySequenceTransform = rules.filter(({ selector, body }) =>
      selector.includes('[data-cdl-diagram="delivery-sequence-demo"]') &&
      selector.includes('[data-cdl-role="sequence-label-mark"]') &&
      body.includes("transform: rotate(45deg)"));
    const chartCarryovers = [
      rules.filter(({ selector, body }) =>
        selector.includes('[data-cdl-node="営業所の階層-chart"]') &&
        selector.includes('[data-cdl-role="tree-node"] + rect') &&
        selector.includes('[data-cdl-role="tree-edge"] + circle') &&
        body.includes("display: none")),
      rules.filter(({ selector, body }) =>
        selector.includes('[data-cdl-role="journey-band"]') && body.includes("display: none")),
      rules.filter(({ selector, body }) =>
        selector.includes('[data-cdl-role="gantt-bar-hatch"]') && body.includes("display: none")),
      rules.filter(({ selector, body }) =>
        selector.includes('[data-cdl-role="chart-pie-table-mark"]') && body.includes("rotate(45deg)")),
      rules.filter(({ selector, body }) =>
        selector.includes('[data-cdl-role="chart-pie-table-rule"]') && body.includes("display: none")),
      rules.filter(({ selector, body }) =>
        selector.includes('[data-cdl-role="funnel-stage-hatch"]') && body.includes("display: none")),
      rules.filter(({ selector, body }) =>
        selector.includes('[data-cdl-role="gantt-row"]') && body.includes("display: none")),
    ];

    // 移動前と同じく、図種固有の矢じりは全図の scale(2) より後に置く。
    expect(globalTransform).toBeGreaterThanOrEqual(0);
    expect(flowTransform).toBeGreaterThan(globalTransform);
    expect(stageTransform).toBeGreaterThan(flowTransform);
    expect(timelineTransform).toBeGreaterThan(flowTransform);
    expect(timelineSmallTransform).toBeGreaterThan(flowTransform);
    expect(timelineHiddenIcon).toBeGreaterThan(flowTransform);
    expect(css.match(/@keyframes catalog-lift-in/g)).toHaveLength(1);
    // 半径で選ぶ円には同じ半径を選ぶ競合規則が無い。
    expect(radiusRules.map(({ selector }) => selector.match(/circle\[r="(\d+)"\]/)?.[1]).sort())
      .toEqual(["12", "18", "28"]);
    // 2 規則は別の役と意匠だけを選び、同じ transform を競合させる規則を持たない。
    expect(deliveryGlyphTransform).toHaveLength(1);
    expect(deliverySequenceTransform).toHaveLength(1);
    // #2881 の 7 規則は同じ対象・宣言を持つ競合が無いため、後ろへ移しても勝ち負けを変えない。
    for (const [index, carryover] of chartCarryovers.entries()) {
      expect(carryover, `#2881 の持ち越し ${index + 1}`).toHaveLength(1);
    }
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
      "dragon-flow-sign-terminal-glow",
      "dragon-flow-sign-neon-glow",
      "dragon-flow-sign-relief-raised",
      "dragon-neon-violet-frame",
      "dragon-neon-pink-frame",
      "dragon-relief-raised",
      "dragon-relief-dome",
      "dragon-relief-raised-sm",
      "dragon-catalog-tree-shadow",
      "dragon-terminal-card-gradient",
      "dragon-metro-terminal-glow",
      "dragon-metro-terminal-glow-label",
      "dragon-metro-neon-glow",
      "dragon-neon-figure-frame",
      "dragon-neon-title-cyan",
      "dragon-metro-neon-glow-label",
      "dragon-neon-title-pink",
      "dragon-neon-title-violet",
      "dragon-metro-relief-shadow",
      "dragon-relief-figure-frame",
      "dragon-relief-chart-1",
      "dragon-relief-chart-2",
      "dragon-relief-chart-3",
      "dragon-relief-chart-4",
      "dragon-relief-raised-contained",
      "dragon-sketch-pen-primary",
      "dragon-sketch-pen",
      "dragon-relief-mind-root",
      "dragon-relief-figure-inset",
      "dragon-bp-hatch",
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
