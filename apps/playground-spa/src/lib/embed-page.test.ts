/**
 * 見本帳の埋め込みの頁 (#3700)。
 *
 * 外の頁がiframeで`/dragon/embed#z=<縮めた記法>`か`#n=<記法>`を開くと、埋め込みの頁は記法を帯つきの図にし、
 * 描けた・描けなかった、段が変わった、エクスポートした、エディタで開いた・コピーしたの4つを、置いた頁へ`postMessage`で送る。
 * 送る形は`{ source: "dragon", type, detail }`で、`type`と`detail`はSDKの要素が送る知らせと同じ。
 *
 * build した見本帳を`http://localhost/dragon/`に置き、別の置き場 (`http://parent.test/`) の頁にiframeで開いて確かめる。
 * 見本帳の置き場はGitHub Pagesと同じく、拡張子の無い経路に同じ名前の`.html`を返し、無い経路に`404.html`を404で返す。
 *
 * 件の中で頁を開いて押して待つと、混んだ機械で 1 件 10 秒の上限を超えた (#3816)。
 * 頁を開いて押し、知らせを待つ仕事は file を読み込む段 (`at-load.ts`) で済ませ、件は記した値を元の件と同じ順で確かめる。
 */
import { existsSync, readFileSync, statSync } from "node:fs";
import { extname, join, resolve } from "node:path";
import { editorUrl, packedEditorUrl } from "@cardenelabs/dragon/light";
import { describe, expect, it } from "vitest";

import { atLoad } from "../../../../packages/dragon/test/at-load";
import { ACTION_LIMIT_MS, PAGE_LIMIT_MS, inOrder, readUntil, readUntilEqual, within } from "../../../../packages/dragon/test/page-wait";
import { fileChromium } from "../../../../packages/dragon/test/page-needs";
import { BASE, builtDir } from "./playground-support";

/** 頁と、iframeの中の頁。見本帳は Playwright を依存に持たないので、型は Chromium を起こす関数から引く */
type Page = Awaited<ReturnType<Awaited<ReturnType<typeof fileChromium>>["newPage"]>>;
type Frame = ReturnType<Page["mainFrame"]>;

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

/** iframeを並べた頁で`run`を回した結果。build した見本帳の index.html が無い時は頁を開かない */
interface Parented<T> {
  /** build した見本帳の index.html が在る */
  built: boolean;
  /** `run`の結果 */
  result?: T;
}

/** iframeを並べた頁を開いて`run`を回す。頁は file で 1 つの Chromium の文脈ごとに開いて閉じる */
async function withParent<T>(frames: { id: string; src: string }[], run: (page: Page) => Promise<T>): Promise<Parented<T>> {
  const dir = builtDir();
  const built = existsSync(join(dir, "index.html"));
  if (!built) return { built };
  // 知らせを受ける処理はiframeより先に置き、iframeが描いた直後の知らせも受ける
  const html =
    '<!doctype html><html><head><meta charset="utf-8"></head><body>' +
    `<script>window.received=[];addEventListener("message",(e)=>{if(!e.data||e.data.source!=="dragon")return;` +
    `const frame=[...document.querySelectorAll("iframe")].find((f)=>f.contentWindow===e.source);` +
    `window.received.push({frame:frame?frame.id:"",origin:e.origin,type:e.data.type,detail:e.data.detail});});</script>` +
    frames.map(({ id, src }) => `<iframe id="${id}" src="${src}" style="width:800px;height:640px;border:0" allow="clipboard-read; clipboard-write"></iframe>`).join("") +
    "</body></html>";
  const context = await within((await fileChromium()).newContext({ viewport: { width: 1000, height: 1400 }, acceptDownloads: true }), ACTION_LIMIT_MS, "頁の文脈を作る");
  // 上限を書かない押す、待つ、開く操作も、Playwright の既定の 30 秒ではなく 1 つの操作の上限で切る
  context.setDefaultTimeout(ACTION_LIMIT_MS);
  const openAndRun = async (): Promise<Parented<T>> => {
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
    return { built, result: await run(page) };
  };
  try {
    return await within(openAndRun(), PAGE_LIMIT_MS, "埋め込みの頁を並べた頁の仕事");
  } finally {
    // 記した値は手元に在るので、閉じるのが上限で終わらなくても落とさない。閉じ損ねた頁は file の process の終わりに Playwright が Chromium ごと止める
    await within(context.close(), ACTION_LIMIT_MS, "頁の文脈を閉じる").catch(() => undefined);
  }
}

/** 頁で回した結果を返す。build した見本帳の index.html が無い時は判定で落とす */
function parented<T>(opened: Parented<T>): T {
  expect(opened.built, "build した見本帳の index.html が無い").toBe(true);
  return opened.result as T;
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

/** 縮めた記法の埋め込みの頁。帯つきの図にし、帯の言葉は ?lang=ja に従い、見本帳の上の帯を出さない */
const PACKED_SHAPE: EmbedShape = { buttons: ["code", "editor", "copy", "export", "expand"], code: "コード", drawn: true, siteHeader: false, error: "" };
/** 縮めていない記法の埋め込みの頁が描けた知らせ */
const PLAIN_RENDERED = [{ ok: true }];
/** 帯のエクスポートの窓から記法を保存した後のエクスポートした知らせ */
const PLAIN_EXPORTED = [{ format: "dragon" }];
/** 帯のエディタのボタンを押した後のエディタで開いた知らせ */
const PLAIN_SHARED = [{ via: "editor" }];

// 頁は件ごとに 1 つずつ開き、落ちた仕事はそれを読む件だけを落とす。押す件は押す前に読んだ値も残し、件は元の件と同じ順に確かめる
const HASH_PAGES = await atLoad("縮めた記法のURLと記法の無いURLの埋め込みの頁をiframeで開く", async () => {
  const packed = new URL(await packedEditorUrl(SOURCE)).hash;
  // URLの形が違う時は件が先に判定で落ちるので開かない
  if (!packed.startsWith("#z=")) return { packed, opened: undefined };
  const opened = await withParent(
    [
      { id: "packed", src: `${SITE}embed?lang=ja${packed}` },
      { id: "empty", src: `${SITE}embed` },
    ],
    async (page) => {
      const step = inOrder();
      const shape = await step("縮めた記法の埋め込みの頁が図を描くのを待つ", () => readUntilEqual(async () => shapeOf(await frameOf(page, "packed")), PACKED_SHAPE, 6000));
      const empty = await step("記法の無い埋め込みの頁を読む", async () => shapeOf(await frameOf(page, "empty")));
      return { shape, empty };
    },
  );
  return { packed, opened };
});

const POSTED = await atLoad("縮めていない記法のURLと記法の無いURLの埋め込みの頁を開き、帯を押して知らせを読む", async () => {
  const plain = new URL(editorUrl(SOURCE)).hash;
  // URLの形が違う時は件が先に判定で落ちるので開かない
  if (!plain.startsWith("#n=")) return { plain, opened: undefined };
  const opened = await withParent(
    [
      { id: "plain", src: `${SITE}embed${plain}` },
      { id: "empty", src: `${SITE}embed` },
    ],
    async (page) => {
      const from = async (frame: string, type: string): Promise<unknown[]> =>
        (await received(page)).filter((m) => m.frame === frame && m.type === type).map((m) => m.detail);
      const step = inOrder();
      // 描けた知らせと描けなかった知らせ
      const rendered = await step("縮めていない記法の頁の描けた知らせを待つ", () => readUntilEqual(() => from("plain", "dragon-render"), PLAIN_RENDERED, 6000));
      const emptyRenders = await step("記法の無い頁の描けなかった知らせを待つ", () => readUntil(async () => (await from("empty", "dragon-render")).length, (count) => count === 1, 3000));
      const failed = await step("記法の無い頁の描けなかった知らせを読む", async () => (await from("empty", "dragon-render"))[0] as { ok: boolean; errors?: string[] });
      // ?lang の無い頁の帯は英語
      const code = await step("?lang の無い埋め込みの頁の帯の言葉を読む", async () => (await shapeOf(await frameOf(page, "plain"))).code);
      // 段が変わった知らせ
      const stepped = await step("次の段の釦を押して段が変わった知らせを待つ", async () => {
        await (await frameOf(page, "plain")).locator('button[data-dragon="next"]').click();
        return readUntil(async () => (await from("plain", "dragon-step")).some((d) => (d as { step: number }).step === 1), (seen) => seen, 3000);
      });
      // エクスポートした知らせ
      const exported = await step("帯のエクスポートの窓から記法を保存し、エクスポートした知らせを待つ", async () => {
        const frame = await frameOf(page, "plain");
        await frame.locator(".export-toggle").click();
        await Promise.all([page.waitForEvent("download", { timeout: 4000 }), frame.locator('[data-menu="export"] [data-format="dragon"]').click()]);
        return readUntilEqual(() => from("plain", "dragon-export"), PLAIN_EXPORTED, 3000);
      });
      // エディタで開いた知らせ
      const shared = await step("帯のエディタのボタンを押し、エディタで開いた知らせを待つ", async () => {
        const frame = await frameOf(page, "plain");
        await Promise.all([page.context().waitForEvent("page", { timeout: 4000 }), frame.locator(".dg-header-actions > a.editor").click()]);
        return readUntilEqual(() => from("plain", "dragon-share"), PLAIN_SHARED, 3000);
      });
      // 知らせは見本帳の置き場から届く
      const origins = await step("知らせを送った置き場を読む", async () => [...new Set((await received(page)).map((m) => m.origin))]);
      return { rendered, emptyRenders, failed, code, stepped, exported, shared, origins };
    },
  );
  return { plain, opened };
});

describe("見本帳の埋め込みの頁 (#3700)", () => {
  it("embed-page-renders-hash-notation", () => {
    const { packed, opened } = HASH_PAGES.get();
    expect(packed.startsWith("#z="), "縮めた記法のURLの形").toBe(true);
    if (!opened) return;
    const seen = parented(opened);
    // 縮めた記法を帯つきの図にし、帯の言葉は ?lang=ja に従い、見本帳の上の帯を出さない
    expect(seen.shape.get()).toEqual(PACKED_SHAPE);
    // 記法の無いURLは図を置かず、誤りの文を出す
    const empty = seen.empty.get();
    expect({ buttons: empty.buttons, drawn: empty.drawn, siteHeader: empty.siteHeader }, "記法の無い埋め込みの頁").toEqual({ buttons: [], drawn: false, siteHeader: false });
    expect(empty.error, "記法の無い埋め込みの頁の誤りの文").not.toBe("");
  });

  it("embed-page-posts-events", () => {
    const { plain, opened } = POSTED.get();
    expect(plain.startsWith("#n="), "縮めていない記法のURLの形").toBe(true);
    if (!opened) return;
    const seen = parented(opened);
    // 描けた知らせと描けなかった知らせ
    expect(seen.rendered.get()).toEqual(PLAIN_RENDERED);
    expect(seen.emptyRenders.get()).toBe(1);
    const failed = seen.failed.get();
    expect(failed.ok, "記法の無い頁の描けなかった知らせ").toBe(false);
    expect(failed.errors?.length ?? 0, "描けなかった知らせの誤りの文").toBeGreaterThan(0);

    // ?lang の無い頁の帯は英語
    expect(seen.code.get(), "?lang の無い埋め込みの頁の帯の言葉").toBe("Code");
    // 段が変わった知らせ
    expect(seen.stepped.get()).toBe(true);
    // エクスポートした知らせ
    expect(seen.exported.get()).toEqual(PLAIN_EXPORTED);
    // エディタで開いた知らせ
    expect(seen.shared.get()).toEqual(PLAIN_SHARED);
    // 知らせは見本帳の置き場から届く
    expect(seen.origins.get(), "知らせを送った置き場").toEqual(["http://localhost"]);
  });
});
