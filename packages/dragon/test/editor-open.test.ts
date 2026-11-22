/**
 * 帯のエディタのボタンとコピーの窓が、記法を外のサーバーへ送らないこと (#3697)。
 *
 * エディタのボタンは記法をブラウザの内で縮めてURLの`#z=`に詰め、縮めても長すぎる記法はクリップボードに写して`#paste`の編集画面を開く。
 * `#`の後ろは頁を配るサーバーに送られないので、ボタンとコピーの窓を押す間の通信に記法が乗らないことを、
 * build した`dist/frame.js`を`http://localhost/`の頁で読んで、頁が出した全ての通信を記録して確かめる。
 */
import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import type { Page } from "playwright-core";
import { describe, expect, it } from "vitest";
import { atLoad } from "./at-load";
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
  for (let i = 0; i < 300; i += 1) lines.push(`step ${word()}`, `  a -> b: ${word()} ${word()} ${word()}`);
  return lines.join("\n");
}

/** `expect.poll` と同じく、`read` が `done` を満たすまで 50ms ごとに `timeout` ms まで読み直し、最後に読めた値を返す。読めない回は次の回に読み直す */
async function polled<T>(read: () => Promise<T>, done: (value: T) => boolean, timeout: number): Promise<T | undefined> {
  const end = Date.now() + timeout;
  let last: T | undefined;
  for (;;) {
    try {
      last = await read();
      if (done(last)) return last;
    } catch {
      // 読めない回は、expect.poll と同じく次の回に読み直す
    }
    if (Date.now() >= end) return last;
    await new Promise((wake) => setTimeout(wake, 50));
  }
}

/** 頁が出した 1 つの通信 */
interface Sent {
  url: string;
  /** 通信の種類 (`resourceType()`) */
  type: string;
  /** 送った中身。無ければ空 */
  postData: string;
}

/** 頁でエディタのボタンとコピーの窓を押した間に読んだ物。途中で先へ進めなくなった時は、そこまでを持つ */
interface Opened {
  /** 帯の入口の build した file (dist/frame.js) が在る */
  built: boolean;
  /** 頁が帯の入口を読めなかった時の誤り */
  frameError?: string;
  /** 図を置いた後に、最初のエディタのボタンから最後に読めた行き先 */
  href?: string | null;
  /** 短い記法と長い記法のエディタのボタンが開いたタブの URL */
  short?: string;
  long?: string;
  /** コピーの窓を押した後に、クリップボードから最後に読めた中身 */
  clipboard?: string;
  /** 図を置いた後に出た通信 */
  sent: Sent[];
}

// 頁を開いてボタンとコピーの窓を押すのを件の中で済ませると、混んだ機械で 1 件の上限 (10 秒) を超えた (#3815)。
// 頁で押して読むのは file を読み込む段で済ませ、件は読んだ行き先と記録した通信を確かめる
const OPENED = await atLoad("エディタのボタンとコピーの窓を頁で押して、出た通信を記録する", async (): Promise<Opened> => {
  const sent: Sent[] = [];
  if (!existsSync(join(DIST, "frame.js"))) return { built: false, sent };
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
    const frameError = await page.evaluate(() => (window as unknown as { frameError?: string }).frameError);
    if (frameError !== undefined) return { built: true, frameError, sent: [...sent] };

    // 図を置いた後に出た通信だけを数える
    context.on("request", (request) => sent.push({ url: request.url(), type: request.resourceType(), postData: request.postData() ?? "" }));
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
    // ボタンに縮めた記法が詰まるまで、件で待っていた expect.poll と同じく 3 秒まで待つ。ボタンが無い間も 3 秒で読むのをやめる
    const zipped = (value: string | null | undefined): boolean => typeof value === "string" && /#z=/u.test(value);
    const href = await polled(() => links.first().getAttribute("href", { timeout: 3000 }), zipped, 3000);
    if (!zipped(href)) return { built: true, href, sent: [...sent] };

    const popupOf = async (click: () => Promise<void>): Promise<string> => {
      const [popup] = await Promise.all([page.waitForEvent("popup", { timeout: 4000 }), click()]);
      const url = popup.url();
      await popup.close();
      return url;
    };
    const short = await popupOf(() => links.first().click());
    const long = await popupOf(() => links.nth(1).click());
    for (const kind of ["source", "image", "url"]) {
      await page.locator(".copy-toggle").first().click();
      await page.locator(`[data-menu="copy"] [data-copy="${kind}"]`).first().click();
    }
    // 最後に押したエディタのURLが届くまで、件で待っていた expect.poll と同じく 3 秒まで待つ。コピーの窓のエディタのURLも縮めた形
    const clipboard = await polled(() => page.evaluate(() => navigator.clipboard.readText()), (text) => text === short, 3000);
    // 頁を閉じる間に出た通信を混ぜないよう、ここまでに出た通信を写して返す
    return { built: true, href, short, long, clipboard, sent: [...sent] };
  } finally {
    await context.close();
  }
});

describe("エディタのボタンとコピーの窓の通信 (#3697)", () => {
  it("editor-open-sends-nothing", () => {
    const opened = OPENED.get();
    expect(opened.built, "帯の入口の build した file (dist/frame.js) が無い").toBe(true);
    expect(opened.frameError, "頁が帯の入口を読めない").toBeUndefined();
    expect(opened.href).toMatch(/#z=/u);

    const short = opened.short ?? "";
    expect(short.startsWith(`${GALLERY}editor#z=`), `短い記法のエディタのタブ ${short}`).toBe(true);
    expect(opened.long, "長い記法のエディタのタブ").toBe(`${GALLERY}editor#paste`);
    expect(opened.clipboard).toBe(short);

    // 陰性でない対照。新しいタブの頁の読み込みを記録している (記録が空振りしていない)
    const { sent } = opened;
    const gallery = sent.filter((request) => request.url.startsWith(GALLERY));
    expect(gallery.length, "記録した見本帳の頁の読み込みの数").toBeGreaterThanOrEqual(2);
    const outside = sent.filter((request) => !request.url.startsWith("http://localhost/") && !request.url.startsWith(GALLERY));
    expect(outside.map((request) => request.url), "頁と見本帳のほかへ出た通信").toEqual([]);
    expect(sent.filter((request) => SENDING.has(request.type)).map((request) => `${request.type} ${request.url}`), "頁が出した送る通信").toEqual([]);
    const encoded = Buffer.from(SOURCE, "utf8").toString("base64url").slice(0, 24);
    const leaked = gallery.filter((request) => {
      const url = new URL(request.url);
      return url.search !== "" || url.hash !== "" || request.url.includes(encoded) || request.postData !== "";
    });
    expect(leaked.map((request) => request.url), "見本帳へ記法を乗せた通信").toEqual([]);
  });
});

export type { Page };
