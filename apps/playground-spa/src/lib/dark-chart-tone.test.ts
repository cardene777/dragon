import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const globals = readFileSync(
  fileURLToPath(new URL("../styles/globals.css", import.meta.url)),
  "utf8",
);

function ruleBody(source: string, selector: string): string {
  const start = source.indexOf(`${selector} {`);
  if (start < 0) throw new Error(`${selector} の CSS 規則が無い`);
  const bodyStart = source.indexOf("{", start) + 1;
  const end = source.indexOf("}", bodyStart);
  return source.slice(bodyStart, end);
}

function declaration(body: string, property: string): string {
  const escaped = property.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");
  const value = new RegExp(`(?:^|;)\\s*${escaped}\\s*:\\s*([^;]+)`, "mu").exec(body)?.[1]?.trim();
  if (value === undefined) throw new Error(`${property} の CSS 宣言が無い`);
  return value;
}

function rgb(value: string): [number, number, number] {
  const matched = /^#([0-9a-f]{6})$/iu.exec(value);
  if (matched?.[1] === undefined) throw new Error(`${value} は 6 桁の色ではない`);
  const number = Number.parseInt(matched[1], 16);
  return [(number >> 16) & 255, (number >> 8) & 255, number & 255];
}

function composite(
  top: [number, number, number],
  alpha: number,
  bottom: [number, number, number],
): [number, number, number] {
  return top.map((value, index) =>
    Math.round(value * alpha + (bottom[index] ?? 0) * (1 - alpha)),
  ) as [number, number, number];
}

function contrast(left: [number, number, number], right: [number, number, number]): number {
  const linear = (value: number): number => {
    const channel = value / 255;
    return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  };
  const luminance = ([red, green, blue]: [number, number, number]): number =>
    0.2126 * linear(red) + 0.7152 * linear(green) + 0.0722 * linear(blue);
  const a = luminance(left);
  const b = luminance(right);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

describe("暗い地の既定の配色でガントの縞を沈める", () => {
  it("画面の地と強調面から作る縞は落ちた実測の帯色と対比 3 以上", () => {
    const root = ruleBody(globals, ":root");
    const dark = ruleBody(globals, "html.dark");
    expect(declaration(root, "--d-bg")).toBe("#f6f1e6");
    expect(declaration(dark, "--d-bg")).toBe("#1a1611");
    expect(globals).not.toContain("--d-chart-surface-sunken");

    const stripe = composite(
      rgb(declaration(dark, "--d-bg")),
      0.55,
      rgb(declaration(dark, "--d-accent-face")),
    );
    expect(contrast([130, 169, 171], stripe)).toBeGreaterThanOrEqual(3);
  });
});
