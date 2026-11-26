/**
 * 外のサービスが置く帯つきの図の帯 (#3695)。
 *
 * 帯は題の左にdragonの印を置き、コード、エディタ、コピー、エクスポート、拡大を枠のあるボタンで並べる。
 * コピーとエクスポートは窓を開き、窓は1つだけ開く。帯の字は設定`lang`、置いた所から上の`lang`属性、英語の順で決める。
 * 帯と図の見た目はstyle要素を作らずに`adoptedStyleSheets`で帯の内側へ入れ、使えない頁では`nonce`を付けたstyle要素で入れる。
 *
 * 見た目の計算とクリップボードと書き出しを本物で確かめるため、build した`dist/frame.js`を`http://localhost/`の頁で読む。
 * 入口が読む本体は import map で`dist/index.js`へ、詰める道具 (`gifenc`と`mediabunny`) は node_modules の file へ向ける。
 *
 * 件の中で頁を開いて押して待つと、混んだ機械で 1 件 10 秒の上限を超えた (#3815)。
 * 頁を開いて置き、押し、待つ仕事は file を読み込む段 (`at-load.ts`) で済ませ、件は記した値を元の件と同じ順で確かめる。
 */
import { existsSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, extname, join, resolve } from "node:path";
import { PNG } from "pngjs";
import type { Page } from "playwright-core";
import { describe, expect, it } from "vitest";
import { LOOK } from "../src/look/values";
import { atLoad, type Loaded } from "./at-load";
import { cdnPage, escapeHtml } from "./cdn-page-support";
import { MONO_STACK, SANS_STACK } from "./font-stacks";
import { ACTION_LIMIT_MS, PAGE_LIMIT_MS, readUntil, within } from "./page-wait";
import { fileChromium } from "./page-needs";

const ROOT = join(process.cwd(), "packages/dragon");
const DIST = join(ROOT, "dist");
const require_ = createRequire(join(ROOT, "package.json"));
/** 頁に返す詰める道具。書き出す処理が読む */
const LIBS: Record<string, string> = {
  "/mediabunny.js": join(dirname(require_.resolve("mediabunny")), "mediabunny.min.mjs"),
  "/gifenc.js": require_.resolve("gifenc/dist/gifenc.esm.js"),
};
/** 帯の下に置く図。題は「注文」 */
const SOURCE = "sequence 注文\nbox a as あなた\nbox b as 店\nstep 確認\n  a -> b: 注文";
/** dragonの印が開く見本帳の頁 */
const GALLERY = "https://cardene777.github.io/dragon/";
/** dragonの印の段の鱗 (#3713)。Codexが描いた形で、`viewBox`が`0 0 48 48`の2つの面。帯はこの形を描き直さずに写す */
const SCALE_MARK = {
  viewBox: "0 0 48 48",
  paths: [
    "M6 6.75A0.75 0.75 0 0 1 6.75 6L41.25 6A0.75 0.75 0 0 1 42 6.75L42 11.25A0.75 0.75 0 0 1 41.25 12L28.75 12A0.75 0.75 0 0 0 28 12.75L28 21.25A0.75 0.75 0 0 1 27.25 22L16.75 22A0.75 0.75 0 0 0 16 22.75L16 29.25A0.75 0.75 0 0 1 15.25 30L10.3107 30A0.75 0.75 0 0 1 9.7803 29.7803L6.2197 26.2197A0.75 0.75 0 0 1 6 25.6893Z",
    "M41.25 18A0.75 0.75 0 0 1 42 18.75L42 25.6893A0.75 0.75 0 0 1 41.7803 26.2197L24.5303 43.4697A0.75 0.75 0 0 1 23.4697 43.4697L17.2803 37.2803A0.75 0.75 0 0 1 17.8107 36L21.25 36A0.75 0.75 0 0 0 22 35.25L22 28.75A0.75 0.75 0 0 1 22.75 28L33.25 28A0.75 0.75 0 0 0 34 27.25L34 18.75A0.75 0.75 0 0 1 34.75 18Z",
  ],
};
/** 見た目を自分で入れる種類の図。配管の図は呼び出しの欄、試す図は入力の帯、購入操作図は図の内側の影の根に見た目を持つ */
const KINDS: { kind: string; source: string; styled?: string }[] = [
  { kind: "sequence", source: SOURCE, styled: ".dg-player" },
  { kind: "pipe", source: readFileSync(join(ROOT, "examples/swap-retry.dragon"), "utf8"), styled: ".dg-fl" },
  { kind: "try", source: readFileSync(join(ROOT, "examples/multisig.dragon"), "utf8"), styled: ".dg-try" },
  { kind: "checkout", source: readFileSync(join(ROOT, "examples/checkout/acp-purchase.dragon"), "utf8") },
];

interface PageSetup {
  /** `<html>`の`lang`属性。書かない時は属性を置かない */
  lang?: string;
  /** 入口を読む前に頁で回す script */
  before?: string;
}

/** 帯の入口を読んだ頁で`run`を回した結果。入口の build した file が無い時は頁を開かず、頁が入口を読めない時は`run`を回さない */
interface Framed<T> {
  /** 帯の入口の build した file (`dist/frame.js`) が在る */
  built: boolean;
  /** 頁が帯の入口を読めなかった理由 */
  frameError?: string;
  /** `run`の結果 */
  result?: T;
}

/** 帯の入口を読んだ頁を開いて`run`を回す。頁は file で 1 つの Chromium の文脈ごとに開いて閉じる (#3424) */
async function withFrame<T>(setup: PageSetup, run: (page: Page) => Promise<T>): Promise<Framed<T>> {
  const built = existsSync(join(DIST, "frame.js"));
  if (!built) return { built };
  const lang = setup.lang ? ` lang="${setup.lang}"` : "";
  const html =
    `<!doctype html><html${lang}><head><meta charset="utf-8">` +
    '<script type="importmap">{"imports":{"@cardenelabs/dragon":"/index.js","gifenc":"/gifenc.js","mediabunny":"/mediabunny.js"}}</script>' +
    '<style>html,body{margin:0}</style></head><body><div id="host" style="width:760px"></div>' +
    `<script>${setup.before ?? ""}</script>` +
    // 帯の無い図と並べる検査 (#3744) のため、帯の入口と同じ本体 (`/index.js`) も頁から呼べるように置く
    '<script type="module">Promise.all([import("/frame.js"), import("/index.js")]).then(([m, core]) => { window.dragonFrame = m; window.dragonCore = core; }, (e) => { window.frameError = String(e); });</script></body></html>';
  const context = await within((await fileChromium()).newContext({ viewport: { width: 900, height: 900 }, acceptDownloads: true }), ACTION_LIMIT_MS, "頁の文脈を作る");
  // 上限を書かない押す、待つ、開く操作も、Playwright の既定の 30 秒ではなく 1 つの操作の上限で切る
  context.setDefaultTimeout(ACTION_LIMIT_MS);
  const openAndRun = async (): Promise<Framed<T>> => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"], { origin: "http://localhost" });
    // dragonの印が開く見本帳は外へ取りに行かず、頁を返す
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
    await page.waitForFunction(() => "dragonFrame" in window || "frameError" in window);
    const frameError = await page.evaluate(() => (window as unknown as { frameError?: string }).frameError);
    if (frameError !== undefined) return { built, frameError };
    return { built, result: await run(page) };
  };
  try {
    return await within(openAndRun(), PAGE_LIMIT_MS, "帯の入口を読んだ頁の仕事");
  } finally {
    // 記した値は手元に在るので、閉じるのが上限で終わらなくても落とさない。閉じ損ねた頁は file の process の終わりに Playwright が Chromium ごと止める
    await within(context.close(), ACTION_LIMIT_MS, "頁の文脈を閉じる").catch(() => undefined);
  }
}

/** 頁で回した結果を返す。入口の build した file が無い時と、頁が入口を読めない時は判定で落とす */
function frameResult<T>(framed: Framed<T>): T {
  expect(framed.built, "帯の入口の build した file (dist/frame.js) が無い").toBe(true);
  expect(framed.frameError, "頁が帯の入口を読めない").toBeUndefined();
  return framed.result as T;
}

/** `#host`に帯つきの図を置く */
async function mount(page: Page, options: Record<string, unknown> = {}): Promise<void> {
  await page.evaluate(
    ([source, opts]) => {
      const frame = (window as unknown as { dragonFrame: { mountFramedDiagram(host: HTMLElement, source: string, options: object): unknown } }).dragonFrame;
      frame.mountFramedDiagram(document.getElementById("host")!, source, opts);
    },
    [SOURCE, options] as const,
  );
}

/** 帯の操作の字。窓を持つ操作は窓を開く釦の字 */
async function actionTexts(page: Page): Promise<Record<string, string>> {
  return page.evaluate(() => {
    const root = document.querySelector(".dragon-frame")!.shadowRoot!;
    const out: Record<string, string> = {};
    for (const el of root.querySelectorAll<HTMLElement>(".dg-header-actions > [data-action]")) {
      const control = el.matches("button,a") ? el : el.querySelector<HTMLElement>(":scope > button");
      out[el.dataset.action!] = control?.textContent?.trim() ?? "";
    }
    return out;
  });
}

/** 窓が見えているか。窓が無い時は`missing` */
async function menuState(page: Page, name: string): Promise<"open" | "closed" | "missing"> {
  return page.evaluate((menu) => {
    const el = document.querySelector(".dragon-frame")!.shadowRoot!.querySelector<HTMLElement>(`[data-menu="${menu}"]`);
    if (!el) return "missing";
    return el.hidden || getComputedStyle(el).display === "none" ? "closed" : "open";
  }, name);
}

/** 窓を開く釦の数。1 つでない時は頁で釦を押さずに止め、件が`expectToggle`で落とす */
function toggleCount(page: Page, action: string): Promise<number> {
  return page.locator(`.dg-header-actions > [data-action="${action}"] > button`).count();
}

/** 窓を開く釦の数を確かめる。0 の時は判定で落とし、頁は無い釦を押して待たない */
function expectToggle(count: number | undefined, action: string): void {
  expect(count, `帯に${action}の窓を開く釦が無い`).toBe(1);
}

/** 頁のクリップボードの字 */
const clipboardText = (page: Page): Promise<string> => page.evaluate(() => navigator.clipboard.readText());

/** 帯の知らせの欄の字 */
const statusText = (page: Page): Promise<string> =>
  page.evaluate(() => document.querySelector(".dragon-frame")!.shadowRoot!.querySelector(".status")?.textContent ?? "");

// 押さずに読むだけの 5 件は、帯つきの図を置いた 1 つの頁を分け合う。押す件と頁を変える件は頁を 1 つずつ持ち、落ちた仕事はそれを読む件だけを落とす
const BAR = await atLoad("帯つきの図を置き、帯の印とボタンと、図の再生の部品と書体を読む", () =>
  withFrame({ lang: "ja" }, async (page) => {
    await mount(page);
    const bar = await page.evaluate(() => {
      const root = document.querySelector(".dragon-frame")!.shadowRoot!;
      const mark = root.querySelector<HTMLElement>(".dg-header-row a.dg-mark");
      const title = root.querySelector<HTMLElement>(".dg-header-row .dg-header-title");
      const actions = [...root.querySelectorAll<HTMLElement>(".dg-header-actions > *")];
      const control = (el: HTMLElement) => (el.matches("button,a") ? el : el.querySelector<HTMLElement>(":scope > button")) ?? el;
      return {
        markLeftOfTitle: Boolean(mark && title && mark.getBoundingClientRect().right <= title.getBoundingClientRect().left),
        order: actions.map((el) => el.dataset.action ?? el.className),
        framed: actions.map((el) => {
          const style = getComputedStyle(control(el));
          const visible = !/^rgba\(.*,\s*0\)$|^transparent$/u.test(style.borderTopColor);
          return style.borderTopStyle !== "none" && Number.parseFloat(style.borderTopWidth) > 0 && visible;
        }),
      };
    });
    const mark = await page.evaluate(() => {
      const el = document.querySelector(".dragon-frame")!.shadowRoot!.querySelector<HTMLElement>(".dg-header-row a.dg-mark");
      if (!el) return undefined;
      const svg = el.querySelector("svg");
      return {
        text: el.textContent?.trim() ?? "",
        label: el.getAttribute("aria-label") ?? "",
        icons: el.querySelectorAll("svg").length,
        viewBox: svg?.getAttribute("viewBox") ?? "",
        paths: [...(svg?.querySelectorAll("path") ?? [])].map((path) => path.getAttribute("d")),
      };
    });
    const expand = await page.evaluate(() => {
      const el = document.querySelector(".dragon-frame")!.shadowRoot!.querySelector<HTMLElement>('.dg-header-actions > [data-action="expand"]');
      return el ? { text: el.textContent?.trim() ?? "", icon: el.querySelector("svg") !== null, label: el.getAttribute("aria-label") ?? "" } : undefined;
    });
    const player = await page.evaluate(() => {
      const el = document.querySelector(".dragon-frame")!.shadowRoot!.querySelector(".dg-player");
      return el ? getComputedStyle(el).display : "missing";
    });
    const family = await page.evaluate(() => {
      const text = document.querySelector(".dragon-frame")!.shadowRoot!.querySelector("svg.dg text");
      return text ? getComputedStyle(text).fontFamily : "missing";
    });
    return { bar, mark, expand, player, family };
  }),
);

/** dragonの印を押した結果。印が 1 つでない時は押さない */
interface MarkSeen {
  /** 帯のdragonの印の数 */
  marks: number;
  target?: string | null;
  rel?: string | null;
  /** 印を押して開いた頁の URL */
  popup?: string;
}

const MARK_OPENS = await atLoad("帯のdragonの印を押して見本帳の頁を開く", () =>
  withFrame({ lang: "ja" }, async (page): Promise<MarkSeen> => {
    await mount(page);
    const mark = page.locator(".dg-header-row a.dg-mark");
    const seen: MarkSeen = { marks: await mark.count() };
    // 印が無い時は属性を待たず、押して待たない
    if (seen.marks !== 1) return seen;
    seen.target = await mark.getAttribute("target");
    seen.rel = await mark.getAttribute("rel");
    const [popup] = await Promise.all([page.waitForEvent("popup", { timeout: 4000 }), mark.click()]);
    seen.popup = popup.url();
    return seen;
  }),
);

describe("帯の並び", () => {
  it("bar-lists-mark-and-five-buttons-in-order", () => {
    const { bar } = frameResult(BAR.get());
    expect(bar.markLeftOfTitle, "題の左にdragonの印が無い").toBe(true);
    expect(bar.order).toEqual(["code", "editor", "copy", "export", "expand"]);
    expect(bar.framed).toEqual([true, true, true, true, true]);
  });

  it("bar-mark-opens-gallery", () => {
    const mark = frameResult(MARK_OPENS.get());
    expect(mark.marks, "帯にdragonの印が無い").toBe(1);
    expect(mark.target).toBe("_blank");
    expect(mark.rel).toContain("noopener");
    expect(mark.popup).toBe(GALLERY);
  });

  // 印は段の鱗のアイコンだけを描き、`dragon`の字を持たず、読み上げの名前を持つ (#3713)
  it("bar-mark-is-icon-only", () => {
    const { mark } = frameResult(BAR.get());
    expect(mark, "帯にdragonの印が無い").toBeDefined();
    expect(mark!.text, "印が字を持つ").toBe("");
    expect(mark!.label, "印が読み上げの名前を持たない").not.toBe("");
    expect(mark!.icons).toBe(1);
    expect(mark!.viewBox).toBe(SCALE_MARK.viewBox);
    expect(mark!.paths).toEqual(SCALE_MARK.paths);
  });

  it("bar-expand-is-icon-only", () => {
    const { expand } = frameResult(BAR.get());
    expect(expand, "帯に拡大のボタンが無い").toBeDefined();
    expect(expand!.text).toBe("");
    expect(expand!.icon).toBe(true);
    expect(expand!.label).toBe("図を拡大");
  });
});

/** コピーの窓で写した結果。窓を開く釦が 1 つでない時は押さない */
interface CopySeen {
  /** 帯のコピーの窓を開く釦の数 */
  toggles: number;
  /** 窓の項目 */
  items?: { key: string | undefined; text: string | undefined }[];
  /** 記法を写した後のクリップボードの字 */
  source?: string;
  /** 記法を写した時の知らせの欄の字 */
  copied?: string;
  /** 帯のエディタのリンク */
  editor?: string | null;
  /** エディタのURLを写した後のクリップボードの字 */
  url?: string;
  /** 画像を写した後のクリップボードの形式 */
  image?: string[];
  /** 書き込みを断られて記法を写した後に待って読んだ知らせの欄の字と、その後にもう一度読んだ字 */
  denied?: string;
  deniedAgain?: string;
}

const COPY = await atLoad("コピーの窓で記法とエディタのURLと画像を写し、書き込みを断られた時の知らせを読む", () =>
  withFrame({ lang: "ja" }, async (page): Promise<CopySeen> => {
    await mount(page);
    const seen: CopySeen = { toggles: await toggleCount(page, "copy") };
    if (seen.toggles !== 1) return seen;
    const toggle = page.locator('.dg-header-actions > [data-action="copy"] > button');
    await toggle.click();
    seen.items = await page.evaluate(() =>
      [...document.querySelector(".dragon-frame")!.shadowRoot!.querySelectorAll<HTMLElement>('[data-menu="copy"] [data-copy]')].map((el) => ({ key: el.dataset.copy, text: el.textContent?.trim() })),
    );
    await page.locator('[data-menu="copy"] [data-copy="source"]').click();
    seen.source = await readUntil(() => clipboardText(page), (text) => text === SOURCE, 3000);
    const copied = await statusText(page);
    seen.copied = copied;
    const editor = await page.locator('.dg-header-actions > [data-action="editor"]').getAttribute("href");
    seen.editor = editor;
    await toggle.click();
    await page.locator('[data-menu="copy"] [data-copy="url"]').click();
    seen.url = await readUntil(() => clipboardText(page), (text) => text === editor, 3000);
    await toggle.click();
    await page.locator('[data-menu="copy"] [data-copy="image"]').click();
    seen.image = await readUntil(
      () => page.evaluate(async () => (await navigator.clipboard.read()).flatMap((item) => item.types)),
      (types) => types.includes("image/png"),
      5000,
    );
    // 書き込みを断るクリップボードに替えて、もう一度記法を写す
    await page.evaluate(() => {
      navigator.clipboard.writeText = () => Promise.reject(new Error("denied"));
    });
    await toggle.click();
    await page.locator('[data-menu="copy"] [data-copy="source"]').click();
    seen.denied = await readUntil(() => statusText(page), (text) => text !== copied, 3000);
    seen.deniedAgain = await statusText(page);
    return seen;
  }),
);

describe("コピーの窓", () => {
  it("bar-copy-menu-writes-clipboard", () => {
    const copy = frameResult(COPY.get());
    expectToggle(copy.toggles, "copy");
    expect(copy.items).toEqual([
      { key: "source", text: "記法" },
      { key: "image", text: "画像" },
      { key: "url", text: "エディタのURL" },
    ]);
    expect(copy.source).toBe(SOURCE);
    expect(copy.url).toBe(copy.editor);
    expect(copy.image).toContain("image/png");
    // ブラウザが書き込みを断った時は、写せなかったことを知らせの欄に出す
    expect(copy.denied).not.toBe(copy.copied);
    expect(copy.deniedAgain).not.toBe("");
  });
});

/** エクスポートの窓を開いた結果。窓を開く釦が 1 つでない時は押さない */
interface ExportGroupsSeen {
  toggles: number;
  /** 窓の組と、組ごとの形式。窓が無い時は undefined */
  menu?: { group: string; text: string; formats: string[]; names: string[] }[] | undefined;
}

const EXPORT_GROUPS = await atLoad("エクスポートの窓を開いて形式の組を読む", () =>
  withFrame({ lang: "ja" }, async (page): Promise<ExportGroupsSeen> => {
    await mount(page);
    const seen: ExportGroupsSeen = { toggles: await toggleCount(page, "export") };
    if (seen.toggles !== 1) return seen;
    await page.locator('.dg-header-actions > [data-action="export"] > button').click();
    seen.menu = await page.evaluate(() => {
      const el = document.querySelector(".dragon-frame")!.shadowRoot!.querySelector<HTMLElement>('[data-menu="export"]');
      if (!el) return undefined;
      const groups: { group: string; text: string; formats: string[]; names: string[] }[] = [];
      for (const child of el.querySelectorAll<HTMLElement>("[data-group],[data-format]")) {
        if (child.dataset.group) groups.push({ group: child.dataset.group, text: child.textContent?.trim() ?? "", formats: [], names: [] });
        else if (groups.length) {
          groups.at(-1)!.formats.push(child.dataset.format!);
          groups.at(-1)!.names.push(child.textContent?.trim() ?? "");
        }
      }
      return groups;
    });
    return seen;
  }),
);

/** エクスポートの窓から 1 つの形式で保存した file。窓に形式の項目が 1 つでない時は押さない */
interface Saved {
  /** 窓の形式の項目の数 */
  items: number;
  name?: string;
  text?: string;
}

/** エクスポートの窓から記法と JSON を順に保存した結果 */
interface SavesSeen {
  toggles: number;
  notation?: Saved;
  json?: Saved;
}

const EXPORT_SAVES = await atLoad("エクスポートの窓から記法と JSON を保存する", () =>
  withFrame({ lang: "ja" }, async (page): Promise<SavesSeen> => {
    await mount(page);
    const seen: SavesSeen = { toggles: await toggleCount(page, "export") };
    if (seen.toggles !== 1) return seen;
    const toggle = page.locator('.dg-header-actions > [data-action="export"] > button');
    const save = async (format: string): Promise<Saved> => {
      await toggle.click();
      const item = page.locator(`[data-menu="export"] [data-format="${format}"]`);
      const items = await item.count();
      // 項目が無い時は押して待たない
      if (items !== 1) return { items };
      const [download] = await Promise.all([page.waitForEvent("download", { timeout: 4000 }), item.click()]);
      return { items, name: download.suggestedFilename(), text: readFileSync(await download.path(), "utf8") };
    };
    const notation = await save("dragon");
    seen.notation = notation;
    if (notation.items !== 1) return seen;
    seen.json = await save("json");
    return seen;
  }),
);

/** 窓に形式`format`の項目が 1 つ在ったことを確かめ、保存した file の名前と中身を返す */
function savedFile(saved: Saved | undefined, format: string): { name: string; text: string } {
  expect(saved?.items, `エクスポートの窓に${format}が無い`).toBe(1);
  return { name: saved?.name ?? "", text: saved?.text ?? "" };
}

/** エクスポートの窓から HTML を保存した結果。窓を開く釦が 1 つでない時は押さない */
interface HtmlSeen {
  toggles: number;
  name?: string;
  /** 書き出した頁が再生の script を埋めて図を置く */
  mounts?: boolean;
  /** 保存した後の知らせの欄の字 */
  status?: string;
}

const EXPORT_HTML = await atLoad("エクスポートの窓から操作できる HTML を保存する", () =>
  withFrame({ lang: "ja" }, async (page): Promise<HtmlSeen> => {
    await mount(page);
    const seen: HtmlSeen = { toggles: await toggleCount(page, "export") };
    if (seen.toggles !== 1) return seen;
    await page.locator('.dg-header-actions > [data-action="export"] > button').click();
    const [download] = await Promise.all([page.waitForEvent("download", { timeout: 8000 }), page.locator('[data-menu="export"] [data-format="html"]').click()]);
    seen.name = download.suggestedFilename();
    seen.mounts = readFileSync(await download.path(), "utf8").includes("DragonPlayer.mountDiagram");
    seen.status = await statusText(page);
    return seen;
  }),
);

/** 大きさと地を選んで PNG を保存した結果。選んだ後に窓が閉じた時は保存しない */
interface PngShot {
  /** 大きさと地を選んだ後の窓 */
  menu: "open" | "closed" | "missing";
  /** PNG の幅 (px) */
  width?: number;
  /** 図の SVG の範囲で透明な画素の割合 */
  clearShare?: number;
  /** 透明でない画素が在る */
  drawn?: boolean;
}

/** エクスポートの窓の大きさと地の初めの選びと、2 通りに選んで保存した PNG */
interface PngSeen {
  toggles: number;
  /** 初めに押されている大きさと地 */
  scale?: (string | undefined)[];
  background?: (string | undefined)[];
  /** 帯の内側の図の置き場の幅 (px) */
  width?: number;
  /** 3 倍の大きさで透明な地 */
  clear?: PngShot;
  /** 1 倍の大きさで地を塗る */
  filled?: PngShot;
}

const EXPORT_PNG = await atLoad("エクスポートの窓で大きさと地を選び、PNG を 2 通りに保存する", () =>
  withFrame({ lang: "ja" }, async (page): Promise<PngSeen> => {
    await mount(page);
    const seen: PngSeen = { toggles: await toggleCount(page, "export") };
    if (seen.toggles !== 1) return seen;
    const toggle = page.locator('.dg-header-actions > [data-action="export"] > button');
    await toggle.click();
    const pressed = (option: string) =>
      page.evaluate(
        (name) =>
          [...document.querySelector(".dragon-frame")!.shadowRoot!.querySelectorAll<HTMLElement>(`[data-option="${name}"] [data-value]`)]
            .filter((el) => el.getAttribute("aria-pressed") === "true")
            .map((el) => el.dataset.value),
        option,
      );
    seen.scale = await pressed("scale");
    seen.background = await pressed("background");
    seen.width = await page.evaluate(() => Math.ceil(document.querySelector(".dragon-frame")!.shadowRoot!.querySelector(".dragon-host")!.getBoundingClientRect().width));
    // 図の SVG の範囲で透明な画素の割合。図の地の四角を塗ると、範囲の中は角の丸みのほかに透明な画素が残らない
    const svg = await page.evaluate(() => {
      const root = document.querySelector(".dragon-frame")!.shadowRoot!;
      const host = root.querySelector(".dragon-host")!.getBoundingClientRect();
      const box = root.querySelector("svg.dg")!.getBoundingClientRect();
      return { x: box.left - host.left, y: box.top - host.top, w: box.width, h: box.height };
    });
    const clearShare = (image: PNG, scale: number) => {
      let clear = 0;
      let all = 0;
      for (let y = Math.ceil(svg.y * scale); y < Math.floor((svg.y + svg.h) * scale); y++) {
        for (let x = Math.ceil(svg.x * scale); x < Math.floor((svg.x + svg.w) * scale); x++) {
          all++;
          if (image.data[(y * image.width + x) * 4 + 3] === 0) clear++;
        }
      }
      return clear / all;
    };
    const png = async (scale: string, background: string): Promise<PngShot> => {
      if ((await menuState(page, "export")) !== "open") await toggle.click();
      await page.locator(`[data-option="scale"] [data-value="${scale}"]`).click();
      await page.locator(`[data-option="background"] [data-value="${background}"]`).click();
      const menu = await menuState(page, "export");
      // 窓が閉じた時は保存の項目を押して待たない
      if (menu !== "open") return { menu };
      const [download] = await Promise.all([page.waitForEvent("download", { timeout: 5000 }), page.locator('[data-menu="export"] [data-format="png"]').click()]);
      const image = PNG.sync.read(readFileSync(await download.path()));
      return { menu, width: image.width, clearShare: clearShare(image, Number(scale)), drawn: image.data.some((value, i) => i % 4 === 3 && value > 0) };
    };
    const clear = await png("3", "transparent");
    seen.clear = clear;
    if (clear.menu !== "open") return seen;
    seen.filled = await png("1", "fill");
    return seen;
  }),
);

describe("エクスポートの窓", () => {
  it("export-menu-groups-seven-formats", () => {
    const { toggles, menu } = frameResult(EXPORT_GROUPS.get());
    expectToggle(toggles, "export");
    expect(menu, "帯にエクスポートの窓が無い").toBeDefined();
    expect(menu).toEqual([
      { group: "images", text: "画像", formats: ["png", "svg"], names: ["PNG", "SVG"] },
      { group: "motion", text: "動き", formats: ["html", "gif", "mp4"], names: ["HTML", "GIF", "MP4"] },
      { group: "notation", text: "記法", formats: ["dragon", "json"], names: ["dragon記法", "JSON"] },
    ]);
  });

  it("export-menu-saves-notation-and-json", () => {
    const saved = frameResult(EXPORT_SAVES.get());
    expectToggle(saved.toggles, "export");
    const notation = savedFile(saved.notation, "dragon");
    expect(notation.name.endsWith(".dragon")).toBe(true);
    expect(notation.text).toBe(SOURCE);
    const json = savedFile(saved.json, "json");
    expect(json.name.endsWith(".json")).toBe(true);
    expect(JSON.parse(json.text)).toMatchObject({ kind: "sequence", title: "注文" });
  });

  it("frame-export-html-loads-capture", () => {
    // npm の帯の HTML は、押した時に隣の書き出す部品 (`capture.js`) を読み、再生の script を埋めた頁を書き出す (#3786)
    const html = frameResult(EXPORT_HTML.get());
    expectToggle(html.toggles, "export");
    expect(html.name, "HTMLのエクスポートのfileの名前").toMatch(/\.html$/u);
    expect(html.mounts, "書き出した頁が再生の script を埋めて図を置く").toBe(true);
    expect(html.status, "HTMLのエクスポートの知らせ").toBe("操作できるHTMLを保存しました。開くと初期条件から始まります。");
  });

  it("export-options-scale-and-transparent-png", () => {
    const shot = frameResult(EXPORT_PNG.get());
    expectToggle(shot.toggles, "export");
    expect(shot.scale).toEqual(["2"]);
    expect(shot.background).toEqual(["fill"]);
    const width = shot.width!;
    expect(shot.clear?.menu, "大きさと地を選ぶと窓が閉じた").toBe("open");
    expect(shot.clear?.width).toBe(width * 3);
    expect(shot.clear?.clearShare, "透明を選んだのに図の地を塗った").toBeGreaterThan(0.25);
    expect(shot.clear?.drawn, "透明を選ぶと図まで消えた").toBe(true);
    expect(shot.filled?.menu, "大きさと地を選ぶと窓が閉じた").toBe("open");
    expect(shot.filled?.width).toBe(width);
    expect(shot.filled?.clearShare, "地を塗るを選んだのに透明な画素が残った").toBe(0);
  });
});

/** 頁の幅を`width`にし、左右に 16px の余白を置いて、帯つきの図を頁の幅いっぱいに置く */
async function placeOnPage(page: Page, width: number): Promise<void> {
  await page.setViewportSize({ width, height: 900 });
  await page.evaluate(() => {
    document.body.style.padding = "0 16px";
    document.getElementById("host")!.style.width = "auto";
  });
  await mount(page);
}

/** 窓と、窓を開いたボタンと、帯の枠の左右の端 (px) */
interface MenuBox {
  left: number;
  right: number;
  buttonRight: number;
  frameLeft: number;
  frameRight: number;
}

/** 窓を開き直した結果。窓を開く釦が 1 つでない時は押さず、押しても窓が開かない時は測らない */
interface OpenedMenu {
  toggles: number;
  /** 釦を押した後の窓 */
  state?: "open" | "closed" | "missing";
  box?: MenuBox;
}

/** 窓`name`を開き直し、窓と、窓を開いたボタンと、帯の枠の左右の端を測る */
async function openedMenu(page: Page, name: string): Promise<OpenedMenu> {
  const opened: OpenedMenu = { toggles: await toggleCount(page, name) };
  if (opened.toggles !== 1) return opened;
  // 開いた窓は下の段のボタンに重なるので、Escape で閉じてから押す
  if ((await menuState(page, "copy")) === "open" || (await menuState(page, "export")) === "open") await page.keyboard.press("Escape");
  await page.locator(`.dg-header-actions > [data-action="${name}"] > button`).click();
  opened.state = await menuState(page, name);
  if (opened.state !== "open") return opened;
  opened.box = await page.evaluate((menu) => {
    const frame = document.querySelector<HTMLElement>(".dragon-frame")!;
    const root = frame.shadowRoot!;
    const box = root.querySelector(`[data-menu="${menu}"]`)!.getBoundingClientRect();
    const button = root.querySelector(`[data-action="${menu}"] > button`)!.getBoundingClientRect();
    const edge = frame.getBoundingClientRect();
    return { left: box.left, right: box.right, buttonRight: button.right, frameLeft: edge.left, frameRight: edge.right };
  }, name);
  return opened;
}

/** 窓`name`を開く釦が 1 つ在り、押すと窓が開いたことを確かめ、測った端を返す */
function menuBox(opened: OpenedMenu | undefined, name: string): MenuBox {
  expectToggle(opened?.toggles, name);
  expect(opened?.state, `${name}の窓が開かない`).toBe("open");
  return opened!.box!;
}

/** コピーとエクスポートの窓を順に開き、図を押した結果。窓を開く釦が 1 つでない時は押さない */
interface OneMenuSeen {
  copyToggles: number;
  exportToggles?: number;
  /** コピーを押した後、エクスポートを押した後、図を押した後の [コピー, エクスポート] の窓 */
  afterCopy?: string[];
  afterExport?: string[];
  afterStage?: string[];
}

const ONE_MENU = await atLoad("コピーとエクスポートの窓を順に開き、図を押して閉じる", () =>
  withFrame({ lang: "ja" }, async (page): Promise<OneMenuSeen> => {
    await mount(page);
    const seen: OneMenuSeen = { copyToggles: await toggleCount(page, "copy") };
    if (seen.copyToggles !== 1) return seen;
    seen.exportToggles = await toggleCount(page, "export");
    if (seen.exportToggles !== 1) return seen;
    await page.locator('.dg-header-actions > [data-action="copy"] > button').click();
    seen.afterCopy = [await menuState(page, "copy"), await menuState(page, "export")];
    await page.locator('.dg-header-actions > [data-action="export"] > button').click();
    seen.afterExport = [await menuState(page, "copy"), await menuState(page, "export")];
    const stage = await page.evaluate(() => {
      const box = document.querySelector(".dragon-frame")!.shadowRoot!.querySelector(".stage")!.getBoundingClientRect();
      return { x: box.left + 20, y: box.bottom - 20 };
    });
    await page.mouse.click(stage.x, stage.y);
    seen.afterStage = [await menuState(page, "copy"), await menuState(page, "export")];
    return seen;
  }),
);

/** 頁の幅 360px で開いたエクスポートとコピーの窓と、帯の枠を 280px にして開いたエクスポートの窓。窓が開かなかった所で止める */
interface NarrowSeen {
  export: OpenedMenu;
  copy?: OpenedMenu;
  thin?: OpenedMenu;
}

const NARROW_MENUS = await atLoad("頁の幅 360px と 312px で帯つきの図の窓を開いて測る", () =>
  withFrame({ lang: "ja" }, async (page): Promise<NarrowSeen> => {
    await placeOnPage(page, 360);
    const exported = await openedMenu(page, "export");
    const seen: NarrowSeen = { export: exported };
    if (!exported.box) return seen;
    const copy = await openedMenu(page, "copy");
    seen.copy = copy;
    if (!copy.box) return seen;
    // 帯の枠を 280px にする
    await page.setViewportSize({ width: 312, height: 900 });
    seen.thin = await openedMenu(page, "export");
    return seen;
  }),
);

const WIDE_MENU = await atLoad("頁の幅 1000px で帯つきの図のエクスポートの窓を開いて測る", () =>
  withFrame({ lang: "ja" }, async (page) => {
    await placeOnPage(page, 1000);
    return openedMenu(page, "export");
  }),
);

describe("窓の開き方", () => {
  it("bar-opens-one-menu-at-a-time", () => {
    const menus = frameResult(ONE_MENU.get());
    expectToggle(menus.copyToggles, "copy");
    expectToggle(menus.exportToggles, "export");
    expect(menus.afterCopy).toEqual(["open", "closed"]);
    expect(menus.afterExport).toEqual(["closed", "open"]);
    expect(menus.afterStage).toEqual(["closed", "closed"]);
  });

  it("frame-menus-fit-narrow-page", () => {
    // 携帯の幅では帯のボタンが 2 段に折り返し、エクスポートのボタンは 2 段目の左に来る (#3786)
    const menus = frameResult(NARROW_MENUS.get());
    const narrow = { export: menuBox(menus.export, "export"), copy: menuBox(menus.copy, "copy") };
    for (const [name, box] of Object.entries(narrow)) {
      expect(box.left, `頁の幅360pxで${name}の窓の左端が画面の外`).toBeGreaterThanOrEqual(0);
      expect(box.right, `頁の幅360pxで${name}の窓の右端が画面の外`).toBeLessThanOrEqual(360);
    }
    // 帯の枠が 280px の時、窓の幅は枠の幅から 20px を引いた幅に縮み、枠の左右の縁を越えない
    const thin = menuBox(menus.thin, "export");
    expect(thin.frameRight - thin.frameLeft, "帯の枠の幅").toBeCloseTo(280, 0);
    expect(thin.right - thin.left, "帯の枠が280pxの時のエクスポートの窓の幅").toBeCloseTo(260, 0);
    expect(thin.left, "エクスポートの窓が帯の枠の左の縁を越えた").toBeGreaterThanOrEqual(thin.frameLeft);
    expect(thin.right, "エクスポートの窓が帯の枠の右の縁を越えた").toBeLessThanOrEqual(thin.frameRight);
  });

  it("frame-menu-aligns-right-on-wide-page", () => {
    const wide = menuBox(frameResult(WIDE_MENU.get()), "export");
    expect(Math.abs(wide.right - wide.buttonRight), `頁の幅1000pxでエクスポートの窓の右端 (${wide.right}) がボタンの右端 (${wide.buttonRight}) と揃わない`).toBeLessThan(0.5);
    expect(wide.right - wide.left, "頁の幅1000pxのエクスポートの窓の幅").toBeCloseTo(300, 0);
  });
});

const LANG_TEXT = await atLoad("lang の無い頁で、置いた所の lang と設定 lang を変えて帯のコードのボタンの字を読む", () =>
  withFrame({}, async (page) => {
    const codeText = (lang: string | undefined, option: string | undefined) =>
      page.evaluate(
        ([source, wrapLang, optionLang]) => {
          const wrap = document.createElement("div");
          if (wrapLang) wrap.setAttribute("lang", wrapLang);
          const host = document.createElement("div");
          wrap.append(host);
          document.body.append(wrap);
          const frame = (window as unknown as { dragonFrame: { mountFramedDiagram(host: HTMLElement, source: string, options: object): unknown } }).dragonFrame;
          frame.mountFramedDiagram(host, source, optionLang ? { lang: optionLang } : {});
          const button = host.querySelector(".dragon-frame")!.shadowRoot!.querySelector('.dg-header-actions > [data-action="code"]');
          const text = button?.textContent?.trim() ?? "";
          wrap.remove();
          return text;
        },
        [SOURCE, lang, option] as const,
      );
    const jaPage = await codeText("ja-JP", undefined);
    const noLang = await codeText(undefined, undefined);
    const enSetting = await codeText("ja", "en");
    return { jaPage, noLang, enSetting };
  }),
);

const ENGLISH_TEXT = await atLoad("英語の頁に帯つきの図を置いて帯の操作の字を読む", () =>
  withFrame({ lang: "en" }, async (page) => {
    await mount(page);
    return actionTexts(page);
  }),
);

describe("帯の言葉", () => {
  it("bar-text-follows-lang-setting-then-page", () => {
    const texts = frameResult(LANG_TEXT.get());
    expect(texts.jaPage, "置いた所の上の lang が ja-JP なのに日本語にならない").toBe("コード");
    expect(texts.noLang, "どこにも lang が無いのに英語にならない").toBe("Code");
    expect(texts.enSetting, "設定 lang が置いた所の lang に負けた").toBe("Code");
  });

  it("bar-text-english-on-english-page", () => {
    const texts = frameResult(ENGLISH_TEXT.get());
    expect({ code: texts.code, editor: texts.editor, copy: texts.copy, export: texts.export }).toEqual({ code: "Code", editor: "Editor", copy: "Copy", export: "Export" });
  });
});

/** 帯つきの図を 1 つ置いた時の、頁と帯の内側の style 要素の数と、影の根の見た目 */
interface KindStyles {
  page: number;
  inside: number;
  adopted: number[];
  row: string;
  styled: string;
}

const STYLE_COUNTS = await atLoad("見た目を自分で入れる 4 種類の図を帯つきで置き、style 要素と見た目を数える", () =>
  withFrame({ lang: "ja" }, async (page) => {
    const before = await page.evaluate(() => document.querySelectorAll("style").length);
    const kinds: { kind: string; styled?: string; styles: KindStyles }[] = [];
    for (const { kind, source, styled } of KINDS) {
      const styles = await page.evaluate(
        async ([text, selector]) => {
          const host = document.createElement("div");
          host.style.width = "760px";
          document.body.append(host);
          const frame = (window as unknown as { dragonFrame: { mountFramedDiagram(host: HTMLElement, source: string, options: object): unknown } }).dragonFrame;
          frame.mountFramedDiagram(host, text, {});
          await new Promise((resolve) => requestAnimationFrame(resolve));
          const root = host.querySelector(".dragon-frame")!.shadowRoot!;
          // 帯の内側と、図が内側に持つ影の根を全部たどり、HTML の style要素を数える。図の SVG の`<style>`は書き出しが読むので数えない
          const roots: ShadowRoot[] = [root];
          for (let i = 0; i < roots.length; i++) for (const el of roots[i]!.querySelectorAll("*")) if (el.shadowRoot) roots.push(el.shadowRoot);
          const htmlStyles = (scope: ParentNode) => [...scope.querySelectorAll("style")].filter((el) => el.namespaceURI === "http://www.w3.org/1999/xhtml").length;
          const target = selector ? root.querySelector(selector) : null;
          const result = {
            page: htmlStyles(document),
            inside: roots.reduce((sum, scope) => sum + htmlStyles(scope), 0),
            adopted: roots.map((scope) => scope.adoptedStyleSheets.length),
            row: getComputedStyle(root.querySelector(".dg-header-row")!).display,
            styled: target ? getComputedStyle(target).display : selector ? "missing" : "",
          };
          host.remove();
          return result;
        },
        [source, styled ?? ""] as const,
      );
      kinds.push({ kind, styled, styles });
    }
    return { before, kinds };
  }),
);

const NONCE_STYLE = await atLoad("adoptedStyleSheets を外した頁に nonce を渡して帯つきの図を置く", () =>
  withFrame({ lang: "ja", before: "delete Document.prototype.adoptedStyleSheets; delete ShadowRoot.prototype.adoptedStyleSheets;" }, async (page) => {
    const adopted = await page.evaluate(() => "adoptedStyleSheets" in document);
    await mount(page, { nonce: "n0nce" });
    const styles = await page.evaluate(() => {
      const root = document.querySelector(".dragon-frame")!.shadowRoot!;
      const all = [...root.querySelectorAll("style"), ...document.querySelectorAll("style")].filter((el) => el.textContent?.includes(".dg-"));
      return {
        count: all.length,
        nonces: all.map((el) => el.nonce),
        player: getComputedStyle(root.querySelector(".dg-player")!).display,
      };
    });
    return { adopted, styles };
  }),
);

describe("帯と図の見た目", () => {
  it("frame-styles-without-style-elements", () => {
    const { before, kinds } = frameResult(STYLE_COUNTS.get());
    for (const { kind, styled, styles } of kinds) {
      expect(styles.page, `${kind}の帯つきの図が頁にstyle要素を足した`).toBe(before);
      expect(styles.inside, `${kind}の帯の内側にstyle要素を作った`).toBe(0);
      expect(styles.adopted.every((count) => count > 0), `${kind}の影の根に見た目が入っていない`).toBe(true);
      expect(styles.row).toBe("flex");
      if (styled) expect(styles.styled, `${kind}の図の見た目が帯の内側に届かない`).toBe("flex");
    }
  });

  it("frame-player-styled-inside-frame", () => {
    const { player } = frameResult(BAR.get());
    expect(player, "帯の内側の図の再生の部品に見た目が届かない").toBe("flex");
  });

  it("frame-falls-back-to-nonce-style", () => {
    const { adopted, styles } = frameResult(NONCE_STYLE.get());
    expect(adopted, "頁が adoptedStyleSheets を外せていない").toBe(false);
    expect(styles.count).toBeGreaterThan(0);
    expect(styles.nonces.every((nonce) => nonce === "n0nce"), "nonce の無いstyle要素で見た目を入れた").toBe(true);
    expect(styles.player).toBe("flex");
  });

  it("diagram-font-has-fallback-stack", () => {
    const { family } = frameResult(BAR.get());
    expect(family).toContain("Noto Sans JP Variable");
    expect(family, "図の書体に代わりの書体の並びが無い").toMatch(/sans-serif$/);
  });
});

/** 再生の帯の中身 (段の番号、釦、進み具合、題、説明の文) を囲む箱の、入れ物の左右と下の縁からの間 (px) */
interface BarRoom {
  /** 測った中身の数。帯が中身を出していない時は 0 */
  parts: number;
  left: number;
  right: number;
  bottom: number;
}

/**
 * `#host`を幅`width`にして帯つきの図を置き、同じ記法の帯の無い図を、帯の枠の`.stage`と同じ幅の`#plain`に置く (#3744)。
 * 設定を渡さなければ、どちらも段 1 の止め絵で止め、動きで線の値と並びが替わらないようにする
 */
async function mountSideBySide(page: Page, width: number, source = SOURCE, options: Record<string, unknown> = { pausedAt: 0 }): Promise<void> {
  await page.evaluate(
    ([text, hostWidth, opts]) => {
      const w = window as unknown as {
        dragonFrame: { mountFramedDiagram(host: HTMLElement, source: string, options: object): unknown };
        dragonCore: { parseNotation(text: string): { ok: boolean; diagram?: unknown }; mountDiagram(host: HTMLElement, diagram: unknown, options: object): unknown };
      };
      const host = document.getElementById("host")!;
      host.style.width = `${hostWidth}px`;
      w.dragonFrame.mountFramedDiagram(host, text, opts);
      const stage = document.querySelector(".dragon-frame")!.shadowRoot!.querySelector(".stage")!;
      const plain = document.createElement("div");
      plain.id = "plain";
      plain.style.width = `${stage.getBoundingClientRect().width}px`;
      document.body.append(plain);
      const parsed = w.dragonCore.parseNotation(text);
      if (!parsed.ok) throw new Error("帯の無い図の記法を読めない");
      w.dragonCore.mountDiagram(plain, parsed.diagram, opts);
    },
    [source, width, options] as const,
  );
  await page.evaluate(() => document.fonts.ready);
}

/** 帯つきの図は帯の枠の`.stage`から、帯の無い図は置いた`#plain`から、再生の帯の中身までの間を測る */
async function barRooms(page: Page): Promise<{ framed: BarRoom; plain: BarRoom }> {
  return page.evaluate(() => {
    const room = (scope: ParentNode, edge: Element) => {
      const outer = edge.getBoundingClientRect();
      const boxes = ['[data-dragon="step-no"]', ".dg-btns", '[data-dragon="progress"]', '[data-dragon="step-title"]', '[data-dragon="step-body"]']
        .map((selector) => scope.querySelector(selector)?.getBoundingClientRect())
        .filter((box): box is DOMRect => box !== undefined && box.width > 0 && box.height > 0);
      return {
        parts: boxes.length,
        left: Math.round(Math.min(...boxes.map((box) => box.left)) - outer.left),
        right: Math.round(outer.right - Math.max(...boxes.map((box) => box.right))),
        bottom: Math.round(outer.bottom - Math.max(...boxes.map((box) => box.bottom))),
      };
    };
    const root = document.querySelector(".dragon-frame")!.shadowRoot!;
    const plain = document.getElementById("plain")!;
    return { framed: room(root, root.querySelector(".stage")!), plain: room(plain, plain) };
  });
}

/**
 * 頁の字の間と大文字の指定 (#3787)。影の根の外から帯と図の字へ受け継がれ、エンジンが字の幅の表で測った札と箱から字がはみ出す。
 * 同じ頁でCSSを足す前と後を測り、帯と図の字が頁のCSSの無い時と同じに描かれるかを見る
 */
const PAGE_SPACING = "body{letter-spacing:.12em;word-spacing:.3em;text-transform:uppercase}";
/** 帯の頭のボタンと行の高さを変える頁のCSS (#3787)。軽い再生部品を持つサイトが置く形 */
const PAGE_BUTTONS =
  "button{background:#e11d48;color:#fff;border:0;border-radius:999px;padding:12px 24px;font-size:18px;font-weight:700;text-transform:uppercase;min-height:48px;min-width:96px;box-shadow:0 3px 0 #9f1239}div{line-height:2.4}";
/** 字の間と大文字で崩れる図。札と段の説明に英字を持つ */
const SPACING_SOURCE =
  "sequence ブラウザからログインしてAPIを呼ぶ\nbox browser as 利用者のブラウザ\nbox app as アプリ\nstep ログインを押す\n  say 利用者がlogin buttonを押す。\n  browser -> app: GET /login";

/** 頁の頭にCSSを置く。同じ頁で何度呼んでも1つのstyle要素を書き換える */
async function setPageCss(page: Page, css: string): Promise<void> {
  await page.evaluate((text) => {
    let el = document.getElementById("page-css");
    if (!el) {
      el = document.createElement("style");
      el.id = "page-css";
      document.head.append(el);
    }
    el.textContent = text;
  }, css);
  await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
}

/** `#host`に帯つきの図を、頁の下の`#plain`に同じ記法の帯の無い図を、どちらも幅760pxで置く */
async function mountBoth(page: Page, source: string): Promise<void> {
  await page.evaluate((text) => {
    const w = window as unknown as {
      dragonFrame: { mountFramedDiagram(host: HTMLElement, source: string, options: object): unknown };
      dragonCore: { parseNotation(text: string): { ok: boolean; diagram?: unknown }; mountDiagram(host: HTMLElement, diagram: unknown, options: object): unknown };
    };
    w.dragonFrame.mountFramedDiagram(document.getElementById("host")!, text, { pausedAt: 0 });
    const plain = document.createElement("div");
    plain.id = "plain";
    plain.style.width = "760px";
    document.body.append(plain);
    const parsed = w.dragonCore.parseNotation(text);
    if (!parsed.ok) throw new Error("帯の無い図の記法を読めない");
    w.dragonCore.mountDiagram(plain, parsed.diagram, { pausedAt: 0 });
  }, source);
  await page.evaluate(() => document.fonts.ready);
}

/** 字の間と大文字の計算値と、描いた幅 (px) */
interface Spacing {
  text: string;
  letterSpacing: string;
  wordSpacing: string;
  textTransform: string;
  width: number;
}

/** 帯つきの図と帯の無い図のSVGの全ての字、帯つきの図の帯の題と全てのボタンの計算値と寸法 */
async function readFrameText(page: Page): Promise<{ framed: Spacing[]; plain: Spacing[]; header: { height: number; title: Spacing; buttons: Spacing[] } }> {
  return page.evaluate(() => {
    const read = (el: Element): Spacing => {
      const style = getComputedStyle(el);
      return {
        text: el.textContent?.trim() ?? "",
        letterSpacing: style.letterSpacing,
        wordSpacing: style.wordSpacing,
        textTransform: style.textTransform,
        width: Math.round(el.getBoundingClientRect().width * 10) / 10,
      };
    };
    const texts = (svg: SVGSVGElement | null): Spacing[] => (svg ? [...svg.querySelectorAll("text")].map(read) : []);
    const root = document.querySelector(".dragon-frame")!.shadowRoot!;
    const header = root.querySelector("[data-dragon-header]")!;
    return {
      framed: texts(root.querySelector<SVGSVGElement>("svg.dg")),
      plain: texts(document.querySelector<SVGSVGElement>("#plain svg.dg")),
      header: {
        height: Math.round(header.getBoundingClientRect().height * 10) / 10,
        title: read(header.querySelector(".dg-header-title")!),
        buttons: [...header.querySelectorAll(".dg-header-actions > :is(button,a), .dg-header-actions > :not(button,a) > button")].map(read),
      },
    };
  });
}

/** `createFigureHeader`の帯の高さと、題と全てのボタンの計算値と寸法 */
interface FigureHeader {
  height: number;
  title: string;
  buttons: { text: string; height: number; boxShadow: string; minWidth: string; letterSpacing: string; textTransform: string }[];
}

/** `#host`に置いた`createFigureHeader`の帯の高さと、題と全てのボタンの計算値と寸法 */
async function readFigureHeader(page: Page): Promise<FigureHeader> {
  return page.evaluate(() => {
    const bar = document.querySelector("#host [data-dragon-header]")!;
    const round = (n: number) => Math.round(n * 10) / 10;
    const title = getComputedStyle(bar.querySelector(".dg-header-title")!);
    return {
      height: round(bar.getBoundingClientRect().height),
      title: `${title.letterSpacing} ${title.textTransform}`,
      buttons: [...bar.querySelectorAll(".dg-header-actions > :is(button,a)")].map((el) => {
        const style = getComputedStyle(el);
        return {
          text: el.textContent ?? "",
          height: round(el.getBoundingClientRect().height),
          boxShadow: style.boxShadow,
          minWidth: style.minWidth,
          letterSpacing: style.letterSpacing,
          textTransform: style.textTransform,
        };
      }),
    };
  });
}

const FRAME_TEXT = await atLoad("字の間と大文字を決める頁のCSSを足す前と後で、帯つきの図と帯の無い図の字と帯の頭を測る", () =>
  withFrame({ lang: "ja" }, async (page) => {
    await mountBoth(page, SPACING_SOURCE);
    const bare = await readFrameText(page);
    await setPageCss(page, PAGE_SPACING);
    const styled = await readFrameText(page);
    return { bare, styled };
  }),
);

const PLAYER_TEXT = await atLoad("字の間と大文字を決める頁のCSSの下で、帯の無い図の再生の帯の段の題と本文を読む", () =>
  withFrame({ lang: "ja" }, async (page) => {
    await mountBoth(page, SPACING_SOURCE);
    await setPageCss(page, PAGE_SPACING);
    return page.evaluate(() =>
      ["step-title", "step-body"].map((part) => {
        const el = document.querySelector(`#plain [data-dragon="${part}"]`);
        if (!el) return `${part} 無い`;
        const style = getComputedStyle(el);
        return `${part} ${style.letterSpacing} ${style.textTransform}`;
      }),
    );
  }),
);

/** 頁の中に置いた帯の頭を、頁のCSSを替えて測った結果。頁が帯の頭の入口を読めない時は置かない */
interface FigureHeaderSeen {
  /** 頁が帯の頭の入口 (`header.js`) を読めなかった理由 */
  headerError?: string;
  /** ボタンと行の高さを変える頁のCSSの下の帯の頭 */
  pressed?: FigureHeader;
  /** 字の間と大文字を決める頁のCSSの下の帯の頭 */
  spaced?: FigureHeader;
}

const FIGURE_HEADER = await atLoad("帯の頭を頁の中に置き、ボタンを変える頁のCSSと字の間を変える頁のCSSの下で測る", () =>
  withFrame({ lang: "ja" }, async (page): Promise<FigureHeaderSeen> => {
    // 軽い再生部品を持つサイトと同じく、帯の頭を頁の中に置き、題と4つのボタンを並べる
    await page.addScriptTag({ type: "module", content: 'import("/header.js").then((m) => { window.dragonHeader = m; }, (e) => { window.headerError = String(e); });' });
    await page.waitForFunction(() => "dragonHeader" in window || "headerError" in window);
    const headerError = await page.evaluate(() => (window as unknown as { headerError?: string }).headerError);
    if (headerError !== undefined) return { headerError };
    await page.evaluate(() => {
      const { createFigureHeader } = (
        window as unknown as { dragonHeader: { createFigureHeader: (doc: Document, options: object) => { element: HTMLElement; actions: HTMLElement } } }
      ).dragonHeader;
      const header = createFigureHeader(document, { title: "注文の流れ", mark: { href: "#", label: "dragon" } });
      const make = (tag: string, text: string): HTMLElement => {
        const el = document.createElement(tag);
        el.textContent = text;
        el.setAttribute(tag === "a" ? "href" : "type", tag === "a" ? "#" : "button");
        return el;
      };
      header.actions.append(make("button", "コード"), make("a", "エディタ"), make("button", "コピー"), make("button", "拡大"));
      document.getElementById("host")!.append(header.element);
    });
    await setPageCss(page, PAGE_BUTTONS);
    const pressed = await readFigureHeader(page);
    await setPageCss(page, PAGE_SPACING);
    const spaced = await readFigureHeader(page);
    return { pressed, spaced };
  }),
);

describe("頁のCSSが帯と図の字に入らない (#3787)", () => {
  it("frame-text-ignores-page-spacing", () => {
    const { bare, styled } = frameResult(FRAME_TEXT.get());
    expect(bare.framed.length, "帯つきの図のSVGに字が無い").toBeGreaterThan(0);
    expect(bare.plain.length, "帯の無い図のSVGに字が無い").toBeGreaterThan(0);
    // 字の間を自分で決めない字は normal と 0px と none のまま、頁のCSSの無い時と同じ幅で描く
    expect(styled.framed, "帯つきの図の字が頁の字の間と大文字を受け継いだ").toEqual(bare.framed);
    expect(styled.plain, "帯の無い図の字が頁の字の間と大文字を受け継いだ").toEqual(bare.plain);
    expect(
      styled.framed.some((text) => text.letterSpacing === "normal" && text.wordSpacing === "0px" && text.textTransform === "none"),
      "字の間を自分で決めない字が無い",
    ).toBe(true);
    // 帯の題と全てのボタンは、<a>で作るエディタも<button>と同じく頁の字の間と大文字を受けない
    expect([styled.header.title, ...styled.header.buttons].map((el) => `${el.letterSpacing} ${el.textTransform}`), "帯の題かボタンが頁の字の間と大文字を受け継いだ").toEqual(
      [styled.header.title, ...styled.header.buttons].map(() => "normal none"),
    );
    expect(styled.header, "帯の高さかボタンの幅が頁のCSSで変わった").toEqual(bare.header);
  });

  it("player-text-ignores-page-spacing", () => {
    const parts = frameResult(PLAYER_TEXT.get());
    expect(parts, "帯の無い図の再生の帯の段の題か本文が頁の字の間と大文字を受け継いだ").toEqual(["step-title normal none", "step-body normal none"]);
  });

  it("figure-header-ignores-page-css", () => {
    // 軽い再生部品を持つサイトと同じく、帯の頭を頁の中に置き、題と4つのボタンを並べる
    const header = frameResult(FIGURE_HEADER.get());
    expect(header.headerError, "頁が帯の頭の入口を読めない").toBeUndefined();
    const pressed = header.pressed!;
    expect(pressed.buttons.map((button) => button.text), "帯の頭のボタンが4つ並んでいない").toEqual(["コード", "エディタ", "コピー", "拡大"]);
    for (const button of pressed.buttons) {
      expect(
        { boxShadow: button.boxShadow, minWidth: button.minWidth, textTransform: button.textTransform },
        `頁のbuttonの指定が帯のボタン「${button.text}」に影か最小の幅か大文字を付けた`,
      ).toEqual({ boxShadow: "none", minWidth: "0px", textTransform: "none" });
    }
    expect(pressed.buttons.map((button) => button.height), "帯のボタンの高さが頁の行の高さで変わった").toEqual([30, 30, 30, 30]);
    expect(pressed.height, "帯の高さが頁のCSSで変わった").toBe(49);
    const spaced = header.spaced!;
    expect([spaced.title, ...spaced.buttons.map((button) => `${button.text} ${button.letterSpacing} ${button.textTransform}`)], "帯の題かボタンが頁の字の間と大文字を受け継いだ").toEqual([
      "normal none",
      "コード normal none",
      "エディタ normal none",
      "コピー normal none",
      "拡大 normal none",
    ]);
  });
});

/** 帯つきの図と帯の無い図のSVGの全ての要素の縁取りの有無と線の太さ */
async function readStrokes(page: Page): Promise<{ framed: string[]; plain: string[] }> {
  return page.evaluate(() => {
    const read = (svg: SVGSVGElement | null): string[] =>
      svg
        ? [svg, ...svg.querySelectorAll("*")].map((el) => {
            const style = getComputedStyle(el);
            return `${el.tagName}${el.getAttribute("class") ? `.${el.getAttribute("class")}` : ""} ${style.stroke === "none" ? "線なし" : "線あり"} ${style.strokeWidth}`;
          })
        : [];
    return {
      framed: read(document.querySelector(".dragon-frame")!.shadowRoot!.querySelector<SVGSVGElement>("svg.dg")),
      plain: read(document.querySelector<SVGSVGElement>("#plain svg.dg")),
    };
  });
}

// 並べた 2 つの図を読むだけなので、幅 760px の 3 件と幅 480px の 2 件は、幅ごとに 1 つの頁を分け合う
const SIDE_760 = await atLoad("幅 760px に帯つきの図と帯の無い図を並べ、図の縁取りと再生の帯の余白を測る", () =>
  withFrame({ lang: "ja" }, async (page) => {
    await mountSideBySide(page, 760);
    const strokes = await readStrokes(page);
    const rooms = await barRooms(page);
    return { strokes, rooms };
  }),
);

const SIDE_480 = await atLoad("幅 480px に帯つきの図と帯の無い図を並べ、再生の帯の余白を測る", () =>
  withFrame({ lang: "ja" }, async (page) => {
    await mountSideBySide(page, 480);
    return { rooms: await barRooms(page) };
  }),
);

const ICONS = await atLoad("置く人が足した釦を持つ帯つきの図を置き、帯の釦の絵柄とdragonの印の線と塗りを読む", () =>
  withFrame({ lang: "ja" }, async (page) => {
    await page.evaluate((source) => {
      const frame = (window as unknown as { dragonFrame: { mountFramedDiagram(host: HTMLElement, source: string, options: object): unknown } }).dragonFrame;
      const buttons = ["code", "editor", "copy", "export", "expand", { id: "note", label: "メモ", icon: "M4 4h16v16H4z", onClick: () => undefined }];
      frame.mountFramedDiagram(document.getElementById("host")!, source, { buttons });
    }, SOURCE);
    return page.evaluate(() => {
      const root = document.querySelector(".dragon-frame")!.shadowRoot!;
      const paint = (el: Element) => {
        const style = getComputedStyle(el);
        return { line: style.stroke !== "none", width: style.strokeWidth, filled: style.fill !== "none" };
      };
      const mark = root.querySelector(".dg-mark svg path");
      return {
        actions: [...root.querySelectorAll(".dg-header-actions svg path")].map(paint),
        mark: mark ? paint(mark) : null,
      };
    });
  }),
);

describe("帯つきの図の線と再生の帯の余白 (#3744)", () => {
  it("frame-diagram-keeps-plain-strokes", () => {
    // 帯の釦の絵柄の線の決まりが図のSVGに当たると、図の字と地の四角が字の色の 1.6px の縁取りを受け継ぐ。
    // 帯つきの図のSVGの全ての要素の縁取りの有無と線の太さが、同じ記法の帯の無い図と同じかを見る
    const { strokes } = frameResult(SIDE_760.get());
    expect(strokes.plain.length, "帯の無い図のSVGを描いていない").toBeGreaterThan(0);
    expect(strokes.framed, "帯つきの図のSVGの縁取りが帯の無い図と違う").toEqual(strokes.plain);
  });

  it("frame-icons-keep-their-lines", () => {
    // 帯の初めからの釦と、置く人が足した釦の絵柄は 1.6px の線で描き、塗らない。dragonの印は線を持たずに塗る
    const icons = frameResult(ICONS.get());
    // 絵柄はコード、エディタ、コピー、エクスポートの2つ (下向きの矢と開く印)、拡大、足した釦の7つ
    expect(icons.actions).toHaveLength(7);
    for (const icon of icons.actions) expect(icon, "帯の釦の絵柄の線が変わった").toEqual({ line: true, width: "1.6px", filled: false });
    expect(icons.mark, "dragonの印が無い").not.toBeNull();
    expect({ line: icons.mark!.line, filled: icons.mark!.filled }, "dragonの印が線を持つか塗られていない").toEqual({ line: false, filled: true });
  });

  // 760 は帯の中身が 640px より広く 1 段に並べ、480 は積んで並べる (#3398)
  describe.for([{ width: 760 }, { width: 480 }])("幅 $width", ({ width }) => {
    it("frame-bar-keeps-room-from-edges", () => {
      // 帯つきの図は図を帯の枠の幅いっぱいに置くので、1 fileのHTMLと同じく再生の帯の中身を左右の縁から 16px、下の縁から 12px 離す
      const { framed } = width === 760 ? frameResult(SIDE_760.get()).rooms : frameResult(SIDE_480.get()).rooms;
      expect(framed.parts, "帯つきの図の再生の帯が中身を出していない").toBe(5);
      expect(framed, `幅 ${width}px で、帯つきの図の再生の帯が帯の枠の縁から離れていない`).toEqual({ parts: 5, left: 16, right: 16, bottom: 12 });
    });

    it("plain-bar-leaves-room-to-page", () => {
      // 帯の無い図の再生の帯は自分では余白を付けず、置いた頁の余白に任せる (`player.ts`)
      const { plain } = width === 760 ? frameResult(SIDE_760.get()).rooms : frameResult(SIDE_480.get()).rooms;
      expect(plain, `幅 ${width}px で、帯の無い図の再生の帯が自分で余白を付けた`).toEqual({ parts: 5, left: 0, right: 0, bottom: 0 });
    });
  });
});

/** 携帯の幅で帯を測る図。`oauth.dragon`は題が2行に折り返し、`day-hours.dragon`は題が1行に収まる (#3788) */
const NARROW_SOURCES: Record<string, string> = {
  oauth: readFileSync(join(ROOT, "examples/oauth.dragon"), "utf8"),
  "day-hours": readFileSync(join(ROOT, "examples/day-hours.dragon"), "utf8"),
};

/** 頁の上の四角 (px) */
interface Edges {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

/** 帯の 1 つのボタンを測った値 */
interface HeaderControl extends Edges {
  action: string;
  /** 見えている字。字を隠したボタンは空 */
  shown: string;
  /** 読み上げの名前 (`aria-label`) */
  label: string;
  /** 見えているアイコンの数 */
  icons: number;
}

/** 帯を測った値 */
interface HeaderSeen {
  height: number;
  header: Edges;
  frame: Edges;
  titleBottom: number;
  controls: HeaderControl[];
}

/** 頁の幅を`width`にし、左右に 16px の余白を置いて`source`を帯つきで置き、帯とボタンを測る。`added`の時は置く側のボタン`メモ`を最後に足す */
async function measureHeader(page: Page, width: number, source: string, added = false): Promise<HeaderSeen> {
  await page.setViewportSize({ width, height: 900 });
  return page.evaluate(
    ([src, withAdded]) => {
      document.body.style.padding = "0 16px";
      const host = document.getElementById("host")!;
      host.style.width = "auto";
      host.replaceChildren();
      const frame = (window as unknown as { dragonFrame: { mountFramedDiagram(host: HTMLElement, source: string, options: object): unknown } }).dragonFrame;
      const buttons = ["code", "editor", "copy", "export", "expand", { id: "note", label: "メモ", onClick: () => undefined }];
      frame.mountFramedDiagram(host, src, withAdded ? { pausedAt: 0, buttons } : { pausedAt: 0 });
      const element = host.querySelector<HTMLElement>(".dragon-frame")!;
      const root = element.shadowRoot!;
      const edges = (el: Element): Edges => {
        const r = el.getBoundingClientRect();
        return { left: r.left, top: r.top, right: r.right, bottom: r.bottom };
      };
      // 字の置き場が見えず、置き場の四角と字の四角が 1px を超えて重なる字だけを見えている字に数える
      const shown = (el: Element): string => {
        const parts: string[] = [];
        const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
        for (let node = walker.nextNode(); node; node = walker.nextNode()) {
          const text = node.textContent?.trim();
          const parent = node.parentElement;
          if (!text || !parent?.checkVisibility()) continue;
          const range = document.createRange();
          range.selectNodeContents(node);
          const word = range.getBoundingClientRect();
          const place = parent.getBoundingClientRect();
          const wide = Math.min(word.right, place.right) - Math.max(word.left, place.left);
          const tall = Math.min(word.bottom, place.bottom) - Math.max(word.top, place.top);
          if (wide > 1 && tall > 1) parts.push(text);
        }
        return parts.join("");
      };
      const controls = [...root.querySelectorAll<HTMLElement>(".dg-header-actions > [data-action]")]
        .filter((el) => el.checkVisibility())
        .map((el) => {
          const control = el.matches("button,a") ? el : el.querySelector<HTMLElement>(":scope > button")!;
          return {
            action: el.dataset.action!,
            ...edges(control),
            shown: shown(control),
            label: control.getAttribute("aria-label") ?? "",
            icons: [...control.querySelectorAll("svg")].filter((svg) => svg.checkVisibility()).length,
          };
        });
      const header = root.querySelector("[data-dragon-header]")!;
      return {
        height: header.getBoundingClientRect().height,
        header: edges(header),
        frame: edges(element),
        titleBottom: root.querySelector(".dg-header-title")!.getBoundingClientRect().bottom,
        controls,
      };
    },
    [source, added] as const,
  );
}

const NARROW_HEADER = await atLoad("頁の幅360pxと1000pxに、題の長い図と短い図を帯つきで置き、帯とボタンを測る", () =>
  withFrame({ lang: "ja" }, async (page) => {
    const seen: Record<string, HeaderSeen> = {};
    for (const width of [360, 1000]) {
      for (const [name, source] of Object.entries(NARROW_SOURCES)) seen[`${width}-${name}`] = await measureHeader(page, width, source);
    }
    seen.added = await measureHeader(page, 360, NARROW_SOURCES.oauth!, true);
    return seen;
  }),
);

/** 帯の 5 つのボタン */
const FIVE = ["code", "editor", "copy", "export", "expand"];

describe("携帯の幅の帯 (#3788)", () => {
  describe.for(Object.keys(NARROW_SOURCES))("%s", (name) => {
    it("frame-header-fits-narrow-page", () => {
      // 頁の幅360pxでは、5つのボタンが字を見せない36px角のアイコンになり、題の下に1段で並ぶ
      const seen = frameResult(NARROW_HEADER.get())[`360-${name}`]!;
      expect(seen.controls.map((c) => c.action)).toEqual(FIVE);
      expect(seen.height, `頁の幅360pxの${name}の帯の高さ`).toBeLessThanOrEqual(100);
      for (const c of seen.controls) {
        expect([Math.round(c.right - c.left), Math.round(c.bottom - c.top)], `頁の幅360pxの${c.action}のボタンの大きさ`).toEqual([36, 36]);
        expect(c.shown, `頁の幅360pxで${c.action}のボタンが字を見せる`).toBe("");
        expect(c.icons, `頁の幅360pxで${c.action}のボタンにアイコンが無い`).toBe(1);
      }
      const tops = seen.controls.map((c) => c.top);
      expect(Math.max(...tops) - Math.min(...tops), "頁の幅360pxでボタンが1段に並ばない").toBeLessThan(0.5);
      expect(Math.min(...tops), "頁の幅360pxでボタンが題の下に並ばない").toBeGreaterThanOrEqual(seen.titleBottom - 0.5);
    });

    it("frame-header-buttons-stay-inside", () => {
      // 頁の幅360pxの帯で、ボタンどうしは重ならず、帯と帯の枠の外へ出ない
      const seen = frameResult(NARROW_HEADER.get())[`360-${name}`]!;
      expect(seen.controls.length, "帯のボタンを測れない").toBeGreaterThan(0);
      for (const c of seen.controls) {
        for (const edge of [seen.header, seen.frame]) {
          expect(c.left >= edge.left - 0.5 && c.right <= edge.right + 0.5 && c.top >= edge.top - 0.5 && c.bottom <= edge.bottom + 0.5, `${c.action}のボタンが帯の外へ出た`).toBe(true);
        }
      }
      const overlaps = seen.controls.flatMap((a, i) =>
        seen.controls.slice(i + 1).filter((b) => a.left < b.right - 0.5 && b.left < a.right - 0.5 && a.top < b.bottom - 0.5 && b.top < a.bottom - 0.5).map((b) => `${a.action}と${b.action}`),
      );
      expect(overlaps, "帯のボタンどうしが重なった").toEqual([]);
    });

    it("frame-header-keeps-wide-page", () => {
      // 頁の幅1000pxの帯は今と同じく高さ49pxで、5つのボタンが字とアイコンを見せて1段に並ぶ
      const seen = frameResult(NARROW_HEADER.get())[`1000-${name}`]!;
      expect(seen.height, `頁の幅1000pxの${name}の帯の高さ`).toBeCloseTo(49, 0);
      expect(seen.controls.map((c) => [c.action, c.shown])).toEqual([
        ["code", "コード"],
        ["editor", "エディタ"],
        ["copy", "コピー"],
        ["export", "エクスポート"],
        ["expand", ""],
      ]);
      for (const c of seen.controls) expect(c.icons, `頁の幅1000pxで${c.action}のボタンにアイコンが無い`).toBeGreaterThanOrEqual(1);
      const tops = seen.controls.map((c) => c.top);
      expect(Math.max(...tops) - Math.min(...tops), "頁の幅1000pxでボタンが1段に並ばない").toBeLessThan(0.5);
    });
  });

  it("frame-header-names-icon-buttons", () => {
    // 字を隠したボタンも、読み上げの名前を`aria-label`に持つ
    const seen = frameResult(NARROW_HEADER.get())["360-oauth"]!;
    expect(seen.controls.map((c) => [c.action, c.label])).toEqual([
      ["code", "コード"],
      ["editor", "dragonエディタで開く"],
      ["copy", "コピー"],
      ["export", "エクスポート"],
      ["expand", "図を拡大"],
    ]);
  });

  it("frame-header-keeps-added-button-text", () => {
    // 置く側が設定`buttons`で足したボタンは、頁の幅360pxでも字を見せたまま描く
    const seen = frameResult(NARROW_HEADER.get()).added!;
    const note = seen.controls.find((c) => c.action === "note");
    expect(note, "置く側が足したボタンが帯に無い").toBeDefined();
    expect(note!.shown, "頁の幅360pxで置く側が足したボタンの字が見えない").toBe("メモ");
  });
});

/*
 * 同梱した字を読まない頁でも、図の字と帯の字がゴシックで出る (#3847)。
 *
 * 字の変数 (`--sans` と `--mono`) は、同梱した字の後に代わりの字を並べて総称の字で終える。
 * 帯つきの図の頁と別に、jsDelivr の1行の入口の頁を `http://localhost/` に置いた Chromium で開き、script の入口と塊は build した `dist/cdn` から渡す。
 * 頁は `lang` を英語にする。日本語の頁では Chromium が日本語の既定の字 (macOS ではヒラギノ角ゴ) を選ぶため、代わりの字が無くても明朝が出ない。
 * Noto Sans JP の無い形は、頁が同梱の字の CSS を読まず、入口の並びの `"Noto Sans JP"` を在らない字の名前に替えて作る。
 * 端末に Noto Sans JP が入っていても、入っていない端末と同じ順に字を選ぶ。
 * Noto Sans JP の在る形は、同梱の字の CSS と字の file を package の依存から返す。
 * 描いた字の書体は Chromium の CDP (`CSS.getPlatformFontsForNode`) で読む。
 * 足した時は別の file に置いたが、図の種類の描く所を変えた時に選ぶ検査の数 (`related-by-kind.test.ts`) が上限を超えたので、もう選ばれるこの file に置く。
 */
const REPO = join(ROOT, "../..");
const CDN = join(DIST, "cdn");
const FONTSOURCE = join(ROOT, "node_modules/@fontsource-variable");
const CDN_SITE = "http://localhost/";
/** jsDelivr の dragon の入口と塊 */
const DRAGON_CDN = /^https:\/\/cdn\.jsdelivr\.net\/npm\/@cardenelabs\/dragon@[^/]+\/dist\/cdn\/([^?#]+)$/u;
/** jsDelivr の fontsource の字の CSS と字の file */
const FONT_CDN = /^https:\/\/cdn\.jsdelivr\.net\/npm\/@fontsource-variable\/([a-z-]+)@[^/]+\/([^?#]+)$/u;
const FONT_TYPES: Readonly<Record<string, string>> = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript",
  ".css": "text/css",
  ".woff2": "font/woff2",
};
/** 帯の題と説明文と、等幅の字の札を持つ時系列図 */
const FONT_SOURCE =
  "sequence 注文を受ける\n\nbox user as 利用者\nbox shop as 店\n\nstep 注文を送る\n  say 利用者が店に注文を送る。\n  user -> shop: order()\nstep 受付を返す\n  say 店が受付の番号を返す。\n  shop -> user: 受付\n";
/** 明朝と、欧文の明朝 (serif) の書体の名前 */
const SERIF = /Mincho|Times|Serif|明朝/iu;
/** CDP で読む字の要素の数の上限。図の字は件ごとに数十あり、全てを読むと頁の仕事が長くなる */
const READ_LIMIT = 40;

/** 頁の字の形。`missing` は同梱の字を読まず Noto Sans JP も無い形、`bundled` は同梱の字を読む形 */
type Fonts = "missing" | "bundled";

interface FontRead {
  /** 再生の部品の帯の根が持つ字の変数 */
  bar: { sans: string; mono: string };
  /** 計算した `font-family`。図の字は違う値ごとに 1 つ */
  family: { svg: string[]; title: string; body: string };
  /** Chromium が描いた書体の名前 */
  used: { svg: string[]; title: string[]; body: string[] };
}

/** 頁で描いた図の字と帯の字の書体を読む */
async function readFontFaces(page: Page): Promise<FontRead> {
  const cdp = await page.context().newCDPSession(page);
  await cdp.send("DOM.enable");
  await cdp.send("CSS.enable");
  const { root } = await cdp.send("DOM.getDocument", { depth: -1 });
  const used = async (selector: string): Promise<string[]> => {
    const { nodeIds } = await cdp.send("DOM.querySelectorAll", { nodeId: root.nodeId, selector });
    const names = new Set<string>();
    for (const nodeId of nodeIds.slice(0, READ_LIMIT)) {
      const { fonts } = await cdp.send("CSS.getPlatformFontsForNode", { nodeId });
      for (const font of fonts) names.add(font.familyName);
    }
    return [...names].sort();
  };
  const computed = await page.evaluate(() => {
    const player = document.querySelector(".dg-player");
    const style = player ? getComputedStyle(player) : undefined;
    const family = (el: Element | null): string => (el ? getComputedStyle(el).fontFamily : "");
    return {
      bar: { sans: style?.getPropertyValue("--sans").trim() ?? "", mono: style?.getPropertyValue("--mono").trim() ?? "" },
      family: {
        svg: [...new Set([...document.querySelectorAll(".dg-player svg.dg text")].map((el) => getComputedStyle(el).fontFamily))].sort(),
        title: family(document.querySelector(".dg-tt")),
        body: family(document.querySelector(".dg-tb")),
      },
    };
  });
  return { ...computed, used: { svg: await used(".dg-player svg.dg text"), title: await used(".dg-tt"), body: await used(".dg-tb") } };
}

/** `fonts` の形の jsDelivr の1行の入口の頁を開き、図の字と帯の字の書体を読む */
async function readFonts(fonts: Fonts): Promise<FontRead> {
  const context = await (await fileChromium()).newContext({ viewport: { width: 900, height: 900 }, reducedMotion: "reduce" });
  // 全ての求めを受ける。glob で全ての path を書くと、関係する検査を選ぶ命令がその字を注釈の始まりと読み、後ろの code を読み落とす (#3912)
  await context.route(() => true, async (route) => {
    const url = route.request().url();
    const dragon = DRAGON_CDN.exec(url)?.[1];
    if (dragon !== undefined) {
      const file = join(CDN, dragon);
      if (!existsSync(file)) return route.fulfill({ status: 404, body: "" });
      const body = readFileSync(file);
      // Noto Sans JP の無い形では、並びの "Noto Sans JP" だけを在らない字の名前に替える。同梱した字の "Noto Sans JP Variable" は替えない
      const served = fonts === "missing" && extname(file) === ".js" ? body.toString("utf8").replaceAll('"Noto Sans JP"', '"Noto Sans JP absent"') : body;
      return route.fulfill({ contentType: FONT_TYPES[extname(file)] ?? "application/octet-stream", body: served });
    }
    const font = FONT_CDN.exec(url);
    if (font) {
      if (fonts === "missing") return route.fulfill({ contentType: "text/css", body: "" });
      const file = join(FONTSOURCE, font[1] ?? "", font[2] ?? "");
      if (!existsSync(file)) return route.fulfill({ status: 404, body: "" });
      return route.fulfill({ contentType: FONT_TYPES[extname(file)] ?? "application/octet-stream", body: readFileSync(file) });
    }
    if (url === `${CDN_SITE}index.html`) {
      return route.fulfill({ contentType: FONT_TYPES[".html"], body: cdnPage(`<pre class="dragon">${escapeHtml(FONT_SOURCE)}</pre>`, "en") });
    }
    return route.abort();
  });
  try {
    const page = await context.newPage();
    await page.goto(`${CDN_SITE}index.html`);
    await page.waitForFunction(() => document.querySelector(".dg-player svg.dg text") !== null && Boolean(document.querySelector(".dg-tb")?.textContent), null, {
      timeout: 8_000,
    });
    await page.evaluate(() => document.fonts.ready);
    return await readFontFaces(page);
  } finally {
    await context.close();
  }
}

const MISSING_FONTS = await atLoad("同梱の字を読まず Noto Sans JP も無い形の頁を開き、図と帯の字の書体を読む", () =>
  within(readFonts("missing"), PAGE_LIMIT_MS, "Noto Sans JP の無い頁の仕事"),
);
const BUNDLED_FONTS = await atLoad("同梱の字を読む頁を開き、図と帯の字の書体を読む", () =>
  within(readFonts("bundled"), PAGE_LIMIT_MS, "同梱の字を読む頁の仕事"),
);

const repoText = (path: string): string => readFileSync(join(REPO, path), "utf8");

describe("同梱した字を読まない頁の字 (#3847)", () => {
  it("player-bar-font-has-fallback-stack", () => {
    // 帯の付かない再生の部品の帯も、図と同じ並びを持つ。
    // Noto Sans JP の無い形は入口の並びの字の名前を替えるので、並びを替えずに渡す同梱の字を読む形で読む
    const { bar } = BUNDLED_FONTS.get();
    expect(bar.sans, "帯の --sans の並び").toBe(SANS_STACK);
    expect(bar.mono, "帯の --mono の並び").toBe(MONO_STACK);
  });

  it("gothic-without-noto", () => {
    const { family, used } = MISSING_FONTS.get();
    expect(used.svg.length, "図の字の書体を読めない").toBeGreaterThan(0);
    expect(used.title.length, "帯の題の書体を読めない").toBeGreaterThan(0);
    expect(used.body.length, "帯の説明文の書体を読めない").toBeGreaterThan(0);
    expect([...used.svg, ...used.title, ...used.body].filter((name) => SERIF.test(name)), "明朝か Times で描いた字の書体").toEqual([]);
    for (const value of family.svg) expect(value, "図の字の font-family").toMatch(/(?:sans-serif|monospace)$/u);
    expect(family.title, "帯の題の font-family").toMatch(/sans-serif$/u);
    expect(family.body, "帯の説明文の font-family").toMatch(/sans-serif$/u);
  });

  it("same-font-with-noto", () => {
    // 同梱の字を読む頁では、今と同じく同梱した 2 つの字だけで描く
    const { used } = BUNDLED_FONTS.get();
    const all = [...used.svg, ...used.title, ...used.body];
    expect(all.length, "字の書体を読めない").toBeGreaterThan(0);
    expect(all.filter((name) => !/^(?:Noto Sans JP|JetBrains Mono)\b/u.test(name)), "同梱した字の他の書体").toEqual([]);
  });

  it("docs-describe-gothic-fallback", () => {
    // 同梱の字を読まない頁で何が起きるかを、使い方の頁、package の README、プラグインの文書が同じく書く
    const readme = repoText("packages/dragon/README.md");
    const readmeJa = repoText("packages/dragon/README.ja.md");
    const content = repoText("apps/playground-spa/src/docs/content.ts");
    const setup = repoText("plugins/dragon/skills/dragon/references/setup.md");
    expect(readme, "README.md が字の幅の違いを書かない").toContain("a few pixels wider");
    expect(setup, "setup.md が字の幅の違いを書かない").toContain("a few pixels wider");
    expect(content, "使い方の頁の英語が字の幅の違いを書かない").toContain("a few pixels wider");
    expect(readmeJa, "README.ja.md が字の幅の違いを書かない").toContain("数px広くなることがある");
    expect(content, "使い方の頁の日本語が字の幅の違いを書かない").toContain("数px広くなることがある");
    for (const [where, body] of [
      ["README.md", readme],
      ["README.ja.md", readmeJa],
      ["使い方の頁", content],
    ] as const) {
      expect(body, `${where} が字がはみ出すと書いたまま`).not.toContain("drawn in the device's fonts and text can overflow");
      expect(body, `${where} が字がはみ出すと書いたまま`).not.toContain("端末の字で描かれ、札から字がはみ出す");
    }
    // dragon embed で埋めた頁と保存した HTML も、同梱の字の後に並べた端末の字で描く
    expect(readme).not.toContain("draws in the device's fonts because the bundled fonts are not embedded");
    expect(readmeJa).not.toContain("同梱の字を埋めないので端末の字で描く");
    // 仕様で確かめ方の欄に `render-uses-bundled-fonts` を名指す行は、条件の欄に端末の字に落ちないと書かない。
    // この課題の文書の受入条件の行は、条件の文の中でこの言い回しを引くので、行の全体ではなく確かめ方の欄で選ぶ
    const rows = repoText(".ikkan/specs/diagram-core.md")
      .split("\n")
      .map((line) => line.split(" | "))
      .filter((cells) => cells.length >= 3 && (cells[1] ?? "").includes("`render-uses-bundled-fonts`"));
    expect(rows.length, "仕様に render-uses-bundled-fonts を確かめ方に名指す行が無い").toBeGreaterThan(0);
    expect(rows.map((cells) => cells[0] ?? "").filter((criterion) => criterion.includes("端末の字に落ちない")), "端末の字に落ちないと書く仕様の行").toEqual([]);
  });
});

/** 再生の帯の検査 (#3752) に使う時系列図。段は3つで、どの段の説明文も幅760pxの広い帯で2行以上に折れる */
const STEPPED = [
  "sequence 注文",
  "box a as あなた",
  "box b as 店",
  "step 頼む",
  "  say あなたが店に、品と数と届け先を書いた注文を送る。店は注文を受けた時刻と、届け先が配れる場所かを記録し、受け付けたことをあなたへ返す。",
  "  a -> b: 注文",
  "step 確かめる",
  "  say 店は在庫と届く日を確かめ、足りない品が在る時は代わりの品を挙げる。確かめ終えたら、届く日と払う額をあなたへ返し、あなたの承認を待つ。",
  "  b -> a: 届く日と額",
  "step 承認する",
  "  say あなたが届く日と額を承認すると、店は品を押さえて手配を始める。承認しなければ、店は押さえた品を戻して注文を閉じ、あなたへ閉じたことを返す。",
  "  a -> b: 承認",
].join("\n");

/** 段を送る4つの釦の名前 */
const STEP_BUTTONS = ["restart", "prev", "toggle", "next"] as const;

/** 箱と区画の絵柄の後ろの四角を持つ構成図 (#3752) */
const ARCHITECTURE = ["architecture 配り方", "group web as 頁 [icon: app]", "  box app as アプリ [icon: app]", "  box cdn as 配る所 [icon: server]", "end", "step 読む", "  app -> cdn: 読む"].join("\n");

/** 頁の中の釦の箱 (px) */
interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** CSSの色の字 (`rgb(r, g, b)`) を赤と緑と青の3つの数にする */
const channels = (color: string): number[] => (color.match(/\d+(?:\.\d+)?/gu) ?? []).slice(0, 3).map(Number);

/**
 * 釦を撮り、絵柄の画素の外接矩形の真ん中が、釦の真ん中から横と縦に何pxずれるかを返す。
 * 絵柄の画素は、地の色から字の色までの隔たりの半分より字の色に寄った画素で、地に近い色の縁の線と角の外の頁は数えない
 */
async function inkOffset(page: Page, box: Box, ink: string, ground: string): Promise<{ dx: number; dy: number } | null> {
  const clip = {
    x: Math.floor(box.x),
    y: Math.floor(box.y),
    width: Math.ceil(box.x + box.w) - Math.floor(box.x),
    height: Math.ceil(box.y + box.h) - Math.floor(box.y),
  };
  const image = PNG.sync.read(await page.screenshot({ clip, fullPage: true }));
  const [ir = 0, ig = 0, ib = 0] = channels(ink);
  const [gr = 0, gg = 0, gb = 0] = channels(ground);
  const far = Math.hypot(ir - gr, ig - gg, ib - gb);
  let left = Number.POSITIVE_INFINITY;
  let right = Number.NEGATIVE_INFINITY;
  let top = Number.POSITIVE_INFINITY;
  let bottom = Number.NEGATIVE_INFINITY;
  for (let y = 0; y < image.height; y++) {
    for (let x = 0; x < image.width; x++) {
      const i = (y * image.width + x) * 4;
      const near = Math.hypot((image.data[i] ?? 0) - gr, (image.data[i + 1] ?? 0) - gg, (image.data[i + 2] ?? 0) - gb);
      if (near < far / 2) continue;
      left = Math.min(left, x);
      right = Math.max(right, x + 1);
      top = Math.min(top, y);
      bottom = Math.max(bottom, y + 1);
    }
  }
  // 絵柄の画素が無い時は、読み込む段で投げずに件へ返し、件が落とす
  if (!Number.isFinite(left)) return null;
  return { dx: (left + right) / 2 - (box.x + box.w / 2 - clip.x), dy: (top + bottom) / 2 - (box.y + box.h / 2 - clip.y) };
}

/**
 * 進み具合の帯の段ごとの塗りの割合と、塗りの色。`scope`の選び方の字 (`#plain`か帯の枠) で、帯の無い図か帯つきの図を読む。
 * 塗りの要素 (`::after`) が無い段は0、変形の無い塗りは塗り切った1
 */
function readFills(page: Page, scope: "framed" | "plain"): Promise<{ state: string; height: number; scale: number; color: string }[]> {
  return page.evaluate((where) => {
    const root: ParentNode = where === "framed" ? document.querySelector(".dragon-frame")!.shadowRoot! : document.getElementById("plain")!;
    return [...root.querySelectorAll<HTMLElement>('[data-dragon="segment"]')].map((seg) => {
      const fill = getComputedStyle(seg, "::after");
      const matrix = /^matrix\(([^,]+),/u.exec(fill.transform);
      const scale = fill.content === "none" || fill.content === "" ? 0 : fill.transform === "none" ? 1 : matrix ? Number(matrix[1]) : Number.NaN;
      return { state: seg.dataset.state ?? "", height: seg.getBoundingClientRect().height, scale, color: fill.backgroundColor };
    });
  }, scope);
}

/** 再生の釦の地の色。呼び出しの色 (`--c-blue`) で塗る */
function toggleColor(page: Page, scope: "framed" | "plain"): Promise<string> {
  return page.evaluate((where) => {
    const root: ParentNode = where === "framed" ? document.querySelector(".dragon-frame")!.shadowRoot! : document.getElementById("plain")!;
    return getComputedStyle(root.querySelector<HTMLElement>('button[data-dragon="toggle"]')!).backgroundColor;
  }, scope);
}

/** 再生の釦1つの、置いた所と絵柄の枠と、撮った画像の絵柄の真ん中の釦の真ん中からのずれ。絵柄の画素が無い時のずれは`null` */
interface ButtonSeen {
  where: string;
  name: string;
  box: Box | null;
  icon: { w: number; h: number } | null;
  offset: { dx: number; dy: number } | null;
}

// 再生の帯の検査 (#3752) の頁の仕事は読み込む段で済ませ、件は結果を読む。件の中で頁を開くと、混んだ機械で1件10秒の上限を超える (#3816、#3912)。
// 件ごとに図と幅と止める段が違うので、頁は件ごとに1つずつ持つ
// 760 は帯の中身が 640px より広く 1 段に並べ、480 は積んで並べる (#3398)
const ICON_WIDTHS = [760, 480] as const;

/** 幅ごとの、帯つきの図と帯の無い図の再生の釦 */
const PLAYER_ICONS = new Map<number, Loaded<Framed<ButtonSeen[]>>>();
for (const width of ICON_WIDTHS) {
  PLAYER_ICONS.set(
    width,
    await atLoad(`幅${width}pxで帯つきの図と帯の無い図を並べ、再生の釦の絵柄を撮る`, () =>
      withFrame({ lang: "ja" }, async (page): Promise<ButtonSeen[]> => {
        await mountSideBySide(page, width, STEPPED);
        const buttons = await page.evaluate((names) => {
          const scopes: [string, ParentNode][] = [
            ["帯つきの図", document.querySelector(".dragon-frame")!.shadowRoot!],
            ["帯の無い図", document.getElementById("plain")!],
          ];
          return scopes.flatMap(([where, scope]) =>
            names.map((name) => {
              const button = scope.querySelector<HTMLElement>(`button[data-dragon="${name}"]`);
              const box = button?.getBoundingClientRect();
              const icon = button?.querySelector<HTMLElement>(".dg-btn-ic")?.getBoundingClientRect();
              const style = button ? getComputedStyle(button) : undefined;
              return {
                where,
                name,
                box: box ? { x: box.x + window.scrollX, y: box.y + window.scrollY, w: box.width, h: box.height } : null,
                icon: icon ? { w: icon.width, h: icon.height } : null,
                ink: style?.color ?? "",
                ground: style?.backgroundColor ?? "",
              };
            }),
          );
        }, STEP_BUTTONS);
        const seen: ButtonSeen[] = [];
        for (const { ink, ground, ...button } of buttons) seen.push({ ...button, offset: button.box ? await inkOffset(page, button.box, ink, ground) : null });
        return seen;
      }),
    ),
  );
}

/** 図の箱と区画と中身の帯の絵柄の後ろの四角の、描いた幅と書いた幅 */
const TILES = await atLoad("帯つきの図と帯の無い図に構成図を並べ、絵柄の後ろの四角の幅を読む", () =>
  withFrame({ lang: "ja" }, async (page) => {
    await mountSideBySide(page, 760, ARCHITECTURE);
    return page.evaluate(() => {
      const scopes: [string, ParentNode][] = [
        ["帯つきの図", document.querySelector(".dragon-frame")!.shadowRoot!],
        ["帯の無い図", document.getElementById("plain")!],
      ];
      return scopes.flatMap(([where, scope]) =>
        [...scope.querySelectorAll<SVGRectElement>("svg.dg rect.dg-ic, svg.dg rect.dg-bi")].map((tile) => ({
          where,
          drawn: getComputedStyle(tile).width,
          written: `${tile.getAttribute("width")}px`,
        })),
      );
    });
  }),
);

/** 広い帯の、段の説明文の行の数と、文の塊と釦の段の縦の真ん中 */
const CAPTIONS = await atLoad("幅760pxの帯に段の説明文が2行に折れる時系列図を並べ、釦の段と文の塊の真ん中を読む", () =>
  withFrame({ lang: "ja" }, async (page) => {
    await mountSideBySide(page, 760, STEPPED);
    return page.evaluate(() => {
      const scopes: [string, ParentNode][] = [
        ["帯つきの図", document.querySelector(".dragon-frame")!.shadowRoot!],
        ["帯の無い図", document.getElementById("plain")!],
      ];
      return scopes.map(([where, scope]) => {
        const say = scope.querySelector(".dg-say")!.getBoundingClientRect();
        const buttons = scope.querySelector(".dg-btns")!.getBoundingClientRect();
        const body = scope.querySelector<HTMLElement>('[data-dragon="step-body"]')!;
        const lines = Math.round(body.getBoundingClientRect().height / Number.parseFloat(getComputedStyle(body).lineHeight));
        return { where, lines, say: (say.top + say.bottom) / 2, buttons: (buttons.top + buttons.bottom) / 2 };
      });
    });
  }),
);

/** 段2で止めた図の、帯つきの図と帯の無い図の進み具合の段と再生の釦の地の色 */
const PAUSED_FILLS = await atLoad("段2で止めた時系列図を並べ、進み具合の帯の塗りを読む", () =>
  withFrame({ lang: "ja" }, async (page) => {
    // 塗りが移る動き (120ms) の後に測る
    await mountSideBySide(page, 760, STEPPED, { pausedAt: 1 });
    await page.waitForTimeout(400);
    const out: { where: string; segments: Awaited<ReturnType<typeof readFills>>; blue: string }[] = [];
    for (const [scope, where] of [["framed", "帯つきの図"], ["plain", "帯の無い図"]] as const) out.push({ where, segments: await readFills(page, scope), blue: await toggleColor(page, scope) });
    return out;
  }),
);

/** 段1の止め絵から流した帯の無い図の、段2へ移った後に2度測った今の段と塗りの割合 */
const GROWING = await atLoad("段1から半分の速さで流した時系列図の、今の段の帯の塗りを2度測る", () =>
  withFrame({ lang: "ja" }, async (page) => {
    // 段1の止め絵から流すと、止め絵の後の残りの時間 (MOTION.still) を流してから段2へ移る。速さを半分にし、段2へ移った後に2度測る
    await mountSideBySide(page, 760, STEPPED, { pausedAt: 0, speed: 0.5 });
    await page.locator('#plain button[data-dragon="toggle"]').click();
    await page.waitForFunction(() => document.querySelector<HTMLElement>('#plain [data-dragon="segment"][data-step="1"]')?.dataset.state === "now", null, { timeout: 4000 });
    const read = async (): Promise<{ now: number; scale: number }> => {
      const segments = await readFills(page, "plain");
      const now = segments.findIndex((seg) => seg.state === "now");
      return { now, scale: segments[now]?.scale ?? Number.NaN };
    };
    await page.waitForTimeout(300);
    const before = await read();
    await page.waitForTimeout(400);
    const after = await read();
    return { before, after };
  }),
);

describe("再生の帯の釦と進み具合 (#3752)", () => {
  describe.for(ICON_WIDTHS.map((width) => ({ width })))("幅 $width", ({ width }) => {
    it("player-icons-centered-in-buttons", () => {
      // 釦の絵柄は縦横18pxの枠に描き、撮った画像の絵柄の真ん中を釦の真ん中に置く。再生の釦は絵柄と名前を合わせて真ん中に置く
      const loaded = PLAYER_ICONS.get(width);
      expect(loaded, `幅 ${width}px の釦を読み込む段で撮っていない`).toBeDefined();
      for (const button of frameResult(loaded!.get())) {
        const label = `幅 ${width}px の${button.where}の${button.name}の釦`;
        expect(button.box, `${label}が無い`).not.toBeNull();
        expect(button.icon, `${label}の絵柄の枠`).toEqual({ w: 18, h: 18 });
        expect(button.offset, `${label}を撮った画像に絵柄の画素が無い`).not.toBeNull();
        const { dx, dy } = button.offset!;
        expect(Math.abs(dx), `${label}の絵柄が釦の真ん中から横に ${dx}px ずれた`).toBeLessThanOrEqual(1);
        expect(Math.abs(dy), `${label}の絵柄が釦の真ん中から縦に ${dy}px ずれた`).toBeLessThanOrEqual(1);
      }
    });
  });

  it("player-icons-leave-figure-tiles", () => {
    // 再生の釦の絵柄の見た目は、図の箱と区画と中身の帯の絵柄の後ろの四角 (`rect.dg-ic`、`rect.dg-bi`) に当たらない。
    // 当たると四角が縮んで左上に寄り、絵柄が四角から右下へはみ出す
    const tiles = frameResult(TILES.get());
    expect(tiles.length, "図に絵柄の後ろの四角が無い").toBeGreaterThan(0);
    for (const tile of tiles) expect(tile.drawn, `${tile.where}の絵柄の後ろの四角の幅が書いた幅と違う`).toBe(tile.written);
  });

  it("player-buttons-center-on-caption", () => {
    // 広い帯の釦の段は、段の番号と題と説明文の塊の真ん中に揃え、説明文が何行でも塊の上の端に寄らない
    for (const row of frameResult(CAPTIONS.get())) {
      expect(row.lines, `${row.where}の段の説明文が2行以上に折れていない`).toBeGreaterThanOrEqual(2);
      expect(Math.abs(row.buttons - row.say), `${row.where}の釦の段が文の塊の真ん中から ${row.buttons - row.say}px ずれた`).toBeLessThanOrEqual(1);
    }
  });

  it("player-progress-fills-done-and-now", () => {
    // 段2で止めた図は、段1を呼び出しの色で塗り切り、段2をほぼ塗り切り、段3を塗らない
    for (const { where, segments, blue } of frameResult(PAUSED_FILLS.get())) {
      expect(segments.map((s) => s.state), `${where}の進み具合の段の状態`).toEqual(["done", "now", "todo"]);
      expect(segments.map((s) => s.height), `${where}の進み具合の帯の高さ`).toEqual([6, 6, 6]);
      const [done, now, todo] = segments;
      expect(done?.scale, `${where}の済んだ段1の塗りの割合`).toBe(1);
      expect(done?.color, `${where}の済んだ段1の塗りが呼び出しの色でない`).toBe(blue);
      expect(now?.scale, `${where}の今の段2の塗りの割合`).toBeGreaterThanOrEqual(0.95);
      expect(todo?.scale, `${where}のまだの段3の塗りの割合`).toBe(0);
    }
  });

  it("player-progress-now-grows-while-playing", () => {
    // 流している今の段の帯は、流した時間の分だけ左から塗り進める
    const { before, after } = frameResult(GROWING.get());
    expect(before.scale, "流している今の段の帯を塗っていない").toBeGreaterThan(0);
    expect(before.scale, "流し始めたばかりの今の段の帯を塗り切った").toBeLessThan(1);
    expect(after.now, "2度測る間に今の段が替わった").toBe(before.now);
    expect(after.scale, "400ms後の今の段の塗りが増えていない").toBeGreaterThan(before.scale);
    expect(after.scale, "400ms後の今の段の帯を塗り切った").toBeLessThan(1);
  });
});

/**
 * 頁のボタンのCSS (#3799)。帯の頭を確かめた`PAGE_BUTTONS`に、字の間と余白と変形と字の影と下線と行の高さと最大の高さを足す。
 * 帯の無い図のボタンは頁の中に直に在るので、頁の`button`の指定が`.dg-btn`の決めない性質へそのまま入る
 */
const PAGE_BUTTONS_MORE = `${PAGE_BUTTONS}button{letter-spacing:4px;margin:6px;transform:translateY(2px);text-shadow:0 1px 0 #000;text-decoration:underline;line-height:3;max-height:20px}`;
/** 場面を選ぶ札を持つ帯の無い場面の図 (#3799) */
const SCENE_PICK_SOURCE =
  "flow 送金 [scenes: pick]\n\nbox ask as 送金を頼む\nbox send as 送る\nbox back as 差し戻す\n\n" +
  "step 頼む\n  say 利用者が送金を頼む。\n  start -> ask\n\n" +
  "scene 通る送金\n  step 送る\n    say 宛先が正しいので送る。\n    ask -> send: 正しい\nend\n\n" +
  "scene 宛先が違う送金\n  step 差し戻す\n    say 宛先が違うので差し戻す。\n    ask -> back: 違う\n    stop 宛先が登録されていない\nend\n";
/** 押すと箱の下に札を出す帯の無い図 (#3799)。店の箱だけが札を持つ */
const NOTE_POP_SOURCE = "sequence 注文 [note: pop]\n\nbox shop as 店 [note: 代金を受け取る]\nbox bank as 銀行\n\nstep 頼む\n  say 店が銀行に代金を頼む。\n  shop -> bank: 代金\n";
/** 帯の無い図を置く所と、置く記法。手順の図、配管の図、場面の図、箱の札を持つ図 */
const PLAIN_KINDS: Record<string, string> = {
  seq: SOURCE,
  pipe: readFileSync(join(ROOT, "examples/swap-retry.dragon"), "utf8"),
  scene: SCENE_PICK_SOURCE,
  note: NOTE_POP_SOURCE,
};

/** ボタンの計算値と描いた寸法 */
interface ButtonLook {
  name: string;
  boxShadow: string;
  textTransform: string;
  letterSpacing: string;
  margin: string;
  transform: string;
  textShadow: string;
  textDecorationLine: string;
  maxHeight: string;
  height: number;
  width: number;
}

/** 帯の無い図ごとの、再生の帯の高さと、帯のボタン、拡大と縮小のボタン、場面を選ぶ札、札を閉じるボタン */
interface PlainButtons {
  barHeight: Record<string, number>;
  bar: Record<string, ButtonLook[]>;
  zoom: ButtonLook[];
  picks: ButtonLook[];
  close: ButtonLook[];
}

/** 置いた帯の無い図の全てのボタンを測る */
async function readPlainButtons(page: Page): Promise<PlainButtons> {
  return page.evaluate((names) => {
    const round = (n: number): number => Math.round(n * 10) / 10;
    const read = (el: Element): ButtonLook => {
      const style = getComputedStyle(el);
      const box = el.getBoundingClientRect();
      return {
        name: el.getAttribute("data-dragon") ?? "",
        boxShadow: style.boxShadow,
        textTransform: style.textTransform,
        letterSpacing: style.letterSpacing,
        margin: style.margin,
        transform: style.transform,
        textShadow: style.textShadow,
        textDecorationLine: style.textDecorationLine,
        maxHeight: style.maxHeight,
        height: round(box.height),
        width: round(box.width),
      };
    };
    const hostOf = (name: string): Element => document.getElementById(`plain-${name}`)!;
    const all = (name: string, selector: string): ButtonLook[] => [...hostOf(name).querySelectorAll(selector)].map(read);
    return {
      barHeight: Object.fromEntries(names.map((name) => [name, round(hostOf(name).querySelector(".dg-bar")?.getBoundingClientRect().height ?? 0)])),
      bar: Object.fromEntries(names.map((name) => [name, all(name, ".dg-btns button")])),
      zoom: all("pipe", ".dg-zm button"),
      picks: all("scene", '[data-dragon="scene-pick"]'),
      close: all("note", '[data-dragon="note-close"]'),
    };
  }, Object.keys(PLAIN_KINDS));
}

const PLAIN_BUTTONS = await atLoad("帯の無い図を4種類置き、頁のボタンのCSSを足す前と後で全てのボタンを測る", () =>
  withFrame({ lang: "ja" }, async (page) => {
    await page.evaluate((kinds) => {
      const core = (
        window as unknown as {
          dragonCore: { parseNotation(text: string): { ok: boolean; diagram?: unknown }; mountDiagram(host: HTMLElement, diagram: unknown, options: object): unknown };
        }
      ).dragonCore;
      for (const [name, text] of Object.entries(kinds)) {
        const host = document.createElement("div");
        host.id = `plain-${name}`;
        host.style.width = "760px";
        document.body.append(host);
        const parsed = core.parseNotation(text);
        if (!parsed.ok) throw new Error(`帯の無い図 ${name} の記法を読めない`);
        core.mountDiagram(host, parsed.diagram, { pausedAt: 0 });
      }
      // 札を閉じるボタンは開いた札にだけ描かれるので、店の札を開いて置く
      document.querySelector('#plain-note [data-dragon="note-card"]')?.setAttribute("data-open", "");
    }, PLAIN_KINDS);
    await page.evaluate(() => document.fonts.ready);
    const bare = await readPlainButtons(page);
    await setPageCss(page, PAGE_BUTTONS_MORE);
    const styled = await readPlainButtons(page);
    return { bare, styled };
  }),
);

describe("頁のbuttonの指定が帯の無い図のボタンに入らない (#3799)", () => {
  it("plain-bar-buttons-ignore-page-button-css", () => {
    const { bare, styled } = frameResult(PLAIN_BUTTONS.get());
    expect(
      bare.bar.seq.map((button) => button.name),
      "帯の無い図の再生の帯のボタンが4つ並んでいない",
    ).toEqual(["restart", "prev", "toggle", "next"]);
    expect(styled.bar.seq, "頁のbuttonの指定が帯の無い図の再生の帯のボタンの見た目か寸法を変えた").toEqual(bare.bar.seq);
  });

  it("plain-bar-height-ignores-page-button-css", () => {
    const { bare, styled } = frameResult(PLAIN_BUTTONS.get());
    expect(bare.barHeight.seq, "帯の無い図の再生の帯を測れない").toBeGreaterThan(0);
    expect(styled.barHeight.seq, "頁のbuttonの指定が帯の無い図の再生の帯の高さを変えた").toBe(bare.barHeight.seq);
  });

  it("plain-zoom-buttons-ignore-page-button-css", () => {
    const { bare, styled } = frameResult(PLAIN_BUTTONS.get());
    expect(
      bare.zoom.map((button) => button.name),
      "帯の無い配管の図に拡大と縮小のボタンが無い",
    ).toEqual(["zoom-out", "zoom-in"]);
    expect(styled.zoom, "頁のbuttonの指定が拡大と縮小のボタンの見た目か寸法を変えた").toEqual(bare.zoom);
    expect(styled.bar.pipe, "頁のbuttonの指定が配管の図の再生の帯のボタンを変えた").toEqual(bare.bar.pipe);
  });

  it("plain-scene-buttons-ignore-page-button-css", () => {
    const { bare, styled } = frameResult(PLAIN_BUTTONS.get());
    expect(bare.picks.length, "帯の無い場面の図に場面を選ぶ札が2つ無い").toBe(2);
    expect(bare.bar.scene.length, "帯の無い場面の図の帯にボタンが4つ無い").toBe(4);
    expect(styled.picks, "頁のbuttonの指定が場面を選ぶ札の見た目か寸法を変えた").toEqual(bare.picks);
    expect(styled.bar.scene, "頁のbuttonの指定が場面の図の帯のボタンの見た目か寸法を変えた").toEqual(bare.bar.scene);
  });

  it("plain-note-close-ignores-page-button-css", () => {
    const { bare, styled } = frameResult(PLAIN_BUTTONS.get());
    expect(bare.close.length, "開いた箱の札に閉じるボタンが無い").toBe(1);
    expect(bare.close[0]?.height, "開いた箱の札の閉じるボタンを測れない").toBeGreaterThan(0);
    expect(styled.close, "頁のbuttonの指定が箱の札を閉じるボタンの見た目か寸法を変えた").toEqual(bare.close);
  });

  it("plain-bar-buttons-keep-bare-size", () => {
    const { bare } = frameResult(PLAIN_BUTTONS.get());
    const size = LOOK.player.button;
    expect(
      bare.bar.seq.map((button) => button.height),
      "頁のCSSが無い時の再生の帯のボタンの高さ",
    ).toEqual([size, size, size, size]);
    expect(
      bare.bar.seq.filter((button) => button.name !== "toggle").map((button) => button.width),
      "頁のCSSが無い時のやり直しと前と次のボタンの幅",
    ).toEqual([size, size, size]);
  });
});
