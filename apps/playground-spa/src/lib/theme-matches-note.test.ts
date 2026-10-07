/**
 * 意匠帳と画面の CSS の 9 つの口を突き合わせる (#2790)。
 *
 * 同じ意匠の塊は足し合わせる。図面は色の塊と作りの塊を持つため、後の塊で前を上書きすると
 * 9 色を 0 件にしても検査が通る。明暗か固定かは意匠帳の表の列数から読む。
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { THEMES, type DslTheme } from "@cardenelabs/dragon";
import { describe, expect, it } from "vitest";

import {
  THEME_PORTS,
  THEME_TONES,
  readBlueprintHatch,
  readFixedThemeChartSeries,
  readFixedThemeFrameOpacity,
  readFixedThemeGroundText,
  readFixedThemeLabelToneStyles,
  readFixedThemeLead,
  readFixedThemeMetroLineOpacity,
  readFixedThemeOutline,
  readFixedThemeRoleColor,
  readFixedThemeSingleSeriesBars,
  readFixedThemeToneSeries,
  readMetroThemeNotes,
  readThemeNotes,
  readThemeNoteText,
  themeGanttSeriesColors,
  type ThemeNote,
  type MetroColorRole,
  type ThemePort,
  type ThemeToneSeries,
} from "../../tests/helpers/theme-notes";
import { contrast } from "../../tests/helpers/pixel-contrast";

const 読む = (rel: string): string =>
  readFileSync(fileURLToPath(new URL(rel, import.meta.url)), "utf8");

type CssTheme = { light: Map<ThemePort, string>; dark: Map<ThemePort, string>; hasDarkBlock: boolean };
type CssChartTheme = { cdl: string[]; dragon: string[]; colors: string[] };
type CssMetroTheme = {
  light: Map<MetroColorRole, string>;
  dark: Map<MetroColorRole, string>;
};
const METRO_CSS_ROLES = {
  main: "main",
  yes: "yes",
  no: "no",
  "branch-ink": "branchInk",
  "station-face": "stationFace",
  "station-ink": "stationInk",
  "station-ground": "stationGround",
  mark: "mark",
  guide: "guide",
  "badge-face": "badgeFace",
  "badge-frame": "badgeFrame",
  "badge-title": "badgeTitle",
  "badge-subtitle": "badgeSubtitle",
  "decision-face": "decisionFace",
  "decision-frame": "decisionFrame",
  "decision-ink": "decisionInk",
} as const satisfies Record<string, MetroColorRole>;
const TEXT_TONES = ["accent", "teal", "success", "error", "warning", "info"] as const;
const TEXT_BACKGROUNDS = ["ground", "face", "stripe"] as const;
const CARD_TEXT_BACKGROUNDS = ["face", "stripe"] as const;
const LABEL_TONES = {
  accent: "one",
  info: "one",
  success: "two",
  teal: "three",
  error: "three",
  warning: "three",
} as const;

function cssThemes(cssText: string): Map<string, CssTheme> {
  const css = cssText.replace(/\/\*[\s\S]*?\*\//g, "");
  const out = new Map<string, CssTheme>();
  for (const m of css.matchAll(/([^{}]*)\{([^{}]*)\}/g)) {
    const selector = m[1] ?? "";
    const body = m[2] ?? "";
    const named = /\[data-cdl-palette="([^"]+)"\]/.exec(selector);
    if (!named?.[1]) continue;
    const theme = out.get(named[1]) ?? {
      light: new Map<ThemePort, string>(),
      dark: new Map<ThemePort, string>(),
      hasDarkBlock: false,
    };
    const dark = selector.includes("html.dark");
    if (dark) theme.hasDarkBlock = true;
    const side = dark ? theme.dark : theme.light;
    for (const value of body.matchAll(/--er-([a-z-]+)\s*:\s*(#[0-9a-fA-F]{6})\s*;/g)) {
      const port = value[1] as ThemePort | undefined;
      if (port && THEME_PORTS.includes(port)) side.set(port, value[2]!.toLowerCase());
    }
    out.set(named[1], theme);
  }
  return out;
}

function cssMetroThemes(cssText: string): Map<string, CssMetroTheme> {
  const css = cssText.replace(/\/\*[\s\S]*?\*\//g, "");
  const out = new Map<string, CssMetroTheme>();
  for (const match of css.matchAll(/([^{}]*)\{([^{}]*)\}/g)) {
    const selector = match[1] ?? "";
    const named = /\[data-cdl-palette="([^"]+)"\]/.exec(selector);
    if (!named?.[1]) continue;
    const theme = out.get(named[1]) ?? {
      light: new Map<MetroColorRole, string>(),
      dark: new Map<MetroColorRole, string>(),
    };
    const side = selector.includes("html.dark") ? theme.dark : theme.light;
    for (const declaration of (match[2] ?? "").matchAll(/--metro-([a-z-]+)\s*:\s*(#[0-9a-fA-F]{6})\s*;/g)) {
      const role = declaration[1] ? METRO_CSS_ROLES[declaration[1] as keyof typeof METRO_CSS_ROLES] : undefined;
      if (role) side.set(role, declaration[2]!.toLowerCase());
    }
    out.set(named[1], theme);
  }
  return out;
}

function cssChartThemes(cssText: string, fixedNames: Set<string>): Map<string, CssChartTheme> {
  const css = cssText.replace(/\/\*[\s\S]*?\*\//g, "");
  const out = new Map<string, CssChartTheme>();
  for (const m of css.matchAll(/([^{}]*)\{([^{}]*)\}/g)) {
    const selector = (m[1] ?? "").trim();
    const body = m[2] ?? "";
    const named = /^svg\[data-cdl-stage\]\[data-cdl-palette="([^"]+)"\]$/.exec(selector);
    if (!named?.[1]) continue;
    const themeName = named[1];
    if (!fixedNames.has(themeName)) continue;

    const declarations = new Map<string, string>();
    for (const value of body.matchAll(/--([a-z0-9-]+)\s*:\s*([^;]+)\s*;/gi)) {
      const property = value[1];
      const declaration = value[2];
      if (!property || !declaration) throw new Error(`${themeName} の CSS 宣言を読めない`);
      declarations.set(property, declaration.trim().toLowerCase());
    }
    if (![...declarations.keys()].some((name) => /^(?:cdl|d)-chart-/.test(name))) continue;
    if (out.has(themeName)) throw new Error(`${themeName} の図表の系列色を持つ塊が複数ある`);

    const chartValues = (prefix: "cdl" | "d"): string[] =>
      Array.from({ length: 6 }, (_, index) => {
        const name = `${prefix}-chart-${index + 1}`;
        const value = declarations.get(name);
        if (!value) throw new Error(`${themeName} の --${name} が無い`);
        return value;
      });
    const resolve = (value: string): string => {
      const literal = /^(#[0-9a-f]{6})$/.exec(value)?.[1];
      if (literal) return literal;
      const variable = /^var\(--([a-z0-9-]+)\)$/.exec(value)?.[1];
      const resolved = variable ? declarations.get(variable) : undefined;
      if (!resolved || !/^#[0-9a-f]{6}$/.test(resolved)) {
        throw new Error(`${themeName} の図表の値 ${value} を同じ塊の CSS 変数から解けない`);
      }
      return resolved;
    };
    const cdl = chartValues("cdl");
    out.set(themeName, { cdl, dragon: chartValues("d"), colors: cdl.map(resolve) });
  }
  return out;
}

function rgb(hex: string): [number, number, number] {
  const value = Number.parseInt(hex.slice(1), 16);
  return [value >> 16, (value >> 8) & 255, value & 255];
}

function hue(hex: string): number {
  const [red, green, blue] = rgb(hex).map((value) => value / 255) as [number, number, number];
  const maximum = Math.max(red, green, blue);
  const minimum = Math.min(red, green, blue);
  const delta = maximum - minimum;
  if (delta === 0) return 0;
  const sector = maximum === red
    ? ((green - blue) / delta) % 6
    : maximum === green
      ? (blue - red) / delta + 2
      : (red - green) / delta + 4;
  return (sector * 60 + 360) % 360;
}

function hueDifference(left: string, right: string): number {
  const difference = Math.abs(hue(left) - hue(right));
  return Math.min(difference, 360 - difference);
}

function cssFixedThemeDeclarations(cssText: string, themeName: string): Map<string, string> {
  const css = cssText.replace(/\/\*[\s\S]*?\*\//g, "");
  const declarations = new Map<string, string>();
  const namedStage = `svg[data-cdl-stage][data-cdl-palette="${themeName}"]`;
  const sharedStage = "svg[data-cdl-stage][data-cdl-palette]";
  for (const m of css.matchAll(/([^{}]*)\{([^{}]*)\}/g)) {
    const selector = m[1] ?? "";
    const applies = selector.split(",").some((part) => {
      const exact = part.trim();
      return exact === namedStage || exact === sharedStage;
    });
    if (!applies) continue;
    for (const value of (m[2] ?? "").matchAll(/--([a-z0-9-]+)\s*:\s*([^;]+)\s*;/gi)) {
      const property = value[1];
      const declaration = value[2];
      if (!property || !declaration) throw new Error(`${themeName} の CSS 宣言を読めない`);
      declarations.set(property, declaration.trim().toLowerCase());
    }
  }
  return declarations;
}

/** 舞台の値へ、面を持つ箱で宣言し直した値だけを重ねる。 */
function cssFixedThemeBoxDeclarations(cssText: string, themeName: string): Map<string, string> {
  const css = cssText.replace(/\/\*[\s\S]*?\*\//g, "");
  const declarations = cssFixedThemeDeclarations(cssText, themeName);
  const named = `[data-cdl-palette="${themeName}"]`;
  for (const m of css.matchAll(/([^{}]*)\{([^{}]*)\}/g)) {
    const selector = m[1] ?? "";
    const applies = selector.split(",").some((part) =>
      part.includes(named) && part.includes("[data-cdl-node]:has("));
    if (!applies) continue;
    for (const value of (m[2] ?? "").matchAll(/--([a-z0-9-]+)\s*:\s*([^;]+)\s*;/gi)) {
      const property = value[1];
      const declaration = value[2];
      if (!property || !declaration) throw new Error(`${themeName} の箱の CSS 宣言を読めない`);
      declarations.set(property, declaration.trim().toLowerCase());
    }
  }
  return declarations;
}

function resolveCssColor(
  declarations: Map<string, string>,
  property: string,
  seen = new Set<string>(),
): string {
  if (seen.has(property)) throw new Error(`--${property} の参照が循環している`);
  const value = declarations.get(property);
  if (!value) throw new Error(`--${property} が無い`);
  const literal = /^(#[0-9a-f]{6})$/.exec(value)?.[1];
  if (literal) return literal;
  const variable = /^var\(--([a-z0-9-]+)\)$/.exec(value)?.[1];
  if (!variable) throw new Error(`--${property} の値 ${value} を色へ解けない`);
  return resolveCssColor(declarations, variable, new Set([...seen, property]));
}

/** selector の 1 つが完全に一致する規則の本文を全て返す。0 件も返す。 */
function cssRuleBodies(cssText: string, exactSelector: string, requiredProperty?: string): string[] {
  const css = cssText.replace(/\/\*[\s\S]*?\*\//g, "");
  const normalizedExactSelector = exactSelector.replace(/\s+/g, " ").trim();
  const property = requiredProperty === undefined
    ? undefined
    : new RegExp(`(?:^|;)\\s*${requiredProperty.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*:`, "m");
  return [...css.matchAll(/([^{}]*)\{([^{}]*)\}/g)].flatMap((match) => {
    const selectors = (match[1] ?? "").split(",").map((selector) => selector.replace(/\s+/g, " ").trim());
    const body = match[2] ?? "";
    const hasRequiredProperty = property === undefined || property.test(body);
    return selectors.includes(normalizedExactSelector) && hasRequiredProperty ? [body] : [];
  });
}

function cssRuleBody(cssText: string, exactSelector: string, requiredProperty?: string): string {
  const bodies = cssRuleBodies(cssText, exactSelector, requiredProperty);
  if (bodies.length !== 1) {
    const qualifier = requiredProperty ? ` (${requiredProperty} を持つもの)` : "";
    throw new Error(`${exactSelector} の CSS 規則${qualifier}が ${bodies.length} 件ある (1 件が要る)`);
  }
  return bodies[0]!;
}

function cssDeclaration(body: string, property: string): string {
  const value = new RegExp(`(?:^|;)\\s*${property.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*:\\s*([^;]+)`, "m")
    .exec(body)?.[1]?.trim().replace(/\s*!important$/, "");
  if (!value) throw new Error(`${property} の CSS 宣言が無い`);
  return value;
}

function svgFilterSource(source: string, id: string): string {
  const filter = new RegExp(
    `<filter(?=[^>]*\\bid=["']${id}["'])[^>]*>[\\s\\S]*?<\\/filter>`,
  ).exec(source)?.[0];
  if (!filter) throw new Error(`#${id} の filter が SvgDefs.tsx に無い`);
  return filter;
}

function cssVariableName(value: string): string {
  const name = /^var\(--([a-z0-9-]+)\)$/.exec(value)?.[1];
  if (!name) throw new Error(`${value} が CSS 変数 1 個の参照ではない`);
  return name;
}

function resolvedCssPaint(declarations: Map<string, string>, body: string, property: string): string {
  const value = cssDeclaration(body, property).toLowerCase();
  const pattern = /^url\(["']?(#[a-z0-9-]+)["']?\)$/.exec(value)?.[1];
  if (pattern) return `url(${pattern})`;
  const literal = /^(#[0-9a-f]{6})$/.exec(value)?.[1];
  if (literal) return literal;
  return resolveCssColor(declarations, cssVariableName(value));
}

function cssGanttOverrides(cssText: string, themeName: string): Map<number, string> {
  const selector = `svg[data-cdl-stage][data-cdl-palette="${themeName}"] [data-cdl-role="gantt-bar"]`;
  const overrides = new Map<number, string>();
  for (const body of cssRuleBodies(cssText, selector)) {
    for (const declaration of body.matchAll(/--cdl-chart-([1-6])\s*:\s*(#[0-9a-fA-F]{6})\s*;/g)) {
      const series = Number(declaration[1]);
      if (overrides.has(series)) throw new Error(`${themeName} の日程の帯の系列 ${series} が複数ある`);
      overrides.set(series, declaration[2]!.toLowerCase());
    }
  }
  return overrides;
}

function compareGanttCss(
  cssText: string,
  expected: Map<DslTheme, ThemeToneSeries>,
): string[] {
  const failures: string[] = [];
  for (const [name, style] of expected) {
    const actualOverrides = cssGanttOverrides(cssText, name);
    for (let series = 1; series <= 6; series += 1) {
      const actual = actualOverrides.get(series);
      const want = style.ganttOverrides.get(series);
      if (actual !== want) {
        failures.push(`${name} 日程の帯 ${series}: 意匠帳 ${want ?? "上書きなし"} / CSS ${actual ?? "上書きなし"}`);
      }
    }

    const stage = `svg[data-cdl-stage][data-cdl-palette="${name}"]`;
    const owner = cssRuleBody(cssText, `${stage} [data-cdl-role="gantt-owner"]`, "fill");
    const actualOwner = resolvedCssPaint(cssFixedThemeDeclarations(cssText, name), owner, "fill");
    if (actualOwner !== style.ganttOwnerColor) {
      failures.push(`${name} 担当の字: 意匠帳 ${style.ganttOwnerColor} / CSS ${actualOwner}`);
    }
  }
  return failures;
}

/** 色みと主役の札が継承する、意匠ごとの字の決まり。 */
function fixedLabelTextBody(
  cssText: string,
  stage: string,
  themeName: string,
  tone: string,
  main = false,
): string {
  if (themeName === "neon") {
    const selector = main
      ? `${stage} [data-cdl-edge-label-for][data-cdl-edge-role="main"]:has(> [data-cdl-role="edge-label-bg"]) > [data-cdl-role="edge-label"]`
      : `${stage} [data-cdl-edge-label-for][data-cdl-tone="${tone}"]:has(> [data-cdl-role="edge-label-bg"]) > [data-cdl-role="edge-label"]`;
    return cssRuleBody(cssText, selector);
  }
  if (themeName === "terminal") {
    return cssRuleBody(
      cssText,
      `${stage} g:has(> [data-cdl-role="edge-label-bg"]) > [data-cdl-role="edge-label"]`,
    );
  }
  if (themeName === "sketch") {
    return cssRuleBody(cssText, `${stage} [data-cdl-role="edge-label"]`);
  }
  return cssRuleBody(
    cssText,
    `${stage} [data-cdl-edge-label-for][data-cdl-tone]:has(> [data-cdl-role="edge-label-bg"]) > [data-cdl-role="edge-label"]`,
  );
}

function fixedTextToneContrast(cssText: string): { checked: number; failures: string[] } {
  const failures: string[] = [];
  let checked = 0;
  const groundText = readFixedThemeGroundText();
  for (const [name, note] of readThemeNotes()) {
    if (note.mode !== "fixed") continue;
    const stageDeclarations = cssFixedThemeDeclarations(cssText, name);
    const separateGroundText = groundText.get(name);
    const declarations = separateGroundText
      ? cssFixedThemeBoxDeclarations(cssText, name)
      : stageDeclarations;
    const backgrounds = separateGroundText ? CARD_TEXT_BACKGROUNDS : TEXT_BACKGROUNDS;
    for (const tone of TEXT_TONES) {
      const foreground = resolveCssColor(declarations, `cdl-tone-${tone}`);
      for (const background of backgrounds) {
        const ground = resolveCssColor(declarations, `er-${background}`);
        const ratio = contrast(rgb(foreground), rgb(ground));
        checked += 1;
        if (ratio < 4.5) {
          failures.push(
            `${name} --cdl-tone-${tone} ${foreground} / --er-${background} ${ground}: ` +
            `${ratio.toFixed(2)}:1 < 4.5:1`,
          );
        }
      }
    }
    if (separateGroundText) {
      for (const property of ["theme-ground-ink", "theme-ground-type"] as const) {
        const foreground = resolveCssColor(stageDeclarations, property);
        const ground = resolveCssColor(stageDeclarations, "er-ground");
        const ratio = contrast(rgb(foreground), rgb(ground));
        checked += 1;
        if (ratio < 4.5) {
          failures.push(
            `${name} --${property} ${foreground} / --er-ground ${ground}: ` +
            `${ratio.toFixed(2)}:1 < 4.5:1`,
          );
        }
      }
    }
  }
  return { checked, failures };
}

function compareFrameOpacity(
  cssText: string,
  expected: Map<DslTheme, number>,
): { checked: number; failures: string[] } {
  const css = cssText.replace(/\/\*[\s\S]*?\*\//g, "");
  const blocks: Array<{ names: Set<string>; value: number | null }> = [];
  for (const match of css.matchAll(/([^{}]*)\{([^{}]*)\}/g)) {
    const selector = match[1] ?? "";
    const body = match[2] ?? "";
    if (!selector.includes('[data-cdl-role="node-body"]') || !/stroke-opacity\s*:/.test(body)) continue;
    const names = new Set(
      [...selector.matchAll(/\[data-cdl-palette="([^"]+)"\]/g)]
        .map((name) => name[1])
        .filter((name): name is string => name !== undefined),
    );
    const value = /stroke-opacity\s*:\s*(\d+(?:\.\d+)?)\s*!important\b/.exec(body)?.[1];
    blocks.push({ names, value: value === undefined ? null : Number(value) });
  }

  const failures: string[] = [];
  if (blocks.length !== 1) {
    failures.push(`枠の濃さの決まりは ${blocks.length} か所ある (1 か所に寄せる)`);
  }
  for (const block of blocks) {
    if (block.names.size === 0) {
      failures.push("枠の濃さの決まりに意匠の名前が無く、全ての意匠の枠を変えてしまう");
    }
  }

  const actualNames = new Set(blocks.flatMap((block) => [...block.names]));
  const expectedNames = new Set(expected.keys());
  const missing = [...expectedNames].filter((name) => !actualNames.has(name));
  const extra = [...actualNames].filter((name) => !expectedNames.has(name as DslTheme));
  if (missing.length > 0 || extra.length > 0) {
    failures.push(
      `枠の濃さの意匠が意匠帳と違う (足りない名前: ${missing.join(" / ") || "なし"}; ` +
      `余計な名前: ${extra.join(" / ") || "なし"})`,
    );
  }

  for (const block of blocks) {
    for (const name of block.names) {
      const want = expected.get(name as DslTheme);
      if (want === undefined) continue;
      if (block.value === null) {
        failures.push(`${name}: stroke-opacity が「数 !important」ではない`);
      } else if (block.value !== want) {
        failures.push(`${name}: 枠の濃さは意匠帳 ${want} / CSS ${block.value}`);
      }
    }
  }

  return {
    checked: [...expectedNames].filter((name) => actualNames.has(name)).length,
    failures,
  };
}

function compare(notes: Map<DslTheme, ThemeNote>, css: Map<string, CssTheme>): { count: number; mismatch: string[] } {
  let count = 0;
  const mismatch: string[] = [];
  for (const [name, note] of notes) {
    const actual = css.get(name);
    if (!actual) continue;
    const compareSide = (side: "明" | "暗" | "固定", expected: Record<ThemePort, string>, values: Map<ThemePort, string>): void => {
      for (const port of THEME_PORTS) {
        const got = values.get(port);
        if (got === undefined) continue;
        count += 1;
        if (got !== expected[port]) mismatch.push(`${name}.${port} ${side}: 意匠帳 ${expected[port]} / CSS ${got}`);
      }
    };
    if (note.mode === "light-dark") {
      compareSide("明", note.light, actual.light);
      compareSide("暗", note.dark, actual.dark);
    } else compareSide("固定", note.value, actual.light);
  }
  return { count, mismatch };
}

describe("意匠帳と CSS の値が一致する (#2790)", () => {
  const cssText = 読む("../styles/cdl-theme.css");

  it("名前付きの塊の集合が THEMES と同じ", () => {
    const actual = cssThemes(cssText);
    expect(actual.size, "名前付きの意匠を 1 件も読めていない").toBeGreaterThan(0);
    expect([...actual.keys()].sort()).toEqual([...THEMES].sort());
  });

  it("全ての口が意匠帳と一致し、固定の意匠は暗い塊を持たない", () => {
    const notes = readThemeNotes();
    const css = cssThemes(cssText);
    const mismatch: string[] = [];
    for (const [name, note] of notes) {
      const actual = css.get(name);
      if (!actual) continue;
      expect([...actual.light.keys()].sort(), `${name} の明 / 固定の口`).toEqual([...THEME_PORTS].sort());
      if (note.mode === "light-dark") {
        expect([...actual.dark.keys()].sort(), `${name} の暗の口`).toEqual([...THEME_PORTS].sort());
      } else {
        expect(actual.hasDarkBlock, `${name} は固定なのに html.dark の塊を持つ`).toBe(false);
        expect(actual.dark.size, `${name} は固定なのに暗の値を持つ`).toBe(0);
      }
    }

    const result = compare(notes, css);
    const expected = [...notes.values()].reduce(
      (sum, note) => sum + THEME_PORTS.length * (note.mode === "light-dark" ? 2 : 1),
      0,
    );
    mismatch.push(...result.mismatch);
    expect(result.count, "突き合わせた組の数が意匠 × 口 × 明暗と違う").toBe(expected);
    expect(mismatch, "意匠帳と CSS の値が食い違う").toEqual([]);
  });

  it("路線図専用の 16 色が全ての意匠帳と一致する", () => {
    const notes = readMetroThemeNotes();
    const actual = cssMetroThemes(cssText);
    const failures: string[] = [];
    let checked = 0;

    for (const [name, note] of notes) {
      const css = actual.get(name);
      if (!css) {
        failures.push(`${name}: CSS の路線図の色が無い`);
        continue;
      }
      const compareSide = (mode: string, expected: Record<MetroColorRole, string>, values: Map<MetroColorRole, string>): void => {
        for (const [role, expectedColor] of Object.entries(expected) as Array<[MetroColorRole, string]>) {
          checked += 1;
          const actualColor = values.get(role);
          if (actualColor !== expectedColor) {
            failures.push(`${name}/${mode}/${role}: 意匠帳 ${expectedColor} / CSS ${actualColor ?? "無し"}`);
          }
        }
      };
      if (note.mode === "light-dark") {
        compareSide("明", note.light, css.light);
        compareSide("暗", note.dark, css.dark);
      } else {
        compareSide("固定", note.value, css.light);
        if (css.dark.size > 0) failures.push(`${name}: 固定意匠なのに暗い路線図の色を持つ`);
      }
    }

    expect(checked, "路線図の色を 1 件も突き合わせていない").toBe(11 * 16);
    expect(failures, "路線図の色が意匠帳と CSS で食い違う").toEqual([]);
  });

  it("路線図の駅名・名札の名前・名札の補足は 9 意匠の明暗で対比 4.5 以上になる", () => {
    const failures: string[] = [];
    let checked = 0;

    for (const [name, note] of readMetroThemeNotes()) {
      const sides = note.mode === "light-dark"
        ? [["明", note.light], ["暗", note.dark]] as const
        : [["明", note.value], ["暗", note.value]] as const;
      for (const [mode, colors] of sides) {
        const pairs = [
          ["駅名", colors.stationInk, colors.stationGround],
          ["名札の名前", colors.badgeTitle, colors.badgeFace],
          ["名札の補足", colors.badgeSubtitle, colors.badgeFace],
        ] as const;
        for (const [role, foreground, background] of pairs) {
          checked += 1;
          const ratio = contrast(rgb(foreground), rgb(background));
          if (ratio < 4.5) {
            failures.push(`${name}/${mode}/${role}: ${ratio.toFixed(2)}:1 (${foreground} / ${background})`);
          }
        }
      }
    }

    expect(checked, "路線図の字の対比を 1 件も調べていない").toBe(THEMES.length * 2 * 3);
    expect(failures, "路線図の字の対比が 4.5:1 に届かない").toEqual([]);
  });

  it("まだ来ていない路線は現れ方の後も 0.3 の濃さを保つ", () => {
    const selector = 'svg[data-cdl-stage][data-cdl-palette]:has([data-cdl-routing="metro"]) ' +
      '[data-cdl-routing="metro"][data-cdl-pending="true"]';
    const body = cssRuleBody(cssText, selector);
    expect(cssDeclaration(body, "opacity")).toBe("0.3");

    const edgeAnimations = new Set(
      [...cssText.matchAll(/--theme-edge-appear\s*:\s*([\w-]+)\s*;/g)].flatMap((match) => match[1] ? [match[1]] : []),
    );
    const overriding: string[] = [];
    for (const name of edgeAnimations) {
      const start = cssText.indexOf(`@keyframes ${name}`);
      const end = cssText.indexOf("\n@keyframes ", start + 1);
      const body = cssText.slice(start, end < 0 ? cssText.length : end);
      if (/\b(?:to|100%)\s*\{[^}]*\bopacity\s*:/s.test(body)) overriding.push(name);
    }
    expect(overriding, "線の現れ方が終点の opacity を上書きする").toEqual([]);
  });

  it("路線図の戻る矢じりは全意匠で 2 倍にしない", () => {
    const selector = 'svg[data-cdl-stage][data-cdl-palette]:has([data-cdl-routing="metro"]) ' +
      '[data-cdl-mark="metro-return-arrow"]';
    expect(cssDeclaration(cssRuleBody(cssText, selector), "transform")).toBe("none");
  });

  it("浮彫の路線図は外箱へ見本と同じ図全体の陰を当て、枝札だけ外接矩形の領域を使う", () => {
    const stage = 'svg[data-cdl-stage][data-cdl-palette="relief"]:has([data-cdl-routing="metro"])';
    for (const part of [
      '[data-cdl-routing="metro"]',
      '[data-cdl-node][data-cdl-kind="station"]',
      '[data-cdl-node][data-cdl-kind="mark-start"]',
      '[data-cdl-node][data-cdl-kind="mark-end"]',
      '[data-cdl-node][data-cdl-kind="decision"]',
      '[data-cdl-role="metro-lane-guide"]',
    ]) {
      expect(cssDeclaration(cssRuleBody(cssText, `${stage} ${part}`, "filter"), "filter"), part)
        .toBe("url(#dragon-metro-relief-shadow)");
    }
    const label = `${stage} [data-cdl-edge-label-for][data-cdl-tone]`;
    expect(cssDeclaration(cssRuleBody(cssText, label, "filter"), "filter"))
      .toBe("url(#dragon-metro-relief-shadow-label)");
    for (const translated of ['[data-cdl-role="mark-start"]', '[data-cdl-role="mark-end"]']) {
      expect(cssRuleBodies(cssText, `${stage} ${translated}`, "filter"), translated).toEqual([]);
    }
    const decisionPath = `${stage} [data-cdl-kind="decision"] [data-cdl-role="node-body"] path`;
    expect(cssDeclaration(cssRuleBody(cssText, decisionPath, "filter"), "filter")).toBe("none");
    const badge = `${stage} [data-cdl-role="metro-lane-badge"] rect`;
    expect(cssDeclaration(cssRuleBody(cssText, badge, "filter"), "filter")).toBe("url(#dragon-relief-raised)");

    const filter = svgFilterSource(読む("../components/SvgDefs.tsx"), "dragon-metro-relief-shadow");
    expect(filter).toContain('filterUnits="userSpaceOnUse"');
    expect(filter).toContain('in="SourceAlpha" stdDeviation="2" result="metro-relief-blur"');
    expect(filter).toContain('dx="2.5" dy="2.5"');
    expect(filter).toContain('floodColor="rgb(160,144,120)" floodOpacity=".55"');
    expect(filter).toContain('dx="-2" dy="-2"');
    expect(filter).toContain('floodColor="#ffffff" floodOpacity=".95"');
    const labelFilter = svgFilterSource(読む("../components/SvgDefs.tsx"), "dragon-metro-relief-shadow-label");
    expect(labelFilter).toContain('filterUnits="objectBoundingBox"');
    expect(labelFilter).toContain('x="-10%"');
    expect(labelFilter).toContain('y="-50%"');
    expect(labelFilter).toContain('width="120%"');
    expect(labelFilter).toContain('height="200%"');
    expect(labelFilter).toContain('in="SourceAlpha" stdDeviation="2" result="metro-relief-label-blur"');
  });

  it("電飾の路線図は外箱へ見本と同じ二段の光を当て、枝札だけ外接矩形の領域を使う", () => {
    const stage = 'svg[data-cdl-stage][data-cdl-palette="neon"]:has([data-cdl-routing="metro"])';
    for (const part of [
      '[data-cdl-routing="metro"]',
      '[data-cdl-node][data-cdl-kind="station"]',
      '[data-cdl-node][data-cdl-kind="mark-start"]',
      '[data-cdl-node][data-cdl-kind="mark-end"]',
      '[data-cdl-node][data-cdl-kind="decision"]',
      '[data-cdl-role="metro-lane-guide"]',
    ]) {
      expect(cssDeclaration(cssRuleBody(cssText, `${stage} ${part}`, "filter"), "filter"), part)
        .toBe("url(#dragon-metro-neon-glow)");
    }
    const label = `${stage} [data-cdl-edge-label-for][data-cdl-tone]`;
    expect(cssDeclaration(cssRuleBody(cssText, label, "filter"), "filter"))
      .toBe("url(#dragon-metro-neon-glow-label)");
    for (const translated of ['[data-cdl-role="mark-start"]', '[data-cdl-role="mark-end"]']) {
      expect(cssRuleBodies(cssText, `${stage} ${translated}`, "filter"), translated).toEqual([]);
    }
    const line = `${stage} [data-cdl-routing="metro"] [data-cdl-role="edge-line"]`;
    expect(cssDeclaration(cssRuleBody(cssText, line, "filter"), "filter")).toBe("none");
    const decisionPath = `${stage} [data-cdl-kind="decision"] [data-cdl-role="node-body"] path`;
    expect(cssDeclaration(cssRuleBody(cssText, decisionPath, "filter"), "filter")).toBe("none");

    const neon = cssMetroThemes(cssText).get("neon")?.light;
    expect(neon?.get("main")).toBe("#ff2e97");
    expect(neon?.get("yes")).toBe("#00e5ff");
    expect(neon?.get("no")).toBe("#ffd000");
    const filter = svgFilterSource(読む("../components/SvgDefs.tsx"), "dragon-metro-neon-glow");
    expect(filter).toContain('in="SourceGraphic" stdDeviation="1.5" result="metro-neon-halo"');
    expect(filter).toContain('in="SourceGraphic" stdDeviation="5" result="metro-neon-haze"');
    expect(filter).not.toContain("feColorMatrix");
    const labelFilter = svgFilterSource(読む("../components/SvgDefs.tsx"), "dragon-metro-neon-glow-label");
    expect(labelFilter).toContain('filterUnits="objectBoundingBox"');
    expect(labelFilter).toContain('x="-10%"');
    expect(labelFilter).toContain('y="-50%"');
    expect(labelFilter).toContain('width="120%"');
    expect(labelFilter).toContain('height="200%"');
    expect(labelFilter).toContain('in="SourceGraphic" stdDeviation="5" result="metro-neon-label-haze"');
  });

  it("端末の路線図は外箱へ見本と同じ半透明の光を当て、枝札だけ外接矩形の領域を使う", () => {
    const stage = 'svg[data-cdl-stage][data-cdl-palette="terminal"]:has([data-cdl-routing="metro"])';
    for (const part of [
      '[data-cdl-routing="metro"]',
      '[data-cdl-node][data-cdl-kind="station"]',
      '[data-cdl-node][data-cdl-kind="mark-start"]',
      '[data-cdl-node][data-cdl-kind="mark-end"]',
      '[data-cdl-node][data-cdl-kind="decision"]',
      '[data-cdl-role="metro-lane-guide"]',
    ]) {
      expect(cssDeclaration(cssRuleBody(cssText, `${stage} ${part}`, "filter"), "filter"), part)
        .toBe("url(#dragon-metro-terminal-glow)");
    }
    const label = `${stage} [data-cdl-edge-label-for][data-cdl-tone]`;
    expect(cssDeclaration(cssRuleBody(cssText, label, "filter"), "filter"))
      .toBe("url(#dragon-metro-terminal-glow-label)");
    for (const translated of ['[data-cdl-role="mark-start"]', '[data-cdl-role="mark-end"]']) {
      expect(cssRuleBodies(cssText, `${stage} ${translated}`, "filter"), translated).toEqual([]);
    }

    const filter = svgFilterSource(読む("../components/SvgDefs.tsx"), "dragon-metro-terminal-glow");
    expect(filter).toContain('in="SourceGraphic" stdDeviation="3.5" result="metro-terminal-blur"');
    expect(filter).toContain('<feFuncA type="linear" slope=".5" />');
    expect(filter).toContain('<feMergeNode in="metro-terminal-dim" />');
    expect(filter).toContain('<feMergeNode in="SourceGraphic" />');
    const labelFilter = svgFilterSource(読む("../components/SvgDefs.tsx"), "dragon-metro-terminal-glow-label");
    expect(labelFilter).toContain('filterUnits="objectBoundingBox"');
    expect(labelFilter).toContain('x="-10%"');
    expect(labelFilter).toContain('y="-50%"');
    expect(labelFilter).toContain('width="120%"');
    expect(labelFilter).toContain('height="200%"');
    expect(labelFilter).toContain('in="SourceGraphic" stdDeviation="3.5" result="metro-terminal-label-blur"');
  });

  it("路線図の線路は全意匠で見本と同じ不透明にし、まだの線だけ親で 0.3 にする", () => {
    const stage = 'svg[data-cdl-stage][data-cdl-palette]:has([data-cdl-routing="metro"])';
    const line = `${stage} [data-cdl-routing="metro"] [data-cdl-role="edge-line"]`;
    const opacity = Number(cssDeclaration(cssRuleBody(cssText, line, "stroke-opacity"), "stroke-opacity"));
    for (const [name, expected] of readFixedThemeMetroLineOpacity()) {
      expect(opacity, name).toBe(expected);
    }

    const pending = `${stage} [data-cdl-routing="metro"][data-cdl-pending="true"]`;
    expect(cssDeclaration(cssRuleBody(cssText, pending, "opacity"), "opacity")).toBe("0.3");
  });

  it("手描きの名札は揺らさず 2px の墨枠と影を保ち、太字の意匠の名前は 800 にする", () => {
    const sketchStage = 'svg[data-cdl-stage][data-cdl-palette="sketch"]:has([data-cdl-routing="metro"])';
    const badge = cssRuleBody(cssText, `${sketchStage} [data-cdl-role="metro-lane-badge"] rect`);
    expect(cssDeclaration(badge, "stroke-width")).toBe("2px");
    expect(cssDeclaration(badge, "filter")).toBe("drop-shadow(3px 4px 0 rgb(43 38 32 / 16%))");
    expect(badge).not.toContain("dragon-sketch-wobble");

    for (const name of ["letterpress", "sketch", "neon"] as const) {
      const stage = `svg[data-cdl-stage][data-cdl-palette="${name}"]:has([data-cdl-routing="metro"])`;
      const title = cssRuleBody(
        cssText,
        `${stage} [data-cdl-role="metro-lane-badge"] text:first-of-type`,
        "font-weight",
      );
      expect(cssDeclaration(title, "font-weight"), name).toBe("800");
    }
  });

  it("意匠帳の値を変えると同じ比較経路が検知する", () => {
    const original = readThemeNoteText("blueprint");
    const changed = original.replace("| 台 | `#e3e9ea` |", "| 台 | `#ffffff` |");
    expect(changed, "変異を本文へ植え込めていない").not.toBe(original);

    const notes = readThemeNotes({ blueprint: changed });
    const result = compare(notes, cssThemes(cssText));
    expect(result.mismatch.some((line) => line.includes("blueprint.ground"))).toBe(true);
  });

  it("5 意匠の札は色みと主役の属性で意匠帳の一・二・三を塗る", () => {
    const expected = readFixedThemeLabelToneStyles();
    const failures: string[] = [];
    for (const [name, style] of expected) {
      const declarations = cssFixedThemeDeclarations(cssText, name);
      const stage = `svg[data-cdl-stage][data-cdl-palette="${name}"]`;
      const property = style.paint;
      for (const [tone, group] of Object.entries(LABEL_TONES)) {
        const backgroundSelector = `${stage} [data-cdl-edge-label-for][data-cdl-tone="${tone}"] > [data-cdl-role="edge-label-bg"]`;
        const backgroundBody = cssRuleBody(cssText, backgroundSelector);
        const textBody = fixedLabelTextBody(cssText, stage, name, tone);
        const paint = resolveCssColor(declarations, cssVariableName(cssDeclaration(backgroundBody, property)));
        if (paint !== style[group]) failures.push(`${name}/${tone} ${property}: 意匠帳 ${style[group]} / CSS ${paint}`);
        const ink = resolveCssColor(declarations, cssVariableName(cssDeclaration(textBody, "fill")));
        const expectedInk = style.inkMode === "tone" ? style[group] : style.ink;
        if (ink !== expectedInk) failures.push(`${name}/${tone} 字: 意匠帳 ${expectedInk} / CSS ${ink}`);
        if (name === "neon") {
          const glow = resolveCssColor(
            declarations,
            cssVariableName(cssDeclaration(backgroundBody, "--neon-tag-glow")),
          );
          if (glow !== style[group]) failures.push(`${name}/${tone} 光: 意匠帳 ${style[group]} / CSS ${glow}`);
        }
      }

      const mainBackground = `${stage} [data-cdl-edge-label-for][data-cdl-edge-role="main"] > [data-cdl-role="edge-label-bg"]`;
      const mainBody = cssRuleBody(cssText, mainBackground);
      const mainPaint = resolveCssColor(declarations, cssVariableName(cssDeclaration(mainBody, property)));
      if (mainPaint !== style.one) failures.push(`${name}/main ${property}: 意匠帳 ${style.one} / CSS ${mainPaint}`);
      const mainInk = resolveCssColor(
        declarations,
        cssVariableName(cssDeclaration(fixedLabelTextBody(cssText, stage, name, "accent", true), "fill")),
      );
      const expectedMainInk = style.inkMode === "tone" ? style.one : style.ink;
      if (mainInk !== expectedMainInk) failures.push(`${name}/main 字: 意匠帳 ${expectedMainInk} / CSS ${mainInk}`);
      const lastToneSelector = `${stage} [data-cdl-edge-label-for][data-cdl-tone="warning"]`;
      if (cssText.indexOf(mainBackground) < cssText.indexOf(lastToneSelector)) {
        failures.push(`${name}: 主役の札の決まりが色みの決まりより前にある`);
      }
    }
    expect(expected.size).toBe(5);
    expect(failures, "札の意味属性と意匠帳が違う").toEqual([]);
  });

  it("7 意匠の単系列の棒は主役の属性で意匠帳の塗りと枠を使う", () => {
    const expected = readFixedThemeSingleSeriesBars();
    const failures: string[] = [];
    for (const [name, style] of expected) {
      const declarations = cssFixedThemeDeclarations(cssText, name);
      const stage = `svg[data-cdl-stage][data-cdl-palette="${name}"]`;
      const primary = cssRuleBody(
        cssText,
        `${stage} [data-cdl-role="chart-bar"][data-cdl-emphasis="primary"]`,
      );
      const secondary = cssRuleBody(
        cssText,
        `${stage} [data-cdl-role="chart-bar"]:not([data-cdl-emphasis="primary"])`,
      );
      for (const [role, body, want] of [
        ["主役", primary, style.primary],
        ["それ以外", secondary, style.secondary],
      ] as const) {
        const fill = resolvedCssPaint(declarations, body, "fill");
        if (fill !== want.fill) failures.push(`${name} ${role}の塗り: 意匠帳 ${want.fill} / CSS ${fill}`);
        if (want.stroke !== undefined) {
          const stroke = resolvedCssPaint(declarations, body, "stroke");
          if (stroke !== want.stroke) {
            failures.push(`${name} ${role}の枠: 意匠帳 ${want.stroke} / CSS ${stroke}`);
          }
          const width = Number.parseFloat(cssDeclaration(body, "stroke-width"));
          if (width !== want.strokeWidth) {
            failures.push(`${name} ${role}の枠幅: 意匠帳 ${want.strokeWidth} / CSS ${width}`);
          }
        }
      }
    }
    expect(expected.size).toBe(7);
    expect(failures, "単系列の棒の意味属性と意匠帳が違う").toEqual([]);
  });

  it("固定 7 意匠の日程の棒と漏斗の段は色みを系列色へ向けて濃さ 1 で塗る", () => {
    const expected = readFixedThemeToneSeries();
    const css = cssText.replace(/\/\*[\s\S]*?\*\//g, "");
    const rules = [...css.matchAll(/([^{}]*)\{([^{}]*)\}/g)].filter((match) => {
      const selector = match[1] ?? "";
      return selector.includes('[data-cdl-role="gantt-bar"]') &&
        selector.includes('[data-cdl-role="funnel-stage"]');
    });
    expect(expected.size).toBe(7);
    expect(rules.length, "日程の棒と漏斗の段の共通規則は 1 か所に寄せる").toBe(1);
    const rule = rules[0];
    if (!rule) return;

    const selector = rule[1] ?? "";
    const body = rule[2] ?? "";
    const actualNames = new Set(
      [...selector.matchAll(/\[data-cdl-palette="([^"]+)"\]/g)]
        .flatMap((match) => match[1] ? [match[1]] : []),
    );
    expect([...actualNames].sort(), "共通規則の固定意匠の名前").toEqual([...expected.keys()].sort());
    const representative = expected.values().next().value;
    if (!representative) throw new Error("日程の棒と漏斗の段を意匠帳から読めない");
    for (const tone of THEME_TONES) {
      expect(cssDeclaration(body, `--cdl-tone-${tone}`), tone)
        .toBe(`var(--cdl-chart-${representative.seriesByTone[tone]})`);
    }
    expect(Number(cssDeclaration(body, "fill-opacity"))).toBe(representative.opacity);
  });

  it("固定 7 意匠の日程の帯と担当の字は意匠帳どおりの対比を保つ", () => {
    const notes = readThemeNotes();
    const charts = readFixedThemeChartSeries();
    const expected = readFixedThemeToneSeries();
    const leads = readFixedThemeLead();
    const failures = compareGanttCss(cssText, expected);

    expect(expected.size).toBe(7);
    for (const [name, tones] of expected) {
      const note = notes.get(name);
      const chart = charts.get(name);
      if (!note || note.mode !== "fixed" || !chart) {
        throw new Error(`${name} の日程の帯を検査する意匠帳の値が足りない`);
      }
      const ganttColors = themeGanttSeriesColors(chart, tones);
      for (let index = 0; index < chart.colors.length; index += 1) {
        const series = index + 1;
        const original = chart.colors[index];
        const color = ganttColors[index];
        if (!original || !color) throw new Error(`${name} の日程の帯 ${series} の色が無い`);
        const overridden = tones.ganttOverrides.has(series);
        const originalRatio = contrast(rgb(original), rgb(tones.ganttOwnerColor));
        const ownerRatio = contrast(rgb(color), rgb(tones.ganttOwnerColor));
        if (overridden !== (originalRatio < 4.5)) {
          failures.push(`${name} 日程の帯 ${series}: 元の担当との対比 ${originalRatio.toFixed(2)} なのに上書き ${overridden ? "あり" : "なし"}`);
        }
        if (overridden) {
          // 必要以上に動かしていないこと = 上書き後の対比が下限のすぐ上に収まる
          if (ownerRatio >= 4.6) {
            failures.push(`${name} 日程の帯 ${series}: 上書き後の担当との対比 ${ownerRatio.toFixed(2)} が 4.6 以上 (動かしすぎ)`);
          }
          const difference = hueDifference(original, color);
          if (difference > 10) {
            failures.push(`${name} 日程の帯 ${series}: 元の系列色との色相差 ${difference.toFixed(2)} 度 > 10 度`);
          }
        }
        if (ownerRatio < 4.5) {
          failures.push(`${name} 日程の帯 ${series}: 担当との対比 ${ownerRatio.toFixed(2)} < 4.5`);
        }
        const groundRatio = contrast(rgb(color), rgb(note.value.ground));
        if (groundRatio < 3) {
          failures.push(`${name} 日程の帯 ${series}: 台との対比 ${groundRatio.toFixed(2)} < 3`);
        }
      }

      if (name === "relief" || name === "sketch") {
        const lead = leads.get(name);
        const first = ganttColors[0];
        if (!lead || !first) throw new Error(`${name} の一と日程の帯の系列 1 を読めない`);
        const difference = hueDifference(lead, first);
        if (difference > 10) {
          failures.push(`${name} 日程の帯 1: 一との色相差 ${difference.toFixed(2)} 度 > 10 度`);
        }
      }
    }
    expect(failures, "日程の帯と担当の字が意匠帳または対比の決まりと違う").toEqual([]);
  });

  it("意匠帳の浮彫の日程の帯を書き換えると CSS との不一致を検知する", () => {
    const original = readThemeNoteText("relief");
    const changed = original.replace("1 を `#c2553b`", "1 を `#c2553a`");
    expect(changed, "日程の帯の変異を本文へ植え込めていない").not.toBe(original);
    const relief = readFixedThemeToneSeries({ relief: changed }).get("relief");
    if (!relief) throw new Error("浮彫の日程の帯を意匠帳から読めない");
    const failures = compareGanttCss(cssText, new Map([["relief", relief]]));
    expect(failures.some((line) => line.includes("relief 日程の帯 1"))).toBe(true);
  });

  it("意匠帳から担当の字を消すと読み取りを拒む", () => {
    const original = readThemeNoteText("relief");
    const changed = original.replace("帯の上の担当の字は白 `#ffffff`", "");
    expect(changed, "担当の字を本文から消せていない").not.toBe(original);
    expect(() => readFixedThemeToneSeries({ relief: changed })).toThrow(
      "意匠帳の relief の日程の棒と漏斗の段に担当の字が無い",
    );
  });

  it("図録の段の字と手描きの日程の棒の枠は意匠帳の例外と一致する", () => {
    const expected = readFixedThemeToneSeries();
    const catalog = expected.get("catalog");
    const sketch = expected.get("sketch");
    if (!catalog?.textColor || !sketch?.stroke || sketch.strokeWidth === undefined) {
      throw new Error("図録または手描きの日程の例外を意匠帳から読めない");
    }
    const catalogDeclarations = cssFixedThemeDeclarations(cssText, "catalog");
    const catalogStage = 'svg[data-cdl-stage][data-cdl-palette="catalog"]';
    for (const selector of [
      `${catalogStage} [data-cdl-role="funnel-stage"] + text`,
      `${catalogStage} [data-cdl-role="funnel-stage-subtitle"]`,
    ]) {
      const body = cssRuleBody(cssText, selector);
      expect(resolvedCssPaint(catalogDeclarations, body, "fill"), selector).toBe(catalog.textColor);
    }

    const sketchStage = 'svg[data-cdl-stage][data-cdl-palette="sketch"]';
    const gantt = cssRuleBody(cssText, `${sketchStage} [data-cdl-role="gantt-bar"]`, "stroke");
    const sketchDeclarations = cssFixedThemeDeclarations(cssText, "sketch");
    expect(resolvedCssPaint(sketchDeclarations, gantt, "stroke")).toBe(sketch.stroke);
    expect(Number.parseFloat(cssDeclaration(gantt, "stroke-width"))).toBe(sketch.strokeWidth);
  });

  it("図面の斜線模様は意匠帳どおりの pattern と rect を持つ", () => {
    const expected = readBlueprintHatch();
    const source = 読む("../components/SvgDefs.tsx");
    const id = expected.id.slice(1);
    const pattern = new RegExp(
      `<pattern(?=[^>]*\\bid=["']${id}["'])[^>]*>[\\s\\S]*?<\\/pattern>`,
    ).exec(source)?.[0];
    expect(pattern, `${expected.id} の pattern が SvgDefs.tsx に無い`).toBeDefined();
    if (!pattern) return;
    const attribute = (tag: string, name: string): string | undefined =>
      new RegExp(`<${tag}[^>]*\\b${name}=["']([^"']+)["']`).exec(pattern)?.[1];
    expect(Number(attribute("pattern", "width"))).toBe(expected.width);
    expect(Number(attribute("pattern", "height"))).toBe(expected.height);
    expect(attribute("pattern", "patternUnits")).toBe(expected.units);
    expect(attribute("pattern", "patternTransform")).toBe(`rotate(${expected.rotation})`);
    expect(Number(attribute("rect", "width"))).toBe(expected.rectWidth);
    expect(attribute("rect", "fill")?.toLowerCase()).toBe(expected.color);
  });

  it("札の字と面の対比は 5 意匠とも 4.5 以上になる", () => {
    const failures: string[] = [];
    for (const [name, style] of readFixedThemeLabelToneStyles()) {
      for (const group of ["one", "two", "three"] as const) {
        const face = style.paint === "fill" ? style[group] : style.face;
        const ink = style.inkMode === "tone" ? style[group] : style.ink;
        if (!face || !ink) throw new Error(`${name}/${group} の札の字と面を読めない`);
        const ratio = contrast(rgb(ink), rgb(face));
        if (ratio < 4.5) failures.push(`${name}/${group}: ${ratio.toFixed(2)}:1 < 4.5:1`);
      }
    }
    expect(failures, "札の字と面の対比が足りない").toEqual([]);
  });

  it("札を stroke の前置で選ばず、棒を fill-opacity の値で選ばない", () => {
    expect(cssText).not.toContain('stroke^="var(--cdl-tone');
    expect(cssText).not.toContain('fill-opacity="1"');
  });

  it("意匠帳の図録の一の札を書き換えると CSS との不一致を検知する", () => {
    const original = readThemeNoteText("catalog");
    const changed = original.replace("一 `#dca443`", "一 `#ffffff`");
    expect(changed, "札の変異を本文へ植え込めていない").not.toBe(original);
    const expected = readFixedThemeLabelToneStyles({ catalog: changed }).get("catalog");
    if (!expected) throw new Error("図録の札を読めない");
    const selector = 'svg[data-cdl-stage][data-cdl-palette="catalog"] [data-cdl-edge-label-for][data-cdl-tone="accent"] > [data-cdl-role="edge-label-bg"]';
    const actual = resolveCssColor(
      cssFixedThemeDeclarations(cssText, "catalog"),
      cssVariableName(cssDeclaration(cssRuleBody(cssText, selector), "fill")),
    );
    expect(actual).not.toBe(expected.one);
  });

  it("固定の意匠の図表は両方の変数と意匠帳が一致し、台との対比が 3 以上の異なる 6 色になる", () => {
    const notes = readThemeNotes();
    const expected = readFixedThemeChartSeries();
    const fixedNames = [...notes].flatMap(([name, note]) => note.mode === "fixed" ? [name] : []);
    const actual = cssChartThemes(cssText, new Set(fixedNames));
    const failures: string[] = [];

    expect([...actual.keys()].sort(), "固定の意匠と図表の系列色を持つ CSS の塊が違う").toEqual(fixedNames.sort());
    for (const name of fixedNames) {
      const note = notes.get(name);
      const want = expected.get(name);
      const got = actual.get(name);
      if (!note || note.mode !== "fixed" || !want || !got) continue;
      for (let index = 0; index < 6; index += 1) {
        const number = index + 1;
        const cdl = got.cdl[index];
        const dragon = got.dragon[index];
        const color = got.colors[index];
        const role = want.roles[index];
        const expectedColor = want.colors[index];
        if (!cdl || !dragon || !color || !role || !expectedColor) {
          throw new Error(`${name} の系列 ${number} を比較する値が足りない`);
        }
        if (cdl !== dragon) {
          failures.push(`${name} 系列 ${number}: --cdl ${cdl} / --d ${dragon}`);
        }
        if (color !== expectedColor) {
          failures.push(`${name} 系列 ${number} (${role}): 意匠帳 ${expectedColor} / CSS ${color}`);
        }
        const ratio = contrast(rgb(color), rgb(note.value.ground));
        if (ratio < 3) failures.push(`${name} 系列 ${number}: 台との対比 ${ratio.toFixed(2)}:1 < 3:1`);
      }
      if (new Set(got.colors).size !== 6) failures.push(`${name}: 6 系列に同じ色がある (${got.colors.join(" / ")})`);
    }
    expect(failures, "固定の意匠の図表の系列色が決まりと違う").toEqual([]);
  });

  it("図表の役名から値を引けなければ落とす", () => {
    const original = readThemeNoteText("blueprint");
    const changed = original.replace("4 = 黄土", "4 = 値の無い役");
    expect(changed, "変異を本文へ植え込めていない").not.toBe(original);
    expect(() => readFixedThemeChartSeries({ blueprint: changed })).toThrow("図表の役「値の無い役」から値を引けない");
  });

  it("固定の意匠の --cdl-now は意匠帳の一と一致する", () => {
    const expected = readFixedThemeLead();
    expect(expected.size, "固定の意匠を 1 件も読めていない").toBeGreaterThan(0);
    for (const [name, color] of expected) {
      const declarations = cssFixedThemeDeclarations(cssText, name);
      expect(resolveCssColor(declarations, "cdl-now"), name).toBe(color);
    }
  });

  it("意匠帳の一を書き換えると --cdl-now との不一致を検知する", () => {
    const original = readThemeNoteText("letterpress");
    const changed = original.replace(/(\|\s*一\s*\|\s*)`#c8431f`/, "$1`#ffffff`");
    expect(changed, "変異を本文へ植え込めていない").not.toBe(original);
    const expected = readFixedThemeLead({ letterpress: changed }).get("letterpress");
    const actual = resolveCssColor(cssFixedThemeDeclarations(cssText, "letterpress"), "cdl-now");
    expect(actual).not.toBe(expected);
  });

  it("題と札の字を持つ固定の意匠は CSS と一致し、それぞれの面で 4.5 以上になる", () => {
    const failures: string[] = [];
    let checkedThemes = 0;
    for (const [name, note] of readThemeNotes()) {
      if (note.mode !== "fixed") continue;
      const title = readFixedThemeRoleColor(name, "題");
      const tagInk = readFixedThemeRoleColor(name, "札の字");
      if (title === undefined && tagInk === undefined) continue;
      checkedThemes += 1;
      const declarations = cssFixedThemeDeclarations(cssText, name);
      if (title !== undefined) {
        const actual = resolveCssColor(declarations, "theme-title");
        if (actual !== title) failures.push(`${name} 題: 意匠帳 ${title} / CSS ${actual}`);
        for (const port of ["ground", "face", "stripe"] as const) {
          const ratio = contrast(rgb(title), rgb(note.value[port]));
          if (ratio < 4.5) failures.push(`${name} 題 / ${port}: ${ratio.toFixed(2)}:1 < 4.5:1`);
        }
      }
      if (tagInk !== undefined) {
        const actual = resolveCssColor(declarations, "theme-tag-ink");
        if (actual !== tagInk) failures.push(`${name} 札の字: 意匠帳 ${tagInk} / CSS ${actual}`);
        for (const port of ["line", "own", "link"] as const) {
          const ratio = contrast(rgb(tagInk), rgb(note.value[port]));
          if (ratio < 4.5) failures.push(`${name} 札の字 / ${port}: ${ratio.toFixed(2)}:1 < 4.5:1`);
        }
      }
    }
    expect(checkedThemes, "題または札の字を持つ固定の意匠が 0 件").toBeGreaterThan(0);
    expect(failures, "題と札の字が意匠帳または対比の決まりと違う").toEqual([]);
  });

  it("意匠帳の題を書き換えると CSS との不一致を検知する", () => {
    const target = [...readThemeNotes()].find(
      ([name, note]) => note.mode === "fixed" && readFixedThemeRoleColor(name, "題") !== undefined,
    );
    expect(target, "題を持つ固定の意匠が 0 件").toBeDefined();
    if (!target) return;
    const [name] = target;
    const original = readThemeNoteText(name);
    const expected = readFixedThemeRoleColor(name, "題");
    if (!expected) throw new Error(`${name} の題を読めない`);
    const changed = original.replace(
      new RegExp(`(\\|\\s*題\\s*\\|\\s*)\`${expected}\``),
      "$1`#ffffff`",
    );
    expect(changed, "題の変異を本文へ植え込めていない").not.toBe(original);
    const changedExpected = readFixedThemeRoleColor(name, "題", changed);
    const actual = resolveCssColor(cssFixedThemeDeclarations(cssText, name), "theme-title");
    expect(expected).toBe(actual);
    expect(changedExpected).not.toBe(actual);
  });

  it("意匠帳に一がある時は #rrggbb で始まらなければ落とす", () => {
    const original = readThemeNoteText("letterpress");
    const changed = original.replace(/(\|\s*一\s*\|\s*)`#c8431f`/, "$1朱");
    expect(changed, "変異を本文へ植え込めていない").not.toBe(original);
    expect(() => readFixedThemeLead({ letterpress: changed })).toThrow("「一」が #rrggbb で始まらない");
  });

  it("relief outline: 浮彫は縁線なし、他の固定の意匠は枠として読む", () => {
    const outlines = readFixedThemeOutline();
    expect(outlines.get("relief")).toBe("none");
    for (const [name, outline] of outlines) {
      if (name !== "relief") expect(outline, name).toBe("frame");
    }
  });

  it("relief outline: 縁線をありに変えると意匠の名前を添えて落とす", () => {
    const original = readThemeNoteText("relief");
    const changed = original.replace(/(\|\s*縁線\s*\|\s*)なし/, "$1あり");
    expect(changed, "縁線の変異を本文へ植え込めていない").not.toBe(original);
    expect(() => readFixedThemeOutline({ relief: changed })).toThrow("意匠帳の relief の「縁線」");
  });

  it("箱の枠の濃さは固定の意匠だけに 1 か所から当たり、意匠帳と一致する", () => {
    const expected = readFixedThemeFrameOpacity();
    const result = compareFrameOpacity(cssText, expected);

    expect(result.checked, "突き合わせた固定の意匠の数").toBe(expected.size);
    expect(result.failures, "箱の枠の濃さの決まりが意匠帳と違う").toEqual([]);
  });

  it("図面の意匠帳で枠の濃さを 0.5 にすると CSS との不一致を検知する", () => {
    const original = readThemeNoteText("blueprint");
    const changed = original.replace(
      /(\|\s*枠の濃さ\s*\|\s*`?)1(?=`?\s*(?:\||。))/,
      (_match, prefix: string) => `${prefix}0.5`,
    );
    expect(changed, "変異を本文へ植え込めていない").not.toBe(original);

    const expected = readFixedThemeFrameOpacity({ blueprint: changed });
    const result = compareFrameOpacity(cssText, expected);
    expect(
      result.failures.some((line) => line.includes("blueprint") && line.includes("意匠帳 0.5 / CSS 1")),
      `検知の内容: ${result.failures.join(" | ")}`,
    ).toBe(true);
  });

  it("枠の濃さの決まりから図面を外すと名前の不足を検知する", () => {
    const changed = cssText.replace(
      /\[data-cdl-palette="blueprint"\]\s*,\s*(?=\[data-cdl-palette="letterpress"\])/g,
      "",
    );
    expect(changed, "図面を外す変異を CSS へ植え込めていない").not.toBe(cssText);

    const result = compareFrameOpacity(changed, readFixedThemeFrameOpacity());
    expect(
      result.failures.some((line) => line.includes("足りない名前: blueprint")),
      `検知の内容: ${result.failures.join(" | ")}`,
    ).toBe(true);
  });

  it("活版だけの枠の濃さの決まりを足すと複数箇所を検知する", () => {
    const changed = `${cssText}\n` +
      'svg[data-cdl-stage][data-cdl-palette="letterpress"] [data-cdl-role="node-body"] {' +
      " stroke-opacity: 1 !important; }";
    expect(changed, "活版の変異を CSS へ植え込めていない").not.toBe(cssText);

    const expected = readFixedThemeFrameOpacity();
    const result = compareFrameOpacity(changed, expected);
    expect(
      result.failures.some((line) => line.includes("1 か所に寄せる")),
      `検知の内容: ${result.failures.join(" | ")}`,
    ).toBe(true);
  });

  it("意匠帳から枠の濃さを消すと意匠の名前を添えて落とす", () => {
    const original = readThemeNoteText("blueprint");
    const changed = original.replace(/^\|\s*枠の濃さ\s*\|.*\n/m, "");
    expect(changed, "枠の濃さを消す変異を本文へ植え込めていない").not.toBe(original);
    expect(() => readFixedThemeFrameOpacity({ blueprint: changed })).toThrow(
      "意匠帳の blueprint に「枠の濃さ」が無い",
    );
  });

  it("台の上の字を別に持つ固定の意匠は CSS の地の字と地の薄が意匠帳に一致する", () => {
    const expected = readFixedThemeGroundText();
    expect(expected.size, "台の上の字を別に持つ意匠を 1 件も読めていない").toBeGreaterThan(0);
    for (const [name, text] of expected) {
      const declarations = cssFixedThemeDeclarations(cssText, name);
      expect(resolveCssColor(declarations, "theme-ground-ink"), `${name} の地の字`).toBe(text.ink);
      expect(resolveCssColor(declarations, "theme-ground-type"), `${name} の地の薄`).toBe(text.type);
    }
  });

  it("図録の意匠帳で地の字を変えると CSS との不一致を検知する", () => {
    const original = readThemeNoteText("catalog");
    const changed = original.replace(/(\|\s*地の字\s*\|\s*)`#efe7d8`/, "$1`#ffffff`");
    expect(changed, "変異を本文へ植え込めていない").not.toBe(original);
    const expected = readFixedThemeGroundText({ catalog: changed }).get("catalog");
    const declarations = cssFixedThemeDeclarations(cssText, "catalog");
    expect(resolveCssColor(declarations, "theme-ground-ink")).not.toBe(expected?.ink);
  });

  it("固定の意匠で字に使う tone は字を載せる面、地の字は台の上で 4.5 以上になる", () => {
    const groundText = readFixedThemeGroundText();
    let expectedChecked = 0;
    for (const note of readThemeNotes().values()) {
      if (note.mode !== "fixed") continue;
      expectedChecked += groundText.has(note.name)
        ? TEXT_TONES.length * CARD_TEXT_BACKGROUNDS.length + 2
        : TEXT_TONES.length * TEXT_BACKGROUNDS.length;
    }
    const result = fixedTextToneContrast(cssText);

    expect(result.checked, "固定の意匠 × 文字用 tone × 背景を全て調べていない").toBe(
      expectedChecked,
    );
    expect(result.failures, "固定の意匠の文字用 tone が字の下限を割る").toEqual([]);
  });

  it("success を向きだけの色へ戻すと文字用 tone の検査が落ちる", () => {
    const changed = cssText.replace(
      "--cdl-tone-success: var(--er-type);",
      "--cdl-tone-success: var(--er-link);",
    );
    expect(changed, "success の変異を CSS へ植え込めていない").not.toBe(cssText);

    const result = fixedTextToneContrast(changed);
    expect(
      result.failures.some((line) => line.includes("--cdl-tone-success") && line.includes("4.22:1")),
      `検知の内容: ${result.failures.join(" | ")}`,
    ).toBe(true);
  });

  it("success の字は型名、success の線は向きだけの色を使う", () => {
    let fixedCount = 0;
    for (const [name, note] of readThemeNotes()) {
      if (note.mode !== "fixed") continue;
      fixedCount += 1;
      const declarations = cssFixedThemeDeclarations(cssText, name);
      expect(resolveCssColor(declarations, "cdl-tone-success"), `${name} の success の字`).toBe(
        resolveCssColor(declarations, "er-type"),
      );
      expect(resolveCssColor(declarations, "d-dg-2"), `${name} の success の線`).toBe(
        resolveCssColor(declarations, "er-link"),
      );
    }
    expect(fixedCount, "固定の意匠を 1 件も調べていない").toBeGreaterThan(0);
  });
});
