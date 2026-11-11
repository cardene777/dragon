/**
 * 頁で描いた SVG を、字を埋めた 1 枚の SVG の文字列と、時刻を止めた絵にする (#3644)。
 *
 * 写しの SVG は頁の外で描かれるので、頁の CSS は届かない。字は `fonts.ts` が `data:` で埋めた `@font-face` を写しの頭に置く。
 * 写しの `style` には CSS の変数 (`--` で始まる物) だけを残し、頁に合わせた大きさや位置の指定を外す。
 * 時刻は命令の書き出し (`export/capture.ts`) と同じく、`--play` を `paused` にして `--at` に秒を入れて止める。
 * 写しを画像として読み、倍率を掛けた canvas に描く。
 */
import type { NotationLang } from "../words";
import { embeddedFontCss } from "./fonts";

const SVG_NS = "http://www.w3.org/2000/svg";

/** 図の大きさ (CSS の px)。`width` と `height` の値か、無ければ `viewBox` か、頁で描いた大きさ */
export function svgSize(svg: SVGSVGElement): { width: number; height: number } {
  const attr = (name: "width" | "height"): number | undefined => {
    const value = /^\s*(\d+(?:\.\d+)?)(?:px)?\s*$/u.exec(svg.getAttribute(name) ?? "")?.[1];
    return value === undefined ? undefined : Number(value);
  };
  const box = svg.viewBox?.baseVal;
  const shown = svg.getBoundingClientRect();
  const width = attr("width") ?? (box && box.width > 0 ? box.width : shown.width);
  const height = attr("height") ?? (box && box.height > 0 ? box.height : shown.height);
  return { width: Math.round(width), height: Math.round(height) };
}

/** 属性の値に入れる字を XML の形で書く */
const attrText = (text: string): string => text.replace(/&/gu, "&amp;").replace(/"/gu, "&quot;").replace(/</gu, "&lt;");

/** 頁に描いている図の時刻 (秒)。dragon の図の動き (`.dg-a`) から読み、動きの無い図は undefined */
export function shownAt(svg: SVGSVGElement): number | undefined {
  if (typeof svg.getAnimations !== "function") return undefined;
  const animations = svg.getAnimations({ subtree: true });
  const own = animations.filter((a) => {
    const target = (a.effect as KeyframeEffect | null)?.target;
    return target instanceof Element && target.classList.contains("dg-a");
  });
  for (const animation of own.length ? own : animations) {
    const timing = animation.effect?.getComputedTiming();
    const duration = Number(timing?.duration);
    if (timing?.progress === null || timing?.progress === undefined || !(duration > 0)) continue;
    return (timing.progress * duration) / 1000;
  }
  return undefined;
}

/** 図の 1 周の秒。図の `<style>` に書いた `--T` から読み、無い図は undefined */
export function cycleOf(svg: SVGSVGElement): number | undefined {
  for (const style of svg.querySelectorAll("style")) {
    const found = /--T:\s*(\d+(?:\.\d+)?)(m?s)\b/u.exec(style.textContent ?? "");
    if (found) return Number(found[1]) / (found[2] === "ms" ? 1000 : 1);
  }
  return undefined;
}

export interface Picture {
  width: number;
  height: number;
  /** 字を埋めた SVG。`style` は写した物のまま */
  svg(): string;
  /**
   * `t` 秒に止めた絵を、CSS の px の `scale` 倍の canvas に描く。`background` を渡すと先に地を塗る。
   * canvas は描くたびに同じ物を使い回すので、次に描く前に読み終える
   */
  draw(t: number, scale: number, background?: string): Promise<HTMLCanvasElement>;
}

/**
 * 頁の SVG を写して字を埋める。`film` の時は写しの `--T` と `--at` と `--play` を外し、図の `<style>` の 1 周の長さで撮る。
 * 再生の部品が流す速さに合わせて書き換えた長さ (#3568) で撮らないため
 */
export async function picture(svg: SVGSVGElement, lang: NotationLang, film = false): Promise<Picture> {
  const { width, height } = svgSize(svg);
  const css = await embeddedFontCss(svg, lang);
  const copy = svg.cloneNode(true) as SVGSVGElement;
  copy.setAttribute("width", String(width));
  copy.setAttribute("height", String(height));
  const kept: string[] = [];
  for (let i = 0; i < svg.style.length; i++) {
    const name = svg.style.item(i);
    if (name.startsWith("--") && !(film && (name === "--T" || name === "--at" || name === "--play"))) kept.push(`${name}:${svg.style.getPropertyValue(name)}`);
  }
  copy.removeAttribute("style");
  if (css !== "") {
    const style = svg.ownerDocument.createElementNS(SVG_NS, "style");
    style.textContent = css;
    copy.insertBefore(style, copy.firstChild);
  }
  const body = new XMLSerializer().serializeToString(copy);
  const withStyle = (style: string[]): string => (style.length ? body.replace(/^<svg\b/u, `<svg style="${attrText(style.join(";"))}"`) : body);
  const canvas = svg.ownerDocument.createElement("canvas");
  return {
    width,
    height,
    svg: () => withStyle(kept),
    async draw(t, scale, background) {
      const url = URL.createObjectURL(new Blob([withStyle([...kept.filter((p) => !/^--(?:at|play):/u.test(p)), "--play:paused", `--at:${t}`])], { type: "image/svg+xml" }));
      try {
        const image = new Image();
        image.src = url;
        await image.decode();
        canvas.width = Math.round(width * scale);
        canvas.height = Math.round(height * scale);
        const context = canvas.getContext("2d") as CanvasRenderingContext2D;
        if (background) {
          context.fillStyle = background;
          context.fillRect(0, 0, canvas.width, canvas.height);
        }
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        return canvas;
      } finally {
        URL.revokeObjectURL(url);
      }
    },
  };
}
