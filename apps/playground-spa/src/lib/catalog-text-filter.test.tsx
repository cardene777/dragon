import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { CdlDiagramView, type CdlDiagram } from "@cardenelabs/cdl";
import { JSDOM } from "jsdom";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import * as Charts from "@/topics/catalog/charts.cdl";
import * as Presets from "@/topics/catalog/presets.cdl";

import { 図の配色を変える } from "./palette-switch";

const css = readFileSync(
  fileURLToPath(new URL("../styles/cdl-theme.css", import.meta.url)),
  "utf8",
);
const svgDefs = readFileSync(
  fileURLToPath(new URL("../components/SvgDefs.tsx", import.meta.url)),
  "utf8",
);

const diagrams = {
  棒: Charts.branchParcelsBar,
  ガント: Charts.sortingShelfGantt,
  内訳の帯: Charts.deliveryResultStacked,
  円: Charts.parcelStatusPie,
  半円: Charts.onTimeShareGauge,
  四象限: Charts.measureEffortQuadrant,
  傾き: Charts.onTimeRateSlope,
  折れ線: Charts.monthlyDeliveriesLine,
  升目: Charts.parcelSizeWaffle,
  時間軸: Presets.presetDeliveryTimeline,
  段の箱: Presets.presetDeliveryStages,
  気持ちの道のり: Charts.shipperFeelingJourney,
  漏斗: Charts.orderToDeliveryFunnel,
  路線図: Presets.presetDeliveryMetro,
} as const satisfies Record<string, CdlDiagram>;

type Palette = "relief" | "neon" | "terminal";
type Case = {
  palette: Palette;
  diagram: keyof typeof diagrams;
  direction: "外す" | "足す";
  selector: string;
  count: number;
  text?: string;
};

const role = (name: string): string =>
  `text[data-cdl-role="${name}"], [data-cdl-role="${name}"] text`;

const cases: readonly Case[] = [
  { palette: "neon", diagram: "ガント", direction: "外す", selector: role("figure-footer-label"), count: 1 },
  { palette: "neon", diagram: "ガント", direction: "外す", selector: role("figure-footer-note"), count: 1 },
  { palette: "neon", diagram: "内訳の帯", direction: "外す", selector: role("chart-stacked-bar-rate"), count: 1, text: "17%" },
  { palette: "neon", diagram: "時間軸", direction: "足す", selector: role("edge-label"), count: 3 },
  { palette: "neon", diagram: "時間軸", direction: "足す", selector: "[data-cdl-node]:has([data-cdl-mark=\"timeline-number\"]) [data-cdl-role=\"node-label\"]", count: 6 },
  { palette: "neon", diagram: "段の箱", direction: "足す", selector: role("edge-label"), count: 3 },
  { palette: "neon", diagram: "気持ちの道のり", direction: "外す", selector: role("figure-footer-label"), count: 1 },
  { palette: "neon", diagram: "気持ちの道のり", direction: "外す", selector: role("figure-footer-note"), count: 1 },

  { palette: "relief", diagram: "ガント", direction: "外す", selector: role("figure-footer-label"), count: 1 },
  { palette: "relief", diagram: "ガント", direction: "外す", selector: role("figure-footer-note"), count: 1 },
  { palette: "relief", diagram: "ガント", direction: "外す", selector: role("figure-title"), count: 1 },
  { palette: "relief", diagram: "内訳の帯", direction: "外す", selector: role("chart-stacked-bar-rate"), count: 1, text: "17%" },
  { palette: "relief", diagram: "内訳の帯", direction: "外す", selector: role("figure-footer-label"), count: 1 },
  { palette: "relief", diagram: "内訳の帯", direction: "外す", selector: role("figure-footer-note"), count: 1 },
  { palette: "relief", diagram: "内訳の帯", direction: "外す", selector: role("figure-title"), count: 1 },
  { palette: "relief", diagram: "半円", direction: "足す", selector: role("chart-gauge-scale-endpoint"), count: 2 },
  { palette: "relief", diagram: "四象限", direction: "足す", selector: role("quadrant-axis-name"), count: 2 },
  { palette: "relief", diagram: "四象限", direction: "足す", selector: role("quadrant-label"), count: 4 },
  { palette: "relief", diagram: "折れ線", direction: "外す", selector: role("figure-footer-label"), count: 1 },
  { palette: "relief", diagram: "折れ線", direction: "外す", selector: role("figure-footer-note"), count: 1 },
  { palette: "relief", diagram: "折れ線", direction: "外す", selector: role("figure-title"), count: 1 },
  // #383838 の error 札は、白い浮彫影で字の画素を明るくせず 4.5:1 の対比を保つ。
  { palette: "relief", diagram: "時間軸", direction: "足す", selector: "[data-cdl-edge-label-for][data-cdl-tone=\"success\"] > [data-cdl-role=\"edge-label\"]", count: 1 },
  { palette: "relief", diagram: "時間軸", direction: "外す", selector: "[data-cdl-edge-label-for][data-cdl-tone=\"error\"] > [data-cdl-role=\"edge-label\"]", count: 2 },
  { palette: "relief", diagram: "時間軸", direction: "足す", selector: "[data-cdl-node]:has([data-cdl-mark=\"timeline-number\"]) [data-cdl-role=\"node-label\"], [data-cdl-kind=\"decision\"] [data-cdl-role=\"node-label\"]", count: 7 },
  { palette: "relief", diagram: "棒", direction: "外す", selector: role("figure-footer-label"), count: 1 },
  { palette: "relief", diagram: "棒", direction: "外す", selector: role("figure-footer-note"), count: 1 },
  { palette: "relief", diagram: "棒", direction: "外す", selector: role("figure-title"), count: 1 },
  { palette: "relief", diagram: "段の箱", direction: "足す", selector: "[data-cdl-edge-label-for][data-cdl-tone=\"success\"] > [data-cdl-role=\"edge-label\"]", count: 1 },
  { palette: "relief", diagram: "段の箱", direction: "外す", selector: "[data-cdl-edge-label-for][data-cdl-tone=\"error\"] > [data-cdl-role=\"edge-label\"]", count: 2 },
  { palette: "relief", diagram: "気持ちの道のり", direction: "外す", selector: role("figure-footer-label"), count: 1 },
  { palette: "relief", diagram: "気持ちの道のり", direction: "外す", selector: role("figure-footer-note"), count: 1 },
  { palette: "relief", diagram: "気持ちの道のり", direction: "外す", selector: role("figure-title"), count: 1 },
  { palette: "relief", diagram: "漏斗", direction: "外す", selector: role("figure-footer-label"), count: 1 },
  { palette: "relief", diagram: "漏斗", direction: "外す", selector: role("figure-footer-note"), count: 1 },
  { palette: "relief", diagram: "漏斗", direction: "外す", selector: role("figure-title"), count: 1 },

  { palette: "terminal", diagram: "ガント", direction: "足す", selector: "[data-cdl-kind=\"gantt-timeline\"] text:not([data-cdl-role])", count: 6 },
  { palette: "terminal", diagram: "ガント", direction: "足す", selector: role("gantt-milestone-label"), count: 1 },
  { palette: "terminal", diagram: "ガント", direction: "足す", selector: role("gantt-tick"), count: 5 },
  { palette: "terminal", diagram: "ガント", direction: "足す", selector: role("gantt-today-label"), count: 1 },
  { palette: "terminal", diagram: "内訳の帯", direction: "足す", selector: role("chart-stacked-bar-legend"), count: 3 },
  { palette: "terminal", diagram: "内訳の帯", direction: "足す", selector: role("chart-stacked-bar-period"), count: 5 },
  { palette: "terminal", diagram: "内訳の帯", direction: "足す", selector: role("chart-stacked-bar-rate"), count: 4, text: "!17%" },
  { palette: "terminal", diagram: "円", direction: "外す", selector: role("chart-pie-table-label"), count: 4 },
  { palette: "terminal", diagram: "円", direction: "外す", selector: role("chart-pie-table-value"), count: 4 },
  { palette: "terminal", diagram: "円", direction: "外す", selector: role("figure-footer-label"), count: 1 },
  { palette: "terminal", diagram: "円", direction: "外す", selector: role("figure-footer-note"), count: 1 },
  { palette: "terminal", diagram: "半円", direction: "足す", selector: role("chart-gauge-scale-endpoint"), count: 2 },
  { palette: "terminal", diagram: "四象限", direction: "外す", selector: role("figure-footer-label"), count: 1 },
  { palette: "terminal", diagram: "四象限", direction: "外す", selector: role("figure-footer-note"), count: 1 },
  { palette: "terminal", diagram: "折れ線", direction: "足す", selector: role("chart-line-label"), count: 5 },
  { palette: "terminal", diagram: "折れ線", direction: "足す", selector: role("chart-line-tick"), count: 5 },
  { palette: "terminal", diagram: "折れ線", direction: "足す", selector: role("chart-line-value"), count: 3 },
  { palette: "terminal", diagram: "時間軸", direction: "足す", selector: role("edge-label"), count: 3 },
  { palette: "terminal", diagram: "時間軸", direction: "足す", selector: "[data-cdl-node]:has([data-cdl-mark=\"timeline-number\"]) [data-cdl-role=\"node-label\"], [data-cdl-kind=\"decision\"] [data-cdl-role=\"node-label\"]", count: 7 },
  { palette: "terminal", diagram: "棒", direction: "足す", selector: role("chart-bar-label"), count: 5 },
  { palette: "terminal", diagram: "棒", direction: "足す", selector: role("chart-bar-tick"), count: 5 },
  { palette: "terminal", diagram: "段の箱", direction: "足す", selector: role("edge-label"), count: 3 },
  { palette: "terminal", diagram: "気持ちの道のり", direction: "足す", selector: role("journey-level-name"), count: 5 },
  { palette: "terminal", diagram: "気持ちの道のり", direction: "足す", selector: "[data-cdl-role=\"journey-step\"] > text", count: 6 },
  { palette: "terminal", diagram: "漏斗", direction: "足す", selector: "[data-cdl-kind=\"funnel-stages\"] text:not([data-cdl-role])", count: 8 },
  { palette: "terminal", diagram: "漏斗", direction: "足す", selector: role("funnel-conversion-rate"), count: 3 },
] as const;

const expectedFilter = {
  relief: 'url("#dragon-metro-relief-shadow")',
  neon: 'url("#dragon-neon-tube")',
  terminal: 'url("#dragon-metro-terminal-glow")',
} as const;

const boundedFilterIds = [
  "dragon-neon-tube",
  "dragon-metro-relief-shadow",
  "dragon-metro-terminal-glow",
] as const;
const neonContentFilterIds = ["dragon-neon-tube", "dragon-metro-neon-glow"] as const;

type Box = { left: number; right: number; top: number; bottom: number };
type FilteredGeometry = {
  filterId: (typeof boundedFilterIds)[number];
  kind: "字" | "線";
  box: Box;
};

const doms = new Map<string, JSDOM>();

function cssWithResolvedFilterRoles(palette: Palette): string {
  const withoutComments = css.replace(/\/\*[\s\S]*?\*\//gu, "");
  const selector = `svg[data-cdl-stage][data-cdl-palette="${palette}"]`;
  const table = [...withoutComments.matchAll(/([^{}]*)\{([^{}]*)\}/gu)].find((match) =>
    (match[1] ?? "").replace(/\s+/gu, " ").trim() === selector &&
    (match[2] ?? "").includes("--dragon-theme-ground:"),
  )?.[2];
  if (table === undefined) throw new Error(`${palette} の意匠表が無い`);
  const declarations = new Map(
    [...table.matchAll(/(--[a-z0-9-]+)\s*:\s*([^;]+);/giu)].map((match) => [
      match[1]!,
      match[2]!.replace(/\s+/gu, " ").trim(),
    ]),
  );
  const resolve = (role: string, seen = new Set<string>()): string | undefined => {
    if (seen.has(role)) throw new Error(`${role} の参照が循環している`);
    const value = declarations.get(role);
    if (value === undefined) return undefined;
    const next = /^var\((--[a-z0-9-]+)\)$/iu.exec(value)?.[1];
    return next === undefined ? value : resolve(next, new Set([...seen, role]));
  };
  return css.replace(
    /(filter\s*:\s*)var\((--[a-z0-9-]+)\)/giu,
    (whole, prefix: string, role: string) => {
      const value = resolve(role);
      return value === undefined ? whole : `${prefix}${value}`;
    },
  );
}

function domFor(palette: Palette, name: keyof typeof diagrams): JSDOM {
  const key = `${palette}/${name}`;
  const cached = doms.get(key);
  if (cached !== undefined) return cached;
  const diagram = 図の配色を変える(diagrams[name], palette);
  const focusPhaseId = diagram.phases.at(-1)?.id;
  const markup = renderToStaticMarkup(
    <CdlDiagramView diagram={diagram} hideHeader focusPhaseId={focusPhaseId} />,
  );
  const dom = new JSDOM(`<style>${cssWithResolvedFilterRoles(palette)}</style>${markup}`, {
    url: "https://catalog.test/",
  });
  doms.set(key, dom);
  return dom;
}

function filtersOf(dom: JSDOM, element: Element): string[] {
  const filters: string[] = [];
  let current: Element | null = element;
  while (current !== null && current.tagName.toLowerCase() !== "svg") {
    const filter = dom.window.getComputedStyle(current).filter;
    if (filter !== "" && filter !== "none") filters.push(filter);
    current = current.parentElement;
  }
  return filters;
}

function matchingFilterId<const T extends readonly string[]>(value: string, ids: T): T[number] | undefined {
  return ids.find((id) => value.includes(id));
}

function numberAttribute(element: Element, name: string): number | undefined {
  const value = element.getAttribute(name);
  if (value === null) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function textBox(dom: JSDOM, element: Element): Box | undefined {
  const x = numberAttribute(element, "x");
  const y = numberAttribute(element, "y");
  if (x === undefined || y === undefined) return undefined;
  const computedFontSize = Number.parseFloat(dom.window.getComputedStyle(element).fontSize);
  const fontSize = numberAttribute(element, "font-size")
    ?? (Number.isFinite(computedFontSize) && computedFontSize > 0 ? computedFontSize : 16);
  const width = [...(element.textContent ?? "")].reduce(
    (sum, character) => sum + fontSize * (/^[\x00-\x7F]$/u.test(character) ? 0.62 : 1),
    0,
  );
  const anchor = element.getAttribute("text-anchor") ?? "start";
  const left = anchor === "middle" ? x - width / 2 : anchor === "end" ? x - width : x;
  return { left, right: left + width, top: y - fontSize, bottom: y + fontSize * 0.3 };
}

function shapeBox(dom: JSDOM, element: Element): Box | undefined {
  if (element.tagName.toLowerCase() === "text") return textBox(dom, element);

  const tag = element.tagName.toLowerCase();
  let box: Box | undefined;
  if (tag === "rect") {
    const x = numberAttribute(element, "x");
    const y = numberAttribute(element, "y");
    const width = numberAttribute(element, "width");
    const height = numberAttribute(element, "height");
    if (x !== undefined && y !== undefined && width !== undefined && height !== undefined) {
      box = { left: x, right: x + width, top: y, bottom: y + height };
    }
  } else if (tag === "circle") {
    const cx = numberAttribute(element, "cx");
    const cy = numberAttribute(element, "cy");
    const radius = numberAttribute(element, "r");
    if (cx !== undefined && cy !== undefined && radius !== undefined) {
      box = { left: cx - radius, right: cx + radius, top: cy - radius, bottom: cy + radius };
    }
  } else if (tag === "ellipse") {
    const cx = numberAttribute(element, "cx");
    const cy = numberAttribute(element, "cy");
    const rx = numberAttribute(element, "rx");
    const ry = numberAttribute(element, "ry");
    if (cx !== undefined && cy !== undefined && rx !== undefined && ry !== undefined) {
      box = { left: cx - rx, right: cx + rx, top: cy - ry, bottom: cy + ry };
    }
  } else if (tag === "line") {
    const x1 = numberAttribute(element, "x1");
    const y1 = numberAttribute(element, "y1");
    const x2 = numberAttribute(element, "x2");
    const y2 = numberAttribute(element, "y2");
    if (x1 !== undefined && y1 !== undefined && x2 !== undefined && y2 !== undefined) {
      box = { left: Math.min(x1, x2), right: Math.max(x1, x2), top: Math.min(y1, y2), bottom: Math.max(y1, y2) };
    }
  } else {
    const raw = element.getAttribute("d") ?? element.getAttribute("points");
    const values = raw === null
      ? []
      : [...raw.matchAll(/-?\d+(?:\.\d+)?(?:e[-+]?\d+)?/giu)].map((match) => Number(match[0]));
    const pairs: Array<readonly [number, number]> = [];
    for (let index = 0; index + 1 < values.length; index += 2) {
      pairs.push([values[index]!, values[index + 1]!]);
    }
    if (pairs.length > 0) {
      box = {
        left: Math.min(...pairs.map(([x]) => x)),
        right: Math.max(...pairs.map(([x]) => x)),
        top: Math.min(...pairs.map(([, y]) => y)),
        bottom: Math.max(...pairs.map(([, y]) => y)),
      };
    }
  }
  if (box === undefined) return undefined;

  const computedStrokeWidth = Number.parseFloat(dom.window.getComputedStyle(element).strokeWidth);
  const strokeWidth = numberAttribute(element, "stroke-width")
    ?? (Number.isFinite(computedStrokeWidth) ? computedStrokeWidth : 0);
  const halfStroke = strokeWidth / 2;
  return {
    left: box.left - halfStroke,
    right: box.right + halfStroke,
    top: box.top - halfStroke,
    bottom: box.bottom + halfStroke,
  };
}

function filterSource(id: string): string {
  const source = new RegExp(`<filter\\s+id="${id}"[\\s\\S]*?<\\/filter>`, "u").exec(svgDefs)?.[0];
  if (source === undefined) throw new Error(`filter ${id} が見つからない`);
  return source;
}

function filterMargin(id: (typeof boundedFilterIds)[number]): { x: number; y: number } {
  const source = filterSource(id);
  const deviations = [...source.matchAll(/stdDeviation="([\d.]+)(?:\s+([\d.]+))?"/gu)];
  const blurX = Math.max(0, ...deviations.map((match) => Number(match[1])));
  const blurY = Math.max(0, ...deviations.map((match) => Number(match[2] ?? match[1])));
  const offsets = [...source.matchAll(/<feOffset\b[^>]*\bdx="(-?[\d.]+)"[^>]*\bdy="(-?[\d.]+)"/gu)];
  const offsetX = Math.max(0, ...offsets.map((match) => Math.abs(Number(match[1]))));
  const offsetY = Math.max(0, ...offsets.map((match) => Math.abs(Number(match[2]))));
  return { x: blurX * 3 + offsetX, y: blurY * 3 + offsetY };
}

function filterPercentAttribute(id: (typeof boundedFilterIds)[number], name: string): number {
  const source = filterSource(id);
  const value = Number(new RegExp(`\\b${name}="(-?[\\d.]+)%"`, "u").exec(source)?.[1]);
  if (!Number.isFinite(value)) throw new Error(`filter ${id} の ${name} が見つからない`);
  return value / 100;
}

function filteredGeometry(dom: JSDOM): FilteredGeometry[] {
  const selector = "text, line, path, circle, ellipse, rect, polygon, polyline";
  return [...dom.window.document.querySelectorAll(selector)].flatMap((element) => {
    const filterId = matchingFilterId(dom.window.getComputedStyle(element).filter, boundedFilterIds);
    if (filterId === undefined) return [];
    const box = shapeBox(dom, element);
    expect(box, `${filterId}/${element.tagName}/${element.getAttribute("data-cdl-role")}`).toBeDefined();
    return [{ filterId, kind: element.tagName.toLowerCase() === "text" ? "字" as const : "線" as const, box: box! }];
  });
}

function insufficientFilterRegions(dom: JSDOM, paddingOverride?: number): FilteredGeometry[] {
  const svg = dom.window.document.querySelector("svg");
  const viewBox = svg?.getAttribute("viewBox")?.split(/\s+/u).map(Number);
  if (viewBox === undefined || viewBox.length !== 4) throw new Error("viewBox が見つからない");
  const [, , width, height] = viewBox;
  return filteredGeometry(dom).filter(({ filterId, box }) => {
    const region = paddingOverride === undefined
      ? {
          left: width! * filterPercentAttribute(filterId, "x"),
          top: height! * filterPercentAttribute(filterId, "y"),
          width: width! * filterPercentAttribute(filterId, "width"),
          height: height! * filterPercentAttribute(filterId, "height"),
        }
      : {
          left: -width! * paddingOverride,
          top: -height! * paddingOverride,
          width: width! * (1 + paddingOverride * 2),
          height: height! * (1 + paddingOverride * 2),
        };
    const margin = filterMargin(filterId);
    return box.left - margin.x < region.left
      || box.right + margin.x > region.left + region.width
      || box.top - margin.y < region.top
      || box.bottom + margin.y > region.top + region.height;
  });
}

describe("#2854 見本の SVG / HTML に合わせた字の光と影", () => {
  it("round 8 の一覧にある 154 字を役割ごとに実際の SVG から選べる", () => {
    expect(cases.reduce((sum, item) => sum + item.count, 0)).toBe(154);
    for (const item of cases) {
      const dom = domFor(item.palette, item.diagram);
      const selected = [...dom.window.document.querySelectorAll(item.selector)].filter((element) => {
        if (item.text === undefined) return true;
        if (item.text.startsWith("!")) return element.textContent !== item.text.slice(1);
        return element.textContent === item.text;
      });
      expect(selected, `${item.palette}/${item.diagram}/${item.direction}/${item.selector}`).toHaveLength(item.count);
    }
  });

  it("154 字の光と影の有無が見本と一致する", () => {
    for (const item of cases) {
      const dom = domFor(item.palette, item.diagram);
      const selected = [...dom.window.document.querySelectorAll(item.selector)].filter((element) => {
        if (item.text === undefined) return true;
        if (item.text.startsWith("!")) return element.textContent !== item.text.slice(1);
        return element.textContent === item.text;
      });
      for (const element of selected) {
        const filters = filtersOf(dom, element);
        if (item.direction === "外す") {
          expect(filters, `${item.palette}/${item.diagram}/${element.textContent}`).toEqual([]);
        } else {
          expect(filters, `${item.palette}/${item.diagram}/${element.textContent}`)
            .toContain(expectedFilter[item.palette]);
        }
      }
    }
  });

  it("電飾の 14 図で、光る中身の要素に光る祖先がいない", () => {
    let inspected = 0;
    for (const [name] of Object.entries(diagrams)) {
      const dom = domFor("neon", name as keyof typeof diagrams);
      // 同じ祖先を子孫の数だけ何度も `getComputedStyle` で測らない。表の図では深い祖先を
      // 数百回ずつ辿るため、全件を並列に走らせると既定の 30 秒を超えていた。
      const filterIds = new Map<Element, string | undefined>();
      const filterId = (element: Element): string | undefined => {
        if (filterIds.has(element)) return filterIds.get(element);
        const id = matchingFilterId(dom.window.getComputedStyle(element).filter, neonContentFilterIds);
        filterIds.set(element, id);
        return id;
      };
      for (const element of dom.window.document.querySelectorAll("*")) {
        const ownFilter = filterId(element);
        if (ownFilter === undefined) continue;
        inspected += 1;
        let ancestor = element.parentElement;
        while (ancestor !== null && ancestor.tagName.toLowerCase() !== "svg") {
          const ancestorFilter = filterId(ancestor);
          expect(
            ancestorFilter,
            `${name}/${element.getAttribute("data-cdl-role") ?? element.tagName}/${ownFilter}`,
          ).toBeUndefined();
          ancestor = ancestor.parentElement;
        }
      }
    }
    expect(inspected).toBeGreaterThan(0);
    // 14 図を描く検査なので、全件の並列実行では既定の 30 秒を超えることがある
  }, 120_000);

  it("浮彫・電飾・端末の 14 図で、字と線が filter の描画範囲に光の広がりごと入る", () => {
    let inspected = 0;
    for (const palette of ["relief", "neon", "terminal"] as const) {
      for (const [name] of Object.entries(diagrams)) {
        const dom = domFor(palette, name as keyof typeof diagrams);
        inspected += filteredGeometry(dom).length;
        expect(insufficientFilterRegions(dom), `${palette}/${name}`).toEqual([]);
      }
    }
    expect(inspected).toBeGreaterThan(0);
    // 3 意匠 × 14 図を描くため、全件の並列実行では既定の 30 秒を超えることがある
  }, 120_000);

  it("round 9 の 3% 範囲なら「翌日もう一度」6 字要素の左端不足を検出する", () => {
    const counts: Record<string, { 字: number; 線: number }> = {};
    for (const palette of ["relief", "neon", "terminal"] as const) {
      for (const [name] of Object.entries(diagrams)) {
        const insufficient = insufficientFilterRegions(
          domFor(palette, name as keyof typeof diagrams),
          0.03,
        );
        if (insufficient.length === 0) continue;
        counts[`${palette}/${name}`] = {
          字: insufficient.filter(({ kind }) => kind === "字").length,
          線: insufficient.filter(({ kind }) => kind === "線").length,
        };
      }
    }
    expect(counts).toEqual({
      "neon/段の箱": { 字: 1, 線: 0 },
      "neon/時間軸": { 字: 1, 線: 0 },
      "terminal/段の箱": { 字: 1, 線: 0 },
      "terminal/時間軸": { 字: 1, 線: 0 },
    });
  });

  it("浮彫の明るい影は左上の白で作り、濃い error 札の字から外す", () => {
    const source = filterSource("dragon-metro-relief-shadow");
    expect(source).toContain('<feOffset in="metro-relief-blur" dx="-2" dy="-2" result="metro-relief-light-offset" />');
    expect(source).toContain('<feFlood floodColor="#ffffff" floodOpacity=".95" result="metro-relief-light-color" />');
    expect(source).toContain('result="metro-relief-light"');
    expect(source).toContain('<feMergeNode in="metro-relief-light" />');
    expect(source).not.toContain('<feMergeNode in="metro-relief-label-light" />');

    for (const diagram of ["段の箱", "時間軸"] as const) {
      const dom = domFor("relief", diagram);
      const labels = dom.window.document.querySelectorAll(
        '[data-cdl-edge-label-for][data-cdl-tone="error"] > [data-cdl-role="edge-label"]',
      );
      expect(labels, diagram).toHaveLength(2);
      for (const label of labels) expect(filtersOf(dom, label), `${diagram}/${label.textContent}`).toEqual([]);
    }
  });
});
