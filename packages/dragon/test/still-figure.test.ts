// @vitest-environment jsdom
/**
 * 頁に止めて置く図 (#3801)。
 *
 * レポートや説明の頁は、図を段で送らずに最後の段の形を 1 枚で置きたい。
 * `renderDiagram` に `figure: true` を渡すと、止め絵の時刻を図の中に書き込み、再生の部品が無くても最後の段の形を描く。
 * 段の番号の丸を出さず、量の図は段の名前の所に図の題を出し、字の並びは一般の sans-serif に落ちる。
 * 色は頁の `data-theme` と `prefers-color-scheme` に従って暗い色に変わる。
 *
 * 頁の塊は属性 `data-still` を持つ時、再生の部品を置かずにこの SVG に置き換わる。
 * `dragon embed` は止めて置く塊を SVG に描いてから埋め、動く塊が残らない頁には束ねた script を入れない。
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { parseNotation, renderDiagram } from "../src/api";
import { embedPageWith } from "../src/export/embed";
import "../src/kinds/basics";
import "../src/kind-use/chart";
import "../src/kind-use/flow";
import "../src/kind-use/sequence";
import { cdnPage, escapeHtml, withSite } from "./cdn-page-support";

const ROOT = process.cwd();

/** 横棒の量の図。段の名前 (注ぐ) と図の題 (注いだお湯の量) が違う */
const BAR = "chart 注いだお湯の量 [shape: bar]\n\nitem bloom as 蒸らし\nitem first as 1回目まで\n\nstep 注ぐ\n  say 3回に分けて注ぐ。\n  set bloom: 30\n  set first: 120\n";
/** ドーナツの量の図 */
const DONUT = "chart 種類ごとの割合 [shape: donut]\n\nitem bread as パン\nitem sweets as 菓子パン\n\nstep 今週\n  say 売り上げの内訳。\n  set bread: 268\n  set sweets: 141\n";
/** 段の番号の丸を描く時系列図 */
const SEQUENCE = "sequence 注文\n\nbox user as 利用者\nbox shop as 店\n\nstep 頼む\n  user -> shop: 注文\nstep 返す\n  shop -> user: 受付\n";
/** 誤りのある記法 */
const BROKEN = "chart 壊れた図 [shape: bar]\n\nitem a as 項目\n\nstep 段\n  set a: たくさん\n";

/** 図を待つ長さ。1 件の上限 (10 秒) より短く待つ */
const WAIT = 6_000;

function read(source: string) {
  const parsed = parseNotation(source, { lang: "ja" });
  if (!parsed.ok) throw new Error(parsed.errors.map((e) => `${e.line}: ${e.message}`).join("\n"));
  return parsed.diagram;
}

const figure = (source: string) => renderDiagram(read(source), { lang: "ja", still: true, figure: true });
const styleOf = (svg: string): string => /<style>([\s\S]*?)<\/style>/u.exec(svg)?.[1] ?? "";
const idOf = (svg: string): string => /class="dg dg-([A-Za-z0-9_-]+)"/u.exec(svg)?.[1] ?? "";
/** 図の根の規則 (`.dg-<id>{...}`) の中身を全て繋げた字 */
const rootRules = (svg: string): string => {
  const id = idOf(svg);
  return [...styleOf(svg).matchAll(new RegExp(`(?:^|\\})\\.dg-${id}\\{([^}]*)\\}`, "gu"))].map((m) => m[1]).join(";");
};
const varOf = (rules: string, name: string): string | undefined => new RegExp(`(?:^|;)--${name}:([^;]+)`, "u").exec(rules)?.[1];

const stillBlock = (source: string): string => `<pre class="dragon" data-still>${escapeHtml(source)}</pre>`;
const movingBlock = (source: string): string => `<pre class="dragon">${escapeHtml(source)}</pre>`;

describe("止めて置く図を描く", () => {
  it("still-figure-hides-step-badges", () => {
    expect(figure(SEQUENCE).svg).not.toMatch(/class="dg-bd"/u);
    expect(figure(BAR).svg).not.toMatch(/class="dg-bd"/u);
  });

  it("still-figure-freezes-at-last-step", () => {
    for (const source of [SEQUENCE, BAR]) {
      const rendered = figure(source);
      const last = rendered.timeline.stills[rendered.timeline.steps.length - 1];
      const rules = rootRules(rendered.svg);
      expect(varOf(rules, "at")).toBe(String(last));
      expect(varOf(rules, "play")).toBe("paused");
    }
  });

  it("still-figure-bar-chart-shows-title", () => {
    const { svg } = figure(BAR);
    expect(svg).toContain('data-chart-title="注いだお湯の量"');
    expect(svg).not.toContain('data-chart-title="注ぐ"');
  });

  it("still-figure-donut-shows-title", () => {
    const { svg } = figure(DONUT);
    expect(svg).toContain('data-chart-title="種類ごとの割合"');
    expect(svg).not.toContain('data-chart-title="今週"');
  });

  it("still-figure-font-has-fallback-stack", () => {
    const rules = rootRules(figure(BAR).svg);
    // 同じ変数が 2 度在る時は後の値が勝つ
    const sans = [...rules.matchAll(/(?:^|;)--sans:([^;]+)/gu)].at(-1)?.[1] ?? "";
    const mono = [...rules.matchAll(/(?:^|;)--mono:([^;]+)/gu)].at(-1)?.[1] ?? "";
    expect(sans).toMatch(/,\s*sans-serif$/u);
    expect(mono).toMatch(/,\s*monospace$/u);
  });

  it("still-figure-follows-page-theme", () => {
    const { svg } = figure(BAR);
    const id = idOf(svg);
    const style = styleOf(svg);
    const light = varOf(rootRules(svg), "bg");
    const darkRule = new RegExp(`:root\\[data-theme="dark"\\] \\.dg-${id}\\{([^}]*)\\}`, "u").exec(style)?.[1] ?? "";
    const mediaRule = new RegExp(`@media \\(prefers-color-scheme: ?dark\\)\\{:root:not\\(\\[data-theme="light"\\]\\) \\.dg-${id}\\{([^}]*)\\}\\}`, "u").exec(style)?.[1] ?? "";
    expect(light).toBeDefined();
    expect(varOf(darkRule, "bg")).toBeDefined();
    expect(varOf(darkRule, "bg")).not.toBe(light);
    expect(varOf(mediaRule, "bg")).toBe(varOf(darkRule, "bg"));
  });

  it("still-figure-off-keeps-render", () => {
    const { svg } = renderDiagram(read(SEQUENCE), { lang: "ja" });
    expect(svg).toMatch(/class="dg-bd"/u);
    expect(varOf(rootRules(svg), "play")).toBeUndefined();
  });
});

describe("頁の塊を止めて置く", () => {
  it("page-still-block-places-svg-without-player", async () => {
    const found = await withSite({ "index.html": cdnPage(stillBlock(BAR)) }, "index.html", async (page) => {
      await page.waitForSelector("svg.dg", { timeout: WAIT }).catch(() => undefined);
      return page.evaluate(() => ({
        svg: document.querySelectorAll("svg.dg").length,
        player: document.querySelectorAll(".dg-player, .dg-bar, .dg-btn").length,
        block: document.querySelectorAll("pre.dragon").length,
        title: document.querySelector("[data-chart-title]")?.getAttribute("data-chart-title") ?? "",
      }));
    });
    expect(found).toEqual({ svg: 1, player: 0, block: 0, title: "注いだお湯の量" });
  });

  it("page-still-block-shows-notation-errors", async () => {
    const found = await withSite({ "index.html": cdnPage(stillBlock(BROKEN)) }, "index.html", async (page) => {
      await page.waitForSelector("pre.dragon-error", { timeout: WAIT }).catch(() => undefined);
      return page.evaluate(() => ({ errors: document.querySelectorAll("pre.dragon-error").length, svg: document.querySelectorAll("svg.dg").length }));
    });
    expect(found).toEqual({ errors: 1, svg: 0 });
  });
});

describe("止めて置く塊を埋める", () => {
  /** 束ねた script の代わりの字。中身を読まずに、入ったかだけを見る */
  const SCRIPT = "/* offline bundle */";

  it("embed-still-only-page-has-no-script", () => {
    const html = embedPageWith(cdnPage(stillBlock(BAR) + stillBlock(DONUT)), SCRIPT) ?? "";
    expect(html.match(/<svg[^>]*class="dg dg-/gu)?.length).toBe(2);
    expect(html).not.toContain(SCRIPT);
    expect(html).not.toMatch(/dist\/cdn\/dragon\.js/u);
    expect(html).not.toMatch(/<pre\b[^>]*class="dragon"/u);
  });

  it("embed-mixed-page-keeps-script", () => {
    const html = embedPageWith(cdnPage(stillBlock(BAR) + movingBlock(SEQUENCE)), SCRIPT) ?? "";
    expect(html.match(/<svg[^>]*class="dg dg-/gu)?.length).toBe(1);
    expect(html).toContain(SCRIPT);
    expect(html.match(/<pre class="dragon">/gu)?.length).toBe(1);
  });
});

describe("止めて置く図の書き方を文書に書く", () => {
  it("still-figure-docs-name-data-still", () => {
    for (const path of ["packages/dragon/README.ja.md", "packages/dragon/README.md", "plugins/dragon/skills/dragon/references/embed.md"]) {
      const text = readFileSync(join(ROOT, path), "utf8");
      expect(text, path).toContain("data-still");
      expect(text, path).toMatch(/figure: true/u);
    }
  });
});
