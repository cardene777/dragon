/**
 * 帯のエディタのボタンとコピーの窓が、記法を外のサーバーへ送らないこと (#3697)。
 *
 * エディタのボタンは記法をブラウザの内で縮めてURLの`#z=`に詰め、縮めても長すぎる記法はクリップボードに写して`#paste`の編集画面を開く。
 * `#`の後ろは頁を配るサーバーに送られないので、ボタンとコピーの窓を押す間の通信に記法が乗らないことを、
 * build した`dist/frame.js`を`http://localhost/`の頁で読んで、頁が出した全ての通信を記録して確かめる。
 */
import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import type { Page, Request } from "playwright-core";
import { describe, expect, it } from "vitest";
import { fileChromium } from "./page-needs";

const ROOT = join(process.cwd(), "packages/dragon");
const DIST = join(ROOT, "dist");
/** エディタとdragonの印が開く見本帳 */
const GALLERY = "https://cardene777.github.io/dragon/";
/** 縮めて詰める記法 */
const SOURCE = "sequence 注文 🐉\nbox a as あなた\nbox b as 店\nstep 確認\n  a -> b: 注文を確かめる ✅";
/** 外へ出す通信の種類。頁の読み込みと新しいタブの頁 (`document`) のほかは出さない */
const SENDING = new Set(["fetch", "xhr", "ping", "beacon", "websocket", "eventsource", "other"]);

/** 縮めてもURLの上限を超える記法。決まった種から作る字の並びは縮みにくい */
function longSource(): string {
  let seed = 11;
  const next = (): number => (seed = (seed * 1103515245 + 12345) % 2 ** 31) / 2 ** 31;
  const word = (): string => Array.from({ length: 8 }, () => String.fromCharCode(97 + Math.floor(next() * 26))).join("");
  const lines = ["sequence 長い図", "box a as あなた", "box b as 店"];
  for (let i = 0; i < 600; i += 1) lines.push(`step ${word()}`, `  a -> b: ${word()} ${word()} ${word()}`);
  return lines.join("\n");
}

describe("エディタのボタンとコピーの窓の通信 (#3697)", () => {
  it("editor-open-sends-nothing", async () => {
    expect(existsSync(join(DIST, "frame.js")), "帯の入口の build した file (dist/frame.js) が無い").toBe(true);
    const LONG = longSource();
    const html =
      '<!doctype html><html lang="ja"><head><meta charset="utf-8">' +
      '<script type="importmap">{"imports":{"@cardenelabs/dragon":"/index.js"}}</script>' +
      '<style>html,body{margin:0}</style></head><body><div id="host" style="width:760px"></div><div id="host2" style="width:760px"></div>' +
      '<script type="module">Promise.all([import("/frame.js"), import("/index.js")]).then(([f, d]) => { window.dragonFrame = f; window.dragon = d; }, (e) => { window.frameError = String(e); });</script></body></html>';
    const context = await (await fileChromium()).newContext({ viewport: { width: 900, height: 900 } });
    try {
      await context.grantPermissions(["clipboard-read", "clipboard-write"], { origin: "http://localhost" });
      await context.route(`${GALLERY}**`, (route) => route.fulfill({ contentType: "text/html; charset=utf-8", body: "<!doctype html><title>gallery</title>" }));
      const page = await context.newPage();
      await page.route("http://localhost/**", (route) => {
        const path = new URL(route.request().url()).pathname;
        if (path === "/") return route.fulfill({ contentType: "text/html; charset=utf-8", body: html });
        const file = resolve(DIST, `.${path}`);
        if (path.endsWith(".js") && file.startsWith(`${DIST}/`) && existsSync(file)) {
          return route.fulfill({ contentType: "text/javascript", body: readFileSync(file) });
        }
        return route.fulfill({ status: 404 });
      });
      await page.goto("http://localhost/");
      await page.waitForFunction(() => "dragonFrame" in window || "frameError" in window);
      expect(await page.evaluate(() => (window as unknown as { frameError?: string }).frameError), "頁が帯の入口を読めない").toBeUndefined();

      // 図を置いた後に出た通信だけを数える
      const sent: Request[] = [];
      context.on("request", (request) => sent.push(request));
      await page.evaluate(
        ([source, long]) => {
          const w = window as unknown as {
            dragonFrame: { mountFramedDiagram(host: HTMLElement, source: string): unknown; createDragonFrame(d: Document, s: string, g: unknown): { frame: HTMLElement } };
            dragon: { parseNotation(s: string): { ok: boolean; diagram?: unknown } };
          };
          w.dragonFrame.mountFramedDiagram(document.getElementById("host")!, source);
          const parsed = w.dragon.parseNotation(long);
          document.getElementById("host2")!.append(w.dragonFrame.createDragonFrame(document, long, parsed.diagram).frame);
        },
        [SOURCE, LONG] as const,
      );
      const links = page.locator(".dg-header-actions > a.editor");
      await expect.poll(() => links.first().getAttribute("href"), { timeout: 3000 }).toMatch(/#z=/u);

      const popupOf = async (click: () => Promise<void>): Promise<string> => {
        const [popup] = await Promise.all([page.waitForEvent("popup", { timeout: 4000 }), click()]);
        const url = popup.url();
        await popup.close();
        return url;
      };
      const short = await popupOf(() => links.first().click());
      expect(short.startsWith(`${GALLERY}editor#z=`), `短い記法のエディタのタブ ${short}`).toBe(true);
      const long = await popupOf(() => links.nth(1).click());
      expect(long, "長い記法のエディタのタブ").toBe(`${GALLERY}editor#paste`);
      for (const kind of ["source", "image", "url"]) {
        await page.locator(".copy-toggle").first().click();
        await page.locator(`[data-menu="copy"] [data-copy="${kind}"]`).first().click();
      }
      await page.waitForTimeout(300);

      // 陰性でない対照。新しいタブの頁の読み込みを記録している (記録が空振りしていない)
      const gallery = sent.filter((request) => request.url().startsWith(GALLERY));
      expect(gallery.length, "記録した見本帳の頁の読み込みの数").toBeGreaterThanOrEqual(2);
      const outside = sent.filter((request) => !request.url().startsWith("http://localhost/") && !request.url().startsWith(GALLERY));
      expect(outside.map((request) => request.url()), "頁と見本帳のほかへ出た通信").toEqual([]);
      expect(sent.filter((request) => SENDING.has(request.resourceType())).map((request) => `${request.resourceType()} ${request.url()}`), "頁が出した送る通信").toEqual([]);
      const encoded = Buffer.from(SOURCE, "utf8").toString("base64url").slice(0, 24);
      const leaked = gallery.filter((request) => {
        const url = new URL(request.url());
        return url.search !== "" || url.hash !== "" || request.url().includes(encoded) || (request.postData() ?? "") !== "";
      });
      expect(leaked.map((request) => request.url()), "見本帳へ記法を乗せた通信").toEqual([]);
    } finally {
      await context.close();
    }
  });
});

export type { Page };
