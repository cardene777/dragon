/**
 * 公開する頁 (#2995)。
 *
 * 左の書く欄に記法を書くと、右に動く図が描かれる 1 枚の頁を確かめる。
 * 頁は build して GitHub Pages と同じ形で配り、画面なしの Chromium で開く (`playground-support.ts`)。
 * 頁の部品は `data-playground` の札で探し、図は `@cardenelabs/dragon` の再生の部品 (`data-dragon` の札) で読む。
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { type Diagram, FONTS, PALETTES, parseNotation } from "@cardenelabs/dragon";
import { chromium, type Browser, type BrowserContext, type Page } from "playwright";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";

import { BASE, buildPage, type Built, bundleSizes, example, pageSources, rgb, servePage } from "./playground-support";

/** 頁を build して Chromium を起こすまでに許す時間 */
const SETUP = 300_000;
/** 頁の振る舞いを 1 つ確かめるのに許す時間 */
const SLOW = 90_000;
/** 頁が書き換わるのを待つ長さ */
const WAIT = { timeout: 8_000, interval: 100 } as const;

const sel = (name: string): string => `[data-playground="${name}"]`;

const OAUTH = example("oauth.dragon") ?? "";
const CCIP = example("ccip.dragon") ?? "";

/** 記法の題。読めない記法なら `undefined` */
const titleOf = (text: string): string | undefined => {
  const parsed = parseNotation(text);
  return parsed.ok ? parsed.diagram.title : undefined;
};

/** 書き換えに使う、箱 2 つと線 1 本の図 */
const EDITED = ["時系列図 書き換えた図", "", "甲 = 甲のサービス", "乙 = 乙のサービス", "", "# 呼ぶ", "> 甲が乙を呼ぶ。", "甲 -> 乙 : 呼ぶ"].join("\n");
/** `EDITED` と同じ形を英語の語で書いた図 (#2997) */
const EDITED_EN = ["sequence Edited diagram", "", "app = App service", "api = API service", "", "# Call", "> App calls API.", "app -> api : call"].join("\n");

/**
 * 記法の日本語の語 (#2997)。行の頭の語と、行の終わりの指定の語。
 * 語の表は `@cardenelabs/dragon` の中にあり、頁の検査は表を読まずに、日本語の語が書く欄に残っていないかだけを見る。
 */
const JAPANESE_WORDS = /^\s*(時系列図|構成図|区画|帯|見せ方)\s|\[(色|印|区画|名前|札|硬貨|なし|封筒)[\s\]]/mu;
/** 仮名と漢字。英語の誤りの文に入らない */
const KANA_KANJI = /[\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Han}]/u;

let built: Built;
let server: Awaited<ReturnType<typeof servePage>>;
let browser: Browser;
const contexts: BrowserContext[] = [];

interface Opened {
  page: Page;
  /** CSP に止められた読み込みと実行 */
  violations: () => Promise<string[]>;
}

async function open(
  o: { path?: string; url?: string; locale?: string; colorScheme?: "light" | "dark"; viewport?: { width: number; height: number } } = {},
): Promise<Opened> {
  const context = await browser.newContext({
    locale: o.locale ?? "ja-JP",
    colorScheme: o.colorScheme ?? "light",
    viewport: o.viewport ?? { width: 1280, height: 860 },
  });
  contexts.push(context);
  await context.addInitScript(() => {
    const w = window as unknown as { __csp: string[] };
    w.__csp = [];
    document.addEventListener("securitypolicyviolation", (e) => w.__csp.push(`${e.violatedDirective} ${e.blockedURI}`));
  });
  const page = await context.newPage();
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(o.url ?? `${server.origin}${o.path ?? BASE}`);
  return {
    page,
    violations: async () => [
      ...(await page.evaluate(() => (window as unknown as { __csp: string[] }).__csp)),
      ...errors.filter((m) => /Content Security Policy|EvalError|unsafe-eval/u.test(m)),
    ],
  };
}

const count = (page: Page, name: string): Promise<number> =>
  page.evaluate((s) => document.querySelectorAll(s).length, sel(name));

/** 書く欄の中身。書く欄が無ければ `null` */
const editorValue = (page: Page): Promise<string | null> =>
  page.evaluate((s) => {
    const e = document.querySelector(s);
    return e instanceof HTMLTextAreaElement ? e.value.trimEnd() : null;
  }, sel("editor"));

/** 図の段の一覧の名札 (図の題を含む)。図が無ければ `null` */
const stepsLabel = (page: Page): Promise<string | null> =>
  page.evaluate((s) => document.querySelector(`${s} [data-dragon="steps"]`)?.getAttribute("aria-label") ?? null, sel("stage"));

const stepNo = (page: Page): Promise<string | null> =>
  page.evaluate((s) => document.querySelector(`${s} [data-dragon="step-no"]`)?.textContent ?? null, sel("stage"));

const drawnText = (page: Page): Promise<string> =>
  page.evaluate((s) => document.querySelector(`${s} svg`)?.textContent ?? "", sel("stage"));

const statusText = (page: Page): Promise<string> =>
  page.evaluate((s) => document.querySelector(s)?.textContent ?? "", sel("status"));

async function drawn(page: Page, message = "頁に図が描かれない"): Promise<void> {
  await expect
    .poll(() => page.evaluate((s) => document.querySelectorAll(`${s} .dg-player`).length, sel("stage")), { ...WAIT, message })
    .toBe(1);
}

async function click(page: Page, name: string): Promise<void> {
  await expect.poll(() => count(page, name), { ...WAIT, message: `${name} の釦が無い` }).toBe(1);
  await page.locator(sel(name)).click();
}

async function setEditor(page: Page, text: string): Promise<void> {
  await expect.poll(() => count(page, "editor"), { ...WAIT, message: "書く欄が無い" }).toBe(1);
  await page.locator(sel("editor")).fill(text);
}

/** 頁の地の色と字の色と、図の地の色 */
const look = (page: Page): Promise<{ page: string; ink: string; diagram: string }> =>
  page.evaluate((s) => {
    const body = getComputedStyle(document.body);
    const player = document.querySelector(`${s} .dg-player`);
    return {
      page: body.backgroundColor,
      ink: body.color,
      diagram: player ? getComputedStyle(player).getPropertyValue("--bg").trim().toLowerCase() : "",
    };
  }, sel("stage"));

const lookOf = (palette: string, theme: "light" | "dark"): { page: string; ink: string; diagram: string } => {
  const v = PALETTES[palette]?.[theme] ?? {};
  return { page: rgb(v.page ?? ""), ink: rgb(v.ink ?? ""), diagram: (v.bg ?? "").toLowerCase() };
};

describe("公開する頁 (#2995)", () => {
  beforeAll(async () => {
    built = await buildPage();
    server = await servePage(built.dir);
    browser = await chromium.launch();
  }, SETUP);

  afterEach(async () => {
    await Promise.all(contexts.splice(0).map((c) => c.close()));
  });

  afterAll(async () => {
    await browser?.close();
    await server?.close();
  });

  it(
    "playground-opens-with-oauth",
    async () => {
      const { page } = await open();
      await expect.poll(() => editorValue(page), { ...WAIT, message: "書く欄に OAuth の見本が入っていない" }).toBe(OAUTH);
      await drawn(page);
      await expect.poll(() => stepsLabel(page), { ...WAIT, message: "OAuth の図が描かれていない" }).toContain(titleOf(OAUTH));
      const first = await stepNo(page);
      await expect.poll(() => stepNo(page), { timeout: 15_000, interval: 200, message: "図の段が進まない" }).not.toBe(first);
    },
    SLOW,
  );

  it(
    "editing-notation-redraws-diagram",
    async () => {
      expect(titleOf(EDITED), "検査に使う記法が読めない").toBe("書き換えた図");
      const { page } = await open();
      await drawn(page);
      await setEditor(page, EDITED);
      await expect.poll(() => stepsLabel(page), { ...WAIT, message: "書き換えた記法で図が描き直されない" }).toContain("書き換えた図");
      expect(await drawnText(page)).toContain("甲のサービス");
    },
    SLOW,
  );

  it(
    "notation-error-shows-line-and-keeps-diagram",
    async () => {
      // 段「認可サーバーへ回す」の本文の行を消すと、その段の見出しの行が誤りになる
      const lines = OAUTH.split("\n");
      const head = lines.indexOf("# 認可サーバーへ回す");
      expect(head, "OAuth の見本に段「認可サーバーへ回す」が無い").toBeGreaterThan(0);
      const broken = lines.filter((_, i) => i !== head + 1).join("\n");
      const parsed = parseNotation(broken);
      expect(parsed.ok, "検査に使う記法が誤りにならない").toBe(false);
      const error = parsed.ok ? undefined : parsed.errors[0];

      const { page } = await open();
      await drawn(page);
      await setEditor(page, broken);
      await expect.poll(() => statusText(page), { ...WAIT, message: "誤りの行の番号が欄の下に出ない" }).toContain(`${error?.line} 行目`);
      expect(await statusText(page), "誤りの理由が欄の下に出ない").toContain(error?.message);
      expect(await page.locator(sel("status")).getAttribute("data-state")).toBe("error");
      await drawn(page, "誤りの間に図が消えた");
      expect(await stepsLabel(page), "最後に描けた図が残っていない").toContain(titleOf(OAUTH));
    },
    SLOW,
  );

  it(
    "json-side-edits-sync-to-notation",
    async () => {
      const parsed = parseNotation(OAUTH);
      expect(parsed.ok).toBe(true);
      const diagram = (parsed.ok ? parsed.diagram : {}) as Diagram;

      const { page } = await open();
      await drawn(page);
      await click(page, "tab-json");
      const asJson = async (): Promise<unknown> => {
        const v = await editorValue(page);
        try {
          return v === null ? null : JSON.parse(v);
        } catch {
          return "JSON として読めない";
        }
      };
      await expect.poll(asJson, { ...WAIT, message: "JSON の側に今の図の JSON が出ない" }).toEqual(diagram);

      const changed = structuredClone(diagram);
      changed.title = "JSON で書き換えた図";
      (changed.boxes[0] as Diagram["boxes"][number]).name = "JSON で書いた箱";
      await setEditor(page, JSON.stringify(changed, null, 2));
      await expect.poll(() => stepsLabel(page), { ...WAIT, message: "JSON の書き換えが図に反映しない" }).toContain("JSON で書き換えた図");

      await click(page, "tab-notation");
      await expect
        .poll(async () => {
          const v = await editorValue(page);
          return v === null ? null : parseNotation(v);
        }, { ...WAIT, message: "JSON の書き換えが記法の側に反映しない" })
        .toEqual({ ok: true, diagram: changed });
    },
    SLOW,
  );

  it(
    "json-error-shows-pointer-under-csp",
    async () => {
      const parsed = parseNotation(OAUTH);
      expect(parsed.ok).toBe(true);
      const diagram = structuredClone(parsed.ok ? parsed.diagram : ({} as Diagram));
      const index = diagram.boxes.findIndex((box) => box.color === "violet");
      expect(index, "OAuth の見本に violet の箱が無い").toBeGreaterThanOrEqual(0);
      (diagram.boxes[index] as unknown as { color: string }).color = "purple";

      const { page, violations } = await open();
      await drawn(page);
      await click(page, "tab-json");
      await setEditor(page, JSON.stringify(diagram, null, 2));
      await expect.poll(() => statusText(page), { ...WAIT, message: "誤った欄の場所が欄の下に出ない" }).toContain(`/boxes/${index}/color`);
      const status = await statusText(page);
      expect(status.replace(`/boxes/${index}/color`, "").trim().length, "誤りの理由が出ない").toBeGreaterThan(3);
      expect(await stepsLabel(page), "最後に描けた図が残っていない").toContain(titleOf(OAUTH));
      expect(await violations(), "CSP に止められた読み込みか実行がある").toEqual([]);
    },
    SLOW,
  );

  it(
    "example-picker-loads-example",
    async () => {
      const intro = example("intro.dragon");
      expect(intro, "入門の見本 (packages/dragon/examples/intro.dragon) が無い").toBeDefined();

      const { page } = await open();
      await drawn(page);
      await expect.poll(() => count(page, "example"), { ...WAIT, message: "見本を選ぶ欄が無い" }).toBe(1);
      for (const [value, text] of [["intro", intro ?? ""], ["ccip", CCIP], ["oauth", OAUTH]] as const) {
        await page.locator(sel("example")).selectOption(value);
        await expect.poll(() => editorValue(page), { ...WAIT, message: `${value} を選んでも書く欄に入らない` }).toBe(text);
        await expect.poll(() => stepsLabel(page), { ...WAIT, message: `${value} を選んでも図が替わらない` }).toContain(titleOf(text));
      }
    },
    SLOW,
  );

  it(
    "url-hash-restores-notation",
    async () => {
      const { page } = await open();
      await drawn(page);
      await setEditor(page, EDITED);
      await expect
        .poll(() => page.evaluate(() => location.hash.length), { ...WAIT, message: "書いた中身が URL の # の後ろに入らない" })
        .toBeGreaterThan(1);
      const url = await page.evaluate(() => location.href);

      // 端末に残した物から戻していないことを見るため、別の context で開く
      const again = await open({ url });
      await expect.poll(() => editorValue(again.page), { ...WAIT, message: "URL を開いても書いた記法が戻らない" }).toBe(EDITED);
      await expect.poll(() => stepsLabel(again.page), { ...WAIT, message: "URL を開いても書いた図が戻らない" }).toContain("書き換えた図");
    },
    SLOW,
  );

  it(
    "english-switches-page-and-example",
    async () => {
      const oauthEn = example("oauth.en.dragon");
      expect(oauthEn, "OAuth の英語版 (packages/dragon/examples/oauth.en.dragon) が無い").toBeDefined();

      const { page } = await open({ locale: "ja-JP" });
      await drawn(page);
      expect(await page.evaluate(() => document.documentElement.lang)).toBe("ja");
      await click(page, "lang-en");
      await expect.poll(() => page.evaluate(() => document.documentElement.lang), { ...WAIT, message: "頁の言葉が英語にならない" }).toBe("en");
      await expect.poll(() => page.locator(sel("tab-notation")).textContent(), { ...WAIT, message: "頁の札が英語にならない" }).toBe("Notation");
      await expect.poll(() => editorValue(page), { ...WAIT, message: "選んでいる見本が英語版にならない" }).toBe(oauthEn);
      await expect.poll(() => stepsLabel(page), { ...WAIT, message: "図が英語版にならない" }).toContain(titleOf(oauthEn ?? ""));

      const english = await open({ locale: "en-US" });
      await drawn(english.page);
      expect(await english.page.evaluate(() => document.documentElement.lang), "端末の言語が英語なのに英語で開かない").toBe("en");
      expect(await editorValue(english.page)).toBe(oauthEn);
    },
    SLOW,
  );

  it(
    "palette-and-theme-apply-to-page-and-diagram",
    async () => {
      const { page } = await open({ colorScheme: "light" });
      await drawn(page);
      for (const [palette, theme] of [["night", "dark"], ["clear", "light"], ["paper", "dark"]] as const) {
        await click(page, `palette-${palette}`);
        await click(page, `theme-${theme}`);
        await expect.poll(() => look(page), { ...WAIT, message: `${palette} と ${theme} の値にならない` }).toEqual(lookOf(palette, theme));
      }
    },
    SLOW,
  );

  it(
    "theme-follows-device-by-default",
    async () => {
      for (const scheme of ["light", "dark"] as const) {
        const { page } = await open({ colorScheme: scheme });
        await drawn(page);
        await expect.poll(() => look(page), { ...WAIT, message: `端末が ${scheme} の時に紙と墨の ${scheme} で開かない` }).toEqual(lookOf("paper", scheme));
      }
      // 開いた後に端末の明暗が替わった時も従う
      const { page } = await open({ colorScheme: "light" });
      await drawn(page);
      await page.emulateMedia({ colorScheme: "dark" });
      await expect.poll(() => look(page), { ...WAIT, message: "端末の明暗の替わりに従わない" }).toEqual(lookOf("paper", "dark"));
    },
    SLOW,
  );

  it(
    "page-text-uses-bundled-fonts",
    async () => {
      const { page } = await open();
      await drawn(page);
      const fonts = await page.evaluate(async (editorSel) => {
        await document.fonts.ready;
        const first = (family: string): string => (family.split(",")[0] ?? "").replace(/["']/gu, "").trim();
        const editor = document.querySelector(editorSel);
        return {
          body: first(getComputedStyle(document.body).fontFamily),
          editor: editor ? first(getComputedStyle(editor).fontFamily) : null,
          loaded: [...new Set([...document.fonts].filter((f) => f.status === "loaded").map((f) => f.family.replace(/["']/gu, "")))],
          files: performance.getEntriesByType("resource").map((e) => e.name).filter((n) => /\.woff2?(\?|$)/u.test(n)),
        };
      }, sel("editor"));
      expect(fonts.body, "頁の字が同梱の和文の字でない").toBe(FONTS.sans);
      expect(fonts.editor, "書く欄の字が同梱の等幅の字でない").toBe(FONTS.mono);
      expect(fonts.loaded, "同梱の字が読み込まれていない").toEqual(expect.arrayContaining([FONTS.sans, FONTS.mono]));
      expect(fonts.files.length, "字の file を読んでいない").toBeGreaterThan(0);
      for (const file of fonts.files) expect(file.startsWith(`${server.origin}${BASE}`), `頁の外から字を読んでいる: ${file}`).toBe(true);
    },
    SLOW,
  );

  it(
    "old-routes-land-on-playground",
    async () => {
      expect(built.notFound.ok, `404.html を作る script が落ちた: ${built.notFound.stderr}`).toBe(true);
      for (const path of [`${BASE}catalog`, `${BASE}editor`, `${BASE}catalog/oauth`]) {
        const { page } = await open({ path });
        await drawn(page, `${path} を開いても新しい頁が出ない`);
        await expect.poll(() => page.evaluate(() => location.pathname), { ...WAIT, message: `${path} のアドレスが ${BASE} にならない` }).toBe(BASE);
      }
    },
    SLOW,
  );

  it(
    "narrow-width-stacks-diagram-above-editor",
    async () => {
      const { page } = await open({ viewport: { width: 390, height: 844 } });
      await drawn(page);
      const box = await page.evaluate(
        ([stage, pane]) => {
          const a = document.querySelector(stage)?.getBoundingClientRect();
          const b = document.querySelector(pane)?.getBoundingClientRect();
          return a && b ? { stage: a.top, editor: b.top, overflow: document.documentElement.scrollWidth } : null;
        },
        [sel("stage"), sel("editor-pane")] as const,
      );
      expect(box, "図か書く欄が無い").not.toBeNull();
      expect(box?.stage, "図が書く欄の上に来ない").toBeLessThan(box?.editor ?? 0);
      expect(box?.overflow, "幅 390px で横にはみ出す").toBeLessThanOrEqual(390);
      await click(page, "fold");
      await expect.poll(() => page.locator(sel("editor")).isVisible(), { ...WAIT, message: "書く欄を畳めない" }).toBe(false);
      expect(await page.locator(sel("stage")).isVisible(), "畳んだら図まで消えた").toBe(true);
    },
    SLOW,
  );

  it(
    "page-shows-export-command-not-rebuilding-notice",
    async () => {
      const { page } = await open();
      await expect.poll(() => page.evaluate(() => document.body.innerText), { ...WAIT, message: "書き出しの命令の案内が無い" }).toContain("dragon export");
      expect(await page.evaluate(() => document.body.innerText)).not.toContain("作り直しの最中");
    },
    SLOW,
  );

  it(
    "english-page-examples-use-english-words",
    async () => {
      const { page } = await open({ locale: "en-US" });
      await drawn(page);
      await expect.poll(() => page.evaluate(() => document.documentElement.lang), { ...WAIT, message: "英語の端末で英語の頁にならない" }).toBe("en");
      for (const key of ["intro", "ccip", "oauth"]) {
        const text = example(`${key}.en.dragon`) ?? "";
        expect(text, `${key} の英語版の見本が無い`).not.toBe("");
        await page.locator(sel("example")).selectOption(key);
        await expect.poll(() => editorValue(page), { ...WAIT, message: `${key} の英語版が書く欄に入らない` }).toBe(text.trimEnd());
        expect((await editorValue(page))?.match(JAPANESE_WORDS)?.[0], `${key} の英語版の見本に日本語の語がある`).toBeUndefined();
        await expect.poll(() => stepsLabel(page), { ...WAIT, message: `${key} の英語版の図が描かれない` }).toContain(titleOf(text));
      }
    },
    SLOW,
  );

  it(
    "json-edit-keeps-notation-language",
    async () => {
      /** JSON の側で題を書き換え、記法の側に戻した時の書く欄の中身 */
      const retitle = async (page: Page, title: string): Promise<string | null> => {
        await click(page, "tab-json");
        let current: Diagram | undefined;
        await expect
          .poll(
            async () => {
              try {
                current = JSON.parse((await editorValue(page)) ?? "") as Diagram;
                return true;
              } catch {
                return false;
              }
            },
            { ...WAIT, message: "JSON の側に図の JSON が出ない" },
          )
          .toBe(true);
        await setEditor(page, JSON.stringify({ ...current, title }, null, 2));
        await expect.poll(() => stepsLabel(page), { ...WAIT, message: "JSON の書き換えが図に反映しない" }).toContain(title);
        await click(page, "tab-notation");
        return editorValue(page);
      };

      // 日本語の頁で英語の語の記法を書いていた時は、英語の語で書き戻す
      const ja = await open({ locale: "ja-JP" });
      await drawn(ja.page);
      await setEditor(ja.page, EDITED_EN);
      await expect.poll(() => stepsLabel(ja.page), { ...WAIT, message: "英語の語の記法で図が描かれない" }).toContain("Edited diagram");
      const fromEnglish = await retitle(ja.page, "Retitled in JSON");
      expect(fromEnglish?.split("\n")[0], "英語の語で書いた記法が英語の語で書き戻されない").toBe("sequence Retitled in JSON");
      expect(fromEnglish?.match(JAPANESE_WORDS)?.[0], "英語の語で書き戻した記法に日本語の語がある").toBeUndefined();

      // 英語の頁で日本語の語の記法を書いていた時は、日本語の語で書き戻す
      const en = await open({ locale: "en-US" });
      await drawn(en.page);
      await setEditor(en.page, EDITED);
      await expect.poll(() => stepsLabel(en.page), { ...WAIT, message: "日本語の語の記法で図が描かれない" }).toContain("書き換えた図");
      const fromJapanese = await retitle(en.page, "JSON で直した図");
      expect(fromJapanese?.split("\n")[0], "日本語の語で書いた記法が日本語の語で書き戻されない").toBe("時系列図 JSON で直した図");

      // 書く欄の最初の行が読めない時は、頁の言葉で書き戻す
      await setEditor(en.page, "not a diagram");
      await expect.poll(() => en.page.locator(sel("status")).getAttribute("data-state"), { ...WAIT, message: "読めない記法が誤りにならない" }).toBe("error");
      const fromUnreadable = await retitle(en.page, "Back from JSON");
      expect(fromUnreadable?.split("\n")[0], "最初の行が読めない時に頁の言葉 (英語) で書き戻されない").toBe("sequence Back from JSON");
    },
    SLOW,
  );

  it(
    "page-errors-follow-notation-language",
    async () => {
      // 日本語の頁で英語の語の記法に誤りがある時は、英語で出す
      const ja = await open({ locale: "ja-JP" });
      await drawn(ja.page);
      await setEditor(ja.page, `${EDITED_EN}\napp -> nowhere : lost`);
      await expect.poll(() => ja.page.locator(sel("status")).getAttribute("data-state"), { ...WAIT, message: "誤りが欄の下に出ない" }).toBe("error");
      await expect.poll(() => statusText(ja.page), { ...WAIT, message: "英語の語の記法の誤りが英語で出ない" }).not.toMatch(KANA_KANJI);
      expect(await statusText(ja.page), "誤りの箱の名前が出ない").toContain("nowhere");

      // 英語の頁で日本語の語の記法に誤りがある時は、日本語で出す
      const en = await open({ locale: "en-US" });
      await drawn(en.page);
      await setEditor(en.page, `${EDITED}\n甲 -> 届け先 : 迷う`);
      await expect.poll(() => statusText(en.page), { ...WAIT, message: "日本語の語の記法の誤りが日本語で出ない" }).toContain("届け先 という箱は宣言していない");
      expect(await statusText(en.page), "誤りの行の番号が記法の言葉で出ない").toContain("9 行目");

      // 最初の行が読めない時は、頁の言葉で出す
      await setEditor(en.page, "not a diagram");
      await expect.poll(() => en.page.locator(sel("status")).getAttribute("data-state"), { ...WAIT, message: "読めない記法が誤りにならない" }).toBe("error");
      expect(await statusText(en.page), "最初の行が読めない時に頁の言葉 (英語) で出ない").not.toMatch(KANA_KANJI);
      await setEditor(ja.page, "not a diagram");
      await expect.poll(() => statusText(ja.page), { ...WAIT, message: "最初の行が読めない時に頁の言葉 (日本語) で出ない" }).toMatch(KANA_KANJI);
    },
    SLOW,
  );

  it("page-bundle-within-budget", () => {
    const sizes = bundleSizes(built.dir);
    const total = Object.values(sizes).reduce((a, b) => a + b, 0);
    expect(Object.keys(sizes).length, "build した script と CSS が無い").toBeGreaterThan(0);
    expect(total, `script と CSS の合計が gzip で ${(total / 1024).toFixed(1)}KB (${JSON.stringify(sizes)})`).toBeLessThanOrEqual(250 * 1024);
  });

  it("page-draws-with-package-parts", () => {
    const sources = pageSources();
    expect(sources.length, "頁の source が無い").toBeGreaterThan(0);
    for (const [path, text] of sources) {
      // 図を描くのは package の部品だけ。頁の側で SVG を組まない
      expect(text, `${path} が SVG を組んでいる`).not.toMatch(/createElementNS|<svg\b/u);
      // package の中の file を直に読まず、公開している入口から読む
      expect(text, `${path} が package の中の file を直に読んでいる`).not.toMatch(/@cardenelabs\/dragon\/(?!fonts["'])|packages\/dragon\/src/u);
      if (/\b(mountDiagram|renderDiagram)\b/u.test(text)) {
        expect(text, `${path} が描く部品を @cardenelabs/dragon から読んでいない`).toMatch(/from\s+["']@cardenelabs\/dragon["']/u);
      }
    }
  });

  it("csp-script-self-only", () => {
    const html = readFileSync(join(built.dir, "index.html"), "utf8");
    const meta = html.match(/<meta\s+http-equiv="Content-Security-Policy"\s+content="([^"]*)"/u);
    expect(meta, "配る頁に CSP の meta が無い").not.toBeNull();
    // build は属性の中の引用符を文字の参照 (`&#39;`) で書く
    const content = (meta?.[1] ?? "").replaceAll("&#39;", "'").replaceAll("&quot;", '"').replaceAll("&amp;", "&");
    const directives = Object.fromEntries(
      content
        .split(";")
        .map((x) => x.trim().split(/\s+/u))
        .filter((x) => x[0])
        .map(([name, ...values]) => [name, values]),
    );
    expect(directives["script-src"], "script を自分の置き場だけにしていない").toEqual(["'self'"]);
    const inline = [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gu)].filter(
      ([, attrs, body]) => !/\bsrc=/u.test(attrs ?? "") || (body ?? "").trim() !== "",
    );
    expect(inline.map(([tag]) => tag), "配る頁に inline の script がある").toEqual([]);
  });
});
