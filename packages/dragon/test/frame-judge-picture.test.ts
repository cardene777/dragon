/**
 * 埋め込んだ頁の帯の書き出す窓で、判定の表 (#3879) を帯の形の絵にする (#3945)。
 *
 * 帯の形の絵は、例の名前と添え書きを行の上の帯に置いた幅 728px 以下の SVG で (#3891、`docs/adr/0015-judge-pictures-put-cases-on-bands.md`)、
 * 帯の書き出す窓の SVG、PNG、GIF、mp4 と、コピーの窓の画像と、帯を出さずに置いた図の `export` がこの形を使う。
 * PNG と画像は列を照らさずに撮り、GIF と mp4 は規則の列を 1 段ずつ照らす 1 周を撮る。
 *
 * 帯の部品と書き出す部品を本物で確かめるため、build した `dist/frame.js` と `dist/embed.js` を `http://localhost/` の頁で読む。
 * 頁は同梱の字の CSS を読み、書き出す部品はその字を絵に埋める。
 * 頁を開いて押して待つ仕事は file を読み込む段 (`at-load.ts`) で済ませ、件は記した値を確かめる。
 */
import { existsSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join, resolve } from "node:path";
import { PNG } from "pngjs";
import type { Page } from "playwright-core";
import { describe, expect, it } from "vitest";
import { parseNotation, renderDiagram } from "../src/core";
import "../src/kind-use/judge";
import { atLoad } from "./at-load";
import {
  clusters,
  colorsOf,
  marks,
  type Picture,
  spots,
  toGifBox,
  verdictBox,
  vivid,
} from "./judge-pixels";
import { ACTION_LIMIT_MS, PAGE_LIMIT_MS, readUntil, within } from "./page-wait";
import { fileChromium } from "./page-needs";

const ROOT = join(process.cwd(), "packages/dragon");
const DIST = join(ROOT, "dist");
const FONTS = join(ROOT, "node_modules/@fontsource-variable");
const require_ = createRequire(join(ROOT, "package.json"));
/** 頁に返す詰める道具。書き出す部品が読む */
const LIBS: Record<string, string> = {
  "/mediabunny.js": join(dirname(require_.resolve("mediabunny")), "mediabunny.min.mjs"),
  "/gifenc.js": require_.resolve("gifenc/dist/gifenc.esm.js"),
};
/** 帯の下に置く判定の表。規則 5 つと例 6 つの日本語の見本 */
const SOURCE = readFileSync(join(ROOT, "examples/transfer-check.dragon"), "utf8");
/** GIF と mp4 を作り終えるまで待つ長さ。頁の仕事の上限 (60 秒) の内に収める */
const FILM_WAIT = 45_000;

/** 見本の規則の数と、例ごとの判定と、表の色の値。画素を数える色はこの色の値から作る (`judge-pixels.ts`) */
const FACTS = (() => {
  const parsed = parseNotation(SOURCE);
  if (!parsed.ok) throw new Error("transfer-check.dragon を読めない");
  const spec = (parsed.diagram as { judge: { rules: unknown[]; cases: { fails?: unknown[] }[] } })
    .judge;
  return {
    rules: spec.rules.length,
    verdicts: spec.cases.map((one) => ((one.fails?.length ?? 0) > 0 ? "block" : "pass")),
    colors: colorsOf(renderDiagram(parsed.diagram).svg),
  };
})();

/** 頁で回した結果。入口の build した file が無い時は頁を開かず、頁が入口を読めない時は `run` を回さない */
interface Opened<T> {
  built: boolean;
  error?: string;
  result?: T;
}

/** 入口 `entry` (`/frame.js` か `/embed.js`) と同梱の字の CSS を読んだ頁を開いて `run` を回す */
async function withEntry<T>(entry: string, run: (page: Page) => Promise<T>): Promise<Opened<T>> {
  const built = existsSync(join(DIST, entry.slice(1)));
  if (!built) return { built };
  const html =
    '<!doctype html><html lang="ja"><head><meta charset="utf-8">' +
    '<script type="importmap">{"imports":{"@cardenelabs/dragon":"/index.js","gifenc":"/gifenc.js","mediabunny":"/mediabunny.js"}}</script>' +
    '<link rel="stylesheet" href="/fonts/noto-sans-jp/index.css"><link rel="stylesheet" href="/fonts/jetbrains-mono/index.css">' +
    '<style>html,body{margin:0}</style></head><body><div id="host" style="width:760px"></div>' +
    `<script type="module">import(${JSON.stringify(entry)}).then((m) => { window.entry = m; }, (e) => { window.entryError = String(e); });</script></body></html>`;
  const context = await within(
    (await fileChromium()).newContext({
      viewport: { width: 900, height: 900 },
      acceptDownloads: true,
    }),
    ACTION_LIMIT_MS,
    "頁の文脈を作る",
  );
  context.setDefaultTimeout(ACTION_LIMIT_MS);
  const openAndRun = async (): Promise<Opened<T>> => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"], {
      origin: "http://localhost",
    });
    const page = await context.newPage();
    await page.route("http://localhost/**", (route) => {
      const path = new URL(route.request().url()).pathname;
      if (path === "/")
        return route.fulfill({ contentType: "text/html; charset=utf-8", body: html });
      const lib = LIBS[path];
      if (lib) return route.fulfill({ contentType: "text/javascript", body: readFileSync(lib) });
      const font = path.startsWith("/fonts/")
        ? resolve(FONTS, `.${path.slice("/fonts".length)}`)
        : undefined;
      if (font?.startsWith(`${FONTS}/`) && existsSync(font))
        return route.fulfill({
          contentType: font.endsWith(".css") ? "text/css" : "font/woff2",
          body: readFileSync(font),
        });
      const file = resolve(DIST, `.${path}`);
      if (path.endsWith(".js") && file.startsWith(`${DIST}/`) && existsSync(file))
        return route.fulfill({ contentType: "text/javascript", body: readFileSync(file) });
      return route.fulfill({ status: 404 });
    });
    await page.goto("http://localhost/");
    await page.waitForFunction(() => "entry" in window || "entryError" in window);
    const error = await page.evaluate(
      () => (window as unknown as { entryError?: string }).entryError,
    );
    if (error !== undefined) return { built, error };
    await page.evaluate(() => document.fonts.ready.then(() => undefined));
    return { built, result: await run(page) };
  };
  try {
    return await within(openAndRun(), PAGE_LIMIT_MS, "帯の入口を読んだ頁の仕事");
  } finally {
    await within(context.close(), ACTION_LIMIT_MS, "頁の文脈を閉じる").catch(() => undefined);
  }
}

/** 頁で回した結果を返す。build した入口が無い時と、頁が入口を読めない時は判定で落とす */
function opened<T>(one: Opened<T>, entry: string): T {
  expect(one.built, `build した入口 (dist${entry}) が無い`).toBe(true);
  expect(one.error, `頁が入口 (${entry}) を読めない`).toBeUndefined();
  return one.result as T;
}

/** `#host` に帯つきの判定の表を置き、再生の部品を `window.framed` に持つ */
async function mountFramed(page: Page): Promise<void> {
  await page.evaluate((source) => {
    const entry = (
      window as unknown as {
        entry: { mountFramedDiagram(host: HTMLElement, source: string, options: object): unknown };
      }
    ).entry;
    (window as unknown as { framed: unknown }).framed = entry.mountFramedDiagram(
      document.getElementById("host")!,
      source,
      {},
    );
  }, SOURCE);
  // 判定の表の部品の塊が届き、帯の内側に表を描くまで待つ
  await page.waitForFunction(
    () =>
      document
        .querySelector(".dragon-frame")
        ?.shadowRoot?.querySelector('[data-dragon="judge"]') !== null,
    undefined,
    { timeout: ACTION_LIMIT_MS },
  );
}

/** 帯の書き出す窓で形式 `format` を押し、保存された file の中身を返す。`options` は窓で押す選択 (`scale` と `background`) */
async function exported(
  page: Page,
  format: string,
  options: Record<string, string> = {},
  wait = ACTION_LIMIT_MS,
): Promise<Buffer> {
  await page.locator('.dg-header-actions > [data-action="export"] > button').click();
  for (const [name, value] of Object.entries(options))
    await page.locator(`[data-option="${name}"] [data-value="${value}"]`).click();
  const [download] = await Promise.all([
    page.waitForEvent("download", { timeout: wait }),
    page.locator(`[data-menu="export"] [data-format="${format}"]`).click(),
  ]);
  return readFileSync(await download.path());
}

/** PNG の file を画素の絵にする */
const pictureOf = (bytes: Buffer): Picture => {
  const png = PNG.sync.read(bytes);
  return { width: png.width, height: png.height, data: png.data };
};

/** 頁の中で GIF を読み戻した最初のコマと最後のコマ */
interface Frames {
  count: number;
  first: { width: number; height: number; rgba: string };
  last: { width: number; height: number; rgba: string };
}

/** 頁の中で GIF の最初と最後のコマを読み戻す */
function gifFrames(page: Page, gif: Buffer): Promise<Frames> {
  return page.evaluate(async (base64) => {
    const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
    const decoder = new ImageDecoder({ data: bytes, type: "image/gif" });
    await decoder.tracks.ready;
    const count = decoder.tracks.selectedTrack?.frameCount ?? 1;
    const read = async (frameIndex: number) => {
      const { image } = await decoder.decode({ frameIndex });
      const canvas = new OffscreenCanvas(image.displayWidth, image.displayHeight);
      const context = canvas.getContext("2d") as OffscreenCanvasRenderingContext2D;
      context.drawImage(image, 0, 0);
      image.close();
      const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
      let text = "";
      for (let i = 0; i < pixels.length; i += 0x8000)
        text += String.fromCharCode(...pixels.subarray(i, i + 0x8000));
      return { width: canvas.width, height: canvas.height, rgba: btoa(text) };
    };
    return { count, first: await read(0), last: await read(count - 1) };
  }, gif.toString("base64"));
}

const SVG = await atLoad("帯つきの判定の表を置き、帯の書き出す窓で SVG を保存する", () =>
  withEntry("/frame.js", async (page) => {
    await mountFramed(page);
    return (await exported(page, "svg")).toString("utf8");
  }),
);

const PNG_SHOT = await atLoad(
  "帯つきの判定の表を 2 番目の段まで送り、帯の書き出す窓で PNG を 2 倍の大きさで保存する",
  () =>
    withEntry("/frame.js", async (page) => {
      await mountFramed(page);
      await page.evaluate(() =>
        (
          window as unknown as { framed: { player: { goTo(step: number): void } } }
        ).framed.player.goTo(1),
      );
      return (await exported(page, "png", { scale: "2", background: "fill" })).toString("base64");
    }),
);

const COPY = await atLoad("帯つきの判定の表を置き、帯のコピーの窓で画像を写す", () =>
  withEntry("/frame.js", async (page) => {
    await mountFramed(page);
    await page.locator('.dg-header-actions > [data-action="copy"] > button').click();
    await page.locator('[data-menu="copy"] [data-copy="image"]').click();
    // 画像はクリップボードに書き終えるまで読めないので、PNG が届くまで読み直す
    return readUntil(
      () =>
        page.evaluate(async () => {
          const items = await navigator.clipboard.read();
          const item = items.find((one) => one.types.includes("image/png"));
          if (!item) return "";
          const bytes = new Uint8Array(await (await item.getType("image/png")).arrayBuffer());
          let text = "";
          for (let i = 0; i < bytes.length; i += 0x8000)
            text += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
          return btoa(text);
        }),
      (text) => text !== "",
      ACTION_LIMIT_MS,
    );
  }),
);

const GIF = await atLoad(
  "帯つきの判定の表を置き、帯の書き出す窓で GIF を保存して最初と最後のコマを読む",
  () =>
    withEntry("/frame.js", async (page) => {
      await mountFramed(page);
      return gifFrames(page, await exported(page, "gif", {}, FILM_WAIT));
    }),
);

const MP4 = await atLoad("帯つきの判定の表を置き、帯の書き出す窓で mp4 を保存する", () =>
  withEntry("/frame.js", async (page) => {
    await mountFramed(page);
    const mp4 = await exported(page, "mp4", {}, FILM_WAIT);
    return mp4.subarray(4, 8).toString("latin1");
  }),
);

const HEADLESS = await atLoad("帯を出さずに判定の表を置き、export で SVG を作る", () =>
  withEntry("/embed.js", async (page) =>
    page.evaluate(async (source) => {
      const entry = (
        window as unknown as {
          entry: {
            mountDragon(
              host: HTMLElement,
              source: string,
              options: object,
            ): { export(format: string): Promise<Blob> };
          };
        }
      ).entry;
      const embed = entry.mountDragon(document.getElementById("host")!, source, { header: false });
      // 判定の表の部品の塊が届き、表を描くまで待つ
      for (let i = 0; i < 100 && !document.querySelector('#host [data-dragon="judge"]'); i++)
        await new Promise((done) => setTimeout(done, 50));
      return (await embed.export("svg")).text();
    }, SOURCE),
  ),
);

/** 帯の形の表の PNG を、番号の丸と判定の札で確かめる。`scale` は CSS の 1px あたりの画素 */
function expectBandPng(picture: Picture, scale: number, what: string): void {
  const { badge, now } = marks(FACTS);
  expect(picture.width, `${what}の幅 (画素)`).toBeLessThanOrEqual(728 * scale);
  const badges = clusters(
    spots(picture, badge).map((p) => p.x),
    4 * scale,
  );
  expect(badges.length, `${what}の見出しの番号の丸の数`).toBe(FACTS.rules);
  expect(
    badges[0] ?? Number.POSITIVE_INFINITY,
    `${what}の最初の番号の丸の x (画素、左に例の列が無い)`,
  ).toBeLessThan(100 * scale);
  expect(verdictBox(picture, FACTS).rows, `${what}の判定の札の行の数`).toBe(FACTS.verdicts.length);
  expect(spots(picture, now).length, `${what}の照らした列の見出しの色の画素`).toBe(0);
}

describe("埋め込んだ頁の帯で書き出す判定の表 (#3945)", () => {
  it("frame-judge-svg-draws-band-table", () => {
    const svg = opened(SVG.get(), "/frame.js");
    expect(svg.startsWith("<svg"), "保存した SVG の頭").toBe(true);
    expect(svg.includes('data-dragon="judge-band"'), "保存した SVG に例の帯が無い").toBe(true);
    expect(svg.includes("<foreignObject"), "保存した SVG が foreignObject を持つ").toBe(false);
    const urls = [...svg.matchAll(/@font-face\s*\{[^}]*?url\(\s*["']?([^"')]+)/gu)].map((match) =>
      (match[1] ?? "").slice(0, 32),
    );
    expect(urls.length, "保存した SVG に埋めた字の書体").toBeGreaterThan(0);
    expect(
      urls.filter((url) => !url.startsWith("data:font/")),
      "data: でない字の書体の参照",
    ).toEqual([]);
  });

  it("frame-judge-png-draws-band-table", () => {
    const png = opened(PNG_SHOT.get(), "/frame.js");
    expectBandPng(pictureOf(Buffer.from(png, "base64")), 2, "2 倍で保存した PNG");
  });

  it("frame-judge-copy-draws-band-table", () => {
    const png = opened(COPY.get(), "/frame.js");
    expectBandPng(pictureOf(Buffer.from(png, "base64")), 2, "コピーした画像");
  });

  it("frame-judge-film-lights-columns-by-step", () => {
    const frames = opened(GIF.get(), "/frame.js");
    const toPicture = (frame: Frames["first"]): Picture => ({
      width: frame.width,
      height: frame.height,
      data: Buffer.from(frame.rgba, "base64"),
    });
    expect(frames.first.width, "GIF のコマの幅").toBeLessThanOrEqual(728);
    // 判定の札の囲みは、列を照らさずに 2 倍で撮った PNG の札の画素で決める。GIF は色を減らすので、コマでは色の濃い画素を数える
    const box = toGifBox(
      verdictBox(pictureOf(Buffer.from(opened(PNG_SHOT.get(), "/frame.js"), "base64")), FACTS),
    );
    expect(vivid(toPicture(frames.first), box), "最初のコマの判定の札の所の色の濃い画素").toBe(0);
    expect(
      vivid(toPicture(frames.last), box),
      `${frames.count} 番目のコマ (最後の段) の判定の札の所の色の濃い画素`,
    ).toBeGreaterThan(0);
    expect(opened(MP4.get(), "/frame.js"), "保存した mp4 の箱の頭").toBe("ftyp");
  });

  it("sdk-headless-judge-svg-draws-band-table", () => {
    const svg = opened(HEADLESS.get(), "/embed.js");
    expect(
      svg.includes('data-dragon="judge-band"'),
      "帯を出さずに置いた図の SVG に例の帯が無い",
    ).toBe(true);
    expect(
      svg.includes("<foreignObject"),
      "帯を出さずに置いた図の SVG が foreignObject を持つ",
    ).toBe(false);
  });
});
