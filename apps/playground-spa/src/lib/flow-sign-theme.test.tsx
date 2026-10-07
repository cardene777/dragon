import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { SvgDefs } from "../components/SvgDefs";
import { contrast } from "../../tests/helpers/pixel-contrast";
import { readFixedThemeRoleColor } from "../../tests/helpers/theme-notes";

const 読む = (rel: string): string =>
  readFileSync(fileURLToPath(new URL(rel, import.meta.url)), "utf8");

const cssText = 読む("../styles/cdl-theme.css");
const defsMarkup = renderToStaticMarkup(<SvgDefs />);

const FILTERS = {
  terminal: {
    sample: 読む("../../../../docs/design/proposal/static/流れ-端末.html"),
    id: "dragon-flow-sign-terminal-glow",
  },
  neon: {
    sample: 読む("../../../../docs/design/proposal/static/流れ-電飾.html"),
    id: "dragon-flow-sign-neon-glow",
  },
  relief: {
    sample: 読む("../../../../docs/design/proposal/static/流れ-浮彫.html"),
    id: "dragon-flow-sign-relief-raised",
  },
} as const;

const FILTER_RULES = {
  terminal: {
    id: "dragon-flow-sign-terminal-glow",
    selectors: [
      'svg[data-cdl-stage][data-cdl-palette="terminal"] [data-cdl-role="legend"]',
      'svg[data-cdl-stage][data-cdl-palette="terminal"] [data-cdl-role="node-body"][data-cdl-mark="start"]',
      'svg[data-cdl-stage][data-cdl-palette="terminal"] [data-cdl-role="node-body"][data-cdl-mark="end"]',
      'svg[data-cdl-stage][data-cdl-palette="terminal"] [data-cdl-role="node-inner"]',
    ],
  },
  neon: {
    id: "dragon-flow-sign-neon-glow",
    selectors: [
      'svg[data-cdl-stage][data-cdl-palette="neon"] [data-cdl-role="legend"]',
      'svg[data-cdl-stage][data-cdl-palette="neon"] [data-cdl-role="node-body"][data-cdl-mark="start"]',
      'svg[data-cdl-stage][data-cdl-palette="neon"] [data-cdl-role="node-body"][data-cdl-mark="end"]',
      'svg[data-cdl-stage][data-cdl-palette="neon"] [data-cdl-role="node-inner"]',
    ],
  },
  relief: {
    id: "dragon-flow-sign-relief-raised",
    selectors: [
      'svg[data-cdl-stage][data-cdl-palette="relief"] [data-cdl-role="legend"]',
      'svg[data-cdl-stage][data-cdl-palette="relief"] [data-cdl-role="node-body"][data-cdl-mark="start"]',
      'svg[data-cdl-stage][data-cdl-palette="relief"] [data-cdl-role="node-body"][data-cdl-mark="end"]',
      'svg[data-cdl-stage][data-cdl-palette="relief"] [data-cdl-role="node-inner"]',
    ],
  },
} as const;

const PRIMITIVE_ATTRIBUTES = {
  feGaussianBlur: ["in", "stdDeviation"],
  feComponentTransfer: ["in"],
  feFuncA: ["type", "slope"],
  feOffset: ["in", "dx", "dy"],
  feFlood: ["flood-color", "flood-opacity"],
  feComposite: ["in", "in2", "operator"],
  feMerge: [],
  feMergeNode: ["in"],
} as const;

function filterMarkup(markup: string, id: string): string {
  const escaped = id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const filter = new RegExp(
    `<filter(?=[^>]*\\bid=["']${escaped}["'])[^>]*>[\\s\\S]*?<\\/filter>`,
  ).exec(markup)?.[0];
  if (!filter) throw new Error(`filter #${id} が無い`);
  return filter;
}

function attributes(tag: string): Map<string, string> {
  return new Map(
    [...tag.matchAll(/([:\w-]+)=["']([^"']*)["']/g)].flatMap((match) => {
      const name = match[1];
      const value = match[2];
      return name && value !== undefined ? [[name, value] as const] : [];
    }),
  );
}

function primitiveSignature(filter: string): Array<{ name: string; values: string[] }> {
  const resultAliases = new Map<string, string>();
  return [...filter.matchAll(/<(fe[A-Za-z]+)\b[^>]*>/g)].map((match, index) => {
    const name = match[1];
    const tag = match[0];
    if (!name || !tag || !Object.hasOwn(PRIMITIVE_ATTRIBUTES, name)) {
      throw new Error(`filter primitive を読めない: ${tag ?? ""}`);
    }
    const attrs = attributes(tag);
    const keys = PRIMITIVE_ATTRIBUTES[name as keyof typeof PRIMITIVE_ATTRIBUTES];
    const values = keys.map((key) => {
      const value = attrs.get(key) ?? "";
      return key === "in" || key === "in2" ? (resultAliases.get(value) ?? value) : value;
    });
    const result = attrs.get("result");
    if (result) resultAliases.set(result, `result-${index}`);
    return { name, values };
  });
}

function filterAttribute(filter: string, name: string): string | undefined {
  const opening = /^<filter\b[^>]*>/.exec(filter)?.[0];
  return opening ? attributes(opening).get(name) : undefined;
}

function expectFilterMatches(sample: string, actualId: string): void {
  const expected = primitiveSignature(filterMarkup(sample, "光"));
  const actual = primitiveSignature(filterMarkup(defsMarkup, actualId));
  expect(actual, actualId).toEqual(expected);
}

function cssRuleBody(selector: string, property: string): string {
  const css = cssText.replace(/\/\*[\s\S]*?\*\//g, "");
  const escaped = property.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const bodies = [...css.matchAll(/([^{}]*)\{([^{}]*)\}/g)].flatMap((match) => {
    const selectors = (match[1] ?? "").split(",").map((value) => value.trim());
    const body = match[2] ?? "";
    return selectors.includes(selector) && new RegExp(`(?:^|;)\\s*${escaped}\\s*:`).test(body)
      ? [body]
      : [];
  });
  if (bodies.length !== 1) {
    throw new Error(`${selector} の ${property} を持つ CSS 規則が ${bodies.length} 件ある`);
  }
  const body = bodies[0];
  if (!body) throw new Error(`${selector} の CSS 本文が無い`);
  return body;
}

function cssValue(body: string, property: string): string {
  const escaped = property.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const value = new RegExp(`(?:^|;)\\s*${escaped}\\s*:\\s*([^;]+)`).exec(body)?.[1];
  if (!value) throw new Error(`${property} の CSS 値が無い`);
  return value.trim().replace(/\s*!important$/, "");
}

function rgb(hex: string): [number, number, number] {
  const value = Number.parseInt(hex.slice(1), 16);
  return [value >> 16, (value >> 8) & 255, value & 255];
}

describe("流れの凡例と始まり・終わりの印 (#2834)", () => {
  it("端末・電飾・浮彫の filter は見本の #光 と primitive の順・値・merge の順が一致する", () => {
    for (const { sample, id } of Object.values(FILTERS)) {
      expectFilterMatches(sample, id);
      const filter = filterMarkup(defsMarkup, id);
      expect(filterAttribute(filter, "filterUnits"), id).toBe("userSpaceOnUse");
      expect(
        ["x", "y", "width", "height"].map((name) => filterAttribute(filter, name)),
        id,
      ).toEqual(["-10%", "-10%", "120%", "120%"]);
    }
  });

  it("見本の primitive を変えると filter の不一致を検知する", () => {
    const original = FILTERS.terminal.sample;
    const changed = original.replace('stdDeviation="3.5"', 'stdDeviation="3.6"');
    expect(changed, "端末の見本へ変異を入れられない").not.toBe(original);
    expect(() => expectFilterMatches(changed, FILTERS.terminal.id)).toThrow();
  });

  it("3 意匠の凡例と始まり・終わりの各図形へ専用 filter を 1 回だけ当てる", () => {
    for (const { id, selectors } of Object.values(FILTER_RULES)) {
      for (const selector of selectors) {
        expect(cssValue(cssRuleBody(selector, "filter"), "filter"), selector).toBe(`url(#${id})`);
      }
    }
  });

  it("端末の印と凡例の字は意匠帳の見本色を変数で読み、字は台と 4.5 以上になる", () => {
    const stage = 'svg[data-cdl-stage][data-cdl-palette="terminal"]';
    const mark = readFixedThemeRoleColor("terminal", "印");
    const legendText = readFixedThemeRoleColor("terminal", "凡例の字");
    const ground = readFixedThemeRoleColor("terminal", "地");
    if (!mark || !legendText || !ground) throw new Error("端末の印・凡例の字・地を意匠帳から読めない");

    expect(cssValue(cssRuleBody(stage, "--theme-flow-mark"), "--theme-flow-mark")).toBe(mark);
    expect(cssValue(cssRuleBody(stage, "--theme-legend-text"), "--theme-legend-text")).toBe(
      legendText,
    );
    expect(
      cssValue(
        cssRuleBody(
          'svg[data-cdl-stage][data-cdl-palette="terminal"] [data-cdl-role="legend-text"]',
          "fill",
        ),
        "fill",
      ),
    ).toBe("var(--theme-legend-text)");
    const ratio = contrast(rgb(legendText), rgb(ground));
    expect(ratio).toBeCloseTo(5.955051, 6);
    expect(ratio).toBeGreaterThanOrEqual(4.5);
  });

  it("印の専用色が無い意匠は墨へ戻り、端末の凡例印も同じ変数を読む", () => {
    const fallback = "var(--theme-flow-mark, var(--d-text-primary))";
    for (const [selector, property] of [
      ['[data-cdl-role="node-body"][data-cdl-mark="start"]', "fill"],
      ['[data-cdl-role="node-body"][data-cdl-mark="end"]', "stroke"],
      ['[data-cdl-role="node-inner"]', "fill"],
      [
        'svg[data-cdl-stage][data-cdl-palette="terminal"] [data-cdl-role="legend"]',
        "--cdl-text-accent",
      ],
    ] as const) {
      expect(cssValue(cssRuleBody(selector, property), property), selector).toBe(fallback);
    }
  });
});
