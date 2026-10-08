// @vitest-environment jsdom

import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { CdlDiagramView } from "@cardenelabs/cdl";
import { JSDOM } from "jsdom";
import { describe, expect, it } from "vitest";

import { textDslToDiagram } from "../src";

type Bounds = { x0: number; y0: number; x1: number; y1: number };

const number = (value: string | null, fallback = 0): number =>
  value === null ? fallback : Number(value);

const merge = (a: Bounds | null, b: Bounds): Bounds =>
  a === null
    ? b
    : {
        x0: Math.min(a.x0, b.x0),
        y0: Math.min(a.y0, b.y0),
        x1: Math.max(a.x1, b.x1),
        y1: Math.max(a.y1, b.y1),
      };

/** CDL の textWidth と同じ安全側の級。jsdom は SVG text の外接を返さないため字幅だけ近似する。 */
const textWidth = (text: string, size: number): number => {
  let width = 0;
  for (const char of text) {
    if ("ijlI.,:;'! ".includes(char)) width += 0.37;
    else if ("W@%Mm".includes(char)) width += 1.04;
    else width += (char.codePointAt(0) ?? 0) < 128 ? 0.86 : 1.04;
  }
  return width * size;
};

/** SVG の円弧実装式。扇形群は一周を覆うので、各外弧の円を数えると union の外接は正確になる。 */
const arcCircle = (d: string): Bounds | null => {
  const match = d.match(
    /M\s+([-+.\deE]+)\s+([-+.\deE]+)\s+A\s+([-+.\deE]+)\s+([-+.\deE]+)\s+0\s+([01])\s+([01])\s+([-+.\deE]+)\s+([-+.\deE]+)/u,
  );
  if (match === null) return null;
  const [x1, y1, radius, large, sweep, x2, y2] = [
    Number(match[1]), Number(match[2]), Number(match[3]), Number(match[5]),
    Number(match[6]), Number(match[7]), Number(match[8]),
  ];
  const dx = (x1 - x2) / 2;
  const dy = (y1 - y2) / 2;
  const scale = Math.sqrt(Math.max(0, (radius ** 2 - dx ** 2 - dy ** 2) / (dx ** 2 + dy ** 2)));
  const sign = large === sweep ? -1 : 1;
  const cx = (x1 + x2) / 2 + sign * scale * dy;
  const cy = (y1 + y2) / 2 - sign * scale * dx;
  return { x0: cx - radius, y0: cy - radius, x1: cx + radius, y1: cy + radius };
};

const elementBounds = (element: Element): Bounds | null => {
  const tag = element.tagName.toLowerCase();
  if (tag === "text") {
    const size = number(element.getAttribute("font-size"), 16);
    const width = textWidth(element.textContent ?? "", size);
    const x = number(element.getAttribute("x"));
    const y = number(element.getAttribute("y"));
    const anchor = element.getAttribute("text-anchor");
    const x0 = anchor === "middle" ? x - width / 2 : anchor === "end" ? x - width : x;
    // SVG の y は baseline。Inter の ascent/descent を広い側へ丸めた近似。
    return { x0, y0: y - size, x1: x0 + width, y1: y + size * 0.25 };
  }
  if (tag === "rect") {
    const x = number(element.getAttribute("x"));
    const y = number(element.getAttribute("y"));
    return {
      x0: x,
      y0: y,
      x1: x + number(element.getAttribute("width")),
      y1: y + number(element.getAttribute("height")),
    };
  }
  if (tag === "circle") {
    const cx = number(element.getAttribute("cx"));
    const cy = number(element.getAttribute("cy"));
    const r = number(element.getAttribute("r"));
    return { x0: cx - r, y0: cy - r, x1: cx + r, y1: cy + r };
  }
  if (tag === "line") {
    const x1 = number(element.getAttribute("x1"));
    const x2 = number(element.getAttribute("x2"));
    const y1 = number(element.getAttribute("y1"));
    const y2 = number(element.getAttribute("y2"));
    return x1 === x2 || y1 === y2
      ? null
      : { x0: Math.min(x1, x2), y0: Math.min(y1, y2), x1: Math.max(x1, x2), y1: Math.max(y1, y2) };
  }
  if (tag === "path") {
    const d = element.getAttribute("d") ?? "";
    if (element.getAttribute("data-cdl-role") === "chart-pie-slice") return arcCircle(d);
    const values = [...d.matchAll(/[-+]?(?:\d*\.)?\d+(?:e[-+]?\d+)?/giu)].map((m) => Number(m[0]));
    const points: Array<[number, number]> = [];
    for (let i = 0; i + 1 < values.length; i += 2) points.push([values[i]!, values[i + 1]!]);
    if (points.length === 0) return null;
    return {
      x0: Math.min(...points.map(([x]) => x)),
      y0: Math.min(...points.map(([, y]) => y)),
      x1: Math.max(...points.map(([x]) => x)),
      y1: Math.max(...points.map(([, y]) => y)),
    };
  }
  const points = (element.getAttribute("points") ?? "").match(/[-+]?(?:\d*\.)?\d+/gu)?.map(Number) ?? [];
  if (points.length < 4) return null;
  const xs = points.filter((_v, i) => i % 2 === 0);
  const ys = points.filter((_v, i) => i % 2 === 1);
  return { x0: Math.min(...xs), y0: Math.min(...ys), x1: Math.max(...xs), y1: Math.max(...ys) };
};

const measure = (source: string): { horizontal: number; vertical: number; inside: boolean } => {
  const diagram = textDslToDiagram(source);
  const markup = renderToStaticMarkup(createElement(CdlDiagramView, { diagram }));
  const document = new JSDOM(markup).window.document;
  const body = document.querySelector('[data-cdl-role="node-body"]');
  if (body === null || body.parentElement === null) throw new Error("円の札を描けなかった");
  const card = elementBounds(body)!;
  let content: Bounds | null = null;
  for (const element of body.parentElement.querySelectorAll("text, path, rect, circle, line, polygon, polyline")) {
    if (element === body || element.closest("defs") !== null) continue;
    if (element.getAttribute("data-cdl-role") === "figure-title") continue;
    const bounds = elementBounds(element);
    if (bounds === null || bounds.x0 === bounds.x1 || bounds.y0 === bounds.y1) continue;
    content = merge(content, bounds);
  }
  if (content === null) throw new Error("円の中身を測れなかった");
  return {
    horizontal: Math.round(((content.x1 - content.x0) / (card.x1 - card.x0)) * 100),
    vertical: Math.round(((content.y1 - content.y0) / (card.y1 - card.y0)) * 100),
    inside: content.x0 >= card.x0 && content.y0 >= card.y0 && content.x1 <= card.x1 && content.y1 <= card.y1,
  };
};

const source = (form: "ring" | "arcs" | "table" | undefined, rows: string): string =>
  `title: "荷物の状態"\ntype: chart\nshape: pie\n${form === undefined ? "" : `form: ${form}\n`}actors:\n${rows}`;

const four = `  - 配達中: "210"\n  - 集荷済: "132"\n  - 受付済: "70"\n  - 完了: "720"\n`;

describe("円の札を描画寸法から決める (#2837)", () => {
  it("4 区分の table は札を縦 76% / 横 72% 以上使う", () => {
    const result = measure(source("table", four));
    expect(result.horizontal, JSON.stringify(result)).toBeGreaterThanOrEqual(72);
    expect(result.vertical, JSON.stringify(result)).toBeGreaterThanOrEqual(76);
    expect(result.inside, JSON.stringify(result)).toBe(true);
  });

  it.each([
    ["ring", "ring"],
    ["見せ方を書かない円", undefined],
  ] as const)("%s の札は従来どおり 480x320 にする", (_name, form) => {
    const node = textDslToDiagram(source(form, four)).nodes[0];
    expect(node).toMatchObject({ kind: "chart-pie", w: 480, h: 320 });
    if (node === undefined) throw new Error("円の札を組み立てられなかった");
    if (form === undefined) expect(Object.hasOwn(node, "chartPieForm")).toBe(false);
  });

  it.each([
    ["ring", `  - TypeScript: "45"\n  - Python: "30"\n  - Rust: "15"\n  - Go: "10"\n`],
    ["arcs", `  - ウェブ: "45"\n  - アプリ: "35"\n  - API: "20"\n`],
    ["table", four],
  ] as const)("既存の %s の区分名・値・線・行が札から出ない", (form, rows) => {
    const result = measure(source(form, rows));
    expect(result.inside, JSON.stringify(result)).toBe(true);
  });
});
