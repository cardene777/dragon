// @vitest-environment jsdom

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
  readBlueprintHatch,
  readFixedThemeChartSeries,
  readFixedThemeFrameOpacity,
  readFixedThemeGroundText,
  readFixedThemeLabelToneStyles,
  readFixedThemeTimelineLabelStyles,
  readFixedThemeLead,
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
import { over } from "../../tests/helpers/effective-color";
import { readThemeRoleTable, resolveThemeRole } from "./theme-role-table-test-helpers";

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
  accent: { note: "one", role: "line" },
  info: { note: "one", role: "line" },
  success: { note: "two", role: "link" },
  teal: { note: "three", role: "own" },
  error: { note: "three", role: "own" },
  warning: { note: "three", role: "own" },
} as const;

function cssThemes(cssText: string): Map<string, CssTheme> {
  const out = new Map<string, CssTheme>();
  for (const name of THEMES) {
    const table = readThemeRoleTable(cssText, name);
    const ports = (side: ReadonlyMap<string, string>): Map<ThemePort, string> => new Map(
      THEME_PORTS.flatMap((port) => {
        const value = side.get(`--er-${port}`);
        return value === undefined ? [] : [[port, value] as const];
      }),
    );
    out.set(name, {
      light: ports(table.light),
      dark: table.hasDarkBlock ? ports(table.dark) : new Map<ThemePort, string>(),
      hasDarkBlock: table.hasDarkBlock,
    });
  }
  return out;
}

function cssMetroThemes(cssText: string): Map<string, CssMetroTheme> {
  const out = new Map<string, CssMetroTheme>();
  for (const name of THEMES) {
    const table = readThemeRoleTable(cssText, name);
    const colors = (side: ReadonlyMap<string, string>): Map<MetroColorRole, string> => new Map(
      Object.entries(METRO_CSS_ROLES).flatMap(([cssRole, noteRole]) => {
        const value = side.get(`--metro-${cssRole}`);
        return value === undefined ? [] : [[noteRole, value] as const];
      }),
    );
    out.set(name, {
      light: colors(table.light),
      dark: table.hasDarkBlock ? colors(table.dark) : new Map<MetroColorRole, string>(),
    });
  }
  return out;
}

function cssChartThemes(cssText: string, fixedNames: Set<string>): Map<string, CssChartTheme> {
  const out = new Map<string, CssChartTheme>();
  for (const themeName of fixedNames) {
    const declarations = readThemeRoleTable(cssText, themeName).light;
    const chartValues = (prefix: "cdl" | "d"): string[] =>
      Array.from({ length: 6 }, (_, index) => {
        const name = `--${prefix}-chart-${index + 1}`;
        const value = declarations.get(name);
        if (!value) throw new Error(`${themeName} の --${name} が無い`);
        return value;
      });
    const cdl = chartValues("cdl");
    const colors = Array.from({ length: 6 }, (_, index) => {
      const value = resolveThemeRole(declarations, `--cdl-chart-${index + 1}`);
      if (!value || !/^#[0-9a-f]{6}$/.test(value)) {
        throw new Error(`${themeName} の図表の値を同じ表の CSS 変数から解けない`);
      }
      return value;
    });
    out.set(themeName, { cdl, dragon: chartValues("d"), colors });
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
  return new Map(
    [...readThemeRoleTable(cssText, themeName).light]
      .map(([role, value]) => [role.slice(2), value]),
  );
}

function cssFixedTimelineDeclarations(cssText: string, themeName: string): Map<string, string> {
  return cssFixedThemeDeclarations(cssText, themeName);
}

function cssFixedThemeBoxDeclarations(cssText: string, themeName: string): Map<string, string> {
  return cssFixedThemeDeclarations(cssText, themeName);
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

function cssGanttSeries(cssText: string, themeName: string): string[] {
  const declarations = cssFixedThemeDeclarations(cssText, themeName);
  return Array.from({ length: 6 }, (_, index) =>
    resolveCssColor(declarations, `dragon-gantt-series-${index + 1}`));
}

function compareGanttCss(
  cssText: string,
  expected: Map<DslTheme, ThemeToneSeries>,
): string[] {
  const failures: string[] = [];
  const charts = readFixedThemeChartSeries();
  for (const [name, style] of expected) {
    const chart = charts.get(name);
    if (!chart) throw new Error(`${name} の図表の系列色を意匠帳から読めない`);
    const actualColors = cssGanttSeries(cssText, name);
    const expectedColors = themeGanttSeriesColors(chart, style);
    for (let series = 1; series <= 6; series += 1) {
      const actual = actualColors[series - 1];
      const want = expectedColors[series - 1];
      if (actual !== want) {
        failures.push(`${name} 日程の帯 ${series}: 意匠帳 ${want} / CSS ${actual}`);
      }
    }

    const declarations = cssFixedThemeDeclarations(cssText, name);
    const actualOwner = resolveCssColor(declarations, "dragon-gantt-owner-text");
    if (actualOwner !== style.ganttOwnerColor) {
      failures.push(`${name} 担当の字: 意匠帳 ${style.ganttOwnerColor} / CSS ${actualOwner}`);
    }
    if (style.ganttSecondaryOwnerColor !== undefined) {
      const actualSecondary = resolveCssColor(declarations, "dragon-gantt-secondary-owner-text");
      if (actualSecondary !== style.ganttSecondaryOwnerColor) {
        failures.push(`${name} 通常帯の担当の字: 意匠帳 ${style.ganttSecondaryOwnerColor} / CSS ${actualSecondary}`);
      }
    }
  }
  return failures;
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
      const tableRole = {
        accent: "dragon-theme-box-frame",
        info: "dragon-theme-line",
        teal: "cdl-tone-teal",
        success: "cdl-tone-success",
        error: "cdl-tone-error",
        warning: "cdl-tone-warning",
      }[tone];
      const overriddenRole = `cdl-tone-${tone}`;
      const foreground = resolveCssColor(
        declarations,
        declarations.has(overriddenRole) ? overriddenRole : tableRole,
      );
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
  const failures: string[] = [];
  let checked = 0;
  for (const [name, want] of expected) {
    const value = cssFixedThemeDeclarations(cssText, name).get("dragon-theme-box-frame-opacity");
    if (value === undefined) {
      failures.push(`足りない名前: ${name} (--dragon-theme-box-frame-opacity が無い)`);
      continue;
    }
    const actual = /^\d+(?:\.\d+)?$/.test(value) ? Number(value) : null;
    checked += 1;
    if (actual === null) {
      failures.push(`${name}: --dragon-theme-box-frame-opacity が数ではない`);
    } else if (actual !== want) {
      failures.push(`${name}: 枠の濃さは意匠帳 ${want} / CSS ${actual}`);
    }
  }

  return { checked, failures };
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

  it("意匠帳の値を変えると同じ比較経路が検知する", () => {
    const original = readThemeNoteText("blueprint");
    const changed = original.replace("| 台 | `#e3e9ea` |", "| 台 | `#ffffff` |");
    expect(changed, "変異を本文へ植え込めていない").not.toBe(original);

    const notes = readThemeNotes({ blueprint: changed });
    const result = compare(notes, cssThemes(cssText));
    expect(result.mismatch.some((line) => line.includes("blueprint.ground"))).toBe(true);
  });

  it("5 意匠の札は色みと主役の属性で意匠帳の線・向きだけ・所有を塗る", () => {
    const expected = readFixedThemeLabelToneStyles();
    const failures: string[] = [];
    for (const [name, style] of expected) {
      const declarations = cssFixedThemeDeclarations(cssText, name);
      for (const [tone, { note, role }] of Object.entries(LABEL_TONES)) {
        const paintRole = `dragon-theme-tag-${role}-${style.paint === "fill" ? "fill" : "frame"}`;
        const paint = resolveCssColor(declarations, paintRole);
        if (paint !== style[note]) failures.push(`${name}/${tone} ${style.paint}: 意匠帳 ${style[note]} / CSS ${paint}`);
        const ink = resolveCssColor(declarations, `dragon-theme-tag-${role}-text`);
        const expectedInk = style.inkMode === "tone" ? style[note] : style.ink;
        if (ink !== expectedInk) failures.push(`${name}/${tone} 字: 意匠帳 ${expectedInk} / CSS ${ink}`);
        if (name === "neon") {
          const glow = resolveCssColor(declarations, `dragon-theme-tag-${role}-frame`);
          if (glow !== style[note]) failures.push(`${name}/${tone} 光: 意匠帳 ${style[note]} / CSS ${glow}`);
        }
      }

      const mainPaintRole = `dragon-theme-tag-line-${style.paint === "fill" ? "fill" : "frame"}`;
      const mainPaint = resolveCssColor(declarations, mainPaintRole);
      if (mainPaint !== style.one) failures.push(`${name}/main ${style.paint}: 意匠帳 ${style.one} / CSS ${mainPaint}`);
      const mainInk = resolveCssColor(declarations, "dragon-theme-tag-line-text");
      const expectedMainInk = style.inkMode === "tone" ? style.one : style.ink;
      if (mainInk !== expectedMainInk) failures.push(`${name}/main 字: 意匠帳 ${expectedMainInk} / CSS ${mainInk}`);
    }
    expect(expected.size).toBe(5);
    expect(failures, "札の意味属性と意匠帳が違う").toEqual([]);
  });

  it("意匠帳で色を定めた単系列の模様は SvgDefs と一致する", () => {
    const svgDefs = 読む("../components/SvgDefs.tsx");
    let checked = 0;
    for (const [name, style] of readFixedThemeSingleSeriesBars()) {
      for (const [role, bar] of [["主役", style.primary], ["それ以外", style.secondary]] as const) {
        if (bar.patternColor === undefined) continue;
        const patternId = /^url\((#[a-z0-9-]+)\)$/.exec(bar.fill)?.[1]?.slice(1);
        const pattern = patternId === undefined
          ? undefined
          : new RegExp(`<pattern(?=[^>]*\\bid=["']${patternId}["'])[^>]*>[\\s\\S]*?<\\/pattern>`).exec(svgDefs)?.[0];
        const patternColor = pattern === undefined
          ? undefined
          : /<rect[^>]*\bfill=["'](#[0-9a-fA-F]{6})["']/.exec(pattern)?.[1]?.toLowerCase();
        expect(patternColor, `${name} ${role}の模様色`).toBe(bar.patternColor);
        checked += 1;
      }
    }
    expect(checked, "模様色を 1 件も突き合わせていない").toBeGreaterThan(0);
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
        const patternedSecondary = name === "sketch" && series > 1;
        const ground = rgb(note.value.ground);
        const originalSurface = tones.ganttSurfaceOpacity === undefined
          ? rgb(original)
          : over(rgb(original), tones.ganttSurfaceOpacity, ground);
        const surface = tones.ganttSurfaceOpacity === undefined
          ? rgb(color)
          : over(rgb(color), tones.ganttSurfaceOpacity, ground);
        const originalRatio = contrast(originalSurface, rgb(tones.ganttOwnerColor));
        const ownerRatio = contrast(surface, rgb(tones.ganttOwnerColor));
        if (!patternedSecondary && overridden !== (originalRatio < 4.5)) {
          failures.push(`${name} 日程の帯 ${series}: 元の担当との対比 ${originalRatio.toFixed(2)} なのに上書き ${overridden ? "あり" : "なし"}`);
        }
        if (!patternedSecondary && overridden) {
          // 必要以上に動かしていないこと = 上書き後の対比が下限のすぐ上に収まる
          if (ownerRatio >= 4.6) {
            failures.push(`${name} 日程の帯 ${series}: 上書き後の担当との対比 ${ownerRatio.toFixed(2)} が 4.6 以上 (動かしすぎ)`);
          }
          const difference = hueDifference(original, color);
          if (difference > 10) {
            failures.push(`${name} 日程の帯 ${series}: 元の系列色との色相差 ${difference.toFixed(2)} 度 > 10 度`);
          }
        }
        if (!patternedSecondary && ownerRatio < 4.5) {
          failures.push(`${name} 日程の帯 ${series}: 担当との対比 ${ownerRatio.toFixed(2)} < 4.5`);
        }
        // 電飾の半透明相当の面は枠で形を示すため、台との 3:1 は見本の枠色で測る。
        const boundary = tones.ganttFrameWhiteRatio === undefined
          ? rgb(color)
          : over([255, 255, 255], tones.ganttFrameWhiteRatio, rgb(color));
        const groundRatio = contrast(boundary, rgb(note.value.ground));
        if (groundRatio < 3) {
          failures.push(`${name} 日程の帯 ${series}: 台との対比 ${groundRatio.toFixed(2)} < 3`);
        }
      }

      if (name === "sketch") {
        const secondaryOwner = tones.ganttSecondaryOwnerColor;
        const pale = readFixedThemeRoleColor("sketch", "淡");
        if (!secondaryOwner || !pale) throw new Error("手描きの通常帯の担当字と淡を読めない");
        const faceRatio = contrast(rgb(secondaryOwner), rgb(note.value.face));
        const hatchRatio = contrast(rgb(secondaryOwner), rgb(pale));
        if (faceRatio < 4.5 || hatchRatio < 4.5) {
          failures.push(`sketch 通常帯の担当: 面 ${faceRatio.toFixed(2)} / 淡い斜線 ${hatchRatio.toFixed(2)}`);
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

  it("図録の段の字と手描きの日程の棒の枠を決める表の役は意匠帳の例外と一致する", () => {
    const expected = readFixedThemeToneSeries();
    const catalog = expected.get("catalog");
    const sketch = expected.get("sketch");
    if (!catalog?.textColor || !sketch?.stroke || sketch.strokeWidth === undefined) {
      throw new Error("図録または手描きの日程の例外を意匠帳から読めない");
    }
    const catalogDeclarations = cssFixedThemeDeclarations(cssText, "catalog");
    expect(resolveCssColor(catalogDeclarations, "er-ink")).toBe(catalog.textColor);

    const sketchDeclarations = cssFixedThemeDeclarations(cssText, "sketch");
    expect(resolveCssColor(sketchDeclarations, "er-ink")).toBe(sketch.stroke);
    expect(Number.parseFloat(sketchDeclarations.get("dragon-gantt-bar-frame-width") ?? ""))
      .toBe(sketch.strokeWidth);
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

  it("意匠帳の図録の線の札を書き換えると CSS との不一致を検知する", () => {
    const original = readThemeNoteText("catalog");
    const changed = original.replace("一 `#dca443`", "一 `#ffffff`");
    expect(changed, "札の変異を本文へ植え込めていない").not.toBe(original);
    const expected = readFixedThemeLabelToneStyles({ catalog: changed }).get("catalog");
    if (!expected) throw new Error("図録の札を読めない");
    const actual = resolveCssColor(
      cssFixedThemeDeclarations(cssText, "catalog"),
      "dragon-theme-tag-line-fill",
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

  it("固定の意匠の現在色を決める表の役は意匠帳の一と一致する", () => {
    const expected = readFixedThemeLead();
    expect(expected.size, "固定の意匠を 1 件も読めていない").toBeGreaterThan(0);
    for (const [name, color] of expected) {
      const declarations = cssFixedThemeDeclarations(cssText, name);
      const role = declarations.has("cdl-now") ? "cdl-now" : "dragon-theme-accent";
      expect(resolveCssColor(declarations, role), name).toBe(color);
    }
  });

  it("意匠帳の一を書き換えると現在色を決める表の役との不一致を検知する", () => {
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

  it("箱の枠の濃さは固定の意匠の表で意匠帳と一致する", () => {
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

  it("success の字は型名、success の線は向きだけの色を使う", () => {
    let fixedCount = 0;
    for (const [name, note] of readThemeNotes()) {
      if (note.mode !== "fixed") continue;
      fixedCount += 1;
      const declarations = cssFixedThemeDeclarations(cssText, name);
      expect(resolveCssColor(declarations, "cdl-tone-success"), `${name} の success の字`).toBe(
        resolveCssColor(declarations, "er-type"),
      );
      expect(resolveCssColor(declarations, "dragon-theme-link"), `${name} の success の線`).toBe(
        resolveCssColor(declarations, "er-link"),
      );
    }
    expect(fixedCount, "固定の意匠を 1 件も調べていない").toBeGreaterThan(0);
  });

  it("時間軸の軸と終わりの印の色を palette 名ごとに見本の口へ結ぶ", () => {
    const expected = {
      kinari: { axis: "var(--er-line)", end: "var(--er-ink)" },
      celadon: { axis: "var(--er-line)", end: "var(--er-ink)" },
      blueprint: { axis: "var(--er-line)", end: "var(--er-ink)" },
      letterpress: { axis: "var(--theme-lead)", end: "var(--er-ink)" },
      catalog: { axis: "var(--er-line)", end: "var(--theme-ground-ink)" },
      terminal: { axis: "var(--er-line)", end: "#a6f0bd" },
      sketch: { axis: "var(--er-line)", end: "var(--er-ink)" },
      neon: { axis: "var(--er-line)", end: "var(--er-ink)" },
      relief: { axis: "var(--er-line)", end: "var(--er-ink)" },
    } satisfies Record<DslTheme, { axis: string; end: string }>;

    for (const [name, values] of Object.entries(expected)) {
      const declarations = cssFixedThemeDeclarations(cssText, name);
      expect(declarations.get("timeline-axis"), `${name} の軸`).toBe(values.axis);
      expect(declarations.get("timeline-end-ink"), `${name} の終わり`).toBe(values.end);
    }
  });

  it("7 意匠の時間軸の線の札を見本の値と意匠帳へ結ぶ", () => {
    const expected = {
      blueprint: { successFill: "#1f7a6b", errorFill: "#a8431f", successText: "#ebf0f0", errorText: "#e3e9ea", successFrame: "none", errorFrame: "none", frameWidth: 0, radius: 9 },
      letterpress: { successFill: "#1a1510", errorFill: "#1a1510", successText: "#f0eadc", errorText: "#f0eadc", successFrame: "none", errorFrame: "none", frameWidth: 0, radius: 9 },
      catalog: { successFill: "#4fae9a", errorFill: "#e8705a", successText: "#1b222c", errorText: "#1b222c", successFrame: "none", errorFrame: "none", frameWidth: 0, radius: 9 },
      terminal: { successFill: "#c792ea", errorFill: "#f5c451", successText: "#03110a", errorText: "#03110a", successFrame: "none", errorFrame: "none", frameWidth: 0, radius: 4 },
      sketch: { successFill: "#2f7d4f", errorFill: "#2a5ca8", successText: "#fffdf7", errorText: "#fffdf7", successFrame: "none", errorFrame: "none", frameWidth: 0, radius: 9 },
      neon: { successFill: "#07060c", errorFill: "#07060c", successText: "#00e5ff", errorText: "#ffd000", successFrame: "#00e5ff", errorFrame: "#ffd000", frameWidth: 2.5, radius: 9 },
      relief: { successFill: "#2f7a6e", errorFill: "#c99a35", successText: "#ffffff", errorText: "#383838", successFrame: "none", errorFrame: "none", frameWidth: 0, radius: 20 },
    } as const;
    const notes = readFixedThemeTimelineLabelStyles();

    for (const [name, values] of Object.entries(expected)) {
      const declarations = cssFixedTimelineDeclarations(cssText, name);
      const actual = {
        successFill: resolveCssColor(declarations, "theme-timeline-label-success-fill"),
        errorFill: resolveCssColor(declarations, "theme-timeline-label-error-fill"),
        successText: resolveCssColor(declarations, "theme-timeline-label-success-text"),
        errorText: resolveCssColor(declarations, "theme-timeline-label-error-text"),
        successFrame: declarations.get("theme-timeline-label-success-frame") === "none"
          ? "none"
          : resolveCssColor(declarations, "theme-timeline-label-success-frame"),
        errorFrame: declarations.get("theme-timeline-label-error-frame") === "none"
          ? "none"
          : resolveCssColor(declarations, "theme-timeline-label-error-frame"),
        frameWidth: Number.parseFloat(declarations.get("theme-timeline-label-frame-width") ?? ""),
        radius: Number.parseFloat(declarations.get("theme-timeline-label-radius") ?? ""),
        height: Number.parseFloat(declarations.get("theme-timeline-label-height") ?? ""),
        fontSize: Number.parseFloat(declarations.get("theme-timeline-label-font-size") ?? ""),
        fontWeight: Number.parseFloat(declarations.get("theme-timeline-label-font-weight") ?? ""),
      };
      expect(actual, `${name} の時間軸の線の札`).toEqual({ ...values, height: 40, fontSize: 21, fontWeight: 700 });
      expect(notes.get(name as DslTheme), `${name} の意匠帳`).toEqual(actual);
      expect(contrast(rgb(actual.successText), rgb(actual.successFill)), `${name}/success`).toBeGreaterThanOrEqual(4.5);
      expect(contrast(rgb(actual.errorText), rgb(actual.errorFill)), `${name}/error`).toBeGreaterThanOrEqual(4.5);
    }
  });

});
