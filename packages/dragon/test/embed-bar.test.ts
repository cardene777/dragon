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

  it("frame-export-html-loads-capture", () =>
    withFrame({ lang: "ja" }, async (page) => {
      // npm の帯の HTML は、押した時に隣の書き出す部品 (`capture.js`) を読み、再生の script を埋めた頁を書き出す (#3786)
      await mount(page);
      await expectToggle(page, "export");
      await page.locator('.dg-header-actions > [data-action="export"] > button').click();
      const [download] = await Promise.all([page.waitForEvent("download", { timeout: 8000 }), page.locator('[data-menu="export"] [data-format="html"]').click()]);
      expect(download.suggestedFilename(), "HTMLのエクスポートのfileの名前").toMatch(/\.html$/u);
      expect(readFileSync(await download.path(), "utf8").includes("DragonPlayer.mountDiagram"), "書き出した頁が再生の script を埋めて図を置く").toBe(true);
      expect(await statusText(page), "HTMLのエクスポートの知らせ").toBe("操作できるHTMLを保存しました。開くと初期条件から始まります。");
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

  it("frame-menus-fit-narrow-page", () =>
    withFrame({ lang: "ja" }, async (page) => {
      // 携帯の幅では帯のボタンが 2 段に折り返し、エクスポートのボタンは 2 段目の左に来る (#3786)
      await placeOnPage(page, 360);
      const narrow = { export: await openedMenu(page, "export"), copy: await openedMenu(page, "copy") };
      for (const [name, box] of Object.entries(narrow)) {
        expect(box.left, `頁の幅360pxで${name}の窓の左端が画面の外`).toBeGreaterThanOrEqual(0);
        expect(box.right, `頁の幅360pxで${name}の窓の右端が画面の外`).toBeLessThanOrEqual(360);
      }
      // 帯の枠が 280px の時、窓の幅は枠の幅から 20px を引いた幅に縮み、枠の左右の縁を越えない
      await page.setViewportSize({ width: 312, height: 900 });
      const thin = await openedMenu(page, "export");
      expect(thin.frameRight - thin.frameLeft, "帯の枠の幅").toBeCloseTo(280, 0);
      expect(thin.right - thin.left, "帯の枠が280pxの時のエクスポートの窓の幅").toBeCloseTo(260, 0);
      expect(thin.left, "エクスポートの窓が帯の枠の左の縁を越えた").toBeGreaterThanOrEqual(thin.frameLeft);
      expect(thin.right, "エクスポートの窓が帯の枠の右の縁を越えた").toBeLessThanOrEqual(thin.frameRight);
    }));

  it("frame-menu-aligns-right-on-wide-page", () =>
    withFrame({ lang: "ja" }, async (page) => {
      await placeOnPage(page, 1000);
      const wide = await openedMenu(page, "export");
      expect(Math.abs(wide.right - wide.buttonRight), `頁の幅1000pxでエクスポートの窓の右端 (${wide.right}) がボタンの右端 (${wide.buttonRight}) と揃わない`).toBeLessThan(0.5);
      expect(wide.right - wide.left, "頁の幅1000pxのエクスポートの窓の幅").toBeCloseTo(300, 0);
    }));
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

/** 窓`name`を開き直し、窓と、窓を開いたボタンと、帯の枠の左右の端を返す */
async function openedMenu(page: Page, name: string): Promise<{ left: number; right: number; buttonRight: number; frameLeft: number; frameRight: number }> {
  await expectToggle(page, name);
  // 開いた窓は下の段のボタンに重なるので、Escape で閉じてから押す
  if ((await menuState(page, "copy")) === "open" || (await menuState(page, "export")) === "open") await page.keyboard.press("Escape");
  await page.locator(`.dg-header-actions > [data-action="${name}"] > button`).click();
  expect(await menuState(page, name), `${name}の窓が開かない`).toBe("open");
  return page.evaluate((menu) => {
    const frame = document.querySelector<HTMLElement>(".dragon-frame")!;
    const root = frame.shadowRoot!;
    const box = root.querySelector(`[data-menu="${menu}"]`)!.getBoundingClientRect();
    const button = root.querySelector(`[data-action="${menu}"] > button`)!.getBoundingClientRect();
    const edge = frame.getBoundingClientRect();
    return { left: box.left, right: box.right, buttonRight: button.right, frameLeft: edge.left, frameRight: edge.right };
  }, name);
}

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
 * どちらも段 1 の止め絵で止め、動きで線の値と並びが替わらないようにする
 */
async function mountSideBySide(page: Page, width: number): Promise<void> {
  await page.evaluate(
    ([source, hostWidth]) => {
      const w = window as unknown as {
        dragonFrame: { mountFramedDiagram(host: HTMLElement, source: string, options: object): unknown };
        dragonCore: { parseNotation(text: string): { ok: boolean; diagram?: unknown }; mountDiagram(host: HTMLElement, diagram: unknown, options: object): unknown };
      };
      const host = document.getElementById("host")!;
      host.style.width = `${hostWidth}px`;
      w.dragonFrame.mountFramedDiagram(host, source, { pausedAt: 0 });
      const stage = document.querySelector(".dragon-frame")!.shadowRoot!.querySelector(".stage")!;
      const plain = document.createElement("div");
      plain.id = "plain";
      plain.style.width = `${stage.getBoundingClientRect().width}px`;
      document.body.append(plain);
      const parsed = w.dragonCore.parseNotation(source);
      if (!parsed.ok) throw new Error("帯の無い図の記法を読めない");
      w.dragonCore.mountDiagram(plain, parsed.diagram, { pausedAt: 0 });
    },
    [SOURCE, width] as const,
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

/** `#host`に置いた`createFigureHeader`の帯の高さと、題と全てのボタンの計算値と寸法 */
async function readFigureHeader(
  page: Page,
): Promise<{ height: number; title: string; buttons: { text: string; height: number; boxShadow: string; minWidth: string; letterSpacing: string; textTransform: string }[] }> {
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

describe("頁のCSSが帯と図の字に入らない (#3787)", () => {
  it("frame-text-ignores-page-spacing", () =>
    withFrame({ lang: "ja" }, async (page) => {
      await mountBoth(page, SPACING_SOURCE);
      const bare = await readFrameText(page);
      expect(bare.framed.length, "帯つきの図のSVGに字が無い").toBeGreaterThan(0);
      expect(bare.plain.length, "帯の無い図のSVGに字が無い").toBeGreaterThan(0);
      await setPageCss(page, PAGE_SPACING);
      const styled = await readFrameText(page);
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
    }));

  it("player-text-ignores-page-spacing", () =>
    withFrame({ lang: "ja" }, async (page) => {
      await mountBoth(page, SPACING_SOURCE);
      await setPageCss(page, PAGE_SPACING);
      const parts = await page.evaluate(() =>
        ["step-title", "step-body"].map((part) => {
          const el = document.querySelector(`#plain [data-dragon="${part}"]`);
          if (!el) return `${part} 無い`;
          const style = getComputedStyle(el);
          return `${part} ${style.letterSpacing} ${style.textTransform}`;
        }),
      );
      expect(parts, "帯の無い図の再生の帯の段の題か本文が頁の字の間と大文字を受け継いだ").toEqual(["step-title normal none", "step-body normal none"]);
    }));

  it("figure-header-ignores-page-css", () =>
    withFrame({ lang: "ja" }, async (page) => {
      // 軽い再生部品を持つサイトと同じく、帯の頭を頁の中に置き、題と4つのボタンを並べる
      await page.addScriptTag({ type: "module", content: 'import("/header.js").then((m) => { window.dragonHeader = m; }, (e) => { window.headerError = String(e); });' });
      await page.waitForFunction(() => "dragonHeader" in window || "headerError" in window);
      expect(await page.evaluate(() => (window as unknown as { headerError?: string }).headerError), "頁が帯の頭の入口を読めない").toBeUndefined();
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
      expect(pressed.buttons.map((button) => button.text), "帯の頭のボタンが4つ並んでいない").toEqual(["コード", "エディタ", "コピー", "拡大"]);
      for (const button of pressed.buttons) {
        expect(
          { boxShadow: button.boxShadow, minWidth: button.minWidth, textTransform: button.textTransform },
          `頁のbuttonの指定が帯のボタン「${button.text}」に影か最小の幅か大文字を付けた`,
        ).toEqual({ boxShadow: "none", minWidth: "0px", textTransform: "none" });
      }
      expect(pressed.buttons.map((button) => button.height), "帯のボタンの高さが頁の行の高さで変わった").toEqual([30, 30, 30, 30]);
      expect(pressed.height, "帯の高さが頁のCSSで変わった").toBe(49);
      await setPageCss(page, PAGE_SPACING);
      const spaced = await readFigureHeader(page);
      expect([spaced.title, ...spaced.buttons.map((button) => `${button.text} ${button.letterSpacing} ${button.textTransform}`)], "帯の題かボタンが頁の字の間と大文字を受け継いだ").toEqual([
        "normal none",
        "コード normal none",
        "エディタ normal none",
        "コピー normal none",
        "拡大 normal none",
      ]);
    }));
});

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
