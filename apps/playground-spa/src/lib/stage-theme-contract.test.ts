import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { CdlDiagramView } from "@cardenelabs/cdl";
import { JSDOM } from "jsdom";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import {
  presetDeliveryFlow,
  presetDeliveryStages,
  presetDeliveryTimeline,
} from "@/topics/catalog/presets.cdl";

const css = readFileSync(fileURLToPath(new URL("../styles/cdl-theme.css", import.meta.url)), "utf8");
const fixedPalettes =
  ':is([data-cdl-palette="blueprint"], [data-cdl-palette="letterpress"], [data-cdl-palette="catalog"], [data-cdl-palette="terminal"], [data-cdl-palette="sketch"], [data-cdl-palette="neon"], [data-cdl-palette="relief"])';
const fixedPaletteNames = [
  "blueprint",
  "letterpress",
  "catalog",
  "terminal",
  "sketch",
  "neon",
  "relief",
] as const;
const fixedThemeStage = `svg[data-cdl-stage]${fixedPalettes}`;
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

function lastRuleBody(selector: string): string {
  const start = css.lastIndexOf(`${selector} {`);
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

function selectorPaletteNames(selector: string): string[] {
  return [...selector.matchAll(/\[data-cdl-palette="([^"]+)"\]/g)]
    .flatMap((match) => match[1] ? [match[1]] : []);
}

function 凡例の点線色を読む(markup: string, palette: string): string {
  const dom = new JSDOM(`<!doctype html><html><head><style>${css}</style></head><body>${markup}</body></html>`);
  const svg = dom.window.document.querySelector("svg");
  if (!svg) throw new Error("dragon の SVG が無い");
  svg.setAttribute("data-cdl-palette", palette);
  const path = svg.querySelector<SVGPathElement>('[data-cdl-legend-mark="dotted-line"] path');
  if (!path) throw new Error(`${palette} の凡例の点線が無い`);

  const computed = dom.window.getComputedStyle(path);
  const stroke = path.getAttribute("stroke")?.trim() || computed.stroke.trim();
  const variable = /^var\((--[a-z0-9-]+)/i.exec(stroke);
  if (!variable) return stroke.toLowerCase();
  let property = variable[1]!;
  const seen = new Set<string>();
  while (!seen.has(property)) {
    seen.add(property);
    const resolved = computed.getPropertyValue(property).trim();
    if (!resolved) throw new Error(`${palette} の ${property} を色へ解けない`);
    const nested = /^var\((--[a-z0-9-]+)/i.exec(resolved)?.[1];
    if (!nested) return resolved.toLowerCase();
    property = nested;
  }
  throw new Error(`${palette} の ${property} が循環している`);
}

function 見本の凡例の点線色を読む(figure: string, theme: string): string {
  const sample = readFileSync(resolve(process.cwd(), `docs/design/proposal/static/${figure}-${theme}.html`), "utf8");
  const path = new JSDOM(sample).window.document.querySelector<SVGPathElement>(
    ".legend path[stroke-dasharray]",
  );
  const stroke = path?.getAttribute("stroke");
  if (!stroke) throw new Error(`${figure}-${theme}.html の凡例の点線色が無い`);
  return stroke.toLowerCase();
}

type 札の値 = { 見本: string; dragon: string };

function 段の箱の札を読む(palette: "catalog" | "neon"): Map<string, 札の値> {
  const note = readFileSync(resolve(process.cwd(), `docs/design/${palette}/note.md`), "utf8");
  const section = /^### 段の箱の札\n([\s\S]*?)(?=^###? )/m.exec(note)?.[1];
  if (!section) throw new Error(`${palette} の「段の箱の札」が無い`);
  const rows = new Map<string, 札の値>();
  for (const line of section.split("\n")) {
    const cells = line
      .split("|")
      .slice(1, -1)
      .map((cell) => cell.trim().replaceAll("`", ""));
    if (cells.length !== 3 || cells[0] === "項目" || /^-+$/.test(cells[0] ?? "")) continue;
    const [項目, 見本, dragon] = cells;
    if (項目 && 見本 && dragon) rows.set(項目, { 見本, dragon });
  }
  return rows;
}

describe("固定の 7 意匠の段の箱を見本の線で描く (#2831)", () => {
  it("階層と工程の字の太さを 7 意匠の見本に合わせる", () => {
    const leaf = `${fixedThemeStage} [data-cdl-mind-form="outline"] [data-cdl-role="mind-leaf-title"]`;
    expect(declaration(ruleBody(leaf), "font-weight")).toBe("500 !important");

    const tree =
      'svg[data-cdl-stage]:is([data-cdl-palette="letterpress"], [data-cdl-palette="sketch"], [data-cdl-palette="neon"]) [data-cdl-role="tree-node-title"]';
    expect(declaration(ruleBody(tree), "font-weight")).toBe("800 !important");

    const gantt = `${fixedThemeStage} [data-cdl-kind="gantt-timeline"] text:not([data-cdl-role])`;
    expect(declaration(ruleBody(gantt), "font-weight")).toBe("500 !important");
  });

  it("5 段目 d で足した共通規則を固定 7 意匠だけに当てる", () => {
    const rules = [
      {
        selectorParts: ['[data-cdl-kind="chart-slope"]', '[data-cdl-role="chart-slope-period"]'],
        declarations: { "font-weight": "400 !important" },
      },
      {
        selectorParts: ['[data-cdl-role="chart-stacked-bar-period"]'],
        declarations: { "font-weight": "400 !important" },
      },
      {
        selectorParts: ['[data-cdl-kind="chart-stacked-bar"]', '[data-cdl-role="legend-text"]'],
        declarations: { fill: "var(--theme-chart-axis-color) !important" },
      },
      {
        selectorParts: ['[data-cdl-role="quadrant-canvas"]'],
        declarations: { rx: "0", ry: "0" },
      },
      {
        selectorParts: ['[data-cdl-kind="chart-pie"]', 'text:not([data-cdl-role])[font-weight="600"]'],
        declarations: { "font-weight": "700 !important" },
      },
      {
        selectorParts: ['[data-cdl-kind="gantt-timeline"]', 'text:not([data-cdl-role])'],
        declarations: { "font-weight": "500 !important" },
      },
    ];
    const cssRules = [
      ...css.replace(/\/\*[\s\S]*?\*\//g, "").matchAll(/([^{}]+)\{([^{}]*)\}/g),
    ].map((match) => ({ selector: match[1]?.trim() ?? "", body: match[2] ?? "" }));

    for (const { selectorParts, declarations } of rules) {
      const matches = cssRules.filter(({ selector, body }) =>
        selectorParts.every((part) => selector.includes(part)) &&
        Object.entries(declarations).every(([property, value]) => {
          const escaped = property.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
          return new RegExp(`(?:^|;)\\s*${escaped}\\s*:\\s*${value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*(?:;|$)`, "m").test(body);
        })
      );
      expect(matches, selectorParts.join(" ")).toHaveLength(1);
      const selector = matches[0]?.selector ?? "";
      expect(selectorPaletteNames(selector).sort(), selector).toEqual([...fixedPaletteNames].sort());
    }
  });

  it("手描きの主役でない棒の枠を見本の 2.5 にする", () => {
    const selector =
      'svg[data-cdl-stage][data-cdl-palette="sketch"] [data-cdl-role="chart-bar"]:not([data-cdl-emphasis="primary"])';
    expect(declaration(ruleBody(selector), "stroke-width")).toBe("2.5px !important");
  });

  it("電飾の桃 35%・白 65% の枠を計算値 #ffb6db にする", () => {
    const note = readFileSync(resolve(process.cwd(), "docs/design/neon/note.md"), "utf8");
    expect(note).not.toContain("#ffb5db");
    expect(css).not.toContain("#ffb5db");

    const selector =
      'svg[data-cdl-stage][data-cdl-palette="neon"] [data-cdl-kind="chart-bar"] [data-cdl-role="chart-bar"][data-cdl-emphasis="primary"]';
    expect(declaration(ruleBody(selector), "stroke")).toBe("#ffb6db");
  });

  it.each([
    ["段箱", presetDeliveryStages],
    ["時間軸", presetDeliveryTimeline],
    ["流れ", presetDeliveryFlow],
  ] as const)("%s の凡例の点線は 7 意匠とも見本の計算後の色になる", (figure, diagram) => {
    const markup = renderToStaticMarkup(createElement(CdlDiagramView, { diagram }));
    for (const { palette, theme } of [
      { palette: "blueprint", theme: "図面" },
      { palette: "letterpress", theme: "活版" },
      { palette: "catalog", theme: "図録" },
      { palette: "terminal", theme: "端末" },
      { palette: "sketch", theme: "手描き" },
      { palette: "neon", theme: "電飾" },
      { palette: "relief", theme: "浮彫" },
    ] as const) {
      expect(凡例の点線色を読む(markup, palette), `${figure} / ${theme}`).toBe(
        見本の凡例の点線色を読む(figure, theme),
      );
    }
  });

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
    // 浮彫の段の箱の戻り線は見本の黄土。実装も専用値へ戻したため、旧 --er-own は使わない。
    expect(declaration(dotted, "--cdl-text-accent")).toBe("#c99a35");

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

  it.each([
    {
      palette: "catalog" as const,
      expected: {
        面: { 見本: "#fbf7ee", dragon: "#fbf7ee" },
        枠: { 見本: "none", dragon: "none" },
        太さ: { 見本: "0", dragon: "0" },
        影: {
          見本: "0 8px 18px -6px rgba(0,0,0,.34)",
          dragon: "drop-shadow(0 8px 6px rgb(0 0 0 / 34%))",
        },
      },
    },
    {
      palette: "neon" as const,
      expected: {
        面: { 見本: "rgba(10,8,18,.94)", dragon: "rgb(10 8 18 / 94%)" },
        枠: {
          見本: "color-mix(in srgb, #b26bff 35%, white)",
          dragon: "#e4cbff",
        },
        太さ: { 見本: "2px", dragon: "2" },
        影: {
          見本: "0 0 2px 1px #b26bff, 0 0 10px 2px color-mix(in srgb, #b26bff 60%, transparent), inset 0 0 12px 1px color-mix(in srgb, #b26bff 32%, transparent)",
          dragon:
            "drop-shadow(0 0 2px #b26bff) drop-shadow(0 0 10px color-mix(in srgb, #b26bff 60%, transparent))",
        },
      },
    },
  ])("$palette の光っていない札を見本の面・枠・太さ・影へ揃える", ({ palette, expected }) => {
    expect(Object.fromEntries(段の箱の札を読む(palette))).toEqual(expected);
    const paletteBody = lastRuleBody(`svg[data-cdl-stage][data-cdl-palette="${palette}"]`);
    expect(declaration(paletteBody, "--theme-stage-card-face")).toBe(expected.面.dragon);
    if (palette === "neon") {
      expect(declaration(paletteBody, "--theme-stage-card-frame")).toBe(expected.枠.dragon);
    }
    expect(declaration(paletteBody, "--theme-stage-card-frame-width")).toBe(expected.太さ.dragon);
    expect(declaration(paletteBody, "--theme-stage-card-shadow").replace(/\s+/g, " ")).toBe(
      expected.影.dragon,
    );

    const bodySelector =
      palette === "catalog"
        ? '[data-cdl-role="node-body"]:not([data-cdl-look]):not([data-cdl-mark])'
        : '[data-cdl-role="node-body"]';
    // 電飾だけは再生中の最後の段も紫の札なので、active を検査範囲から外さない。
    const activeScope = palette === "neon" ? "" : ':not([data-cdl-active="true"])';
    const selector = `svg[data-cdl-stage][data-cdl-palette="${palette}"]:has([data-cdl-role="stage-column"])
  [data-cdl-kind="card"]${activeScope}
  ${bodySelector}`;
    const normal = ruleBody(selector);
    expect(declaration(normal, "fill")).toBe("var(--theme-stage-card-face) !important");
    expect(declaration(normal, "stroke")).toBe("var(--theme-stage-card-frame) !important");
    expect(declaration(normal, "stroke-width")).toBe(
      "var(--theme-stage-card-frame-width) !important",
    );
    expect(declaration(normal, "filter")).toBe("var(--theme-stage-card-shadow) !important");
  });

  it("浮彫の最後の段では在宅? を含む全ての活動中の札の題を題色にする", () => {
    const phase = presetDeliveryStages.phases?.at(-1)?.id;
    const markup = renderToStaticMarkup(
      createElement(CdlDiagramView, { diagram: presetDeliveryStages, focusPhaseId: phase }),
    );
    const 自前の文書 = new JSDOM(markup).window.document;
    const label = [...自前の文書.querySelectorAll('[data-cdl-role="node-label"]')].find(
      (element) => element.textContent === "在宅?",
    );
    expect(
      label?.closest('[data-cdl-active="true"]'),
      "在宅? が活動中になっていない",
    ).not.toBeNull();

    const selector =
      'svg[data-cdl-stage][data-cdl-palette="relief"] [data-cdl-active="true"] [data-cdl-role="node-label"]';
    expect(declaration(ruleBody(selector), "fill")).toBe("var(--theme-title) !important");
  });

  it("浮彫の段の箱の縦線・横線・三角の矢じりは同じ朱と同じ影の有無で描く", () => {
    const palette = ruleBody('svg[data-cdl-stage][data-cdl-palette="relief"]');
    expect(declaration(palette, "--er-line")).toBe("#c4573c");
    expect(declaration(palette, "--theme-lead")).toBe("#c4573c");
    expect(
      declaration(ruleBody("svg[data-cdl-stage][data-cdl-palette]"), "--dragon-edge-tone"),
    ).toBe("var(--er-line)");
    const line = ruleBody('[data-cdl-role="edge-line"]');
    expect(declaration(line, "stroke")).toBe(
      "var(--dragon-edge-tone, var(--d-text-secondary)) !important",
    );
    expect(line).not.toMatch(/(?:^|;)\s*(?:opacity|filter)\s*:/m);

    const arrow = ruleBody('[data-cdl-role="edge-arrowhead"]');
    expect(arrow).toContain("fill: context-stroke !important");
    expect(arrow).not.toMatch(/(?:^|;)\s*(?:opacity|filter)\s*:/m);

    const phase = presetDeliveryStages.phases?.at(-1)?.id;
    const markup = renderToStaticMarkup(
      createElement(CdlDiagramView, { diagram: presetDeliveryStages, focusPhaseId: phase }),
    );
    const 自前の文書 = new JSDOM(markup).window.document;
    const mainLines = [
      ...自前の文書.querySelectorAll<SVGPathElement>(
        '[data-cdl-edge-role="main"] [data-cdl-role="edge-line"]',
      ),
    ];
    const 座標 = (path: SVGPathElement): number[] =>
      [...(path.getAttribute("d") ?? "").matchAll(/-?\d+(?:\.\d+)?/g)].map((part) => Number(part[0]));
    const horizontal = mainLines.find((path) => {
      const [, y1, , y2] = 座標(path);
      return y1 === y2;
    });
    const vertical = mainLines.find((path) => {
      const [x1, , x2] = 座標(path);
      return x1 === x2;
    });
    for (const [向き, path] of [
      ["横", horizontal],
      ["縦", vertical],
    ] as const) {
      expect(path, `${向き}の主役線が無い`).toBeDefined();
      expect(path?.getAttribute("stroke")).toBe("var(--cdl-now, #c0421f)");
      expect(path?.getAttribute("stroke-opacity")).toBe("0.95");
      expect(path?.getAttribute("filter")).toBeNull();
    }

    const marker = 自前の文書.querySelector<SVGPathElement>(
      '[id="cdl-arrow-accent"] [data-cdl-role="edge-arrowhead"]',
    );
    expect(marker?.getAttribute("opacity"), "矢じりの不透明度は初期値 1").toBeNull();
    expect(marker?.getAttribute("filter")).toBeNull();
  });
});
