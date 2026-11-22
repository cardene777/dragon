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
 *
 * 件の中で頁を開いて押して待つと、混んだ機械で 1 件 10 秒の上限を超えた (#3816)。
 * 頁を開いて置き、押し、待つ仕事は file を読み込む段 (`at-load.ts`) で済ませ、件は記した値を元の件と同じ順で確かめる。
 */
import { existsSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join, resolve } from "node:path";
import { isDeepStrictEqual } from "node:util";
import type { Page } from "playwright-core";
import ts from "typescript";
import { describe, expect, it } from "vitest";
import { atLoad, type Loaded } from "./at-load";
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
  editorUrl(): Promise<string>;
  player: { next(): void };
  export(format: string, options?: object): Promise<Blob>;
  openEditor(): Promise<boolean>;
  copy(kind: string): Promise<void>;
}

/** SDKの入口を読んだ頁で`run`を回した結果。入口の build した file が無い時は頁を開かず、頁が入口を読めない時は`run`を回さない */
interface Embedded<T> {
  /** SDKの入口の build した file (`dist/embed.js`) が在る */
  built: boolean;
  /** 頁がSDKの入口を読めなかった理由 */
  embedError?: string;
  /** `run`の結果 */
  result?: T;
}

/** 頁の 1 つの操作 (開く、押す、待つ) の上限 (ms)。上限を書かない操作もこれで切る。元の件が 1 件 10 秒で切られていた幅に揃える */
const ACTION_LIMIT_MS = 10_000;
/**
 * 1 つの頁で済ませる仕事の上限 (ms) (#3816)。
 * 読み込む段には 1 件の上限が掛からず、`page.evaluate`と文脈を閉じる仕事は Playwright の上限も持たない。
 * 止まった頁が 5 分の実行の上限までほかの仕事を待たせないよう、頁ごとにここで切る
 */
const PAGE_LIMIT_MS = 60_000;

/** `work`を`ms`ミリ秒で切る。切った時は`what`を挙げて落ちる */
async function within<T>(work: Promise<T>, ms: number, what: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const limit = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`${what}が ${ms}ms で終わらない`)), ms);
  });
  try {
    return await Promise.race([work, limit]);
  } finally {
    clearTimeout(timer);
  }
}

/**
 * `read`を、`done`が通るか`timeout`ミリ秒が過ぎるまで 50ms ごとに読み直し、最後に読んだ値を返す。
 * `expect.poll`は件の外で使えないので、読み込む段では`expect.poll`と同じ間と上限で待つだけにし、判定は件が持つ (#3816)。
 * 上限を過ぎた後の読みが落ちた時は、`expect.poll`と同じくその理由で落ちる
 */
async function readUntil<T>(read: () => Promise<T>, done: (value: T) => boolean, timeout: number): Promise<T> {
  const end = Date.now() + timeout;
  for (;;) {
    const last = Date.now() >= end;
    try {
      const value = await read();
      if (last || done(value)) return value;
    } catch (error) {
      if (last) throw error;
    }
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
}

/** `read`を、`want`と同じ値になるか`timeout`ミリ秒が過ぎるまで読み直す。件は同じ値を`toEqual`で確かめる */
const readUntilEqual = <T>(read: () => Promise<T>, want: unknown, timeout: number): Promise<T> => readUntil(read, (value) => isDeepStrictEqual(value, want), timeout);

/**
 * 頁で順に回す仕事を、1 つずつ読み込む段の仕事 (`atLoad`) にする道具を作る。
 * 落ちた仕事より後の仕事は回さず、読んだ件は落ちた仕事の名前と理由で落ちる。
 * 件は前の仕事の結果を確かめてから次の仕事の結果を読むので、途中で落ちる件も落ちる前の様子を元の件と同じ順に確かめる
 */
function inOrder(): <T>(name: string, work: () => Promise<T>) => Promise<Loaded<T>> {
  let failed: Loaded<never> | undefined;
  return async <T>(name: string, work: () => Promise<T>): Promise<Loaded<T>> => {
    if (failed) return failed;
    const loaded = await atLoad(name, work);
    try {
      loaded.get();
    } catch {
      failed = loaded as Loaded<never>;
    }
    return loaded;
  };
}

/** SDKの入口を読んだ頁を開いて`run`を回す。頁は file で 1 つの Chromium の文脈ごとに開いて閉じる (#3424) */
async function withEmbed<T>(run: (page: Page) => Promise<T>): Promise<Embedded<T>> {
  const built = existsSync(ENTRY);
  if (!built) return { built };
  const html =
    '<!doctype html><html lang="ja"><head><meta charset="utf-8">' +
    '<script type="importmap">{"imports":{"@cardenelabs/dragon":"/index.js","gifenc":"/gifenc.js","mediabunny":"/mediabunny.js"}}</script>' +
    '<style>html,body{margin:0}</style></head><body><div id="host" style="width:760px"></div><div id="host2" style="width:760px"></div>' +
    `<script>window.events=[];for(const name of ${JSON.stringify(EVENTS)})document.addEventListener(name,(e)=>window.events.push({type:e.type,detail:e.detail}));` +
    "window.opened=[];window.open=(url)=>{window.opened.push(String(url));return null;};</script>" +
    '<script type="module">import("/embed.js").then((m) => { window.dragonEmbed = m; }, (e) => { window.embedError = String(e); });</script></body></html>';
  const context = await within((await fileChromium()).newContext({ viewport: { width: 900, height: 900 }, acceptDownloads: true }), ACTION_LIMIT_MS, "頁の文脈を作る");
  // 上限を書かない押す、待つ、開く操作も、Playwright の既定の 30 秒ではなく 1 つの操作の上限で切る
  context.setDefaultTimeout(ACTION_LIMIT_MS);
  const openAndRun = async (): Promise<Embedded<T>> => {
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
    await page.waitForFunction(() => "dragonEmbed" in window || "embedError" in window, undefined, { timeout: ACTION_LIMIT_MS });
    const embedError = await page.evaluate(() => (window as unknown as { embedError?: string }).embedError);
    if (embedError !== undefined) return { built, embedError };
    return { built, result: await run(page) };
  };
  try {
    return await within(openAndRun(), PAGE_LIMIT_MS, "SDKの入口を読んだ頁の仕事");
  } finally {
    // 記した値は手元に在るので、閉じるのが上限で終わらなくても落とさない。閉じ損ねた頁は file の process の終わりに Playwright が Chromium ごと止める
    await within(context.close(), ACTION_LIMIT_MS, "頁の文脈を閉じる").catch(() => undefined);
  }
}

/** 頁で回した結果を返す。入口の build した file が無い時と、頁が入口を読めない時は判定で落とす */
function embedded<T>(opened: Embedded<T>): T {
  expect(opened.built, "SDKの入口の build した file (dist/embed.js) が無い").toBe(true);
  expect(opened.embedError, "頁がSDKの入口を読めない").toBeUndefined();
  return opened.result as T;
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

/** build した入口の file の最後の`export { ... }`が出す名前。本体を読み込まずに字で読む */
function exportedValues(file: string): string[] {
  const list = /export\s*\{([^}]*)\}\s*;?\s*(?:\/\/# sourceMappingURL=\S*\s*)?$/u.exec(readFileSync(file, "utf8"))?.[1] ?? "";
  return list
    .split(",")
    .map((entry) => entry.trim().split(/\s+as\s+/u).pop() ?? "")
    .filter((name) => name !== "")
    .sort();
}

/**
 * 型のfileが出す名前を字の並びの形で読む。`declare function`で書いた名前は関数、ほかの名前は型。
 * 知らせの表 (`DragonEmbedEventMap`) の欄の名前も読む。本体の型のfileを読み込まないので、混んだ機械でも速い
 */
function declaredNames(file: string): { functions: string[]; types: string[]; events: string[] } {
  const source = ts.createSourceFile(file, readFileSync(file, "utf8"), ts.ScriptTarget.Latest);
  const exported: string[] = [];
  const functions = new Set<string>();
  let events: string[] = [];
  for (const node of source.statements) {
    if (ts.isExportDeclaration(node) && node.exportClause && ts.isNamedExports(node.exportClause)) exported.push(...node.exportClause.elements.map((element) => element.name.text));
    if (ts.isFunctionDeclaration(node) && node.name) functions.add(node.name.text);
    if (ts.isInterfaceDeclaration(node) && node.name.text === "DragonEmbedEventMap") {
      events = node.members.flatMap((member) => (member.name && (ts.isStringLiteral(member.name) || ts.isIdentifier(member.name)) ? [member.name.text] : []));
    }
  }
  return {
    functions: exported.filter((name) => functions.has(name)).sort(),
    types: exported.filter((name) => !functions.has(name)).sort(),
    events: events.sort(),
  };
}

describe("SDKの入口の名前", () => {
  it("sdk-entry-matches-name-list", () => {
    const listed = JSON.parse(readFileSync(join(ROOT, "src/embed/names.json"), "utf8")) as Names;
    // 陰性でない対照。一覧に無い名前と、出していない名前を見分ける
    expect(diffNames(["a", "b"], ["a"]), "一覧に無い名前を見分ける").toEqual({ extra: ["b"], missing: [] });
    expect(diffNames(["a"], ["a", "b"]), "出していない名前を見分ける").toEqual({ extra: [], missing: ["b"] });

    const manifest = JSON.parse(readFileSync(join(ROOT, "package.json"), "utf8")) as { exports: Record<string, unknown> };
    expect(manifest.exports["./embed"], "package.json の exports に ./embed が無い").toBeDefined();
    expect(existsSync(ENTRY), "SDKの入口の build した file (dist/embed.js) が無い").toBe(true);
    expect(existsSync(join(DIST, "embed.d.ts")), "SDKの入口の型のfile (dist/embed.d.ts) が無い").toBe(true);
    if (!existsSync(ENTRY) || !existsSync(join(DIST, "embed.d.ts"))) return;

    const values = exportedValues(ENTRY);
    const declared = declaredNames(join(DIST, "embed.d.ts"));
    expect(values.length, "build した入口から読めた名前の数").toBeGreaterThan(0);
    expect(declared.types.length, "型のfileから読めた型の数").toBeGreaterThan(0);
    // 入口が出す値は、型のfileで全て関数として書かれている
    expect(values, "入口が出す値と型のfileの関数").toEqual(declared.functions);
    expect(
      { functions: diffNames(values, listed.functions), types: diffNames(declared.types, listed.types), events: diffNames(declared.events, listed.events) },
      "入口が出す名前と名前の一覧の食い違い",
    ).toEqual({ functions: { extra: [], missing: [] }, types: { extra: [], missing: [] }, events: { extra: [], missing: [] } });
  });
});

// 頁は件ごとに 1 つずつ開き、落ちた仕事はそれを読む件だけを落とす。押す件は押す前に読んだ値も残し、件は元の件と同じ順に確かめる
const LOOK = await atLoad("設定 look を書いた図と書かない図を置き、帯と枠の見た目を測る", () =>
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
    return page.evaluate(() =>
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
  }),
);

/** 置く側のボタンを押した時に、ボタンの処理が受けた物 */
const SHARE_CLICKED = { same: true, source: SOURCE };

const BUTTONS = await atLoad("帯のボタンを隠し並べ替え足した図を置き、足したボタンを押す", () =>
  withEmbed(async (page) => {
    const step = inOrder();
    const bar = await step("帯のボタンの並びを読む", async () => {
      await page.evaluate((source) => {
        const w = window as unknown as EmbedWindow;
        w.embed = w.dragonEmbed.mountDragon(document.getElementById("host")!, source, {
          buttons: ["export", "code", { id: "share", label: "共有", onClick: (embed: EmbedHandle) => (w.clicked = { same: embed === w.embed, source: embed.source }) }],
        });
      }, SOURCE);
      return page.evaluate(() => {
        const root = document.querySelector(".dragon-frame")!.shadowRoot!;
        const share = root.querySelector<HTMLElement>('.dg-header-actions > [data-action="share"]');
        return {
          order: [...root.querySelectorAll<HTMLElement>(".dg-header-actions > *")].map((el) => el.dataset.action ?? el.className),
          shareText: share?.textContent?.trim() ?? "",
          shareBorder: share ? getComputedStyle(share).borderTopStyle : "",
        };
      });
    });
    const clicked = await step("置く側のボタンを押して、ボタンの処理が受けた物を待つ", async () => {
      await page.locator('.dg-header-actions > [data-action="share"]').click();
      return readUntilEqual(() => page.evaluate(() => (window as unknown as EmbedWindow).clicked), SHARE_CLICKED, 3000);
    });
    return { bar, clicked };
  }),
);

describe("置き先に合わせる", () => {
  it("sdk-look-sets-colors-font-radius-density-frame", () => {
    const measured = embedded(LOOK.get());
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
  });

  it("sdk-buttons-hide-reorder-and-add", () => {
    const seen = embedded(BUTTONS.get());
    expect(seen.bar.get(), "帯のボタンの並びと置く側のボタン").toEqual({ order: ["export", "code", "share"], shareText: "共有", shareBorder: "solid" });
    expect(seen.clicked.get()).toEqual(SHARE_CLICKED);
  });
});

const HEADLESS = await atLoad("帯を出さない図を置き、エクスポートとエディタで開くとコピーを関数で呼ぶ", () =>
  withEmbed(async (page) => {
    const step = inOrder();
    const placed = await step("帯を出さない図を置く", async () => {
      await mount(page, { header: false, pausedAt: 0 });
      return page.evaluate(() => {
        const host = document.getElementById("host")!;
        const find = (node: ParentNode): boolean =>
          Boolean(node.querySelector("svg.dg")) || [...node.querySelectorAll("*")].some((el) => el.shadowRoot !== null && find(el.shadowRoot));
        return { frames: document.querySelectorAll(".dragon-frame").length, bars: document.querySelectorAll("[data-dragon-header]").length, diagram: find(host) };
      });
    });
    const exported = await step("関数でエクスポートする", () =>
      page.evaluate(async () => {
        const w = window as unknown as EmbedWindow;
        const size = async (blob: Blob) => (await createImageBitmap(blob)).width;
        const one = await w.embed.export("png", { scale: 1 });
        const two = await w.embed.export("png", { scale: 2 });
        const svg = await w.embed.export("svg");
        const notation = await w.embed.export("dragon");
        return { png: one.type, ratio: Math.round(((await size(two)) / (await size(one))) * 10) / 10, svg: svg.type, notation: await notation.text() };
      }),
    );
    const editor = await step("関数でエディタで開く", () =>
      page.evaluate(async () => {
        const w = window as unknown as EmbedWindow;
        await w.embed.openEditor();
        return { opened: w.opened, url: await w.embed.editorUrl() };
      }),
    );
    const source = await step("関数で記法をコピーし、写した字を待つ", async () => {
      await page.evaluate(() => (window as unknown as EmbedWindow).embed.copy("source"));
      return readUntil(() => clipboardText(page), (text) => text === SOURCE, 3000);
    });
    const url = await step("関数でエディタのURLをコピーし、写した字を待つ", async () => {
      const want = editor.get().url;
      await page.evaluate(() => (window as unknown as EmbedWindow).embed.copy("url"));
      return readUntil(() => clipboardText(page), (text) => text === want, 3000);
    });
    return { placed, exported, editor, source, url };
  }),
);

// 帯を出さない図の HTML も、呼んだ時に隣の書き出す部品 (`capture.js`) を読み、再生の script を埋めた頁を返す (#3786)
const HEADLESS_HTML = await atLoad("帯を出さない図を置き、関数で HTML をエクスポートする", () =>
  withEmbed(async (page) => {
    await mount(page, { header: false, pausedAt: 0 });
    return page.evaluate(async () => {
      const blob = await (window as unknown as EmbedWindow).embed.export("html");
      return { type: blob.type, player: (await blob.text()).includes("DragonPlayer.mountDiagram") };
    });
  }),
);

describe("帯を出さない置き方", () => {
  it("sdk-headless-calls-export-editor-copy", () => {
    const seen = embedded(HEADLESS.get());
    expect(seen.placed.get(), "帯を出さずに図だけを置く").toEqual({ frames: 0, bars: 0, diagram: true });

    expect(seen.exported.get(), "帯を出さない図のエクスポート").toEqual({ png: "image/png", ratio: 2, svg: "image/svg+xml", notation: SOURCE });

    const editor = seen.editor.get();
    expect(editor.url.startsWith(`${GALLERY}editor#`), "エディタのURLが見本帳のエディタを指す").toBe(true);
    expect(editor.opened, "エディタで開いたURL").toEqual([editor.url]);

    expect(seen.source.get()).toBe(SOURCE);
    expect(seen.url.get()).toBe(editor.url);
  });

  it("sdk-headless-exports-html", () => {
    const html = embedded(HEADLESS_HTML.get());
    expect(html, "帯を出さない図の HTML のエクスポート").toEqual({ type: "text/html;charset=utf-8", player: true });
  });
});

/** 段が変わった知らせ。段を 1 つ進めた後 */
const STEP_EVENTS = [{ step: 0 }, { step: 1 }];
/** エクスポートした知らせ。関数で JSON を、帯の窓から記法を保存した後 */
const EXPORT_EVENTS = [{ format: "json" }, { format: "dragon" }];
/** エディタで開いた・コピーした知らせ。関数と帯のボタンで 2 度ずつ呼んだ後 */
const SHARE_EVENTS = [{ via: "copy", kind: "source" }, { via: "editor" }, { via: "copy", kind: "url" }, { via: "editor" }];

const EVENTS_SEEN = await atLoad("図を置いて段を進め、エクスポートし、写し、描けない記法を置いて知らせを読む", () =>
  withEmbed(async (page) => {
    const events = (type: string) =>
      page.evaluate((name) => (window as unknown as EmbedWindow).events.filter((event) => event.type === name).map((event) => event.detail), type);
    const step = inOrder();
    const render = await step("図を置いて描けた知らせを読む", async () => {
      await mount(page, { pausedAt: 0 });
      return events("dragon-render");
    });
    const stepped = await step("段を進めて段が変わった知らせを待つ", async () => {
      await page.evaluate(() => (window as unknown as EmbedWindow).embed.player.next());
      return readUntilEqual(() => events("dragon-step"), STEP_EVENTS, 3000);
    });
    const exported = await step("関数と帯の窓でエクスポートし、エクスポートした知らせを待つ", async () => {
      await page.evaluate(() => (window as unknown as EmbedWindow).embed.export("json"));
      // 帯のエクスポートの窓から保存しても同じ知らせが届く
      await page.locator(".export-toggle").click();
      await Promise.all([page.waitForEvent("download", { timeout: 4000 }), page.locator('[data-menu="export"] [data-format="dragon"]').click()]);
      return readUntilEqual(() => events("dragon-export"), EXPORT_EVENTS, 3000);
    });
    const shared = await step("関数と帯のボタンでコピーしエディタで開き、知らせを待つ", async () => {
      await page.evaluate(() => (window as unknown as EmbedWindow).embed.copy("source"));
      await page.evaluate(() => (window as unknown as EmbedWindow).embed.openEditor());
      // 帯のコピーの窓とエディタのボタンからも同じ知らせが届く
      await page.locator(".copy-toggle").click();
      await page.locator('[data-menu="copy"] [data-copy="url"]').click();
      await Promise.all([page.waitForEvent("popup", { timeout: 4000 }), page.locator(".dg-header-actions > a.editor").click()]);
      return readUntilEqual(() => events("dragon-share"), SHARE_EVENTS, 3000);
    });
    const broken = await step("描けない記法を置いて描けなかった知らせを読む", async () => {
      const threw = await page.evaluate((broken) => {
        const w = window as unknown as EmbedWindow;
        try {
          w.dragonEmbed.mountDragon(document.getElementById("host2")!, broken);
          return false;
        } catch {
          return true;
        }
      }, BROKEN);
      const rendered = (await events("dragon-render")) as { ok: boolean; errors?: string[] }[];
      return { threw, rendered };
    });
    return { render, stepped, exported, shared, broken };
  }),
);

describe("置いた頁への知らせ", () => {
  it("sdk-emits-four-events", () => {
    const seen = embedded(EVENTS_SEEN.get());
    expect(seen.render.get(), "描けた知らせ").toEqual([{ ok: true }]);
    expect(seen.stepped.get()).toEqual(STEP_EVENTS);

    // 帯のエクスポートの窓から保存しても同じ知らせが届く
    expect(seen.exported.get()).toEqual(EXPORT_EVENTS);

    // 帯のコピーの窓とエディタのボタンからも同じ知らせが届く
    expect(seen.shared.get()).toEqual(SHARE_EVENTS);

    const { threw, rendered } = seen.broken.get();
    expect(threw, "描けない記法で mountDragon が投げる").toBe(true);
    expect(rendered.length, "描けた知らせと描けなかった知らせの数").toBe(2);
    expect(rendered[1]?.ok, "描けなかった知らせ").toBe(false);
    expect(rendered[1]?.errors?.join("\n") ?? "", "描けなかった知らせの誤りの文").toMatch(/zz/);
  });
});

/** 誤りのある記法を`mountDragon`と`mountFramedDiagram`に渡した時の誤りの文と、既定の入口で言葉を渡して読んだ時の誤りの文 */
interface ErrorTexts {
  sdk: string;
  frame: string;
  ja: string;
  en: string;
}

/**
 * `#host2`に誤りのある記法を置いて誤りの文を読む。`lang`属性を外す時は`dropLang`を渡す。
 * 頁で`import()`を呼ぶ文は、検査の道具が書き換えないよう字で渡す
 */
const errorTexts = (page: Page, dropLang: boolean): Promise<ErrorTexts> =>
  page.evaluate(`(async () => {
    const broken = ${JSON.stringify(BROKEN)};
    if (${JSON.stringify(dropLang)}) document.documentElement.removeAttribute("lang");
    const core = await import("/index.js");
    const frame = await import("/frame.js");
    const caught = (run) => { try { run(); return "置けた"; } catch (error) { return error instanceof Error ? error.message : String(error); } };
    const read = (lang) => core.parseNotation(broken, { lang }).errors.map((e) => e.line + ": " + e.message).join("\\n");
    const host = document.getElementById("host2");
    return { sdk: caught(() => window.dragonEmbed.mountDragon(host, broken)), frame: caught(() => frame.mountFramedDiagram(host, broken)), ja: read("ja"), en: read("en") };
  })()`);

const ERRORS_JA = await atLoad("<html lang=\"ja\"> の頁に誤りのある記法を置いて誤りの文を読む", () => withEmbed((page) => errorTexts(page, false)));
const ERRORS_NO_LANG = await atLoad("lang 属性を外した頁に誤りのある記法を置いて誤りの文を読む", () => withEmbed((page) => errorTexts(page, true)));

describe("記法の誤りの文の言葉 (#3789)", () => {
  it("embed-sdk-errors-follow-page-lang", () => {
    const texts = embedded(ERRORS_JA.get());
    // 陰性でない対照。日本語と英語で誤りの文が違う
    expect(texts.ja, "日本語で読んだ誤りの文と英語で読んだ誤りの文").not.toBe(texts.en);
    expect({ sdk: texts.sdk, frame: texts.frame }, "<html lang=\"ja\"> の頁で置いた誤りのある記法の誤りの文").toEqual({ sdk: texts.ja, frame: texts.ja });
  });

  it("embed-sdk-errors-stay-english-without-lang", () => {
    const texts = embedded(ERRORS_NO_LANG.get());
    expect(texts.ja, "日本語で読んだ誤りの文と英語で読んだ誤りの文").not.toBe(texts.en);
    expect({ sdk: texts.sdk, frame: texts.frame }, "lang 属性の無い頁で置いた誤りのある記法の誤りの文").toEqual({ sdk: texts.en, frame: texts.en });
  });
});

describe("帯の設定の書き方の説明 (#3789)", () => {
  it("readme-documents-header-settings", () => {
    for (const file of ["README.md", "README.ja.md"]) {
      const text = readFileSync(join(ROOT, file), "utf8");
      const missing = ["@cardenelabs/dragon/light/frame", 'id="dragon-header"', "header-buttons"].filter((word) => !text.includes(word));
      expect(missing, `${file} が載せない帯の設定の書き方`).toEqual([]);
    }
  });
});

/** 要素`id`の影の根に置いた図の、帯のボタンと、帯のコードのボタンの字と、図を描いたかと、再生の部品の見た目が影の根に届いたか */
interface ElementShape {
  buttons: (string | undefined)[];
  code: string;
  drawn: boolean;
  styled: boolean;
}
const elementShapes = (page: Page, ids: readonly string[]): Promise<ElementShape[]> =>
  page.evaluate(
    (list) =>
      list.map((id) => {
        const root = document.getElementById(id)?.shadowRoot ?? null;
        const frame = root?.querySelector(".dragon-frame")?.shadowRoot ?? null;
        const player = (frame ?? root)?.querySelector<HTMLElement>('[data-dragon="player"]') ?? null;
        return {
          buttons: frame ? [...frame.querySelectorAll<HTMLElement>(".dg-header-actions > [data-action]")].map((el) => el.dataset.action) : [],
          code: frame?.querySelector('.dg-header-actions > [data-action="code"]')?.textContent?.trim() ?? "",
          drawn: player?.querySelector("svg") != null,
          // 再生の部品の見た目が届くと、再生の部品の根 (`.dg-player`) は flex で並ぶ。届かない時は既定の block のまま
          styled: player ? getComputedStyle(player).display === "flex" : false,
        };
      }),
    ids,
  );

/** 帯つきの要素と帯を外した要素の形。2 つの要素を置いて描いた後 */
const ELEMENT_SHAPES: ElementShape[] = [
  // 影の根の中でも、帯の言葉は要素から上の lang 属性 (頁の ja) に従う
  { buttons: ["code", "editor", "copy", "export", "expand"], code: "コード", drawn: true, styled: true },
  // 帯を出さない図の再生の部品の見た目も、要素の影の根に届く
  { buttons: [], code: "", drawn: true, styled: true },
];
/** 帯つきの図の帯のボタン。属性 header を外した後の要素 */
const FRAMED_BUTTONS = ["code", "editor", "copy", "export", "expand"];
/** 帯つきの要素の中の字を変えた後の記法 */
const CHANGED = SOURCE.replace("注文", "返品");

const ELEMENT = await atLoad("要素 dragon-diagram を登録して置き、属性と中の字を変えて外す", () =>
  withEmbed(async (page) => {
    const step = inOrder();
    const defined = await step("要素 dragon-diagram を登録する", () =>
      page.evaluate(() => {
        const m = (window as unknown as { dragonEmbed: { defineDragonElement?: () => void } }).dragonEmbed;
        if (typeof m.defineDragonElement !== "function") return false;
        m.defineDragonElement();
        return customElements.get("dragon-diagram") !== undefined;
      }),
    );
    const shapes = await step("帯つきの要素と帯を外した要素を置き、描くのを待つ", async () => {
      // 登録できない時は件が先に判定で落ちるので置かない
      if (!defined.get()) throw new Error("要素 dragon-diagram を登録できないので置かない");
      // 中の字を記法として持つ要素と、属性 header="false" で帯を外した要素を置く。
      // 帯つきの要素は、HTML の入れ子の中で書いた形と同じく全ての行に字下げを付けた記法を持つ
      await page.evaluate((source) => {
        const framed = document.createElement("dragon-diagram");
        framed.id = "framed";
        framed.textContent = `\n      ${source.split("\n").join("\n      ")}\n    `;
        const plain = document.createElement("dragon-diagram");
        plain.id = "plain";
        plain.setAttribute("header", "false");
        plain.textContent = source;
        document.getElementById("host")!.append(framed);
        document.getElementById("host2")!.append(plain);
      }, SOURCE);
      return readUntilEqual(() => elementShapes(page, ["framed", "plain"]), ELEMENT_SHAPES, 5000);
    });
    const placed = await step("置いた要素の記法と描けた知らせを読む", async () => ({
      // 置いた図は要素から呼べ、字下げを外した記法を持つ
      source: await page.evaluate(() => (document.getElementById("framed") as HTMLElement & { embed?: { source: string } }).embed?.source),
      // 描けた知らせは影の根の外の文書まで届く
      rendered: await page.evaluate(() => (window as unknown as EmbedWindow).events.filter((e) => e.type === "dragon-render").map((e) => e.detail)),
    }));
    // 属性 header を外すと帯つきの図に置き直し、中の字を変えると記法を読み直す
    const reframed = await step("帯を外した要素の属性 header を外し、帯を待つ", async () => {
      await page.evaluate(() => document.getElementById("plain")!.removeAttribute("header"));
      return readUntilEqual(async () => (await elementShapes(page, ["plain"]))[0]?.buttons, FRAMED_BUTTONS, 5000);
    });
    const changed = await step("帯つきの要素の中の字を変え、読み直した記法を待つ", async () => {
      await page.evaluate((source) => (document.getElementById("framed")!.textContent = source), CHANGED);
      return readUntil(() => page.evaluate(() => (document.getElementById("framed") as HTMLElement & { embed?: { source: string } }).embed?.source), (source) => source === CHANGED, 5000);
    });
    // 外した要素は図を取り除く
    const removed = await step("帯つきの要素を外す", async () => {
      await page.evaluate(() => document.getElementById("framed")!.remove());
      return page.evaluate(() => document.getElementById("host")!.querySelector("dragon-diagram") === null);
    });
    return { defined, shapes, placed, reframed, changed, removed };
  }),
);

describe("Web Componentの要素 (#3700)", () => {
  it("element-renders-framed-diagram", () => {
    const seen = embedded(ELEMENT.get());
    const defined = seen.defined.get();
    expect(defined, "SDKの入口が要素 dragon-diagram を登録する defineDragonElement を出さない").toBe(true);
    if (!defined) return;
    expect(seen.shapes.get()).toEqual(ELEMENT_SHAPES);
    const { source, rendered } = seen.placed.get();
    // 置いた図は要素から呼べ、字下げを外した記法を持つ
    expect(source, "要素の embed が字下げを外した記法を返す").toBe(SOURCE);
    // 描けた知らせは影の根の外の文書まで届く
    expect(rendered, "2つの要素の描けた知らせ").toEqual([{ ok: true }, { ok: true }]);

    // 属性 header を外すと帯つきの図に置き直し、中の字を変えると記法を読み直す
    expect(seen.reframed.get()).toEqual(FRAMED_BUTTONS);
    expect(seen.changed.get()).toBe(CHANGED);

    // 外した要素は図を取り除く
    expect(seen.removed.get(), "要素を外した").toBe(true);
  });
});
