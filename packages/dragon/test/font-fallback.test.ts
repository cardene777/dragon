/**
 * 同梱した字を読まない頁でも、図の字と帯の字がゴシックで出る (#3847)。
 *
 * 字の変数 (`--sans` と `--mono`) は、同梱した字の後に代わりの字を並べて総称の字で終える。
 * 頁は `http://localhost/` に置いた Chromium で開き、script の1行の入口と塊は build した `dist/cdn` から渡す。
 * 頁は `lang` を英語にする。日本語の頁では Chromium が日本語の既定の字 (macOS ではヒラギノ角ゴ) を選ぶため、代わりの字が無くても明朝が出ない。
 * Noto Sans JP の無い形は、頁が同梱の字の CSS を読まず、入口の並びの `"Noto Sans JP"` を在らない字の名前に替えて作る。
 * 端末に Noto Sans JP が入っていても、入っていない端末と同じ順に字を選ぶ。
 * Noto Sans JP の在る形は、同梱の字の CSS と字の file を package の依存から返す。
 * 描いた字の書体は Chromium の CDP (`CSS.getPlatformFontsForNode`) で読む。
 * 頁を開いて読む仕事は file を読み込む段 (`at-load.ts`) で済ませ、件は読んだ値を確かめる (#3816)。
 */
import { existsSync, readFileSync } from "node:fs";
import { dirname, extname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { Page } from "playwright-core";
import { describe, expect, it } from "vitest";

import { atLoad } from "./at-load";
import { cdnPage, escapeHtml } from "./cdn-page-support";
import { MONO_STACK, SANS_STACK } from "./font-stacks";
import { fileChromium } from "./page-needs";
import { PAGE_LIMIT_MS, within } from "./page-wait";

const PACKAGE = join(dirname(fileURLToPath(import.meta.url)), "..");
const REPO = join(PACKAGE, "../..");
const CDN = join(PACKAGE, "dist/cdn");
const FONTSOURCE = join(PACKAGE, "node_modules/@fontsource-variable");
const SITE = "http://localhost/";
/** jsDelivr の dragon の入口と塊 */
const DRAGON = /^https:\/\/cdn\.jsdelivr\.net\/npm\/@cardenelabs\/dragon@[^/]+\/dist\/cdn\/([^?#]+)$/u;
/** jsDelivr の fontsource の字の CSS と字の file */
const FONT = /^https:\/\/cdn\.jsdelivr\.net\/npm\/@fontsource-variable\/([a-z-]+)@[^/]+\/([^?#]+)$/u;
const TYPES: Readonly<Record<string, string>> = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript",
  ".css": "text/css",
  ".woff2": "font/woff2",
};

/** 帯の題と説明文と、等幅の字の札を持つ時系列図 */
const SOURCE =
  "sequence 注文を受ける\n\nbox user as 利用者\nbox shop as 店\n\nstep 注文を送る\n  say 利用者が店に注文を送る。\n  user -> shop: order()\nstep 受付を返す\n  say 店が受付の番号を返す。\n  shop -> user: 受付\n";

/** 明朝と、欧文の明朝 (serif) の書体の名前 */
const SERIF = /Mincho|Times|Serif|明朝/iu;
/** CDP で読む字の要素の数の上限。図の字は件ごとに数十あり、全てを読むと頁の仕事が長くなる */
const READ_LIMIT = 40;

/** 頁の字の形。`missing` は同梱の字を読まず Noto Sans JP も無い形、`bundled` は同梱の字を読む形 */
type Fonts = "missing" | "bundled";

interface FontRead {
  /** 再生の部品の帯の根が持つ字の変数 */
  bar: { sans: string; mono: string };
  /** 計算した `font-family`。図の字は違う値ごとに 1 つ */
  family: { svg: string[]; title: string; body: string };
  /** Chromium が描いた書体の名前 */
  used: { svg: string[]; title: string[]; body: string[] };
}

/** 頁で描いた図の字と帯の字の書体を読む */
async function read(page: Page): Promise<FontRead> {
  const cdp = await page.context().newCDPSession(page);
  await cdp.send("DOM.enable");
  await cdp.send("CSS.enable");
  const { root } = await cdp.send("DOM.getDocument", { depth: -1 });
  const used = async (selector: string): Promise<string[]> => {
    const { nodeIds } = await cdp.send("DOM.querySelectorAll", { nodeId: root.nodeId, selector });
    const names = new Set<string>();
    for (const nodeId of nodeIds.slice(0, READ_LIMIT)) {
      const { fonts } = await cdp.send("CSS.getPlatformFontsForNode", { nodeId });
      for (const font of fonts) names.add(font.familyName);
    }
    return [...names].sort();
  };
  const computed = await page.evaluate(() => {
    const player = document.querySelector(".dg-player");
    const style = player ? getComputedStyle(player) : undefined;
    const family = (el: Element | null): string => (el ? getComputedStyle(el).fontFamily : "");
    return {
      bar: { sans: style?.getPropertyValue("--sans").trim() ?? "", mono: style?.getPropertyValue("--mono").trim() ?? "" },
      family: {
        svg: [...new Set([...document.querySelectorAll(".dg-player svg.dg text")].map((el) => getComputedStyle(el).fontFamily))].sort(),
        title: family(document.querySelector(".dg-tt")),
        body: family(document.querySelector(".dg-tb")),
      },
    };
  });
  return { ...computed, used: { svg: await used(".dg-player svg.dg text"), title: await used(".dg-tt"), body: await used(".dg-tb") } };
}

/** `fonts` の形の頁を開き、図の字と帯の字の書体を読む */
async function readFonts(fonts: Fonts): Promise<FontRead> {
  const context = await (await fileChromium()).newContext({ viewport: { width: 900, height: 900 }, reducedMotion: "reduce" });
  await context.route("**/*", async (route) => {
    const url = route.request().url();
    const dragon = DRAGON.exec(url)?.[1];
    if (dragon !== undefined) {
      const file = join(CDN, dragon);
      if (!existsSync(file)) return route.fulfill({ status: 404, body: "" });
      const body = readFileSync(file);
      // Noto Sans JP の無い形では、並びの "Noto Sans JP" だけを在らない字の名前に替える。同梱した字の "Noto Sans JP Variable" は替えない
      const served = fonts === "missing" && extname(file) === ".js" ? body.toString("utf8").replaceAll('"Noto Sans JP"', '"Noto Sans JP absent"') : body;
      return route.fulfill({ contentType: TYPES[extname(file)] ?? "application/octet-stream", body: served });
    }
    const font = FONT.exec(url);
    if (font) {
      if (fonts === "missing") return route.fulfill({ contentType: "text/css", body: "" });
      const file = join(FONTSOURCE, font[1] ?? "", font[2] ?? "");
      if (!existsSync(file)) return route.fulfill({ status: 404, body: "" });
      return route.fulfill({ contentType: TYPES[extname(file)] ?? "application/octet-stream", body: readFileSync(file) });
    }
    if (url === `${SITE}index.html`) {
      return route.fulfill({ contentType: TYPES[".html"], body: cdnPage(`<pre class="dragon">${escapeHtml(SOURCE)}</pre>`, "en") });
    }
    return route.abort();
  });
  try {
    const page = await context.newPage();
    await page.goto(`${SITE}index.html`);
    await page.waitForFunction(() => document.querySelector(".dg-player svg.dg text") !== null && Boolean(document.querySelector(".dg-tb")?.textContent), null, {
      timeout: 8_000,
    });
    await page.evaluate(() => document.fonts.ready);
    return await read(page);
  } finally {
    await context.close();
  }
}

const MISSING = await atLoad("同梱の字を読まず Noto Sans JP も無い形の頁を開き、図と帯の字の書体を読む", () =>
  within(readFonts("missing"), PAGE_LIMIT_MS, "Noto Sans JP の無い頁の仕事"),
);
const BUNDLED = await atLoad("同梱の字を読む頁を開き、図と帯の字の書体を読む", () =>
  within(readFonts("bundled"), PAGE_LIMIT_MS, "同梱の字を読む頁の仕事"),
);

const text = (path: string): string => readFileSync(join(REPO, path), "utf8");

describe("同梱した字を読まない頁の字 (#3847)", () => {
  it("player-bar-font-has-fallback-stack", () => {
    // 帯の付かない再生の部品の帯も、図と同じ並びを持つ
    const { bar } = MISSING.get();
    expect(bar.sans, "帯の --sans の並び").toBe(SANS_STACK);
    expect(bar.mono, "帯の --mono の並び").toBe(MONO_STACK);
  });

  it("gothic-without-noto", () => {
    const { family, used } = MISSING.get();
    expect(used.svg.length, "図の字の書体を読めない").toBeGreaterThan(0);
    expect(used.title.length, "帯の題の書体を読めない").toBeGreaterThan(0);
    expect(used.body.length, "帯の説明文の書体を読めない").toBeGreaterThan(0);
    expect([...used.svg, ...used.title, ...used.body].filter((name) => SERIF.test(name)), "明朝か Times で描いた字の書体").toEqual([]);
    for (const value of family.svg) expect(value, "図の字の font-family").toMatch(/(?:sans-serif|monospace)$/u);
    expect(family.title, "帯の題の font-family").toMatch(/sans-serif$/u);
    expect(family.body, "帯の説明文の font-family").toMatch(/sans-serif$/u);
  });

  it("same-font-with-noto", () => {
    // 同梱の字を読む頁では、今と同じく同梱した 2 つの字だけで描く
    const { used } = BUNDLED.get();
    const all = [...used.svg, ...used.title, ...used.body];
    expect(all.length, "字の書体を読めない").toBeGreaterThan(0);
    expect(all.filter((name) => !/^(?:Noto Sans JP|JetBrains Mono)\b/u.test(name)), "同梱した字の他の書体").toEqual([]);
  });

  it("docs-describe-gothic-fallback", () => {
    // 同梱の字を読まない頁で何が起きるかを、使い方の頁、package の README、プラグインの文書が同じく書く
    const readme = text("packages/dragon/README.md");
    const readmeJa = text("packages/dragon/README.ja.md");
    const content = text("apps/playground-spa/src/docs/content.ts");
    const setup = text("plugins/dragon/skills/dragon/references/setup.md");
    expect(readme, "README.md が字の幅の違いを書かない").toContain("a few pixels wider");
    expect(setup, "setup.md が字の幅の違いを書かない").toContain("a few pixels wider");
    expect(content, "使い方の頁の英語が字の幅の違いを書かない").toContain("a few pixels wider");
    expect(readmeJa, "README.ja.md が字の幅の違いを書かない").toContain("数px広くなることがある");
    expect(content, "使い方の頁の日本語が字の幅の違いを書かない").toContain("数px広くなることがある");
    for (const [where, body] of [
      ["README.md", readme],
      ["README.ja.md", readmeJa],
      ["使い方の頁", content],
    ] as const) {
      expect(body, `${where} が字がはみ出すと書いたまま`).not.toContain("drawn in the device's fonts and text can overflow");
      expect(body, `${where} が字がはみ出すと書いたまま`).not.toContain("端末の字で描かれ、札から字がはみ出す");
    }
    // dragon embed で埋めた頁と保存した HTML も、同梱の字の後に並べた端末のゴシックで描く
    expect(readme).not.toContain("draws in the device's fonts because the bundled fonts are not embedded");
    expect(readmeJa).not.toContain("同梱の字を埋めないので端末の字で描く");
    // 仕様の `render-uses-bundled-fonts` を名指す行は、端末の字に落ちないと書かない
    const spec = text(".ikkan/specs/diagram-core.md")
      .split("\n")
      .filter((line) => line.includes("render-uses-bundled-fonts"));
    expect(spec.length, "仕様に render-uses-bundled-fonts を名指す行が無い").toBeGreaterThan(0);
    expect(spec.filter((line) => line.includes("端末の字に落ちない")), "端末の字に落ちないと書く仕様の行").toEqual([]);
  });
});
