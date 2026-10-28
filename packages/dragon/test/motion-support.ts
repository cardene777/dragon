/**
 * 描いた SVG の動きを、時刻を指して読む道具 (#3111)。
 *
 * 動きは全て 1 周 `timeline.total` 秒の CSS keyframes で、点の時刻は 1 周の中の割合 (%) で書かれている。
 * 部品の `style` の `animation-name` から keyframes を引き、性質ごとに前後の点の間を緩急どおりに補う。
 * jsdom は CSS の動きを進めないので、画面で見える値を keyframes から求める。
 */
import { expect } from "vitest";
import { draw, type Rendered } from "./render-support";

interface Frame {
  at: number;
  props: Record<string, string>;
  ease?: string;
}

/** `cubic-bezier(x1,y1,x2,y2)` の緩急。書かれていない区間は等速 (`.dg-a` の既定) */
function easing(spec: string | undefined): (x: number) => number {
  const m = /cubic-bezier\(([^)]+)\)/.exec(spec ?? "");
  if (!m) return (x) => x;
  const [x1, y1, x2, y2] = (m[1] as string).split(",").map(Number) as [number, number, number, number];
  const at = (t: number, a: number, b: number): number => 3 * a * t * (1 - t) ** 2 + 3 * b * t * t * (1 - t) + t ** 3;
  return (x) => {
    let lo = 0;
    let hi = 1;
    for (let i = 0; i < 60; i++) {
      const mid = (lo + hi) / 2;
      if (at(mid, x1, x2) < x) lo = mid;
      else hi = mid;
    }
    return at((lo + hi) / 2, y1, y2);
  };
}

/** SVG の `<style>` の keyframes を名前ごとに読む */
function keyframesOf(svg: string): Map<string, Frame[]> {
  const out = new Map<string, Frame[]>();
  for (const m of svg.matchAll(/@keyframes ([\w-]+)\{((?:[\d.]+%\{[^}]*\})*)\}/g)) {
    const frames = [...(m[2] as string).matchAll(/([\d.]+)%\{([^}]*)\}/g)].map((f): Frame => {
      const props: Record<string, string> = {};
      let ease: string | undefined;
      for (const d of (f[2] as string).split(";")) {
        const i = d.indexOf(":");
        if (d.slice(0, i) === "animation-timing-function") ease = d.slice(i + 1);
        else props[d.slice(0, i)] = d.slice(i + 1);
      }
      return { at: Number(f[1]), props, ...(ease ? { ease } : {}) };
    });
    out.set(m[1] as string, frames);
  }
  return out;
}

const numbers = (value: string): number[] => [...value.matchAll(/-?[\d.]+/g)].map((x) => Number(x[0]));

/** 描いた図を、時刻を指して読めるようにする */
export interface Motion {
  rendered: Rendered;
  doc: Document;
  /** 部品の性質 `prop` の、時刻 `t` 秒の値 (数の並び)。動かない性質は `undefined` */
  value(el: Element, prop: string, t: number): number[] | undefined;
  /** 部品と、それを包む部品の濃さを掛けた、時刻 `t` 秒の見える濃さ (0 から 1) */
  opacity(el: Element, t: number): number;
}

export function motionOf(diagram: unknown): Motion {
  return motionFrom(draw("renderDiagram")(diagram));
}

/** 描いた結果を、時刻を指して読めるようにする。言語を指して描いた見本を読む時はこれを使う */
export function motionFrom(rendered: Rendered): Motion {
  const doc = new DOMParser().parseFromString(rendered.svg, "image/svg+xml");
  const value = sampler(rendered.svg, rendered.timeline.total);
  const opacity = (el: Element, t: number): number => {
    let o = 1;
    for (let e: Element | null = el; e; e = e.parentElement) o *= Math.min(1, Math.max(0, value(e, "opacity", t)?.[0] ?? 1));
    return o;
  };
  return { rendered, doc, value, opacity };
}

/**
 * SVG の字の keyframes から、部品の性質 `prop` の時刻 `t` 秒の値 (数の並び) を求める。動かない性質は `undefined`。
 * 再生の部品に置いた寄って追う図のように、`renderDiagram` の `svg` でない SVG を読む時はこれを使う
 */
export function sampler(svg: string, total: number): (el: Element, prop: string, t: number) => number[] | undefined {
  const frames = keyframesOf(svg);
  expect(frames.size, "SVG に keyframes が無い").toBeGreaterThan(0);
  return (el: Element, prop: string, t: number): number[] | undefined => {
    const name = /animation-name:([\w-]+)/.exec(el.getAttribute("style") ?? "")?.[1];
    const points = (name ? (frames.get(name) ?? []) : []).filter((f) => prop in f.props);
    if (points.length === 0) return undefined;
    const pct = (Math.min(Math.max(t, 0), total) / total) * 100;
    const first = points[0] as Frame;
    if (pct <= first.at) return numbers(first.props[prop] as string);
    for (let i = 1; i < points.length; i++) {
      const a = points[i - 1] as Frame;
      const b = points[i] as Frame;
      if (pct > b.at) continue;
      const k = easing(a.ease)(b.at === a.at ? 1 : (pct - a.at) / (b.at - a.at));
      const to = numbers(b.props[prop] as string);
      return numbers(a.props[prop] as string).map((v, j) => v + ((to[j] ?? v) - v) * k);
    }
    return numbers((points[points.length - 1] as Frame).props[prop] as string);
  };
}
