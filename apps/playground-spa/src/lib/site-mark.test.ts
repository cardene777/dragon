// @vitest-environment jsdom
/**
 * 見本帳の見出しの印とファビコンは、図の帯の印と同じ段の鱗を描く (#3713)。
 *
 * 帯の印は package の帯の頭 (`@cardenelabs/dragon/header`) が描く形を正とし、見出しの印とファビコンの面の形をそれと比べる。
 * 見出しの印は頁の側で SVG を組まないので、見た目の file が `url()` で名指す画像の形を読む。
 * ファビコンは `index.html` の `<link rel="icon">` が名指す画像の形を読む。
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { createFigureHeader } from "@cardenelabs/dragon/header";
import { describe, expect, it } from "vitest";

import { app } from "./site-build";

/** 帯の印が描く形。`viewBox`と面ごとの`d` */
function barMark(): { viewBox: string; paths: string[] } {
  const { element } = createFigureHeader(document, { title: "注文", mark: { href: "https://cardene777.github.io/dragon/", label: "dragon" }, styles: false });
  const svg = element.querySelector("a.dg-mark svg");
  return { viewBox: svg?.getAttribute("viewBox") ?? "", paths: [...(svg?.querySelectorAll("path") ?? [])].map((path) => path.getAttribute("d") ?? "") };
}

/** 見本帳の置き場の画像の file の形。頁の経路 (`/icon.svg`) は `public/` の下を指す */
function imageMark(href: string): { viewBox: string; paths: string[] } {
  const svg = new DOMParser().parseFromString(readFileSync(join(app, "public", href.replace(/^\//u, "")), "utf8"), "image/svg+xml").documentElement;
  return { viewBox: svg.getAttribute("viewBox") ?? "", paths: [...svg.querySelectorAll("path")].map((path) => path.getAttribute("d") ?? "") };
}

/** 見た目の file の、`.site-mark` だけを選ぶ規則の中身 */
function siteMarkRule(): string {
  const css = readFileSync(join(app, "src/site/site.css"), "utf8");
  return /^\.site-mark\s*\{([^}]*)\}/mu.exec(css)?.[1] ?? "";
}

describe("見本帳の印 (#3713)", () => {
  // 見出しの印とファビコンは、帯の印と同じ段の鱗を描き、今の矢じりと波線を描かない
  it("site-mark-and-favicon-match-the-bar-mark", () => {
    const bar = barMark();
    expect(bar.paths.length, "帯の印が面を持たない").toBeGreaterThan(0);

    const rule = siteMarkRule();
    expect(rule, "見た目の file に .site-mark の規則が無い").not.toBe("");
    expect(rule, "見出しの印が矢じりの形で切り抜いている").not.toMatch(/polygon\(/u);
    const site = /url\(\s*["']?([^"')]+)["']?\s*\)/u.exec(rule)?.[1];
    expect(site, "見出しの印が画像の形を名指さない").toBeDefined();
    expect(imageMark(site!), "見出しの印が帯の印と違う形を描く").toEqual(bar);

    const html = readFileSync(join(app, "index.html"), "utf8");
    const icon = /<link\b[^>]*\brel="icon"[^>]*\bhref="([^"]+)"/u.exec(html)?.[1];
    expect(icon, "index.html がファビコンを名指さない").toBeDefined();
    const favicon = imageMark(icon!);
    expect(favicon, "ファビコンが帯の印と違う形を描く").toEqual(bar);
  });
});
