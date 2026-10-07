import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const css = readFileSync(fileURLToPath(new URL("../styles/cdl-theme.css", import.meta.url)), "utf8");
const fixedPalettes =
  ':is([data-cdl-palette="blueprint"], [data-cdl-palette="letterpress"], [data-cdl-palette="catalog"], [data-cdl-palette="terminal"], [data-cdl-palette="sketch"], [data-cdl-palette="neon"], [data-cdl-palette="relief"])';
const fixedStages = `svg[data-cdl-stage]${fixedPalettes}:has([data-cdl-role="stage-column"])`;

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
