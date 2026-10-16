import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export type ThemeRoleTable = {
  light: Map<string, string>;
  dark: Map<string, string>;
  hasDarkBlock: boolean;
};

export type MissingThemeRoleOptions = {
  themes: readonly string[];
  fixedThemes: readonly string[];
};

type CssRule = { selector: string; body: string };

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

let themeCssSource: string | undefined;
const themeCssPath = resolve(dirname(fileURLToPath(import.meta.url)), "../styles/cdl-theme.css");

export function readCdlThemeRoleTable(theme: string): ThemeRoleTable {
  themeCssSource ??= readFileSync(themeCssPath, "utf8");
  return readThemeRoleTable(themeCssSource, theme);
}

export function readThemeRoleTable(source: string, theme: string): ThemeRoleTable {
  const selector = `svg[data-cdl-stage][data-cdl-palette="${theme}"]`;
  const light = new Map<string, string>();
  const darkOverrides = new Map<string, string>();
  let hasDarkBlock = false;

  for (const rule of rules(source)) {
    if (rule.selector === selector) {
      for (const [role, value] of declarations(rule.body)) light.set(role, value);
    } else if (rule.selector === `html.dark ${selector}`) {
      hasDarkBlock = true;
      for (const [role, value] of declarations(rule.body)) darkOverrides.set(role, value);
    }
  }

  return {
    light,
    dark: new Map([...light, ...darkOverrides]),
    hasDarkBlock,
  };
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

export function missingThemeRoleReads(
  source: string,
  { themes, fixedThemes }: MissingThemeRoleOptions,
): string[] {
  const tables = new Map(themes.map((theme) => [theme, readThemeRoleTable(source, theme).light]));
  const tableSelectors = new Set(
    themes.flatMap((theme) => {
      const selector = `svg[data-cdl-stage][data-cdl-palette="${theme}"]`;
      return [selector, `html.dark ${selector}`];
    }),
  );
  // `data-cdl-tone` の規則が対象要素へ置く値で、意匠の表が持つ役ではない。
  const locallyScopedRoles = new Set(["--dragon-edge-tone"]);
  const missing: string[] = [];

  for (const rule of rules(source)) {
    if (tableSelectors.has(rule.selector)) continue;
    const common = rule.selector.includes("[data-cdl-palette]:not(");
    const namedThemes = themes.filter((theme) =>
      rule.selector.includes(`[data-cdl-palette="${theme}"]`));
    const allPalettes = rule.selector.includes("svg[data-cdl-stage][data-cdl-palette]");
    const targets = common ? fixedThemes : allPalettes ? themes : namedThemes;
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

