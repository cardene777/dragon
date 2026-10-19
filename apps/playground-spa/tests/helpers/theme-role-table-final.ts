export const FIXED_THEMES = [
  "blueprint",
  "letterpress",
  "catalog",
  "terminal",
  "sketch",
  "neon",
  "relief",
] as const;

export const COLOR_ONLY_THEMES = ["kinari", "celadon"] as const;
export const ALL_TABLE_THEMES = [...FIXED_THEMES, ...COLOR_ONLY_THEMES] as const;

export const THEME_ROLE_TABLE_BASELINE = {
  carryoverMarkers: 22,
  diagramOnlyRules: 240,
  namedDiagramOnlyRules: 238,
  tableRules: 19,
  inspectedRules: 529,
  riskyRules: 31,
} as const;

export type ThemeName = (typeof ALL_TABLE_THEMES)[number];

export type CssDeclaration = {
  property: string;
  value: string;
};

export type CssRule = {
  selector: string;
  body: string;
  start: number;
};

export type ThemeRuleAudit = {
  carryoverMarkerCount: number;
  inspectedRules: CssRule[];
  namedRules: CssRule[];
  tableRules: CssRule[];
};

const normalized = (value: string): string => value.replace(/\s+/g, " ").trim();

/** 注釈の位置を保ったまま平らな宣言 block を取り出す。 */
export function cssRules(source: string): CssRule[] {
  const withoutComments = source.replace(/\/\*[\s\S]*?\*\//g, (comment) =>
    comment.replace(/[^\n]/g, " "));
  const rules: CssRule[] = [];
  for (const match of withoutComments.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    const rawSelector = match[1] ?? "";
    const selectorAt = rawSelector.search(/\S/);
    if (selectorAt < 0) continue;
    rules.push({
      selector: normalized(rawSelector),
      body: match[2] ?? "",
      start: (match.index ?? 0) + selectorAt,
    });
  }
  return rules;
}

export function declarations(body: string): CssDeclaration[] {
  return [...body.matchAll(/(^|;)\s*([a-z0-9-]+)\s*:\s*([^;]*)/gi)].map((match) => ({
    property: match[2]!.trim(),
    value: match[3]!.replace(/\s*!important\s*$/i, "").trim(),
  }));
}

const fixedThemesIn = (selector: string): (typeof FIXED_THEMES)[number][] =>
  FIXED_THEMES.filter((theme) => selector.includes(`[data-cdl-palette="${theme}"]`));

export function themeRuleAudit(source: string): ThemeRuleAudit {
  const rules = cssRules(source);
  const tableHeading = source.indexOf(" * 図の配色 (#1553)");
  const tableStart = source.indexOf("*/", tableHeading) + 2;
  const tableEnd = source.indexOf("/* ─────────────────", tableStart);
  const markers = [...source.matchAll(/\/\* 持ち越しの目印:[\s\S]*?\*\//g)].map((match) => ({
    end: (match.index ?? 0) + match[0].length,
  }));
  const hasCarryoverMarker = (rule: CssRule): boolean => {
    let markerEnd = -1;
    for (const marker of markers) {
      if (marker.end > rule.start) break;
      markerEnd = marker.end;
    }
    return markerEnd >= 0 && source.slice(markerEnd, rule.start).trim() === "";
  };
  const namedRules = rules.filter(({ selector }) => fixedThemesIn(selector).length > 0);
  const tableRules = rules.filter(({ selector, start }) =>
    (start >= tableStart && start < tableEnd) || FIXED_THEMES.some((theme) => {
      const plain = `svg[data-cdl-stage][data-cdl-palette="${theme}"]`;
      return selector === plain || selector === `html.dark ${plain}`;
    }));
  const inspectedRules = namedRules.filter((rule) =>
    !tableRules.includes(rule) && !hasCarryoverMarker(rule));
  return {
    carryoverMarkerCount: markers.length,
    inspectedRules,
    namedRules,
    tableRules,
  };
}

export function directDimensionsAndEffects(rules: CssRule[]): string[] {
  const widthOrCorner = /(?:^|-)(?:width|radius|rx|ry|r)$/i;
  const direct: string[] = [];
  for (const rule of rules) {
    for (const { property, value } of declarations(rule.body)) {
      const dimension = widthOrCorner.test(property) &&
        !/\bvar\(/i.test(value) &&
        /(?:^|\s)-?(?:\d*\.)?\d+(?:[a-z%]+)?(?:\s|$)/i.test(value);
      const effect = /(?:url\(#|drop-shadow\()/i.test(value);
      if (dimension || effect) direct.push(`${rule.selector} { ${property}: ${value} }`);
    }
  }
  return direct;
}

export function tableDeclarations(source: string): Map<ThemeName, Map<string, string>> {
  return new Map(
    ALL_TABLE_THEMES.map((theme) => [theme, readThemeRoleTable(source, theme).light]),
  );
}

/** `var(--role, fallback)` も role の宣言不足を隠さず、先頭の role を読む。 */
export function missingReadRoles(source: string, readers = themeRuleAudit(source).inspectedRules): string[] {
  const tables = tableDeclarations(source);
  // 線の色みごとに祖先へ置く口で、意匠の表が持つ役ではない。
  const scopedRoles = new Set(["--dragon-edge-tone"]);
  const missing: string[] = [];
  for (const rule of readers) {
    const roles = new Set(
      [...rule.body.matchAll(/var\((--(?:dragon-|theme-stage-)[a-z0-9-]+)/gi)]
        .map((match) => match[1]!),
    );
    for (const theme of fixedThemesIn(rule.selector)) {
      const table = tables.get(theme)!;
      for (const role of roles) {
        if (scopedRoles.has(role)) continue;
        const value = table.get(role);
        if (value === undefined || value.trim() === "") {
          missing.push(`${theme}: ${role} (${rule.selector})`);
        }
      }
    }
  }
  return [...new Set(missing)].sort();
}

export function sectionHeadings(source: string): string[] {
  const lines = source.split("\n");
  const headings: string[] = [];
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index]!;
    if (index > 0 && /^\/\* ─{20,}/.test(lines[index - 1]!)) {
      const heading = /^ \* (.*)$/.exec(line)?.[1];
      if (heading !== undefined) headings.push(heading);
    } else if (/^\/\* ── /.test(line)) {
      headings.push(line.replace(/^\/\* ── /, "").replace(/ ─+.*$/, "").replace(/ \*\/$/, ""));
    }
  }
  return headings;
}
import { readThemeRoleTable } from "../../src/lib/theme-role-table-test-helpers";

