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
  readFixedThemeFrameOpacity,
  readFixedThemeGroundText,
  readFixedThemeLead,
  readFixedThemeRoleColor,
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
const CARD_TEXT_BACKGROUNDS = ["face", "stripe"] as const;

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
