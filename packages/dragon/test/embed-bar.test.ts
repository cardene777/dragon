/**
 * 外のサービスが置く帯つきの図の帯 (#3695)。
 *
 * 帯は題の左にdragonの印を置き、コード、エディタ、コピー、エクスポート、拡大を枠のあるボタンで並べる。
 * コピーとエクスポートは窓を開き、窓は1つだけ開く。帯の字は設定`lang`、置いた所から上の`lang`属性、英語の順で決める。
 * 帯と図の見た目はstyle要素を作らずに`adoptedStyleSheets`で帯の内側へ入れ、使えない頁では`nonce`を付けたstyle要素で入れる。
 *
 * 見た目の計算とクリップボードと書き出しを本物で確かめるため、build した`dist/frame.js`を`http://localhost/`の頁で読む。
 * 入口が読む本体は import map で`dist/index.js`へ、詰める道具 (`gifenc`と`mediabunny`) は node_modules の file へ向ける。
 */
import { existsSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join, resolve } from "node:path";
import { PNG } from "pngjs";
import type { Page } from "playwright-core";
import { describe, expect, it } from "vitest";
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

interface PageSetup {
  /** `<html>`の`lang`属性。書かない時は属性を置かない */
  lang?: string;
  /** 入口を読む前に頁で回す script */
  before?: string;
}

/** 帯の入口を読んだ頁を開いて`run`を回す。頁は file で 1 つの Chromium の文脈ごとに開いて閉じる (#3424) */
async function withFrame<T>(setup: PageSetup, run: (page: Page) => Promise<T>): Promise<T> {
  expect(existsSync(join(DIST, "frame.js")), "帯の入口の build した file (dist/frame.js) が無い").toBe(true);
  const lang = setup.lang ? ` lang="${setup.lang}"` : "";
  const html =
    `<!doctype html><html${lang}><head><meta charset="utf-8">` +
    '<script type="importmap">{"imports":{"@cardenelabs/dragon":"/index.js","gifenc":"/gifenc.js","mediabunny":"/mediabunny.js"}}</script>' +
    '<style>html,body{margin:0}</style></head><body><div id="host" style="width:760px"></div>' +
    `<script>${setup.before ?? ""}</script>` +
    '<script type="module">import("/frame.js").then((m) => { window.dragonFrame = m; }, (e) => { window.frameError = String(e); });</script></body></html>';
  const context = await (await fileChromium()).newContext({ viewport: { width: 900, height: 900 }, acceptDownloads: true });
  try {
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
    expect(await page.evaluate(() => (window as unknown as { frameError?: string }).frameError), "頁が帯の入口を読めない").toBeUndefined();
    return await run(page);
  } finally {
    await context.close();
  }
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

/** 窓を開く釦の数。0 の時は判定で落とし、無い釦を押して待たない */
async function expectToggle(page: Page, action: string): Promise<void> {
  const count = await page.locator(`.dg-header-actions > [data-action="${action}"] > button`).count();
  expect(count, `帯に${action}の窓を開く釦が無い`).toBe(1);
}

/** 頁のクリップボードの字 */
const clipboardText = (page: Page): Promise<string> => page.evaluate(() => navigator.clipboard.readText());

/** 帯の知らせの欄の字 */
const statusText = (page: Page): Promise<string> =>
  page.evaluate(() => document.querySelector(".dragon-frame")!.shadowRoot!.querySelector(".status")?.textContent ?? "");

describe("帯の並び", () => {
  it("bar-lists-mark-and-five-buttons-in-order", () =>
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
            return style.borderTopStyle !== "none" && Number.parseFloat(style.borderTopWidth) > 0;
          }),
        };
      });
      expect(bar.markLeftOfTitle, "題の左にdragonの印が無い").toBe(true);
      expect(bar.order).toEqual(["code", "editor", "copy", "export", "expand"]);
      expect(bar.framed).toEqual([true, true, true, true, true]);
    }));

  it("bar-mark-opens-gallery", () =>
    withFrame({ lang: "ja" }, async (page) => {
      await mount(page);
      const mark = page.locator(".dg-header-row a.dg-mark");
      expect(await mark.count(), "帯にdragonの印が無い").toBe(1);
      expect(await mark.getAttribute("target")).toBe("_blank");
      expect(await mark.getAttribute("rel")).toContain("noopener");
      const [popup] = await Promise.all([page.waitForEvent("popup", { timeout: 4000 }), mark.click()]);
      expect(popup.url()).toBe(GALLERY);
    }));

  it("bar-expand-is-icon-only", () =>
    withFrame({ lang: "ja" }, async (page) => {
      await mount(page);
      const expand = await page.evaluate(() => {
        const el = document.querySelector(".dragon-frame")!.shadowRoot!.querySelector<HTMLElement>('.dg-header-actions > [data-action="expand"]');
        return el ? { text: el.textContent?.trim() ?? "", icon: el.querySelector("svg") !== null, label: el.getAttribute("aria-label") ?? "" } : undefined;
      });
      expect(expand, "帯に拡大のボタンが無い").toBeDefined();
      expect(expand!.text).toBe("");
      expect(expand!.icon).toBe(true);
      expect(expand!.label).toBe("図を拡大");
    }));
});

describe("コピーの窓", () => {
  it("bar-copy-menu-writes-clipboard", () =>
    withFrame({ lang: "ja" }, async (page) => {
      await mount(page);
      await expectToggle(page, "copy");
      const toggle = page.locator('.dg-header-actions > [data-action="copy"] > button');
      await toggle.click();
      const items = await page.evaluate(() =>
        [...document.querySelector(".dragon-frame")!.shadowRoot!.querySelectorAll<HTMLElement>('[data-menu="copy"] [data-copy]')].map((el) => ({ key: el.dataset.copy, text: el.textContent?.trim() })),
      );
      expect(items).toEqual([
        { key: "source", text: "記法" },
        { key: "image", text: "画像" },
        { key: "url", text: "エディタのURL" },
      ]);
      await page.locator('[data-menu="copy"] [data-copy="source"]').click();
      await expect.poll(() => clipboardText(page), { timeout: 3000 }).toBe(SOURCE);
      const copied = await statusText(page);
      const editor = await page.locator('.dg-header-actions > [data-action="editor"]').getAttribute("href");
      await toggle.click();
      await page.locator('[data-menu="copy"] [data-copy="url"]').click();
      await expect.poll(() => clipboardText(page), { timeout: 3000 }).toBe(editor);
      await toggle.click();
      await page.locator('[data-menu="copy"] [data-copy="image"]').click();
      await expect
        .poll(() => page.evaluate(async () => (await navigator.clipboard.read()).flatMap((item) => item.types)), { timeout: 5000 })
        .toContain("image/png");
      // ブラウザが書き込みを断った時は、写せなかったことを知らせの欄に出す
      await page.evaluate(() => {
        navigator.clipboard.writeText = () => Promise.reject(new Error("denied"));
      });
      await toggle.click();
      await page.locator('[data-menu="copy"] [data-copy="source"]').click();
      await expect.poll(() => statusText(page), { timeout: 3000 }).not.toBe(copied);
      expect(await statusText(page)).not.toBe("");
    }));
});

describe("エクスポートの窓", () => {
  it("export-menu-groups-seven-formats", () =>
    withFrame({ lang: "ja" }, async (page) => {
      await mount(page);
      await expectToggle(page, "export");
      await page.locator('.dg-header-actions > [data-action="export"] > button').click();
      const menu = await page.evaluate(() => {
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
      expect(menu, "帯にエクスポートの窓が無い").toBeDefined();
      expect(menu).toEqual([
        { group: "images", text: "画像", formats: ["png", "svg"], names: ["PNG", "SVG"] },
        { group: "motion", text: "動き", formats: ["html", "gif", "mp4"], names: ["HTML", "GIF", "MP4"] },
        { group: "notation", text: "記法", formats: ["dragon", "json"], names: ["dragon記法", "JSON"] },
      ]);
    }));

  it("export-menu-saves-notation-and-json", () =>
    withFrame({ lang: "ja" }, async (page) => {
      await mount(page);
      await expectToggle(page, "export");
      const toggle = page.locator('.dg-header-actions > [data-action="export"] > button');
      const save = async (format: string) => {
        await toggle.click();
        const item = page.locator(`[data-menu="export"] [data-format="${format}"]`);
        expect(await item.count(), `エクスポートの窓に${format}が無い`).toBe(1);
        const [download] = await Promise.all([page.waitForEvent("download", { timeout: 4000 }), item.click()]);
        return { name: download.suggestedFilename(), text: readFileSync((await download.path())!, "utf8") };
      };
      const notation = await save("dragon");
      expect(notation.name.endsWith(".dragon")).toBe(true);
      expect(notation.text).toBe(SOURCE);
      const json = await save("json");
      expect(json.name.endsWith(".json")).toBe(true);
      expect(JSON.parse(json.text)).toMatchObject({ kind: "sequence", title: "注文" });
    }));

  it("export-options-scale-and-transparent-png", () =>
    withFrame({ lang: "ja" }, async (page) => {
      await mount(page);
      await expectToggle(page, "export");
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
      expect(await pressed("scale")).toEqual(["2"]);
      expect(await pressed("background")).toEqual(["fill"]);
      const width = await page.evaluate(() => Math.ceil(document.querySelector(".dragon-frame")!.shadowRoot!.querySelector(".dragon-host")!.getBoundingClientRect().width));
      const png = async (scale: string, background: string) => {
        if ((await menuState(page, "export")) !== "open") await toggle.click();
        await page.locator(`[data-option="scale"] [data-value="${scale}"]`).click();
        await page.locator(`[data-option="background"] [data-value="${background}"]`).click();
        expect(await menuState(page, "export"), "大きさと地を選ぶと窓が閉じた").toBe("open");
        const [download] = await Promise.all([page.waitForEvent("download", { timeout: 5000 }), page.locator('[data-menu="export"] [data-format="png"]').click()]);
        return PNG.sync.read(readFileSync((await download.path())!));
      };
      const alphaAt = (image: PNG, x: number, y: number) => image.data[(y * image.width + x) * 4 + 3];
      const clear = await png("3", "transparent");
      expect(clear.width).toBe(width * 3);
      expect(alphaAt(clear, 1, 1), "透明を選んだのに角を塗った").toBe(0);
      expect(clear.data.some((value, i) => i % 4 === 3 && value > 0), "透明を選ぶと図まで消えた").toBe(true);
      const filled = await png("1", "fill");
      expect(filled.width).toBe(width);
      expect(alphaAt(filled, 1, 1)).toBe(255);
    }));
});

describe("窓の開き方", () => {
  it("bar-opens-one-menu-at-a-time", () =>
    withFrame({ lang: "ja" }, async (page) => {
      await mount(page);
      await expectToggle(page, "copy");
      await expectToggle(page, "export");
      await page.locator('.dg-header-actions > [data-action="copy"] > button').click();
      expect([await menuState(page, "copy"), await menuState(page, "export")]).toEqual(["open", "closed"]);
      await page.locator('.dg-header-actions > [data-action="export"] > button').click();
      expect([await menuState(page, "copy"), await menuState(page, "export")]).toEqual(["closed", "open"]);
      const stage = await page.evaluate(() => {
        const box = document.querySelector(".dragon-frame")!.shadowRoot!.querySelector(".stage")!.getBoundingClientRect();
        return { x: box.left + 20, y: box.bottom - 20 };
      });
      await page.mouse.click(stage.x, stage.y);
      expect([await menuState(page, "copy"), await menuState(page, "export")]).toEqual(["closed", "closed"]);
    }));
});

describe("帯の言葉", () => {
  it("bar-text-follows-lang-setting-then-page", () =>
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
      expect(await codeText("ja-JP", undefined), "置いた所の上の lang が ja-JP なのに日本語にならない").toBe("コード");
      expect(await codeText(undefined, undefined), "どこにも lang が無いのに英語にならない").toBe("Code");
      expect(await codeText("ja", "en"), "設定 lang が置いた所の lang に負けた").toBe("Code");
    }));

  it("bar-text-english-on-english-page", () =>
    withFrame({ lang: "en" }, async (page) => {
      await mount(page);
      const texts = await actionTexts(page);
      expect({ code: texts.code, editor: texts.editor, copy: texts.copy, export: texts.export }).toEqual({ code: "Code", editor: "Editor", copy: "Copy", export: "Export" });
    }));
});

describe("帯と図の見た目", () => {
  it("frame-styles-without-style-elements", () =>
    withFrame({ lang: "ja" }, async (page) => {
      const before = await page.evaluate(() => document.querySelectorAll("style").length);
      await mount(page);
      const styles = await page.evaluate(() => {
        const root = document.querySelector(".dragon-frame")!.shadowRoot!;
        return {
          page: document.querySelectorAll("style").length,
          inside: root.querySelectorAll("style").length,
          adopted: root.adoptedStyleSheets.length,
          row: getComputedStyle(root.querySelector(".dg-header-row")!).display,
        };
      });
      expect(styles.page, "帯つきの図が頁にstyle要素を足した").toBe(before);
      expect(styles.inside, "帯の内側にstyle要素を作った").toBe(0);
      expect(styles.adopted).toBeGreaterThan(0);
      expect(styles.row).toBe("flex");
    }));

  it("frame-player-styled-inside-frame", () =>
    withFrame({ lang: "ja" }, async (page) => {
      await mount(page);
      const display = await page.evaluate(() => {
        const player = document.querySelector(".dragon-frame")!.shadowRoot!.querySelector(".dg-player");
        return player ? getComputedStyle(player).display : "missing";
      });
      expect(display, "帯の内側の図の再生の部品に見た目が届かない").toBe("flex");
    }));

  it("frame-falls-back-to-nonce-style", () =>
    withFrame(
      { lang: "ja", before: "delete Document.prototype.adoptedStyleSheets; delete ShadowRoot.prototype.adoptedStyleSheets;" },
      async (page) => {
        expect(await page.evaluate(() => "adoptedStyleSheets" in document), "頁が adoptedStyleSheets を外せていない").toBe(false);
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
        expect(styles.count).toBeGreaterThan(0);
        expect(styles.nonces.every((nonce) => nonce === "n0nce"), "nonce の無いstyle要素で見た目を入れた").toBe(true);
        expect(styles.player).toBe("flex");
      },
    ));

  it("diagram-font-has-fallback-stack", () =>
    withFrame({ lang: "ja" }, async (page) => {
      await mount(page);
      const family = await page.evaluate(() => {
        const text = document.querySelector(".dragon-frame")!.shadowRoot!.querySelector("svg.dg text");
        return text ? getComputedStyle(text).fontFamily : "missing";
      });
      expect(family).toContain("Noto Sans JP Variable");
      expect(family, "図の書体に代わりの書体の並びが無い").toMatch(/sans-serif$/);
    }));
});
