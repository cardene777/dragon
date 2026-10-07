import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const css = readFileSync(fileURLToPath(new URL("../styles/cdl-theme.css", import.meta.url)), "utf8");
const fixedPalettes =
  ':is([data-cdl-palette="blueprint"], [data-cdl-palette="letterpress"], [data-cdl-palette="catalog"], [data-cdl-palette="terminal"], [data-cdl-palette="sketch"], [data-cdl-palette="neon"], [data-cdl-palette="relief"])';
const fixedStages = `svg[data-cdl-stage]${fixedPalettes}:has([data-cdl-role="stage-column"])`;
const legendColors = [
  {
    palette: "blueprint",
    markProperty: "--er-ink",
    mark: "#143a52",
    dotted: "#a8431f",
    text: "#4d7187",
  },
  {
    palette: "letterpress",
    markProperty: "--er-ink",
    mark: "#1a1510",
    dotted: "#1a1510",
    text: "#6b6253",
  },
  {
    palette: "catalog",
    markProperty: "--theme-ground-ink",
    mark: "#efe7d8",
    dotted: "#e8705a",
    text: "#a39a87",
  },
  {
    palette: "terminal",
    markProperty: "--theme-flow-mark",
    mark: "#a6f0bd",
    dotted: "#f5c451",
    text: "#7f9186",
  },
  {
    palette: "sketch",
    markProperty: "--er-ink",
    mark: "#2b2620",
    dotted: "#2a5ca8",
    text: "#6d6456",
  },
  {
    palette: "neon",
    markProperty: "--er-ink",
    mark: "#f3eefe",
    dotted: "#ffd000",
    text: "#c4bce0",
  },
  {
    palette: "relief",
    markProperty: "--er-ink",
    mark: "#463e33",
    dotted: "#966c22",
    text: "#7a7062",
  },
] as const;

function ruleBody(selector: string): string {
  const start = css.indexOf(`${selector} {`);
  if (start < 0) throw new Error(`${selector} の CSS 規則が無い`);
  const bodyStart = css.indexOf("{", start) + 1;
  const end = css.indexOf("}", bodyStart);
  if (end < 0) throw new Error(`${selector} の CSS 規則が閉じていない`);
  return css.slice(bodyStart, end);
}

function declaration(body: string, property: string): string {
  const escaped = property.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const value = new RegExp(`(?:^|;)\\s*${escaped}\\s*:\\s*([^;]+)`, "m").exec(body)?.[1]?.trim();
  if (!value) throw new Error(`${property} の CSS 宣言が無い`);
  return value;
}

describe("固定の 7 意匠の段の箱を見本の線で描く (#2831)", () => {
  it("全図共通の太さ 7 を残し、段の箱の主役・枝・強調中・済んだ線を 5 にする", () => {
    expect(declaration(ruleBody('[data-cdl-role="edge-line"]'), "stroke-width")).toBe("7 !important");

    const selector = `${fixedStages} [data-cdl-role="edge-line"]`;
    expect(declaration(ruleBody(selector), "stroke-width")).toBe("5 !important");
    expect(css.indexOf(`${selector} {`)).toBeGreaterThan(
      css.indexOf('[data-cdl-edge][data-cdl-edge-role="main"] [data-cdl-role="edge-line"]'),
    );
    expect(selector).not.toContain("data-cdl-active");
    expect(selector).not.toContain("stroke-dasharray");
  });

  it("戻る点線を太さ 6 の丸い点へ替える", () => {
    const body = ruleBody(
      `${fixedStages} [data-cdl-role="edge-line"][stroke-dasharray="10 8"]`,
    );
    expect(declaration(body, "stroke-width")).toBe("6 !important");
    expect(declaration(body, "stroke-dasharray")).toBe("0 9.6 !important");
    expect(declaration(body, "stroke-linecap")).toBe("round !important");
  });

  it("段の箱の凡例だけ、角丸枠を塗らず曲線を太さ 3 にする", () => {
    const rounded = ruleBody(`${fixedStages} [data-cdl-legend-mark="rounded-label"] > rect`);
    expect(declaration(rounded, "fill")).toBe("none");

    const curved = ruleBody(`${fixedStages} [data-cdl-legend-mark="curved-line"] > path`);
    expect(declaration(curved, "stroke-width")).toBe("3");
  });

  it.each(legendColors)(
    "$palette の凡例を印 $mark・点線 $dotted・字 $text で描く",
    ({ palette, markProperty, mark, dotted, text }) => {
      const paletteBody = ruleBody(`svg[data-cdl-stage][data-cdl-palette="${palette}"]`);
      expect(declaration(paletteBody, markProperty)).toBe(mark);
      expect(declaration(paletteBody, "--er-own")).toBe(dotted);
      const errorProperty = /^var\((--[^)]+)\)$/.exec(declaration(paletteBody, "--d-err"))?.[1];
      expect(errorProperty, "戻り線が読む色の変数").toBeDefined();
      if (!errorProperty) return;
      expect(declaration(paletteBody, errorProperty)).toBe(dotted);

      if (palette === "blueprint" || palette === "relief") {
        const selector = `svg[data-cdl-stage]:is([data-cdl-palette="${palette}"]):has([data-cdl-role="stage-column"]) [data-cdl-role="legend-text"]`;
        expect(declaration(ruleBody(selector), "fill")).toBe(text);
        return;
      }
      const textProperty =
        palette === "catalog"
          ? "--theme-ground-type"
          : palette === "terminal"
            ? "--theme-legend-text"
            : "--er-type";
      expect(declaration(paletteBody, textProperty)).toBe(text);
    },
  );

  it("凡例の枠と曲線は印色を、点線は戻り線色を読む", () => {
    const palette = ruleBody('svg[data-cdl-stage][data-cdl-palette]');
    expect(declaration(palette, "--d-text-primary")).toBe("var(--er-ink)");
    expect(declaration(palette, "--cdl-text-mute")).toBe("var(--er-type)");

    const legend = ruleBody(
      'svg[data-cdl-stage][data-cdl-palette="relief"] [data-cdl-role="legend"]',
    );
    expect(declaration(legend, "--cdl-text-accent")).toBe(
      "var(--theme-flow-mark, var(--d-text-primary))",
    );
    const dotted = ruleBody(
      'svg[data-cdl-stage][data-cdl-palette="relief"] [data-cdl-legend-mark="dotted-line"]',
    );
    expect(declaration(dotted, "--cdl-text-accent")).toBe("var(--er-own)");

    expect(
      declaration(
        ruleBody('svg[data-cdl-stage][data-cdl-palette="catalog"] [data-cdl-role="legend-text"]'),
        "fill",
      ),
    ).toBe("var(--theme-ground-type)");
    expect(
      declaration(
        ruleBody('svg[data-cdl-stage][data-cdl-palette="terminal"] [data-cdl-role="legend-text"]'),
        "fill",
      ),
    ).toBe("var(--theme-legend-text)");
  });

  it("14 の枠の三角を横 17・縦 19 にする", () => {
    const body = ruleBody(
      `${fixedStages} [data-cdl-role="edge-arrowhead"]:is([data-cdl-edge-head="triangle"], :not([data-cdl-edge-head]))`,
    );
    const transform = declaration(body, "transform");
    const scale = /^scale\(([^,]+),\s*([^)]+)\)$/.exec(transform);
    expect(scale, "三角の横と縦の倍率").not.toBeNull();
    expect(14 * Number(scale?.[1])).toBeCloseTo(17, 8);
    expect(14 * Number(scale?.[2])).toBeCloseTo(19, 8);
    expect(declaration(body, "transform-origin")).toBe("9px 5px");
  });

  it("手描きの段の札は揺れを残して影を外す", () => {
    const body = ruleBody(
      'svg[data-cdl-stage][data-cdl-palette="sketch"]:has([data-cdl-role="stage-column"]) [data-cdl-kind="card"] [data-cdl-role="node-body"]',
    );
    expect(declaration(body, "filter")).toBe("url(#dragon-sketch-wobble) !important");
    expect(body).not.toContain("drop-shadow");
  });
});
