// @vitest-environment jsdom
/**
 * 書き出した HTML と `dragon embed` が埋めた頁で、収めた配管の図の並べ方を使って道を探さずに描く (#3748)。
 *
 * 並べ方の覚えは module の中に在るので、頁で描く前に module を読み直し (`vi.resetModules`)、覚えの無い状態から描く。
 * 道を探した回数は、読み直した module の `Router` の `route` を数える。
 */
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { planPage } from "../src/export/page";
import { pageHtml } from "../src/export/html";
import { parseNotation } from "../src/parser";
import { ONE_FOLD, TWO_FOLDS } from "./pipe-stored-layout-support";

type Stored = { key: string; layout: unknown };

const SEQUENCE = "sequence 挨拶\n\nactor a as A\nactor b as B\n\nstep 1\n  a -> b: こんにちは\n";
const ENTRY = '<script type="module" src="https://cdn.jsdelivr.net/npm/@cardenelabs/dragon@0.77.1/dist/cdn/dragon.js"></script>';
const escape = (text: string): string => text.replace(/&/gu, "&amp;").replace(/</gu, "&lt;").replace(/>/gu, "&gt;");

function read(text: string): unknown {
  const parsed = parseNotation(text, { lang: "ja" });
  expect(parsed.ok, "見本の記法を読めない").toBe(true);
  return (parsed as unknown as { diagram: unknown }).diagram;
}

/** module を読み直し、覚えの無い描く部品と、道を探した回数を数える関数を返す */
async function fresh(): Promise<{ routeCalls: () => number; player: typeof import("../src/player"); blocks: typeof import("../src/page-blocks") }> {
  vi.resetModules();
  // 種類の部品を登録する入口を先に読む
  await import("../src/index");
  const { Router } = await import("../src/pipe-route");
  let calls = 0;
  const route = Router.prototype.route;
  Router.prototype.route = function (this: InstanceType<typeof Router>, ask: Parameters<typeof route>[0]) {
    calls++;
    return route.call(this, ask);
  };
  return { routeCalls: () => calls, player: await import("../src/player"), blocks: await import("../src/page-blocks") };
}

/** 頁の記法の塊を描き終えるまで待つ */
async function settle(doc: Document): Promise<void> {
  for (let i = 0; i < 50 && doc.querySelector("pre.dragon"); i++) await new Promise((done) => setTimeout(done, 0));
}

afterEach(() => {
  document.body.innerHTML = "";
  document.documentElement.lang = "";
});

describe("書き出した頁 (#3748)", () => {
  it("exported-page-draws-pipe-without-route", async () => {
    const plan = planPage(read(ONE_FOLD), { lang: "ja" });
    const html = pageHtml(plan, "", "");
    const page = new DOMParser().parseFromString(html, "text/html");
    const layouts = page.getElementById("dragon-layouts");
    expect(layouts, "書き出した HTML に収めた並べ方の要素 (`#dragon-layouts`) が無い").not.toBeNull();
    const source: unknown = JSON.parse(page.getElementById("dragon-diagram")?.textContent ?? "null");
    const stored = JSON.parse(layouts?.textContent ?? "[]") as Stored[];
    const { routeCalls, player } = await fresh();
    const host = document.createElement("div");
    document.body.appendChild(host);
    const drawn = player.mountDiagram(host, source, { lang: "ja", layouts: stored } as Parameters<typeof player.mountDiagram>[2]);
    try {
      expect(host.querySelector("svg"), "頁に図を描かない").not.toBeNull();
      expect(routeCalls(), "書き出した頁で最初に描く時に道を探した回数").toBe(0);
      const folded = host.querySelector("[data-pipe-fold]");
      expect(folded, "畳んだ箱が無い").not.toBeNull();
      const steps = (): number => host.querySelectorAll('[data-dragon="steps"] > li').length;
      const before = steps();
      folded?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      expect(steps(), "畳んだ箱を押しても開かない").toBeGreaterThan(before);
      expect(routeCalls(), "畳んだ箱を押して開いた時に道を探した回数").toBe(0);
    } finally {
      drawn.destroy();
    }
  });
});

describe("dragon embed が埋めた頁 (#3748)", () => {
  type Embed = { pageBlockLayouts?: (html: string) => Stored[]; embedPageWith?: (html: string, script: string) => string | undefined };
  const embedPart = async (): Promise<Embed> => {
    const entry = join(process.cwd(), "packages/dragon/src/export/embed.ts");
    return ((await import(/* @vite-ignore */ entry).catch(() => undefined)) ?? {}) as Embed;
  };
  const page = (body: string): string => `<!doctype html><html lang="ja"><head>${ENTRY}</head><body>${body}</body></html>`;
  const pipeBlocks = `<pre class="dragon">${escape(ONE_FOLD)}</pre><pre class="dragon">${escape(SEQUENCE)}</pre><pre class="dragon">${escape(TWO_FOLDS)}</pre>`;

  it("embed-stores-pipe-layouts", async () => {
    const { pageBlockLayouts, embedPageWith } = await embedPart();
    expect(pageBlockLayouts, "頁の配管の図の塊の並べ方を組む pageBlockLayouts が export/embed.ts に無い").toBeTypeOf("function");
    expect(embedPageWith, "埋める script を受けて頁を組む embedPageWith が export/embed.ts に無い").toBeTypeOf("function");
    const html = page(pipeBlocks);
    const stored = pageBlockLayouts?.(html) ?? [];
    expect(stored.length, "箱が 1 つの図と 2 つの図の塊で収めた並べ方の数 (2 と 3)").toBe(5);
    expect(new Set(stored.map((s) => s.key)).size, "収めた並べ方の鍵が重なる").toBe(5);
    const embedded = embedPageWith?.(html, "/* offline */") ?? "";
    const element = /<script type="application\/json" id="dragon-layouts">([^<]*)<\/script>/u.exec(embedded);
    expect(element, "埋めた頁に収めた並べ方の要素 (`#dragon-layouts`) が無い").not.toBeNull();
    expect((JSON.parse(element?.[1] ?? "[]") as Stored[]).map((s) => s.key), "埋めた頁に収めた並べ方の鍵").toEqual(stored.map((s) => s.key));
    expect(embedded.indexOf("dragon-layouts"), "収めた並べ方の要素が、埋めた script より後に在る").toBeLessThan(embedded.indexOf("/* offline */"));
  });

  it("embedded-page-draws-pipe-without-route", async () => {
    const { pageBlockLayouts } = await embedPart();
    expect(pageBlockLayouts, "頁の配管の図の塊の並べ方を組む pageBlockLayouts が export/embed.ts に無い").toBeTypeOf("function");
    const body = `<pre class="dragon">${escape(ONE_FOLD)}</pre>`;
    const stored = pageBlockLayouts?.(page(body)) ?? [];
    const { routeCalls, blocks } = await fresh();
    document.documentElement.lang = "ja";
    document.body.innerHTML = `${body}<script type="application/json" id="dragon-layouts">${JSON.stringify(stored).replace(/</gu, "\\u003c")}</script>`;
    blocks.drawPageBlocks(document, async () => undefined);
    await settle(document);
    expect(document.querySelector(".dragon-figure svg"), "埋めた頁の塊を図に置き換えない").not.toBeNull();
    expect(routeCalls(), "埋めた頁で配管の図の塊を描いた時に道を探した回数").toBe(0);
  });

  it("page-blocks-compose-pipe-without-stored-layouts", async () => {
    const { routeCalls, blocks } = await fresh();
    document.documentElement.lang = "ja";
    document.body.innerHTML = `<pre class="dragon">${escape(ONE_FOLD)}</pre>`;
    blocks.drawPageBlocks(document, async () => undefined);
    await settle(document);
    expect(document.querySelector(".dragon-figure svg"), "並べ方を収めていない頁の塊を図に置き換えない").not.toBeNull();
    expect(routeCalls(), "並べ方を収めていない頁で、頁が並べ方を組まない").toBeGreaterThan(0);
  });
});
