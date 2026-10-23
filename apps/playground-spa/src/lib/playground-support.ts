/**
 * 公開する頁を build し、GitHub Pages と同じ形で配る (#2995)。
 *
 * 頁の CSP と字の読み込みと幅による並びは jsdom では確かめられないため、build した頁を画面なしの Chromium で開く。
 * GitHub Pages は頁を `/dragon/` の下で配り、無い path には `404.html` を返す。ここの配り手も同じ動きをする。
 */
import { execFile } from "node:child_process";
import { existsSync, mkdtempSync, readdirSync, readFileSync, statSync } from "node:fs";
import { createServer } from "node:http";
import type { AddressInfo } from "node:net";
import { tmpdir } from "node:os";
import { extname, join, resolve, sep } from "node:path";
import { promisify } from "node:util";
import { gzipSync } from "node:zlib";
import { chromium, type Browser, type BrowserContext, type Page } from "playwright";
import { expect } from "vitest";

const run = promisify(execFile);

export const root = resolve(__dirname, "../../../..");
export const app = join(root, "apps/playground-spa");
/** 頁を配る場所。`vite.config.ts` が build の時に使う前置きと同じ */
export const BASE = "/dragon/";

export interface Built {
  dir: string;
  /** 配る前に `404.html` を作る script の結果 */
  notFound: { ok: boolean; stderr: string };
}

/** 頁を一時の場所へ build し、配る時と同じ script で `404.html` を作る */
export async function buildPage(): Promise<Built> {
  const dir = mkdtempSync(join(tmpdir(), "dragon-page-"));
  const vite = join(app, "node_modules/vite/bin/vite.js");
  await run(process.execPath, [vite, "build", "--outDir", dir, "--emptyOutDir", "--logLevel", "error"], { cwd: app });
  try {
    await run(process.execPath, [join(app, "scripts/copy-404.mjs"), dir], { cwd: app });
    return { dir, notFound: { ok: true, stderr: "" } };
  } catch (error) {
    return { dir, notFound: { ok: false, stderr: String((error as { stderr?: unknown }).stderr ?? error) } };
  }
}

const TYPES: Readonly<Record<string, string>> = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript",
  ".css": "text/css",
  ".woff2": "font/woff2",
  ".woff": "font/woff",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".json": "application/json",
};

const isFile = (path: string): boolean => existsSync(path) && statSync(path).isFile();

/** build した頁を `/dragon/` の下で配る。無い path には、在れば `404.html` を 404 で返す */
export async function servePage(dir: string): Promise<{ origin: string; close: () => Promise<void> }> {
  const server = createServer((req, res) => {
    const path = decodeURIComponent(new URL(req.url ?? "/", "http://localhost").pathname);
    const inBase = path.startsWith(BASE) || `${path}/` === BASE;
    const wanted = inBase ? resolve(dir, `.${path.slice(BASE.length - 1)}`) : "";
    const inside = wanted === dir || wanted.startsWith(`${dir}${sep}`);
    const file = inside && existsSync(wanted) && statSync(wanted).isDirectory() ? join(wanted, "index.html") : wanted;
    if (inside && isFile(file)) {
      res.writeHead(200, { "content-type": TYPES[extname(file)] ?? "application/octet-stream" });
      res.end(readFileSync(file));
      return;
    }
    const notFound = join(dir, "404.html");
    if (isFile(notFound)) {
      res.writeHead(404, { "content-type": TYPES[".html"] });
      res.end(readFileSync(notFound));
      return;
    }
    res.writeHead(404, { "content-type": "text/plain" });
    res.end("Not Found");
  });
  await new Promise<void>((done) => server.listen(0, "127.0.0.1", done));
  const { port } = server.address() as AddressInfo;
  return {
    origin: `http://127.0.0.1:${port}`,
    // browser が開いたままにする接続 (keep-alive) を先に切る。切らないと close は接続が切れるまで返らない
    close: () =>
      new Promise<void>((done) => {
        server.close(() => done());
        server.closeAllConnections();
      }),
  };
}

export interface OpenOptions {
  /** 頁の置き場からの path。`url` を渡した時は読まない */
  path?: string;
  url?: string;
  locale?: string;
  colorScheme?: "light" | "dark";
  viewport?: { width: number; height: number };
}

export interface Opened {
  page: Page;
  /** CSP に止められた読み込みと実行 */
  violations: () => Promise<string[]>;
}

export interface Site {
  origin: string;
  built: Built;
  /** 新しい context で頁を開く。開いた context は `closeContexts` で閉じる */
  open: (o?: OpenOptions) => Promise<Opened>;
  closeContexts: () => Promise<void>;
  close: () => Promise<void>;
}

/**
 * 頁を build して配り、画面なしの Chromium を起こす (#3030)。
 *
 * 編集画面の検査とサイトの帯と経路の検査が同じ形で頁を開けるよう、開く手順をここに 1 つだけ持つ。
 */
export async function startSite(): Promise<Site> {
  const built = await buildPage();
  const server = await servePage(built.dir);
  const browser: Browser = await chromium.launch();
  const contexts: BrowserContext[] = [];

  const open = async (o: OpenOptions = {}): Promise<Opened> => {
    const context = await browser.newContext({
      locale: o.locale ?? "ja-JP",
      colorScheme: o.colorScheme ?? "light",
      viewport: o.viewport ?? { width: 1280, height: 860 },
    });
    contexts.push(context);
    await context.addInitScript(() => {
      const w = window as unknown as { __csp: string[] };
      w.__csp = [];
      document.addEventListener("securitypolicyviolation", (e) => w.__csp.push(`${e.violatedDirective} ${e.blockedURI}`));
    });
    const page = await context.newPage();
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto(o.url ?? `${server.origin}${o.path ?? BASE}`);
    return {
      page,
      violations: async () => [
        ...(await page.evaluate(() => (window as unknown as { __csp: string[] }).__csp)),
        ...errors.filter((m) => /Content Security Policy|EvalError|unsafe-eval/u.test(m)),
      ],
    };
  };

  return {
    origin: server.origin,
    built,
    open,
    closeContexts: async () => {
      await Promise.all(contexts.splice(0).map((c) => c.close()));
    },
    close: async () => {
      await browser.close();
      await server.close();
    },
  };
}

/** build した script と CSS の file ごとの gzip の大きさ (byte) */
export function bundleSizes(dir: string): Record<string, number> {
  const assets = join(dir, "assets");
  if (!existsSync(assets)) return {};
  return Object.fromEntries(
    readdirSync(assets)
      .filter((name) => /\.(js|css)$/u.test(name))
      .map((name) => [name, gzipSync(readFileSync(join(assets, name))).length]),
  );
}

/** 頁の source (検査と検査の助けを除く) を path と中身の組で返す */
export function pageSources(): [string, string][] {
  const out: [string, string][] = [];
  const walk = (dir: string): void => {
    for (const name of readdirSync(dir)) {
      const path = join(dir, name);
      if (statSync(path).isDirectory()) walk(path);
      else if (/\.tsx?$/u.test(name) && !/\.test\.tsx?$/u.test(name) && !/-support\.ts$/u.test(name)) {
        out.push([path.slice(root.length + 1), readFileSync(path, "utf8")]);
      }
    }
  };
  walk(join(app, "src"));
  return out;
}

/** 見本の記法の file。無ければ `undefined` */
export function example(name: string): string | undefined {
  const path = join(root, "packages/dragon/examples", name);
  return isFile(path) ? readFileSync(path, "utf8").trimEnd() : undefined;
}

/** `#rrggbb` を `getComputedStyle` が返す `rgb(r, g, b)` の形にする */
export function rgb(hex: string): string {
  const n = Number.parseInt(hex.slice(1, 7), 16);
  return `rgb(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255})`;
}

/** 段の番号の札の字 (`01/12`)。`step` は 0 から数える */
export const stepLabel = (step: number, count: number): string => `${String(step + 1).padStart(2, "0")}/${String(count).padStart(2, "0")}`;

/** 再生の部品の今の段の番号、段の本文の帯の高さ、図の幅と高さと上端の位置 (px) */
export interface StepShape {
  step: string;
  bar: number;
  width: number;
  height: number;
  top: number;
}

/**
 * `scope` の中の再生の部品の今の形 (#3049)。部品が無ければ `null`。
 * 段を送ると帯は同じこまで替わり、図は後から合わせ直すので、2 こま続けて同じ形の時だけ返す。
 */
export const stepShapeOf = (page: Page, scope: string): Promise<StepShape | null> =>
  page.evaluate(async (scope) => {
    await document.fonts.ready;
    const read = (): StepShape | null => {
      const root = document.querySelector(scope);
      const svg = root?.querySelector('svg[data-dragon="figure"]');
      const bar = root?.querySelector(".dg-bar");
      if (!root || !svg || !bar) return null;
      const box = svg.getBoundingClientRect();
      return {
        step: root.querySelector('[data-dragon="step-no"]')?.textContent ?? "",
        bar: Math.round(bar.getBoundingClientRect().height),
        width: Math.round(box.width),
        height: Math.round(box.height),
        top: Math.round(box.top),
      };
    };
    const frame = () => new Promise((done) => requestAnimationFrame(done));
    const first = read();
    await frame();
    await frame();
    const second = read();
    return first && second && JSON.stringify(first) === JSON.stringify(second) ? second : null;
  }, scope);

/**
 * 自動で送らずに `scope` の中の再生の部品の段を 1 つずつ送り、どの段でも段の本文の帯の高さと、図の幅と高さと上端の位置が
 * 1 段目と同じかを確かめる (#3049)。呼ぶ前に動きを嫌う設定 (`reducedMotion: "reduce"`) にしておく。
 * 1 段目の形は、置いた直後に図を合わせ直している間を拾わないよう、続けて 2 度同じに読めた形を使う
 */
export async function expectSteadyAcrossSteps(page: Page, scope: string, label: string): Promise<void> {
  const wait = { timeout: 8_000, interval: 100 } as const;
  const items = page.locator(`${scope} [data-dragon="steps"] > li`);
  await expect.poll(() => items.count(), { ...wait, message: `${label} の段が読めない` }).toBeGreaterThan(1);
  const count = await items.count();
  let last = "";
  await expect
    .poll(
      async () => {
        const now = JSON.stringify(await stepShapeOf(page, scope));
        const settled = now === last && now !== "null";
        last = now;
        return settled;
      },
      { ...wait, message: `${label} の 1 段目の形が定まらない` },
    )
    .toBe(true);
  const first = JSON.parse(last) as StepShape;
  expect(first.step, `${label} が 1 段目から始まらない`).toBe(stepLabel(0, count));
  /**
   * 今の段の題の上端から本文の下端までの高さと、それを入れる欄の高さ。欄は全部の段の写しを重ねた高さになる。
   * 今の段の題と本文を包む箱は欄いっぱいに伸びるので、箱ではなく題と本文の端で測る
   */
  const caption = (): Promise<{ live: number; room: number }> =>
    page.evaluate((scope) => {
      const title = document.querySelector(`${scope} [data-dragon="step-title"]`);
      const body = document.querySelector(`${scope} [data-dragon="step-body"]`);
      const room = title?.parentElement?.parentElement;
      if (!title || !body || !room) return { live: 0, room: -1 };
      return { live: body.getBoundingClientRect().bottom - title.getBoundingClientRect().top, room: room.getBoundingClientRect().height };
    }, scope);
  const seen = [await caption()];
  for (let s = 1; s < count; s++) {
    await page.locator(`${scope} [data-dragon="next"]`).click();
    await expect
      .poll(() => stepShapeOf(page, scope), { ...wait, message: `${label} の ${s + 1} 段目で、段の本文の帯の高さか図の大きさか位置が 1 段目と違う` })
      .toEqual({ ...first, step: stepLabel(s, count) });
    seen.push(await caption());
  }
  // 欄は本文の最も長い段の高さで足り、写しを縦に積んで帯を高くしすぎない
  const tallest = Math.max(...seen.map((c) => c.live));
  for (const c of seen) expect(Math.abs(c.room - tallest), `${label} の本文の欄の高さが、本文の最も長い段の高さと違う`).toBeLessThan(1);
}
