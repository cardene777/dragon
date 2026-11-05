/**
 * カタログの見本の枠 (#3031)。
 *
 * 頁は build して GitHub Pages と同じ形で配り、画面なしの Chromium で開く (`playground-support.ts`)。
 * 2 つ以上の file が使う道具は `site-support.ts` に在る (#3381)
 */

import { parseNotation, readDiagram } from "@cardenelabs/dragon";
import type { Page } from "playwright";
import { type ExampleKey } from "../examples";
import { toHash } from "../share";
import { BASE } from "./playground-support";
import { describe, expect, it } from "vitest";
import { site, useSite, exampleText, WAIT, siteSel, sampleOf, catalogSel, KINDS, samplesOf, categoryOf, onScreen } from "./site-support";

/** 見本の原本の JSON。編集画面の JSON の側と同じく、読んで検査した図を 2 字下げで書く */
const jsonOf = (text: string): string => {
  const parsed = parseNotation(text);
  const read = parsed.ok ? readDiagram(parsed.diagram) : undefined;
  return read?.ok ? JSON.stringify(read.diagram, null, 2) : "";
};

/** 見本の図の枠と、図の見せ方と、寄って追う図の窓の枠と全体図の地が枠の中に収まるか。図が無ければ `null` */
const stageFigureOf = (page: Page): Promise<{ stage: number; view: string | null; window: boolean | null; overview: boolean | null } | null> =>
  page.evaluate((s) => {
    const stage = document.querySelector(s);
    const frame = stage?.querySelector(".dg-frame")?.getBoundingClientRect();
    const svg = stage?.querySelector('svg[data-dragon="figure"]');
    if (!stage || !frame || !svg) return null;
    const inside = (el: Element | null | undefined): boolean | null => {
      const r = el?.getBoundingClientRect();
      return r ? r.left >= frame.left - 0.5 && r.right <= frame.right + 0.5 && r.top >= frame.top - 0.5 && r.bottom <= frame.bottom + 0.5 : null;
    };
    return {
      // 枠の上の罫 (1px) を除いた高さ。`clamp(360px, 58vh, 620px)` が決める高さと同じ物
      stage: stage.clientHeight,
      view: svg.getAttribute("data-view"),
      window: inside(svg.querySelector(".dg-vp-frame")),
      overview: inside(svg.querySelector(".dg-mm-bg")),
    };
  }, catalogSel("stage"));

/** 縦に長い見本を確かめる画面の大きさ。高さ 800px では 6 件の見本が枠の下に切れていた (#3250) */
const LAPTOP = { width: 1280, height: 800 } as const;

/**
 * 見本の枠の高さ (上の罫を除く高さと、罫を含めた画面の上の高さ)、図の枠の中を縦に送る必要があるか、図の見せ方、図の全体が図の枠の中に入るか、
 * 止めて見せる図の箱の名前の字の画面の上の大きさ (箱の名前が無い図は `null`)、上の帯を除いた画面の高さ。
 * 図は枠の大きさを測ってから合わせ直すので、2 こま続けて同じ値を読めた時だけ返す。図が無ければ `null` (#3250)
 */
const previewFrameOf = (
  page: Page,
): Promise<{ stage: number; stageBox: number; clipped: boolean; view: string | null; whole: boolean; namePx: number | null; room: number } | null> =>
  page.evaluate(async (s) => {
    const read = () => {
      const stage = document.querySelector<HTMLElement>(s);
      const frameEl = stage?.querySelector<HTMLElement>(".dg-frame");
      const svg = frameEl?.querySelector<SVGSVGElement>('svg[data-dragon="figure"]');
      if (!stage || !frameEl || !svg) return null;
      const frame = frameEl.getBoundingClientRect();
      const box = svg.getBoundingClientRect();
      const view = svg.getAttribute("data-view");
      const name = svg.querySelector(".dg-sn");
      const width = svg.viewBox.baseVal.width;
      const namePx = view === "fixed" && name && width > 0 ? Number.parseFloat(getComputedStyle(name).fontSize) * (box.width / width) : null;
      const header = document.querySelector('[data-site="header"]')?.getBoundingClientRect().height ?? 0;
      return {
        size: [stage.clientHeight, frameEl.clientHeight, frameEl.scrollHeight, box.width, box.height].map(Math.round).join(","),
        seen: {
          stage: stage.clientHeight,
          stageBox: stage.getBoundingClientRect().height,
          clipped: frameEl.scrollHeight > frameEl.clientHeight + 1,
          view,
          whole: box.top >= frame.top - 0.5 && box.bottom <= frame.bottom + 0.5,
          namePx,
          room: window.innerHeight - header,
        },
      };
    };
    const frame = () => new Promise((done) => requestAnimationFrame(done));
    const first = read();
    await frame();
    await frame();
    const second = read();
    return first && second && first.size === second.size ? second.seen : null;
  }, catalogSel("stage"));

/**
 * 分類の頁で i 番目の見本を選び、その見本の図を置き終えるまで待つ。
 * 段の一覧の読み上げの名前が見本の題になったことで、前の見本の図を測らないようにする
 */
const pickSample = async (page: Page, i: number): Promise<void> => {
  const item = page.locator(catalogSel("item")).nth(i);
  await item.click();
  const title = (await item.textContent())?.trim() ?? "";
  await expect
    .poll(async () => (await page.locator(`${catalogSel("stage")} [data-dragon="steps"]`).getAttribute("aria-label")) ?? "", { ...WAIT, message: `${title} の図が置かれない` })
    .toContain(title);
};

/** 分類の頁で i 番目の見本を選び、最後の段まで送る */
const lastStepOf = async (page: Page, i: number): Promise<void> => {
  await pickSample(page, i);
  const count = await page.locator(`${catalogSel("stage")} [data-dragon="steps"] > li`).count();
  for (let s = 0; s < count - 1; s++) await page.locator(`${catalogSel("stage")} [data-dragon="next"]`).click();
};

describe("カタログの見本の枠 (#3031)", () => {
  useSite();


  it(
    "catalog-follow-figure-whole-in-frame",
    async () => {
      // 構成図の見本は、この 2 つの幅で寄って追う図になる。860px では横長の全体図を窓の下に出し (#3042、#3044)、
      // 390px では値の表を持つので全体図を出さない (#3274)。全体図が無い時は `overview` が `null` になる
      for (const [width, overview] of [
        [390, null],
        [860, true],
      ] as const) {
        const { page } = await site.open({ path: `${BASE}catalog/architecture`, viewport: { width, height: 900 } });
        await onScreen(page, "category", `${width}px で構成図の分類の頁が出ない`);
        await expect.poll(async () => (await stageFigureOf(page))?.view, { ...WAIT, message: `${width}px で構成図の見本が寄って追う図にならない` }).toBe("follow");
        await expect
          .poll(async () => {
            const seen = await stageFigureOf(page);
            return { window: seen?.window, overview: seen?.overview };
          }, { ...WAIT, message: `${width}px で寄って追う図の窓か全体図が図の枠からはみ出すか、全体図の有無が違う` })
          .toEqual({ window: true, overview });
      }
    },
  );


  it(
    "catalog-fixed-figure-keeps-frame-height",
    async () => {
      // 全体を止めて見せる図の枠は `clamp(360px, 58vh, 620px)` のまま。高さ 900px なら 522px
      const expected = Math.min(620, Math.max(360, 0.58 * 900));
      for (const width of [390, 860, 1440]) {
        const { page } = await site.open({ path: `${BASE}catalog/sequence`, viewport: { width, height: 900 } });
        await onScreen(page, "category", `${width}px で時系列図の分類の頁が出ない`);
        await expect.poll(async () => (await stageFigureOf(page))?.view, { ...WAIT, message: `${width}px で時系列図の見本が全体を止めて見せる図にならない` }).toBe("fixed");
        expect((await stageFigureOf(page))?.stage, `${width}px で止めて見せる図の枠の高さが変わる`).toBeCloseTo(expected, 0);
      }
    },
  );


  it(
    "catalog-follow-strip-whole",
    async () => {
      // OAuth の見本は時系列図の 6 つ目で、幅 1280px では寄って追う図になる。窓は切り抜くので、窓の中身の欄は枠の内側でも見えない (#3270)
      const { page } = await site.open({ path: `${BASE}catalog/sequence`, viewport: LAPTOP, reducedMotion: "reduce" });
      await onScreen(page, "category", "時系列図の分類の頁が出ない");
      await lastStepOf(page, 5);
      await expect.poll(async () => (await stageFigureOf(page))?.view, { ...WAIT, message: "OAuth の見本が寄って追う図にならない" }).toBe("follow");
      await expect
        .poll(
          () =>
            page.evaluate((stage) => {
              const root = document.querySelector(stage);
              const frame = root?.querySelector(".dg-frame")?.getBoundingClientRect();
              const names = [...(root?.querySelectorAll(".dg-fl") ?? [])];
              const hidden = names.filter((el) => {
                const r = el.getBoundingClientRect();
                const outside = !frame || r.left < frame.left - 0.5 || r.right > frame.right + 0.5 || r.top < frame.top - 0.5 || r.bottom > frame.bottom + 0.5;
                return outside || el.closest('g[clip-path^="url(#dg-vp-"]') !== null;
              });
              return { fields: names.length, hidden: hidden.map((el) => el.textContent) };
            }, catalogSel("stage")),
          { ...WAIT, message: "OAuth の見本の表の欄が図の枠の中に見えない" },
        )
        .toEqual({ fields: 5, hidden: [] });
    },
  );


  // 枠を図の高さまで伸ばすか寄って追う図にして、どの見本も図の枠の中を送らずに見える (#3250)
  describe.for((["ja-JP", "en-US"]).flatMap((locale) => (KINDS).map((kind) => ({ locale, kind }))))("$locale $kind", ({ locale, kind }) => {
    it("catalog-tall-figure-not-clipped", async () => {
      const { page } = await site.open({ path: `${BASE}catalog/${kind}`, viewport: LAPTOP, locale, reducedMotion: "reduce" });
      await onScreen(page, "category", `${locale} で ${kind} の分類の頁が出ない`);
      const samples = samplesOf(kind);
      for (let i = 0; i < samples.length; i++) {
        await lastStepOf(page, i);
        await expect
          .poll(async () => (await previewFrameOf(page))?.clipped ?? null, { ...WAIT, message: `${locale} の ${samples[i]} の図が枠の下に切れる` })
          .toBe(false);
      }
    });
  });


  it(
    "catalog-tall-figure-grows-frame",
    async () => {
      // 画面に収まる高さの図は、枠を図の高さまで伸ばし、全体を止めて見せる (#3250)
      const fixedHeight = Math.min(620, Math.max(360, 0.58 * LAPTOP.height));
      const { page } = await site.open({ path: `${BASE}catalog/tree`, viewport: LAPTOP, reducedMotion: "reduce" });
      await onScreen(page, "category", "木の図の分類の頁が出ない");
      await expect
        .poll(
          async () => {
            const seen = await previewFrameOf(page);
            return seen && { view: seen.view, grown: seen.stage > fixedHeight + 8, whole: seen.whole };
          },
          { ...WAIT, message: "Merkle 木の見本の枠が図の高さまで伸びない" },
        )
        .toEqual({ view: "fixed", grown: true, whole: true });
    },
  );


  it(
    "catalog-figure-taller-than-screen-follows",
    async () => {
      // 枠を伸ばしても画面より高い図は、寄って追う図にして枠を画面に収める (#3250)
      const { page } = await site.open({ path: `${BASE}catalog/sequence`, viewport: LAPTOP, reducedMotion: "reduce" });
      await onScreen(page, "category", "時系列図の分類の頁が出ない");
      await pickSample(page, samplesOf("sequence").indexOf("oauth"));
      await expect
        .poll(
          async () => {
            const seen = await previewFrameOf(page);
            return seen && { view: seen.view, fits: seen.stageBox <= seen.room };
          },
          { ...WAIT, message: "OAuth の見本が寄って追う図にならないか、枠が画面に収まらない" },
        )
        .toEqual({ view: "follow", fits: true });
    },
  );


  // 枠に収めるために字を下限 (11px) より小さくしない (#3031、#3250)
  describe.for(KINDS)("%s", (kind) => {
    it("catalog-figure-names-readable", async () => {
      const { page } = await site.open({ path: `${BASE}catalog/${kind}`, viewport: LAPTOP, reducedMotion: "reduce" });
      await onScreen(page, "category", `${kind} の分類の頁が出ない`);
      const samples = samplesOf(kind);
      for (let i = 0; i < samples.length; i++) {
        await pickSample(page, i);
        await expect
          .poll(
            async () => {
              const seen = await previewFrameOf(page);
              return seen && (seen.namePx === null || seen.namePx >= 11 - 0.05);
            },
            { ...WAIT, message: `${samples[i]} の箱の名前の字が 11px より小さい` },
          )
          .toBe(true);
      }
    });
  });


  it(
    "category-item-shows-source",
    async () => {
      const { page } = await site.open({ path: `${BASE}catalog/sequence`, viewport: { width: 1440, height: 900 } });
      await onScreen(page, "category", "時系列図の分類の頁が出ない");
      const key = samplesOf("sequence")[0] as ExampleKey;
      const source = (): Promise<string | null> => page.evaluate(() => document.querySelector('[data-catalog="source-code"]')?.textContent ?? null);
      const shown = (): Promise<{ stage: boolean; source: boolean; tab: string | null }> =>
        page.evaluate(() => {
          const visible = (s: string): boolean => {
            const e = document.querySelector<HTMLElement>(s);
            return e !== null && e.checkVisibility();
          };
          return {
            stage: visible('[data-catalog="stage"]'),
            source: visible('[data-catalog="source"]'),
            tab: document.querySelector('[data-catalog="preview"] [role="tab"][aria-selected="true"]')?.getAttribute("data-catalog") ?? null,
          };
        });

      await expect.poll(shown, { ...WAIT, message: "分類の頁が図の見出しで開かない" }).toEqual({ stage: true, source: false, tab: "tab-figure" });

      // コードの見出しで、図の代わりに記法の本文を出す
      await page.locator(catalogSel("tab-code")).click();
      await expect.poll(shown, { ...WAIT, message: "コードの見出しで記法の本文に替わらない" }).toEqual({ stage: false, source: true, tab: "tab-code" });
      await expect.poll(source, { ...WAIT, message: "コードの見出しの本文が見本の記法でない" }).toBe(exampleText(key, "ja"));
      expect(await page.locator(catalogSel("source-notation")).getAttribute("aria-pressed"), "記法の側が選ばれていない").toBe("true");

      // JSON の側に替えると、原本の JSON を出す
      await page.locator(catalogSel("source-json")).click();
      await expect.poll(source, { ...WAIT, message: "JSON の側に替えても原本の JSON が出ない" }).toBe(jsonOf(exampleText(key, "ja")));
      expect(await page.locator(catalogSel("source-json")).getAttribute("aria-pressed"), "JSON の側が選ばれていない").toBe("true");

      // 写す釦で、選んだ側の本文を写す
      await page.evaluate(() => {
        const w = window as unknown as { __copied: string | null };
        w.__copied = null;
        Object.defineProperty(navigator, "clipboard", {
          configurable: true,
          value: {
            writeText: (text: string): Promise<void> => {
              w.__copied = text;
              return Promise.resolve();
            },
          },
        });
      });
      await page.locator(catalogSel("copy")).click();
      await expect
        .poll(() => page.evaluate(() => (window as unknown as { __copied: string | null }).__copied), { ...WAIT, message: "写す釦で JSON の本文を写さない" })
        .toBe(jsonOf(exampleText(key, "ja")));

      // 記法の側に戻して英語に替えると、英語の見本の記法になる
      await page.locator(catalogSel("source-notation")).click();
      await page.locator(siteSel("lang-en")).click();
      await expect.poll(source, { ...WAIT, message: "英語に替えてもコードの見出しの記法が英語の見本にならない" }).toBe(exampleText(key, "en"));

      // 図の見出しに戻すと、図に戻る
      await page.locator(catalogSel("tab-figure")).click();
      await expect.poll(shown, { ...WAIT, message: "図の見出しで図に戻らない" }).toEqual({ stage: true, source: false, tab: "tab-figure" });
    },
  );


  it(
    "category-item-opens-overlay-and-editor",
    async () => {
      const { page } = await site.open({ path: `${BASE}catalog/sequence`, viewport: { width: 1440, height: 900 } });
      await onScreen(page, "category", "時系列図の分類の頁が出ない");
      const key = samplesOf("sequence").at(-1) as ExampleKey;
      const text = exampleText(key, "ja");
      const sample = sampleOf(text);
      await page.locator(catalogSel("item")).last().click();
      await expect.poll(async () => (await categoryOf(page)).title, { ...WAIT, message: "選んだ見本が右に出ない" }).toBe(sample?.title);

      const overlay = (): Promise<{ covers: boolean; title: string; names: string[]; figures: number; larger: boolean } | null> =>
        page.evaluate(() => {
          const o = document.querySelector('[data-catalog="overlay"]');
          if (!o || !(o as HTMLElement).checkVisibility()) return null;
          const r = o.getBoundingClientRect();
          const svg = o.querySelector('svg[data-dragon="figure"]');
          const inStage = document.querySelector('[data-catalog="stage"] svg[data-dragon="figure"]');
          return {
            covers: r.left <= 0 && r.top <= 0 && r.right >= innerWidth && r.bottom >= innerHeight,
            title: o.querySelector('[data-catalog="overlay-title"]')?.textContent?.trim() ?? "",
            names: svg ? [...new Set([...svg.querySelectorAll(".dg-sn")].map((n) => n.textContent ?? ""))].sort() : [],
            figures: o.querySelectorAll('svg[data-dragon="figure"]').length,
            larger: svg !== null && inStage !== null && svg.getBoundingClientRect().width > inStage.getBoundingClientRect().width,
          };
        });
      const opened = { covers: true, title: sample?.title ?? "", names: sample?.names ?? [], figures: 1, larger: true };

      // 拡大の釦で、画面を覆う重ね窓に図 1 つが大きく出る
      await page.locator(catalogSel("expand")).click();
      await expect.poll(overlay, { ...WAIT, message: "拡大の釦で重ね窓に図が大きく出ない" }).toEqual(opened);
      // 閉じる釦で閉じる
      await page.locator(catalogSel("overlay-close")).click();
      await expect.poll(overlay, { ...WAIT, message: "閉じる釦で重ね窓が閉じない" }).toBeNull();
      // Escape でも閉じる
      await page.locator(catalogSel("expand")).click();
      await expect.poll(overlay, { ...WAIT, message: "もう一度押しても重ね窓が開かない" }).toEqual(opened);
      await page.keyboard.press("Escape");
      await expect.poll(overlay, { ...WAIT, message: "Escape で重ね窓が閉じない" }).toBeNull();

      // 編集画面で開くと、頁を読み直さずにその記法が入った編集画面が開く
      await page.evaluate(() => {
        (window as unknown as { __stay: number }).__stay = 1;
      });
      await page.locator(catalogSel("open-editor")).click();
      await onScreen(page, "editor", "編集画面で開くで編集画面が出ない");
      await expect
        .poll(() => page.evaluate(() => document.querySelector<HTMLTextAreaElement>('[data-playground="editor"]')?.value.trimEnd() ?? null), {
          ...WAIT,
          message: "編集画面で開いても見本の記法が書く欄に入らない",
        })
        .toBe(text);
      expect(await page.evaluate(() => location.hash), "編集画面のアドレスに記法が載らない").toBe(toHash(text));
      expect(await page.evaluate(() => (window as unknown as { __stay?: number }).__stay), "編集画面で開く時に頁を読み直した").toBe(1);
    },
  );
});
