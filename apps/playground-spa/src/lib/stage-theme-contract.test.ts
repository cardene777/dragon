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
const fixedPaletteNames = [
  "blueprint",
  "letterpress",
  "catalog",
  "terminal",
  "sketch",
  "neon",
  "relief",
] as const;
const fixedThemeCommonStage = `svg[data-cdl-stage][data-cdl-palette]:not(
    :where([data-cdl-palette="site-colours"], [data-cdl-palette="kinari"], [data-cdl-palette="celadon"])
  )`;
const colorOnlyPaletteNames = ["site-colours", "kinari", "celadon"] as const;
const legendColors = [
  {
    palette: "blueprint",
    mark: "var(--er-ink)",
    dotted: "var(--er-own)",
    text: "#4d7187",
  },
  {
    palette: "letterpress",
    mark: "var(--er-ink)",
    dotted: "var(--er-own)",
    text: "var(--er-type)",
  },
  {
    palette: "catalog",
    mark: "var(--theme-ground-ink)",
    dotted: "var(--er-own)",
    text: "var(--theme-ground-type)",
  },
  {
    palette: "terminal",
    mark: "var(--theme-flow-mark)",
    dotted: "var(--er-own)",
    text: "var(--theme-legend-text)",
  },
  {
    palette: "sketch",
    mark: "var(--er-ink)",
    dotted: "var(--er-own)",
    text: "var(--er-type)",
  },
  {
    palette: "neon",
    mark: "var(--er-ink)",
    dotted: "var(--er-own)",
    text: "var(--er-type)",
  },
  {
    palette: "relief",
    mark: "var(--er-ink)",
    dotted: "#c99a35",
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

function ruleBodyContaining(fragments: string[]): string {
  const bodies = [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)].flatMap((match) => {
    const selector = (match[1] ?? "").replace(/\s+/g, " ");
    const body = match[2] ?? "";
    const rule = `${selector} ${body}`;
    return fragments.every((fragment) => rule.includes(fragment)) ? [body] : [];
  });
  if (bodies.length !== 1) {
    throw new Error(`${fragments.join(" + ")} を持つ CSS 規則が ${bodies.length} 件ある`);
  }
  return bodies[0]!;
}

function declaration(body: string, property: string): string {
  const escaped = property.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const value = new RegExp(`(?:^|;)\\s*${escaped}\\s*:\\s*([^;]+)`, "m").exec(body)?.[1]?.trim();
  if (!value) throw new Error(`${property} の CSS 宣言が無い`);
  return value;
}

function themeTable(palette: typeof fixedPaletteNames[number]): Map<string, string> {
  const selector = `svg[data-cdl-stage][data-cdl-palette="${palette}"]`;
  const values = new Map<string, string>();
  const source = css.replace(/\/\*[\s\S]*?\*\//g, "");
  for (const match of source.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    if ((match[1] ?? "").trim() !== selector) continue;
    for (const entry of (match[2] ?? "").matchAll(/(--[a-z0-9-]+)\s*:\s*([^;]+);/gi)) {
      values.set(entry[1]!, entry[2]!.trim());
    }
  }
  return values;
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
    const leaf = `${fixedThemeCommonStage} [data-cdl-mind-form="outline"] [data-cdl-role="mind-leaf-title"]`;
    expect(declaration(ruleBody(leaf), "font-weight")).toBe("500 !important");

    const tree =
      'svg[data-cdl-stage]:is([data-cdl-palette="letterpress"], [data-cdl-palette="sketch"], [data-cdl-palette="neon"])\n' +
      '  [data-cdl-node="営業所の階層-chart"]\n' +
      '  [data-cdl-role="tree-node-title"]';
    expect(declaration(ruleBody(tree), "font-weight")).toBe("800 !important");

    const gantt = `${fixedThemeCommonStage} [data-cdl-kind="gantt-timeline"] text:not([data-cdl-role])`;
    expect(declaration(ruleBody(gantt), "font-weight")).toBe("700 !important");
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
        declarations: { fill: "var(--dragon-chart-axis-text) !important" },
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
        declarations: { "font-weight": "700 !important" },
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
      expect(selector).toContain("[data-cdl-palette]:not(");
      expect(selectorPaletteNames(selector).sort(), selector).toEqual(
        [...colorOnlyPaletteNames].sort(),
      );
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
    expect(declaration(ruleBody('[data-cdl-role="edge-line"]'), "stroke-width")).toBe(
      "var(--dragon-theme-line-width, 7) !important",
    );
    for (const palette of fixedPaletteNames) {
      const table = themeTable(palette);
      expect(table.get("--dragon-theme-line-width"), palette).toBe("7");
      expect(table.get("--dragon-stage-edge-width"), palette).toBe("5");
    }
  });

  it.each([
    ["blueprint", "12px", "1", "2.25", "1"],
    ["letterpress", "12px", "1.5", "3", "2.5"],
    ["catalog", "12px", "1", "2", "1"],
    ["terminal", "6px", "1", "1.5", "1"],
    ["sketch", "16px", "2", "3", "1"],
    ["neon", "16px", "2", "3", "1"],
    ["relief", "22px", "0", "0", "1"],
  ] as const)(
    "%s の角・箱の枠・強調中の枠・項目の区切り線の太さを表に持つ",
    (palette, radius, frame, selectedFrame, divider) => {
      const body = ruleBody(`svg[data-cdl-stage][data-cdl-palette="${palette}"]`);
      expect(declaration(body, "--dragon-theme-box-radius")).toBe(radius);
      expect(declaration(body, "--dragon-theme-box-frame-width")).toBe(frame);
      expect(declaration(body, "--dragon-theme-selected-box-frame-width")).toBe(selectedFrame);
      expect(declaration(body, "--dragon-theme-row-divider-width")).toBe(divider);
    },
  );

  it.each([
    ["blueprint", "12px", "8px", "#e3e9ea", "#143a52", "1", "#143a52", "1", "#3f6479", "#143a52", "#3f6479", "none", "none"],
    ["letterpress", "12px", "8px", "#f0eadc", "#1a1510", "1.5", "#1a1510", "2.5", "#6b6253", "#1a1510", "#6b6253", "drop-shadow(2px 2px 0 color-mix(in srgb, var(--er-ink) 14%, transparent))", "none"],
    ["catalog", "12px", "8px", "#f4eee2", "none", "1.5", "#e2d9c7", "1", "#6f6757", "#1d242e", "#6f6757", "drop-shadow(0 3px 2px rgb(0 0 0 / 28%)) drop-shadow(0 12px 16px rgb(0 0 0 / 45%))", "none"],
    ["terminal", "6px", "5px", "#0a150e", "#287544", "1", "#143520", "1", "#8a9b90", "#9ef0b4", "#8a9b90", "none", "drop-shadow(0 0 10px color-mix(in srgb, var(--theme-lead) 35%, transparent))"],
    ["sketch", "12px", "12px", "#fffdf7", "#2b2620", "2", "#2b2620", "2", "#6d6456", "#2b2620", "#6d6456", "drop-shadow(3px 4px 0 color-mix(in srgb, var(--er-ink) 16%, transparent))", "none"],
    ["neon", "16px", "16px", "rgb(10 8 18 / 94%)", "#ffb6db", "2", "#58143d", "1", "#c4bce0", "#ffffff", "#c4bce0", "url(#dragon-neon-pink-frame)", "none"],
    ["relief", "22px", "14px", "#e8e3da", "none", "1.5", "none", "1", "#685e51", "#463e33", "#685e51", "url(#dragon-relief-raised)", "none"],
  ] as const)(
    "%s の段階列・見出し・担当の値を表に持つ",
    (palette, columnRadius, cardRadius, face, frame, frameWidth, divider, dividerWidth, number, name, note, shadow, nameGlow) => {
      const table = themeTable(palette);
      expect(table.get("--theme-stage-column-radius")).toBe(columnRadius);
      expect(table.get("--theme-stage-card-radius")).toBe(cardRadius);
      expect(table.get("--theme-stage-face")).toBe(face);
      expect(table.get("--theme-stage-frame")).toBe(frame);
      expect(table.get("--theme-stage-frame-width")).toBe(frameWidth);
      expect(table.get("--theme-stage-divider")).toBe(divider);
      expect(table.get("--theme-stage-divider-width")).toBe(dividerWidth);
      expect(table.get("--theme-stage-number")).toBe(number);
      expect(table.get("--theme-stage-name")).toBe(name);
      expect(table.get("--theme-stage-note")).toBe(note);
      expect(table.get("--theme-stage-shadow")).toBe(shadow);
      expect(table.get("--theme-stage-name-glow")).toBe(nameGlow);
    },
  );

  it("戻る点線を太さ 6 の丸い点へ替える", () => {
    for (const palette of fixedPaletteNames) {
      const table = themeTable(palette);
      expect(table.get("--dragon-stage-return-width"), palette).toBe("6");
      expect(table.get("--dragon-stage-return-dash"), palette).toBe("0 9.6");
      expect(table.get("--dragon-stage-return-cap"), palette).toBe("round");
    }
  });

  it.each([
    ["blueprint", "var(--er-link)", "var(--er-own)", "var(--er-stripe)", "var(--er-stripe)", "none", "none", "9px", "0"],
    ["letterpress", "var(--er-link)", "var(--er-own)", "var(--er-ground)", "var(--er-ground)", "none", "none", "9px", "0"],
    ["catalog", "var(--er-link)", "var(--er-own)", "var(--er-ground)", "var(--er-ground)", "none", "none", "9px", "0"],
    ["terminal", "var(--er-link)", "var(--er-own)", "var(--er-ground)", "var(--er-ground)", "none", "none", "4px", "0"],
    ["sketch", "var(--er-link)", "var(--er-own)", "var(--er-face)", "var(--er-face)", "none", "none", "9px", "0"],
    ["neon", "var(--er-ground)", "var(--er-ground)", "var(--er-link)", "var(--er-own)", "var(--er-link)", "var(--er-own)", "9px", "2.5px"],
    ["relief", "var(--er-link)", "#c99a35", "#ffffff", "#383838", "none", "none", "20px", "0"],
  ] as const)(
    "%s の線札の値を表に持つ",
    (palette, successFill, errorFill, successText, errorText, successFrame, errorFrame, radius, frameWidth) => {
      const table = themeTable(palette);
      expect(table.get("--theme-stage-label-success-fill")).toBe(successFill);
      expect(table.get("--theme-stage-label-error-fill")).toBe(errorFill);
      expect(table.get("--theme-stage-label-success-text")).toBe(successText);
      expect(table.get("--theme-stage-label-error-text")).toBe(errorText);
      expect(table.get("--theme-stage-label-success-frame")).toBe(successFrame);
      expect(table.get("--theme-stage-label-error-frame")).toBe(errorFrame);
      expect(table.get("--theme-stage-label-radius")).toBe(radius);
      expect(table.get("--theme-stage-label-frame-width")).toBe(frameWidth);
      expect(table.get("--theme-stage-label-font-weight")).toBe("700");
    },
  );

  it("段の箱の凡例だけ、角丸枠を塗らず曲線を太さ 3 にする", () => {
    for (const palette of fixedPaletteNames) {
      const table = themeTable(palette);
      expect(table.get("--dragon-stage-legend-label-fill"), palette).toBe("none");
      expect(table.get("--dragon-stage-legend-curve-width"), palette).toBe("3");
    }
  });

  it.each(legendColors)(
    "$palette の凡例を印 $mark・点線 $dotted・字 $text で描く",
    ({ palette, mark, dotted, text }) => {
      const table = themeTable(palette);
      expect(table.get("--dragon-stage-legend-mark")).toBe(mark);
      expect(table.get("--dragon-stage-return-legend")).toBe(dotted);
      expect(table.get("--dragon-stage-legend-text")).toBe(text);
    },
  );

  it("凡例の枠と曲線は印色を、点線は戻り線色を読む", () => {
    for (const palette of fixedPaletteNames) {
      const table = themeTable(palette);
      expect(table.has("--dragon-stage-legend-mark"), palette).toBe(true);
      expect(table.has("--dragon-stage-return-legend"), palette).toBe(true);
      expect(table.has("--dragon-stage-legend-text"), palette).toBe(true);
    }
    expect(themeTable("relief").get("--dragon-stage-return-legend")).toBe("#c99a35");
  });

  it("14 の枠の三角を横 17・縦 19 にする", () => {
    const body = ruleBodyContaining([
      '[data-cdl-role="stage-column"]',
      '[data-cdl-role="edge-arrowhead"]',
      "transform: scale(1.2142857143, 1.3571428571)",
    ]);
    const transform = declaration(body, "transform");
    const scale = /^scale\(([^,]+),\s*([^)]+)\)$/.exec(transform);
    expect(scale, "三角の横と縦の倍率").not.toBeNull();
    expect(14 * Number(scale?.[1])).toBeCloseTo(17, 8);
    expect(14 * Number(scale?.[2])).toBeCloseTo(19, 8);
    expect(declaration(body, "transform-origin")).toBe("9px 5px");
  });

  it("手描きの段の札は見本どおり揺れと影を外し、滑らかな 2px 枠を戻す", () => {
    const body = ruleBody(
      'svg[data-cdl-stage][data-cdl-palette="sketch"]:has([data-cdl-role="stage-column"]) [data-cdl-kind="card"] [data-cdl-role="node-body"]',
    );
    expect(declaration(body, "filter")).toBe("none !important");
    expect(declaration(body, "fill")).toBe("var(--theme-stage-face) !important");
    expect(declaration(body, "stroke")).toBe("var(--theme-stage-frame) !important");
    expect(declaration(body, "stroke-width")).toBe("var(--theme-stage-frame-width) !important");
    expect(declaration(body, "rx")).toBe("var(--dragon-stage-detail-card-radius) !important");
    expect(declaration(body, "ry")).toBe("var(--dragon-stage-detail-card-radius) !important");
    const table = themeTable("sketch");
    expect(table.get("--theme-stage-face")).toBe("#fffdf7");
    expect(table.get("--theme-stage-frame")).toBe("#2b2620");
    expect(table.get("--theme-stage-frame-width")).toBe("2");
    expect(table.get("--dragon-stage-detail-card-radius")).toBe("13px");
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
          dragon: "url(#dragon-neon-violet-frame)",
        },
      },
    },
  ])("$palette の光っていない札を見本の面・枠・太さ・影へ揃える", ({ palette, expected }) => {
    expect(Object.fromEntries(段の箱の札を読む(palette))).toEqual(expected);
    const table = themeTable(palette);
    expect(table.get("--theme-stage-card-face")).toBe(expected.面.dragon);
    if (palette === "neon") {
      expect(table.get("--theme-stage-card-frame")).toBe(expected.枠.dragon);
      expect(table.get("--theme-stage-card-radius")).toBe("16px");
    }
    expect(table.get("--theme-stage-card-frame-width")).toBe(expected.太さ.dragon);
    expect(table.get("--theme-stage-card-shadow")?.replace(/\s+/g, " ")).toBe(
      expected.影.dragon,
    );
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
    expect(declaration(palette, "--dragon-theme-line")).toBe("var(--er-line)");
    expect(declaration(
      ruleBodyContaining([
        'svg[data-cdl-stage][data-cdl-palette]:not(',
        "--dragon-edge-tone: var(--dragon-theme-line)",
      ]),
      "--dragon-edge-tone",
    )).toBe("var(--dragon-theme-line)");
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
