/**
 * 公開する頁を build し、GitHub Pages と同じ形で配る (#2995)。
 *
 * 頁の CSP と字の読み込みと幅による並びは jsdom では確かめられないため、build した頁を画面なしの Chromium で開く。
 * GitHub Pages は頁を `/dragon/` の下で配り、無い path には `404.html` を返す。ここの配り手も同じ動きをする。
 */
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { createServer } from "node:http";
import type { AddressInfo } from "node:net";
import { extname, join, relative, resolve, sep } from "node:path";
import { gzipSync } from "node:zlib";
import type { Browser, BrowserContext, Page } from "playwright";
import { expect, inject } from "vitest";
import { PRELOADED_CHROMIUM } from "./chromium-preload";
import { app, type Built, root } from "./site-build";
import { DEFAULT_SITE } from "./site-needs";

export { app, type Built, root };

/** ブロックの置き場。部品の図は全て `<名前>/gallery/` に在る (#3345、#3348) */
const BLOCK_FOLDERS = join(root, "packages/dragon/src/blocks");

/** 部品の図を置く dir。ブロックの置き場の見本帳の分 (`gallery/`) */
export function partFigureDirs(): string[] {
  return readdirSync(BLOCK_FOLDERS)
    .sort()
    .map((name) => join(BLOCK_FOLDERS, name, "gallery"))
    .filter((dir) => existsSync(dir));
}

/** 部品の図の file の名前 (`<名札>.<図の種類>.dragon` と英語の `.en.dragon`)。置き場を問わず名前の順 */
export function partFigureNames(): string[] {
  return partFigureDirs()
    .flatMap((dir) => readdirSync(dir).filter((name) => name.endsWith(".dragon")))
    .sort();
}

/** 部品の図の file の path。file の在る見本帳の分を返し、どこにも無ければ名札のブロックの見本帳の path を返す */
export function partFigure(name: string): string {
  return (
    partFigureDirs()
      .map((dir) => join(dir, name))
      .find((path) => existsSync(path)) ?? join(BLOCK_FOLDERS, name.split(".")[0] ?? name, "gallery", name)
  );
}
/** 頁を配る場所。`vite.config.ts` が build の時に使う前置きと同じ */
export const BASE = "/dragon/";

const HTML_TYPE = "text/html; charset=utf-8";

const TYPES: Readonly<Record<string, string>> = {
  ".html": HTML_TYPE,
  ".js": "text/javascript",
  ".css": "text/css",
  ".woff2": "font/woff2",
  ".woff": "font/woff",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".json": "application/json",
};

const isFile = (path: string): boolean => existsSync(path) && statSync(path).isFile();

/** 配る頁の 1 つの応答 */
interface Answer {
  status: number;
  type: string;
  body: Buffer | string;
}

/**
 * build した頁を `/dragon/` の下で配る規則で、URL の path に返す応答を決める。
 * 拡張子の無い経路には同じ名前の `.html` を、無い path には在れば `404.html` を 404 で返す。
 * 手元の server と、検査の頁の通信を受ける route が同じ規則で返す (#3379)
 */
export function answerPath(dir: string, pathname: string): Answer {
  const path = decodeURIComponent(pathname);
  const inBase = path.startsWith(BASE) || `${path}/` === BASE;
  const wanted = inBase ? resolve(dir, `.${path.slice(BASE.length - 1)}`) : "";
  const inside = wanted === dir || wanted.startsWith(`${dir}${sep}`);
  const file = inside && existsSync(wanted) && statSync(wanted).isDirectory() ? join(wanted, "index.html") : wanted;
  if (inside && isFile(file)) return { status: 200, type: TYPES[extname(file)] ?? "application/octet-stream", body: readFileSync(file) };
  // Pages と同じく、拡張子の無い経路には同じ名前の `.html` を返す (#3157)
  if (inside && extname(wanted) === "" && isFile(`${wanted}.html`)) return { status: 200, type: HTML_TYPE, body: readFileSync(`${wanted}.html`) };
  const notFound = join(dir, "404.html");
  if (isFile(notFound)) return { status: 404, type: HTML_TYPE, body: readFileSync(notFound) };
  return { status: 404, type: "text/plain", body: "Not Found" };
}

/** build した頁を `/dragon/` の下で配る手元の server。返し方は `answerPath` が決める。node から経路の状態を問う検査が使う */
export async function servePage(dir: string): Promise<{ origin: string; close: () => Promise<void> }> {
  const server = createServer((req, res) => {
    const answer = answerPath(dir, new URL(req.url ?? "/", "http://localhost").pathname);
    res.writeHead(answer.status, { "content-type": answer.type });
    res.end(answer.body);
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
  /** 指で触る端末を模す。`(pointer: coarse)` が当たる (#3075)。開く時は当たるまで待つ (`waitForCoarse`、#3231) */
  touch?: boolean;
  /**
   * 動きを嫌う設定。頁の入れ物を作る時に当て、頁の読み込みより先に当たる (#3231)。
   * 再生の部品はこの設定を図を描く時に 1 度だけ読むので、開いた後に `emulateMedia` で当てると、先に描かれた図が自動で段を送る
   */
  reducedMotion?: "reduce" | "no-preference";
  /** 頁を開く前に済ませる処理。読み込みを止めたり遅らせたりする道 (`page.route`) はここで置く (#3246) */
  prepare?: (page: Page) => Promise<void> | void;
}

/** 頁が読み込みの最初の瞬間に読んだ、動きを嫌う設定と指で触る設定が当たっているか */
export interface StartMedia {
  reduce: boolean;
  coarse: boolean;
}

export interface Opened {
  page: Page;
  /** CSP に止められた読み込みと実行 */
  violations: () => Promise<string[]>;
  /** 最初に開いた頁が、読み込みの最初の瞬間に読んだ設定 */
  startMedia: () => Promise<StartMedia>;
}

/**
 * 指で触る設定 (`(pointer: coarse)`) が当たるまで待つ (#3231)。`timeout` の間に当たらない時は、頁の path を名指して落とす。
 * 当たらないまま部品の大きさを測ると、部品が小さいのか設定が当たっていないのかを分けられないため、測る前にここで分ける
 */
export async function waitForCoarse(page: Page, timeout = 5_000): Promise<void> {
  try {
    await page.waitForFunction(() => matchMedia("(pointer: coarse)").matches, undefined, { timeout });
  } catch {
    throw new Error(`指で触る設定 (pointer: coarse) が当たらない: ${new URL(page.url()).pathname}`);
  }
}

export interface Site {
  origin: string;
  built: Built;
  /** 新しい context で頁を開く。開いた context は `closeContexts` で閉じる */
  open: (o?: OpenOptions) => Promise<Opened>;
  /** 開いた context を全て閉じる。`afterEach` から呼ぶ */
  closeContexts: () => Promise<void>;
  /** 頁の配り手を閉じる。Chromium は閉じない */
  close: () => Promise<void>;
}

/**
 * build した頁を配り、画面なしの Chromium で開けるようにする (#3030)。
 *
 * 編集画面の検査とサイトの帯と経路の検査が同じ形で頁を開けるよう、開く手順をここに 1 つだけ持つ。
 * 頁は 1 回の実行の準備の段 (`site-setup.ts`) が 1 度だけ build した物を使い、ここでは build しない (#3381)。
 * Chromium も検査の file の準備の段 (`chromium-preload.ts`) が file を読む前に起こし始めた物を使い、ここでは起こさない。
 * `close` は頁の配り手を閉じるだけで、Chromium は検査の file の process が終わる時に止まる (#3388)。
 * `config` は build の設定の path で、準備の段は同じ設定の build を別に 1 度だけ行う
 */
export async function startSite(o: { config?: string } = {}): Promise<Site> {
  const key = o.config === undefined ? DEFAULT_SITE : relative(app, o.config);
  const built = inject("dragonSites")[key];
  if (built === undefined) throw new Error(`見本帳の build (${key}) が準備の段に無い。検査の file が \`startSite()\` か \`startSite({ config: join(app, "…") })\` の形で呼んでいるかを確かめる (#3381)`);
  const launching = (globalThis as Record<symbol, unknown>)[PRELOADED_CHROMIUM] as Promise<Browser> | undefined;
  if (launching === undefined) throw new Error("頁を開く Chromium を準備の段 (`chromium-preload.ts`) が起こしていない。検査の file が `startSite()` か `useSite()` か `startSite({ config: join(app, \"…\") })` の形で呼んでいるかを確かめる (#3388)");
  const [server, browser] = await Promise.all([servePage(built.dir), launching]);
  const contexts: BrowserContext[] = [];

  const open = async (o: OpenOptions = {}): Promise<Opened> => {
    const context = await browser.newContext({
      locale: o.locale ?? "ja-JP",
      colorScheme: o.colorScheme ?? "light",
      viewport: o.viewport ?? { width: 1280, height: 860 },
      hasTouch: o.touch ?? false,
      reducedMotion: o.reducedMotion ?? "no-preference",
    });
    contexts.push(context);
    // 機械のネットワークが変わると、Chromium は 127.0.0.1 への読み込み中の通信も net::ERR_NETWORK_CHANGED で切る。
    // 頁の通信は手元の server を通さず、server と同じ規則で build した file から返す (#3379)。
    // 頁ごとに読み込みを止める検査は `page.route` を先に通り、`route.fallback()` でここへ渡す
    await context.route(`${server.origin}/**`, (route) => {
      const answer = answerPath(built.dir, new URL(route.request().url()).pathname);
      return route.fulfill({ status: answer.status, contentType: answer.type, body: answer.body });
    });
    await context.addInitScript(() => {
      const w = window as unknown as { __csp: string[]; __startMedia: StartMedia };
      w.__csp = [];
      document.addEventListener("securitypolicyviolation", (e) => w.__csp.push(`${e.violatedDirective} ${e.blockedURI}`));
      w.__startMedia = { reduce: matchMedia("(prefers-reduced-motion: reduce)").matches, coarse: matchMedia("(pointer: coarse)").matches };
      // 字の CSS は最初の画面を描いた後に読むので (#3292)、届く前の `document.fonts.ready` は字を待たずに解ける。
      // 字の組みを測る検査が端末の字を測らないよう、字が載り、次の描画で読み込みが始まってから本物を返す。字の CSS を止めた頁でも止まらないよう 5 秒で打ち切る。
      // 字の CSS の読み込みが落ちた頁には字が来ないので、落ちた時点で待つのをやめる。待つと頁を開くたびに 5 秒かかり、1 件の上限 (10 秒) に当たる (#3381)
      let sheetFailed = false;
      document.addEventListener(
        "error",
        (e) => {
          if (e.target instanceof HTMLLinkElement && e.target.rel === "stylesheet") sheetFailed = true;
        },
        true,
      );
      const fontSet = Object.getPrototypeOf(document.fonts) as object;
      Object.defineProperty(document.fonts, "ready", {
        get: async (): Promise<unknown> => {
          const limit = performance.now() + 5_000;
          while (document.fonts.size === 0 && !sheetFailed && performance.now() < limit) await new Promise((done) => setTimeout(done, 20));
          for (let frame = 0; frame < 2; frame += 1) await new Promise((done) => requestAnimationFrame(done));
          return Reflect.get(fontSet, "ready", document.fonts);
        },
      });
    });
    const page = await context.newPage();
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await o.prepare?.(page);
    await page.goto(o.url ?? `${server.origin}${o.path ?? BASE}`);
    // 字は `load` の後に届くことがあり、字が替わると段の題と本文の高さが 2px から 3px 変わる (#3294)。
    // 開いた直後に字の組みを測る検査のために、字を待ってから頁を渡す。頁が読み直しで入れ替わった時は待たない
    await page
      .evaluate(async () => {
        await document.fonts.ready;
      })
      .catch(() => undefined);
    if (o.touch) await waitForCoarse(page);
    return {
      page,
      violations: async () => [
        ...(await page.evaluate(() => (window as unknown as { __csp: string[] }).__csp)),
        ...errors.filter((m) => /Content Security Policy|EvalError|unsafe-eval/u.test(m)),
      ],
      startMedia: () => page.evaluate(() => (window as unknown as { __startMedia: StartMedia }).__startMedia),
    };
  };

  return {
    origin: server.origin,
    built,
    open,
    closeContexts: async () => {
      await Promise.all(contexts.splice(0).map((context) => context.close()));
    },
    close: async () => {
      await server.close();
    },
  };
}

/** 開いている画面の名前。頁の塊を待つ間 (`site/pages.tsx` の待ちの一言が画面の直下に在る間) は、画面がまだ出ていないとして null を返す (#3280) */
export const screenOf = (page: Page): Promise<string | null> =>
  page.evaluate(() => document.querySelector('[data-site-screen]:not(:has(> [data-figure="waiting"]))')?.getAttribute("data-site-screen") ?? null);

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

/**
 * build した頁が最初に読む script と CSS の file の名前 (#3246)。
 * `index.html` が `src` と `href` で名指す `assets/` の下の file で、入口と、入口が先に読むよう名指す file を含む。
 * ほかの script は頁が動いてから読む後から読む塊
 */
export function firstLoadFiles(dir: string): string[] {
  const html = readFileSync(join(dir, "index.html"), "utf8");
  return [...new Set([...html.matchAll(/\b(?:src|href)="[^"]*\/assets\/([^"/]+\.(?:js|css))"/gu)].map((m) => m[1] ?? ""))].filter(Boolean).sort();
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

/** 再生の部品の今の段の番号、図の見せ方、段の本文の帯の高さ、図の幅と高さと上端の位置 (px) */
export interface StepShape {
  step: string;
  view: string | null;
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
        view: svg.getAttribute("data-view"),
        bar: Math.round(bar.getBoundingClientRect().height),
        width: Math.round(box.width),
        height: Math.round(box.height),
        // 頁の上からの位置。段を送る釦が画面の下に在ると、押す時に頁が送られて画面の上からの位置が変わる (#3270)
        top: Math.round(box.top + scrollY),
      };
    };
    const frame = () => new Promise((done) => requestAnimationFrame(done));
    const first = read();
    await frame();
    await frame();
    const second = read();
    return first && second && JSON.stringify(first) === JSON.stringify(second) ? second : null;
  }, scope);

const STEP_WAIT = { timeout: 8_000, interval: 100 } as const;

/**
 * `scope` の中の再生の部品の、定まった形。置いた直後に図を合わせ直している間を拾わないよう、
 * 間をあけて続けて 2 度同じに読めた形を返す (#3049、#3051)
 */
export async function settledStepShape(page: Page, scope: string, label: string): Promise<StepShape> {
  let last = "";
  await expect
    .poll(
      async () => {
        const now = JSON.stringify(await stepShapeOf(page, scope));
        const settled = now === last && now !== "null";
        last = now;
        return settled;
      },
      { ...STEP_WAIT, message: `${label} の形が定まらない` },
    )
    .toBe(true);
  return JSON.parse(last) as StepShape;
}

/**
 * `scope` の中の再生の部品で、帯の最後の行 (広い帯は段ごとの進み具合、狭い帯は操作の段) の下端と `edge` の下の縁の間 (px、#3051、#3398)。
 * 部品が無ければ `null`。帯の高さは全部の段の題と本文の写しを重ねて決まる (#3049) ので、段を送っても変わらない
 */
export const barClearance = (page: Page, scope: string, edge: string): Promise<number | null> =>
  page.evaluate(
    async ([scope, edge]) => {
      await document.fonts.ready;
      const lay = document.querySelector(`${scope} .dg-lay`);
      const holder = document.querySelector(edge);
      if (!lay || !holder) return null;
      return holder.getBoundingClientRect().bottom - lay.getBoundingClientRect().bottom;
    },
    [scope, edge] as const,
  );

/**
 * 自動で送らずに `scope` の中の再生の部品の段を 1 つずつ送り、どの段でも段の本文の帯の高さと、図の幅と高さと上端の位置が
 * 1 段目と同じかを確かめる (#3049)。呼ぶ前に動きを嫌う設定 (`reducedMotion: "reduce"`) にしておく
 */
export async function expectSteadyAcrossSteps(page: Page, scope: string, label: string): Promise<void> {
  const items = page.locator(`${scope} [data-dragon="steps"] > li`);
  await expect.poll(() => items.count(), { ...STEP_WAIT, message: `${label} の段が読めない` }).toBeGreaterThan(1);
  const count = await items.count();
  const first = await settledStepShape(page, scope, `${label} の 1 段目`);
  expect(first.step, `${label} が 1 段目から始まらない`).toBe(stepLabel(0, count));
  /**
   * 今の段の題の上端から本文の下端までの高さと、それを入れる欄の高さ。欄は全部の段の写しを重ねた高さになる。
   * 今の段の題と本文を包む箱は欄いっぱいに伸びるので、箱ではなく題と本文の端で測る。
   * 欄は写しの題と本文を囲む範囲で測る。狭い帯では題と本文を別の段に置き、写しを包む箱が無くなる (#3057)
   */
  const caption = (): Promise<{ live: number; room: number }> =>
    page.evaluate((scope) => {
      const title = document.querySelector(`${scope} [data-dragon="step-title"]`);
      const body = document.querySelector(`${scope} [data-dragon="step-body"]`);
      const copies = [...document.querySelectorAll(`${scope} [data-dragon="caption-room"] > *`)].map((copy) => copy.getBoundingClientRect());
      if (!title || !body || copies.length === 0) return { live: 0, room: -1 };
      const room = Math.max(...copies.map((copy) => copy.bottom)) - Math.min(...copies.map((copy) => copy.top));
      return { live: body.getBoundingClientRect().bottom - title.getBoundingClientRect().top, room };
    }, scope);
  const seen = [await caption()];
  for (let s = 1; s < count; s++) {
    await page.locator(`${scope} [data-dragon="next"]`).click();
    await expect
      .poll(() => stepShapeOf(page, scope), { ...STEP_WAIT, message: `${label} の ${s + 1} 段目で、段の本文の帯の高さか図の大きさか位置が 1 段目と違う` })
      .toEqual({ ...first, step: stepLabel(s, count) });
    seen.push(await caption());
  }
  // 欄は本文の最も長い段の高さで足り、写しを縦に積んで帯を高くしすぎない
  const tallest = Math.max(...seen.map((c) => c.live));
  for (const c of seen) expect(Math.abs(c.room - tallest), `${label} の本文の欄の高さが、本文の最も長い段の高さと違う`).toBeLessThan(1);
}

/**
 * `selector` の釦が押せなくなるまで押す (#3105)。
 * 範囲の端に着いても釦が押せなくならない形でも止まるよう、`limit` 回で押すのをやめる
 */
export async function pressUntilDisabled(page: Page, selector: string, limit = 40): Promise<void> {
  const button = page.locator(selector);
  for (let pressed = 0; pressed < limit && !(await button.isDisabled()); pressed++) await button.click();
}
