/**
 * 公開する頁 (#2995)。
 *
 * 編集画面 (`/dragon/editor`、#3030) で、左の書く欄に記法を書くと右に動く図が描かれることを確かめる。
 * 頁は build して GitHub Pages と同じ形で配り、画面なしの Chromium で開く (`playground-support.ts`)。
 * 頁の部品は `data-playground` の札で探し、図は `@cardenelabs/dragon` の再生の部品 (`data-dragon` の札) で読む。
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { DEFAULT_PALETTE, type Diagram, FONTS, PALETTES, parseNotation } from "@cardenelabs/dragon";
import type { Page } from "playwright";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";

import { BASE, bundleSizes, example, type Opened, type OpenOptions, pageSources, rgb, type Site, startSite } from "./playground-support";

/** 頁を build して Chromium を起こすまでに許す時間 */
const SETUP = 300_000;
/** 頁の振る舞いを 1 つ確かめるのに許す時間 */
const SLOW = 90_000;
/**
 * Chromium を閉じて配る場所を止めるまでに許す時間。
 * 機械が混んだ時 (load average 120 から 144) に、閉じるだけで既定の 30 秒を 3 回中 2 回超え、
 * 検査が全て通っても組ごと落ちた (#3019)。起こす側 (`SETUP`) と同じく、混み具合で結果が決まらない長さにする。
 */
const TEARDOWN = 90_000;
/** 頁が書き換わるのを待つ長さ */
const WAIT = { timeout: 8_000, interval: 100 } as const;

const sel = (name: string): string => `[data-playground="${name}"]`;
/** 全画面に共通する上の帯の部品 (#3030) */
const siteSel = (name: string): string => `[data-site="${name}"]`;

/** 編集画面の経路 (#3030) */
const EDITOR = `${BASE}editor`;

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

let site: Site;

/** 編集画面を開く。経路を渡さない時は `/dragon/editor` */
const open = (o: OpenOptions = {}): Promise<Opened> => site.open({ path: EDITOR, ...o });

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

/** 再生の釦と段の一覧の読み上げの名前と、寄って動かす見せ方の全体図の札 (#3001)。図が無ければ `null` */
const playerNames = (page: Page): Promise<{ prev: string | null; toggle: string | null; next: string | null; steps: string | null; overview: string | null }> =>
  page.evaluate((s) => {
    const name = (n: string): string | null => document.querySelector(`${s} [data-dragon="${n}"]`)?.getAttribute("aria-label") ?? null;
    const overview = document.querySelector(`${s} svg .dg-mm-t`)?.textContent ?? null;
    return { prev: name("prev"), toggle: name("toggle"), next: name("next"), steps: name("steps"), overview };
  }, sel("stage"));

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

/** 上の帯の釦を押す。言語の切替は帯が持つ (#3030) */
async function clickSite(page: Page, name: string): Promise<void> {
  await expect
    .poll(() => page.evaluate((s) => document.querySelectorAll(s).length, siteSel(name)), { ...WAIT, message: `帯に ${name} の釦が無い` })
    .toBe(1);
  await page.locator(siteSel(name)).click();
}

/** 上の帯の明暗の切替を押して、頁の明暗を `theme` にする (#3030) */
async function setSiteTheme(page: Page, theme: "light" | "dark"): Promise<void> {
  const now = (): Promise<string | null> => page.evaluate(() => document.documentElement.getAttribute("data-scheme"));
  if ((await now()) !== theme) await clickSite(page, "theme");
  await expect.poll(now, { ...WAIT, message: `明暗の切替で頁が ${theme} にならない` }).toBe(theme);
}

/** JSON の側に切り替え、出ている図の JSON を読む (#2999) */
async function jsonSide(page: Page): Promise<Diagram> {
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
  return current as Diagram;
}

async function setEditor(page: Page, text: string): Promise<void> {
  await expect.poll(() => count(page, "editor"), { ...WAIT, message: "書く欄が無い" }).toBe(1);
  await page.locator(sel("editor")).fill(text);
}

/** `data-playground` の札が `prefix` で始まる部品の札と字。棚の一覧の項目を読む (#3031) */
const items = (page: Page, prefix: string): Promise<{ name: string; text: string }[]> =>
  page.evaluate(
    (p) =>
      [...document.querySelectorAll<HTMLElement>(`[data-playground^="${p}"]`)].map((e) => ({ name: e.dataset.playground ?? "", text: e.textContent ?? "" })),
    prefix,
  );

/** 書く欄の記法を読んだ図。読めなければ `undefined` */
const editorDiagram = async (page: Page): Promise<Diagram | undefined> => {
  const parsed = parseNotation((await editorValue(page)) ?? "");
  return parsed.ok ? parsed.diagram : undefined;
};

/** 書く欄で選ばれている字と、書く欄に焦点があるか (#3031) */
const editorSelection = (page: Page): Promise<{ focused: boolean; text: string } | null> =>
  page.evaluate((s) => {
    const e = document.querySelector(s);
    return e instanceof HTMLTextAreaElement ? { focused: document.activeElement === e, text: e.value.slice(e.selectionStart, e.selectionEnd) } : null;
  }, sel("editor"));

/** 知らせの欄の行番号の札の字 (#3031) */
const noticeLines = (page: Page): Promise<string[]> =>
  page.evaluate((s) => [...document.querySelectorAll(s)].map((e) => (e.textContent ?? "").trim()), sel("notice-line"));

/** 図の SVG の画面の上の幅 (#3031) */
const figureWidth = (page: Page): Promise<number> =>
  page.evaluate((s) => document.querySelector(`${s} svg[data-dragon="figure"]`)?.getBoundingClientRect().width ?? 0, sel("stage"));

/** 段の札と進み具合の帯 (#3031) */
const phase = (page: Page): Promise<{ badge: string | null; segments: number; done: number; stepNo: string | null }> =>
  page.evaluate(
    ([stage, badge, segment]) => ({
      badge: document.querySelector(badge)?.textContent?.trim() ?? null,
      segments: document.querySelectorAll(segment).length,
      done: document.querySelectorAll(`${segment}[data-done="true"]`).length,
      stepNo: document.querySelector(`${stage} [data-dragon="step-no"]`)?.textContent ?? null,
    }),
    [sel("stage"), sel("phase-badge"), sel("progress-seg")] as const,
  );

/**
 * 図の地と字の色と、頁の地の色。
 *
 * 図の側の色味の釦は図だけに当て、頁は上の帯の色味 (選ぶまで紙と墨) で塗る (#3033)。
 * 帯の色味を替えないかぎり、頁の地は明暗だけで決まる。
 */
const look = (page: Page): Promise<{ diagram: string; diagramInk: string; page: string }> =>
  page.evaluate((s) => {
    const player = document.querySelector(`${s} .dg-player`);
    const v = (name: string): string => (player ? getComputedStyle(player).getPropertyValue(name).trim().toLowerCase() : "");
    return { diagram: v("--bg"), diagramInk: v("--ink"), page: getComputedStyle(document.body).backgroundColor };
  }, sel("stage"));

const lookOf = (palette: string, theme: "light" | "dark"): { diagram: string; diagramInk: string; page: string } => {
  const v = PALETTES[palette]?.[theme] ?? {};
  // 頁の地は帯の色味の地。帯の色味を選んでいないので紙と墨
  const page = PALETTES[DEFAULT_PALETTE]?.[theme].page ?? "";
  return { diagram: (v.bg ?? "").toLowerCase(), diagramInk: (v.ink ?? "").toLowerCase(), page: rgb(page) };
};

describe("公開する頁 (#2995)", () => {
  beforeAll(async () => {
    site = await startSite();
  }, SETUP);

  afterEach(async () => {
    await site?.closeContexts();
  });

  afterAll(async () => {
    await site?.close();
  }, TEARDOWN);

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
      // 見本は左の棚の見本の一覧から選ぶ (#3031)
      for (const [value, text] of [["intro", intro ?? ""], ["ccip", CCIP], ["oauth", OAUTH]] as const) {
        await click(page, `sample-${value}`);
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
      await clickSite(page, "lang-en");
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
    "palette-and-theme-apply-to-diagram",
    async () => {
      const { page } = await open({ colorScheme: "light" });
      await drawn(page);
      // 図の側の色味は図に当て、明暗は帯で頁と図の両方に当てる。頁の地は図の側の色味で替わらない (#3033)
      for (const [palette, theme] of [["night", "dark"], ["clear", "light"], ["paper", "dark"]] as const) {
        await click(page, `palette-${palette}`);
        await setSiteTheme(page, theme);
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
      for (const file of fonts.files) expect(file.startsWith(`${site.origin}${BASE}`), `頁の外から字を読んでいる: ${file}`).toBe(true);
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
        await click(page, `sample-${key}`);
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

  it(
    "page-json-errors-follow-page-language",
    async () => {
      // 英語の頁で JSON の側に書けない欄を足すと、誤りの文を英語で出す (#2999)
      const en = await open({ locale: "en-US" });
      await drawn(en.page);
      const english = await jsonSide(en.page);
      (english.boxes[0] as unknown as Record<string, unknown>).colour = "blue";
      await setEditor(en.page, JSON.stringify(english, null, 2));
      await expect.poll(() => statusText(en.page), { ...WAIT, message: "英語の頁で JSON の誤りが欄の下に出ない" }).toContain("colour");
      expect(await statusText(en.page), "英語の頁の JSON の誤りの文が英語でない").not.toMatch(KANA_KANJI);

      // 日本語の頁で型の誤りを書くと、ajv の英語の文ではなく日本語で出す
      const ja = await open({ locale: "ja-JP" });
      await drawn(ja.page);
      const japanese = await jsonSide(ja.page);
      await setEditor(ja.page, JSON.stringify({ ...japanese, title: 3 }, null, 2));
      await expect.poll(() => statusText(ja.page), { ...WAIT, message: "日本語の頁で JSON の誤りが欄の下に出ない" }).toContain("/title");
      expect(await statusText(ja.page), "日本語の頁の JSON の誤りの文が日本語でない").toMatch(KANA_KANJI);
      expect(await statusText(ja.page), "日本語の頁の JSON の誤りの文に ajv の英語の文が残る").not.toMatch(/\bmust\b/u);
    },
    SLOW,
  );

  it(
    "page-json-error-follows-language-switch",
    async () => {
      // 記法の欄が見本のまま、JSON の側に書けない欄を足して誤りを出す (#2999)
      const { page } = await open({ locale: "ja-JP" });
      await drawn(page);
      const edited = await jsonSide(page);
      (edited.boxes[0] as unknown as Record<string, unknown>).colour = "blue";
      const written = JSON.stringify(edited, null, 2);
      await setEditor(page, written);
      await expect.poll(() => statusText(page), { ...WAIT, message: "JSON の誤りが欄の下に出ない" }).toContain("colour");
      expect(await statusText(page)).toMatch(KANA_KANJI);

      // 言葉を切り替えても、書いた JSON は見本の英語版に替わらずに残り、誤りを英語で出し直す
      await clickSite(page, "lang-en");
      await expect.poll(() => page.evaluate(() => document.documentElement.lang), { ...WAIT, message: "頁の言葉が英語にならない" }).toBe("en");
      expect(await editorValue(page), "言葉を切り替えると JSON の側に書いた中身が消える").toBe(written.trimEnd());
      await expect.poll(() => statusText(page), { ...WAIT, message: "言葉を切り替えても JSON の誤りが英語で出し直されない" }).not.toMatch(KANA_KANJI);
      expect(await statusText(page), "言葉を切り替えると JSON の誤りが消える").toContain("colour");

      // 日本語に戻すと、日本語で出し直す
      await clickSite(page, "lang-ja");
      await expect.poll(() => statusText(page), { ...WAIT, message: "日本語に戻しても JSON の誤りが日本語で出し直されない" }).toMatch(KANA_KANJI);
      expect(await editorValue(page)).toBe(written.trimEnd());
    },
    SLOW,
  );

  it(
    "page-player-labels-follow-page-language",
    async () => {
      // 手を入れた記法を寄って動かす見せ方で描く。見本ではないので、言葉を切り替えても書いた記法は替わらない (#3001)
      const { page } = await open({ locale: "ja-JP" });
      await drawn(page);
      const [head = "", ...rest] = EDITED.split("\n");
      const written = [head, "見せ方 寄る", ...rest].join("\n");
      await setEditor(page, written);
      await expect.poll(() => stepsLabel(page), { ...WAIT, message: "手を入れた記法で図が描き直されない" }).toContain("書き換えた図");

      await clickSite(page, "lang-en");
      await expect.poll(() => page.evaluate(() => document.documentElement.lang), { ...WAIT, message: "頁の言葉が英語にならない" }).toBe("en");
      expect(await editorValue(page), "言葉を切り替えると手を入れた記法が替わる").toBe(written);
      await expect
        .poll(() => playerNames(page), { ...WAIT, message: "言葉を EN にしても再生の釦と全体図の札が英語にならない" })
        .toMatchObject({ prev: "Previous step", next: "Next step", steps: "Steps of 書き換えた図", overview: "Overview" });
      expect((await playerNames(page)).toggle, "止める釦の読み上げの名前が英語でない").toMatch(/^(Pause|Play)$/u);

      await clickSite(page, "lang-ja");
      await expect
        .poll(() => playerNames(page), { ...WAIT, message: "日本語に戻しても再生の釦と全体図の札が日本語に戻らない" })
        .toMatchObject({ prev: "前の段", next: "次の段", steps: "書き換えた図 の段", overview: "全体図" });
      expect((await playerNames(page)).toggle).toMatch(/^(止める|動かす)$/u);
    },
    SLOW,
  );

  it(
    "page-player-labels-ignore-notation-language",
    async () => {
      // 日本語の頁で英語の語の記法を描いても、再生の釦と全体図の札は頁の言葉で出す (#3001)
      const { page } = await open({ locale: "ja-JP" });
      await drawn(page);
      const [head = "", ...rest] = EDITED_EN.split("\n");
      await setEditor(page, [head, "view follow", ...rest].join("\n"));
      await expect.poll(() => stepsLabel(page), { ...WAIT, message: "英語の語の記法で図が描かれない" }).toContain("Edited diagram");
      await expect
        .poll(() => playerNames(page), { ...WAIT, message: "日本語の頁で再生の釦と全体図の札が日本語で出ない" })
        .toMatchObject({ prev: "前の段", next: "次の段", steps: "Edited diagram の段", overview: "全体図" });
      expect((await playerNames(page)).toggle).toMatch(/^(止める|動かす)$/u);
    },
    SLOW,
  );

  it(
    "editor-shelf-loads-samples-parts-and-filters",
    async () => {
      const intro = example("intro.dragon") ?? "";
      const { page } = await open();
      await drawn(page);
      for (const name of ["new-file", "shelf-tab-samples", "shelf-tab-parts", "shelf-tab-notation", "shelf-filter"]) {
        await expect.poll(() => count(page, name), { ...WAIT, message: `左の棚に ${name} が無い` }).toBe(1);
      }

      // 見本を選ぶと、その見本の記法が書く欄に入り、図が替わる
      for (const [key, text] of [["intro", intro], ["ccip", CCIP]] as const) {
        await click(page, `sample-${key}`);
        await expect.poll(() => editorValue(page), { ...WAIT, message: `見本 ${key} を選んでも書く欄に入らない` }).toBe(text);
        await expect.poll(() => stepsLabel(page), { ...WAIT, message: `見本 ${key} を選んでも図が替わらない` }).toContain(titleOf(text));
      }

      // 絞り込むと見本の一覧が絞れ、空にすると戻る
      const samples = await items(page, "sample-");
      expect(samples.length, "見本の一覧が 2 つ未満").toBeGreaterThan(1);
      await page.locator(sel("shelf-filter")).fill("CCIP");
      await expect.poll(async () => (await items(page, "sample-")).map((i) => i.name), { ...WAIT, message: "絞り込んでも見本の一覧が絞れない" }).toEqual(["sample-ccip"]);
      await page.locator(sel("shelf-filter")).fill("");
      await expect.poll(async () => (await items(page, "sample-")).length, { ...WAIT, message: "絞り込みを空にしても見本の一覧が戻らない" }).toBe(samples.length);

      // 部品を選ぶと、その部品の行が書く欄に足され、記法は読めるまま図が描き直される
      await click(page, "shelf-tab-parts");
      const parts = (await items(page, "part-")).map((i) => i.name);
      expect(parts, "部品の一覧に箱と段と線と処理が無い").toEqual(expect.arrayContaining(["part-box", "part-step", "part-edge", "part-action"]));
      const before = await editorDiagram(page);
      expect(before, "見本の記法が読めない").toBeDefined();
      const lastEvents = (d: Diagram | undefined): number => d?.steps.at(-1)?.events.length ?? -1;
      await click(page, "part-box");
      await expect.poll(async () => (await editorDiagram(page))?.boxes.length, { ...WAIT, message: "箱の部品で箱の行が足されない" }).toBe((before?.boxes.length ?? 0) + 1);
      await click(page, "part-edge");
      await expect.poll(async () => lastEvents(await editorDiagram(page)), { ...WAIT, message: "線の部品で最後の段に線の行が足されない" }).toBe(lastEvents(before) + 1);
      await click(page, "part-step");
      await expect.poll(async () => (await editorDiagram(page))?.steps.length, { ...WAIT, message: "段の部品で段が足されない" }).toBe((before?.steps.length ?? 0) + 1);
      await expect.poll(() => page.locator(sel("status")).getAttribute("data-state"), { ...WAIT, message: "部品を足した記法が誤りになる" }).toBe("ok");
      await expect.poll(async () => (await stepsLabel(page)) ?? "", { ...WAIT, message: "部品を足した記法で図が描き直されない" }).toContain(before?.title ?? "");

      // 絞り込むと部品の一覧が絞れる。残った項目はどれも絞り込みの字を含む
      await page.locator(sel("shelf-filter")).fill("->");
      await expect
        .poll(async () => (await items(page, "part-")).length, { ...WAIT, message: "絞り込んでも部品の一覧が絞れない" })
        .toBeLessThan(parts.length);
      const narrowed = await items(page, "part-");
      expect(narrowed.length, "絞り込むと部品が 1 つも残らない").toBeGreaterThan(0);
      for (const item of narrowed) expect(item.text, `${item.name} が絞り込みの字を含まない`).toContain("->");
      await page.locator(sel("shelf-filter")).fill("");

      // 箱が 1 つしかない図に線の部品を足すと、相手の箱も足して読める線にする
      const lonely = ["時系列図 一人の図", "", "甲 = 甲", "", "# 考える", "> 甲が考える。", "甲 : 考える"].join("\n");
      await setEditor(page, lonely);
      await expect.poll(() => stepsLabel(page), { ...WAIT, message: "箱が 1 つの図が描かれない" }).toContain("一人の図");
      await click(page, "part-edge");
      await expect
        .poll(async () => { const d = await editorDiagram(page); return [d?.boxes.length, d?.steps.at(-1)?.events.at(-1)?.type]; }, { ...WAIT, message: "箱が 1 つの図に線の部品を足すと読めない" })
        .toEqual([2, "edge"]);

      // 英語の語で書いた記法には、英語の語で部品の行を足す
      await setEditor(page, EDITED_EN);
      await expect.poll(() => stepsLabel(page), { ...WAIT, message: "英語の語の記法で図が描かれない" }).toContain("Edited diagram");
      for (const name of ["part-box", "part-edge-tag", "part-step"]) await click(page, name);
      await expect.poll(async () => (await editorDiagram(page))?.steps.length, { ...WAIT, message: "英語の語の記法に部品を足すと読めない" }).toBe(2);
      expect((await editorValue(page))?.match(JAPANESE_WORDS)?.[0], "英語の語の記法に日本語の語の部品が足される").toBeUndefined();

      // 記法の見出しには、行の形の早見が並ぶ
      await click(page, "shelf-tab-notation");
      await expect.poll(async () => (await items(page, "syntax-")).length, { ...WAIT, message: "記法の早見が無い" }).toBeGreaterThan(5);

      // 新規作成で、読める雛形が書く欄に入り、書類名が新しい名前になる
      await click(page, "new-file");
      await expect.poll(async () => (await editorDiagram(page)) !== undefined, { ...WAIT, message: "新規作成の雛形が読めない" }).toBe(true);
      expect(await page.locator(sel("file-name")).inputValue(), "新規作成で書類名が新しい名前にならない").toBe("untitled.dragon");
      await expect.poll(() => stepsLabel(page), { ...WAIT, message: "新規作成の雛形で図が描かれない" }).toContain((await editorDiagram(page))?.title ?? "");
    },
    SLOW,
  );

  it(
    "editor-imports-and-exports-notation",
    async () => {
      const { page } = await open();
      await drawn(page);
      for (const name of ["tab-notation", "tab-json", "file-name", "import", "export"]) {
        await expect.poll(() => count(page, name), { ...WAIT, message: `書く欄の上に ${name} が無い` }).toBe(1);
      }
      expect(await page.locator(sel("file-name")).inputValue(), "開いた見本の書類名でない").toBe("oauth.dragon");

      // 取り込んだ file の記法が書く欄に入り、書類名がその file の名前になる
      await page.locator(sel("import-file")).setInputFiles({ name: "edited.dragon", mimeType: "text/plain", buffer: Buffer.from(EDITED, "utf8") });
      await expect.poll(() => editorValue(page), { ...WAIT, message: "取り込んだ記法が書く欄に入らない" }).toBe(EDITED);
      await expect.poll(() => stepsLabel(page), { ...WAIT, message: "取り込んだ記法で図が描かれない" }).toContain("書き換えた図");
      expect(await page.locator(sel("file-name")).inputValue(), "書類名が取り込んだ file の名前にならない").toBe("edited.dragon");

      // 書き出すと、今の記法が書類名の `.dragon` の file として保存される
      const [download] = await Promise.all([page.waitForEvent("download"), page.locator(sel("export")).click()]);
      expect(download.suggestedFilename(), "書き出す file の名前が書類名でない").toBe("edited.dragon");
      expect(readFileSync(await download.path(), "utf8").trimEnd(), "書き出した file の中身が今の記法でない").toBe(EDITED);

      // 拡張子の無い書類名でも `.dragon` を付けて書き出す
      await page.locator(sel("file-name")).fill("memo");
      const [named] = await Promise.all([page.waitForEvent("download"), page.locator(sel("export")).click()]);
      expect(named.suggestedFilename(), "拡張子の無い書類名に .dragon が付かない").toBe("memo.dragon");

      // 図の原本の JSON の file を取り込むと、記法の側に記法で入る
      const parsed = parseNotation(CCIP);
      expect(parsed.ok).toBe(true);
      const ccip = parsed.ok ? parsed.diagram : undefined;
      await page.locator(sel("import-file")).setInputFiles({ name: "ccip.json", mimeType: "application/json", buffer: Buffer.from(JSON.stringify(ccip), "utf8") });
      await expect.poll(() => editorDiagram(page), { ...WAIT, message: "取り込んだ JSON の図が記法で入らない" }).toEqual(ccip);
    },
    SLOW,
  );

  it(
    "editor-stage-tools-change-view",
    async () => {
      const { page } = await open();
      await drawn(page);
      for (const name of ["font-down", "font-up", "zoom-out", "zoom-in", "fit", "grid", "fullscreen"]) {
        await expect.poll(() => count(page, name), { ...WAIT, message: `図の側に ${name} の道具が無い` }).toBe(1);
      }

      // 拡大と縮小で図の大きさが変わり、全体に合わせると元の大きさに戻る
      await expect.poll(() => figureWidth(page), { ...WAIT, message: "図の幅が測れない" }).toBeGreaterThan(0);
      const fitted = await figureWidth(page);
      await click(page, "zoom-in");
      await expect.poll(() => figureWidth(page), { ...WAIT, message: "拡大しても図が大きくならない" }).toBeGreaterThan(fitted * 1.1);
      await click(page, "zoom-out");
      await click(page, "zoom-out");
      await expect.poll(() => figureWidth(page), { ...WAIT, message: "縮小しても図が小さくならない" }).toBeLessThan(fitted * 0.95);
      await click(page, "fit");
      await expect.poll(async () => Math.abs((await figureWidth(page)) - fitted), { ...WAIT, message: "全体に合わせても元の大きさに戻らない" }).toBeLessThan(1);

      // 格子を出すと、図の地に 24px 刻みの点が出る
      const grid = (): Promise<{ image: string; size: string }> =>
        page.evaluate((s) => {
          const e = document.querySelector(s);
          const style = e ? getComputedStyle(e) : undefined;
          return { image: style?.backgroundImage ?? "", size: style?.backgroundSize ?? "" };
        }, sel("figure"));
      expect((await grid()).image, "格子を出す前から点がある").toBe("none");
      await click(page, "grid");
      await expect.poll(grid, { ...WAIT, message: "格子を出しても 24px 刻みの点が出ない" }).toEqual({ image: expect.stringContaining("radial-gradient"), size: "24px 24px" });

      // 字の大きさを替えると、段の題の字が大きくなり小さくなる
      const titleHeight = (): Promise<number> =>
        page.evaluate((s) => document.querySelector(`${s} [data-dragon="step-title"]`)?.getBoundingClientRect().height ?? 0, sel("stage"));
      const plain = await titleHeight();
      expect(plain, "段の題が描かれていない").toBeGreaterThan(0);
      await click(page, "font-up");
      await expect.poll(titleHeight, { ...WAIT, message: "字を大きくしても段の題が大きくならない" }).toBeGreaterThan(plain);
      await click(page, "font-down");
      await click(page, "font-down");
      await expect.poll(titleHeight, { ...WAIT, message: "字を小さくしても段の題が小さくならない" }).toBeLessThan(plain);
    },
    SLOW,
  );

  it(
    "editor-diagram-readable-and-not-clipped",
    async () => {
      for (const [key, text] of [["oauth", OAUTH], ["ccip", CCIP]] as const) {
        const { page } = await open({ viewport: { width: 1440, height: 900 } });
        await drawn(page);
        await click(page, `sample-${key}`);
        await expect.poll(() => stepsLabel(page), { ...WAIT, message: `見本 ${key} の図が描かれない` }).toContain(titleOf(text));
        const measure = (): Promise<{ font: number; boxes: number; outside: string[]; overview: number; covered: number } | null> =>
          page.evaluate(
            ([stageSel, badgeSel]) => {
              const stage = document.querySelector(stageSel);
              const svg = stage?.querySelector<SVGSVGElement>('svg[data-dragon="figure"]');
              const frame = stage?.querySelector(".dg-frame");
              if (!stage || !svg || !frame) return null;
              // 箱の名前の字の画面の上の大きさ。SVG の中の字の大きさに、図を描いた倍率を掛ける
              const scale = svg.getBoundingClientRect().width / svg.viewBox.baseVal.width;
              const name = svg.querySelector(".dg-sn");
              const font = name ? Number.parseFloat(getComputedStyle(name).fontSize) * scale : 0;
              const area = frame.getBoundingClientRect();
              const boxes = [...svg.querySelectorAll("rect.dg-st")].map((r) => r.getBoundingClientRect());
              const outside = boxes
                .filter((r) => r.left < area.left - 0.5 || r.right > area.right + 0.5 || r.top < area.top - 0.5 || r.bottom > area.bottom + 0.5)
                .map((r) => `${Math.round(r.left)},${Math.round(r.top)} ${Math.round(r.width)}x${Math.round(r.height)}`);
              const hit = (a: DOMRect, b: DOMRect): boolean => a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;
              const map = svg.querySelector(".dg-mm-bg")?.getBoundingClientRect();
              const badge = document.querySelector(badgeSel)?.getBoundingClientRect();
              return {
                font,
                boxes: boxes.length,
                outside,
                overview: map ? boxes.filter((r) => hit(r, map)).length : 0,
                covered: badge ? boxes.filter((r) => hit(r, badge)).length : 0,
              };
            },
            [sel("stage"), sel("phase-badge")] as const,
          );
        // 図を枠に合わせ終えるまで待つ
        await expect.poll(async () => (await measure())?.font ?? 0, { ...WAIT, message: `見本 ${key} の箱の名前の字が 11px を割る` }).toBeGreaterThanOrEqual(10.99);
        const seen = await measure();
        expect(seen?.boxes, `見本 ${key} の箱が描かれていない`).toBeGreaterThan(0);
        expect(seen?.outside, `見本 ${key} の箱が図の領域の外に出る`).toEqual([]);
        expect(seen?.overview, `見本 ${key} の全体図が箱に重なる`).toBe(0);
        expect(seen?.covered, `見本 ${key} の段の札が箱に重なる`).toBe(0);
      }
    },
    SLOW,
  );

  it(
    "editor-phase-badge-and-progress",
    async () => {
      const parsed = parseNotation(OAUTH);
      expect(parsed.ok).toBe(true);
      const steps = parsed.ok ? parsed.diagram.steps : [];
      expect(steps.length, "OAuth の見本の段が 2 つ未満").toBeGreaterThan(1);

      const { page } = await open();
      await drawn(page);
      await expect.poll(() => count(page, "phase-badge"), { ...WAIT, message: "段の札が無い" }).toBe(1);
      // 止めてから読む。動いている間は段が進む
      await page.locator(`${sel("stage")} [data-dragon="toggle"]`).click();
      const expected = (no: string | null): { badge: string; segments: number; done: number; stepNo: string | null } => {
        const n = Number.parseInt(no ?? "", 10);
        return { badge: `段 ${n} / ${steps.length} · ${steps[n - 1]?.title}`, segments: steps.length, done: n, stepNo: no };
      };
      /** 札と帯が、再生の部品の段の番号と同じ段を示すまで待つ */
      const settled = async (message: string): Promise<Awaited<ReturnType<typeof phase>>> => {
        await expect
          .poll(async () => {
            const p = await phase(page);
            return JSON.stringify(p) === JSON.stringify(expected(p.stepNo));
          }, { ...WAIT, message })
          .toBe(true);
        return phase(page);
      };
      const now = await settled("段の札と進み具合の帯が今の段を示さない");
      expect(now).toEqual(expected(now.stepNo));

      // 次の段へ送ると、札と帯がその段を示す
      const n = Number.parseInt(now.stepNo ?? "", 10);
      await page.locator(`${sel("stage")} [data-dragon="${n < steps.length ? "next" : "prev"}"]`).click();
      await expect.poll(async () => (await phase(page)).stepNo, { ...WAIT, message: "段が送られない" }).not.toBe(now.stepNo);
      const moved = await settled("段を送っても札と帯が今の段を示さない");
      expect(moved).toEqual(expected(moved.stepNo));

      // 段が 1 つの図では、札も帯も出さない
      await click(page, "sample-intro");
      await expect.poll(() => stepsLabel(page), { ...WAIT, message: "入門の図が描かれない" }).toContain(titleOf(example("intro.dragon") ?? ""));
      await expect.poll(async () => { const p = await phase(page); return [p.badge, p.segments]; }, { ...WAIT, message: "段が 1 つの図に札か帯が出る" }).toEqual([null, 0]);
    },
    SLOW,
  );

  it(
    "editor-notice-lists-errors-with-lines",
    async () => {
      const { page } = await open();
      await drawn(page);

      // 記法の読み取りの誤り。行番号を押すと、書く欄がその行を選ぶ
      const lines = OAUTH.split("\n");
      const colored = lines.findIndex((l) => /\[色 [a-z]+\]/u.test(l));
      expect(colored, "OAuth の見本に色を書いた行が無い").toBeGreaterThan(0);
      const broken = lines.map((l, i) => (i === colored ? l.replace(/\[色 [a-z]+\]/u, "[色 purple]") : l)).join("\n");
      const error = parseNotation(broken);
      expect(error.ok, "検査に使う記法が誤りにならない").toBe(false);
      const line = error.ok ? 0 : (error.errors[0]?.line ?? 0);
      await setEditor(page, broken);
      await expect.poll(() => noticeLines(page), { ...WAIT, message: "記法の誤りが行番号付きで知らせの欄に出ない" }).toEqual([`${line} 行目`]);
      await click(page, "notice-line");
      await expect.poll(() => editorSelection(page), { ...WAIT, message: "行番号を押しても書く欄がその行を選ばない" }).toEqual({ focused: true, text: broken.split("\n")[line - 1] });

      // schema の誤りが 2 つ (型の誤りと書けない欄) ある JSON。どちらも行番号付きで出し、2 つ目を押すとその行を選ぶ
      await setEditor(page, OAUTH);
      const diagram = await jsonSide(page);
      const wrong = structuredClone(diagram) as unknown as { title: unknown; boxes: Record<string, unknown>[] };
      wrong.title = 3;
      (wrong.boxes[1] as Record<string, unknown>).colour = "blue";
      const json = JSON.stringify(wrong, null, 2);
      const jsonLines = json.split("\n");
      const titleLine = jsonLines.findIndex((l) => l.trim() === '"title": 3,') + 1;
      const colorLine = jsonLines.findIndex((l) => l.includes('"colour": "blue"')) + 1;
      expect(titleLine * colorLine, "検査に使う JSON に誤りの行が無い").toBeGreaterThan(0);
      await setEditor(page, json);
      await expect
        .poll(() => noticeLines(page), { ...WAIT, message: "JSON の schema の誤りが 2 つとも行番号付きで出ない" })
        .toEqual([`${titleLine} 行目`, `${colorLine} 行目`]);
      await page.locator(sel("notice-line")).nth(1).click();
      await expect.poll(() => editorSelection(page), { ...WAIT, message: "2 つ目の行番号を押しても書く欄がその行を選ばない" }).toEqual({ focused: true, text: jsonLines[colorLine - 1] });

      // JSON の字として読めない誤りも、読めなくなった行の番号で出す
      const unreadable = JSON.stringify(diagram, null, 2).replace('"title":', '"title"');
      const badLine = unreadable.split("\n").findIndex((l) => l.trim().startsWith('"title" ')) + 1;
      expect(badLine, "検査に使う JSON に題の行が無い").toBeGreaterThan(0);
      await setEditor(page, unreadable);
      await expect.poll(() => noticeLines(page), { ...WAIT, message: "JSON の読めない誤りが行番号付きで出ない" }).toEqual([`${badLine} 行目`]);
    },
    SLOW,
  );

  it("page-bundle-within-budget", () => {
    const sizes = bundleSizes(site.built.dir);
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
    const html = readFileSync(join(site.built.dir, "index.html"), "utf8");
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
