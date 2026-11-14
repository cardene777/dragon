/**
 * 外のツールやサービスが図を置くSDKの入口`@cardenelabs/dragon/embed` (#3698)。
 *
 * 入口が出す関数と型と知らせの名前は`src/embed/names.json`の一覧と突き合わせ、外の人が使う名前を気付かずに変えさせない。
 * 図を置く関数`mountDragon`は、設定`look`で帯と枠の見た目を、設定`buttons`で帯のボタンを置き先に合わせさせ、
 * `header: false`で帯を出さずに図だけを置いた時も、エクスポートとエディタで開くとコピーを関数で呼ばせる。
 * 置いた要素からは、描けた・描けなかった、段が変わった、エクスポートした、エディタで開いた・コピーしたの4つを知らせる。
 *
 * 見た目の計算とクリップボードと書き出しを本物で確かめるため、build した`dist/embed.js`を`http://localhost/`の頁で読む。
 * 入口が読む本体は import map で`dist/index.js`へ、詰める道具 (`gifenc`と`mediabunny`) は node_modules の file へ向ける。
 */
import { existsSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import type { Page } from "playwright-core";
import ts from "typescript";
import { describe, expect, it } from "vitest";
import { fileChromium } from "./page-needs";

const ROOT = join(process.cwd(), "packages/dragon");
const DIST = join(ROOT, "dist");
const ENTRY = join(DIST, "embed.js");
const require_ = createRequire(join(ROOT, "package.json"));
/** 頁に返す詰める道具。書き出す処理が読む */
const LIBS: Record<string, string> = {
  "/mediabunny.js": join(dirname(require_.resolve("mediabunny")), "mediabunny.min.mjs"),
  "/gifenc.js": require_.resolve("gifenc/dist/gifenc.esm.js"),
};
/** 置く図。題は「注文」で、段を2つ持つ */
const SOURCE = "sequence 注文\nbox a as あなた\nbox b as 店\nstep 確認\n  a -> b: 注文\nstep 返事\n  b -> a: 受けた";
/** 描けない記法。宣言していない箱へ線を引く */
const BROKEN = "sequence 注文\nbox a as あなた\nstep 確認\n  a -> zz: 注文";
/** エディタとdragonの印が開く見本帳 */
const GALLERY = "https://cardene777.github.io/dragon/";
/** 4つの知らせ */
const EVENTS = ["dragon-render", "dragon-step", "dragon-export", "dragon-share"] as const;

interface Names {
  functions: string[];
  types: string[];
  events: string[];
}

/** 頁の`window`に置く物 */
interface EmbedWindow {
  dragonEmbed: { mountDragon(host: HTMLElement, source: string, options?: object): EmbedHandle };
  embed: EmbedHandle;
  /** 置いた要素から文書まで届いた知らせ */
  events: { type: string; detail: unknown }[];
  /** `window.open`に渡ったURL */
  opened: string[];
  clicked?: { same: boolean; source: string };
}
interface EmbedHandle {
  source: string;
  editorUrl: string;
  player: { next(): void };
  export(format: string, options?: object): Promise<Blob>;
  openEditor(): unknown;
  copy(kind: string): Promise<void>;
}

/** SDKの入口を読んだ頁を開いて`run`を回す。頁は file で 1 つの Chromium の文脈ごとに開いて閉じる (#3424) */
async function withEmbed<T>(run: (page: Page) => Promise<T>): Promise<T> {
  expect(existsSync(ENTRY), "SDKの入口の build した file (dist/embed.js) が無い").toBe(true);
  const html =
    '<!doctype html><html lang="ja"><head><meta charset="utf-8">' +
    '<script type="importmap">{"imports":{"@cardenelabs/dragon":"/index.js","gifenc":"/gifenc.js","mediabunny":"/mediabunny.js"}}</script>' +
    '<style>html,body{margin:0}</style></head><body><div id="host" style="width:760px"></div><div id="host2" style="width:760px"></div>' +
    `<script>window.events=[];for(const name of ${JSON.stringify(EVENTS)})document.addEventListener(name,(e)=>window.events.push({type:e.type,detail:e.detail}));` +
    "window.opened=[];window.open=(url)=>{window.opened.push(String(url));return null;};</script>" +
    '<script type="module">import("/embed.js").then((m) => { window.dragonEmbed = m; }, (e) => { window.embedError = String(e); });</script></body></html>';
  const context = await (await fileChromium()).newContext({ viewport: { width: 900, height: 900 }, acceptDownloads: true });
  try {
    await context.grantPermissions(["clipboard-read", "clipboard-write"], { origin: "http://localhost" });
    // エディタとdragonの印が開く見本帳は外へ取りに行かず、頁を返す
    await context.route(`${GALLERY}**`, (route) => route.fulfill({ contentType: "text/html; charset=utf-8", body: "<!doctype html><title>gallery</title>" }));
    const page = await context.newPage();
    await page.route("http://localhost/**", (route) => {
      const path = new URL(route.request().url()).pathname;
      if (path === "/") return route.fulfill({ contentType: "text/html; charset=utf-8", body: html });
      const lib = LIBS[path];
      if (lib) return route.fulfill({ contentType: "text/javascript", body: readFileSync(lib) });
      const file = resolve(DIST, `.${path}`);
      if (path.endsWith(".js") && file.startsWith(`${DIST}/`) && existsSync(file)) {
        return route.fulfill({ contentType: "text/javascript", body: readFileSync(file) });
      }
      return route.fulfill({ status: 404 });
    });
    await page.goto("http://localhost/");
    await page.waitForFunction(() => "dragonEmbed" in window || "embedError" in window);
    expect(await page.evaluate(() => (window as unknown as { embedError?: string }).embedError), "頁がSDKの入口を読めない").toBeUndefined();
    return await run(page);
  } finally {
    await context.close();
  }
}

/** `#host`に図を置き、返った物を`window.embed`に置く */
async function mount(page: Page, options: Record<string, unknown> = {}): Promise<void> {
  await page.evaluate(
    ([source, opts]) => {
      const w = window as unknown as EmbedWindow;
      w.embed = w.dragonEmbed.mountDragon(document.getElementById("host")!, source, opts);
    },
    [SOURCE, options] as const,
  );
}

/** 頁のクリップボードの字 */
const clipboardText = (page: Page): Promise<string> => page.evaluate(() => navigator.clipboard.readText());

/** 名前の並びの食い違い。`extra`は入口が出すのに一覧に無い名前、`missing`は一覧に在るのに入口が出さない名前 */
function diffNames(actual: readonly string[], listed: readonly string[]): { extra: string[]; missing: string[] } {
  return { extra: actual.filter((name) => !listed.includes(name)).sort(), missing: listed.filter((name) => !actual.includes(name)).sort() };
}

/** 型のfileが出す型の名前と、知らせの表 (`DragonEmbedEventMap`) の名前 */
function declaredNames(file: string): { types: string[]; events: string[] } {
  const program = ts.createProgram([file], { noEmit: true, skipLibCheck: true, module: ts.ModuleKind.ESNext, moduleResolution: ts.ModuleResolutionKind.Bundler, types: [] });
  const checker = program.getTypeChecker();
  const source = program.getSourceFile(file);
  const module = source ? checker.getSymbolAtLocation(source) : undefined;
  if (!module) return { types: [], events: [] };
  const resolveSymbol = (symbol: ts.Symbol): ts.Symbol => (symbol.flags & ts.SymbolFlags.Alias ? checker.getAliasedSymbol(symbol) : symbol);
  const exported = checker.getExportsOfModule(module);
  const types = exported
    .filter((symbol) => {
      const flags = resolveSymbol(symbol).flags;
      return (flags & (ts.SymbolFlags.Interface | ts.SymbolFlags.TypeAlias)) !== 0 && (flags & ts.SymbolFlags.Value) === 0;
    })
    .map((symbol) => symbol.name)
    .sort();
  const map = exported.find((symbol) => symbol.name === "DragonEmbedEventMap");
  const events = map ? checker.getDeclaredTypeOfSymbol(resolveSymbol(map)).getProperties().map((property) => property.name).sort() : [];
  return { types, events };
}

describe("SDKの入口の名前", () => {
  it("sdk-entry-matches-name-list", async () => {
    const listed = JSON.parse(readFileSync(join(ROOT, "src/embed/names.json"), "utf8")) as Names;
    // 陰性でない対照。一覧に無い名前と、出していない名前を見分ける
    expect(diffNames(["a", "b"], ["a"]), "一覧に無い名前を見分ける").toEqual({ extra: ["b"], missing: [] });
    expect(diffNames(["a"], ["a", "b"]), "出していない名前を見分ける").toEqual({ extra: [], missing: ["b"] });

    const manifest = JSON.parse(readFileSync(join(ROOT, "package.json"), "utf8")) as { exports: Record<string, unknown> };
    expect(manifest.exports["./embed"], "package.json の exports に ./embed が無い").toBeDefined();
    expect(existsSync(ENTRY), "SDKの入口の build した file (dist/embed.js) が無い").toBe(true);
    expect(existsSync(join(DIST, "embed.d.ts")), "SDKの入口の型のfile (dist/embed.d.ts) が無い").toBe(true);
    if (!existsSync(ENTRY) || !existsSync(join(DIST, "embed.d.ts"))) return;

    const loaded = (await import(/* @vite-ignore */ pathToFileURL(ENTRY).href)) as Record<string, unknown>;
    const values = Object.keys(loaded).filter((name) => name !== "default");
    expect(values.filter((name) => typeof loaded[name] !== "function"), "入口が出す関数でない値").toEqual([]);
    const declared = declaredNames(join(DIST, "embed.d.ts"));
    expect(declared.types.length, "型のfileから読めた型の数").toBeGreaterThan(0);
    expect(
      { functions: diffNames(values, listed.functions), types: diffNames(declared.types, listed.types), events: diffNames(declared.events, listed.events) },
      "入口が出す名前と名前の一覧の食い違い",
    ).toEqual({ functions: { extra: [], missing: [] }, types: { extra: [], missing: [] }, events: { extra: [], missing: [] } });
  });
});

describe("置き先に合わせる", () => {
  it("sdk-look-sets-colors-font-radius-density-frame", () =>
    withEmbed(async (page) => {
      await mount(page, {
        look: {
          colors: { surface: "#102030" },
          font: "Georgia, serif",
          fontSize: "15px",
          radius: "2px",
          height: "64px",
          frame: { border: "3px dashed rgb(200, 0, 0)", background: "rgb(10, 20, 30)" },
        },
      });
      // 対照。設定`look`を書かずに置いた図は今の見た目のまま
      await page.evaluate((source) => {
        const w = window as unknown as EmbedWindow;
        w.dragonEmbed.mountDragon(document.getElementById("host2")!, source);
      }, SOURCE);
      const measured = await page.evaluate(() =>
        [...document.querySelectorAll<HTMLElement>(".dragon-frame")].map((frame) => {
          const root = frame.shadowRoot!;
          const header = root.querySelector<HTMLElement>("[data-dragon-header]")!;
          const title = root.querySelector<HTMLElement>(".dg-header-title")!;
          const button = root.querySelector<HTMLElement>(".dg-header-actions > button")!;
          const row = root.querySelector<HTMLElement>(".dg-header-row")!;
          const box = getComputedStyle(frame);
          return {
            surface: getComputedStyle(header).backgroundColor,
            font: getComputedStyle(title).fontFamily,
            titleSize: getComputedStyle(title).fontSize,
            buttonSize: getComputedStyle(button).fontSize,
            radius: getComputedStyle(button).borderTopLeftRadius,
            rowHeight: Math.round(row.getBoundingClientRect().height),
            border: `${box.borderTopWidth} ${box.borderTopStyle} ${box.borderTopColor}`,
            background: box.backgroundColor,
          };
        }),
      );
      expect(measured.length, "置いた帯つきの図の数").toBe(2);
      expect(measured[0], "設定`look`を書いた図の帯と枠").toEqual({
        surface: "rgb(16, 32, 48)",
        font: "Georgia, serif",
        titleSize: "15px",
        buttonSize: "15px",
        radius: "2px",
        rowHeight: 64,
        border: "3px dashed rgb(200, 0, 0)",
        background: "rgb(10, 20, 30)",
      });
      const plain = measured[1]!;
      expect({ titleSize: plain.titleSize, radius: plain.radius, border: plain.border }, "設定`look`を書かない図の帯と枠").toEqual({
        titleSize: "12px",
        radius: "6px",
        border: "1px solid rgb(207, 217, 203)",
      });
    }));

  it("sdk-buttons-hide-reorder-and-add", () =>
    withEmbed(async (page) => {
      await page.evaluate((source) => {
        const w = window as unknown as EmbedWindow;
        w.embed = w.dragonEmbed.mountDragon(document.getElementById("host")!, source, {
          buttons: ["export", "code", { id: "share", label: "共有", onClick: (embed: EmbedHandle) => (w.clicked = { same: embed === w.embed, source: embed.source }) }],
        });
      }, SOURCE);
      const bar = await page.evaluate(() => {
        const root = document.querySelector(".dragon-frame")!.shadowRoot!;
        const share = root.querySelector<HTMLElement>('.dg-header-actions > [data-action="share"]');
        return {
          order: [...root.querySelectorAll<HTMLElement>(".dg-header-actions > *")].map((el) => el.dataset.action ?? el.className),
          shareText: share?.textContent?.trim() ?? "",
          shareBorder: share ? getComputedStyle(share).borderTopStyle : "",
        };
      });
      expect(bar, "帯のボタンの並びと置く側のボタン").toEqual({ order: ["export", "code", "share"], shareText: "共有", shareBorder: "solid" });
      await page.locator('.dg-header-actions > [data-action="share"]').click();
      await expect.poll(() => page.evaluate(() => (window as unknown as EmbedWindow).clicked), { timeout: 3000 }).toEqual({ same: true, source: SOURCE });
    }));
});

describe("帯を出さない置き方", () => {
  it("sdk-headless-calls-export-editor-copy", () =>
    withEmbed(async (page) => {
      await mount(page, { header: false, pausedAt: 0 });
      const placed = await page.evaluate(() => {
        const host = document.getElementById("host")!;
        const find = (node: ParentNode): boolean =>
          Boolean(node.querySelector("svg.dg")) || [...node.querySelectorAll("*")].some((el) => el.shadowRoot !== null && find(el.shadowRoot));
        return { frames: document.querySelectorAll(".dragon-frame").length, bars: document.querySelectorAll("[data-dragon-header]").length, diagram: find(host) };
      });
      expect(placed, "帯を出さずに図だけを置く").toEqual({ frames: 0, bars: 0, diagram: true });

      const exported = await page.evaluate(async () => {
        const w = window as unknown as EmbedWindow;
        const size = async (blob: Blob) => (await createImageBitmap(blob)).width;
        const one = await w.embed.export("png", { scale: 1 });
        const two = await w.embed.export("png", { scale: 2 });
        const svg = await w.embed.export("svg");
        const notation = await w.embed.export("dragon");
        return { png: one.type, ratio: Math.round(((await size(two)) / (await size(one))) * 10) / 10, svg: svg.type, notation: await notation.text() };
      });
      expect(exported, "帯を出さない図のエクスポート").toEqual({ png: "image/png", ratio: 2, svg: "image/svg+xml", notation: SOURCE });

      const editor = await page.evaluate(() => {
        const w = window as unknown as EmbedWindow;
        w.embed.openEditor();
        return { opened: w.opened, url: w.embed.editorUrl };
      });
      expect(editor.url.startsWith(`${GALLERY}editor#`), "エディタのURLが見本帳のエディタを指す").toBe(true);
      expect(editor.opened, "エディタで開いたURL").toEqual([editor.url]);

      await page.evaluate(() => (window as unknown as EmbedWindow).embed.copy("source"));
      await expect.poll(() => clipboardText(page), { timeout: 3000 }).toBe(SOURCE);
      await page.evaluate(() => (window as unknown as EmbedWindow).embed.copy("url"));
      await expect.poll(() => clipboardText(page), { timeout: 3000 }).toBe(editor.url);
    }));
});

describe("置いた頁への知らせ", () => {
  it("sdk-emits-four-events", () =>
    withEmbed(async (page) => {
      const events = (type: string) =>
        page.evaluate((name) => (window as unknown as EmbedWindow).events.filter((event) => event.type === name).map((event) => event.detail), type);
      await mount(page, { pausedAt: 0 });
      expect(await events("dragon-render"), "描けた知らせ").toEqual([{ ok: true }]);
      await page.evaluate(() => (window as unknown as EmbedWindow).embed.player.next());
      await expect.poll(() => events("dragon-step"), { timeout: 3000 }).toEqual([{ step: 0 }, { step: 1 }]);

      await page.evaluate(() => (window as unknown as EmbedWindow).embed.export("json"));
      // 帯のエクスポートの窓から保存しても同じ知らせが届く
      await page.locator(".export-toggle").click();
      await Promise.all([page.waitForEvent("download", { timeout: 4000 }), page.locator('[data-menu="export"] [data-format="dragon"]').click()]);
      await expect.poll(() => events("dragon-export"), { timeout: 3000 }).toEqual([{ format: "json" }, { format: "dragon" }]);

      await page.evaluate(() => (window as unknown as EmbedWindow).embed.copy("source"));
      await page.evaluate(() => (window as unknown as EmbedWindow).embed.openEditor());
      // 帯のコピーの窓とエディタのボタンからも同じ知らせが届く
      await page.locator(".copy-toggle").click();
      await page.locator('[data-menu="copy"] [data-copy="url"]').click();
      await Promise.all([page.waitForEvent("popup", { timeout: 4000 }), page.locator(".dg-header-actions > a.editor").click()]);
      await expect.poll(() => events("dragon-share"), { timeout: 3000 }).toEqual([
        { via: "copy", kind: "source" },
        { via: "editor" },
        { via: "copy", kind: "url" },
        { via: "editor" },
      ]);

      const threw = await page.evaluate((broken) => {
        const w = window as unknown as EmbedWindow;
        try {
          w.dragonEmbed.mountDragon(document.getElementById("host2")!, broken);
          return false;
        } catch {
          return true;
        }
      }, BROKEN);
      expect(threw, "描けない記法で mountDragon が投げる").toBe(true);
      const rendered = (await events("dragon-render")) as { ok: boolean; errors?: string[] }[];
      expect(rendered.length, "描けた知らせと描けなかった知らせの数").toBe(2);
      expect(rendered[1]?.ok, "描けなかった知らせ").toBe(false);
      expect(rendered[1]?.errors?.join("\n") ?? "", "描けなかった知らせの誤りの文").toMatch(/zz/);
    }));
});
