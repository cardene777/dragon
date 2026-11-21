/**
 * script の1行と記法の塊を置くだけで図が出る入口 (#3343)。
 *
 * 頁に `<script type="module" src=".../dist/cdn/dragon.js">` の1行と `<pre class="dragon">` の記法の塊を置くと、塊が動く図に置き換わる。
 * 入口は軽い入口 (`@cardenelabs/dragon/light`) と同じく、書いた図の種類の塊だけを後から読む。
 * 図の字の CSS は jsDelivr から読む `<link>` を頁に1度だけ足す。
 * `dragon embed <HTML>` は入口の1行を束ねた script の中身に置き換え、外へ通信しない1 file を書く。
 * 埋めた頁でも `data-header` を持つ塊には同じ帯が付き、帯のエクスポートは外を読まずに書き出せる4つの形式だけを出す (#3786)。
 * `data-still` を持つ塊は SVG に描いてから埋め、動く塊が残らない頁には束ねた script を入れない (#3801)。
 *
 * 入口の file は build した `dist/cdn` から読む。頁は `http://localhost/` に置き、入口と塊も同じ置き場から渡す。
 * 外への通信は全て止め、何を取りに行ったかを数える。
 *
 * 頁を開く仕事と `dragon embed` の命令を起こす仕事は、混んだ機械で 1 件 10 秒の上限を超えた (#3815)。
 * どちらも file を読み込む段 (`at-load.ts`) で済ませ、件は頁で見たことと命令の結果を読んで確かめる。
 */
import { execFileSync } from "node:child_process";
import { mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { gzipSync } from "node:zlib";
import type { Page } from "playwright-core";
import * as dragon from "@cardenelabs/dragon";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { atLoad } from "./at-load";
import { runCli } from "./export-support";
import { fileChromium } from "./page-needs";
// 既定の入口 (`dist`) で全ての種類の図を描くので、全ての種類を読む助けの file に型だけでつなぐ (#3763)。
// 関係する検査を選ぶ命令は、どの種類の描く所を変えてもこの検査を選ぶ。型だけなので、検査の中で src を読み込まない
import type {} from "./all-kinds";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const CDN = join(ROOT, "dist/cdn");
const ENTRY = "dragon.js";
const EXAMPLES = join(ROOT, "examples");

const PAGE = "http://localhost/";
const LOCAL_ROOT = "http://localhost/cdn/";
/** 入口の置き場の 1 つ上に在る、HTML に埋める再生の script */
const PLAYER_SCRIPT = "http://localhost/player.global.js";
/** jsDelivr の package の置き場。版の範囲 (`@0.50`) か版を全て書いた形 (`@0.50.0`) を後ろに付ける */
const CDN_PACKAGE = "https://cdn.jsdelivr.net/npm/@cardenelabs/dragon";
/** 図の字の CSS。jsDelivr の fontsource の版ごとの `index.css` */
const FONT_CSS = /^https:\/\/cdn\.jsdelivr\.net\/npm\/@fontsource-variable\/(noto-sans-jp|jetbrains-mono)@[^/]+\/index\.css$/u;

/**
 * 入口が最初に読む量の上限 (gzip した後の byte)。後から読む種類を持たない頁で読む script の合計。
 * 決める step で測った軽い入口の最初の量は約 79KB で、上限はそれに 1 割強を足した値。
 * 配管の図 (#3389) の後の main で 89.8KB になり、使う人がブロックを足す口 (#3399) で 94.9KB になった。
 * 定義を読む処理は後から読む塊に分け、残りは原本の形の検査に足した決まりと、読む処理と描く処理に足した分。本人が選んで上限を 100KB に上げた。
 * 記法から読んだ図は描く時に原本の形の検査を省き、記法の図を描く頁は検査を読まなくなったので、上限を 90KB に戻した (#3400)
 */
const FIRST_LOAD_BUDGET = 90_000;

/** 頁が書き換わるのを待つ長さ */
const SETTLE = 15_000;
/** 1 つの件の時間の上限より短く待つ長さ。書き換わらない時も判定の文で落とす (#3455) */
const QUICK_SETTLE = 6_000;
/**
 * 頁を開く、押す、字を読む、書き出した file を受け取る仕事が待つ長さの上限。
 * 件の中では 1 件の上限 (10 秒) が止めていたが、file を読み込む段では誰も止めない。
 * Playwright の既定 (30 秒) や終わりの無い待ちが 1 回の実行の上限 (5 分) まで続かないよう、同じ 10 秒で区切る (#3815)
 */
const PAGE_WAIT = 10_000;

const version = (): string => (JSON.parse(readFileSync(join(ROOT, "package.json"), "utf8")) as { version: string }).version;

/** 時系列図の記法。後から読む種類の塊を読まずに描ける */
const SEQUENCE = "sequence ログイン\n\nbox browser as ブラウザ\nbox app as アプリ\n\nstep 押す\n  say ログインを押す。\n  browser -> app: GET /login\n";
/** 構成図の記法 */
const ARCHITECTURE = "architecture 配り方\n\nbox app as アプリ\nbox cdn as 配る所\n\nstep 読む\n  say アプリが配る所から読む。\n  app -> cdn: 読む\n";
/** 宣言と段を省いた時系列図 (#3438)。最小の図が script の 1 行で出るまでの時間も、この図で測る */
const SHORT = "sequence\n\nブラウザ -> アプリ: GET /login\nアプリ -> ブラウザ: 認可の頁へ送る\n";
/** 箱の行に Tabler の石の橋を書いた構成図。共有の橋のブロックの絵柄と比べる相手 (#3489) */
const BRIDGE_ICON_BOX = "architecture 橋\n\nbox eth as Ethereum\nbox cc as 橋 [icon: tabler:building-bridge-2]\n\nstep 送る\n  say Ethereum が橋へ送る。\n  eth -> cc: 送る\n";
/** 既定の入口で描いた、Tabler の石の橋の絵柄の d */
function bridgeGlyph(): string | undefined {
  const entry = dragon as unknown as { parseNotation(text: string): { ok: boolean; diagram?: unknown }; renderDiagram(diagram: unknown): { svg: string } };
  const parsed = entry.parseNotation(BRIDGE_ICON_BOX);
  return parsed.ok ? /<path class="dg-gl" [^>]*\bd="([^"]*)"/u.exec(entry.renderDiagram(parsed.diagram).svg)?.[1] : undefined;
}
/** 図の頭に定義を書かずに共有のブロックを使う構成図 */
const SHARED_BLOCK = "architecture 橋\n\nbox eth as Ethereum\n+bridge cc as 橋\n\nstep 送る\n  say Ethereum が橋へ送る。\n  eth -> cc: 送る\n";
/** 4 行目に知らない行の頭の語 (`boxx`) を書いた記法 */
const BROKEN = "sequence 誤り\n\nbox a\nboxx b\n\nstep 一\n  say あ。\n";

/** HTML の字として書けるよう、`<` と `&` を逃がす */
const escape = (text: string): string => text.replaceAll("&", "&amp;").replaceAll("<", "&lt;");

/** 入口と塊を渡す置き場 */
interface Place {
  /** 頁が `<script>` で読む入口の URL */
  entry: string;
  /** 置き場の URL なら `dist/cdn` の file の名前を、置き場に file が無い URL なら null を、置き場の外なら undefined を返す */
  name(url: string): string | null | undefined;
}

/** 版を含まない自分の置き場。入口の隣の file を全て渡す */
const LOCAL: Place = {
  entry: `${LOCAL_ROOT}${ENTRY}`,
  name: (url) => (url.startsWith(LOCAL_ROOT) ? url.slice(LOCAL_ROOT.length) : undefined),
};

/**
 * 修正版を出した直後の jsDelivr。版の範囲の URL (`@<真ん中の数まで>`) は入口だけを今の build で返し、ほかの file は 404 にする。
 * 範囲は file ごとに新しい版へ解かれ、名前の変わった塊はそこに無いため。版を全て書いた URL は今の build の file を返す
 */
function movedCdn(): Place {
  const [major, minor] = version().split(".");
  const range = `${CDN_PACKAGE}@${major}.${minor}/`;
  const exact = `${CDN_PACKAGE}@${version()}/dist/cdn/`;
  const entry = `${range}dist/cdn/${ENTRY}`;
  return {
    entry,
    name: (url) => {
      if (url === entry) return ENTRY;
      if (url.startsWith(exact)) return url.slice(exact.length);
      return url.startsWith(`${CDN_PACKAGE}@`) ? null : undefined;
    },
  };
}

/** 頁の中で何を取りに行ったか */
interface Requests {
  /** 置き場から読んだ入口と塊の file の名前 */
  scripts: string[];
  /** 置き場に取りに行った URL。置き場に無かった物も入る */
  urls: string[];
  /** 字の CSS の URL */
  fonts: string[];
  /** 止めた外への通信の URL */
  outside: string[];
}


/**
 * 入口の1行と `body` を置いた頁を開いて `run` を回す。入口と塊は `place` から渡す。
 * `hold` を渡すと、置き場の file を渡す前にその file の名前で呼び、返った約束が済むまで渡さない
 */
async function withPage<T>(body: string, run: (page: Page, requests: Requests) => Promise<T>, lang = "ja", place: Place = LOCAL, hold?: (file: string) => Promise<void>): Promise<T> {
  // file で 1 つの Chromium を使う。後処理で閉じず、file の process の終わりに止まる (#3424)
  const context = await (await fileChromium()).newContext({ viewport: { width: 960, height: 720 } });
  // 長さを書かない待ち (頁を開く、押す、字を読む) も区切る
  context.setDefaultTimeout(PAGE_WAIT);
  const requests: Requests = { scripts: [], urls: [], fonts: [], outside: [] };
  const html = `<!doctype html><html lang="${lang}"><head><meta charset="utf-8"><script type="module" src="${place.entry}"></script></head><body>${body}</body></html>`;
  await context.route("**/*", async (route) => {
    const url = route.request().url();
    if (url === PAGE) return route.fulfill({ contentType: "text/html; charset=utf-8", body: html });
    const file = place.name(url);
    if (file !== undefined) {
      requests.urls.push(url);
      if (file === null) return route.fulfill({ status: 404, body: "" });
      requests.scripts.push(file);
      await hold?.(file);
      const path = join(CDN, file);
      if (!existsSync(path)) return route.fulfill({ status: 404, body: "" });
      return route.fulfill({ contentType: file.endsWith(".js") ? "text/javascript" : "application/json", body: readFileSync(path) });
    }
    // 帯の HTML のエクスポートは、入口の置き場の 1 つ上の再生の script を頁に埋める (#3699)
    if (url === PLAYER_SCRIPT) {
      requests.urls.push(url);
      return route.fulfill({ contentType: "text/javascript", body: readFileSync(join(ROOT, "dist/player.global.js")) });
    }
    if (FONT_CSS.test(url)) {
      requests.fonts.push(url);
      return route.fulfill({ contentType: "text/css", body: "" });
    }
    requests.outside.push(url);
    return route.abort();
  });
  try {
    const page = await context.newPage();
    await page.goto(PAGE);
    return await run(page, requests);
  } finally {
    await context.close();
  }
}

/** 記法の塊が全て置き換わり、図が `players` 個置かれるまで待つ。待ちきれなくても投げず、判定に任せる */
async function settle(page: Page, players: number): Promise<void> {
  await page
    .waitForFunction(
      (count) => document.querySelectorAll("pre.dragon").length === 0 && document.querySelectorAll('[data-dragon="player"] svg').length >= count,
      players,
      { timeout: SETTLE },
    )
    .catch(() => undefined);
}

/** 頁の中の図と記法の塊の数 */
const counts = (page: Page): Promise<{ players: number; drawn: number; blocks: number }> =>
  page.evaluate(() => {
    const players = [...document.querySelectorAll('[data-dragon="player"]')];
    return { players: players.length, drawn: players.filter((player) => player.querySelector("svg") !== null).length, blocks: document.querySelectorAll("pre.dragon").length };
  });

/** 入口の file が build されているか。無い時は判定で落とす */
function entryBuilt(): boolean {
  const built = existsSync(join(CDN, ENTRY));
  expect(built, `入口の file が無い: ${join(CDN, ENTRY)}`).toBe(true);
  return built;
}

/** 後から読む種類の名前。軽い入口が名乗る */
async function laterKinds(): Promise<readonly string[]> {
  const light = (await import(/* @vite-ignore */ "@cardenelabs/dragon/light")) as { LATER_KINDS: readonly string[] };
  return light.LATER_KINDS;
}

/**
 * 塊の file から、その塊が持つ後から読む種類への表。塊の source map が名指す、種類の並べ方 (`src/kinds/<種類>/layout.ts`) で決める。
 * 種類の名前と並びだけを持つ `kind.ts` は入口が初めから持つので数えない (見本帳の `kind-chunks.test.ts` と同じ見分け方)
 */
async function kindChunks(): Promise<Map<string, string[]>> {
  const later = await laterKinds();
  const chunks = new Map<string, string[]>();
  for (const file of readdirSync(CDN).filter((name) => name.endsWith(".js"))) {
    const mapPath = join(CDN, `${file}.map`);
    if (!existsSync(mapPath)) continue;
    const { sources } = JSON.parse(readFileSync(mapPath, "utf8")) as { sources: string[] };
    const kinds = later.filter((kind) => sources.some((source) => source.endsWith(`src/kinds/${kind}/layout.ts`)));
    if (kinds.length > 0) chunks.set(file, kinds);
  }
  return chunks;
}

/** 回り続ける図、表どうしの関係の図、考えを広げる地図、集合の重なりの図、2つの軸で置く図だけが使うブロック (#3657) */
const KIND_ONLY_BLOCKS = ["ring", "table", "idea", "circle", "axis", "matrix-item", "band"] as const;

/** `dist/cdn` の file のうち、source map が `source` で終わる source を名指す file の名前 */
function filesHolding(source: string): string[] {
  return readdirSync(CDN)
    .filter((name) => name.endsWith(".js") && existsSync(join(CDN, `${name}.map`)))
    .filter((name) => (JSON.parse(readFileSync(join(CDN, `${name}.map`), "utf8")) as { sources: string[] }).sources.some((s) => s.endsWith(source)))
    .sort();
}

/** Static shared chunks are part of the entry; lazy kind chunks are not. */
function entryFiles(name = 'dragon-main.js', seen = new Set<string>()): Set<string> {
  if (seen.has(name)) return seen;
  seen.add(name);
  const text = readFileSync(join(CDN, name), 'utf8');
  for (const match of text.matchAll(/(?:\bfrom\s*|\bimport\s*)["']\.\/([^"']+\.js)["']/gu)) entryFiles(match[1], seen);
  return seen;
}

/**
 * 頁を開く前に、入口の file が build されているかを見る。無い時は頁を開かずに落とす。
 * 結果を読む件は、先に入口が無いことを判定の文で落とす (`entryBuilt`) ので、この落ち方は件に出ない
 */
function needEntry(): void {
  if (!existsSync(join(CDN, ENTRY))) throw new Error(`入口の file が無い: ${join(CDN, ENTRY)}`);
}

/**
 * `read` の値が `done` を満たすまで、`timeout` ミリ秒まで 50 ミリ秒おきに読み直す (件の `expect.poll` と同じ間隔)。
 * 満たした値か、待ちきれなかった時の最後の値を返し、判定は件に任せる。読むのに落ちた時は読み直し、待ちきれなかった後に落ちた時だけ投げる
 */
async function pollFor<T>(read: () => T | Promise<T>, done: (value: T) => boolean, timeout: number): Promise<T> {
  const end = Date.now() + timeout;
  for (;;) {
    try {
      const value = await read();
      if (done(value) || Date.now() >= end) return value;
    } catch (error) {
      if (Date.now() >= end) throw error;
    }
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
}

/** `work` を `timeout` ミリ秒まで待つ。済まない時は `what` を挙げて落とす。Playwright の待ちの長さを渡せない仕事を区切る */
async function bounded<T>(work: Promise<T>, timeout: number, what: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      work,
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error(`${what}が ${timeout}ms で済まない`)), timeout);
      }),
    ]);
  } finally {
    clearTimeout(timer);
  }
}

/** 帯の知らせの欄が、エクスポートしている間の知らせから書き換わったか。件が `toMatch` で確かめる形と同じ */
const statusSettled = (text: string | null): boolean => text !== null && /^(?!エクスポートしています).+/u.test(text);

// 頁を開く仕事と `dragon embed` の命令を起こす仕事は、混んだ機械で 1 件 10 秒の上限を超えた (#3815)。
// file を読み込む段で 1 つずつ順に済ませ、件は見たことを読んで確かめる。件が途中の様子を確かめていた流れは、途中の様子も順に残す。
// 途中の様子を見た後に頁を触る仕事はその中の仕事 (`atLoad`) に分け、触るのに落ちても、件は途中の様子を先に確かめてから落ちる

/** 後から読む種類と、後から読む種類を持つ塊の file の表 */
const KINDS = await atLoad("後から読む種類と、種類を持つ塊の表を読む", async () => ({ later: await laterKinds(), chunks: await kindChunks() }));

/**
 * 時系列図の塊を1つ置いた頁で見たこと。図の数と、置き場から読んだ file と、止めた外への通信。
 * 6 つの件が同じ頁を読み、頁を開く秒数を件ごとに払わない。どの件も頁を触らずに数えるだけなので、件ごとに開いた頁と見る物は同じ
 */
const SEQUENCE_PAGE = await atLoad("時系列図の塊を1つ置いた頁を開く", () => {
  needEntry();
  return withPage(`<pre class="dragon">${escape(SEQUENCE)}</pre>`, async (page, requests) => {
    await settle(page, 1);
    const counted = await counts(page);
    return { counted, scripts: [...requests.scripts], outside: [...requests.outside] };
  });
});

const EVERY_BLOCK_PAGE = await atLoad("入れ子の HTML に字下げして書いた2つの塊の頁を開く", () => {
  needEntry();
  // 入れ子の HTML の中で書いた塊は、全ての行に同じ字下げが付く。共通の字下げを外して読む
  const indented = (text: string): string => text.split("\n").map((line) => (line === "" ? line : `      ${line}`)).join("\n");
  const body = `<main>\n  <section>\n    <pre class="dragon">\n${escape(indented(SEQUENCE))}    </pre>\n  </section>\n  <section>\n    <pre class="dragon">\n${escape(indented(ARCHITECTURE))}    </pre>\n  </section>\n</main>`;
  return withPage(body, async (page) => {
    await settle(page, 2);
    return counts(page);
  });
});

const BROKEN_PARSED = await atLoad("誤りのある見本の記法を、全てを持つ入口で読む", async () => {
  const whole = (await import(/* @vite-ignore */ "@cardenelabs/dragon")) as { parseNotation(text: string, options: { lang: "ja" }): { ok: boolean; errors?: { line: number; message: string }[] } };
  return whole.parseNotation(BROKEN, { lang: "ja" });
});

const ERRORS_PAGE = await atLoad("誤りのある塊と誤りの無い塊の頁を開く", () => {
  needEntry();
  const body = `<div id="bad"><pre class="dragon">${escape(BROKEN)}</pre></div><div id="good"><pre class="dragon">${escape(SEQUENCE)}</pre></div>`;
  return withPage(body, async (page) => {
    await settle(page, 1);
    const bad = await page.evaluate(() => {
      const place = document.getElementById("bad");
      return { text: place?.textContent ?? "", svgs: place?.querySelectorAll("svg").length ?? -1, blocks: place?.querySelectorAll("pre.dragon").length ?? -1 };
    });
    const good = await page.evaluate(() => document.querySelectorAll('#good [data-dragon="player"] svg').length);
    return { bad, good };
  });
});

const SHORT_PAGE = await atLoad("宣言と段を省いた短い記法の塊の頁を開く", () => {
  needEntry();
  return withPage(`<pre class="dragon">${escape(SHORT)}</pre>`, async (page, requests) => {
    await settle(page, 1);
    const counted = await counts(page);
    const names = await page.evaluate(() => [...document.querySelectorAll('[data-dragon="player"] svg text.dg-sn')].map((text) => text.textContent ?? ""));
    return { counted, names, outside: [...requests.outside] };
  });
});

const FENCE_PAGE = await atLoad("Markdown の囲みから作った HTML の頁を開く", () => {
  needEntry();
  const body = `<pre><code class="language-dragon">${escape(SEQUENCE)}</code></pre><pre id="js"><code class="language-js">const a = 1;</code></pre>`;
  return withPage(body, async (page, requests) => {
    await page
      .waitForFunction(() => document.querySelectorAll("code.language-dragon").length === 0 && document.querySelectorAll('[data-dragon="player"] svg').length >= 1, undefined, { timeout: QUICK_SETTLE })
      .catch(() => undefined);
    const fences = await page.evaluate(() => document.querySelectorAll("code.language-dragon").length);
    const counted = await counts(page);
    const js = await page.evaluate(() => document.querySelector("#js code.language-js")?.textContent ?? null);
    return { fences, counted, js, outside: [...requests.outside] };
  });
});

/** 既定の入口で、箱の行に書いた石の橋の絵柄の d */
const BRIDGE_GLYPH = await atLoad("既定の入口で、箱の行に書いた石の橋を描く", bridgeGlyph);

const SHARED_BLOCK_PAGE = await atLoad("共有のブロックを使う塊の頁を開く", () => {
  needEntry();
  return withPage(`<pre class="dragon">${escape(SHARED_BLOCK)}</pre>`, async (page, requests) => {
    // 読めない塊も誤りの文に置き換わるので、塊が無くなるまでを待つ
    await page.waitForFunction(() => document.querySelectorAll("pre.dragon").length === 0, undefined, { timeout: QUICK_SETTLE }).catch(() => undefined);
    const counted = await counts(page);
    // 図の絵柄の枠の d を全て読む。石の橋の d と比べるのは件
    const glyphs = await page.evaluate(() => [...document.querySelectorAll('[data-dragon="player"] svg path.dg-gl')].map((path) => path.getAttribute("d")));
    return { counted, glyphs, outside: [...requests.outside] };
  });
});

const GIT_PAGE = await atLoad("枝分かれの図の塊の頁を開く", () => {
  needEntry();
  const git = readFileSync(join(EXAMPLES, "rebase.dragon"), "utf8");
  return withPage(`<pre class="dragon">${escape(git)}</pre>`, async (page, requests) => {
    await settle(page, 1);
    return { drawn: (await counts(page)).drawn, scripts: [...requests.scripts] };
  });
});

const MOVED_PAGE = await atLoad("修正版を出した直後の jsDelivr から、時系列図と枝分かれの図の頁を開く", () => {
  needEntry();
  const place = movedCdn();
  const git = readFileSync(join(EXAMPLES, "rebase.dragon"), "utf8");
  return withPage(
    `<pre class="dragon">${escape(SEQUENCE)}</pre><pre class="dragon">${escape(git)}</pre>`,
    async (page, requests) => {
      await settle(page, 2);
      const counted = await counts(page);
      return { counted, urls: [...requests.urls], scripts: [...requests.scripts] };
    },
    "ja",
    place,
  );
});

const ARCHITECTURE_PAGE = await atLoad("構成図の塊の頁を開く", () => {
  needEntry();
  return withPage(`<pre class="dragon">${escape(ARCHITECTURE)}</pre>`, async (page, requests) => {
    await settle(page, 1);
    const counted = await counts(page);
    return { counted, scripts: [...requests.scripts] };
  });
});

const BAR_PAGE = await atLoad("data-header の塊と帯の無い塊の頁を開き、帯の HTML をエクスポートする", () => {
  needEntry();
  return withPage(`<pre class="dragon" data-header>${escape(SEQUENCE)}</pre><pre class="dragon">${escape(ARCHITECTURE)}</pre>`, async (page) => {
    // 構成図は並べ方の塊を読んでから描くので、帯の図が帯の内側 (shadow root) へ移った後に描くことがある (#3782)。
    // 頁の表に在る図だけを数えると 2 つ揃う時が来ないので、図ごとに帯の内側か外側で描けたかを待つ
    await page
      .waitForFunction(() => {
        const figures = [...document.querySelectorAll(".dragon-figure")];
        const drawn = figures.filter((figure) => (figure.querySelector(".dragon-frame")?.shadowRoot ?? figure).querySelector('[data-dragon="player"] svg') !== null);
        return document.querySelectorAll("pre.dragon").length === 0 && drawn.length === 2 && document.querySelector(".dragon-figure .dragon-frame") !== null;
      }, null, { timeout: QUICK_SETTLE })
      .catch(() => undefined);
    const figures = await page.evaluate(() =>
      [...document.querySelectorAll(".dragon-figure")].map((figure) => {
        const root = figure.querySelector(".dragon-frame")?.shadowRoot;
        return {
          buttons: root ? [...root.querySelectorAll<HTMLElement>(".dg-header-actions > [data-action]")].map((el) => el.dataset.action) : [],
          drawn: (root ?? figure).querySelector('[data-dragon="player"] svg') !== null,
        };
      }),
    );
    // 帯の HTML のエクスポートは、入口の置き場から書き出す部品を読み、再生の script を埋めた頁を書き出す
    const exported = await atLoad("帯の HTML のエクスポートを押す", async () => {
      await page.locator('.dg-header-actions > [data-action="export"] > button').click({ timeout: PAGE_WAIT });
      const downloaded = page.waitForEvent("download", { timeout: QUICK_SETTLE });
      // 押せずに終えた時も、download を待つ約束を受け手の無いまま落とさない
      downloaded.catch(() => undefined);
      await page.locator('[data-menu="export"] [data-format="html"]').click({ timeout: PAGE_WAIT });
      // 書き出す部品を読めない時は、帯の知らせの欄にエクスポートできなかったと出る
      const status = page.locator(".dragon-frame .status");
      const settled = await pollFor(() => status.textContent({ timeout: PAGE_WAIT }), statusSettled, QUICK_SETTLE);
      const said = await status.textContent({ timeout: PAGE_WAIT });
      const saved = await atLoad("帯の HTML のエクスポートの file を受け取る", async () => {
        const download = await downloaded;
        const path = await bounded(download.path(), PAGE_WAIT, "帯の HTML のエクスポートの file を書き終える");
        return { filename: download.suggestedFilename(), html: readFileSync(path, "utf8") };
      });
      return { settled, said, saved };
    });
    return { figures, exported };
  });
});

const HELD_BAR_PAGE = await atLoad("帯の塊が届くのを止めて、data-header の塊の頁を開く", () => {
  needEntry();
  const barFiles = filesHolding("src/frame/dragon-frame.mjs");
  // data-header を持つ塊は、帯の塊が届く前に帯の無い図を描き、届いた後に帯を付ける
  let release: () => void = () => undefined;
  const held = new Promise<void>((resolve) => (release = resolve));
  return withPage(
    `<pre class="dragon" data-header>${escape(SEQUENCE)}</pre>`,
    async (page, requests) => {
      try {
        await settle(page, 1);
        const asked = await pollFor(() => requests.scripts.filter((file) => barFiles.includes(file)).length, (count) => count > 0, QUICK_SETTLE);
        const before = await page.evaluate(() => ({ frames: document.querySelectorAll(".dragon-frame").length, drawn: document.querySelectorAll('.dragon-figure [data-dragon="player"] svg').length }));
        release();
        await page.waitForFunction(() => document.querySelector(".dragon-frame") !== null, null, { timeout: QUICK_SETTLE }).catch(() => undefined);
        const frames = await page.evaluate(() => document.querySelectorAll(".dragon-frame").length);
        return { asked, before, frames };
      } finally {
        // 途中で落ちた時も、止めた帯の塊を渡して頁を閉じる
        release();
      }
    },
    "ja",
    LOCAL,
    (file) => (barFiles.includes(file) ? held : Promise.resolve()),
  );
});

const FONT_PAGE = await atLoad("時系列図と構成図の塊を並べた頁を開く", () => {
  needEntry();
  return withPage(`<pre class="dragon">${escape(SEQUENCE)}</pre><pre class="dragon">${escape(ARCHITECTURE)}</pre>`, async (page, requests) => {
    await settle(page, 2);
    const { drawn } = await counts(page);
    const links = await page.evaluate(() => [...document.querySelectorAll('link[rel="stylesheet"]')].map((link) => link.getAttribute("href") ?? ""));
    return { drawn, links, fonts: [...requests.fonts] };
  });
});

const EMBED_OFFLINE = await atLoad("入口の1行を置いた頁を dragon embed で埋め、外への通信を止めて開く", async () => {
  const dir = mkdtempSync(join(tmpdir(), "dragon-embed-"));
  try {
    const [major, minor] = version().split(".");
    const source = join(dir, "page.html");
    const out = join(dir, "page.offline.html");
    writeFileSync(
      source,
      [
        "<!doctype html>",
        '<html lang="ja"><head><meta charset="utf-8">',
        `<script type="module" src="https://cdn.jsdelivr.net/npm/@cardenelabs/dragon@${major}.${minor}/dist/cdn/dragon.js"></script>`,
        "</head><body>",
        `<pre class="dragon">${escape(SEQUENCE)}</pre>`,
        "</body></html>",
      ].join("\n"),
    );
    const ran = await runCli(["embed", source, "--out", out]);
    const exists = existsSync(out);
    const written = exists ? readFileSync(out, "utf8") : "";
    const opened = await atLoad("埋めた1 file を外への通信を止めて開く", async () => {
      const context = await (await fileChromium()).newContext({ viewport: { width: 960, height: 720 } });
      context.setDefaultTimeout(PAGE_WAIT);
      const outside: string[] = [];
      try {
        await context.route(/^https?:/u, async (route) => {
          outside.push(route.request().url());
          await route.abort();
        });
        const page = await context.newPage();
        page.on("request", (request) => {
          const url = request.url();
          if (!/^(file|data|blob):/u.test(url) && !outside.includes(url)) outside.push(url);
        });
        await page.goto(pathToFileURL(out).href);
        await settle(page, 1);
        const counted = await counts(page);
        const links = await page.evaluate(() => [...document.querySelectorAll("link")].map((link) => link.getAttribute("href") ?? ""));
        return { counted, links, outside: [...outside] };
      } finally {
        await context.close();
      }
    });
    return { ran, exists, written, opened };
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

// 埋めた頁は絵柄集の表を持たないので、頁の記法が使う Tabler の絵柄だけを頁に収め、それで描く (#3493)
const EMBED_ICONS = await atLoad("Tabler の絵柄を使う頁を dragon embed で埋め、外への通信を止めて開く", async () => {
  const dir = mkdtempSync(join(tmpdir(), "dragon-embed-icons-"));
  try {
    const [major, minor] = version().split(".");
    const text = ["architecture 絵柄", "", "box 橋 [icon: tabler:building-bridge-2]", "box 岸", "", "step 渡る", "  say 橋から岸へ渡る。", "  橋 -> 岸: 渡る"].join("\n");
    const source = join(dir, "page.html");
    const out = join(dir, "page.offline.html");
    writeFileSync(
      source,
      [
        "<!doctype html>",
        '<html lang="ja"><head><meta charset="utf-8">',
        `<script type="module" src="https://cdn.jsdelivr.net/npm/@cardenelabs/dragon@${major}.${minor}/dist/cdn/dragon.js"></script>`,
        "</head><body>",
        `<pre class="dragon">${escape(text)}</pre>`,
        "</body></html>",
      ].join("\n"),
    );
    const ran = await runCli(["embed", source, "--out", out]);
    // 埋めた file を読めない時は、終わり方を確かめた件がその後に落ちる
    const written = await atLoad("埋めた1 file を読む", () => readFileSync(out, "utf8"));
    const opened = await atLoad("埋めた1 file を外への通信を止めて開く", async () => {
      const context = await (await fileChromium()).newContext({ viewport: { width: 960, height: 720 } });
      context.setDefaultTimeout(PAGE_WAIT);
      try {
        await context.route(/^https?:/u, (route) => route.abort());
        const page = await context.newPage();
        await page.goto(pathToFileURL(out).href);
        await settle(page, 1);
        const counted = await counts(page);
        const drawn = await page.evaluate(() => [...document.querySelectorAll("path.dg-gl")].map((path) => path.getAttribute("d") ?? ""));
        return { counted, drawn };
      } finally {
        await context.close();
      }
    });
    return { ran, written, opened };
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

/** repo が追跡する file のうち、版を固定した入口の1行を持つ file */
const PINNED_FILES = await atLoad("版を固定した入口の1行を持つ file を git で探す", () =>
  execFileSync("git", ["-C", join(ROOT, "../.."), "grep", "-l", "-E", "@cardenelabs/dragon@[0-9]+\\.[0-9]+/dist/cdn/dragon\\.js", "--", "."], { encoding: "utf8" })
    .split("\n")
    .filter((line) => line !== ""),
);

describe("script の1行の入口 (#3343)", () => {
  it("script-entry-replaces-block-with-figure", () => {
    if (!entryBuilt()) return;
    const { counted, outside } = SEQUENCE_PAGE.get();
    expect(counted, "記法の塊が1つの図に置き換わる").toEqual({ players: 1, drawn: 1, blocks: 0 });
    expect(outside, "入口と塊と字の CSS のほかに取りに行った物").toEqual([]);
  });

  it("script-entry-replaces-every-block", () => {
    if (!entryBuilt()) return;
    // 入れ子の HTML の中で書いた塊は、全ての行に同じ字下げが付く。共通の字下げを外して読む
    expect(EVERY_BLOCK_PAGE.get(), "記法の塊が2つとも図に置き換わる").toEqual({ players: 2, drawn: 2, blocks: 0 });
  });

  it("script-entry-shows-notation-errors", () => {
    if (!entryBuilt()) return;
    const parsed = BROKEN_PARSED.get();
    expect(parsed.ok, "見本の記法が誤りを持つ").toBe(false);
    const messages = (parsed.errors ?? []).map((error) => error.message);
    expect(messages.length, "見本の記法の誤りの文").toBeGreaterThan(0);
    const { bad, good } = ERRORS_PAGE.get();
    expect(bad.svgs, "誤りのある塊の場所に図を置かない").toBe(0);
    expect(bad.blocks, "誤りのある塊を記法のまま残さない").toBe(0);
    for (const message of messages) expect(bad.text, "誤りのある塊の場所に誤りの文を出す").toContain(message);
    expect(good, "誤りの無い塊は図に置き換わる").toBe(1);
  });

  it("script-entry-draws-short-notation", () => {
    // 宣言と段を省いた短い記法の塊も、script の 1 行で動く図に置き換わり、線に出た名前を箱に描く (#3438)
    if (!entryBuilt()) return;
    const { counted, names, outside } = SHORT_PAGE.get();
    expect(counted, "短い記法の塊が1つの図に置き換わらない").toEqual({ players: 1, drawn: 1, blocks: 0 });
    expect(names, "線に出た名前を箱に描かない").toEqual(expect.arrayContaining(["ブラウザ", "アプリ"]));
    expect(outside, "入口と塊と字の CSS のほかに取りに行った物").toEqual([]);
  });

  it("script-entry-draws-markdown-code-fence", () => {
    // Markdown の ```dragon の囲みから作った HTML (`<pre><code class="language-dragon">`) も図に置き換え、ほかの言葉の囲みは残す (#3455)
    if (!entryBuilt()) return;
    const { fences, counted, js, outside } = FENCE_PAGE.get();
    expect(fences, "dragon の囲みを記法のまま残した").toBe(0);
    expect(counted, "dragon の囲みが1つの図に置き換わらない").toEqual({ players: 1, drawn: 1, blocks: 0 });
    expect(js, "ほかの言葉の囲みを残さない").toBe("const a = 1;");
    expect(outside, "入口と塊と字の CSS のほかに取りに行った物").toEqual([]);
  });

  it("script-entry-draws-shared-block", () => {
    // 図の頭に定義を書かない共有のブロック (`+bridge`) を、共有の定義で描く (#3455)。共有の橋は石の橋の絵柄を持つ角丸の箱 (#3489)
    if (!entryBuilt()) return;
    const bridge = BRIDGE_GLYPH.get();
    expect(bridge, "既定の入口で箱の行に書いた石の橋が描かれない").toBeDefined();
    const { counted, glyphs, outside } = SHARED_BLOCK_PAGE.get();
    expect(counted, "共有のブロックを使う塊が1つの図に置き換わらない").toEqual({ players: 1, drawn: 1, blocks: 0 });
    const shapes = glyphs.filter((d) => d === (bridge ?? "")).length;
    expect(shapes, "共有の橋の箱の絵柄の枠に石の橋を描かない").toBeGreaterThan(0);
    expect(outside, "入口と塊と字の CSS のほかに取りに行った物").toEqual([]);
  });

  it("script-entry-loads-only-used-kinds", () => {
    if (!entryBuilt()) return;
    const { later, chunks } = KINDS.get();
    // 走査の空振りを避ける。後から読む種類は全て、どれかの塊が持つ
    expect([...new Set([...chunks.values()].flat())].sort(), "後から読む種類を持つ塊").toEqual([...later].sort());
    const kindsRead = (scripts: string[]): string[] => [...new Set(scripts.flatMap((file) => chunks.get(file) ?? []))].sort();

    const sequence = SEQUENCE_PAGE.get();
    expect(sequence.counted.drawn, "時系列図を描く").toBe(1);
    expect(kindsRead(sequence.scripts), "時系列図だけの頁で読んだ、後から読む種類の塊").toEqual([]);

    const branched = GIT_PAGE.get();
    expect(branched.drawn, "枝分かれの図を描く").toBe(1);
    expect(kindsRead(branched.scripts), "枝分かれの図の頁で読んだ、後から読む種類の塊").toEqual(["git"]);
  });

  it("script-entry-pins-own-version-on-cdn", () => {
    // jsDelivr は版の範囲の URL を file ごとに解き、browser に7日残す。残った入口が新しい版へ解かれた塊を取りに行くと 404 になる (#3375)
    if (!entryBuilt()) return;
    const { chunks } = KINDS.get();
    const place = movedCdn();
    const exact = `${CDN_PACKAGE}@${version()}/dist/cdn/`;
    const { counted, urls, scripts } = MOVED_PAGE.get();
    expect(counted, "範囲の場所に入口しか無くても、時系列図と枝分かれの図を描く").toEqual({ players: 2, drawn: 2, blocks: 0 });
    const afterEntry = urls.filter((url) => url !== place.entry);
    expect(afterEntry.length, "入口の後に読んだ file").toBeGreaterThan(0);
    expect(afterEntry.filter((url) => !url.startsWith(exact)), `入口の後に ${exact} の外から読んだ file`).toEqual([]);
    const kinds = [...new Set(scripts.flatMap((file) => chunks.get(file) ?? []))];
    expect(kinds, "枝分かれの図の塊も版を全て書いた場所から読む").toEqual(["git"]);
  });

  it("script-entry-within-budget", () => {
    if (!entryBuilt()) return;
    const { counted, scripts: read } = SEQUENCE_PAGE.get();
    expect(counted.drawn, "時系列図を描く").toBe(1);
    const scripts = [...new Set(read.filter((file) => file.endsWith(".js")))];
    expect(scripts, "最初に読んだ script に入口が在る").toContain(ENTRY);
    const sizes = Object.fromEntries(scripts.map((file) => [file, gzipSync(readFileSync(join(CDN, file))).length]));
    const total = Object.values(sizes).reduce((sum, size) => sum + size, 0);
    // 次に入口へ足す課題が、上限までの空きを測り直さずに知れるよう、合計と空きを出す (#3782)
    console.info(`最初に読む script の gzip 後の合計 ${total} byte (file ${scripts.length} 個、上限 ${FIRST_LOAD_BUDGET} byte、空き ${FIRST_LOAD_BUDGET - total} byte)`);
    expect(total, `最初に読む script の gzip 後の合計 (${JSON.stringify(sizes)})`).toBeLessThanOrEqual(FIRST_LOAD_BUDGET);
  });

  it("script-entry-leaves-architecture-layout-out", () => {
    // 構成図の並べ方は、構成図の塊を置いた頁だけが後から読む。時系列図だけの頁は読まない (#3782)
    if (!entryBuilt()) return;
    const holding = filesHolding("src/kinds/architecture/layout.ts");
    expect(holding.length, "構成図の並べ方を持つ file の数").toBeGreaterThan(0);
    const { counted, scripts } = SEQUENCE_PAGE.get();
    expect(counted.drawn, "時系列図を描く").toBe(1);
    expect(scripts.filter((file) => holding.includes(file)), "時系列図だけの頁で読んだ、構成図の並べ方を持つ file").toEqual([]);
  });

  it("script-entry-draws-architecture-after-loading-layout", () => {
    // 構成図の塊を置いた頁は、本体が最初に読む file の外に在る構成図の並べ方の塊を読んでから描く (#3782)
    if (!entryBuilt()) return;
    const holding = filesHolding("src/kinds/architecture/layout.ts");
    const first = entryFiles();
    expect(holding.filter((file) => first.has(file)), "構成図の並べ方を持つ、最初に読む file").toEqual([]);
    const { counted, scripts } = ARCHITECTURE_PAGE.get();
    expect(counted, "構成図の塊が1つの図に置き換わる").toEqual({ players: 1, drawn: 1, blocks: 0 });
    expect(scripts.filter((file) => holding.includes(file)).length, "構成図の頁で読んだ、構成図の並べ方を持つ file の数").toBe(1);
  });

  it("script-entry-leaves-api-only-parts-out", () => {
    // 軽い入口が並べ直して出す部品 (`api.ts`) だけが読む物は、1行の入口が最初に読む file に入れない。エディタの URL は帯の塊が読む (#3782)
    if (!entryBuilt()) return;
    const holding = filesHolding("src/editor-url.ts");
    expect(holding.length, "エディタの URL の部品を持つ file の数").toBeGreaterThan(0);
    const { counted, scripts } = SEQUENCE_PAGE.get();
    expect(counted.drawn, "時系列図を描く").toBe(1);
    expect(scripts.filter((file) => holding.includes(file)), "帯の無い頁で読んだ、エディタの URL の部品を持つ file").toEqual([]);
  });

  it("script-entry-adds-bar-with-data-header", () => {
    if (!entryBuilt()) return;
    const { figures, exported } = BAR_PAGE.get();
    expect(figures, "data-header を持つ塊は帯つきの図、持たない塊は帯の無い図").toEqual([
      { buttons: ["code", "editor", "copy", "export", "expand"], drawn: true },
      { buttons: [], drawn: true },
    ]);
    // 帯の HTML のエクスポートは、入口の置き場から書き出す部品を読み、再生の script を埋めた頁を書き出す
    const { settled, said, saved } = exported.get();
    // 書き出す部品を読めない時は、帯の知らせの欄にエクスポートできなかったと出る
    expect(settled).toMatch(/^(?!エクスポートしています).+/u);
    expect(said, "帯の HTML のエクスポートの知らせ").toBe("操作できるHTMLを保存しました。開くと初期条件から始まります。");
    const { filename, html } = saved.get();
    expect(filename, "帯の HTML のエクスポートの file の名前").toMatch(/\.html$/u);
    expect(html.includes("DragonPlayer.mountDiagram"), "書き出した頁が再生の script を埋めて図を置く").toBe(true);
  });

  it("script-entry-loads-bar-only-when-asked", () => {
    if (!entryBuilt()) return;
    const barFiles = filesHolding("src/frame/dragon-frame.mjs");
    expect(barFiles.length, "帯を持つ後から読む塊の file の数").toBeGreaterThan(0);
    expect(barFiles.filter((file) => entryFiles().has(file)), "最初に読む file に入った帯").toEqual([]);
    // data-header を持たない塊だけの頁は、帯の塊を読まない
    const plain = SEQUENCE_PAGE.get();
    expect(plain.counted.drawn, "時系列図を描く").toBe(1);
    expect(plain.scripts.filter((file) => barFiles.includes(file)), "data-header の無い頁で読んだ帯の塊").toEqual([]);
    // data-header を持つ塊は、帯の塊が届く前に帯の無い図を描き、届いた後に帯を付ける
    const { asked, before, frames } = HELD_BAR_PAGE.get();
    expect(asked, "図を描いた後に読みに行った帯の塊").toBeGreaterThan(0);
    expect(before, "帯の塊が届く前の data-header の塊").toEqual({ frames: 0, drawn: 1 });
    expect(frames, "帯の塊が届いた後の帯の数").toBe(1);
  });

  it("script-entry-kind-blocks-share-one-file", () => {
    // 種類だけが使うブロックの定義の file から、後から読む読み方と形の欠片が数の決まりを読むと、esbuild はその定義を最初に読む file に
    // 1 つずつ分ける。分けた file は別々に圧縮されて最初に読む量が増えるので、定義は box のブロックの定義と同じ file に入る (#3657)
    if (!entryBuilt()) return;
    const box = filesHolding("src/blocks/box/block.ts");
    expect(box.length, "box のブロックの定義を持つ file の数").toBe(1);
    const apart = KIND_ONLY_BLOCKS.filter((name) => filesHolding(`src/blocks/${name}/block.ts`).join() !== box.join());
    expect(apart, `box のブロックの定義 (${box.join()}) と別の file に入った、種類だけが使うブロックの定義`).toEqual([]);
  });

  it("script-entry-block-definitions-share-one-file", () => {
    // 本体の記法の読み方と後から読む個別ブロックの読み方が、それぞれ別の定義から数と語の決まりを読むと、esbuild は読む塊の組ごとに
    // 定義を最初に読む小さな file へ分ける。分けた file は別々に圧縮されて最初に読む量が増えるので、定義は 1 つの file に入る (#3706)
    if (!entryBuilt()) return;
    const holding = [...entryFiles()].filter((name) =>
      (JSON.parse(readFileSync(join(CDN, `${name}.map`), "utf8")) as { sources: string[] }).sources.some((source) => /src\/blocks\/[^/]+\/block\.ts$/u.test(source)),
    );
    expect(holding.sort(), "ブロックの定義を持つ、最初に読む file").toHaveLength(1);
  });

  it("script-entry-shared-parts-stay-in-main", () => {
    // 回り続ける図の描く部品が中身の帯を描く処理を読み、考えの読み方が色を読む処理を読むと、どちらも本体から最初に読む別の file へ分かれる (#3657)。
    // どちらも本体だけが読み、本体に入る
    if (!entryBuilt()) return;
    const first = entryFiles();
    const missing = ["src/blocks/strip/draw.ts", "src/blocks/color/read.ts"].filter((source) => !filesHolding(source).some(file => first.has(file)));
    expect(missing, "本体 (dragon-main.js) の外の file に入った処理").toEqual([]);
  });

  it("script-entry-adds-font-link-once", () => {
    if (!entryBuilt()) return;
    const { drawn, links, fonts } = FONT_PAGE.get();
    expect(drawn, "2つの塊を描く").toBe(2);
    const families = (urls: string[]): Record<string, number> => {
      const found: Record<string, number> = {};
      for (const url of urls) {
        const family = FONT_CSS.exec(url)?.[1];
        if (family !== undefined) found[family] = (found[family] ?? 0) + 1;
      }
      return found;
    };
    expect(families(links), "頁に足した字の CSS の link").toEqual({ "noto-sans-jp": 1, "jetbrains-mono": 1 });
    expect(families(fonts), "取りに行った字の CSS").toEqual({ "noto-sans-jp": 1, "jetbrains-mono": 1 });
  });

  it("embed-writes-offline-file", () => {
    const { ran, exists, written, opened } = EMBED_OFFLINE.get();
    expect(ran.code, `dragon embed の終わり方 (${ran.stderr})`).toBe(0);
    expect(exists, "埋めた1 file を書く").toBe(true);
    if (!exists) return;
    expect(written, "入口の1行の外を読む script を残さない").not.toMatch(/<script[^>]*\bsrc=/iu);

    const { counted, links, outside } = opened.get();
    expect(counted, "外への通信を止めて開くと、塊が図に置き換わる").toEqual({ players: 1, drawn: 1, blocks: 0 });
    expect(links.filter((href) => FONT_CSS.test(href)), "埋めた1 file は字の link を足さない").toEqual([]);
    expect(outside, "埋めた1 file が取りに行った外の物").toEqual([]);
  });

  // 埋めた頁は絵柄集の表を持たないので、頁の記法が使う Tabler の絵柄だけを頁に収め、それで描く (#3493)
  it("embed-carries-page-icons", () => {
    const { ran, written, opened } = EMBED_ICONS.get();
    expect(ran.code, `dragon embed の終わり方 (${ran.stderr})`).toBe(0);
    const icons = /<script type="application\/json" id="dragon-icons">([^<]*)<\/script>/u.exec(written.get())?.[1];
    expect(icons, "頁が使う絵柄の表を収めていない").toBeDefined();
    expect(Object.keys((JSON.parse(icons ?? "{}") as { tabler?: object }).tabler ?? {}), "収めた絵柄").toEqual(["building-bridge-2"]);

    const { counted, drawn } = opened.get();
    expect(counted, "外への通信を止めて開くと、塊が図に置き換わる").toEqual({ players: 1, drawn: 1, blocks: 0 });
    const tabler = (JSON.parse(icons ?? "{}") as { tabler: Record<string, string> }).tabler["building-bridge-2"];
    expect(drawn, "収めた石の橋の形で箱の絵柄を描く").toContain(tabler);
  });

  it("readme-shows-script-entry", () => {
    const [major, minor] = version().split(".");
    const line = `<script type="module" src="https://cdn.jsdelivr.net/npm/@cardenelabs/dragon@${major}.${minor}/dist/cdn/dragon.js"></script>`;
    for (const file of ["README.md", "README.ja.md"]) {
      const text = readFileSync(join(ROOT, file), "utf8");
      expect(text, `${file} に版の真ん中の数まで固定した入口の1行が無い`).toContain(line);
      expect(text, `${file} に記法の塊の書き方が無い`).toContain('<pre class="dragon">');
      expect(text, `${file} に dragon embed の書き方が無い`).toMatch(/dragon embed /u);
    }
  });

  it("pinned-script-lines-follow-package-version", () => {
    // 版を固定した入口の1行は README の頁に置く節と組み込みの節、使い方の頁、プラグインの組み込みの文書に在る (#3701)。
    // 上の検査は1行が在るかしか見ないので、版を上げた時に古い版の行が残っても落ちない。repo が追跡する全ての file から行を導き、どれも今の版を指すかを見る (#3711)
    const [major, minor] = version().split(".");
    const pinned = /@cardenelabs\/dragon@(\d+\.\d+)\/dist\/cdn\/dragon\.js/gu;
    const repo = join(ROOT, "../..");
    // 行を持つ file は git で探す。子の process は file を読み込む段で起こす
    const files = PINNED_FILES.get();
    // 走査が空振りした時に通らないよう、今の行を持つ file を下限として名指す
    for (const known of ["packages/dragon/README.md", "packages/dragon/README.ja.md", "apps/playground-spa/src/docs/content.ts", "plugins/dragon/skills/dragon/references/embed.md"]) {
      expect(files, `版を固定した入口の1行を持つ file に ${known} が無い`).toContain(known);
    }
    const stale = files.flatMap((file) =>
      [...readFileSync(join(repo, file), "utf8").matchAll(pinned)].map((match) => match[1]).filter((pin) => pin !== `${major}.${minor}`).map((pin) => `${file}: ${pin}`),
    );
    expect(stale, `入口の1行が package の版 ${major}.${minor} 以外を指す`).toEqual([]);
  });
});

/** 帯のボタンの並び。jsDelivr の入口の頁の帯と同じ (`script-entry-adds-bar-with-data-header`) */
const BAR_BUTTONS = ["code", "editor", "copy", "export", "expand"];

/** 埋めた頁を開いて見たこと */
interface OfflineSeen {
  /** 頁が外へ取りに行った URL。開いた頁の通信だけを数え、エディタを開く新しいタブは数えない */
  outside: string[];
  /** 頁で起きた例外 */
  errors: string[];
}

/** 埋めた頁 `offline` を外への通信を全て止めて開き、塊が全て図になるまで待って `run` を回す */
async function withOffline<T>(offline: string, run: (page: Page, seen: OfflineSeen) => Promise<T>): Promise<T> {
  const context = await (await fileChromium()).newContext({ viewport: { width: 760, height: 900 } });
  // 長さを書かない待ち (頁を開く、押す、字を読む) も区切る
  context.setDefaultTimeout(PAGE_WAIT);
  const seen: OfflineSeen = { outside: [], errors: [] };
  try {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await context.route(/^https?:/u, (route) => route.abort());
    const page = await context.newPage();
    page.on("request", (request) => {
      const url = request.url();
      if (!/^(file|data|blob):/u.test(url)) seen.outside.push(url);
    });
    page.on("pageerror", (error) => seen.errors.push(error.message));
    await page.goto(pathToFileURL(offline).href);
    // 帯つきの図は帯の内側 (shadow root) に描き直すので、図ごとに帯の内側か外側で描けたかを待つ
    await page
      .waitForFunction(() => {
        const figures = [...document.querySelectorAll(".dragon-figure")];
        return document.querySelectorAll("pre.dragon").length === 0 && figures.length === 2 && figures.every((figure) => (figure.querySelector(".dragon-frame")?.shadowRoot ?? figure).querySelector('[data-dragon="player"] svg') !== null);
      }, null, { timeout: QUICK_SETTLE })
      .catch(() => undefined);
    return await run(page, seen);
  } finally {
    await context.close();
  }
}

/** 図ごとの帯の数と帯のボタンの並びと、図を描けたか */
const figuresOf = (page: Page): Promise<{ headers: number; buttons: string[]; drawn: boolean }[]> =>
  page.evaluate(() =>
    [...document.querySelectorAll(".dragon-figure")].map((figure) => {
      const root = figure.querySelector(".dragon-frame")?.shadowRoot;
      return {
        headers: root ? root.querySelectorAll("[data-dragon-header]").length : figure.querySelectorAll("[data-dragon-header]").length,
        buttons: root ? [...root.querySelectorAll<HTMLElement>(".dg-header-actions > [data-action]")].map((el) => el.dataset.action ?? "") : [],
        drawn: (root ?? figure).querySelector('[data-dragon="player"] svg') !== null,
      };
    }),
  );

/** 帯つきの塊と帯の無い塊の頁を埋める置き場。前処理の後に消す */
const HEADER_DIR = mkdtempSync(join(tmpdir(), "dragon-embed-header-"));

// 帯つきの塊 (時系列図) と帯の無い塊 (構成図) を置いた頁を、file で 1 度だけ `dragon embed` で埋める。命令を起こす秒数を件ごとに払わない
const EMBED_HEADER = await atLoad("帯つきの塊と帯の無い塊の頁を dragon embed で埋める", async () => {
  const [major, minor] = version().split(".");
  const source = join(HEADER_DIR, "page.html");
  const offline = join(HEADER_DIR, "page.offline.html");
  writeFileSync(
    source,
    [
      "<!doctype html>",
      '<html lang="ja"><head><meta charset="utf-8">',
      `<script type="module" src="https://cdn.jsdelivr.net/npm/@cardenelabs/dragon@${major}.${minor}/dist/cdn/dragon.js"></script>`,
      '</head><body style="margin:0;padding:16px">',
      `<pre class="dragon" data-header>${escape(SEQUENCE)}</pre>`,
      `<pre class="dragon">${escape(ARCHITECTURE)}</pre>`,
      "</body></html>",
    ].join("\n"),
  );
  return { offline, ran: await runCli(["embed", source, "--out", offline]) };
});

/** 埋めた頁を開いて、図と頁で起きた例外を読む。2 つの件が同じ頁を読み、どちらも頁を触らない */
const OFFLINE_FIGURES = await atLoad("埋めた頁を開いて図を読む", () =>
  withOffline(EMBED_HEADER.get().offline, async (page, seen) => ({ figures: await figuresOf(page), errors: [...seen.errors] })),
);

const OFFLINE_MENU = await atLoad("埋めた頁の帯のエクスポートの窓を開く", () =>
  withOffline(EMBED_HEADER.get().offline, async (page) => {
    const toggle = page.locator('.dg-header-actions > [data-action="export"] > button');
    const toggles = await toggle.count();
    const menu = await atLoad("エクスポートの窓を開いて見出しと形式を読む", async () => {
      await toggle.click({ timeout: PAGE_WAIT });
      return page.evaluate(() => {
        const el = document.querySelector(".dragon-frame")!.shadowRoot!.querySelector<HTMLElement>('[data-menu="export"]')!;
        const groups: { group: string; formats: string[] }[] = [];
        for (const child of el.querySelectorAll<HTMLElement>("[data-group],[data-format]")) {
          if (child.dataset.group) groups.push({ group: child.dataset.group, formats: [] });
          else groups.at(-1)?.formats.push(child.dataset.format ?? "");
        }
        return { groups, motion: el.querySelectorAll('[data-group="motion"],[data-format="html"],[data-format="gif"],[data-format="mp4"]').length };
      });
    });
    return { toggles, menu };
  }),
);

const OFFLINE_BUTTONS = await atLoad("埋めた頁の帯のボタンを全て押す", () =>
  withOffline(EMBED_HEADER.get().offline, async (page, seen) => {
    const buttons = (await figuresOf(page))[0]?.buttons;
    const status = page.locator(".dragon-frame .status");
    const clearStatus = () => page.evaluate(() => (document.querySelector(".dragon-frame")!.shadowRoot!.querySelector(".status")!.textContent = ""));
    /** 窓 `menu` を開いて項目 `item` を押し、知らせの欄が書き換わるまで待った字と、その後に読んだ知らせの欄の字を返す */
    const pick = async (menu: string, item: string): Promise<{ polled: string | null; said: string }> => {
      await clearStatus();
      await page.locator(`.dg-header-actions > [data-action="${menu}"] > button`).click({ timeout: PAGE_WAIT });
      await page.locator(`[data-menu="${menu}"] ${item}`).click({ timeout: PAGE_WAIT });
      const polled = await pollFor(() => status.textContent({ timeout: PAGE_WAIT }), statusSettled, QUICK_SETTLE);
      return { polled, said: (await status.textContent({ timeout: PAGE_WAIT })) ?? "" };
    };
    // 知らせの欄が書き換わらなかった項目で止める。件はその項目の待ちの判定で落ちる
    const picked = await atLoad("帯のコピーとエクスポートの項目を押す", async () => {
      const polls: (string | null)[] = [];
      const said: Record<string, string> = {};
      for (const kind of ["source", "image", "url"]) {
        const got = await pick("copy", `[data-copy="${kind}"]`);
        polls.push(got.polled);
        if (!statusSettled(got.polled)) return { polls, said };
        said[`copy:${kind}`] = got.said;
      }
      for (const format of ["png", "svg", "dragon", "json"]) {
        const saved = page.waitForEvent("download", { timeout: QUICK_SETTLE });
        // 途中で止めた時も、download を待つ約束を受け手の無いまま落とさない
        saved.catch(() => undefined);
        const got = await pick("export", `[data-format="${format}"]`);
        polls.push(got.polled);
        if (!statusSettled(got.polled)) return { polls, said };
        said[`export:${format}`] = got.said;
        await saved;
      }
      return { polls, said };
    });
    // エディタと拡大とコードは知らせを出さずに動く。拡大は開いて閉じ、コードは開いたまま終える
    const pressed = await atLoad("帯のエディタと拡大とコードを押す", async () => {
      // コピーとエクスポートの項目を押せなかった時は、件がそこで落ちるので押さない
      picked.get();
      await clearStatus();
      await page.locator('.dg-header-actions > [data-action="editor"]').click({ timeout: PAGE_WAIT });
      await page.locator('.dg-header-actions > [data-action="expand"]').click({ timeout: PAGE_WAIT });
      await page.locator('.dg-header-actions > [data-action="expand"]').click({ timeout: PAGE_WAIT });
      await page.locator('.dg-header-actions > [data-action="code"]').click({ timeout: PAGE_WAIT });
      return { status: await status.textContent({ timeout: PAGE_WAIT }), errors: [...seen.errors], outside: [...seen.outside] };
    });
    return { buttons, picked, pressed };
  }),
);

describe("dragon embed の頁の帯 (#3786)", () => {
  // 埋める命令は file を読み込む段で 1 度だけ起こす (`EMBED_HEADER`)。埋められなかった時は、前処理で全ての件を落とす
  beforeAll(() => {
    const { ran } = EMBED_HEADER.get();
    expect(ran.code, `dragon embed の終わり方 (${ran.stderr})`).toBe(0);
  });
  afterAll(() => {
    rmSync(HEADER_DIR, { recursive: true, force: true });
  });

  it("offline-page-frames-header-blocks", () => {
    const { figures, errors } = OFFLINE_FIGURES.get();
    const [framed] = figures;
    expect(framed, "data-header を持つ塊の図").toEqual({ headers: 1, buttons: BAR_BUTTONS, drawn: true });
    expect(errors, "頁で起きた例外").toEqual([]);
  });

  it("offline-page-leaves-plain-blocks-bare", () => {
    const { figures } = OFFLINE_FIGURES.get();
    expect(figures, "埋めた頁の図の数").toHaveLength(2);
    expect(figures[1], "data-header を持たない塊は、帯の無い図のまま描く").toEqual({ headers: 0, buttons: [], drawn: true });
  });

  it("offline-export-menu-lists-four-formats", () => {
    const { toggles, menu: opened } = OFFLINE_MENU.get();
    expect(toggles, "埋めた頁の帯にエクスポートの窓を開くボタンが無い").toBe(1);
    const menu = opened.get();
    expect(menu.groups, "埋めた頁のエクスポートの窓の見出しと形式").toEqual([
      { group: "images", formats: ["png", "svg"] },
      { group: "notation", formats: ["dragon", "json"] },
    ]);
    expect(menu.motion, "埋めた頁のエクスポートの窓に残った動きの見出しと HTML、GIF、MP4").toBe(0);
  });

  it("offline-header-buttons-work-without-network", () => {
    const { buttons, picked, pressed } = OFFLINE_BUTTONS.get();
    expect(buttons, "埋めた頁の帯のボタン").toEqual(BAR_BUTTONS);
    const { polls, said } = picked.get();
    // 項目ごとに、知らせの欄がエクスポートしている間の知らせから書き換わるまで待った字。押した順に確かめる
    for (const polled of polls) expect(polled).toMatch(/^(?!エクスポートしています).+/u);
    expect(said, "コピーとエクスポートの項目を押した時の知らせ").toEqual({
      "copy:source": "記法をコピーしました。",
      "copy:image": "画像をコピーしました。",
      "copy:url": "エディタのURLをコピーしました。",
      "export:png": "ファイルを保存しました。",
      "export:svg": "ファイルを保存しました。",
      "export:dragon": "ファイルを保存しました。",
      "export:json": "ファイルを保存しました。",
    });
    // エディタと拡大とコードは知らせを出さずに動く。拡大は開いて閉じ、コードは開いたまま終える
    const { status, errors, outside } = pressed.get();
    expect(status, "エディタと拡大とコードを押した時の知らせ").toBe("");
    expect(errors, "帯のボタンを押した時に頁で起きた例外").toEqual([]);
    expect(outside, "帯のボタンを押した時に埋めた頁が外へ取りに行った物").toEqual([]);
  });
});

/** 止めて置く量の図 (#3801)。段の名前 (今週) と図の題 (品ごとの売り上げ) が違う */
const STILL_BAR = "chart 品ごとの売り上げ [shape: bar]\n\nitem bread as パン\nitem sweets as 菓子パン\n\nstep 今週\n  say 今週の売り上げ。\n  set bread: 268\n  set sweets: 141\n";
/** 名前が輪の内側に 1 行で収まらない、止めて置くドーナツ (#3809) */
const STILL_DONUT = "chart 売り上げの割合 [shape: donut]\n\nitem bread as パン\nitem sweets as 菓子パン\n\nstep 今週\n  say 売り上げの内訳。\n  set bread: 60\n  set sweets: 40\n";
/** 止めて置く手順の帯 (#3809) */
const STILL_BAND = "cycle 淹れ方 [shape: band]\n\nbox grind as 挽く\nbox pour as 注ぐ\n\nstep 挽く\n  say 豆を挽く。\nstep 注ぐ\n  say お湯を注ぐ。\n  grind -> pour [carry: none]\n";
/** 頁の中の script を外した字。束ねた script は止めて置く図を描く字を持つので、頁に置いた物だけを数える */
const withoutScripts = (html: string): string => html.replace(/<script\b[\s\S]*?<\/script>/gu, "");

const STILL_PAGE = await atLoad("止めて置く量の図の塊の頁を開く", () =>
  withPage(`<pre class="dragon" data-still>${escape(STILL_BAR)}</pre>`, async (page) => {
    await page.waitForSelector(".dragon-still svg.dg", { timeout: QUICK_SETTLE }).catch(() => undefined);
    return page.evaluate(() => ({
      svg: document.querySelectorAll(".dragon-still svg.dg").length,
      player: document.querySelectorAll('[data-dragon="player"], .dg-player, .dg-bar, .dg-btn').length,
      block: document.querySelectorAll("pre.dragon").length,
      title: document.querySelector("[data-chart-title]")?.getAttribute("data-chart-title") ?? "",
    }));
  }),
);

const STILL_ERRORS_PAGE = await atLoad("誤りのある止めて置く塊の頁を開く", () =>
  withPage(`<pre class="dragon" data-still>${escape(BROKEN)}</pre>`, async (page) => {
    await page.waitForSelector("pre.dragon-error", { timeout: QUICK_SETTLE }).catch(() => undefined);
    return page.evaluate(() => ({ errors: document.querySelectorAll("pre.dragon-error").length, svg: document.querySelectorAll("svg.dg").length }));
  }),
);

describe("頁の塊を止めて置く (#3801)", () => {
  it("page-still-block-places-svg-without-player", () => {
    const found = STILL_PAGE.get();
    expect(found, "止めて置く塊を置き換えた物").toEqual({ svg: 1, player: 0, block: 0, title: "品ごとの売り上げ" });
  });

  it("page-still-block-shows-notation-errors", () => {
    const found = STILL_ERRORS_PAGE.get();
    expect(found, "誤りのある止めて置く塊を置き換えた物").toEqual({ errors: 1, svg: 0 });
  });
});

describe("dragon embed の止めて置く図 (#3801)", () => {
  let dir = "";
  let stillOnly = "";
  let mixed = "";
  let look = "";
  // 止めて置く塊だけの頁と、動く塊も置いた頁と、見た目を頁に合わせる図 (#3809) の頁を、file で 1 度ずつ `dragon embed` で埋める。命令を起こす秒数を件ごとに払わない
  beforeAll(async () => {
    dir = mkdtempSync(join(tmpdir(), "dragon-embed-still-"));
    const [major, minor] = version().split(".");
    const page = (blocks: string[]): string =>
      [
        "<!doctype html>",
        '<html lang="ja"><head><meta charset="utf-8">',
        `<script type="module" src="https://cdn.jsdelivr.net/npm/@cardenelabs/dragon@${major}.${minor}/dist/cdn/dragon.js"></script>`,
        "</head><body>",
        ...blocks,
        "</body></html>",
      ].join("\n");
    const still = `<pre class="dragon" data-still>${escape(STILL_BAR)}</pre>`;
    const sources = {
      stillOnly: page([still, still]),
      mixed: page([still, `<pre class="dragon">${escape(SEQUENCE)}</pre>`]),
      look: page([`<pre class="dragon" data-still>${escape(STILL_DONUT)}</pre>`, `<pre class="dragon" data-still>${escape(STILL_BAND)}</pre>`]),
    };
    const embed = async (name: keyof typeof sources): Promise<string> => {
      const source = join(dir, `${name}.html`);
      const out = join(dir, `${name}.offline.html`);
      writeFileSync(source, sources[name]);
      const ran = await runCli(["embed", source, "--out", out]);
      expect(ran.code, `dragon embed の終わり方 (${ran.stderr})`).toBe(0);
      return readFileSync(out, "utf8");
    };
    [stillOnly, mixed, look] = await Promise.all([embed("stillOnly"), embed("mixed"), embed("look")]);
  });
  afterAll(() => {
    if (dir) rmSync(dir, { recursive: true, force: true });
  });

  it("embed-still-only-page-has-no-script", () => {
    const body = withoutScripts(stillOnly);
    expect(body.match(/<svg[^>]*class="dg dg-/gu)?.length, "止めて置く塊を描いた SVG の数").toBe(2);
    expect(body, "量の図の題").toContain('data-chart-title="品ごとの売り上げ"');
    expect(stillOnly, "動く塊が残らない頁に入れた script").not.toMatch(/<script\b/u);
    expect(stillOnly, "残った記法の塊").not.toMatch(/<pre\b[^>]*class="dragon"/u);
  });

  it("embed-mixed-page-keeps-script", () => {
    const body = withoutScripts(mixed);
    expect(body.match(/<svg[^>]*class="dg dg-/gu)?.length, "止めて置く塊を描いた SVG の数").toBe(1);
    expect(body.match(/<pre class="dragon">/gu)?.length, "動く塊の数").toBe(1);
    expect(mixed, "動く塊を描く束ねた script").toMatch(/<script\b[^>]*>[\s\S]{1000,}<\/script>/u);
    expect(mixed, "入口の1行").not.toMatch(/dist\/cdn\/dragon\.js/u);
  });

  it("embed-still-figure-follows-page-look", () => {
    const body = withoutScripts(look);
    expect(body.match(/--bg:var\(--dragon-figure-background,/gu)?.length ?? 0, "頁の色を読む地の数").toBeGreaterThanOrEqual(2);
    const title = /<text[^>]*data-chart-title="売り上げの割合"[^>]*>([\s\S]*?)<\/text>/u.exec(body)?.[1] ?? "";
    expect(title.match(/<tspan\b/gu)?.length ?? 0, "ドーナツの名前の行の数").toBe(2);
    // 山形の線は上の縁 (M) から先の点を通って下の縁 (2 つ目の L) へ回る
    for (const id of ["grind", "pour"]) {
      const seg = new RegExp(`<g data-segment="${id}" data-round="0"[^>]*><path class="dg-bd-seg" d="M[-\\d.]+ ([-\\d.]+)H[-\\d.]+L[-\\d.]+ [-\\d.]+L[-\\d.]+ ([-\\d.]+)`, "u").exec(body);
      const name = new RegExp(`<g data-band-name="${id}"><text class="dg-bd-name" x="[-\\d.]+" y="([-\\d.]+)"`, "u").exec(body);
      expect(seg, `${id} の山形`).not.toBeNull();
      expect(name, `${id} の名前`).not.toBeNull();
      const [top, bottom, base] = [Number(seg?.[1]), Number(seg?.[2]), Number(name?.[1])];
      expect(base > top && base < bottom, `${id} の名前の基準線 ${String(base)} が山形の上の縁 ${String(top)} と下の縁 ${String(bottom)} の間に在る`).toBe(true);
    }
  });
});
