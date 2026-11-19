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

/** 帯の入口を読んだ頁を開いて`run`を回す。頁は file で 1 つの Chromium の文脈ごとに開いて閉じる (#3424) */
async function withFrame<T>(setup: PageSetup, run: (page: Page) => Promise<T>): Promise<T> {
  expect(existsSync(join(DIST, "frame.js")), "帯の入口の build した file (dist/frame.js) が無い").toBe(true);
  const lang = setup.lang ? ` lang="${setup.lang}"` : "";
  const html =
    `<!doctype html><html${lang}><head><meta charset="utf-8">` +
    '<script type="importmap">{"imports":{"@cardenelabs/dragon":"/index.js","gifenc":"/gifenc.js","mediabunny":"/mediabunny.js"}}</script>' +
    '<style>html,body{margin:0}</style></head><body><div id="host" style="width:760px"></div>' +
    `<script>${setup.before ?? ""}</script>` +
    // 帯の無い図と並べる検査 (#3744) のため、帯の入口と同じ本体 (`/index.js`) も頁から呼べるように置く
    '<script type="module">Promise.all([import("/frame.js"), import("/index.js")]).then(([m, core]) => { window.dragonFrame = m; window.dragonCore = core; }, (e) => { window.frameError = String(e); });</script></body></html>';
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
            const visible = !/^rgba\(.*,\s*0\)$|^transparent$/u.test(style.borderTopColor);
            return style.borderTopStyle !== "none" && Number.parseFloat(style.borderTopWidth) > 0 && visible;
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

  // 印は段の鱗のアイコンだけを描き、`dragon`の字を持たず、読み上げの名前を持つ (#3713)
  it("bar-mark-is-icon-only", () =>
    withFrame({ lang: "ja" }, async (page) => {
      await mount(page);
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
      expect(mark, "帯にdragonの印が無い").toBeDefined();
      expect(mark!.text, "印が字を持つ").toBe("");
      expect(mark!.label, "印が読み上げの名前を持たない").not.toBe("");
      expect(mark!.icons).toBe(1);
      expect(mark!.viewBox).toBe(SCALE_MARK.viewBox);
      expect(mark!.paths).toEqual(SCALE_MARK.paths);
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
        return { name: download.suggestedFilename(), text: readFileSync(await download.path(), "utf8") };
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
        return PNG.sync.read(readFileSync(await download.path()));
      };
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
      const clear = await png("3", "transparent");
      expect(clear.width).toBe(width * 3);
      expect(clearShare(clear, 3), "透明を選んだのに図の地を塗った").toBeGreaterThan(0.25);
      expect(clear.data.some((value, i) => i % 4 === 3 && value > 0), "透明を選ぶと図まで消えた").toBe(true);
      const filled = await png("1", "fill");
      expect(filled.width).toBe(width);
      expect(clearShare(filled, 1), "地を塗るを選んだのに透明な画素が残った").toBe(0);
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
        expect(styles.page, `${kind}の帯つきの図が頁にstyle要素を足した`).toBe(before);
        expect(styles.inside, `${kind}の帯の内側にstyle要素を作った`).toBe(0);
        expect(styles.adopted.every((count) => count > 0), `${kind}の影の根に見た目が入っていない`).toBe(true);
        expect(styles.row).toBe("flex");
        if (styled) expect(styles.styled, `${kind}の図の見た目が帯の内側に届かない`).toBe("flex");
      }
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

describe("帯つきの図の線と再生の帯の余白 (#3744)", () => {
  it("frame-diagram-keeps-plain-strokes", () =>
    withFrame({ lang: "ja" }, async (page) => {
      // 帯の釦の絵柄の線の決まりが図のSVGに当たると、図の字と地の四角が字の色の 1.6px の縁取りを受け継ぐ。
      // 帯つきの図のSVGの全ての要素の縁取りの有無と線の太さが、同じ記法の帯の無い図と同じかを見る
      await mountSideBySide(page, 760);
      const strokes = await page.evaluate(() => {
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
      expect(strokes.plain.length, "帯の無い図のSVGを描いていない").toBeGreaterThan(0);
      expect(strokes.framed, "帯つきの図のSVGの縁取りが帯の無い図と違う").toEqual(strokes.plain);
    }));

  it("frame-icons-keep-their-lines", () =>
    withFrame({ lang: "ja" }, async (page) => {
      // 帯の初めからの釦と、置く人が足した釦の絵柄は 1.6px の線で描き、塗らない。dragonの印は線を持たずに塗る
      await page.evaluate((source) => {
        const frame = (window as unknown as { dragonFrame: { mountFramedDiagram(host: HTMLElement, source: string, options: object): unknown } }).dragonFrame;
        const buttons = ["code", "editor", "copy", "export", "expand", { id: "note", label: "メモ", icon: "M4 4h16v16H4z", onClick: () => undefined }];
        frame.mountFramedDiagram(document.getElementById("host")!, source, { buttons });
      }, SOURCE);
      const icons = await page.evaluate(() => {
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
      // 絵柄はコード、エディタ、コピー、エクスポートの2つ (下向きの矢と開く印)、拡大、足した釦の7つ
      expect(icons.actions).toHaveLength(7);
      for (const icon of icons.actions) expect(icon, "帯の釦の絵柄の線が変わった").toEqual({ line: true, width: "1.6px", filled: false });
      expect(icons.mark, "dragonの印が無い").not.toBeNull();
      expect({ line: icons.mark!.line, filled: icons.mark!.filled }, "dragonの印が線を持つか塗られていない").toEqual({ line: false, filled: true });
    }));

  // 760 は帯の中身が 640px より広く 1 段に並べ、480 は積んで並べる (#3398)
  describe.for([{ width: 760 }, { width: 480 }])("幅 $width", ({ width }) => {
    it("frame-bar-keeps-room-from-edges", () =>
      withFrame({ lang: "ja" }, async (page) => {
        // 帯つきの図は図を帯の枠の幅いっぱいに置くので、1 fileのHTMLと同じく再生の帯の中身を左右の縁から 16px、下の縁から 12px 離す
        await mountSideBySide(page, width);
        const { framed } = await barRooms(page);
        expect(framed.parts, "帯つきの図の再生の帯が中身を出していない").toBe(5);
        expect(framed, `幅 ${width}px で、帯つきの図の再生の帯が帯の枠の縁から離れていない`).toEqual({ parts: 5, left: 16, right: 16, bottom: 12 });
      }));

    it("plain-bar-leaves-room-to-page", () =>
      withFrame({ lang: "ja" }, async (page) => {
        // 帯の無い図の再生の帯は自分では余白を付けず、置いた頁の余白に任せる (`player.ts`)
        await mountSideBySide(page, width);
        const { plain } = await barRooms(page);
        expect(plain, `幅 ${width}px で、帯の無い図の再生の帯が自分で余白を付けた`).toEqual({ parts: 5, left: 0, right: 0, bottom: 0 });
      }));
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
async function inkOffset(page: Page, box: Box, ink: string, ground: string): Promise<{ dx: number; dy: number }> {
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
  expect(Number.isFinite(left), "釦を撮った画像に絵柄の画素が無い").toBe(true);
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

describe("再生の帯の釦と進み具合 (#3752)", () => {
  // 760 は帯の中身が 640px より広く 1 段に並べ、480 は積んで並べる (#3398)
  describe.for([{ width: 760 }, { width: 480 }])("幅 $width", ({ width }) => {
    it("player-icons-centered-in-buttons", () =>
      withFrame({ lang: "ja" }, async (page) => {
        // 釦の絵柄は縦横18pxの枠に描き、撮った画像の絵柄の真ん中を釦の真ん中に置く。再生の釦は絵柄と名前を合わせて真ん中に置く
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
        for (const button of buttons) {
          const label = `幅 ${width}px の${button.where}の${button.name}の釦`;
          expect(button.box, `${label}が無い`).not.toBeNull();
          expect(button.icon, `${label}の絵柄の枠`).toEqual({ w: 18, h: 18 });
          const { dx, dy } = await inkOffset(page, button.box!, button.ink, button.ground);
          expect(Math.abs(dx), `${label}の絵柄が釦の真ん中から横に ${dx}px ずれた`).toBeLessThanOrEqual(1);
          expect(Math.abs(dy), `${label}の絵柄が釦の真ん中から縦に ${dy}px ずれた`).toBeLessThanOrEqual(1);
        }
      }));
  });

  it("player-icons-leave-figure-tiles", () =>
    withFrame({ lang: "ja" }, async (page) => {
      // 再生の釦の絵柄の見た目は、図の箱と区画と中身の帯の絵柄の後ろの四角 (`rect.dg-ic`、`rect.dg-bi`) に当たらない。
      // 当たると四角が縮んで左上に寄り、絵柄が四角から右下へはみ出す
      await mountSideBySide(page, 760, ARCHITECTURE);
      const tiles = await page.evaluate(() => {
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
      expect(tiles.length, "図に絵柄の後ろの四角が無い").toBeGreaterThan(0);
      for (const tile of tiles) expect(tile.drawn, `${tile.where}の絵柄の後ろの四角の幅が書いた幅と違う`).toBe(tile.written);
    }));

  it("player-buttons-center-on-caption", () =>
    withFrame({ lang: "ja" }, async (page) => {
      // 広い帯の釦の段は、段の番号と題と説明文の塊の真ん中に揃え、説明文が何行でも塊の上の端に寄らない
      await mountSideBySide(page, 760, STEPPED);
      const rows = await page.evaluate(() => {
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
      for (const row of rows) {
        expect(row.lines, `${row.where}の段の説明文が2行以上に折れていない`).toBeGreaterThanOrEqual(2);
        expect(Math.abs(row.buttons - row.say), `${row.where}の釦の段が文の塊の真ん中から ${row.buttons - row.say}px ずれた`).toBeLessThanOrEqual(1);
      }
    }));

  it("player-progress-fills-done-and-now", () =>
    withFrame({ lang: "ja" }, async (page) => {
      // 段2で止めた図は、段1を呼び出しの色で塗り切り、段2をほぼ塗り切り、段3を塗らない。塗りが移る動き (120ms) の後に測る
      await mountSideBySide(page, 760, STEPPED, { pausedAt: 1 });
      await page.waitForTimeout(400);
      for (const [scope, where] of [["framed", "帯つきの図"], ["plain", "帯の無い図"]] as const) {
        const segments = await readFills(page, scope);
        const blue = await toggleColor(page, scope);
        expect(segments.map((s) => s.state), `${where}の進み具合の段の状態`).toEqual(["done", "now", "todo"]);
        expect(segments.map((s) => s.height), `${where}の進み具合の帯の高さ`).toEqual([6, 6, 6]);
        const [done, now, todo] = segments;
        expect(done?.scale, `${where}の済んだ段1の塗りの割合`).toBe(1);
        expect(done?.color, `${where}の済んだ段1の塗りが呼び出しの色でない`).toBe(blue);
        expect(now?.scale, `${where}の今の段2の塗りの割合`).toBeGreaterThanOrEqual(0.95);
        expect(todo?.scale, `${where}のまだの段3の塗りの割合`).toBe(0);
      }
    }));

  it("player-progress-now-grows-while-playing", () =>
    withFrame({ lang: "ja" }, async (page) => {
      // 段1の止め絵から流すと、止め絵の後の残りの時間 (MOTION.still) を流してから段2へ移り、段2の帯を流した時間の分だけ左から塗り進める。
      // 速さを半分にし、段2へ移った後に2度測る
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
      expect(before.scale, "流している今の段の帯を塗っていない").toBeGreaterThan(0);
      expect(before.scale, "流し始めたばかりの今の段の帯を塗り切った").toBeLessThan(1);
      expect(after.now, "2度測る間に今の段が替わった").toBe(before.now);
      expect(after.scale, "400ms後の今の段の塗りが増えていない").toBeGreaterThan(before.scale);
      expect(after.scale, "400ms後の今の段の帯を塗り切った").toBeLessThan(1);
    }));
});
