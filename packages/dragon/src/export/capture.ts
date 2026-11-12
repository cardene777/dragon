/**
 * 画面なしの Chromium で、頁と同じ描画を時刻を止めて 1 コマずつ撮る。
 *
 * 時刻は頁の止め絵と同じく、図の `--play` を `paused` にし、`--at` に秒を入れて止める。
 * 撮ったコマは同じ頁の中で詰める。詰める処理とコマの計画は書き出す入口と同じ物 (`film.ts`) を使う (#3644)。
 * mp4 は WebCodecs で H.264 にして `mediabunny` で箱に入れ、GIF は `gifenc` で詰める。
 * WebCodecs は安全な頁でしか使えないので、頁は `http://localhost/` に置く。
 */
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import type { Browser, Page } from "playwright-core";
import type { NotationLang } from "../words";
import { FILM_SCALE, type FilmBox, type FilmPlan, type FilmSize, makeFilm } from "./film";

const require_ = createRequire(import.meta.url);
/** 頁に読ませる詰める道具。どちらも 1 file の ES module */
const SCRIPTS: Record<string, string> = {
  "/mediabunny.js": join(dirname(require_.resolve("mediabunny")), "mediabunny.min.mjs"),
  "/gifenc.js": require_.resolve("gifenc/dist/gifenc.esm.js"),
};

const INSTALL_ADD = "`pnpm add -D playwright-core`";
const INSTALL_CHROMIUM = "`pnpm exec playwright-core install chromium`";

/** 書き出す道具が無い時の断りの文。言葉ごとに持つ (#3003) */
const LAUNCH_TEXT: Record<NotationLang, { missing: string; cannotLaunch: string; install: string }> = {
  ja: {
    missing: "書き出しには playwright-core が要る。",
    cannotLaunch: "Chromium を起動できない。",
    install: `${INSTALL_ADD} で入れ、${INSTALL_CHROMIUM} で Chromium を入れる`,
  },
  en: {
    missing: "Exporting needs playwright-core. ",
    cannotLaunch: "Cannot launch Chromium. ",
    install: `Install playwright-core with ${INSTALL_ADD} and Chromium with ${INSTALL_CHROMIUM}`,
  },
};

/** 撮る頁が字の file を読めない時の断りの文。読めない file を `"<字の名前>" <字の範囲>` で並べて名指す (#3212) */
const FONT_TEXT: Record<NotationLang, (faces: string[]) => string> = {
  ja: (faces) => `書き出しに埋める字の file を Chromium が読めない (${faces.join("、")})`,
  en: (faces) => `Chromium cannot read the font files embedded in the export (${faces.join("; ")})`,
};

/** 画面なしの Chromium を起こす。起こせない時は、渡した言葉で入れ方を添えて断る */
export async function launch(lang: NotationLang): Promise<Browser> {
  const text = LAUNCH_TEXT[lang];
  let chromium: (typeof import("playwright-core"))["chromium"];
  try {
    ({ chromium } = await import("playwright-core"));
  } catch {
    throw new Error(`${text.missing}${text.install}`);
  }
  try {
    return await chromium.launch();
  } catch (error) {
    throw new Error(`${text.cannotLaunch}${text.install} (${String(error).split("\n")[0]})`);
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
 * 字の file を 1 つでも読めない時は、読めない file を `lang` の言葉で名指して断る。
 */
export async function stage(browser: Browser, svg: string, fontCss: string, body: string, lang: NotationLang): Promise<Stage> {
  const { width, height } = sizeOf(svg);
  const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: FILM_SCALE });
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
  const unreadable = await page.evaluate(async () => {
    const faces: FontFace[] = [];
    document.fonts.forEach((face) => faces.push(face));
    const loads = await Promise.allSettled(faces.map((face) => face.load()));
    await document.fonts.ready;
    return faces.filter((_, i) => loads[i]?.status === "rejected").map((face) => `"${face.family.replace(/^["']|["']$/g, "")}" ${face.unicodeRange}`);
  });
  if (unreadable.length) {
    await page.close();
    throw new Error(FONT_TEXT[lang](unreadable));
  }
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

/** 撮る頁に置いた詰める箱 (`film.ts` の `makeFilm` が作る物) */
type FilmWindow = Window & { __film: FilmBox };

/**
 * 計画 (`planFilm`) のとおりに 1 周を撮り、mp4 と GIF に詰める。GIF の色の表は計画の `samples` 秒の絵から作る。
 * 詰める処理は書き出す入口と同じ物 (`makeFilm`) を、字の並びにして撮る頁へ送って動かす (#3644)
 */
export async function film(stage: Stage, plan: FilmPlan): Promise<Film> {
  const { page, width, height } = stage;
  const size: FilmSize = { width, height, scale: FILM_SCALE, fps: plan.fps, mp4: plan.mp4, gifEvery: plan.gifEvery };
  await page.evaluate(`(async () => { window.__film = await (${makeFilm.toString()})(window.__tools, ${JSON.stringify(size)}); })()`);

  // コマは CDP で撮る (止め絵の撮り方の半分ほどの時間で済む)。
  // CDP は頁の画素の細かさを見ないので、撮る範囲に倍率を付けて止め絵と同じ細かさにする
  const cdp = await page.context().newCDPSession(page);
  const clip = { x: 0, y: 0, width, height, scale: FILM_SCALE };
  const shoot = async (t: number): Promise<string> => {
    await at(page, t);
    return (await cdp.send("Page.captureScreenshot", { format: "png", optimizeForSpeed: true, clip })).data;
  };
  /** 撮った PNG を頁の中で絵に戻し、箱に色の表の元 (`sample`) かコマ (`push`) として渡す */
  const feed = (png: string, i: number | undefined): Promise<void> =>
    page.evaluate(
      async ([png, i]) => {
        const box = (window as unknown as FilmWindow).__film;
        const bitmap = await createImageBitmap(new Blob([Uint8Array.from(atob(png), (c) => c.charCodeAt(0))], { type: "image/png" }));
        try {
          if (i === undefined) box.sample(bitmap);
          else await box.push(bitmap, i);
        } finally {
          bitmap.close();
        }
      },
      [png, i] as const,
    );
  if (plan.gifEvery) {
    for (const t of plan.samples) await feed(await shoot(t), undefined);
    await page.evaluate(() => (window as unknown as FilmWindow).__film.seal());
  }
  for (let i = 0; i < plan.frames; i++) await feed(await shoot(i / plan.fps), i);
  const out = await page.evaluate(async () => {
    const base64 = (bytes: Uint8Array): string => {
      let text = "";
      for (let i = 0; i < bytes.length; i += 0x8000) text += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
      return btoa(text);
    };
    const made = await (window as unknown as FilmWindow).__film.finish();
    return { ...(made.mp4 ? { mp4: base64(made.mp4) } : {}), ...(made.gif ? { gif: base64(made.gif) } : {}) };
  });
  return {
    frames: plan.frames,
    ...(out.mp4 ? { mp4: Buffer.from(out.mp4, "base64") } : {}),
    ...(out.gif ? { gif: Buffer.from(out.gif, "base64") } : {}),
  };
}
