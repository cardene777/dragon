/**
 * ブラウザで描いた図を画像にする書き出す入口 (`@cardenelabs/dragon/capture`、#3644)。
 *
 * 書き出す入口は、頁に描いた SVG を受けて、GIF と mp4 と PNG の Blob と、字を埋めた SVG の文字列を返す。
 * GIF と mp4 のコマの時刻は `dragon export` と同じく、図の `--play` を `paused` にして `--at` に秒を入れて止める。
 * 字は頁が読み込んだ `@font-face` から、描いた字の範囲に当たる字の file だけを丸ごと `data:` で埋める。
 *
 * 頁は `http://localhost/` に置く (WebCodecs は安全な頁でしか使えない)。build した `dist/capture.js` を読み、
 * 入口が読む詰める道具 (`gifenc` と `mediabunny`) は import map で node_modules の file へ向ける。
 * 字の CSS と字の file は、同梱の字の package (`@fontsource-variable/*`) の file をそのまま返す。
 *
 * 件の中で頁を開いて書き出すと、混んだ機械で 1 件 10 秒の上限を超えた (#3816)。
 * 頁を開いて書き出す仕事と、比べる元の書き出しは file を読み込む段 (`at-load.ts`) で済ませ、件は記した値を元の件と同じ順で確かめる。
 */
import { createHash } from "node:crypto";
import { existsSync, mkdtempSync, readdirSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { PNG } from "pngjs";
import type { BrowserContext, Page } from "playwright-core";
import { parseNotation, renderDiagram } from "../src/core";
import { describe, expect, it } from "vitest";
import { atLoad } from "./at-load";
import { ACTION_LIMIT_MS, PAGE_LIMIT_MS, within } from "./page-wait";
import type { Json } from "./diagram-support";
import { exporter, readGif } from "./export-support";
import { fileChromium } from "./page-needs";
import "../src/kind-use/architecture";
import "../src/kind-use/sequence";
// 判定の表 (#3937) を描く部品を読む
import "../src/kind-use/judge";
import { clusters, colorsOf, marks, type Picture, SCALE, spots, toGifBox, verdictBox, vivid } from "./judge-pixels";

/** package の package.json。package の根を字で書くと、関係する検査を選ぶ命令が package の全ての code へたどり着くので、package.json から根を引く (#3763) */
const MANIFEST = join(process.cwd(), "packages/dragon/package.json");
const ROOT = dirname(MANIFEST);
const require_ = createRequire(MANIFEST);
const FONTS = join(ROOT, "node_modules/@fontsource-variable");
const CAPTURE = join(ROOT, "dist/capture.js");

/** 頁に返す file。`/fonts/<字の package>/<path>` は字の package の file を返す */
const FILES: Record<string, string> = {
  "/mediabunny.js": join(dirname(require_.resolve("mediabunny")), "mediabunny.min.mjs"),
  "/gifenc.js": require_.resolve("gifenc/dist/gifenc.esm.js"),
  // HTML の頁に埋める再生の部品。書き出す入口 (`/capture.js`) の隣に置き、入口が自分の場所から読む (#3667)
  "/player.global.js": join(ROOT, "dist/player.global.js"),
};
/** 頁が file を読んだ回数。path ごとに数える */
const served = new Map<string, number>();

/** 頁が読む字の CSS。同梱の 2 つの字の package の全ての `@font-face` */
const FONT_LINKS = '<link rel="stylesheet" href="/fonts/noto-sans-jp/index.css"><link rel="stylesheet" href="/fonts/jetbrains-mono/index.css">';

interface PageParts {
  /** `<head>` に足す物 (字の CSS など) */
  head: string;
  /** `<body>` の中身 (描いた図) */
  body: string;
  /** 頁が読む別の file */
  extra?: Record<string, Buffer>;
}

/** 書き出す入口を読んだ頁で `run` を回した結果。入口の build した file が無い時は頁を開かず、頁が入口を読めない時は `run` を回さない */
interface Captured<T> {
  /** 書き出す入口の build した file (`dist/capture.js`) が在る */
  built: boolean;
  /** 頁が書き出す入口を読めなかった理由 */
  captureError?: string;
  /** `run` の結果 */
  result?: T;
}

/** file で 1 つの Chromium に文脈を作って `run` を回し、回し終えたら文脈を閉じる (#3424)。Chromium は閉じない */
async function inContext<T>(what: string, run: (context: BrowserContext) => Promise<T>): Promise<T> {
  const context = await within((await fileChromium()).newContext({ viewport: { width: 800, height: 600 } }), ACTION_LIMIT_MS, "頁の文脈を作る");
  // 上限を書かない開く、待つ操作も、Playwright の既定の 30 秒ではなく 1 つの操作の上限で切る
  context.setDefaultTimeout(ACTION_LIMIT_MS);
  try {
    return await within(run(context), PAGE_LIMIT_MS, what);
  } finally {
    // 記した値は手元に在るので、閉じるのが上限で終わらなくても落とさない。閉じ損ねた頁は file の process の終わりに Playwright が Chromium ごと止める
    await within(context.close(), ACTION_LIMIT_MS, "頁の文脈を閉じる").catch(() => undefined);
  }
}

/**
 * 書き出す入口を読んだ頁を開いて `run` を回す。入口を読めない時は `run` を回さず、件が `captured` で判定に出す。
 * 頁は file で 1 つの Chromium の文脈ごとに開いて閉じる (#3424)
 */
async function withCapturePage<T>({ head, body, extra = {} }: PageParts, run: (page: Page) => Promise<T>): Promise<Captured<T>> {
  const built = existsSync(CAPTURE);
  if (!built) return { built };
  const html =
    '<!doctype html><html><head><meta charset="utf-8">' +
    '<script type="importmap">{"imports":{"gifenc":"/gifenc.js","mediabunny":"/mediabunny.js"}}</script>' +
    `${head}<style>html,body{margin:0}svg{display:block}</style></head><body>${body}` +
    '<script type="module">import("/mediabunny.js").then((m) => { window.mb = m; });' +
    'import("/capture.js").then((m) => { window.capture = m; }, (e) => { window.captureError = String(e); });</script></body></html>';
  return inContext("書き出す入口を読んだ頁の仕事", async (context): Promise<Captured<T>> => {
    const page = await context.newPage();
    await page.route("http://localhost/**", async (route) => {
      const path = new URL(route.request().url()).pathname;
      served.set(path, (served.get(path) ?? 0) + 1);
      if (path === "/") return route.fulfill({ contentType: "text/html; charset=utf-8", body: html });
      if (path === "/capture.js") return route.fulfill({ contentType: "text/javascript", body: readFileSync(CAPTURE) });
      const file = FILES[path];
      if (file) return route.fulfill({ contentType: "text/javascript", body: readFileSync(file) });
      const font = path.startsWith("/fonts/") ? join(FONTS, path.slice("/fonts/".length)) : undefined;
      if (font && existsSync(font)) return route.fulfill({ contentType: font.endsWith(".css") ? "text/css" : "font/woff2", body: readFileSync(font) });
      const more = extra[path];
      return more ? route.fulfill({ body: more }) : route.fulfill({ status: 404 });
    });
    await page.goto("http://localhost/");
    await page.waitForFunction(() => "capture" in window || "captureError" in window, undefined, { timeout: ACTION_LIMIT_MS });
    const captureError = await page.evaluate(() => (window as unknown as { captureError?: string }).captureError);
    if (captureError !== undefined) return { built, captureError };
    await page.evaluate(() => document.fonts.ready);
    return { built, result: await run(page) };
  });
}

/** 頁で回した結果を返す。入口の build した file が無い時と、頁が入口を読めない時は判定で落とす */
function captured<T>(shot: Captured<T>): T {
  expect(shot.built, "書き出す入口の build した file (dist/capture.js) が無い").toBe(true);
  expect(shot.captureError, "頁が書き出す入口を読めない").toBeUndefined();
  return shot.result as T;
}

/** 区画の中の 2 つの箱を 1 段で結ぶ構成図。止めて見せる図で、日本語と英数字を描く */
function oneStep(): Json {
  return {
    version: 1,
    kind: "architecture",
    title: "1 段の構成図",
    regions: [{ id: "r", name: "区画" }],
    boxes: [
      { id: "a", name: "入口 A", region: "r" },
      { id: "b", name: "中", region: "r" },
    ],
    steps: [{ title: "流す", body: "入口から中へ流す。", events: [{ type: "edge", from: "a", to: "b", carry: { kind: "envelope" } }] }],
  };
}

/** コマの数を数えるだけなので、`export.test.ts` と同じく 1 秒 1 コマの mp4 と 2 秒に 1 コマの GIF で撮る (#3410) */
const RATES = { fps: 1, gifFps: 0.5 } as const;

/** mp4 のコマの大きさとコマの数。頁の中で `mediabunny` で読み戻す */
interface Mp4Info {
  width: number;
  height: number;
  frames: number;
}

/** 頁で `mediabunny` を読み、渡した path の mp4 のコマの大きさと数を返す */
async function mp4Info(page: Page, paths: string[]): Promise<Mp4Info[]> {
  await page.waitForFunction(() => "mb" in window, undefined, { timeout: ACTION_LIMIT_MS });
  return page.evaluate(async (paths) => {
    const mb = (window as unknown as { mb: any }).mb;
    const out: { width: number; height: number; frames: number }[] = [];
    for (const path of paths) {
      const data = await (await fetch(path)).arrayBuffer();
      const input = new mb.Input({ source: new mb.BufferSource(data), formats: mb.ALL_FORMATS });
      const track = await input.getPrimaryVideoTrack();
      const stats = await track.computePacketStats();
      out.push({ width: track.codedWidth, height: track.codedHeight, frames: stats.packetCount });
    }
    return out;
  }, paths);
}

/** 頁の Blob を Node の Buffer にする。頁の中で base64 にして渡す */
const blobBytes = (base64: string): Buffer => Buffer.from(base64, "base64");

// 頁ごとの仕事は流れごとに分け、落ちた仕事はそれを読む件だけを落とす。
// 頁が読んだ file の回数 (`served`) を件が確かめるので、頁は 1 つずつ順に開く
const FILM = await atLoad("構成図を exportDiagram と書き出す入口の両方で GIF と mp4 に書き出す", async () => {
  const diagram = oneStep();
  const exportDiagram = await exporter();
  const exported = await exportDiagram(diagram, { outDir: mkdtempSync(join(tmpdir(), "dragon-capture-")), formats: ["mp4", "gif"], ...RATES });
  const nodeGif = readGif(readFileSync(exported.files.gif as string));
  const svg = renderDiagram(diagram).svg;
  const shot = await withCapturePage({ head: FONT_LINKS, body: svg, extra: { "/node.mp4": readFileSync(exported.files.mp4 as string) } }, async (page) => {
    const film = await page.evaluate(async (rates) => {
      const capture = (window as unknown as { capture: Record<string, (...args: unknown[]) => Promise<unknown>> }).capture;
      const svg = document.querySelector("svg");
      const made = (await capture.captureFilm?.(svg, { formats: ["mp4", "gif"], ...rates })) as { frames: number; width: number; height: number; mp4?: Blob; gif?: Blob } | undefined;
      const base64 = async (blob: Blob | undefined): Promise<string> => {
        if (!blob) return "";
        const bytes = new Uint8Array(await blob.arrayBuffer());
        let text = "";
        for (let i = 0; i < bytes.length; i += 0x8000) text += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
        return btoa(text);
      };
      if (made?.mp4) (window as unknown as { browserMp4: string }).browserMp4 = URL.createObjectURL(made.mp4);
      return made ? { frames: made.frames, width: made.width, height: made.height, gif: await base64(made.gif), mp4Type: made.mp4?.type ?? "", gifType: made.gif?.type ?? "" } : undefined;
    }, RATES);
    const browserMp4 = await page.evaluate(() => (window as unknown as { browserMp4?: string }).browserMp4 ?? "");
    const infos = await mp4Info(page, browserMp4 ? ["/node.mp4", browserMp4] : ["/node.mp4"]);
    return { film, infos };
  });
  return { exported, nodeGif, shot };
});

describe("ブラウザで書き出す GIF と mp4 (#3644)", () => {
  it("capture-film-matches-export", () => {
    const { exported, nodeGif, shot: opened } = FILM.get();
    const shot = captured(opened);
    expect(shot.film, "書き出す入口が captureFilm を出していないか、何も返さない").toBeDefined();
    if (!shot.film) return;
    const [nodeMp4, browserMp4] = shot.infos;
    // 陰性でない対照。比べる元の書き出しがコマと大きさを持つ
    expect(nodeGif.frames.length, "exportDiagram の GIF のコマの数").toBeGreaterThan(1);
    expect(nodeMp4?.frames, "exportDiagram の mp4 のコマの数").toBeGreaterThan(1);
    expect({ mp4: shot.film.mp4Type, gif: shot.film.gifType }, "返した Blob の形").toEqual({ mp4: "video/mp4", gif: "image/gif" });
    const browserGif = readGif(blobBytes(shot.film.gif));
    expect(
      {
        frames: shot.film.frames,
        size: { width: shot.film.width, height: shot.film.height },
        gif: { frames: browserGif.frames.length, width: browserGif.width, height: browserGif.height },
        mp4: browserMp4,
      },
      "ブラウザで書き出した GIF と mp4 のコマの数と縦横",
    ).toEqual({
      frames: exported.frames,
      size: { width: exported.width, height: exported.height },
      gif: { frames: nodeGif.frames.length, width: nodeGif.width, height: nodeGif.height },
      mp4: nodeMp4,
    });
  });
});

/** dragon の図でない SVG。四角と、同梱の等幅の字で描く字を持つ */
const plainSvg = (text: string, family = "JetBrains Mono Variable"): string =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="60" viewBox="0 0 120 60"><rect width="120" height="60" fill="#3366cc"/><text x="8" y="40" font-family="${family}" font-size="24" fill="#ffffff">${text}</text></svg>`;

/** 書き出した SVG に埋めた字の file。`@font-face` ごとに、字の名前と、埋めた中身の指紋と、範囲を返す */
function embeddedFaces(svg: string): { family: string; sha: string; range: string }[] {
  return [...svg.matchAll(/@font-face\s*\{([^}]*)\}/g)].map(([, rule = ""]) => {
    const data = /url\(\s*["']?data:font\/woff2;base64,([A-Za-z0-9+/=]+)/.exec(rule)?.[1] ?? "";
    return {
      family: /font-family:\s*["']?([^;"']+)/.exec(rule)?.[1]?.trim() ?? "",
      sha: createHash("sha256").update(Buffer.from(data, "base64")).digest("hex"),
      range: (/unicode-range:\s*([^;}]*)/.exec(rule)?.[1] ?? "").trim(),
    };
  });
}

/** 字の package の字の file の名前を、中身の指紋から引く表 */
function fontFilesBySha(pkg: string): Map<string, string> {
  const dir = join(FONTS, pkg, "files");
  return new Map(readdirSync(dir).filter((file) => file.endsWith(".woff2")).map((file) => [createHash("sha256").update(readFileSync(join(dir, file))).digest("hex"), file]));
}

/** 頁に描いた最初の SVG を書き出す入口の関数に渡し、PNG の中身と SVG の文字列と、断られた時の文を返す */
async function still(page: Page): Promise<{ png?: string; pngType?: string; svg?: string; pngError?: string; svgError?: string }> {
  return page.evaluate(async () => {
    const capture = (window as unknown as { capture: Record<string, ((...args: unknown[]) => Promise<unknown>) | undefined> }).capture;
    const svg = document.querySelector("svg");
    const out: { png?: string; pngType?: string; svg?: string; pngError?: string; svgError?: string } = {};
    try {
      const blob = (await capture.capturePng?.(svg)) as Blob | undefined;
      if (blob) {
        const bytes = new Uint8Array(await blob.arrayBuffer());
        let text = "";
        for (let i = 0; i < bytes.length; i += 0x8000) text += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
        out.png = btoa(text);
        out.pngType = blob.type;
      }
    } catch (error) {
      out.pngError = error instanceof Error ? error.message : String(error);
    }
    try {
      const text = (await capture.captureSvg?.(svg)) as string | undefined;
      if (text !== undefined) out.svg = text;
    } catch (error) {
      out.svgError = error instanceof Error ? error.message : String(error);
    }
    return out;
  });
}

const STILL_ANY = await atLoad("dragon の図でない SVG を PNG と SVG に書き出す", () => withCapturePage({ head: FONT_LINKS, body: plainSvg("Hi") }, still));

// 英字とキリル文字を描く。等幅の字の package は字の範囲ごとに 6 つの file を持ち、描いた字が入るのは latin と cyrillic の 2 つ
const STILL_FONTS = await atLoad("英字とキリル文字を描いた SVG を書き出す", () => withCapturePage({ head: FONT_LINKS, body: plainSvg("Hi Ж") }, still));

// 描く字 (英大文字) の範囲の file は在らず、描かない字 (キリル文字) の範囲の file も在らない。名指すのは描く字の範囲だけ
const STILL_GONE = await atLoad("読めない字の file を名指す SVG を書き出す", () => {
  const head =
    '<style>@font-face{font-family:"Gone Sans";src:url(/missing/gone-latin.woff2) format("woff2");unicode-range:U+41-5A}' +
    '@font-face{font-family:"Gone Sans";src:url(/missing/gone-cyrillic.woff2) format("woff2");unicode-range:U+400-4FF}</style>';
  return withCapturePage({ head, body: plainSvg("AB", "Gone Sans") }, still);
});

describe("ブラウザで書き出す PNG と SVG (#3644)", () => {
  it("capture-still-any-svg", () => {
    const shot = captured(STILL_ANY.get());
    expect(shot.pngError ?? shot.svgError, "dragon の図でない SVG を断った").toBeUndefined();
    expect(shot.png, "書き出す入口が capturePng を出していないか、Blob を返さない").toBeDefined();
    expect(shot.pngType, "PNG の Blob の形").toBe("image/png");
    const png = PNG.sync.read(blobBytes(shot.png ?? ""));
    expect({ width: png.width, height: png.height }, "PNG の縦横 (SVG の 2 倍)").toEqual({ width: 240, height: 120 });
    // 左上の隅は四角の色、字の所は白い画素を持つ (図を描いている)
    expect([...png.data.subarray(0, 4)], "PNG の左上の画素").toEqual([0x33, 0x66, 0xcc, 255]);
    let white = 0;
    for (let i = 0; i < png.data.length; i += 4) if ((png.data[i] ?? 0) > 240 && (png.data[i + 1] ?? 0) > 240 && (png.data[i + 2] ?? 0) > 240) white++;
    expect(white, "PNG の字の白い画素の数").toBeGreaterThan(20);
    expect(shot.svg, "書き出す入口が captureSvg を出していないか、文字列を返さない").toBeDefined();
    const svg = shot.svg ?? "";
    expect(svg.startsWith("<svg"), "書き出した SVG の頭").toBe(true);
    expect(svg.includes(">Hi</text>"), "書き出した SVG が描いた字を持つ").toBe(true);
    expect(embeddedFaces(svg).map((face) => face.family), "書き出した SVG に埋めた字").toEqual(["JetBrains Mono Variable"]);
  });

  it("capture-embeds-used-fonts-only", () => {
    const shot = captured(STILL_FONTS.get());
    expect(shot.svgError, "字を埋めた SVG を断った").toBeUndefined();
    const files = fontFilesBySha("jetbrains-mono");
    expect(files.size, "等幅の字の package の字の file の数").toBeGreaterThan(4);
    const faces = embeddedFaces(shot.svg ?? "");
    expect(
      faces.map((face) => files.get(face.sha) ?? `同梱の file に無い中身 (${face.family} ${face.range})`).sort(),
      "書き出した SVG に丸ごと埋めた字の file",
    ).toEqual(["jetbrains-mono-cyrillic-wght-normal.woff2", "jetbrains-mono-latin-wght-normal.woff2"]);
  });

  it("capture-refuses-unreadable-font", () => {
    const shot = captured(STILL_GONE.get());
    expect(shot.png, "字の file を読めないのに PNG を返した").toBeUndefined();
    expect(shot.svg, "字の file を読めないのに SVG を返した").toBeUndefined();
    for (const [what, message] of [
      ["PNG", shot.pngError],
      ["SVG", shot.svgError],
    ] as const) {
      expect(message, `${what} を断った文`).toBeDefined();
      expect(message, `${what} を断った文が字の名前を名指さない`).toContain("Gone Sans");
      expect(message, `${what} を断った文が描く字の範囲を名指さない`).toMatch(/U\+0*41-0*5A/i);
      expect(message, `${what} を断った文が描かない字の範囲を名指した`).not.toMatch(/U\+0*400-0*4FF/i);
    }
  });
});

/** 日本語と英字を描く 1 段の列の図の記法。HTML の頁の字は、図の字と再生の帯の字の両方を埋める */
const HTML_NOTATION = ["sequence 送る流れ", "box 利用者", "box ノード", "step 送る", "  say 利用者がノードへ送る。", "  利用者 -> ノード: 取引"].join("\n");

/** 頁で `captureHtml` を呼ぶ。返した文字列か、断った文を返す。入口が関数を出していない時はどちらも返さない */
async function htmlOf(page: Page, source = HTML_NOTATION): Promise<{ html?: string; error?: string }> {
  return page.evaluate(async (source) => {
    const capture = (window as unknown as { capture: Record<string, ((...args: unknown[]) => Promise<unknown>) | undefined> }).capture;
    try {
      const html = await capture.captureHtml?.(source, { lang: "ja" });
      return typeof html === "string" ? { html } : {};
    } catch (error) {
      return { error: String(error) };
    }
  }, source);
}

/** 2 つの文字列の最初に食い違う所。同じ時は undefined。頁は 1MB を超えるので、食い違った所の前後だけを出す */
function firstDiff(a: string, b: string): string | undefined {
  if (a === b) return undefined;
  let i = 0;
  while (i < a.length && i < b.length && a[i] === b[i]) i++;
  return `${i} 字目 (長さ ${a.length} と ${b.length}): ${JSON.stringify(a.slice(Math.max(0, i - 40), i + 40))} と ${JSON.stringify(b.slice(Math.max(0, i - 40), i + 40))}`;
}

/** 字の `@font-face` を外した頁。ブラウザは字を削れないので、字の file を丸ごと埋める (#3644)。そこだけを比べから外す */
const withoutFaces = (html: string): string => html.replace(/@font-face\s*\{[^}]*\}/g, "");

/** 記法を `dragon export` と書き出す入口の両方で HTML にした結果。記法を読めない時は書き出さない */
interface HtmlPair {
  /** 検査の記法を読めた */
  ok: boolean;
  /** `dragon export` が書き出した HTML */
  node?: string;
  /** 書き出す入口が書き出した HTML */
  made?: Captured<{ html?: string; error?: string }>;
}

const HTML_PAIR = await atLoad("記法を exportDiagram と書き出す入口の両方で HTML に書き出す", async (): Promise<HtmlPair> => {
  const parsed = parseNotation(HTML_NOTATION, { lang: "ja" });
  if (!parsed.ok) return { ok: false };
  const exportDiagram = await exporter();
  const exported = await exportDiagram(parsed.diagram, { outDir: mkdtempSync(join(tmpdir(), "dragon-capture-html-")), formats: ["html"], lang: "ja" });
  const node = readFileSync(exported.files.html as string, "utf8");
  const made = await withCapturePage({ head: FONT_LINKS, body: "" }, (page) => htmlOf(page));
  return { ok: true, node, made };
});

/** 書き出した HTML を頁の外への通信を止めて開き、描いた物と、取りに行った URL を読む */
function openOffline(html: string): Promise<{ drawn: { player: boolean; texts: string }; asked: string[] }> {
  return inContext("書き出した HTML を開いた頁の仕事", async (context) => {
    const page = await context.newPage();
    const asked: string[] = [];
    await page.route("**/*", (route) => {
      asked.push(route.request().url());
      return route.abort();
    });
    await page.setContent(html, { waitUntil: "load" });
    await page.waitForSelector("#dragon svg", { timeout: 10_000 });
    const drawn = await page.evaluate(() => ({
      player: document.querySelector("#dragon .dg-player") !== null,
      texts: [...document.querySelectorAll("#dragon svg text")].map((text) => text.textContent ?? "").join(" "),
    }));
    // 読んだ時の URL を残す。後から届く通信は元の件も数えなかった
    return { drawn, asked: [...asked] };
  });
}

const OFFLINE = await atLoad("書き出す入口で HTML に書き出し、頁の外へ読みに行かせずに開く", async () => {
  const made = await withCapturePage({ head: FONT_LINKS, body: "" }, (page) => htmlOf(page));
  const html = made.result?.html;
  // 書き出せなかった時は件が先に判定で落ちるので開かない
  const opened = await atLoad("書き出した HTML を頁の外へ読みに行かせずに開く", () => {
    if (typeof html !== "string") throw new Error("書き出す入口が HTML を返さないので開かない");
    return openOffline(html);
  });
  return { made, opened };
});

// 図の仮名と漢字の範囲の字の file が在らない。断る文は字の名前と描く字の範囲を名指す
const HTML_GONE = await atLoad("読めない字の file を名指す頁で HTML に書き出す", () => {
  const head = '<style>@font-face{font-family:"Noto Sans JP Variable";src:url(/missing/jp.woff2) format("woff2");unicode-range:U+3000-30FF,U+4E00-9FFF}</style>';
  return withCapturePage({ head, body: "" }, (page) => htmlOf(page));
});

const PLAYER_READS = await atLoad("書き出す入口で HTML に 2 度書き出し、再生の部品を読んだ回数を数える", () => {
  served.clear();
  return withCapturePage({ head: FONT_LINKS, body: "" }, async (page) => {
    const before = served.get("/player.global.js") ?? 0;
    await htmlOf(page);
    const once = served.get("/player.global.js") ?? 0;
    await htmlOf(page);
    return { before, once, twice: served.get("/player.global.js") ?? 0 };
  });
});

describe("ブラウザで書き出す HTML (#3667)", () => {
  it("capture-html-matches-export", () => {
    const pair = HTML_PAIR.get();
    expect(pair.ok, "検査の記法を読めない").toBe(true);
    if (!pair.ok || !pair.made) return;
    const node = pair.node ?? "";
    const made = captured(pair.made);
    expect(made.error, "captureHtml が断った").toBeUndefined();
    expect(typeof made.html, "書き出す入口が captureHtml を出していないか、文字列を返さない").toBe("string");
    expect(firstDiff(withoutFaces(made.html ?? ""), withoutFaces(node)), "dragon export の HTML と字の @font-face のほかが食い違う").toBeUndefined();
    expect(
      embeddedFaces(made.html ?? "").map((face) => face.family),
      "HTML に埋めた字に、図の日本語の字と再生の帯の等幅の字が在る",
    ).toEqual(expect.arrayContaining(["Noto Sans JP Variable", "JetBrains Mono Variable"]));
  });

  it("capture-html-opens-offline", () => {
    const { made: shot, opened } = OFFLINE.get();
    const made = captured(shot);
    expect(typeof made.html, "書き出す入口が captureHtml を出していないか、文字列を返さない").toBe("string");
    const { drawn, asked } = opened.get();
    expect(drawn.player, "開いた HTML に再生の帯が無い").toBe(true);
    expect(drawn.texts, "開いた HTML の図に箱の名前が無い").toContain("利用者");
    expect(asked, "開いた HTML が頁の外へ読みに行った").toEqual([]);
  });

  it("capture-html-refuses-unreadable-font", () => {
    const made = captured(HTML_GONE.get());
    expect(made.html, "字の file を読めないのに HTML を返した").toBeUndefined();
    expect(made.error, "書き出す入口が captureHtml を出していないか、断らない").toBeDefined();
    expect(made.error, "断った文が字の名前を名指さない").toContain("Noto Sans JP Variable");
    expect(made.error, "断った文が描く字の範囲を名指さない").toMatch(/U\+0*3000-0*30FF/i);
  });

  it("capture-html-loads-player-on-call", () => {
    const reads = captured(PLAYER_READS.get());
    expect(reads, "再生の部品を読んだ回数 (入口を読んだ時、1 度呼んだ後、2 度呼んだ後)").toEqual({ before: 0, once: 1, twice: 1 });
  });
});

/** 判定の表 (#3937) の見本。規則 5 つと例 6 つを持ち、通す例と止める例の両方を持つ */
const JUDGE_FILE = "transfer-check.en.dragon";

/** 頁で回した 1 つの書き出しの結果か、断った理由 */
type Tried<T> = { value?: T; error?: string };

/** 判定の表を書き出す入口に渡して返った物。GIF は最初のコマと最後の段の止め絵の時刻のコマを読み戻す */
interface JudgeShot {
  png: Tried<string>;
  svg: Tried<string>;
  film: Tried<{ gif: string; mp4Type: string }>;
  frames?: { width: number; height: number; rgba: string }[];
  /** 書き出した後も、頁の表が再生の部品の書いた段の印を持つ */
  live: boolean;
}

const JUDGE = await atLoad("判定の表を書き出す入口で PNG と SVG と GIF と mp4 に書き出す", async () => {
  const parsed = parseNotation(readFileSync(join(ROOT, "examples", JUDGE_FILE), "utf8"));
  if (!parsed.ok) throw new Error(`${JUDGE_FILE} を読めない`);
  const rendered = renderDiagram(parsed.diagram);
  const spec = (parsed.diagram as { judge: { rules: unknown[]; cases: { fails?: unknown[] }[] } }).judge;
  const facts = {
    rules: spec.rules.length,
    verdicts: spec.cases.map((one) => ((one.fails?.length ?? 0) > 0 ? "block" : "pass")),
    colors: colorsOf(rendered.svg),
  };
  const { total, stills, steps } = rendered.timeline;
  const timeline = { total, stills, steps: steps.map((step) => ({ start: step.start, end: step.end })) };
  // GIF の k 番目のコマは k / gifFps 秒の絵。最後の段 (判定の列) の止め絵の時刻に最も近いコマを読む
  const lastIndex = Math.round((stills.at(-1) ?? 0) * RATES.gifFps);
  const shot = await withCapturePage({ head: FONT_LINKS, body: rendered.svg }, (page) =>
    page.evaluate(
      async ({ timeline, rates, lastIndex }): Promise<JudgeShot> => {
        const capture = (window as unknown as { capture: Record<string, ((...args: unknown[]) => Promise<unknown>) | undefined> }).capture;
        const figure = document.querySelector<HTMLElement>('[data-dragon="judge"]') as HTMLElement;
        // 再生の部品が 2 番目の段を見せている形にする。印は再生の部品が段を送る時に書く物と同じ (`render/judge.ts` の `showJudge`)
        figure.dataset.play = "";
        for (const cell of figure.querySelectorAll<HTMLElement>("[data-col]")) {
          const col = Number(cell.dataset.col);
          cell.toggleAttribute("data-on", col <= 1);
          cell.toggleAttribute("data-now", col === 1);
        }
        const base64 = async (blob: unknown): Promise<string> => {
          if (!(blob instanceof Blob)) return "";
          const bytes = new Uint8Array(await blob.arrayBuffer());
          let text = "";
          for (let i = 0; i < bytes.length; i += 0x8000) text += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
          return btoa(text);
        };
        const tried = async <T>(run: () => Promise<T>): Promise<Tried<T>> => {
          try {
            return { value: await run() };
          } catch (error) {
            return { error: error instanceof Error ? error.message : String(error) };
          }
        };
        const png = await tried(async () => base64(await capture.capturePng?.(figure)));
        const svg = await tried(async () => String(await capture.captureSvg?.(figure)));
        let gifBlob: Blob | undefined;
        const film = await tried(async () => {
          const made = (await capture.captureFilm?.(figure, { formats: ["mp4", "gif"], ...rates, timeline })) as { gif?: Blob; mp4?: Blob } | undefined;
          gifBlob = made?.gif;
          return { gif: await base64(made?.gif), mp4Type: made?.mp4?.type ?? "" };
        });
        let frames: { width: number; height: number; rgba: string }[] | undefined;
        if (gifBlob) {
          const decoder = new ImageDecoder({ data: await gifBlob.arrayBuffer(), type: "image/gif" });
          await decoder.tracks.ready;
          frames = [];
          for (const frameIndex of [0, lastIndex]) {
            const { image } = await decoder.decode({ frameIndex });
            const canvas = new OffscreenCanvas(image.displayWidth, image.displayHeight);
            const context = canvas.getContext("2d") as OffscreenCanvasRenderingContext2D;
            context.drawImage(image, 0, 0);
            image.close();
            const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
            let text = "";
            for (let i = 0; i < pixels.length; i += 0x8000) text += String.fromCharCode(...pixels.subarray(i, i + 0x8000));
            frames.push({ width: canvas.width, height: canvas.height, rgba: btoa(text) });
          }
        }
        return { png, svg, film, ...(frames ? { frames } : {}), live: figure.hasAttribute("data-play") };
      },
      { timeline, rates: RATES, lastIndex },
    ),
  );
  return { facts, shot, lastIndex };
});

/** 書き出す入口が返した PNG の絵。断った時は理由を挙げて落とす */
function judgePng(shot: JudgeShot): Picture {
  expect(shot.png.error, "判定の表の PNG を断った").toBeUndefined();
  const png = PNG.sync.read(blobBytes(shot.png.value ?? ""));
  return { width: png.width, height: png.height, data: png.data };
}

describe("ブラウザで書き出す判定の表 (#3937)", () => {
  it("capture-judge-png-shows-every-column", () => {
    const { facts, shot: opened } = JUDGE.get();
    const shot = captured(opened);
    const picture = judgePng(shot);
    const { pass, block, badge, now } = marks(facts);
    // 見出しの番号の丸は規則の列ごとに 1 つ。全ての規則の列が写れば、丸の塊の数が規則の数になる
    expect(clusters(spots(picture, badge).map((p) => p.x), 4 * SCALE).length, "見出しの番号の丸の数").toBe(facts.rules);
    expect(spots(picture, pass).length > 0, "通す札が写る").toBe(true);
    expect(spots(picture, block).length > 0, "止める札が写る").toBe(true);
    const box = verdictBox(picture, facts);
    expect(box.rows, "判定の札の行の数").toBe(facts.verdicts.length);
    // 判定の列は右端の列。札の右に表の枠の内側の余白 (8px 以上) が残れば、判定の列は切れていない
    expect(picture.width - 1 - box.right, "判定の札の右の余白 (画素)").toBeGreaterThanOrEqual(8 * SCALE);
    // 再生の部品が 2 番目の段を照らしていても、照らした列の色の帯を写さない
    expect(spots(picture, now).length, "照らした列の見出しの色の画素").toBe(0);
    expect(shot.live, "書き出した後に、頁の表から再生の部品の書いた段の印が消えた").toBe(true);
  });

  it("capture-judge-svg-wraps-table", () => {
    const shot = captured(JUDGE.get().shot);
    expect(shot.svg.error, "判定の表の SVG を断った").toBeUndefined();
    const svg = shot.svg.value ?? "";
    expect(svg.startsWith("<svg"), "書き出した SVG の頭").toBe(true);
    expect(svg.includes("<foreignObject"), "表を foreignObject に包んでいない").toBe(true);
    expect(svg.includes('data-dragon="judge"'), "包んだ中に判定の表が無い").toBe(true);
    expect(embeddedFaces(svg).map((face) => face.family), "書き出した SVG に埋めた字").toContain("Noto Sans JP Variable");
    expect(svg.match(/\sdata-(?:play|on|now)(?:=|\s|>)/g) ?? [], "書き出した SVG に残る段の印").toEqual([]);
    const picture = judgePng(shot);
    const size = /^<svg\b[^>]*?\swidth="(\d+)"[^>]*?\sheight="(\d+)"/.exec(svg);
    expect([Number(size?.[1]) * SCALE, Number(size?.[2]) * SCALE], "SVG の縦横の 2 倍").toEqual([picture.width, picture.height]);
  });

  it("capture-judge-film-lights-columns-by-step", () => {
    const { facts, shot: opened, lastIndex } = JUDGE.get();
    const shot = captured(opened);
    expect(shot.film.error, "判定の表の GIF と mp4 を断った").toBeUndefined();
    expect(shot.film.value?.mp4Type, "mp4 の Blob の形").toBe("video/mp4");
    expect(shot.frames, "GIF のコマを読み戻せない").toBeDefined();
    const [first, last] = (shot.frames ?? []).map((frame) => ({ width: frame.width, height: frame.height, data: blobBytes(frame.rgba) }));
    const picture = judgePng(shot);
    // GIF は CSS の 1px を 1 画素で撮り、PNG は 2 画素で撮る
    expect([(first?.width ?? 0) * SCALE, (first?.height ?? 0) * SCALE], "GIF のコマの大きさの 2 倍").toEqual([picture.width, picture.height]);
    // 判定の札の囲みは、照らさない PNG の札の画素で決める。GIF は色を減らすので、コマでは色の濃い画素 (判定の語の色) を数える
    const box = toGifBox(verdictBox(picture, facts));
    expect(vivid(first as Picture, box), "最初のコマの判定の札の所の色の濃い画素").toBe(0);
    expect(vivid(last as Picture, box), `${lastIndex} 番目のコマ (最後の段) の判定の札の所の色の濃い画素`).toBeGreaterThan(0);
  });
});
