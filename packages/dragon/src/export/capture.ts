/**
 * 画面なしの Chromium で、頁と同じ描画を時刻を止めて 1 コマずつ撮る。
 *
 * 時刻は頁の止め絵と同じく、図の `--play` を `paused` にし、`--at` に秒を入れて止める。
 * 撮ったコマは同じ頁の中で詰める。mp4 は WebCodecs で H.264 にして `mediabunny` で箱に入れ、
 * GIF は `gifenc` で詰める。GIF は前のコマと同じ所を透明にし、変わった所だけを書いて小さくする。
 * WebCodecs は安全な頁でしか使えないので、頁は `http://localhost/` に置く。
 */
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import type { Browser, Page } from "playwright-core";

const require_ = createRequire(import.meta.url);
/** 頁に読ませる詰める道具。どちらも 1 file の ES module */
const SCRIPTS: Record<string, string> = {
  "/mediabunny.js": join(dirname(require_.resolve("mediabunny")), "mediabunny.min.mjs"),
  "/gifenc.js": require_.resolve("gifenc/dist/gifenc.esm.js"),
};

/** CSS の 1px を何画素で撮るか */
const SCALE = 2;

const INSTALL = "`pnpm add -D playwright-core` で入れ、`pnpm exec playwright-core install chromium` で Chromium を入れる";

export async function launch(): Promise<Browser> {
  let chromium: (typeof import("playwright-core"))["chromium"];
  try {
    ({ chromium } = await import("playwright-core"));
  } catch {
    throw new Error(`書き出しには playwright-core が要る。${INSTALL}`);
  }
  try {
    return await chromium.launch();
  } catch (error) {
    throw new Error(`Chromium を起動できない。${INSTALL} (${String(error).split("\n")[0]})`);
  }
}

/** 図の SVG の大きさ (CSS の px) */
export function sizeOf(svg: string): { width: number; height: number } {
  const [, width = "0", height = "0"] = /^<svg\b[^>]*?\swidth="(\d+)"\s+height="(\d+)"/.exec(svg) ?? [];
  return { width: Number(width), height: Number(height) };
}

export interface Stage {
  page: Page;
  width: number;
  height: number;
}

/**
 * 図 1 枚を置いた頁を開き、字が読み込まれるまで待つ。`body` は頁の地の CSS。
 * 図は置く前から止めておく。置いてから止めると、止めるまでに進んだ分だけ毎回絵がずれる。
 */
export async function stage(browser: Browser, svg: string, fontCss: string, body: string): Promise<Stage> {
  const { width, height } = sizeOf(svg);
  const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: SCALE });
  const paused = svg.replace(/^<svg\b/, '<svg style="--play:paused;--at:0"');
  const html =
    `<!doctype html><html><head><meta charset="utf-8"><style>${fontCss}html,body{margin:0}body{${body}}svg{display:block}</style>` +
    `<script type="module">import * as mb from "/mediabunny.js";import * as gif from "/gifenc.js";window.__tools={mb,gif};</script></head><body>${paused}</body></html>`;
  await page.route("http://localhost/**", async (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path === "/") return route.fulfill({ contentType: "text/html; charset=utf-8", body: html });
    const script = SCRIPTS[path];
    return script ? route.fulfill({ contentType: "text/javascript", body: readFileSync(script) }) : route.fulfill({ status: 404 });
  });
  await page.goto("http://localhost/");
  await page.waitForFunction(() => "__tools" in window);
  await page.evaluate(async () => {
    const loads: Promise<FontFace>[] = [];
    document.fonts.forEach((face) => loads.push(face.load()));
    await Promise.all(loads);
    await document.fonts.ready;
  });
  return { page, width, height };
}

/** 止めてある図の時刻を `t` 秒に動かし、描き終わるまで待つ */
async function at(page: Page, t: number): Promise<void> {
  await page.evaluate(
    (t) =>
      new Promise<void>((done) => {
        document.querySelector("svg")?.style.setProperty("--at", String(t));
        requestAnimationFrame(() => requestAnimationFrame(() => done()));
      }),
    t,
  );
}

/** `t` 秒の止め絵の PNG。図の外 (角の丸みの外) は透明にする */
export async function still(stage: Stage, t: number): Promise<Buffer> {
  await at(stage.page, t);
  return stage.page.screenshot({ type: "png", omitBackground: true });
}

export interface Film {
  frames: number;
  mp4?: Buffer;
  gif?: Buffer;
}

/** 頁の中で詰める道具。`sample` で GIF の色の表の元を集め、`seal` で色の表を決めてから `push` でコマを渡す */
interface FilmBox {
  sample(png: string): Promise<void>;
  seal(): void;
  push(png: string, i: number): Promise<void>;
  finish(): Promise<{ mp4?: string; gif?: string }>;
}

/**
 * 1 周 (`total` 秒) を `fps` で撮り、mp4 と GIF に詰める。GIF は `gifEvery` コマに 1 枚を使い、0 なら作らない。
 * GIF の色の表は `samples` 秒の絵 (段ごとの止め絵) から 1 つだけ作り、全てのコマをその表で塗る。
 * コマごとに表を作ると、寄って追う図でコマ全体が動いた後、止まった所の淡い色がコマごとの表でばらばらに残る。
 */
export async function film(stage: Stage, plan: { total: number; fps: number; mp4: boolean; gifEvery: number; samples: number[] }): Promise<Film> {
  const { page, width, height } = stage;
  await page.evaluate(
    async ({ width, height, scale, fps, mp4, gifEvery }) => {
      const { mb, gif } = (window as unknown as { __tools: { mb: any; gif: any } }).__tools;
      let add: (bitmap: ImageBitmap, i: number) => Promise<void> = () => Promise.resolve();
      let close: () => Promise<Uint8Array | undefined> = () => Promise.resolve(undefined);
      if (mp4) {
        const canvas = new OffscreenCanvas(width * scale, height * scale);
        const context = canvas.getContext("2d") as OffscreenCanvasRenderingContext2D;
        const target = new mb.BufferTarget();
        const output = new mb.Output({ format: new mb.Mp4OutputFormat({ fastStart: "in-memory" }), target });
        const source = new mb.CanvasSource(canvas, { codec: "avc", bitrate: mb.QUALITY_MEDIUM, keyFrameInterval: 2 });
        output.addVideoTrack(source, { frameRate: fps });
        await output.start();
        add = async (bitmap, i) => {
          context.drawImage(bitmap, 0, 0);
          await source.add(i / fps, 1 / fps);
        };
        close = async () => {
          await output.finalize();
          return new Uint8Array(target.buffer as ArrayBuffer);
        };
      }

      // GIF は CSS の 1px を 1 画素で詰める。前のコマの元の絵と 1 つでも色が違う画素だけを書き、残りは透明にする。
      // 撮る絵は毎回同じなので、動いていない所はぴったり一致する。
      // 差に幅を持たせると、ゆっくり消える物の最後の数段が書かれず、薄い残りになる
      const small = new OffscreenCanvas(width, height);
      const smallContext = small.getContext("2d", { willReadFrequently: true }) as OffscreenCanvasRenderingContext2D;
      const decode = (png: string): Promise<ImageBitmap> => createImageBitmap(new Blob([Uint8Array.from(atob(png), (c) => c.charCodeAt(0))], { type: "image/png" }));
      const read = (bitmap: ImageBitmap): Uint8ClampedArray => {
        smallContext.drawImage(bitmap, 0, 0, width, height);
        return smallContext.getImageData(0, 0, width, height).data;
      };
      const encoder = gifEvery ? gif.GIFEncoder() : undefined;
      const delay = (gifEvery / fps) * 1000;
      const sampled: Uint8ClampedArray[] = [];
      // 色の表。最後の 1 色は透明に使う
      let colors: number[][] = [];
      // 色ごとに表のどの色で塗るかを 1 度だけ決めて覚える。`gifenc` の `applyPalette` は似た色の組ごとに
      // そのコマで最初に見た色で塗る色を決めるので、同じ色でもコマによって塗る色が変わり、
      // 動いた所だけを書くと、書いたコマごとに淡い色がずれて前の絵の形が浮く
      const nearest = new Map<number, number>();
      const toIndex = (data: Uint8ClampedArray): Uint8Array => {
        const index = new Uint8Array(data.length / 4);
        for (let p = 0; p < index.length; p++) {
          const i = p * 4;
          const key = ((data[i] as number) << 16) | ((data[i + 1] as number) << 8) | (data[i + 2] as number);
          let k = nearest.get(key);
          if (k === undefined) {
            k = gif.nearestColorIndex(colors, [data[i], data[i + 1], data[i + 2]]) as number;
            nearest.set(key, k);
          }
          index[p] = k;
        }
        return index;
      };
      let previous: Uint8ClampedArray | undefined;
      const writeGif = (data: Uint8ClampedArray): void => {
        const clear = colors.length;
        const index = toIndex(data);
        const before = previous;
        previous = data;
        if (!before) {
          encoder.writeFrame(index, width, height, { palette: [...colors, [0, 0, 0]], delay, dispose: 1 });
          return;
        }
        let changed = 0;
        for (let p = 0; p < index.length; p++) {
          const i = p * 4;
          if (data[i] === before[i] && data[i + 1] === before[i + 1] && data[i + 2] === before[i + 2]) index[p] = clear;
          else changed++;
        }
        // 変わった所が無いコマは、透明な 1 画素だけを書いて時間だけ進める
        if (!changed) encoder.writeFrame(new Uint8Array([clear]), 1, 1, { transparent: true, transparentIndex: clear, delay, dispose: 1 });
        else encoder.writeFrame(index, width, height, { transparent: true, transparentIndex: clear, delay, dispose: 1 });
      };

      const base64 = (bytes: Uint8Array): string => {
        let text = "";
        for (let i = 0; i < bytes.length; i += 0x8000) text += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
        return btoa(text);
      };
      const box: FilmBox = {
        async sample(png) {
          const bitmap = await decode(png);
          sampled.push(read(bitmap));
          bitmap.close();
        },
        seal() {
          const all = new Uint8ClampedArray(sampled.reduce((n, data) => n + data.length, 0));
          let offset = 0;
          for (const data of sampled) {
            all.set(data, offset);
            offset += data.length;
          }
          colors = gif.quantize(all, 255);
        },
        async push(png, i) {
          const bitmap = await decode(png);
          await add(bitmap, i);
          if (gifEvery && i % gifEvery === 0) writeGif(read(bitmap));
          bitmap.close();
        },
        async finish() {
          const video = await close();
          if (encoder) encoder.finish();
          return { ...(video ? { mp4: base64(video) } : {}), ...(encoder ? { gif: base64(encoder.bytes() as Uint8Array) } : {}) };
        },
      };
      (window as unknown as { __film: FilmBox }).__film = box;
    },
    { width, height, scale: SCALE, fps: plan.fps, mp4: plan.mp4, gifEvery: plan.gifEvery },
  );

  // コマは CDP で撮る (止め絵の撮り方の半分ほどの時間で済む)。
  // CDP は頁の画素の細かさを見ないので、撮る範囲に倍率を付けて止め絵と同じ細かさにする
  const cdp = await page.context().newCDPSession(page);
  const clip = { x: 0, y: 0, width, height, scale: SCALE };
  const shoot = async (t: number): Promise<string> => {
    await at(page, t);
    return (await cdp.send("Page.captureScreenshot", { format: "png", optimizeForSpeed: true, clip })).data;
  };
  if (plan.gifEvery) {
    for (const t of plan.samples) {
      const png = await shoot(t);
      await page.evaluate((png) => (window as unknown as { __film: FilmBox }).__film.sample(png), png);
    }
    await page.evaluate(() => (window as unknown as { __film: FilmBox }).__film.seal());
  }
  const frames = Math.round(plan.total * plan.fps);
  for (let i = 0; i < frames; i++) {
    const png = await shoot(i / plan.fps);
    await page.evaluate(([png, i]) => (window as unknown as { __film: FilmBox }).__film.push(png, i), [png, i] as const);
  }
  const out = await page.evaluate(() => (window as unknown as { __film: FilmBox }).__film.finish());
  return {
    frames,
    ...(out.mp4 ? { mp4: Buffer.from(out.mp4, "base64") } : {}),
    ...(out.gif ? { gif: Buffer.from(out.gif, "base64") } : {}),
  };
}
