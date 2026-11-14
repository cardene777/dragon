/**
 * script の1行と記法の塊を置くだけで図が出る入口 (#3343)。
 *
 * 頁に `<script type="module" src=".../dist/cdn/dragon.js">` の1行と `<pre class="dragon">` の記法の塊を置くと、塊が動く図に置き換わる。
 * 入口は軽い入口 (`@cardenelabs/dragon/light`) と同じく、書いた図の種類の塊だけを後から読む。
 * 図の字の CSS は jsDelivr から読む `<link>` を頁に1度だけ足す。
 * `dragon embed <HTML>` は入口の1行を束ねた script の中身に置き換え、外へ通信しない1 file を書く。
 *
 * 入口の file は build した `dist/cdn` から読む。頁は `http://localhost/` に置き、入口と塊も同じ置き場から渡す。
 * 外への通信は全て止め、何を取りに行ったかを数える。
 */
import { mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { gzipSync } from "node:zlib";
import type { Page } from "playwright-core";
import * as dragon from "@cardenelabs/dragon";
import { describe, expect, it } from "vitest";

import { runCli } from "./export-support";
import { fileChromium } from "./page-needs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const CDN = join(ROOT, "dist/cdn");
const ENTRY = "dragon.js";
const EXAMPLES = join(ROOT, "examples");

const PAGE = "http://localhost/";
const LOCAL_ROOT = "http://localhost/cdn/";
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


/** 入口の1行と `body` を置いた頁を開いて `run` を回す。入口と塊は `place` から渡す */
async function withPage<T>(body: string, run: (page: Page, requests: Requests) => Promise<T>, lang = "ja", place: Place = LOCAL): Promise<T> {
  // file で 1 つの Chromium を使う。後処理で閉じず、file の process の終わりに止まる (#3424)
  const context = await (await fileChromium()).newContext({ viewport: { width: 960, height: 720 } });
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
      const path = join(CDN, file);
      if (!existsSync(path)) return route.fulfill({ status: 404, body: "" });
      return route.fulfill({ contentType: file.endsWith(".js") ? "text/javascript" : "application/json", body: readFileSync(path) });
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

describe("script の1行の入口 (#3343)", () => {
  it("script-entry-replaces-block-with-figure", async () => {
    if (!entryBuilt()) return;
    await withPage(`<pre class="dragon">${escape(SEQUENCE)}</pre>`, async (page, requests) => {
      await settle(page, 1);
      expect(await counts(page), "記法の塊が1つの図に置き換わる").toEqual({ players: 1, drawn: 1, blocks: 0 });
      expect(requests.outside, "入口と塊と字の CSS のほかに取りに行った物").toEqual([]);
    });
  });

  it("script-entry-replaces-every-block", async () => {
    if (!entryBuilt()) return;
    // 入れ子の HTML の中で書いた塊は、全ての行に同じ字下げが付く。共通の字下げを外して読む
    const indented = (text: string): string => text.split("\n").map((line) => (line === "" ? line : `      ${line}`)).join("\n");
    const body = `<main>\n  <section>\n    <pre class="dragon">\n${escape(indented(SEQUENCE))}    </pre>\n  </section>\n  <section>\n    <pre class="dragon">\n${escape(indented(ARCHITECTURE))}    </pre>\n  </section>\n</main>`;
    await withPage(body, async (page) => {
      await settle(page, 2);
      expect(await counts(page), "記法の塊が2つとも図に置き換わる").toEqual({ players: 2, drawn: 2, blocks: 0 });
    });
  });

  it("script-entry-shows-notation-errors", async () => {
    if (!entryBuilt()) return;
    const whole = (await import(/* @vite-ignore */ "@cardenelabs/dragon")) as { parseNotation(text: string, options: { lang: "ja" }): { ok: boolean; errors?: { line: number; message: string }[] } };
    const parsed = whole.parseNotation(BROKEN, { lang: "ja" });
    expect(parsed.ok, "見本の記法が誤りを持つ").toBe(false);
    const messages = (parsed.errors ?? []).map((error) => error.message);
    expect(messages.length, "見本の記法の誤りの文").toBeGreaterThan(0);
    const body = `<div id="bad"><pre class="dragon">${escape(BROKEN)}</pre></div><div id="good"><pre class="dragon">${escape(SEQUENCE)}</pre></div>`;
    await withPage(body, async (page) => {
      await settle(page, 1);
      const bad = await page.evaluate(() => {
        const place = document.getElementById("bad");
        return { text: place?.textContent ?? "", svgs: place?.querySelectorAll("svg").length ?? -1, blocks: place?.querySelectorAll("pre.dragon").length ?? -1 };
      });
      expect(bad.svgs, "誤りのある塊の場所に図を置かない").toBe(0);
      expect(bad.blocks, "誤りのある塊を記法のまま残さない").toBe(0);
      for (const message of messages) expect(bad.text, "誤りのある塊の場所に誤りの文を出す").toContain(message);
      const good = await page.evaluate(() => document.querySelectorAll('#good [data-dragon="player"] svg').length);
      expect(good, "誤りの無い塊は図に置き換わる").toBe(1);
    });
  });

  it("script-entry-draws-short-notation", async () => {
    // 宣言と段を省いた短い記法の塊も、script の 1 行で動く図に置き換わり、線に出た名前を箱に描く (#3438)
    if (!entryBuilt()) return;
    await withPage(`<pre class="dragon">${escape(SHORT)}</pre>`, async (page, requests) => {
      await settle(page, 1);
      expect(await counts(page), "短い記法の塊が1つの図に置き換わらない").toEqual({ players: 1, drawn: 1, blocks: 0 });
      const names = await page.evaluate(() => [...document.querySelectorAll('[data-dragon="player"] svg text.dg-sn')].map((text) => text.textContent ?? ""));
      expect(names, "線に出た名前を箱に描かない").toEqual(expect.arrayContaining(["ブラウザ", "アプリ"]));
      expect(requests.outside, "入口と塊と字の CSS のほかに取りに行った物").toEqual([]);
    });
  });

  it("script-entry-draws-markdown-code-fence", async () => {
    // Markdown の ```dragon の囲みから作った HTML (`<pre><code class="language-dragon">`) も図に置き換え、ほかの言葉の囲みは残す (#3455)
    if (!entryBuilt()) return;
    const body = `<pre><code class="language-dragon">${escape(SEQUENCE)}</code></pre><pre id="js"><code class="language-js">const a = 1;</code></pre>`;
    await withPage(body, async (page, requests) => {
      await page
        .waitForFunction(() => document.querySelectorAll("code.language-dragon").length === 0 && document.querySelectorAll('[data-dragon="player"] svg').length >= 1, undefined, { timeout: QUICK_SETTLE })
        .catch(() => undefined);
      const fences = await page.evaluate(() => document.querySelectorAll("code.language-dragon").length);
      expect(fences, "dragon の囲みを記法のまま残した").toBe(0);
      expect(await counts(page), "dragon の囲みが1つの図に置き換わらない").toEqual({ players: 1, drawn: 1, blocks: 0 });
      const js = await page.evaluate(() => document.querySelector("#js code.language-js")?.textContent ?? null);
      expect(js, "ほかの言葉の囲みを残さない").toBe("const a = 1;");
      expect(requests.outside, "入口と塊と字の CSS のほかに取りに行った物").toEqual([]);
    });
  });

  it("script-entry-draws-shared-block", async () => {
    // 図の頭に定義を書かない共有のブロック (`+bridge`) を、共有の定義で描く (#3455)。共有の橋は石の橋の絵柄を持つ角丸の箱 (#3489)
    if (!entryBuilt()) return;
    const bridge = bridgeGlyph();
    expect(bridge, "既定の入口で箱の行に書いた石の橋が描かれない").toBeDefined();
    await withPage(`<pre class="dragon">${escape(SHARED_BLOCK)}</pre>`, async (page, requests) => {
      // 読めない塊も誤りの文に置き換わるので、塊が無くなるまでを待つ
      await page.waitForFunction(() => document.querySelectorAll("pre.dragon").length === 0, undefined, { timeout: QUICK_SETTLE }).catch(() => undefined);
      expect(await counts(page), "共有のブロックを使う塊が1つの図に置き換わらない").toEqual({ players: 1, drawn: 1, blocks: 0 });
      const shapes = await page.evaluate((d) => [...document.querySelectorAll('[data-dragon="player"] svg path.dg-gl')].filter((path) => path.getAttribute("d") === d).length, bridge ?? "");
      expect(shapes, "共有の橋の箱の絵柄の枠に石の橋を描かない").toBeGreaterThan(0);
      expect(requests.outside, "入口と塊と字の CSS のほかに取りに行った物").toEqual([]);
    });
  });

  it("script-entry-loads-only-used-kinds", async () => {
    if (!entryBuilt()) return;
    const later = await laterKinds();
    const chunks = await kindChunks();
    // 走査の空振りを避ける。後から読む種類は全て、どれかの塊が持つ
    expect([...new Set([...chunks.values()].flat())].sort(), "後から読む種類を持つ塊").toEqual([...later].sort());
    const kindsRead = (scripts: string[]): string[] => [...new Set(scripts.flatMap((file) => chunks.get(file) ?? []))].sort();

    await withPage(`<pre class="dragon">${escape(SEQUENCE)}</pre>`, async (page, requests) => {
      await settle(page, 1);
      expect((await counts(page)).drawn, "時系列図を描く").toBe(1);
      expect(kindsRead(requests.scripts), "時系列図だけの頁で読んだ、後から読む種類の塊").toEqual([]);
    });

    const git = readFileSync(join(EXAMPLES, "rebase.dragon"), "utf8");
    await withPage(`<pre class="dragon">${escape(git)}</pre>`, async (page, requests) => {
      await settle(page, 1);
      expect((await counts(page)).drawn, "枝分かれの図を描く").toBe(1);
      expect(kindsRead(requests.scripts), "枝分かれの図の頁で読んだ、後から読む種類の塊").toEqual(["git"]);
    });
  });

  it("script-entry-pins-own-version-on-cdn", async () => {
    // jsDelivr は版の範囲の URL を file ごとに解き、browser に7日残す。残った入口が新しい版へ解かれた塊を取りに行くと 404 になる (#3375)
    if (!entryBuilt()) return;
    const chunks = await kindChunks();
    const place = movedCdn();
    const exact = `${CDN_PACKAGE}@${version()}/dist/cdn/`;
    const git = readFileSync(join(EXAMPLES, "rebase.dragon"), "utf8");
    await withPage(
      `<pre class="dragon">${escape(SEQUENCE)}</pre><pre class="dragon">${escape(git)}</pre>`,
      async (page, requests) => {
        await settle(page, 2);
        expect(await counts(page), "範囲の場所に入口しか無くても、時系列図と枝分かれの図を描く").toEqual({ players: 2, drawn: 2, blocks: 0 });
        const afterEntry = requests.urls.filter((url) => url !== place.entry);
        expect(afterEntry.length, "入口の後に読んだ file").toBeGreaterThan(0);
        expect(afterEntry.filter((url) => !url.startsWith(exact)), `入口の後に ${exact} の外から読んだ file`).toEqual([]);
        const kinds = [...new Set(requests.scripts.flatMap((file) => chunks.get(file) ?? []))];
        expect(kinds, "枝分かれの図の塊も版を全て書いた場所から読む").toEqual(["git"]);
      },
      "ja",
      place,
    );
  });

  it("script-entry-within-budget", async () => {
    if (!entryBuilt()) return;
    await withPage(`<pre class="dragon">${escape(SEQUENCE)}</pre>`, async (page, requests) => {
      await settle(page, 1);
      expect((await counts(page)).drawn, "時系列図を描く").toBe(1);
      const scripts = [...new Set(requests.scripts.filter((file) => file.endsWith(".js")))];
      expect(scripts, "最初に読んだ script に入口が在る").toContain(ENTRY);
      const sizes = Object.fromEntries(scripts.map((file) => [file, gzipSync(readFileSync(join(CDN, file))).length]));
      const total = Object.values(sizes).reduce((sum, size) => sum + size, 0);
      expect(total, `最初に読む script の gzip 後の合計 (${JSON.stringify(sizes)})`).toBeLessThanOrEqual(FIRST_LOAD_BUDGET);
    });
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

  it("script-entry-adds-font-link-once", async () => {
    if (!entryBuilt()) return;
    await withPage(`<pre class="dragon">${escape(SEQUENCE)}</pre><pre class="dragon">${escape(ARCHITECTURE)}</pre>`, async (page, requests) => {
      await settle(page, 2);
      expect((await counts(page)).drawn, "2つの塊を描く").toBe(2);
      const links = await page.evaluate(() => [...document.querySelectorAll('link[rel="stylesheet"]')].map((link) => link.getAttribute("href") ?? ""));
      const families = (urls: string[]): Record<string, number> => {
        const found: Record<string, number> = {};
        for (const url of urls) {
          const family = FONT_CSS.exec(url)?.[1];
          if (family !== undefined) found[family] = (found[family] ?? 0) + 1;
        }
        return found;
      };
      expect(families(links), "頁に足した字の CSS の link").toEqual({ "noto-sans-jp": 1, "jetbrains-mono": 1 });
      expect(families(requests.fonts), "取りに行った字の CSS").toEqual({ "noto-sans-jp": 1, "jetbrains-mono": 1 });
    });
  });

  it("embed-writes-offline-file", async () => {
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
      expect(ran.code, `dragon embed の終わり方 (${ran.stderr})`).toBe(0);
      expect(existsSync(out), "埋めた1 file を書く").toBe(true);
      if (!existsSync(out)) return;
      const written = readFileSync(out, "utf8");
      expect(written, "入口の1行の外を読む script を残さない").not.toMatch(/<script[^>]*\bsrc=/iu);

      const context = await (await fileChromium()).newContext({ viewport: { width: 960, height: 720 } });
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
        expect(await counts(page), "外への通信を止めて開くと、塊が図に置き換わる").toEqual({ players: 1, drawn: 1, blocks: 0 });
        const links = await page.evaluate(() => [...document.querySelectorAll("link")].map((link) => link.getAttribute("href") ?? ""));
        expect(links.filter((href) => FONT_CSS.test(href)), "埋めた1 file は字の link を足さない").toEqual([]);
        expect(outside, "埋めた1 file が取りに行った外の物").toEqual([]);
      } finally {
        await context.close();
      }
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  // 埋めた頁は絵柄集の表を持たないので、頁の記法が使う Tabler の絵柄だけを頁に収め、それで描く (#3493)
  it("embed-carries-page-icons", async () => {
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
      expect(ran.code, `dragon embed の終わり方 (${ran.stderr})`).toBe(0);
      const written = readFileSync(out, "utf8");
      const icons = /<script type="application\/json" id="dragon-icons">([^<]*)<\/script>/u.exec(written)?.[1];
      expect(icons, "頁が使う絵柄の表を収めていない").toBeDefined();
      expect(Object.keys((JSON.parse(icons ?? "{}") as { tabler?: object }).tabler ?? {}), "収めた絵柄").toEqual(["building-bridge-2"]);

      const context = await (await fileChromium()).newContext({ viewport: { width: 960, height: 720 } });
      try {
        await context.route(/^https?:/u, (route) => route.abort());
        const page = await context.newPage();
        await page.goto(pathToFileURL(out).href);
        await settle(page, 1);
        expect(await counts(page), "外への通信を止めて開くと、塊が図に置き換わる").toEqual({ players: 1, drawn: 1, blocks: 0 });
        const drawn = await page.evaluate(() => [...document.querySelectorAll("path.dg-gl")].map((path) => path.getAttribute("d") ?? ""));
        const tabler = (JSON.parse(icons ?? "{}") as { tabler: Record<string, string> }).tabler["building-bridge-2"];
        expect(drawn, "収めた石の橋の形で箱の絵柄を描く").toContain(tabler);
      } finally {
        await context.close();
      }
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
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
});
