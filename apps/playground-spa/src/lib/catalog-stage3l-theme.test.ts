import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const css = readFileSync(
  fileURLToPath(new URL("../styles/cdl-theme.css", import.meta.url)),
  "utf8",
).replace(/\/\*[\s\S]*?\*\//gu, "");

const rules = [...css.matchAll(/([^{}]*)\{([^{}]*)\}/gu)].map((match) => ({
  selector: (match[1] ?? "").replace(/\s+/gu, " ").trim(),
  body: match[2] ?? "",
}));

function findLastRule(
  predicate: (rule: { selector: string; body: string }) => boolean,
): { selector: string; body: string } | undefined {
  for (let index = rules.length - 1; index >= 0; index -= 1) {
    const rule = rules[index];
    if (rule !== undefined && predicate(rule)) return rule;
  }
  return undefined;
}

function lastRule(...parts: string[]): { selector: string; body: string } {
  const rule = findLastRule(({ selector }) => parts.every((part) => selector.includes(part)));
  if (rule === undefined) throw new Error(`CSS 規則が無い: ${parts.join(" / ")}`);
  return rule;
}

function lastRuleWithDeclaration(selectorPart: string, property: string): { selector: string; body: string } {
  const rule = findLastRule(({ selector, body }) =>
    selector.includes(selectorPart) && body.includes(`${property}:`),
  );
  if (rule === undefined) throw new Error(`${selectorPart} の ${property} を持つ CSS 規則が無い`);
  return rule;
}

function declaration(body: string, property: string): string {
  const escaped = property.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");
  const value = new RegExp(`(?:^|;)\\s*${escaped}\\s*:\\s*([^;]+)`, "mu").exec(body)?.[1]?.trim();
  if (value === undefined) throw new Error(`${property} の宣言が無い`);
  return value;
}

describe("#2854 3 段目 l の意匠補正", () => {
  it("名前の字体を意匠ごとの Noto Sans JP に保ち、値だけ同梱 mono にする", () => {
    for (const palette of ["blueprint", "letterpress", "catalog", "sketch", "neon", "relief"] as const) {
      const body = lastRuleWithDeclaration(`[data-cdl-palette="${palette}"]`, "--theme-chart-name-font").body;
      expect(declaration(body, "--theme-chart-name-font"), `${palette} の名前`).toContain("Noto Sans JP");
      expect(declaration(body, "--theme-chart-value-font"), `${palette} の値`).toBe("var(--d-mono)");
    }
    expect(
      rules.some(({ selector, body }) =>
        selector.includes(':not([data-cdl-palette="terminal"])') &&
        body.includes("--theme-chart-name-font")),
      "端末以外の名前を一括上書きしない",
    ).toBe(false);
    const numeric = lastRuleWithDeclaration('[data-cdl-role="chart-bar-tick"]', "font-family");
    expect(declaration(numeric.body, "font-family")).toBe("var(--theme-chart-value-font)");
    expect(declaration(numeric.body, "font-family")).not.toContain("!important");
  });

  it("浮彫は見出し付きの札だけを浮かせ、その札の図形へ凹み filter を足さない", () => {
    const headedSurface = lastRule(
      '[data-cdl-palette="relief"]',
      ':has([data-cdl-role="figure-head"])',
      '> [data-cdl-role="node-body"]',
    );
    expect(declaration(headedSurface.body, "filter")).toBe("url(#dragon-relief-raised) !important");
    expect(headedSurface.body).not.toMatch(/(?:^|;)\s*(?:width|height|transform)\s*:/mu);

    const headedFilters = rules.filter(({ selector, body }) =>
      selector.includes('[data-cdl-palette="relief"]') &&
      selector.includes(':has([data-cdl-role="figure-head"])') &&
      body.includes("filter:"),
    );
    expect(headedFilters, "見出し付きの札の中へ別の filter を足さない").toEqual([headedSurface]);

    // 見出しの無い図表は #2796 の well を保ち、見本帳の札だけを後段の例外で浮かせる。
    const chartContents = lastRule(
      '[data-cdl-kind^="chart-"]',
      'g[data-cdl-role="node-body"]',
      '> :is(rect, path, ellipse, circle, polygon)',
    );
    expect(declaration(chartContents.body, "filter")).toBe("url(#dragon-relief-well)");
    expect(chartContents.selector).toContain(
      ':is(rect, path, ellipse, circle, polygon)[data-cdl-role="node-body"]',
    );
    expect(chartContents.selector).toContain(':has(> circle):not(:has(> :not(circle)))');
    expect(
      rules.some(({ selector, body }) =>
        selector.includes('[data-cdl-kind^="chart-"]') &&
        selector.includes('[data-cdl-role="node-body"]') &&
        body.includes("url(#dragon-relief-raised)")),
      "見出しの無い図表を浮かせる規則を足さない",
    ).toBe(false);
    expect(css).not.toMatch(/width\s*:\s*(?:508|860|732)px/gu);
  });

  it("5 意匠の段札・時間軸札と分かれ道を active に依らない縁と影へ揃える", () => {
    const cards = [
      ["blueprint", "1px", "#143a52 !important", "none !important"],
      ["letterpress", "1.5px", "#1a1510 !important", "none !important"],
      ["sketch", "2px", "#2b2620 !important", "url(#dragon-sketch-wobble) !important"],
      ["terminal", "1px", "rgb(74 222 128 / 30%) !important", "none !important"],
    ] as const;
    for (const [palette, width, stroke, filter] of cards) {
      const card = lastRule(
        `[data-cdl-palette="${palette}"]`,
        ':has([data-cdl-role="stage-column"])',
        ':has([data-cdl-role="timeline-axis"])',
        '[data-cdl-kind="card"]',
      );
      expect(card.selector, `${palette} の札を active で絞らない`).not.toContain("data-cdl-active");
      expect(declaration(card.body, "stroke-width"), palette).toBe(`${width} !important`);
      expect(declaration(card.body, "stroke"), palette).toBe(stroke);
      expect(declaration(card.body, "filter"), palette).toBe(filter);
    }

    const catalogCard = lastRule(
      '[data-cdl-palette="catalog"]',
      ':has([data-cdl-role="stage-column"])',
      ':has([data-cdl-role="timeline-axis"])',
      '[data-cdl-kind="card"]',
    );
    expect(declaration(catalogCard.body, "stroke")).toBe("none !important");
    expect(declaration(catalogCard.body, "stroke-width")).toBe("0 !important");
    expect(declaration(catalogCard.body, "filter")).toContain("--theme-stage-card-shadow");

    for (const [palette, width] of [["blueprint", "1.5px"], ["letterpress", "2px"], ["sketch", "2.5px"], ["terminal", "1px"]] as const) {
      const decision = lastRule(`[data-cdl-palette="${palette}"]`, '[data-cdl-kind="decision"]', '> path');
      expect(declaration(decision.body, "stroke-width"), palette).toBe(`${width} !important`);
      if (palette !== "blueprint") expect(declaration(decision.body, "filter"), palette).toBe("none !important");
    }
    const catalogDecision = lastRule('[data-cdl-palette="catalog"]', '[data-cdl-kind="decision"]', '> path');
    expect(declaration(catalogDecision.body, "stroke")).toBe("none !important");
    expect(declaration(catalogDecision.body, "stroke-width")).toBe("0 !important");
    expect(declaration(catalogDecision.body, "filter")).toBe("none !important");
  });

  it("浮彫の札の題を active に依らず墨にし、折れ線の終点は系列内の順で選ぶ", () => {
    const labelRule = lastRule('[data-cdl-palette="relief"]', '[data-cdl-kind="card"]', '[data-cdl-role="node-label"]');
    expect(declaration(labelRule.body, "fill")).toBe("#463e33 !important");
    expect(labelRule.selector).not.toContain("data-cdl-active");

    const endpoint = findLastRule(({ selector, body }) =>
      selector.includes('[data-cdl-role="chart-line-value"]') &&
      selector.includes('[data-cdl-series="1"]') &&
      selector.includes(':has(~ g > [data-cdl-role="chart-line-value"][data-cdl-series="1"])') &&
      body.includes("font-size:"),
    );
    expect(endpoint).toBeDefined();
    if (endpoint === undefined) return;
    expect(endpoint.selector).not.toContain('[x="');
    expect(declaration(endpoint.body, "font-size")).toBe("22px");
    expect(declaration(endpoint.body, "font-weight")).toBe("700");
  });
});
