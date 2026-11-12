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
 */
import { createHash } from "node:crypto";
import { existsSync, mkdtempSync, readdirSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { PNG } from "pngjs";
import type { Page } from "playwright-core";
import { parseNotation, renderDiagram } from "@cardenelabs/dragon";
import { describe, expect, it } from "vitest";
import type { Json } from "./diagram-support";
import { exporter, readGif } from "./export-support";
import { fileChromium } from "./page-needs";

const ROOT = join(process.cwd(), "packages/dragon");
const require_ = createRequire(join(ROOT, "package.json"));
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

/**
 * 書き出す入口を読んだ頁を開いて `run` を回す。入口を読めない時は判定に出してから止める。
 * 頁は file で 1 つの Chromium の文脈ごとに開いて閉じる (#3424)
 */
async function withCapturePage<T>({ head, body, extra = {} }: PageParts, run: (page: Page) => Promise<T>): Promise<T> {
  expect(existsSync(CAPTURE), "書き出す入口の build した file (dist/capture.js) が無い").toBe(true);
  const html =
    '<!doctype html><html><head><meta charset="utf-8">' +
    '<script type="importmap">{"imports":{"gifenc":"/gifenc.js","mediabunny":"/mediabunny.js"}}</script>' +
    `${head}<style>html,body{margin:0}svg{display:block}</style></head><body>${body}` +
    '<script type="module">import("/mediabunny.js").then((m) => { window.mb = m; });' +
    'import("/capture.js").then((m) => { window.capture = m; }, (e) => { window.captureError = String(e); });</script></body></html>';
  const context = await (await fileChromium()).newContext({ viewport: { width: 800, height: 600 } });
  try {
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
    await page.waitForFunction(() => "capture" in window || "captureError" in window);
    const failed = await page.evaluate(() => (window as unknown as { captureError?: string }).captureError);
    expect(failed, "頁が書き出す入口を読めない").toBeUndefined();
    await page.evaluate(() => document.fonts.ready);
    return await run(page);
  } finally {
    await context.close();
  }
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
  await page.waitForFunction(() => "mb" in window);
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

describe("ブラウザで書き出す GIF と mp4 (#3644)", () => {
  it("capture-film-matches-export", async () => {
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

describe("ブラウザで書き出す PNG と SVG (#3644)", () => {
  it("capture-still-any-svg", async () => {
    const shot = await withCapturePage({ head: FONT_LINKS, body: plainSvg("Hi") }, still);
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

  it("capture-embeds-used-fonts-only", async () => {
    // 英字とキリル文字を描く。等幅の字の package は字の範囲ごとに 6 つの file を持ち、描いた字が入るのは latin と cyrillic の 2 つ
    const shot = await withCapturePage({ head: FONT_LINKS, body: plainSvg("Hi Ж") }, still);
    expect(shot.svgError, "字を埋めた SVG を断った").toBeUndefined();
    const files = fontFilesBySha("jetbrains-mono");
    expect(files.size, "等幅の字の package の字の file の数").toBeGreaterThan(4);
    const faces = embeddedFaces(shot.svg ?? "");
    expect(
      faces.map((face) => files.get(face.sha) ?? `同梱の file に無い中身 (${face.family} ${face.range})`).sort(),
      "書き出した SVG に丸ごと埋めた字の file",
    ).toEqual(["jetbrains-mono-cyrillic-wght-normal.woff2", "jetbrains-mono-latin-wght-normal.woff2"]);
  });

  it("capture-refuses-unreadable-font", async () => {
    // 描く字 (英大文字) の範囲の file は在らず、描かない字 (キリル文字) の範囲の file も在らない。名指すのは描く字の範囲だけ
    const head =
      '<style>@font-face{font-family:"Gone Sans";src:url(/missing/gone-latin.woff2) format("woff2");unicode-range:U+41-5A}' +
      '@font-face{font-family:"Gone Sans";src:url(/missing/gone-cyrillic.woff2) format("woff2");unicode-range:U+400-4FF}</style>';
    const shot = await withCapturePage({ head, body: plainSvg("AB", "Gone Sans") }, still);
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

describe("ブラウザで書き出す HTML (#3667)", () => {
  it("capture-html-matches-export", async () => {
    const parsed = parseNotation(HTML_NOTATION, { lang: "ja" });
    expect(parsed.ok, "検査の記法を読めない").toBe(true);
    if (!parsed.ok) return;
    const exportDiagram = await exporter();
    const exported = await exportDiagram(parsed.diagram, { outDir: mkdtempSync(join(tmpdir(), "dragon-capture-html-")), formats: ["html"], lang: "ja" });
    const node = readFileSync(exported.files.html as string, "utf8");
    const made = await withCapturePage({ head: FONT_LINKS, body: "" }, (page) => htmlOf(page));
    expect(made.error, "captureHtml が断った").toBeUndefined();
    expect(typeof made.html, "書き出す入口が captureHtml を出していないか、文字列を返さない").toBe("string");
    expect(firstDiff(withoutFaces(made.html ?? ""), withoutFaces(node)), "dragon export の HTML と字の @font-face のほかが食い違う").toBeUndefined();
    expect(
      embeddedFaces(made.html ?? "").map((face) => face.family),
      "HTML に埋めた字に、図の日本語の字と再生の帯の等幅の字が在る",
    ).toEqual(expect.arrayContaining(["Noto Sans JP Variable", "JetBrains Mono Variable"]));
  });

  it("capture-html-opens-offline", async () => {
    const made = await withCapturePage({ head: FONT_LINKS, body: "" }, (page) => htmlOf(page));
    expect(typeof made.html, "書き出す入口が captureHtml を出していないか、文字列を返さない").toBe("string");
    const context = await (await fileChromium()).newContext({ viewport: { width: 800, height: 600 } });
    try {
      const page = await context.newPage();
      const asked: string[] = [];
      await page.route("**/*", (route) => {
        asked.push(route.request().url());
        return route.abort();
      });
      await page.setContent(made.html ?? "", { waitUntil: "load" });
      await page.waitForSelector("#dragon svg", { timeout: 10_000 });
      const drawn = await page.evaluate(() => ({
        player: document.querySelector("#dragon .dg-player") !== null,
        texts: [...document.querySelectorAll("#dragon svg text")].map((text) => text.textContent ?? "").join(" "),
      }));
      expect(drawn.player, "開いた HTML に再生の帯が無い").toBe(true);
      expect(drawn.texts, "開いた HTML の図に箱の名前が無い").toContain("利用者");
      expect(asked, "開いた HTML が頁の外へ読みに行った").toEqual([]);
    } finally {
      await context.close();
    }
  });

  it("capture-html-refuses-unreadable-font", async () => {
    // 図の仮名と漢字の範囲の字の file が在らない。断る文は字の名前と描く字の範囲を名指す
    const head = '<style>@font-face{font-family:"Noto Sans JP Variable";src:url(/missing/jp.woff2) format("woff2");unicode-range:U+3000-30FF,U+4E00-9FFF}</style>';
    const made = await withCapturePage({ head, body: "" }, (page) => htmlOf(page));
    expect(made.html, "字の file を読めないのに HTML を返した").toBeUndefined();
    expect(made.error, "書き出す入口が captureHtml を出していないか、断らない").toBeDefined();
    expect(made.error, "断った文が字の名前を名指さない").toContain("Noto Sans JP Variable");
    expect(made.error, "断った文が描く字の範囲を名指さない").toMatch(/U\+0*3000-0*30FF/i);
  });

  it("capture-html-loads-player-on-call", async () => {
    served.clear();
    const reads = await withCapturePage({ head: FONT_LINKS, body: "" }, async (page) => {
      const before = served.get("/player.global.js") ?? 0;
      await htmlOf(page);
      const once = served.get("/player.global.js") ?? 0;
      await htmlOf(page);
      return { before, once, twice: served.get("/player.global.js") ?? 0 };
    });
    expect(reads, "再生の部品を読んだ回数 (入口を読んだ時、1 度呼んだ後、2 度呼んだ後)").toEqual({ before: 0, once: 1, twice: 1 });
  });
});
