// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { injectHitAreas, clearHitAreas, resolveHitTarget, EDGE_HIT_STROKE, LABEL_HIT_PADDING } from "./svg-hit-area";

const SVG_NS = "http://www.w3.org/2000/svg";

/** cdl が出す SVG の最小構造を組む。 */
function buildSvg(opts: { edges?: Array<{ id: string; d: string }>; labels?: string[]; nodeTexts?: string[] } = {}): SVGSVGElement {
  const svg = document.createElementNS(SVG_NS, "svg") as SVGSVGElement;
  for (const e of opts.edges ?? []) {
    const g = document.createElementNS(SVG_NS, "g");
    g.setAttribute("data-cdl-edge", e.id);
    const p = document.createElementNS(SVG_NS, "path");
    p.setAttribute("data-cdl-role", "edge-line");
    p.setAttribute("d", e.d);
    g.appendChild(p);
    svg.appendChild(g);
  }
  for (const t of opts.labels ?? []) {
    const text = document.createElementNS(SVG_NS, "text");
    text.textContent = t;
    stubBBox(text, { x: 10, y: 20, width: 60, height: 14 });
    svg.appendChild(text);
  }
  // node の内側にある text は対象外 (node 自体が当たり判定を持つため)
  for (const t of opts.nodeTexts ?? []) {
    const g = document.createElementNS(SVG_NS, "g");
    g.setAttribute("data-cdl-node", "n1");
    const text = document.createElementNS(SVG_NS, "text");
    text.textContent = t;
    stubBBox(text, { x: 0, y: 0, width: 50, height: 12 });
    g.appendChild(text);
    svg.appendChild(g);
  }
  return svg;
}

/** jsdom は getBBox を持たないので差し替える。 */
function stubBBox(el: Element, box: { x: number; y: number; width: number; height: number }): void {
  (el as unknown as { getBBox: () => typeof box }).getBBox = () => box;
}

describe("injectHitAreas — 矢印", () => {
  it("実線と同じ d を持つ透明 path を足す", () => {
    const svg = buildSvg({ edges: [{ id: "e0", d: "M 0 0 L 100 0" }] });
    injectHitAreas(svg);
    const hit = svg.querySelector('[data-editor-hit="edge"]')!;
    expect(hit.getAttribute("d")).toBe("M 0 0 L 100 0");
    expect(hit.getAttribute("stroke")).toBe("transparent");
    expect(Number(hit.getAttribute("stroke-width"))).toBe(EDGE_HIT_STROKE);
  });

  it("当たり判定は実線より太い (細い線を掴めるようにするのが目的)", () => {
    expect(EDGE_HIT_STROKE).toBeGreaterThan(4);
  });

  it("実線の前に挿入する (z 順で下 = 線の上では実線が hit する)", () => {
    const svg = buildSvg({ edges: [{ id: "e0", d: "M 0 0 L 10 0" }] });
    injectHitAreas(svg);
    const g = svg.querySelector("[data-cdl-edge]")!;
    expect(g.children[0]!.getAttribute("data-editor-hit")).toBe("edge");
    expect(g.children[1]!.getAttribute("data-cdl-role")).toBe("edge-line");
  });

  it("edge が複数あればそれぞれに足す", () => {
    const svg = buildSvg({ edges: [{ id: "e0", d: "M 0 0 L 1 0" }, { id: "e1", d: "M 0 5 L 1 5" }] });
    injectHitAreas(svg);
    expect(svg.querySelectorAll('[data-editor-hit="edge"]')).toHaveLength(2);
  });

  it("d を持たない edge は飛ばす (壊れた path を作らない)", () => {
    const svg = document.createElementNS(SVG_NS, "svg") as SVGSVGElement;
    const g = document.createElementNS(SVG_NS, "g");
    g.setAttribute("data-cdl-edge", "e0");
    g.appendChild(document.createElementNS(SVG_NS, "path"));
    svg.appendChild(g);
    injectHitAreas(svg);
    expect(svg.querySelectorAll('[data-editor-hit="edge"]')).toHaveLength(0);
  });
});

describe("injectHitAreas — ラベル", () => {
  it("余白は 4px 以上ある (定数を書き換えても検知できるよう literal で固定)", () => {
    // 期待値を定数から組み立てる assertion だけだと、 余白を 0 にする書換が素通りする。
    // 文字の隙間や周囲を掴めるようにするのが目的なので、 下限を直接固定する。
    expect(LABEL_HIT_PADDING).toBeGreaterThanOrEqual(4);
  });

  it("text の bbox に余白を足した透明 rect を敷く", () => {
    const svg = buildSvg({ labels: ["ログイン要求"] });
    injectHitAreas(svg);
    const rect = svg.querySelector('[data-editor-hit="label"]')!;
    expect(Number(rect.getAttribute("x"))).toBe(10 - LABEL_HIT_PADDING);
    expect(Number(rect.getAttribute("y"))).toBe(20 - LABEL_HIT_PADDING);
    expect(Number(rect.getAttribute("width"))).toBe(60 + LABEL_HIT_PADDING * 2);
    expect(Number(rect.getAttribute("height"))).toBe(14 + LABEL_HIT_PADDING * 2);
    expect(rect.getAttribute("fill")).toBe("transparent");
  });

  it("text の直前に挿入する (文字そのものは text が hit する)", () => {
    const svg = buildSvg({ labels: ["a"] });
    injectHitAreas(svg);
    const rect = svg.querySelector('[data-editor-hit="label"]')!;
    expect(rect.nextElementSibling!.tagName).toBe("text");
  });

  it("node の内側の text には敷かない (二重に反応させない)", () => {
    const svg = buildSvg({ nodeTexts: ["Client"] });
    injectHitAreas(svg);
    expect(svg.querySelectorAll('[data-editor-hit="label"]')).toHaveLength(0);
  });

  it("サイズ 0 の text は飛ばす", () => {
    const svg = document.createElementNS(SVG_NS, "svg") as SVGSVGElement;
    const text = document.createElementNS(SVG_NS, "text");
    stubBBox(text, { x: 0, y: 0, width: 0, height: 0 });
    svg.appendChild(text);
    injectHitAreas(svg);
    expect(svg.querySelectorAll('[data-editor-hit="label"]')).toHaveLength(0);
  });

  it("getBBox が例外を投げても落ちない (非表示要素)", () => {
    const svg = document.createElementNS(SVG_NS, "svg") as SVGSVGElement;
    const text = document.createElementNS(SVG_NS, "text");
    (text as unknown as { getBBox: () => never }).getBBox = () => { throw new Error("not rendered"); };
    svg.appendChild(text);
    expect(() => injectHitAreas(svg)).not.toThrow();
    expect(svg.querySelectorAll('[data-editor-hit="label"]')).toHaveLength(0);
  });
});

describe("再注入", () => {
  it("2 回呼んでも二重に積まない", () => {
    const svg = buildSvg({ edges: [{ id: "e0", d: "M 0 0 L 1 0" }], labels: ["a"] });
    injectHitAreas(svg);
    injectHitAreas(svg);
    expect(svg.querySelectorAll('[data-editor-hit="edge"]')).toHaveLength(1);
    expect(svg.querySelectorAll('[data-editor-hit="label"]')).toHaveLength(1);
  });

  it("clearHitAreas で全て消える", () => {
    const svg = buildSvg({ edges: [{ id: "e0", d: "M 0 0 L 1 0" }], labels: ["a"] });
    injectHitAreas(svg);
    clearHitAreas(svg);
    expect(svg.querySelectorAll("[data-editor-hit]")).toHaveLength(0);
  });

  it("clear しても元の要素は残る", () => {
    const svg = buildSvg({ edges: [{ id: "e0", d: "M 0 0 L 1 0" }], labels: ["a"] });
    injectHitAreas(svg);
    clearHitAreas(svg);
    expect(svg.querySelectorAll('path[data-cdl-role="edge-line"]')).toHaveLength(1);
    expect(svg.querySelectorAll("text")).toHaveLength(1);
  });
});

describe("resolveHitTarget", () => {
  it("ラベルの当たり判定は対応する text にすり替える", () => {
    const svg = buildSvg({ labels: ["a"] });
    injectHitAreas(svg);
    const rect = svg.querySelector('[data-editor-hit="label"]')!;
    expect(resolveHitTarget(rect).tagName).toBe("text");
  });

  it("矢印の当たり判定はそのまま返す (closest で edge group を辿れるため)", () => {
    const svg = buildSvg({ edges: [{ id: "e0", d: "M 0 0 L 1 0" }] });
    injectHitAreas(svg);
    const hit = svg.querySelector('[data-editor-hit="edge"]')!;
    expect(resolveHitTarget(hit)).toBe(hit);
  });

  it("当たり判定でない要素はそのまま返す", () => {
    const svg = buildSvg({ labels: ["a"] });
    const text = svg.querySelector("text")!;
    expect(resolveHitTarget(text)).toBe(text);
  });

  it("次の兄弟が text でなければすり替えない", () => {
    const svg = document.createElementNS(SVG_NS, "svg") as SVGSVGElement;
    const rect = document.createElementNS(SVG_NS, "rect");
    rect.setAttribute("data-editor-hit", "label");
    svg.appendChild(rect);
    expect(resolveHitTarget(rect)).toBe(rect);
  });
});
