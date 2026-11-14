/**
 * 見本帳の埋め込みの頁 (#3700)。
 *
 * 外の頁がiframeで`/dragon/embed#z=<縮めた記法>`か`#n=<記法>`を開くと、埋め込みの頁は記法を帯つきの図にし、
 * 描けた・描けなかった、段が変わった、エクスポートした、エディタで開いた・コピーしたの4つを、置いた頁へ`postMessage`で送る。
 * 送る形は`{ source: "dragon", type, detail }`で、`type`と`detail`はSDKの要素が送る知らせと同じ。
 *
 * build した見本帳を`http://localhost/dragon/`に置き、別の置き場 (`http://parent.test/`) の頁にiframeで開いて確かめる。
 * 見本帳の置き場はGitHub Pagesと同じく、拡張子の無い経路に同じ名前の`.html`を返し、無い経路に`404.html`を404で返す。
 */
import { existsSync, readFileSync, statSync } from "node:fs";
import { extname, join, resolve } from "node:path";
import { editorUrl, packedEditorUrl } from "@cardenelabs/dragon/light";
import type { Frame, Page } from "playwright-core";
import { describe, expect, it } from "vitest";

import { fileChromium } from "../../../../packages/dragon/test/page-needs";
import { BASE, builtDir } from "./playground-support";

/** 置く図。題は「注文」で、段を2つ持つ */
const SOURCE = "sequence 注文\nbox a as あなた\nbox b as 店\nstep 確認\n  a -> b: 注文\nstep 返事\n  b -> a: 受けた";
/** 埋め込みの頁を置く頁の置き場。見本帳と別の置き場にし、置いた頁から見本帳の中を読めない形で確かめる */
const PARENT = "http://parent.test/";
/** 見本帳の置き場 */
const SITE = `http://localhost${BASE}`;
/** エディタとdragonの印が開く公開した見本帳 */
const GALLERY = "https://cardene777.github.io/dragon/";

const TYPES: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".woff2": "font/woff2",
  ".woff": "font/woff",
  ".txt": "text/plain; charset=utf-8",
};

/** 置いた頁が受けた知らせ。`frame`はどのiframeから届いたか */
interface Received {
  frame: string;
  origin: string;
  type: string;
  detail: unknown;
}

/** iframeを並べた頁を開いて`run`を回す。頁は file で 1 つの Chromium の文脈ごとに開いて閉じる */
async function withParent<T>(frames: { id: string; src: string }[], run: (page: Page) => Promise<T>): Promise<T> {
  const dir = builtDir();
  expect(existsSync(join(dir, "index.html")), "build した見本帳の index.html が無い").toBe(true);
  // 知らせを受ける処理はiframeより先に置き、iframeが描いた直後の知らせも受ける
  const html =
    '<!doctype html><html><head><meta charset="utf-8"></head><body>' +
    `<script>window.received=[];addEventListener("message",(e)=>{if(!e.data||e.data.source!=="dragon")return;` +
    `const frame=[...document.querySelectorAll("iframe")].find((f)=>f.contentWindow===e.source);` +
    `window.received.push({frame:frame?frame.id:"",origin:e.origin,type:e.data.type,detail:e.data.detail});});</script>` +
    frames.map(({ id, src }) => `<iframe id="${id}" src="${src}" style="width:800px;height:640px;border:0" allow="clipboard-read; clipboard-write"></iframe>`).join("") +
    "</body></html>";
  const context = await (await fileChromium()).newContext({ viewport: { width: 1000, height: 1400 }, acceptDownloads: true });
  try {
    await context.route(`${GALLERY}**`, (route) => route.fulfill({ contentType: "text/html; charset=utf-8", body: "<!doctype html><title>gallery</title>" }));
    await context.route(`${PARENT}**`, (route) => route.fulfill({ contentType: "text/html; charset=utf-8", body: html }));
    await context.route("http://localhost/**", (route) => {
      const path = decodeURIComponent(new URL(route.request().url()).pathname);
      if (!path.startsWith(BASE)) return route.fulfill({ status: 404 });
      const rel = path.slice(BASE.length);
      const file = resolve(dir, rel === "" ? "index.html" : rel);
      if (!file.startsWith(`${dir}/`)) return route.fulfill({ status: 404 });
      const found = existsSync(file) && statSync(file).isFile() ? file : existsSync(`${file}.html`) ? `${file}.html` : undefined;
      if (found) return route.fulfill({ contentType: TYPES[extname(found)] ?? "application/octet-stream", body: readFileSync(found) });
      return route.fulfill({ status: 404, contentType: TYPES[".html"], body: readFileSync(join(dir, "404.html")) });
    });
    const page = await context.newPage();
    await page.goto(PARENT);
    return await run(page);
  } finally {
    await context.close();
  }
}

/** iframe`id`の中の頁 */
async function frameOf(page: Page, id: string): Promise<Frame> {
  const frame = await (await page.locator(`iframe#${id}`).elementHandle())?.contentFrame();
  if (!frame) throw new Error(`iframe ${id} の中の頁が無い`);
  return frame;
}

/** 埋め込みの頁の帯のボタンと、帯のコードのボタンの字と、図を描いたかと、見本帳の上の帯と誤りの文 */
interface EmbedShape {
  buttons: (string | undefined)[];
  code: string;
  drawn: boolean;
  siteHeader: boolean;
  error: string;
}
const shapeOf = (frame: Frame): Promise<EmbedShape> =>
  frame.evaluate(() => {
    const root = document.querySelector(".dragon-frame")?.shadowRoot ?? null;
    return {
      buttons: root ? [...root.querySelectorAll<HTMLElement>(".dg-header-actions > [data-action]")].map((el) => el.dataset.action) : [],
      code: root?.querySelector('.dg-header-actions > [data-action="code"]')?.textContent?.trim() ?? "",
      drawn: root?.querySelector('[data-dragon="player"] svg') != null,
      siteHeader: document.querySelector('[data-site="header"]') !== null,
      error: document.querySelector('[data-embed="error"]')?.textContent?.trim() ?? "",
    };
  });

/** 置いた頁が受けた知らせ */
const received = (page: Page): Promise<Received[]> => page.evaluate(() => (window as unknown as { received: Received[] }).received);

describe("見本帳の埋め込みの頁 (#3700)", () => {
  it("embed-page-renders-hash-notation", async () => {
    const packed = new URL(await packedEditorUrl(SOURCE)).hash;
    expect(packed.startsWith("#z="), "縮めた記法のURLの形").toBe(true);
    await withParent(
      [
        { id: "packed", src: `${SITE}embed?lang=ja${packed}` },
        { id: "empty", src: `${SITE}embed` },
      ],
      async (page) => {
        // 縮めた記法を帯つきの図にし、帯の言葉は ?lang=ja に従い、見本帳の上の帯を出さない
        await expect
          .poll(async () => shapeOf(await frameOf(page, "packed")), { timeout: 6000 })
          .toEqual({ buttons: ["code", "editor", "copy", "export", "expand"], code: "コード", drawn: true, siteHeader: false, error: "" });
        // 記法の無いURLは図を置かず、誤りの文を出す
        const empty = await shapeOf(await frameOf(page, "empty"));
        expect({ buttons: empty.buttons, drawn: empty.drawn, siteHeader: empty.siteHeader }, "記法の無い埋め込みの頁").toEqual({ buttons: [], drawn: false, siteHeader: false });
        expect(empty.error, "記法の無い埋め込みの頁の誤りの文").not.toBe("");
      },
    );
  });

  it("embed-page-posts-events", async () => {
    const plain = new URL(editorUrl(SOURCE)).hash;
    expect(plain.startsWith("#n="), "縮めていない記法のURLの形").toBe(true);
    await withParent(
      [
        { id: "plain", src: `${SITE}embed${plain}` },
        { id: "empty", src: `${SITE}embed` },
      ],
      async (page) => {
        const from = async (frame: string, type: string): Promise<unknown[]> =>
          (await received(page)).filter((m) => m.frame === frame && m.type === type).map((m) => m.detail);
        // 描けた知らせと描けなかった知らせ
        await expect.poll(() => from("plain", "dragon-render"), { timeout: 6000 }).toEqual([{ ok: true }]);
        await expect.poll(async () => (await from("empty", "dragon-render")).length, { timeout: 3000 }).toBe(1);
        const failed = (await from("empty", "dragon-render"))[0] as { ok: boolean; errors?: string[] };
        expect(failed.ok, "記法の無い頁の描けなかった知らせ").toBe(false);
        expect(failed.errors?.length ?? 0, "描けなかった知らせの誤りの文").toBeGreaterThan(0);

        const frame = await frameOf(page, "plain");
        // ?lang の無い頁の帯は英語
        expect((await shapeOf(frame)).code, "?lang の無い埋め込みの頁の帯の言葉").toBe("Code");
        // 段が変わった知らせ
        await frame.locator('button[data-dragon="next"]').click();
        await expect.poll(async () => (await from("plain", "dragon-step")).some((d) => (d as { step: number }).step === 1), { timeout: 3000 }).toBe(true);
        // エクスポートした知らせ
        await frame.locator(".export-toggle").click();
        await Promise.all([page.waitForEvent("download", { timeout: 4000 }), frame.locator('[data-menu="export"] [data-format="dragon"]').click()]);
        await expect.poll(() => from("plain", "dragon-export"), { timeout: 3000 }).toEqual([{ format: "dragon" }]);
        // エディタで開いた知らせ
        await Promise.all([page.context().waitForEvent("page", { timeout: 4000 }), frame.locator(".dg-header-actions > a.editor").click()]);
        await expect.poll(() => from("plain", "dragon-share"), { timeout: 3000 }).toEqual([{ via: "editor" }]);
        // 知らせは見本帳の置き場から届く
        expect([...new Set((await received(page)).map((m) => m.origin))], "知らせを送った置き場").toEqual(["http://localhost"]);
      },
    );
  });
});
