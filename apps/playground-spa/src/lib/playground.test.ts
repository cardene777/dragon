/**
 * 公開する頁 (#2995)。
 *
 * 編集画面 (`/dragon/editor`、#3030) で、左の書く欄に記法を書くと右に動く図が描かれることを確かめる。
 * 頁は build して GitHub Pages と同じ形で配り、画面なしの Chromium で開く (`playground-support.ts`)。
 * 頁の部品は `data-playground` の札で探し、図は `@cardenelabs/dragon` の再生の部品 (`data-dragon` の札) で読む。
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { gzipSync } from "node:zlib";
import { DEFAULT_PALETTE, type Diagram, FONTS, PALETTES, parseNotation } from "@cardenelabs/dragon";
import { type Browser, chromium, type Page } from "playwright";
import { afterAll, afterEach, beforeAll, describe, expect, inject, it, vi } from "vitest";

import { KINDS } from "../catalog/catalog";
import { PARTS } from "../catalog/parts";
import { PATHS } from "../site/routes";
import { BASE, bundleSizes, barClearance, example, expectSteadyAcrossSteps, firstLoadFiles, type Opened, type OpenOptions, pageSources, pressUntilDisabled, rgb, screenOf, type Site, startSite, waitForCoarse } from "./playground-support";

/** 画面の経路 (頁の置き場の後ろ)。帯の行き先の経路の表と、カタログの分類から導く (#3157) */
const screenRoutes = (): string[] => {
  const relative = (path: string): string => path.slice(PATHS.home.length);
  return [
    ...Object.values(PATHS).map(relative).filter((path) => path !== ""),
    ...KINDS.map((kind) => `${relative(PATHS.catalog)}/${kind}`),
    ...PARTS.map((part) => `${relative(PATHS.catalog)}/part/${part.id}`),
  ].sort();
};

/** 頁が書き換わるのを待つ長さ */
const WAIT = { timeout: 8_000, interval: 100 } as const;

/** 準備の段 (`chromium-preload.ts`) が file を読む前に起こし始めた Chromium。file を読んだ時点で在るかを見るため、file の頭で読む (#3388) */
const preloadedAtImport = (globalThis as Record<symbol, unknown>)[Symbol.for("dragon.chromium")];

const sel = (name: string): string => `[data-playground="${name}"]`;
/** 全画面に共通する上の帯の部品 (#3030) */
const siteSel = (name: string): string => `[data-site="${name}"]`;

/** 編集画面の経路 (#3030) */
const EDITOR = `${BASE}editor`;

const OAUTH = example("oauth.dragon") ?? "";
const CCIP = example("ccip.dragon") ?? "";
/** 値の表を持たず、携帯の幅でも横長の全体図を窓の下に出す見本 (#3274) */
const WALLET = example("wallet.dragon") ?? "";

/** 記法の題。読めない記法なら `undefined` */
const titleOf = (text: string): string | undefined => {
  const parsed = parseNotation(text);
  return parsed.ok ? parsed.diagram.title : undefined;
};

/** 書き換えに使う、箱 2 つと線 1 本の図 */
const EDITED = ["sequence 書き換えた図", "", "box 甲 as 甲のサービス", "box 乙 as 乙のサービス", "", "step 呼ぶ", "  say 甲が乙を呼ぶ。", "  甲 -> 乙: 呼ぶ"].join("\n");
/** `EDITED` と同じ形を英語で書いた図 (#2997) */
const EDITED_EN = ["sequence Edited diagram", "", "box app as App service", "box api as API service", "", "step Call", "  say App calls API.", "  app -> api: call"].join("\n");

/**
 * 前の形の記法の日本語の語 (#2997)。行の頭の語と、行の終わりの指定の語。
 * 新しい dragon記法は語を英語だけで書くので (#3137)、頁の検査は日本語の語が書く欄に残っていないかを見る。
 */
const JAPANESE_WORDS = /^\s*(時系列図|構成図|区画|帯|見せ方)\s|\[(色|印|区画|名前|札|硬貨|なし|封筒)[\s\]]/mu;
/** 前の形の記法の行 (#3137)。段の見出し `#`、段の本文 `>`、箱の下の字を囲む「」 */
const OLD_FORM_LINES = /^\s*(時系列図|構成図|#|>)|「/mu;
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

/** 図の側の倍率の字 (#3105) */
const zoomLevel = (page: Page): Promise<string> => page.evaluate((s) => document.querySelector(s)?.textContent?.trim() ?? "", sel("zoom-level"));

/**
 * 段の題に掛かる字の大きさの倍率 (小数 2 桁、#3103)。
 * 字の大きさは `zoom` で段の番号と題と本文に掛かる。題の高さは行の高さの端数が丸まるので、倍率と揃わない
 */
const titleZoom = (page: Page): Promise<number> =>
  page.evaluate((s) => {
    const title = document.querySelector(`${s} [data-dragon="step-title"]`);
    return title ? Math.round(Number(getComputedStyle(title).zoom) * 100) / 100 : 0;
  }, sel("stage"));

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
  });

  afterEach(async () => {
    await site?.closeContexts();
  });

  afterAll(async () => {
    await site?.close();
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
  );

  it(
    "notation-error-shows-line-and-keeps-diagram",
    async () => {
      // 段「認可サーバーへ回す」の `say` の行を本文の無い `say` にすると、その行が誤りになる。
      // `say` の行を消した段は、段の線の名前から本文を導いて読めるので誤りにならない (#3438)
      const lines = OAUTH.split("\n");
      const head = lines.indexOf("step 認可サーバーへ回す");
      expect(head, "OAuth の見本に段「認可サーバーへ回す」が無い").toBeGreaterThan(0);
      const broken = lines.map((line, i) => (i === head + 1 ? "  say" : line)).join("\n");
      // 開く頁は日本語なので、頁が出す誤りの文と比べる文も ja で作る (既定は英語、#3338)
      const parsed = parseNotation(broken, { lang: "ja" });
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
      (changed.blocks.box?.[0] as NonNullable<Diagram["blocks"]["box"]>[number]).name = "JSON で書いた箱";
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
  );

  it(
    "json-error-shows-pointer-under-csp",
    async () => {
      const parsed = parseNotation(OAUTH);
      expect(parsed.ok).toBe(true);
      const diagram = structuredClone(parsed.ok ? parsed.diagram : ({} as Diagram));
      const index = (diagram.blocks.box ?? []).findIndex((box) => box.color === "violet");
      expect(index, "OAuth の見本に violet の箱が無い").toBeGreaterThanOrEqual(0);
      (diagram.blocks.box?.[index] as unknown as { color: string }).color = "purple";

      const { page, violations } = await open();
      await drawn(page);
      await click(page, "tab-json");
      await setEditor(page, JSON.stringify(diagram, null, 2));
      await expect.poll(() => statusText(page), { ...WAIT, message: "誤った欄の場所が欄の下に出ない" }).toContain(`/blocks/box/${index}/color`);
      const status = await statusText(page);
      expect(status.replace(`/blocks/box/${index}/color`, "").trim().length, "誤りの理由が出ない").toBeGreaterThan(3);
      expect(await stepsLabel(page), "最後に描けた図が残っていない").toContain(titleOf(OAUTH));
      expect(await violations(), "CSP に止められた読み込みか実行がある").toEqual([]);
    },
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
  );

  it(
    "page-shows-export-command-not-rebuilding-notice",
    async () => {
      const { page } = await open();
      await expect.poll(() => page.evaluate(() => document.body.innerText), { ...WAIT, message: "書き出しの命令の案内が無い" }).toContain("dragon export");
      expect(await page.evaluate(() => document.body.innerText)).not.toContain("作り直しの最中");
    },
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
  );

  it(
    "json-edit-prints-dragon-notation",
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

      /** 書き戻した記法が新しい形で、読み直すと JSON の側で直した題になる */
      const expectDragonNotation = (written: string | null, title: string, where: string): void => {
        expect(written?.split("\n")[0], `${where} で書き戻した最初の行が sequence と題でない`).toBe(`sequence ${title}`);
        expect(written?.match(OLD_FORM_LINES)?.[0], `${where} で書き戻した記法に前の形の行がある`).toBeUndefined();
        expect(written?.match(JAPANESE_WORDS)?.[0], `${where} で書き戻した記法に日本語の語がある`).toBeUndefined();
        const parsed = parseNotation(written ?? "");
        expect(parsed.ok && parsed.diagram.title, `${where} で書き戻した記法を読み直すと題が違う`).toBe(title);
      };

      // どちらの言葉の頁でも、JSON の側で直した図を dragon記法で書き戻す
      for (const [locale, text, drawnTitle, title] of [
        ["ja-JP", EDITED_EN, "Edited diagram", "Retitled in JSON"],
        ["en-US", EDITED, "書き換えた図", "JSON で直した図"],
      ] as const) {
        const { page } = await open({ locale });
        await drawn(page);
        await setEditor(page, text);
        await expect.poll(() => stepsLabel(page), { ...WAIT, message: `${locale} の頁で書いた記法の図が描かれない` }).toContain(drawnTitle);
        const back = await retitle(page, title);
        expectDragonNotation(back, title, `${locale} の頁`);
        expect(back, `${locale} の頁で書き戻した段が step の行で始まらない`).toMatch(/^step /mu);

        // 書く欄の最初の行が読めない時も、JSON の側で直した図を dragon記法で書き戻す
        await setEditor(page, "not a diagram");
        await expect.poll(() => page.locator(sel("status")).getAttribute("data-state"), { ...WAIT, message: "読めない記法が誤りにならない" }).toBe("error");
        expectDragonNotation(await retitle(page, "Back from JSON"), "Back from JSON", `${locale} の頁の読めない記法から`);
      }
    },
  );

  it(
    "page-errors-follow-page-language",
    async () => {
      // dragon記法の語は英語だけで、図の字の言葉では誤りの言葉が決まらない。日本語の頁では、英語の字の図の誤りも日本語で出す (#3137)
      const ja = await open({ locale: "ja-JP" });
      await drawn(ja.page);
      await setEditor(ja.page, `${EDITED_EN}\n  app -> nowhere: lost`);
      await expect.poll(() => ja.page.locator(sel("status")).getAttribute("data-state"), { ...WAIT, message: "誤りが欄の下に出ない" }).toBe("error");
      await expect.poll(() => statusText(ja.page), { ...WAIT, message: "日本語の頁で英語の字の図の誤りが日本語で出ない" }).toContain("nowhere という箱は宣言していない");
      expect(await statusText(ja.page), "誤りの行の番号が頁の言葉で出ない").toContain("9 行目");

      // 英語の頁では、日本語の字の図の誤りも英語で出す
      const en = await open({ locale: "en-US" });
      await drawn(en.page);
      await setEditor(en.page, `${EDITED}\n  甲 -> 届け先: 迷う`);
      await expect.poll(() => statusText(en.page), { ...WAIT, message: "英語の頁で日本語の字の図の誤りが英語で出ない" }).toContain("No box named 届け先 is declared");
      expect(await statusText(en.page), "誤りの行の番号が頁の言葉で出ない").toContain("Line 9");

      // 最初の行が読めない時は、頁の言葉で出す
      await setEditor(en.page, "not a diagram");
      await expect.poll(() => en.page.locator(sel("status")).getAttribute("data-state"), { ...WAIT, message: "読めない記法が誤りにならない" }).toBe("error");
      expect(await statusText(en.page), "最初の行が読めない時に頁の言葉 (英語) で出ない").not.toMatch(KANA_KANJI);
      await setEditor(ja.page, "not a diagram");
      await expect.poll(() => statusText(ja.page), { ...WAIT, message: "最初の行が読めない時に頁の言葉 (日本語) で出ない" }).toMatch(KANA_KANJI);
    },
  );

  it(
    "page-json-errors-follow-page-language",
    async () => {
      // 英語の頁で JSON の側に書けない欄を足すと、誤りの文を英語で出す (#2999)
      const en = await open({ locale: "en-US" });
      await drawn(en.page);
      const english = await jsonSide(en.page);
      (english.blocks.box?.[0] as unknown as Record<string, unknown>).colour = "blue";
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
  );

  it(
    "page-json-error-follows-language-switch",
    async () => {
      // 記法の欄が見本のまま、JSON の側に書けない欄を足して誤りを出す (#2999)
      const { page } = await open({ locale: "ja-JP" });
      await drawn(page);
      const edited = await jsonSide(page);
      (edited.blocks.box?.[0] as unknown as Record<string, unknown>).colour = "blue";
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
  );

  it(
    "page-player-labels-follow-page-language",
    async () => {
      // 手を入れた記法を寄って動かす見せ方で描く。見本ではないので、言葉を切り替えても書いた記法は替わらない (#3001)
      const { page } = await open({ locale: "ja-JP" });
      await drawn(page);
      const [head = "", ...rest] = EDITED.split("\n");
      const written = [`${head} [view: follow]`, ...rest].join("\n");
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
        .toMatchObject({ prev: "前の段", next: "次の段", steps: "書き換えた図の段", overview: "全体図" });
      expect((await playerNames(page)).toggle).toMatch(/^(止める|動かす)$/u);
    },
  );

  it(
    "page-player-labels-ignore-notation-language",
    async () => {
      // 日本語の頁で英語の字の図を描いても、再生の釦と全体図の札は頁の言葉で出す (#3001)
      const { page } = await open({ locale: "ja-JP" });
      await drawn(page);
      const [head = "", ...rest] = EDITED_EN.split("\n");
      await setEditor(page, [`${head} [view: follow]`, ...rest].join("\n"));
      await expect.poll(() => stepsLabel(page), { ...WAIT, message: "英語の字の図が描かれない" }).toContain("Edited diagram");
      await expect
        .poll(() => playerNames(page), { ...WAIT, message: "日本語の頁で再生の釦と全体図の札が日本語で出ない" })
        // 段の一覧の名前は題と「の段」の間に空白を置かない (#3517)
        .toMatchObject({ prev: "前の段", next: "次の段", steps: "Edited diagramの段", overview: "全体図" });
      expect((await playerNames(page)).toggle).toMatch(/^(止める|動かす)$/u);
    },
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
      await expect.poll(async () => (await editorDiagram(page))?.blocks.box?.length, { ...WAIT, message: "箱の部品で箱の行が足されない" }).toBe((before?.blocks.box?.length ?? 0) + 1);
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
      const lonely = ["sequence 一人の図", "", "box 甲", "", "step 考える", "  say 甲が考える。", "  act 甲: 考える"].join("\n");
      await setEditor(page, lonely);
      await expect.poll(() => stepsLabel(page), { ...WAIT, message: "箱が 1 つの図が描かれない" }).toContain("一人の図");
      await click(page, "part-edge");
      await expect
        .poll(async () => { const d = await editorDiagram(page); return [d?.blocks.box?.length, d?.steps.at(-1)?.events.at(-1)?.type]; }, { ...WAIT, message: "箱が 1 つの図に線の部品を足すと読めない" })
        .toEqual([2, "edge"]);

      // 英語の字の図にも、dragon記法の語で部品の行を足す (#3137)
      await setEditor(page, EDITED_EN);
      await expect.poll(() => stepsLabel(page), { ...WAIT, message: "英語の字の図が描かれない" }).toContain("Edited diagram");
      for (const name of ["part-box", "part-edge-tag", "part-step"]) await click(page, name);
      await expect.poll(async () => (await editorDiagram(page))?.steps.length, { ...WAIT, message: "英語の字の図に部品を足すと読めない" }).toBe(2);
      expect((await editorValue(page))?.match(JAPANESE_WORDS)?.[0], "部品が前の形の日本語の語で足される").toBeUndefined();

      // 記法の見出しには、行の形の早見が並ぶ
      await click(page, "shelf-tab-notation");
      await expect.poll(async () => (await items(page, "syntax-")).length, { ...WAIT, message: "記法の早見が無い" }).toBeGreaterThan(5);

      // 新規作成で、読める雛形が書く欄に入り、書類名が新しい名前になる。欄には拡張子を出さない (#3087)。
      // 新しい名前は指で触るタブレットの英語の欄にも収まる new で、そのまま書き出すと new.dragon になる (#3089)
      await click(page, "new-file");
      await expect.poll(async () => (await editorDiagram(page)) !== undefined, { ...WAIT, message: "新規作成の雛形が読めない" }).toBe(true);
      expect(await page.locator(sel("file-name")).inputValue(), "新規作成で書類名が新しい名前にならない").toBe("new");
      await expect.poll(() => stepsLabel(page), { ...WAIT, message: "新規作成の雛形で図が描かれない" }).toContain((await editorDiagram(page))?.title ?? "");
      const [download] = await Promise.all([page.waitForEvent("download"), page.locator(sel("export")).click()]);
      expect(download.suggestedFilename(), "新規作成した書類を書き出す file の名前が new.dragon でない").toBe("new.dragon");
    },
  );

  it(
    "editor-imports-and-exports-notation",
    async () => {
      const { page } = await open();
      await drawn(page);
      for (const name of ["tab-notation", "tab-json", "file-name", "import", "export"]) {
        await expect.poll(() => count(page, name), { ...WAIT, message: `書く欄の上に ${name} が無い` }).toBe(1);
      }
      // 書類名の欄には拡張子を出さない (#3087)
      expect(await page.locator(sel("file-name")).inputValue(), "開いた見本の書類名でない").toBe("oauth");

      // 取り込んだ file の記法が書く欄に入り、書類名がその file の名前になる
      await page.locator(sel("import-file")).setInputFiles({ name: "edited.dragon", mimeType: "text/plain", buffer: Buffer.from(EDITED, "utf8") });
      await expect.poll(() => editorValue(page), { ...WAIT, message: "取り込んだ記法が書く欄に入らない" }).toBe(EDITED);
      await expect.poll(() => stepsLabel(page), { ...WAIT, message: "取り込んだ記法で図が描かれない" }).toContain("書き換えた図");
      expect(await page.locator(sel("file-name")).inputValue(), "書類名が取り込んだ file の名前にならない").toBe("edited");

      // 書き出すと、今の記法が書類名の `.dragon` の file として保存される
      const [download] = await Promise.all([page.waitForEvent("download"), page.locator(sel("export")).click()]);
      expect(download.suggestedFilename(), "書き出す file の名前が書類名でない").toBe("edited.dragon");
      const exported = Buffer.concat((await (await download.createReadStream()).toArray()) as Buffer[]).toString("utf8");
      expect(exported.trimEnd(), "書き出した file の中身が今の記法でない").toBe(EDITED);

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
  );

  it(
    "editor-exports-empty-name-as-new",
    async () => {
      const { page } = await open();
      await drawn(page);
      // 書類名の欄を空にして書き出すと、新規作成と同じ new に `.dragon` を付けて保存する (#3091)
      await page.locator(sel("file-name")).fill("");
      const [download] = await Promise.all([page.waitForEvent("download"), page.locator(sel("export")).click()]);
      expect(download.suggestedFilename(), "書類名が空の時に書き出す file の名前が new.dragon でない").toBe("new.dragon");
    },
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
      // 拡大と縮小の 1 回は 1.2 倍の刻み。刻みが粗くなると見たい大きさに合わせにくい (#3103)
      const zoomRatio = async (): Promise<number> => Math.round(((await figureWidth(page)) / fitted) * 100) / 100;
      await click(page, "zoom-in");
      await expect.poll(zoomRatio, { ...WAIT, message: "拡大しても図の幅が全体に合わせた時の 1.2 倍にならない" }).toBe(1.2);
      await click(page, "zoom-out");
      await click(page, "zoom-out");
      await expect.poll(zoomRatio, { ...WAIT, message: "続けて縮小を 2 回押しても図の幅が全体に合わせた時の 1 / 1.2 倍にならない" }).toBe(0.83);
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
      // 字の大きさの 1 回は 1.15 倍の刻み (#3103)
      const say = (): Promise<number> => titleZoom(page);
      await click(page, "font-up");
      await expect.poll(titleHeight, { ...WAIT, message: "字を大きくしても段の題が大きくならない" }).toBeGreaterThan(plain);
      await expect.poll(say, { ...WAIT, message: "字を大きくしても段の題の字が 1.15 倍にならない" }).toBe(1.15);
      await click(page, "font-down");
      await click(page, "font-down");
      await expect.poll(titleHeight, { ...WAIT, message: "字を小さくしても段の題が小さくならない" }).toBeLessThan(plain);
      await expect.poll(say, { ...WAIT, message: "続けて字を 2 回小さくしても段の題の字が 1 / 1.15 倍にならない" }).toBe(0.87);
    },
  );

  it(
    "editor-zoom-stops-at-range",
    async () => {
      // 拡大と縮小は 25% から 400% の間で止まり、端に着くとその向きの釦が押せなくなる (#3105)
      const { page } = await open();
      await drawn(page);
      await expect.poll(() => zoomLevel(page), { ...WAIT, message: "倍率が出ない" }).toMatch(/%$/);
      const end = async (name: string): Promise<{ level: string; disabled: boolean }> => ({ level: await zoomLevel(page), disabled: await page.locator(sel(name)).isDisabled() });
      await pressUntilDisabled(page, sel("zoom-in"));
      await expect.poll(() => end("zoom-in"), { ...WAIT, message: "拡大を押し続けても 400% で止まらないか、拡大の釦が押せるまま残る" }).toEqual({ level: "400%", disabled: true });
      await pressUntilDisabled(page, sel("zoom-out"));
      await expect.poll(() => end("zoom-out"), { ...WAIT, message: "縮小を押し続けても 25% で止まらないか、縮小の釦が押せるまま残る" }).toEqual({ level: "25%", disabled: true });
    },
  );

  it(
    "editor-text-size-stops-at-range",
    async () => {
      // 字の大きさは 0.7 倍から 1.6 倍の間で止まる。1.15 倍の刻みで、上の端には 4 回目、そこから下の端には 6 回目で着く (#3105)
      const { page } = await open();
      await drawn(page);
      for (let i = 0; i < 5; i++) await click(page, "font-up");
      await expect.poll(() => titleZoom(page), { ...WAIT, message: "字を大きくし続けても段の題の字が 1.6 倍で止まらない" }).toBe(1.6);
      for (let i = 0; i < 8; i++) await click(page, "font-down");
      await expect.poll(() => titleZoom(page), { ...WAIT, message: "字を小さくし続けても段の題の字が 0.7 倍で止まらない" }).toBe(0.7);
    },
  );

  it(
    "editor-small-figure-fit-capped",
    async () => {
      // 枠より十分小さな図は、枠に収まる倍率 (1280 × 860 で 2.9 倍) まで膨らませず、1.5 倍で止める (#3105)
      const { page } = await open();
      await drawn(page);
      await setEditor(page, ["sequence 小さな図", "", "box 甲", "box 乙", "", "step 最初の段", "  say 呼ぶ。", "  甲 -> 乙: 呼ぶ"].join("\n"));
      const shown = async (): Promise<{ level: string; scale: number }> => ({
        level: await zoomLevel(page),
        scale: await page.evaluate((s) => {
          const svg = document.querySelector<SVGSVGElement>(`${s} svg[data-dragon="figure"]`);
          return svg ? Math.round((svg.getBoundingClientRect().width / svg.viewBox.baseVal.width) * 100) / 100 : 0;
        }, sel("stage")),
      });
      await expect.poll(shown, { ...WAIT, message: "小さな図を枠に合わせた倍率が 150% で止まらない" }).toEqual({ level: "150%", scale: 1.5 });
    },
  );

  it(
    "narrow-editor-caption-font-scales",
    async () => {
      // 携帯の幅で帯の並べ方を替えても、字の大きさの釦が段の題と本文の字に効く (#3057)
      // 段を自動で送ると本文の長さが変わり、字の大きさの差を別の段どうしで比べてしまうので、動きを止めて同じ段で比べる (#3294)
      const { page } = await open({ viewport: { width: 360, height: 780 }, reducedMotion: "reduce" });
      await drawn(page);
      const sizes = (): Promise<{ title: number; body: number }> =>
        page.evaluate((s) => {
          const height = (name: string): number => document.querySelector(`${s} [data-dragon="${name}"]`)?.getBoundingClientRect().height ?? 0;
          return { title: height("step-title"), body: height("step-body") };
        }, sel("stage"));
      const plain = await sizes();
      expect(plain.title > 0 && plain.body > 0, "段の題か本文が描かれていない").toBe(true);
      await click(page, "font-up");
      await expect
        .poll(async () => {
          const now = await sizes();
          return now.title > plain.title && now.body > plain.body;
        }, { ...WAIT, message: "字を大きくしても段の題か本文が大きくならない" })
        .toBe(true);
      await click(page, "font-down");
      await click(page, "font-down");
      await expect
        .poll(async () => {
          const now = await sizes();
          return now.title < plain.title && now.body < plain.body;
        }, { ...WAIT, message: "字を小さくしても段の題か本文が小さくならない" })
        .toBe(true);
    },
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
  );

  // 段の本文の行の数で帯の高さが替わり、1440 × 900 の ccip で図が上下に動いていた (#3049)
  describe.for([
    ["oauth", OAUTH],
    ["ccip", CCIP],
  ] as const)("%s", ([key, text]) => {
    it("editor-figure-steady-across-steps", async () => {
      const { page } = await open({ viewport: { width: 1440, height: 900 }, reducedMotion: "reduce" });
      await drawn(page);
      await click(page, `sample-${key}`);
      await expect.poll(() => stepsLabel(page), { ...WAIT, message: `見本 ${key} の図が描かれない` }).toContain(titleOf(text));
      await expectSteadyAcrossSteps(page, sel("stage"), `編集画面の見本 ${key}`);
    });
  });

  it(
    "editor-caption-clear-of-bottom-edge",
    async () => {
      // 段の本文の帯の下に余白が無く、本文の最後の行が図の側の下の縁 (進み具合の帯の上) に接していた (#3051)。帯の最後の行を縁から離す (#3398)
      for (const [key, text] of [["oauth", OAUTH], ["ccip", CCIP]] as const) {
        const { page } = await open({ viewport: { width: 1440, height: 900 } });
        await drawn(page);
        await click(page, `sample-${key}`);
        await expect.poll(() => stepsLabel(page), { ...WAIT, message: `見本 ${key} の図が描かれない` }).toContain(titleOf(text));
        // 帯の下の余白は 6px。広がると図の枠が低くなる (#3101)
        await expect
          .poll(async () => {
            const clearance = await barClearance(page, sel("stage"), sel("figure"));
            return clearance === null ? null : Math.round(clearance);
          }, { ...WAIT, message: `見本 ${key} で、帯の最後の行と図の側の下の縁の間が 6px でない` })
          .toBe(6);
      }
    },
  );

  it(
    "editor-overview-beside-window-and-in-frame",
    async () => {
      // 寄って追う図になる幅で開く。携帯の幅と、記法と並べて図の枠が 560px になる幅 (#3042)。
      // 縦長の全体図を持つ oauth (#3055) と値の表を持つ ccip (#3274) は、携帯の幅では全体図を出さないので 860px だけで見る。
      // 携帯の幅は、表を持たず横長の全体図を出す wallet で見る
      const cases = [
        [860, "oauth", OAUTH],
        [390, "wallet", WALLET],
        [860, "ccip", CCIP],
      ] as const;
      for (const [width, key, text] of cases) {
        const parsed = parseNotation(text);
        const steps = parsed.ok ? parsed.diagram.steps.length : 0;
        expect(steps, `見本 ${key} の段が無い`).toBeGreaterThan(1);
        // 狭い幅では見本の棚が畳まれるので、見本は共有の形の URL (`#n=`) で開く
        const shared = `${EDITOR}#n=${Buffer.from(text, "utf8").toString("base64url")}`;
        const { page } = await open({ path: shared, viewport: { width, height: 900 } });
        await drawn(page);
        await expect.poll(() => stepsLabel(page), { ...WAIT, message: `${width}px で見本 ${key} の図が描かれない` }).toContain(titleOf(text));
        // 止めてから段を送る。動いている間は段が進む
        await page.locator(`${sel("stage")} [data-dragon="toggle"]`).click();
        const measure = (): Promise<{ view: string | null; covers: boolean; inside: boolean } | null> =>
          page.evaluate((s) => {
            const svg = document.querySelector(`${s} svg[data-dragon="figure"]`);
            const frame = document.querySelector(`${s} .dg-frame`)?.getBoundingClientRect();
            const view = svg?.querySelector(".dg-vp-frame")?.getBoundingClientRect();
            const map = svg?.querySelector(".dg-mm-bg")?.getBoundingClientRect();
            if (!svg || !frame || !view || !map) return null;
            return {
              view: svg.getAttribute("data-view"),
              covers: view.left < map.right && map.left < view.right && view.top < map.bottom && map.top < view.bottom,
              inside: map.left >= frame.left - 0.5 && map.right <= frame.right + 0.5 && map.top >= frame.top - 0.5 && map.bottom <= frame.bottom + 0.5,
            };
          }, sel("stage"));
        for (let s = 1; s <= steps; s++) {
          if (s > 1) await page.locator(`${sel("stage")} [data-dragon="next"]`).click();
          await expect
            .poll(async () => Number.parseInt((await stepNo(page)) ?? "", 10), { ...WAIT, message: `${width}px の見本 ${key} が段 ${s} へ進まない` })
            .toBe(s);
          const seen = await measure();
          expect(seen, `${width}px の見本 ${key} の段 ${s} に窓か全体図が無い`).not.toBeNull();
          expect(seen?.view, `${width}px の見本 ${key} が寄って追う見せ方にならない`).toBe("follow");
          expect(seen?.covers, `${width}px の見本 ${key} の段 ${s} で全体図が窓に重なる`).toBe(false);
          expect(seen?.inside, `${width}px の見本 ${key} の段 ${s} で全体図が図の枠からはみ出す`).toBe(true);
        }
      }
    },
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
  );

  it(
    "editor-notice-lists-errors-with-lines",
    async () => {
      const { page } = await open();
      await drawn(page);

      // 記法の読み取りの誤り。行番号を押すと、書く欄がその行を選ぶ
      const lines = OAUTH.split("\n");
      const colored = lines.findIndex((l) => /color: [a-z]+/u.test(l));
      expect(colored, "OAuth の見本に色を書いた行が無い").toBeGreaterThan(0);
      const broken = lines.map((l, i) => (i === colored ? l.replace(/color: [a-z]+/u, "color: purple") : l)).join("\n");
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
      const wrong = structuredClone(diagram) as unknown as { title: unknown; blocks: { box: Record<string, unknown>[] } };
      wrong.title = 3;
      (wrong.blocks.box[1] as Record<string, unknown>).colour = "blue";
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
  );

  // 上限は 250KB で始め、#3199 で 270KB にした。図の種類が 5 つになり、記法の語ごとに全ての図の種類と 2 つの言葉の
  // 見本帳の部品を置く決まりのため、語を 1 つ足すと 1KB ほど増える。#3199 の前の main で残りが 1.3KB しか無かった。
  // #3239 で 290KB にした。列の図を足すと 266.2KB から 277.6KB に増える (検査の関数 3.5KB、部品と見本の記法 5KB、描く部品 3KB)
  // #3246 で、上限を頁が最初に読む script と CSS に当てる形にした。見本と部品の図の記法は後から読む塊に分け、
  // 全部の塊の合計は分けてもほぼ減らないので上限を当てず、前の記録と同じ数え方で比べられるよう落ちた時の文に並べる
  it("page-bundle-within-budget", () => {
    const sizes = bundleSizes(site.built.dir);
    const first = firstLoadFiles(site.built.dir);
    const kb = (bytes: number): string => `${(bytes / 1024).toFixed(1)}KB`;
    const sum = (names: string[]): number => names.reduce((a, name) => a + (sizes[name] ?? 0), 0);
    const all = sum(Object.keys(sizes));
    const loaded = sum(first);
    expect(first.length, "build した頁が最初に読む script と CSS が無い").toBeGreaterThan(0);
    expect(first.filter((name) => sizes[name] === undefined), "最初に読む file が build の assets に無い").toEqual([]);
    const report = `最初に読む script と CSS が gzip で ${kb(loaded)} (${JSON.stringify(Object.fromEntries(first.map((name) => [name, sizes[name]])))})、全部の塊の合計が ${kb(all)}`;
    expect(loaded, report).toBeLessThanOrEqual(290 * 1024);
    // 種類の描く部品を後から読む形 (#3248) と、使い方とカタログの頁を後から読む形 (#3280) にした分を確かめる。
    // #3280 の前の実測は 226.8KB で後の実測は 203.0KB。#3292 で字の `@font-face` を外して 168.5KB にした。#3248 の時と同じく余裕を約 10KB 残す。
    // 列の図の見直し (#3354) で 178.8KB になり、原本の版2 (#3346) の組み直しと版1の移しがどの頁でも最初に要るので 180.3KB になった。
    // 版1を読む処理はその場で答えを返すため後から読めず、上限を 181KB に上げた。図が使うブロックだけを読む軽い入口 (#3349) で下げる
    // 試す図 (#3337) の記法を読む処理と形の検査はほかの種類と同じく最初に要り、191.8KB になったので、本人が選んで上限を 193KB に上げた
    // 図が使うブロックだけを読む軽い入口 (#3349) で、後から読む種類の個別ブロックの読み方が最初の script から抜けて 181.1KB になった。余裕を約 10KB 残して上限を 191KB に下げた
    // 記法から読んだ図は描く時に原本の形の検査を省き、検査は原本の JSON を描く時だけ後から読むので、上限を 10KB 下げて 181KB にした (#3400)
    // 狭い枠で配管の図を読める大きさから始める処理 (#3483) が置いた時に要り、181.1KB になったので、本人が選んで上限を 182KB に上げた
    expect(loaded, report).toBeLessThanOrEqual(182 * 1024);
    // 分ける前は最初に読む量が全部の合計と同じだった (0.44.0 の後の main で 277.59KB)。見本と部品の図の記法は gzip で 20KB を超えるので、
    // 外せば全部の合計より 20KB 以上小さくなる
    expect(all - loaded, report).toBeGreaterThanOrEqual(20 * 1024);
  });

  // 崩れの検査 (#3484) は `dragon check --layout` と `checkLayoutText` だけが使う。描くだけの頁が最初に読むと、
  // 使わない部品の分だけ上の上限を押し上げるので、崩れの種類の名前で最初の script に入っていないことを確かめる (#3494)
  it("first-load-carries-no-layout-check", () => {
    const first = firstLoadFiles(site.built.dir)
      .filter((name) => name.endsWith(".js"))
      .map((name) => readFileSync(join(site.built.dir, "assets", name), "utf8"))
      .join("\n");
    expect(first.length, "build した頁が最初に読む script が無い (走査の空振り)").toBeGreaterThan(0);
    const kinds = ["badges-close", "lines-close", "badge-off-shape", "slot-outside-shape", "text-outside-shape", "part-outside-frame", "panel-edge", "label-off-line"];
    expect(
      kinds.filter((kind) => first.includes(`"${kind}"`) || first.includes(`'${kind}'`) || first.includes(`\`${kind}\``)),
      "最初に読む script に在る崩れの種類の名前",
    ).toEqual([]);
  });

  // 部品の説明 (各ブロックの `gallery/desc.ts`) は部品の頁だけが見せる。最初に読む script に入ると、日英で 100 件を超える字が
  // gzip で 7KB ほど上の上限を押し上げるので、どの説明の字も最初の script に入っていないことを確かめる (#3531)
  it("first-load-carries-no-part-desc", async () => {
    const blocks = join(__dirname, "../../../../packages/dragon/src/blocks");
    const files = readdirSync(blocks)
      .map((name) => join(blocks, name, "gallery", "desc.ts"))
      .filter((path) => existsSync(path));
    const descs = (
      await Promise.all(files.map(async (path) => Object.values(((await import(/* @vite-ignore */ path)) as { desc: Record<string, string> }).desc)))
    ).flat();
    expect(descs.length, "部品の説明の字を数えられない (gallery/desc.ts が無い)").toBeGreaterThan(0);
    const first = firstLoadFiles(site.built.dir)
      .filter((name) => name.endsWith(".js"))
      .map((name) => readFileSync(join(site.built.dir, "assets", name), "utf8"))
      .join("\n");
    expect(first.length, "build した頁が最初に読む script が無い (走査の空振り)").toBeGreaterThan(0);
    expect(
      descs.filter((desc) => first.includes(desc) || first.includes(JSON.stringify(desc).slice(1, -1))).map((desc) => desc.slice(0, 40)),
      "最初に読む script に在る部品の説明の字",
    ).toEqual([]);
    // 外した字が最初の script をどれだけ軽くしたか。説明の字を足して gzip で比べる
    const gz = (text: string): number => gzipSync(Buffer.from(text)).length;
    expect(gz(`${first}\n${descs.join("\n")}`) - gz(first), "部品の説明の字を外しても、最初に読む script が gzip で 5,000 バイト軽くならない").toBeGreaterThanOrEqual(5000);
  });

  it("page-draws-with-package-parts", () => {
    const sources = pageSources();
    expect(sources.length, "頁の source が無い").toBeGreaterThan(0);
    for (const [path, text] of sources) {
      // 図を描くのは package の部品だけ。頁の側で SVG を組まない
      expect(text, `${path} が SVG を組んでいる`).not.toMatch(/createElementNS|<svg\b/u);
      // package の中の file を直に読まず、公開している入口から読む。字の入口は使い方の頁の本文が `` ` `` で囲んで名指す (#3155)。図の部品は軽い入口から読む (#3248)
      // ブロックの置き場の見本帳の分 (`packages/dragon/src/blocks/<名前>/gallery/`) と、その型 (`packages/dragon/src/blocks/gallery.ts`) だけは、見本帳が直に読む。
      // package の入口はこの分を持たないため (#3345)。型の file は型だけを持ち、棚の部品と見本を探す関数に見本帳が渡す道具の形を決める (#3350)
      expect(text, `${path} が package の中の file を直に読んでいる`).not.toMatch(/@cardenelabs\/dragon\/(?!(?:fonts|light)["'`])|packages\/dragon\/src(?!\/blocks\/(?:[^/"'`\s]+\/gallery\/|gallery["'`]))/u);
      // 既定の入口を 1 か所でも読むと、全ての種類の部品が頁に入る (型だけの読み込みは消えるので数えない)
      expect(text, `${path} が既定の入口から部品を読んでいる`).not.toMatch(/^import (?!type )[^;]*from\s+["']@cardenelabs\/dragon["']/mu);
      if (/\b(mountDiagram|renderDiagram)\b/u.test(text)) {
        // 使い方の頁の本文は、読者に既定の入口の書き方を見せる。実際に読む形は上の検査が既定の入口を止める
        expect(text, `${path} が描く部品を @cardenelabs/dragon から読んでいない`).toMatch(/from\s+["']@cardenelabs\/dragon(?:\/light)?["']/u);
      }
    }
  });

  it(
    "open-sets-reduced-motion-before-load",
    async () => {
      // 再生の部品は動きを嫌う設定を描く時に 1 度だけ読む。頁を開いた後に当てると、先に描かれた図が自動で段を送る (#3231)
      const still = await open({ reducedMotion: "reduce" });
      expect(typeof still.startMedia, "開いた頁が読み込みの最初の設定を返す startMedia を持たない").toBe("function");
      expect((await still.startMedia()).reduce, "動きを嫌う設定を渡して開いた頁で、読み込みの最初に設定が当たっていない").toBe(true);
      const moving = await open();
      expect((await moving.startMedia()).reduce, "動きを嫌う設定を渡さずに開いた頁で、設定が当たっている").toBe(false);
    },
  );

  it("page-tests-set-motion-at-open", () => {
    // 動きを嫌う設定は頁を開く時に渡す。開いた後に emulateMedia で当てると、図を描く処理と競って検査が揺れる (#3231)
    const dir = join(__dirname);
    const late = readdirSync(dir)
      .filter((name) => name.endsWith(".test.ts"))
      .flatMap((name) =>
        readFileSync(join(dir, name), "utf8")
          .split("\n")
          .flatMap((line, i) => (/emulateMedia\(\{\s*reducedMotion/u.test(line) ? [`${name}:${i + 1}`] : [])),
      );
    expect(late, "画面の検査が、頁を開いた後に emulateMedia で動きを嫌う設定を当てている").toEqual([]);
  });

  it(
    "touch-open-waits-for-coarse",
    async () => {
      // 指で触る頁は (pointer: coarse) が当たるまで待ち、当たらない時は部品の大きさより先に設定が当たらないと名指して落ちる (#3231)
      expect(typeof waitForCoarse, "指で触る設定が当たるまで待つ waitForCoarse が支えから出ていない").toBe("function");
      const touch = await open({ touch: true });
      expect(await touch.page.evaluate(() => matchMedia("(pointer: coarse)").matches), "指で触る頁を開いた後に (pointer: coarse) が当たっていない").toBe(true);
      const mouse = await open();
      await expect(waitForCoarse(mouse.page, 500), "指で触る設定が当たらない頁で、待つ所が名指して落ちない").rejects.toThrow("指で触る設定 (pointer: coarse) が当たらない: /dragon/editor");
    },
  );

  it("page-routes-have-html-copies", () => {
    // Pages は無い path に 404 で答えるので、画面の経路ごとに頁の写しを `.html` で置いて 200 で答えさせる (#3157)。
    // 下にも経路を持つ経路 (カタログ) は、Pages が dir の側を選んだ時のために dir の `index.html` も置く
    const routes = screenRoutes();
    const parents = routes.filter((route) => routes.some((other) => other.startsWith(`${route}/`)));
    const want = [...routes.map((route) => `${route}.html`), ...parents.map((route) => `${route}/index.html`)].sort();
    const dir = site.built.dir;
    const copies = (readdirSync(dir, { recursive: true }) as string[]).filter((path) => path.endsWith(".html") && path !== "index.html" && path !== "404.html").sort();
    expect(copies, "build した頁の経路の写しが、経路の表とカタログの分類と部品の表から導いた一覧と違う").toEqual(want);
    const index = readFileSync(join(dir, "index.html"), "utf8");
    for (const copy of copies) expect(readFileSync(join(dir, copy), "utf8") === index, `${copy} が index.html の写しでない`).toBe(true);
  });

  it("page-routes-answer-200", async () => {
    // 検査の配り手は Pages と同じく、拡張子の無い経路に同じ名前の `.html` を返す (`servePage`)
    const routes = screenRoutes();
    const missing = ["nothing", "catalog/sequence/extra"];
    const statuses = await Promise.all([...routes, ...missing].map(async (route) => [route, (await fetch(`${site.origin}${BASE}${route}`)).status] as const));
    const want = [...routes.map((route) => [route, 200] as const), ...missing.map((route) => [route, 404] as const)];
    expect(Object.fromEntries(statuses), "画面の経路が 200 で、無い path が 404 で答えない").toEqual(Object.fromEntries(want));
  });

  it("site-pages-skip-the-local-server", async () => {
    // 機械のネットワークが変わると、Chromium は 127.0.0.1 への読み込み中の通信も net::ERR_NETWORK_CHANGED で切る。
    // 検査の頁は手元の server を通らずに build した file から読む (#3379)。server を通った応答だけが相手の場所 (serverAddr) を持つ
    const seen: string[] = [];
    const reached: Promise<string | null>[] = [];
    const watch = (page: Page): void => {
      page.on("response", (response) => {
        if (!response.url().startsWith(site.origin)) return;
        const path = new URL(response.url()).pathname;
        seen.push(path);
        reached.push(response.serverAddr().then((address) => (address === null ? null : path)));
      });
    };
    for (const path of ["", "editor", "catalog"]) {
      const { page } = await site.open({ path: `${BASE}${path}`, prepare: watch });
      await expect.poll(() => screenOf(page), { message: `${BASE}${path} の画面が出ない`, timeout: 30_000 }).not.toBeNull();
    }
    expect(seen.length, "頁が読んだ file").toBeGreaterThan(3);
    expect((await Promise.all(reached)).filter((path) => path !== null), "手元の server を通って届いた file").toEqual([]);
  });

  it("site-built-once-per-run", async () => {
    // 見本帳の頁は 1 回の実行の準備の段で 1 度だけ build し、頁を開く検査の file は全てその build を使う (#3381)
    const prepared = (inject as (key: string) => unknown)("dragonSites") as Record<string, { dir: string }> | undefined;
    const dir = prepared?.default?.dir;
    expect(dir, "準備の段が build した見本帳の頁が無い").toBeTypeOf("string");
    expect(site.built.dir, "この file の見本帳が、準備の段の build を使っていない").toBe(dir);
    const again = await startSite();
    try {
      expect(again.built.dir, "2 度目に起こした見本帳が build し直した").toBe(dir);
    } finally {
      await again.close();
    }
  });

  it("chromium-preloaded-before-file", async () => {
    // 頁を開く検査の file では、file を読む前の準備の段 (`setupFiles`) が Chromium を起こし始め、`startSite()` は自分で起こさずにそれを使う (#3388)
    expect(preloadedAtImport, "file を読む前に、準備の段が Chromium を起こし始めていない").toBeInstanceOf(Promise);
    const browser = await (preloadedAtImport as Promise<Browser>);
    expect(browser.isConnected(), "準備の段が起こした Chromium につながらない").toBe(true);
    const launch = vi.spyOn(chromium, "launch");
    const again = await startSite();
    try {
      expect(launch, "見本帳が自分で Chromium を起こした").not.toHaveBeenCalled();
      const { page } = await again.open({ path: BASE });
      expect(page.context().browser(), "見本帳が、準備の段が起こした Chromium で頁を開いていない").toBe(browser);
    } finally {
      launch.mockRestore();
      await again.closeContexts();
      await again.close();
    }
  });

  it("site-setup-skips-without-pages", async () => {
    // 頁を開く検査の file を含まない回は、準備の段が見本帳を build しない (#3381)
    const { default: setup } = await import("./site-setup");
    const provided: Record<string, unknown> = {};
    const project = {
      vitest: {
        filenamePattern: [],
        getRelevantTestSpecifications: () => Promise.resolve([{ moduleId: join(process.cwd(), "packages/dragon/test/test-limits.test.ts") }]),
      },
      provide: (key: string, value: unknown) => {
        provided[key] = value;
      },
    };
    const teardown = await setup(project as unknown as Parameters<typeof setup>[0]);
    try {
      expect(provided.dragonSites, "頁を開かない回に build した").toEqual({});
    } finally {
      teardown();
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
