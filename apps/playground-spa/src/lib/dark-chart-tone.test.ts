import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { CdlDiagramView } from "@cardenelabs/cdl";
import type { CdlDiagram } from "@cardenelabs/cdl";
import { JSDOM } from "jsdom";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import {
  presetChartLine,
  presetChartPie,
  presetFunnel,
  presetGantt,
  presetMindMap,
  presetQuadrant,
  presetTree,
  presetUserJourney,
} from "@/topics/catalog/presets.cdl";

const theme = readFileSync(
  fileURLToPath(new URL("../styles/cdl-theme.css", import.meta.url)),
  "utf8",
);
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
  const escaped = property.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const value = new RegExp(`(?:^|;)\\s*${escaped}\\s*:\\s*([^;]+)`, "m").exec(body)?.[1]?.trim();
  if (!value) throw new Error(`${property} の CSS 宣言が無い`);
  return value;
}

function rgb(value: string): [number, number, number] {
  const matched = /^#([0-9a-f]{6})$/i.exec(value);
  if (!matched?.[1]) throw new Error(`${value} は 6 桁の色ではない`);
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

function darkColor(property: string): [number, number, number] {
  const dark = ruleBody(globals, "html.dark");
  const root = ruleBody(theme, ":root");
  let value = declaration(root, property);
  for (let depth = 0; depth < 4; depth++) {
    const reference = /^var\((--[^,)]+)(?:,[^)]+)?\)$/.exec(value)?.[1];
    if (!reference) return rgb(value);
    value = declaration(dark, reference);
  }
  throw new Error(`${property} の暗い地の色を解決できない`);
}

function drawn(diagram: CdlDiagram): Document {
  const focusPhaseId = diagram.phases?.at(-1)?.id;
  const markup = renderToStaticMarkup(
    createElement(CdlDiagramView, { diagram, focusPhaseId, hideHeader: true }),
  );
  return new JSDOM(markup).window.document;
}

function elementColor(element: Element, property: "fill" | "stroke"): [number, number, number] {
  const raw = element.getAttribute(property) ?? "";
  const variable = /^var\((--[^,)]+)(?:,[^)]+)?\)$/.exec(raw)?.[1];
  if (!variable)
    throw new Error(
      `${element.tagName}/${element.getAttribute("data-cdl-role")} の ${property} を読めない: ${raw}`,
    );
  return darkColor(variable);
}

describe("暗い地の既定の配色でガントの縞を沈める", () => {
  it("既定だけの --cdl-surface-sunken に画面の地を使い、専用の色を増やさない", () => {
    const selector = "svg[data-cdl-stage]:not([data-cdl-palette])";
    const defaultTheme = ruleBody(theme, selector);
    expect(declaration(defaultTheme, "--cdl-surface-sunken")).toBe("var(--d-bg)");

    const root = ruleBody(globals, ":root");
    const dark = ruleBody(globals, "html.dark");
    expect(declaration(root, "--d-bg")).toBe("#f6f1e6");
    expect(declaration(dark, "--d-bg")).toBe("#1a1611");
    expect(globals).not.toContain("--d-chart-surface-sunken");
    expect(theme).not.toContain("--d-chart-surface-sunken");
  });

  it("画面の外に隠れていた tone と系列色が暗い地の縞との対比 3 以上になる", () => {
    const dark = ruleBody(globals, "html.dark");
    const stripe = rgb(declaration(dark, "--d-bg"));
    const targets = [
      {
        diagram: presetChartLine,
        selector: '[data-cdl-role="chart-line"]',
        property: "stroke",
        alpha: 1,
      },
      {
        diagram: presetChartPie,
        selector: '[data-cdl-role="chart-pie-slice"]',
        property: "fill",
        alpha: 1,
      },
      {
        diagram: presetFunnel,
        selector: '[data-cdl-role="funnel-stage"]',
        property: "fill",
        alpha: 0.9,
      },
      {
        diagram: presetGantt,
        selector: '[data-cdl-role="gantt-bar"]',
        property: "fill",
        alpha: 0.9,
      },
      {
        diagram: presetUserJourney,
        selector: '[data-cdl-role="journey-line"]',
        property: "stroke",
        alpha: 1,
      },
      {
        diagram: presetQuadrant,
        selector: '[data-cdl-role="quadrant-item"]',
        property: "stroke",
        alpha: 1,
      },
      {
        diagram: presetTree,
        selector: '[data-cdl-role="tree-edge"]',
        property: "stroke",
        alpha: 0.92,
      },
      {
        diagram: presetMindMap,
        selector: '[data-cdl-role="mind-edge"]',
        property: "stroke",
        alpha: 0.92,
      },
    ] as const;

    for (const target of targets) {
      const elements = [...drawn(target.diagram).querySelectorAll(target.selector)];
      expect(elements.length, `${target.selector} が SVG に無い`).toBeGreaterThan(0);
      for (const element of elements) {
        const raw = elementColor(element, target.property);
        const visible = composite(raw, target.alpha, stripe);
        expect(
          contrast(visible, stripe),
          `${target.selector} ${target.property}=${raw.join(",")} on ${stripe.join(",")}`,
        ).toBeGreaterThanOrEqual(3);
      }
    }
  });
});
