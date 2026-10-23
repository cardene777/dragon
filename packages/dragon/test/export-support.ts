/**
 * 書き出しの検査が共に使う道具 (#2986)。
 *
 * 入口は `@cardenelabs/dragon/export` (= `dist/export.js`) と命令 (`dist/cli.js`) から引く。
 * 入口がまだ出ていない時は「出ていない」と判定に出してから止める。
 *
 * 書き出した mp4 のコマは、画面なしの Chromium の中で読み戻す (WebCodecs と `mediabunny`)。
 * HTML に埋めた字の file が持つ字は、woff2 を sfnt に戻して HarfBuzz で数える。
 */
import { execFile } from "node:child_process";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { pathToFileURL } from "node:url";
import { promisify } from "node:util";
import { Blob as HbBlob, Face } from "harfbuzzjs";
import { chromium, type Page } from "playwright-core";
import { expect } from "vitest";

const require_ = createRequire(import.meta.url);
const fontverter = require_("fontverter") as { convert(buffer: Uint8Array, to: "sfnt"): Promise<Uint8Array> };

export type Format = "mp4" | "gif" | "html" | "png";

export interface ExportOptions {
  outDir: string;
  name?: string;
  formats?: Format[];
  width?: number;
  palette?: string;
  theme?: "light" | "dark";
  fps?: number;
  gifFps?: number;
  /** 図の中の字 (全体図の札、読み上げの名前、断りの文) の言葉 (#3001) */
  lang?: "ja" | "en";
}

/** 書き出した file と、動画のコマの大きさ (CSS の px) */
export interface Exported {
  files: Partial<Record<Format, string>>;
  view: "fixed" | "follow";
  frames: number;
  width: number;
  height: number;
}

type ExportDiagram = (diagram: unknown, options: ExportOptions) => Promise<Exported>;

const ENTRY = "@cardenelabs/dragon/export";

export async function exporter(): Promise<ExportDiagram> {
  const mod = (await import(/* @vite-ignore */ ENTRY).catch(() => undefined)) as { exportDiagram?: ExportDiagram } | undefined;
  expect(mod?.exportDiagram, `exportDiagram が ${ENTRY} から出ていない`).toBeDefined();
  return mod?.exportDiagram as ExportDiagram;
}

// 命令の置き場は repo の根 (vitest を回す場所) から引く
const CLI = join(process.cwd(), "packages/dragon/dist/cli.js");

export interface Ran {
  code: number;
  stdout: string;
  stderr: string;
}

/** 命令を走らせる場。`env` は今の環境変数に足し、`nodeArgs` は node に命令より先に渡す (#3003) */
export interface RunPlace {
  env?: Record<string, string>;
  nodeArgs?: string[];
}

/** `playwright-core` が入っていない場。撮る道具が無い時の断りを確かめる (#3003、#3013) */
export const withoutPlaywright = (): RunPlace => ({
  nodeArgs: ["--import", pathToFileURL(join(process.cwd(), "packages/dragon/test/fixtures/hide-playwright-core.mjs")).href],
});

/** 書き出しの命令を node で走らせる。落ちても投げずに終わり方を返す */
export async function runCli(args: string[], place: RunPlace = {}): Promise<Ran> {
  try {
    const { stdout, stderr } = await promisify(execFile)(process.execPath, [...(place.nodeArgs ?? []), CLI, ...args], {
      encoding: "utf8",
      env: { ...process.env, ...place.env },
    });
    return { code: 0, stdout, stderr };
  } catch (error) {
    const failed = error as { code?: unknown; stdout?: string; stderr?: string };
    return { code: typeof failed.code === "number" ? failed.code : 1, stdout: failed.stdout ?? "", stderr: failed.stderr ?? "" };
  }
}

/** file の頭の数バイトで形を見分ける */
export function formatOf(bytes: Buffer): Format | "unknown" {
  if (bytes.subarray(4, 8).toString("latin1") === "ftyp") return "mp4";
  if (bytes.subarray(0, 6).toString("latin1") === "GIF89a") return "gif";
  if (bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "png";
  if (/^<!doctype html>/i.test(bytes.subarray(0, 32).toString("utf8"))) return "html";
  return "unknown";
}

const MEDIABUNNY = join(dirname(require_.resolve("mediabunny")), "mediabunny.min.mjs");

/** `http://localhost/` に頁を置いた Chromium で `run` を回す。WebCodecs は安全な頁でしか使えない */
async function withPage<T>(html: string, viewport: { width: number; height: number }, run: (page: Page) => Promise<T>, extra: Record<string, Buffer> = {}): Promise<T> {
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({ viewport });
    await page.route("http://localhost/**", async (route) => {
      const path = new URL(route.request().url()).pathname;
      if (path === "/") return route.fulfill({ contentType: "text/html; charset=utf-8", body: html });
      if (path === "/mediabunny.js") return route.fulfill({ contentType: "text/javascript", body: readFileSync(MEDIABUNNY) });
      const body = extra[path];
      return body ? route.fulfill({ body }) : route.fulfill({ status: 404 });
    });
    await page.goto("http://localhost/");
    return await run(page);
  } finally {
    await browser.close();
  }
}

export interface Frame {
  width: number;
  height: number;
  rgba: Buffer;
}

/** mp4 を読み戻し、長さに対する割合 (`0` が最初、`0.5` が真ん中) の時刻のコマを返す */
export async function decodeFrames(mp4: Buffer, fractions: number[]): Promise<Frame[]> {
  const html = `<!doctype html><script type="module">import * as mb from "/mediabunny.js"; window.mb = mb;</script>`;
  return withPage(
    html,
    { width: 320, height: 240 },
    async (page) => {
      await page.waitForFunction(() => "mb" in window);
      const out = await page.evaluate(async (fractions) => {
        const mb = (window as unknown as { mb: any }).mb;
        const data = await (await fetch("/video.mp4")).arrayBuffer();
        const input = new mb.Input({ source: new mb.BufferSource(data), formats: mb.ALL_FORMATS });
        const track = await input.getPrimaryVideoTrack();
        const duration: number = await input.computeDuration();
        const sink = new mb.CanvasSink(track, { poolSize: 0 });
        const frames: { width: number; height: number; rgba: string }[] = [];
        for (const f of fractions) {
          const wrapped = await sink.getCanvas(Math.min(duration * f, duration - 1e-3));
          const canvas = wrapped.canvas as HTMLCanvasElement;
          const pixels = (canvas.getContext("2d") as CanvasRenderingContext2D).getImageData(0, 0, canvas.width, canvas.height).data;
          let text = "";
          for (let i = 0; i < pixels.length; i += 0x8000) text += String.fromCharCode(...pixels.subarray(i, i + 0x8000));
          frames.push({ width: canvas.width, height: canvas.height, rgba: btoa(text) });
        }
        return frames;
      }, fractions);
      return out.map((frame) => ({ width: frame.width, height: frame.height, rgba: Buffer.from(frame.rgba, "base64") }));
    },
    { "/video.mp4": mp4 },
  );
}

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** 書き出した HTML を開いた時の言葉と、読み上げの名前と、寄って見せる時の全体図の札 (#3001) */
export interface PlayerWords {
  /** `<html>` の `lang` 属性 */
  htmlLang: string | null;
  prev: string | null;
  /** 動かしている間の止める釦 */
  pause: string | null;
  /** 押して止めた後の止める釦 */
  play: string | null;
  next: string | null;
  steps: string | null;
  overview: string | null;
  /** 全体図の札の描いた幅が、全体図の地の描いた幅の中に収まるか */
  overviewFits: boolean;
}

/** 書き出した HTML を `width` の幅で開いて読む。寄って見せる見せ方になる幅で開く */
/** 段ごとの段の番号の札の字、段の本文の帯の高さ、図の上端の位置 (px) */
export interface CaptionStep {
  step: string;
  bar: number;
  top: number;
}

/**
 * 書き出した HTML を動きを嫌う設定で幅 `width` で開き、段を 1 つずつ送って、段ごとの帯の高さと図の上端の位置を返す (#3049)。
 * 自動で送ると読む前に段が替わるので、止め絵を釦で送る
 */
export async function captionSteps(html: string, width: number): Promise<CaptionStep[]> {
  return withPage(html, { width, height: 2000 }, async (page) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.reload();
    await page.locator('[data-dragon="player"] svg').waitFor({ state: "attached" });
    await page.evaluate(() => document.fonts.ready);
    const count = await page.locator('[data-dragon="steps"] > li').count();
    const seen: CaptionStep[] = [];
    for (let s = 0; s < count; s++) {
      const label = `${String(s + 1).padStart(2, "0")}/${String(count).padStart(2, "0")}`;
      await page.waitForFunction((label) => document.querySelector('[data-dragon="step-no"]')?.textContent === label, label);
      seen.push(
        await page.evaluate(() => {
          const bar = document.querySelector(".dg-bar")?.getBoundingClientRect();
          const svg = document.querySelector('[data-dragon="player"] svg')?.getBoundingClientRect();
          return {
            step: document.querySelector('[data-dragon="step-no"]')?.textContent ?? "",
            bar: Math.round(bar?.height ?? -1),
            top: Math.round(svg?.top ?? -1),
          };
        }),
      );
      if (s < count - 1) await page.locator('[data-dragon="next"]').click();
    }
    return seen;
  });
}

export async function playerWords(html: string, width: number): Promise<PlayerWords> {
  return withPage(html, { width, height: 2000 }, async (page) => {
    await page.locator('[data-dragon="player"] svg[data-view="follow"]').waitFor({ state: "attached" });
    const label = (name: string): Promise<string | null> => page.locator(`[data-dragon="${name}"]`).getAttribute("aria-label");
    const pause = await label("toggle");
    const overview = await page.evaluate(() => {
      const text = document.querySelector<SVGTextElement>('[data-dragon="player"] svg .dg-mm-t');
      const ground = document.querySelector<SVGRectElement>('[data-dragon="player"] svg .dg-mm-bg');
      if (!text || !ground) return { text: null, fits: false };
      const t = text.getBBox();
      const g = ground.getBBox();
      return { text: text.textContent, fits: t.x >= g.x && t.x + t.width <= g.x + g.width };
    });
    await page.locator('[data-dragon="toggle"]').click();
    return {
      htmlLang: await page.evaluate(() => document.documentElement.getAttribute("lang")),
      prev: await label("prev"),
      pause,
      play: await label("toggle"),
      next: await label("next"),
      steps: await label("steps"),
      overview: overview.text,
      overviewFits: overview.fits,
    };
  });
}

/** 書き出した HTML を `width` の幅で開き、隅の全体図の中身の四角 (CSS の px) を読む */
export async function miniWorld(html: string, width: number): Promise<Rect> {
  return withPage(html, { width, height: 2000 }, async (page) => {
    const world = page.locator("svg .dg-mm-world");
    await world.waitFor({ state: "attached" });
    const attr = async (name: string): Promise<number> => Number(await world.getAttribute(name));
    return { x: await attr("x"), y: await attr("y"), w: await attr("width"), h: await attr("height") };
  });
}

/**
 * 四角の中の濃い点の重心。全体図では今見ている所の枠だけが墨の色で描かれる。
 * 動画のコマは CSS の px の `scale` 倍で撮られている。
 */
export function inkCentroid(frame: Frame, rect: Rect, scale: number): { x: number; y: number; count: number } {
  let sx = 0;
  let sy = 0;
  let count = 0;
  const x0 = Math.ceil(rect.x * scale);
  const y0 = Math.ceil(rect.y * scale);
  const x1 = Math.floor((rect.x + rect.w) * scale);
  const y1 = Math.floor((rect.y + rect.h) * scale);
  for (let y = y0; y < y1; y++) {
    for (let x = x0; x < x1; x++) {
      const i = (y * frame.width + x) * 4;
      const level = ((frame.rgba[i] ?? 255) + (frame.rgba[i + 1] ?? 255) + (frame.rgba[i + 2] ?? 255)) / 3;
      if (level < 80) {
        sx += x;
        sy += y;
        count++;
      }
    }
  }
  return count ? { x: sx / count, y: sy / count, count } : { x: Number.NaN, y: Number.NaN, count };
}

/** HTML に埋めた字の file。`@font-face` ごとに、字の名前と中身を返す */
export function embeddedFonts(html: string): { family: string; woff2: Buffer }[] {
  const out: { family: string; woff2: Buffer }[] = [];
  for (const [, rule = ""] of html.matchAll(/@font-face\s*\{([^}]*)\}/g)) {
    const family = /font-family:\s*["']?([^;"']+)/.exec(rule)?.[1]?.trim() ?? "";
    const data = /url\(\s*["']?data:font\/woff2;base64,([A-Za-z0-9+/=]+)/.exec(rule)?.[1];
    if (data) out.push({ family, woff2: Buffer.from(data, "base64") });
  }
  return out;
}

/** 字の file が持つ字 */
export async function fontChars(woff2: Buffer): Promise<Set<string>> {
  const sfnt = await fontverter.convert(woff2, "sfnt");
  const face = new Face(new HbBlob(new Uint8Array(sfnt)), 0);
  return new Set([...face.collectUnicodes()].map((code) => String.fromCodePoint(code)));
}

/** 同梱した字の package が描ける字か (`unicode.json` が並べる範囲のどれかに入るか) */
export function bundledCovers(char: string): boolean {
  const code = char.codePointAt(0) ?? -1;
  return ["@fontsource-variable/noto-sans-jp", "@fontsource-variable/jetbrains-mono"].some((name) => {
    const ranges = JSON.parse(readFileSync(require_.resolve(`${name}/unicode.json`), "utf8")) as Record<string, string>;
    return Object.values(ranges).some((list) =>
      list.split(",").some((part) => {
        const [from = "", to = from] = part.trim().replace(/^U\+/i, "").split("-");
        return code >= parseInt(from, 16) && code <= parseInt(to, 16);
      }),
    );
  });
}

/**
 * 書き出した HTML を開いて描かれる字。動いている時、止めた時 (釦の字が変わる)、
 * 狭い枠で寄って見せる時 (全体図の題が出る) の 3 つを合わせる。`<style>` の中身は描かれないので外す。
 */
export async function drawnText(html: string): Promise<string> {
  return withPage(html, { width: 1280, height: 2000 }, async (page) => {
    const read = (): Promise<string> =>
      page.evaluate(() => {
        const root = document.querySelector('[data-dragon="player"]');
        if (!root) return "";
        const copy = root.cloneNode(true) as Element;
        copy.querySelectorAll("style").forEach((style) => style.remove());
        return copy.textContent ?? "";
      });
    await page.locator('[data-dragon="player"] svg').waitFor({ state: "attached" });
    const playing = await read();
    await page.locator('[data-dragon="toggle"]').click();
    const paused = await read();
    await page.setViewportSize({ width: 200, height: 2000 });
    await page.locator('[data-dragon="player"] svg[data-view="follow"]').waitFor({ state: "attached" });
    return playing + paused + (await read());
  });
}
