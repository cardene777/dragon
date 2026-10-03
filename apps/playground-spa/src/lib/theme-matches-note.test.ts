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
  readFixedThemeChartSeries,
  readThemeNotes,
  readThemeNoteText,
  type ThemeNote,
  type ThemePort,
} from "../../tests/helpers/theme-notes";
import { contrast } from "../../tests/helpers/pixel-contrast";

const 読む = (rel: string): string =>
  readFileSync(fileURLToPath(new URL(rel, import.meta.url)), "utf8");

type CssTheme = { light: Map<ThemePort, string>; dark: Map<ThemePort, string>; hasDarkBlock: boolean };
type CssChartTheme = { cdl: string[]; dragon: string[]; colors: string[] };
const TEXT_TONES = ["accent", "teal", "success", "error", "warning", "info"] as const;
const TEXT_BACKGROUNDS = ["ground", "face", "stripe"] as const;

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

function cssChartThemes(cssText: string, fixedNames: Set<string>): Map<string, CssChartTheme> {
  const css = cssText.replace(/\/\*[\s\S]*?\*\//g, "");
  const out = new Map<string, CssChartTheme>();
  for (const m of css.matchAll(/([^{}]*)\{([^{}]*)\}/g)) {
    const selector = m[1] ?? "";
    const body = m[2] ?? "";
    const named = /\[data-cdl-palette="([^"]+)"\]/.exec(selector);
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
      const variable = /^var\(--(er-[a-z-]+)\)$/.exec(value)?.[1];
      const resolved = variable ? declarations.get(variable) : undefined;
      if (!resolved || !/^#[0-9a-f]{6}$/.test(resolved)) {
        throw new Error(`${themeName} の図表の値 ${value} を同じ塊の --er-* から解けない`);
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

function cssFixedThemeDeclarations(cssText: string, themeName: string): Map<string, string> {
  const css = cssText.replace(/\/\*[\s\S]*?\*\//g, "");
  const declarations = new Map<string, string>();
  for (const m of css.matchAll(/([^{}]*)\{([^{}]*)\}/g)) {
    const selector = m[1] ?? "";
    const applies = selector.includes(`[data-cdl-palette="${themeName}"]`) ||
      selector.includes("[data-cdl-palette]");
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

function fixedTextToneContrast(cssText: string): { checked: number; failures: string[] } {
  const failures: string[] = [];
  let checked = 0;
  for (const [name, note] of readThemeNotes()) {
    if (note.mode !== "fixed") continue;
    const declarations = cssFixedThemeDeclarations(cssText, name);
    for (const tone of TEXT_TONES) {
      const foreground = resolveCssColor(declarations, `cdl-tone-${tone}`);
      for (const background of TEXT_BACKGROUNDS) {
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

  it("意匠帳の値を変えると同じ比較経路が検知する", () => {
    const original = readThemeNoteText("blueprint");
    const changed = original.replace("| 台 | `#e3e9ea` |", "| 台 | `#ffffff` |");
    expect(changed, "変異を本文へ植え込めていない").not.toBe(original);

    const notes = readThemeNotes({ blueprint: changed });
    const result = compare(notes, cssThemes(cssText));
    expect(result.mismatch.some((line) => line.includes("blueprint.ground"))).toBe(true);
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

  it("固定の意匠で字に使う tone は台・行の面・縞の上で 4.5 以上になる", () => {
    const fixedCount = [...readThemeNotes().values()].filter((note) => note.mode === "fixed").length;
    const result = fixedTextToneContrast(cssText);

    expect(result.checked, "固定の意匠 × 文字用 tone × 背景を全て調べていない").toBe(
      fixedCount * TEXT_TONES.length * TEXT_BACKGROUNDS.length,
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
