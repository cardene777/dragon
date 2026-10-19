import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export type CssRule = { selector: string; body: string };

export type CssDeclaration = {
  property: string;
  value: string;
};

export type ThemeShapeDeclaration = CssDeclaration & {
  selector: string;
};

const declarations = (body: string): Array<[string, string]> =>
  [...body.matchAll(/(--[a-z0-9-]+)\s*:\s*([^;]+);/gi)].map((match) => [
    match[1]!,
    match[2]!.replace(/\s+/g, " ").trim(),
  ]);

const rules = (source: string): CssRule[] =>
  [...source.replace(/\/\*[\s\S]*?\*\//g, "").matchAll(/([^{}]+)\{([^{}]*)\}/g)].map(
    (match) => ({
      selector: (match[1] ?? "").replace(/\s+/g, " ").trim(),
      body: match[2] ?? "",
    }),
  );

const allDeclarations = (body: string): CssDeclaration[] =>
  [...body.matchAll(/(^|;)\s*([a-z0-9-]+)\s*:\s*([^;]*)/gi)].map((match) => ({
    property: match[2]!.toLowerCase(),
    value: match[3]!.replace(/\s+/g, " ").trim(),
  }));

const shapeProperties = new Set([
  "transform",
  "translate",
  "scale",
  "rotate",
  "display",
  "r",
  "cx",
  "cy",
  "x",
  "y",
  "width",
  "height",
]);

const normalized = (value: string): string => value.replace(/\s+/g, " ").trim();

/** 意匠の値の表の選択子 */
const tableSelector = (theme: string): string => `svg[data-cdl-stage][data-cdl-palette="${theme}"]`;

export function readCdlThemeCssRules(): CssRule[] {
  themeCssSource ??= readFileSync(themeCssPath, "utf8");
  return rules(themeCssSource);
}

/** 配色から独立した時間軸の線札の骨組みを読む。 */
export function readTimelineLabelSkeleton(source: string): ReadonlyMap<string, string> {
  const selector = normalized(`
    svg[data-cdl-stage]:has([data-cdl-role="timeline-axis"])
      [data-cdl-edge-label-for]:is([data-cdl-tone="success"], [data-cdl-tone="error"])
      > [data-cdl-role="edge-label-bg"]
  `);
  const rule = rules(source).find((candidate) => candidate.selector === selector);
  return new Map((rule === undefined ? [] : allDeclarations(rule.body)).map(({ property, value }) => [
    property,
    value.replace(/\s*!important\s*$/iu, ""),
  ]));
}

/** 配色の有無・名前で対象を分ける規則に残った、骨組みを変える宣言を全件返す。 */
export function themeSpecificShapeDeclarations(sourceRules: readonly CssRule[]): ThemeShapeDeclaration[] {
  return sourceRules.flatMap(({ selector, body }) => {
    if (!/\[data-cdl-palette(?:\]|=)/i.test(selector)) return [];
    return allDeclarations(body)
      .filter(({ property }) => shapeProperties.has(property))
      .map((declaration) => ({ selector: normalized(selector), ...declaration }));
  });
}

let themeCssSource: string | undefined;
const themeCssPath = resolve(dirname(fileURLToPath(import.meta.url)), "../styles/cdl-theme.css");

export function readCdlThemeRoleTable(theme: string): Map<string, string> {
  themeCssSource ??= readFileSync(themeCssPath, "utf8");
  return readThemeRoleTable(themeCssSource, theme);
}

/** 意匠の値の表を 1 組読む。 同じ選択子の塊が複数あれば後の塊で上書きする (CSS と同じ順) */
export function readThemeRoleTable(source: string, theme: string): Map<string, string> {
  return new Map(themeTableBodies(source, theme).flatMap(declarations));
}

/**
 * 表の選択子の前に頁の根 (`html` / `:root` / `body`) を足して、画面の状態で値を差し替える塊 (#2962)。
 *
 * 意匠は地まで含めた 1 枚の絵なので、画面の意匠や明暗で値を替えない。 頁の根で差し替える塊が
 * あると、同じ意匠の図が画面ごとに別の色になる。 図の id で絞った塊 (見本ごとの調整) は数えない。
 */
export function ancestorScopedThemeTables(source: string, theme: string): string[] {
  const selector = tableSelector(theme);
  return rules(source)
    .filter((rule) => rule.selector.endsWith(` ${selector}`) && /^(?:html|:root|body)\b/.test(rule.selector))
    .map((rule) => rule.selector);
}

export function resolveThemeRole(
  table: ReadonlyMap<string, string>,
  role: string,
  seen = new Set<string>(),
): string | undefined {
  const value = table.get(role);
  if (value === undefined) return undefined;
  const referencedRole = /^var\((--[a-z0-9-]+)\)$/i.exec(value)?.[1];
  if (referencedRole === undefined || !table.has(referencedRole)) return value;
  if (seen.has(role)) throw new Error(`${role} の参照が循環している`);
  return resolveThemeRole(table, referencedRole, new Set([...seen, role]));
}

export function missingThemeRoleReads(source: string, themes: readonly string[]): string[] {
  const tables = new Map(themes.map((theme) => [theme, readThemeRoleTable(source, theme)]));
  const tableSelectors = new Set(themes.map(tableSelector));
  // `data-cdl-tone` の規則が対象要素へ置く値で、意匠の表が持つ役ではない。
  const locallyScopedRoles = new Set(["--dragon-edge-tone"]);
  const missing: string[] = [];

  for (const rule of rules(source)) {
    if (tableSelectors.has(rule.selector)) continue;
    const common = rule.selector.includes("[data-cdl-palette]:not(");
    const namedThemes = themes.filter((theme) =>
      rule.selector.includes(`[data-cdl-palette="${theme}"]`));
    const allPalettes = rule.selector.includes("svg[data-cdl-stage][data-cdl-palette]");
    const targets = common || allPalettes ? themes : namedThemes;
    if (targets.length === 0) continue;

    for (const match of rule.body.matchAll(/var\(\s*(--(?:dragon-|theme-)[a-z0-9-]+)(?:\s*,\s*([^)]+))?\)/gi)) {
      const role = match[1]!;
      if (locallyScopedRoles.has(role)) continue;
      const fallback = match[2]?.trim();
      for (const theme of targets) {
        const table = tables.get(theme)!;
        const value = table.get(role);
        if (value !== undefined && value.trim() !== "") continue;
        const fallbackRole = /^var\(\s*(--[a-z0-9-]+)\s*\)$/i.exec(fallback ?? "")?.[1];
        const fallbackHasValue = fallback !== undefined &&
          (fallbackRole === undefined || (table.get(fallbackRole)?.trim() ?? "") !== "");
        if (!fallbackHasValue) missing.push(`${theme}: ${role} (${rule.selector})`);
      }
    }
  }
  return [...new Set(missing)].sort();
}

/** 意匠の値の表 (`svg[data-cdl-stage][data-cdl-palette="<意匠>"]`) の塊の中身を全部返す */
export function themeTableBodies(source: string, theme: string): string[] {
  const selector = tableSelector(theme);
  return rules(source).filter((rule) => rule.selector === selector).map((rule) => rule.body);
}

/** 意匠を問わず舞台に当てる塊 (`svg[data-cdl-stage][data-cdl-palette]` だけの選択子) の中身を全部返す */
export function commonStageBodies(source: string): string[] {
  return rules(source)
    .filter((rule) => rule.selector === "svg[data-cdl-stage][data-cdl-palette]")
    .map((rule) => rule.body);
}

/** 意匠を持たない舞台だけに当てる規則の選択子。 舞台は必ず意匠を持つので 0 件が正 (#2962) */
export function paletteLessStageSelectors(source: string): string[] {
  return rules(source)
    .filter((rule) => rule.selector.includes(":not([data-cdl-palette])"))
    .map((rule) => rule.selector);
}

/** 塊の全ての中身 (選択子を問わない)。 読む変数を数える検査が使う */
export function allRuleBodies(source: string): string[] {
  return rules(source).map((rule) => rule.body);
}
