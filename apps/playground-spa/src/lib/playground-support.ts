/**
 * 公開する頁を build し、GitHub Pages と同じ形で配る (#2995)。
 *
 * 頁の CSP と字の読み込みと幅による並びは jsdom では確かめられないため、build した頁を画面なしの Chromium で開く。
 * GitHub Pages は頁を `/dragon/` の下で配り、無い path には `404.html` を返す。ここの配り手も同じ動きをする。
 */
import { execFile } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { createServer } from "node:http";
import type { AddressInfo } from "node:net";
import { cpus, freemem, loadavg, tmpdir } from "node:os";
import { dirname, extname, join, resolve, sep } from "node:path";
import { promisify } from "node:util";
import { gzipSync } from "node:zlib";
import { chromium, type Browser, type BrowserContext, type Page } from "playwright";
import { expect, TestRunner } from "vitest";

const run = promisify(execFile);

export const root = resolve(__dirname, "../../../..");
export const app = join(root, "apps/playground-spa");

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

export interface Built {
  dir: string;
  /** 配る前に `404.html` を作る script の結果 */
  notFound: { ok: boolean; stderr: string };
}

/**
 * 頁を一時の場所へ build し、配る時と同じ script で `404.html` を作る。
 * 検査の道具は `NODE_ENV` を `test` にして起きるので、そのまま build に渡すと React の開発用の版が入り、配る頁と中身も大きさも違う。
 * 配る時の build (`NODE_ENV` を持たない `vite build`) と同じ `production` で build する (#3163)。
 * `config` を渡すと、`vite.config.ts` の代わりにその設定で build する (字の重なりを 1 件持つ図を描く検査だけの build、#3197)
 */
export async function buildPage(config?: string): Promise<Built> {
  const dir = mkdtempSync(join(tmpdir(), "dragon-page-"));
  const vite = join(app, "node_modules/vite/bin/vite.js");
  const chosen = config === undefined ? [] : ["--config", config];
  await run(process.execPath, [vite, "build", ...chosen, "--outDir", dir, "--emptyOutDir", "--logLevel", "error"], { cwd: app, env: { ...process.env, NODE_ENV: "production" } });
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

/** build した頁を `/dragon/` の下で配る。拡張子の無い経路には同じ名前の `.html` を、無い path には在れば `404.html` を 404 で返す */
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
    // Pages と同じく、拡張子の無い経路には同じ名前の `.html` を返す (#3157)
    if (inside && extname(wanted) === "" && isFile(`${wanted}.html`)) {
      res.writeHead(200, { "content-type": TYPES[".html"] });
      res.end(readFileSync(`${wanted}.html`));
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

/** 頁ごとに記録に残す、切れた通信の数の上限。字の file が多く、同じ瞬間に数十件切れるので 1 行に収める */
const CUT_KEPT = 20;
const cutRequests = new WeakMap<Page, string[]>();

/**
 * 頁の通信が切れたら file の名前と訳を覚える (#3288)。
 * 機械のネットワークが変わると Chromium は読み込み中の通信をまとめて切り、頁は応えたまま塊を読めずに止まる。
 * 頁を移る時と閉じる時に切れる `net::ERR_ABORTED` は落ちた訳にならないので数えない
 */
export function watchCutRequests(page: Page): void {
  const cut: string[] = [];
  cutRequests.set(page, cut);
  page.on("requestfailed", (request) => {
    const reason = request.failure()?.errorText ?? "";
    if (reason !== "net::ERR_ABORTED" && cut.length < CUT_KEPT) cut.push(`${new URL(request.url()).pathname.split("/").pop()} ${reason}`);
  });
}

/** 頁 1 つの様子。落ちた検査で頁が描き替えを止めていたかを後から調べる (#3278) */
export interface PageProbe {
  /** 頁の path。hash は記法を持って長いので外す */
  path: string;
  width: number;
  /** 待つ間に頁が応えたか。主の処理が塞がっていると false */
  responds: boolean;
  /** 次の描き替えまでの ms。待つ間に描き替えが無いか、頁が応えない時は null */
  frameMs: number | null;
  /** `document.visibilityState`。頁が応えない時は null */
  visibility: string | null;
  /** 頁の塊 (`site/pages.tsx`) を待っているか読めなかったか。どちらでもない時と頁が応えない時は null (#3288) */
  later: "waiting" | "failed" | null;
  /** 切れた通信の file と訳 (#3288) */
  cut: string[];
  /**
   * 初めに調べた時に描き替えなかった頁で、待ち始めてからまた描き替えるまでの ms。待つ間に描き替えなければ null (#3300)。
   * 描き替えていた頁は持たない
   */
  backMs?: number | null;
}

/**
 * 固まった頁がまた描き替えるのを待つ長さの既定 (#3300)。
 * 釦を押して 30 秒で検査が落ちた後に 60 秒待つので、押してから約 95 秒までに頁が戻るかが分かる
 */
export const STALL_BACK_WAIT = 60_000;
/** 待つ長さの他に、落ちた時の記録が掛ける手間の上限。頁を初めに調べる 3.5 秒、`sample` の書き出しの上限 10 秒、頁を閉じる分 (#3300) */
export const STALL_RECORD_EXTRA = 15_000;
/** `sample` が呼び出しの並びを取る秒数 */
const SAMPLE_SECONDS = 2;
/** `sample` が file を書き終えるまでの上限。混んだ機械では名前の解決に時間が掛かる */
const SAMPLE_LIMIT = 10_000;
/** 主の thread の一番長く居た所として残す、呼び出しの末端からの段の数 */
const MAIN_FRAMES = 5;

/** 落ちた時に `sample` で覗いた process 1 つ (#3300) */
export interface ProcessSample {
  /** `SystemInfo.getProcessInfo` の種類。描画の process は `renderer`、GPU の process は `GPU` */
  type: string;
  pid: number;
  /** `sample` の全文を書いた file。取れなかった時は null */
  file: string | null;
  /**
   * 主の thread が一番長く居た呼び出しの並びの、末端から 5 段。各段は `名前+位置 (置き場)` の形。
   * Playwright の Chromium は関数名を落としてあるので、Chromium の段の名前は近くの別名で、同じ版の中で位置を比べるのに使う
   */
  main: string[];
  /** 取れなかった訳 */
  error?: string;
}

export interface StallRecordOptions {
  /** 固まった頁がまた描き替えるのを待つ長さ (ms)。既定は `STALL_BACK_WAIT` */
  backWait?: number;
  /** 呼び出しの並びを取る命令。既定は macOS の `sample` */
  sampler?: string;
  /**
   * 固まった頁を残して落ちた時に、1 回の止まりにつき 1 つの dir を作り、`record.json` と `sample` の全文の file を残す置き場 (#3303)。
   * 無い時は `sample` の file を一時の場所に書くだけで、後から拾える物を残さない
   */
  store?: string;
  /** 落ちた検査の名前と file。置き場に残す `record.json` に書く */
  test?: { name: string; file: string };
}

/**
 * 一式が固まって落ちた時の記録を残す置き場。worktree で回しても本体の checkout の `.context/stall-records/` を返す (#3303)。
 * 毎朝の定期実行がここから新しい記録を拾い、#3302 に貼る。git で本体を引けない時は undefined
 */
export async function stallStoreOf(dir: string): Promise<string | undefined> {
  try {
    const { stdout } = await run("git", ["-C", dir, "rev-parse", "--path-format=absolute", "--git-common-dir"]);
    return join(dirname(stdout.trim()), ".context", "stall-records");
  } catch {
    return undefined;
  }
}

/**
 * 開いている頁ごとに、描き替えの周期が動いているか、頁が応えるか、見えている扱いかを調べる (#3278)。
 *
 * 釦を押す前に Playwright は位置が止まっているかを描き替え 2 回分で確かめるので、描き替えが止まると押す所で待ち続ける。
 * 頁が応えない時も `wait` の少し後に返す = 落ちた検査の後始末を止めない
 */
export async function probePages(pages: Page[], wait = 3_000): Promise<PageProbe[]> {
  return Promise.all(
    pages.map(async (page) => {
      const seen = page
        .evaluate(
          (wait) =>
            new Promise<{ frameMs: number | null; visibility: string; later: "waiting" | "failed" | null }>((done) => {
              const start = performance.now();
              const screen = document.querySelector("[data-site-screen]");
              const later = screen?.querySelector(':scope > [data-figure="waiting"]') ? "waiting" : screen?.querySelector(':scope > [data-catalog="later-failed"]') ? "failed" : null;
              const timer = setTimeout(() => done({ frameMs: null, visibility: document.visibilityState, later }), wait);
              requestAnimationFrame(() => {
                clearTimeout(timer);
                done({ frameMs: Math.round(performance.now() - start), visibility: document.visibilityState, later });
              });
            }),
          wait,
        )
        .catch(() => null);
      let timer: ReturnType<typeof setTimeout> | undefined;
      const late = new Promise<null>((done) => {
        timer = setTimeout(() => done(null), wait + 500);
      });
      const got = await Promise.race([seen, late]);
      clearTimeout(timer);
      return {
        path: new URL(page.url()).pathname,
        width: page.viewportSize()?.width ?? 0,
        responds: got !== null,
        frameMs: got?.frameMs ?? null,
        visibility: got?.visibility ?? null,
        later: got?.later ?? null,
        cut: cutRequests.get(page) ?? [],
      };
    }),
  );
}

/**
 * 頁ごとに、また描き替えるまで `limit` ms の間調べ直し、待ち始めてから描き替えるまでの ms を返す。描き替えなければ null (#3300)。
 * 閉じた頁と壊れた頁はすぐ応えない扱いで返るので、1 回ごとに 1 秒は間を空ける
 */
async function waitForFrames(pages: Page[], limit: number): Promise<(number | null)[]> {
  return Promise.all(
    pages.map(async (page) => {
      const start = Date.now();
      while (Date.now() - start < limit) {
        const tried = Date.now();
        const [seen] = await probePages([page], Math.min(1_000, limit - (tried - start)));
        if (seen?.responds && seen.frameMs !== null) return Date.now() - start;
        await new Promise((done) => setTimeout(done, Math.max(0, 1_000 - (Date.now() - tried))));
      }
      return null;
    }),
  );
}

/** `sample` の全文から、主の thread が一番長く居た呼び出しの並びを末端から `MAIN_FRAMES` 段返す。主の thread が無ければ空 */
function mainFramesOf(text: string): string[] {
  const lines = text.split("\n");
  const graph = lines.findIndex((l) => l.startsWith("Call graph:"));
  const head = lines.findIndex((l, i) => i > graph && l.includes("com.apple.main-thread"));
  if (graph < 0 || head < 0) return [];
  // 子は数の多い順に並ぶので、深さが 1 段ずつ増える間の行が一番長く居た並びになる
  const depthOf = (line: string): number => line.search(/\d/u);
  const path: string[] = [];
  for (let i = head + 1; i < lines.length && depthOf(lines[i] ?? "") > depthOf(lines[i - 1] ?? ""); i++) path.push(lines[i] ?? "");
  return path
    .slice(-MAIN_FRAMES)
    .reverse()
    .map((line) => {
      const frame = /^\d+\s+(.+?)\s+\(in ([^)]+)\)(?:\s+\+\s+(\d+))?/u.exec(line.slice(depthOf(line)));
      return frame ? `${frame[1]}${frame[3] ? `+${frame[3]}` : ""} (${frame[2]})` : line.slice(depthOf(line)).trim();
    });
}

/**
 * ブラウザーごとに描画の process と GPU の process を `sampler` で `SAMPLE_SECONDS` 秒覗き、全文を一時の file に書く (#3300)。
 * 取れなかった process は訳を持たせて返し、記録の 1 行は止めない
 */
async function sampleProcesses(browsers: Browser[], sampler: string, dir: string): Promise<ProcessSample[]> {
  const found = await Promise.all(
    browsers.map(async (browser): Promise<ProcessSample[]> => {
      try {
        const cdp = await browser.newBrowserCDPSession();
        const { processInfo } = (await cdp.send("SystemInfo.getProcessInfo")) as { processInfo: { type: string; id: number }[] };
        await cdp.detach();
        return processInfo.filter((p) => p.type === "renderer" || p.type === "GPU").map((p) => ({ type: p.type, pid: p.id, file: null, main: [] }));
      } catch (error) {
        return [{ type: "unknown", pid: 0, file: null, main: [], error: `process の一覧を引けない: ${String(error).split("\n")[0]}` }];
      }
    }),
  );
  return Promise.all(
    found.flat().map(async (p): Promise<ProcessSample> => {
      if (p.error) return p;
      const file = join(dir, `${p.type}-${p.pid}.txt`);
      try {
        await run(sampler, [String(p.pid), String(SAMPLE_SECONDS), "-file", file], { timeout: SAMPLE_LIMIT });
        return { ...p, file, main: mainFramesOf(readFileSync(file, "utf8")) };
      } catch (error) {
        const e = error as { code?: string | number; killed?: boolean; stderr?: string; message?: string };
        const why = e.killed ? `${SAMPLE_LIMIT}ms で終わらない` : e.code === "ENOENT" ? "命令が無い (ENOENT)" : (e.stderr || e.message || String(error)).trim().split("\n")[0];
        return { ...p, error: `${sampler} を起こせない: ${why}` };
      }
    }),
  );
}

/**
 * context を閉じる。検査が落ちていた時は、閉じる前に頁ごとの様子と機械の負荷と空きの記憶を 1 行で `log` に書く (#3278)。
 *
 * 頁が描き替えを止めて落ちた時、何も残らないと止まった訳を調べられない。
 * 通った検査では何も書かない = 一式の出力を落ちた検査の分だけにする。
 *
 * 描き替えない頁が 1 つでもある時は、描画の process と GPU の process の呼び出しの並びを `sample` で取り、
 * 同時にその頁がまた描き替えるのを `backWait` の間待つ (#3300)。
 * どの thread がどこで待っているかと、待てば頁が戻るのかが、次に止まった時の記録で分かる。
 * 負荷と空きの記憶は待つ前の値を残す = 止まった時の機械の様子を書く。
 *
 * `store` を渡した時は、固まった頁があった回だけ、置き場に `record.json` と `sample` の file を残す (#3303)。
 * log の 1 行は誰も見なければ流れるので、毎朝の定期実行が置き場から拾う
 */
export async function closeContextsAfter(
  contexts: BrowserContext[],
  failed: boolean,
  log: (line: string) => void = console.error,
  o: StallRecordOptions = {},
): Promise<void> {
  if (failed) {
    const all = contexts.flatMap((c) => c.pages());
    const pages = await probePages(all);
    const at = new Date().toISOString();
    const [load = 0] = loadavg();
    const machine = { load: Number(load.toFixed(1)), cores: cpus().length, freeMb: Math.round(freemem() / 2 ** 20) };
    const stuck = pages.flatMap((p, i) => (p.responds && p.frameMs !== null ? [] : [i]));
    let processes: ProcessSample[] | undefined;
    if (stuck.length > 0) {
      if (o.store) mkdirSync(o.store, { recursive: true });
      // 同じ時刻に別の worker が止まっても重ならないよう、時刻を頭に付けた一意の dir を作る
      const dir = mkdtempSync(o.store ? join(o.store, `${at.replace(/[:.]/gu, "-")}-`) : join(tmpdir(), "dragon-stall-"));
      const browsers = [...new Set(contexts.map((c) => c.browser()).filter((b): b is Browser => b !== null))];
      const [sampled, back] = await Promise.all([
        sampleProcesses(browsers, o.sampler ?? "sample", dir),
        waitForFrames(
          stuck.map((i) => all[i] as Page),
          o.backWait ?? STALL_BACK_WAIT,
        ),
      ]);
      processes = sampled;
      stuck.forEach((i, k) => {
        (pages[i] as PageProbe).backMs = back[k] ?? null;
      });
      if (o.store) {
        const commit = await run("git", ["-C", root, "rev-parse", "HEAD"]).then(
          ({ stdout }) => stdout.trim(),
          () => null,
        );
        writeFileSync(join(dir, "record.json"), `${JSON.stringify({ test: o.test ?? null, at, commit, pages, processes, ...machine }, null, 2)}\n`);
      }
    }
    log(`検査が落ちた時の頁と機械の様子 (#3278): ${JSON.stringify({ pages, ...(processes ? { processes } : {}), ...machine })}`);
  }
  await Promise.all(contexts.map((c) => c.close()));
}

export interface Site {
  origin: string;
  built: Built;
  /** 新しい context で頁を開く。開いた context は `closeContexts` で閉じる */
  open: (o?: OpenOptions) => Promise<Opened>;
  /** 開いた context を全て閉じる。`afterEach` から呼ぶと、落ちた検査では閉じる前に頁の様子を残す (#3278) */
  closeContexts: () => Promise<void>;
  close: () => Promise<void>;
}

/**
 * 頁を build して配り、画面なしの Chromium を起こす (#3030)。
 *
 * 編集画面の検査とサイトの帯と経路の検査が同じ形で頁を開けるよう、開く手順をここに 1 つだけ持つ。
 * `config` は `buildPage` に渡す build の設定
 */
export async function startSite(o: { config?: string } = {}): Promise<Site> {
  const built = await buildPage(o.config);
  const server = await servePage(built.dir);
  const browser: Browser = await chromium.launch();
  const contexts: BrowserContext[] = [];
  const store = await stallStoreOf(root);

  const open = async (o: OpenOptions = {}): Promise<Opened> => {
    const context = await browser.newContext({
      locale: o.locale ?? "ja-JP",
      colorScheme: o.colorScheme ?? "light",
      viewport: o.viewport ?? { width: 1280, height: 860 },
      hasTouch: o.touch ?? false,
      reducedMotion: o.reducedMotion ?? "no-preference",
    });
    contexts.push(context);
    await context.addInitScript(() => {
      const w = window as unknown as { __csp: string[]; __startMedia: StartMedia };
      w.__csp = [];
      document.addEventListener("securitypolicyviolation", (e) => w.__csp.push(`${e.violatedDirective} ${e.blockedURI}`));
      w.__startMedia = { reduce: matchMedia("(prefers-reduced-motion: reduce)").matches, coarse: matchMedia("(pointer: coarse)").matches };
      // 字の CSS は最初の画面を描いた後に読むので (#3292)、届く前の `document.fonts.ready` は字を待たずに解ける。
      // 字の組みを測る検査が端末の字を測らないよう、字が載り、次の描画で読み込みが始まってから本物を返す。字の CSS を止めた頁でも止まらないよう 5 秒で打ち切る
      const fontSet = Object.getPrototypeOf(document.fonts) as object;
      Object.defineProperty(document.fonts, "ready", {
        get: async (): Promise<unknown> => {
          const limit = performance.now() + 5_000;
          while (document.fonts.size === 0 && performance.now() < limit) await new Promise((done) => setTimeout(done, 20));
          for (let frame = 0; frame < 2; frame += 1) await new Promise((done) => requestAnimationFrame(done));
          return Reflect.get(fontSet, "ready", document.fonts);
        },
      });
    });
    const page = await context.newPage();
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    watchCutRequests(page);
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
      // `afterEach` の間も vitest は今の検査を持ち、落ちた検査は既に `fail` になっている
      const test = TestRunner.getCurrentTest();
      await closeContextsAfter(contexts.splice(0), test?.result?.state === "fail", console.error, {
        ...(store ? { store } : {}),
        ...(test ? { test: { name: test.name, file: test.file.name } } : {}),
      });
    },
    close: async () => {
      await browser.close();
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
 * `scope` の中の再生の部品で、本文が最も長い段の本文の下端と `edge` の下の縁の間 (px、#3051)。部品が無ければ `null`。
 * 帯の高さは全部の段の題と本文の写しを重ねて決まる (#3049) ので、写しの本文の下端のうち最も下の物で測る
 */
export const captionClearance = (page: Page, scope: string, edge: string): Promise<number | null> =>
  page.evaluate(
    async ([scope, edge]) => {
      await document.fonts.ready;
      const bodies = [...document.querySelectorAll(`${scope} [data-dragon="caption-room"] > :last-child`)];
      const holder = document.querySelector(edge);
      if (bodies.length === 0 || !holder) return null;
      const lowest = Math.max(...bodies.map((body) => body.getBoundingClientRect().bottom));
      return holder.getBoundingClientRect().bottom - lowest;
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
