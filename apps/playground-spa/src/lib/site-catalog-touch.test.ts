/**
 * カタログの指の操作 (#3075)。
 *
 * 頁は build して GitHub Pages と同じ形で配り、画面なしの Chromium で開く (`playground-support.ts`)。
 * 2 つ以上の file が使う道具は `site-support.ts` に在る (#3381)
 */

import type { Page } from "playwright";
import { BASE, pressUntilDisabled } from "./playground-support";
import { describe, expect, it } from "vitest";
import { site, useSite, WAIT, siteSel, catalogSel, samplesOf, onScreen, PHONES, expectSizes, openSequence } from "./site-support";

/**
 * カタログの分類の頁の置き場 `scope` の押せる部品 (#3067)。図の下の段を送る釦 (描画の部品が持つ) は除く。
 * 部品ごとに `data-catalog` の名前、四捨五入しない幅と高さ (#3085)、画面に入れてから四隅の 2px 内側 (角の丸みの外を避ける) を押した時にその部品に当たるか。
 * 2 回続けて同じ値を読めた時だけ返す
 */
const catalogTargetsOf = (page: Page, scope: string): Promise<{ name: string; width: number; height: number; corners: boolean }[] | null> =>
  page.evaluate(async (scope) => {
    await document.fonts.ready;
    const read = () => {
      const root = document.querySelector(scope);
      if (!root) return null;
      return [...root.querySelectorAll<HTMLElement>("button, a[href], select, input")]
        .filter((el) => el.checkVisibility() && el.closest(".dg-player") === null)
        .map((el) => {
          el.scrollIntoView({ block: "center" });
          const r = el.getBoundingClientRect();
          const points: [number, number][] = [
            [r.left + 2, r.top + 2],
            [r.right - 2, r.top + 2],
            [r.left + 2, r.bottom - 2],
            [r.right - 2, r.bottom - 2],
          ];
          const corners = points.every(([x, y]) => {
            const hit = document.elementFromPoint(x, y);
            return hit !== null && el.contains(hit);
          });
          // 道筋の札は `data-catalog` を持たないので字で名指す (#3078)
          return { name: el.dataset.catalog ?? el.textContent?.trim() ?? "", width: r.width, height: r.height, corners };
        });
    };
    const frame = () => new Promise((done) => requestAnimationFrame(done));
    const first = read();
    await frame();
    await frame();
    const second = read();
    return first && second && JSON.stringify(first) === JSON.stringify(second) ? second : null;
  }, scope);

/** 置き場 `scope` の押せる部品のうち、`required` の名前が揃わないものと、44px に届かないか四隅が外れるもの (#3067) */
const catalogShortOf = async (page: Page, scope: string, required: readonly string[]): Promise<{ missing: string[]; small: string[] } | null> => {
  const parts = await catalogTargetsOf(page, scope);
  return (
    parts && {
      missing: required.filter((name) => !parts.some((p) => p.name === name)),
      small: parts.filter((p) => p.width < 44 || p.height < 44 || !p.corners).map((p) => `${p.name} ${p.width}x${p.height}${p.corners ? "" : " 隅が外れる"}`),
    }
  );
};

/** 見本の枠の縮小と拡大の組に見えている部品の名前の並びと、倍率の字 (#3067) */
const catalogZoomOf = (page: Page): Promise<{ shown: string[]; level: string; button: boolean; disabled: boolean }> =>
  page.evaluate(() => {
    const group = document.querySelector('[data-catalog="preview"] .catalog-zoom');
    const level = group?.querySelector('[data-catalog="zoom-level"]');
    return {
      shown: [...(group?.querySelectorAll<HTMLElement>("[data-catalog]") ?? [])].filter((el) => el.checkVisibility()).map((el) => el.dataset.catalog ?? ""),
      level: level?.textContent?.trim() ?? "",
      button: level instanceof HTMLButtonElement,
      disabled: level instanceof HTMLButtonElement && level.disabled,
    };
  });

/** 指で触る端末を模してカタログの頁を確かめる画面の大きさ。360 は携帯の幅、768 は一覧を見本の上に積む幅、1024 と 1366 は横に並べる幅 (#3078) */
const TOUCH_CATALOG_SIZES = [
  { width: 360, height: 780 },
  { width: 768, height: 1024 },
  { width: 1024, height: 1366 },
  { width: 1366, height: 1024 },
] as const;

/** 見本の枠の押せる部品の名前。携帯の幅では合わせるの釦の代わりに倍率の釦を出す (#3067、#3078) */
const previewPartsOf = (width: number): string[] => ["tab-figure", "tab-code", "palette", "zoom-out", width < 440 ? "zoom-level" : "fit", "zoom-in", "expand", "open-editor"];

/** 道筋の札の数と、44px に届かないか四隅が外れる札 (#3078) */
const catalogCrumbShortOf = async (page: Page): Promise<{ count: number; small: string[] } | null> => {
  const parts = await catalogTargetsOf(page, catalogSel("crumb"));
  return (
    parts && {
      count: parts.length,
      small: parts.filter((p) => p.width < 44 || p.height < 44 || !p.corners).map((p) => `${p.name} ${p.width}x${p.height}${p.corners ? "" : " 隅が外れる"}`),
    }
  );
};

/** 見本の枠の上の帯の押せる部品の数と、帯の外にはみ出す部品と、互いに重なる組と、頁が横にあふれるか (#3078) */
const catalogBarOf = (page: Page): Promise<{ count: number; cut: string[]; overlap: string[]; pageOver: boolean } | null> =>
  page.evaluate(async () => {
    await document.fonts.ready;
    const bar = document.querySelector(".catalog-preview-tabs");
    if (!bar) return null;
    const b = bar.getBoundingClientRect();
    const parts = [...bar.querySelectorAll<HTMLElement>("button, select")]
      .filter((el) => el.checkVisibility())
      .map((el) => ({ name: el.dataset.catalog ?? "", r: el.getBoundingClientRect() }));
    const cut = parts.filter(({ r }) => r.left < b.left - 0.5 || r.right > b.right + 0.5 || r.top < b.top - 0.5 || r.bottom > b.bottom + 0.5).map((p) => p.name);
    const overlap = parts.flatMap((p, i) =>
      parts
        .slice(i + 1)
        .filter((q) => p.r.left < q.r.right - 0.5 && q.r.left < p.r.right - 0.5 && p.r.top < q.r.bottom - 0.5 && q.r.top < p.r.bottom - 0.5)
        .map((q) => `${p.name}+${q.name}`),
    );
    return { count: parts.length, cut, overlap, pageOver: document.documentElement.scrollWidth > innerWidth };
  });

describe("カタログの指の操作 (#3075)", () => {
  useSite();


  it(
    "narrow-catalog-touch-targets",
    async () => {
      // 携帯の幅のカタログの頁は、縮小と拡大と合わせるの釦が 28 × 26px で間が 2px しか無く、指で隣を押し違えやすかった (#3067)。
      // 指で押す的の目安は 44 × 44px
      for (const viewport of PHONES) {
        const page = await openSequence(viewport);
        const where = `${viewport.width} × ${viewport.height} の時系列図の分類の頁`;
        await expect
          .poll(() => catalogShortOf(page, catalogSel("sidebar"), ["search", "item"]), { ...WAIT, message: `${where} の一覧で、部品が揃わないか、44px に届かない部品がある` })
          .toEqual({ missing: [], small: [] });
        await expect
          .poll(() => catalogShortOf(page, catalogSel("preview"), ["tab-figure", "tab-code", "palette", "zoom-out", "zoom-level", "zoom-in", "expand", "open-editor"]), {
            ...WAIT,
            message: `${where} の見本の枠で、部品が揃わないか、44px に届かない部品がある`,
          })
          .toEqual({ missing: [], small: [] });
        if (viewport === PHONES[1]) {
          await expectSizes(() => catalogTargetsOf(page, catalogSel("sidebar")), `${where} の一覧`, ["search 247x44", ...Array<string>(5).fill("item 295x44"), "item 295x53"]);
          await expectSizes(() => catalogTargetsOf(page, catalogSel("preview")), `${where} の見本の枠`, [
            "tab-figure 44x44",
            "tab-code 67x44",
            "palette 133x44",
            "zoom-out 44x44",
            "zoom-level 52x44",
            "zoom-in 44x44",
            "expand 78x44",
            "open-editor 107x44",
          ]);
        }
      }
    },
  );


  it(
    "narrow-catalog-touch-targets-after-action",
    async () => {
      // 検索に字を入れた時、コードの側に替えた時、重ね窓を開いた時に出る部品も、指で押せる大きさにする (#3067)
      for (const viewport of PHONES) {
        const page = await openSequence(viewport);
        const where = `${viewport.width} × ${viewport.height} の時系列図の分類の頁`;
        const sized = viewport === PHONES[1];
        await page.locator(catalogSel("search")).fill("OAuth");
        await expect
          .poll(() => catalogShortOf(page, catalogSel("sidebar"), ["search", "search-clear", "item"]), { ...WAIT, message: `${where} で検索に字を入れた時、一覧の部品が揃わないか、44px に届かない部品がある` })
          .toEqual({ missing: [], small: [] });
        if (sized) await expectSizes(() => catalogTargetsOf(page, catalogSel("sidebar")), `${where} で検索に字を入れた時の一覧`, ["search 207x44", "search-clear 44x44", "item 295x53"]);
        await page.locator(catalogSel("search")).fill("");
        await page.locator(catalogSel("tab-code")).click();
        await expect
          .poll(() => catalogShortOf(page, catalogSel("source"), ["source-notation", "source-json", "copy"]), { ...WAIT, message: `${where} のコードの側で、部品が揃わないか、44px に届かない部品がある` })
          .toEqual({ missing: [], small: [] });
        if (sized) await expectSizes(() => catalogTargetsOf(page, catalogSel("source")), `${where} のコードの側`, ["source-notation 53x44", "source-json 57x44", "copy 122x44"]);
        await page.locator(catalogSel("tab-figure")).click();
        await page.locator(catalogSel("expand")).click();
        await expect
          .poll(() => catalogShortOf(page, catalogSel("overlay"), ["overlay-close"]), { ...WAIT, message: `${where} の重ね窓で、閉じるの釦が無いか、44px に届かない` })
          .toEqual({ missing: [], small: [] });
        if (sized) await expectSizes(() => catalogTargetsOf(page, catalogSel("overlay")), `${where} の重ね窓`, ["overlay-close 44x44"]);
      }
    },
  );


  it(
    "narrow-catalog-zoom-level-fits",
    async () => {
      // 44px の釦を拡大の釦と同じ段に収めるため、携帯の幅では合わせるの釦を出さず、倍率を縮小と拡大の間の釦にして、押すと枠に合わせる。
      // 編集画面の携帯の幅と同じ形 (#3065、#3067)
      for (const viewport of PHONES) {
        const page = await openSequence(viewport);
        const where = `${viewport.width} × ${viewport.height} の時系列図の分類の頁の最初の見本`;
        await expect.poll(async () => (await catalogZoomOf(page)).shown, { ...WAIT, message: `${where} で、縮小と拡大の組の並びが違う` }).toEqual(["zoom-out", "zoom-level", "zoom-in"]);
        const level = async (): Promise<number> => Number.parseInt((await catalogZoomOf(page)).level, 10);
        await expect.poll(level, { ...WAIT, message: `${where} で、倍率が出ない` }).toBeGreaterThan(0);
        const base = await level();
        await page.locator(`${catalogSel("preview")} ${catalogSel("zoom-in")}`).click();
        await expect.poll(level, { ...WAIT, message: `${where} で、拡大の釦で倍率が上がらない` }).toBeGreaterThan(base);
        await page.locator(`${catalogSel("preview")} ${catalogSel("zoom-level")}`).click();
        await expect.poll(level, { ...WAIT, message: `${where} で、倍率の釦で元の倍率に戻らない` }).toBe(base);
        // 寄って追う見せ方の見本 (OAuth) では、倍率が押せない状態になる
        await page.locator(catalogSel("item")).nth(samplesOf("sequence").indexOf("oauth")).click();
        await expect
          .poll(async () => {
            const seen = await catalogZoomOf(page);
            return { button: seen.button, disabled: seen.disabled, level: seen.level };
          }, { ...WAIT, message: `${viewport.width} × ${viewport.height} の OAuth の見本で、倍率が押せない状態の釦でないか、「—」を出さない` })
          .toEqual({ button: true, disabled: true, level: "—" });
      }
    },
  );


  it(
    "catalog-zoom-stops-at-range",
    async () => {
      // 見本の枠の拡大と縮小も、編集画面と同じ 25% から 400% の間で止まり、端に着くとその向きの釦が押せなくなる (#3105)
      const page = await openSequence({ width: 1440, height: 900 });
      const button = (name: string): string => `${catalogSel("preview")} ${catalogSel(name)}`;
      await expect.poll(async () => (await catalogZoomOf(page)).level, { ...WAIT, message: "見本の枠に倍率が出ない" }).toMatch(/%$/);
      const end = async (name: string): Promise<{ level: string; disabled: boolean }> => ({ level: (await catalogZoomOf(page)).level, disabled: await page.locator(button(name)).isDisabled() });
      await pressUntilDisabled(page, button("zoom-in"));
      await expect.poll(() => end("zoom-in"), { ...WAIT, message: "見本の枠で拡大を押し続けても 400% で止まらないか、拡大の釦が押せるまま残る" }).toEqual({ level: "400%", disabled: true });
      await pressUntilDisabled(page, button("zoom-out"));
      await expect.poll(() => end("zoom-out"), { ...WAIT, message: "見本の枠で縮小を押し続けても 25% で止まらないか、縮小の釦が押せるまま残る" }).toEqual({ level: "25%", disabled: true });
    },
  );


  it(
    "narrow-catalog-parts-work",
    async () => {
      // 携帯の幅で部品を 44px にしても、頁は横にあふれず、縮小、コードの側、JSON の切替、色味の選択が今と同じに働く (#3067)
      for (const viewport of PHONES) {
        const page = await openSequence(viewport);
        const where = `${viewport.width} × ${viewport.height} の時系列図の分類の頁`;
        expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), `${where} が横にあふれる`).toBe(false);
        const level = async (): Promise<number> => Number.parseInt((await catalogZoomOf(page)).level, 10);
        await expect.poll(level, { ...WAIT, message: `${where} で、倍率が出ない` }).toBeGreaterThan(0);
        const base = await level();
        await page.locator(`${catalogSel("preview")} ${catalogSel("zoom-out")}`).click();
        await expect.poll(level, { ...WAIT, message: `${where} で、縮小の釦で倍率が下がらない` }).toBeLessThan(base);
        await page.locator(catalogSel("tab-code")).click();
        await expect.poll(() => page.locator(catalogSel("source")).isVisible(), { ...WAIT, message: `${where} で、コードの見出しでコードの側に替わらない` }).toBe(true);
        await page.locator(catalogSel("source-json")).click();
        await expect.poll(() => page.locator(catalogSel("source-json")).getAttribute("aria-pressed"), { ...WAIT, message: `${where} で、JSON の切替で JSON の側が選ばれない` }).toBe("true");
        await page.locator(catalogSel("tab-figure")).click();
        await page.locator(catalogSel("palette")).selectOption("paper");
        await expect.poll(() => page.locator(catalogSel("palette")).inputValue(), { ...WAIT, message: `${where} で、色味の選択で紙と墨を選べない` }).toBe("paper");
        expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), `${where} が部品を押した後に横にあふれる`).toBe(false);
      }
    },
  );


  it(
    "wide-catalog-parts-keep-size",
    async () => {
      // 440px 以上のカタログの頁は、部品の大きさを今のまま保ち、合わせるの釦を出して倍率を字で出す (#3067)
      for (const viewport of [
        { width: 560, height: 900 },
        { width: 1440, height: 900 },
      ]) {
        const page = await openSequence(viewport);
        const where = `${viewport.width} × ${viewport.height} の時系列図の分類の頁`;
        const sizeOf = (sel: string): Promise<string[]> =>
          page.evaluate(
            (sel) =>
              [...new Set([...document.querySelectorAll(sel)].filter((el) => el.checkVisibility()).map((el) => `${Math.round(el.getBoundingClientRect().width)}x${Math.round(el.getBoundingClientRect().height)}`))],
            sel,
          );
        await expect
          .poll(
            async () => ({
              zoom: await sizeOf(`${catalogSel("preview")} .catalog-zoom-btn`),
              palette: await page.evaluate(() => Math.round(document.querySelector('[data-catalog="palette"]')?.getBoundingClientRect().height ?? 0)),
              fit: await page.locator(`${catalogSel("preview")} ${catalogSel("fit")}`).isVisible(),
              level: await page.evaluate(() => document.querySelector('[data-catalog="preview"] [data-catalog="zoom-level"]')?.tagName.toLowerCase() ?? null),
            }),
            { ...WAIT, message: `${where} で、見本の枠の部品の大きさが今と違うか、合わせるの釦が無いか、倍率が字で出ない` },
          )
          .toEqual({ zoom: ["28x26"], palette: 29, fit: true, level: "span" });
        await page.locator(catalogSel("expand")).click();
        await expect.poll(() => sizeOf(catalogSel("overlay-close")), { ...WAIT, message: `${where} の重ね窓で、閉じるの釦の大きさが今と違う` }).toEqual(["34x34"]);
      }
    },
  );


  it(
    "coarse-catalog-touch-targets",
    async () => {
      // 指で触るタブレットのカタログの頁は、道筋の札、一覧、見本の枠の部品が 19 から 38px で指で押し違えやすかった (#3078)。
      // 指で触る時は幅に関わらず 44 × 44px にする。カタログの一覧の頁の道筋の札も同じ部品
      for (const viewport of TOUCH_CATALOG_SIZES) {
        const page = await openSequence(viewport, true);
        const where = `指で触る ${viewport.width} × ${viewport.height} の時系列図の分類の頁`;
        await expect.poll(() => catalogCrumbShortOf(page), { ...WAIT, message: `${where} の道筋で、札が 2 つ無いか、44px に届かない札がある` }).toEqual({ count: 2, small: [] });
        await expect
          .poll(() => catalogShortOf(page, catalogSel("sidebar"), ["search", "item"]), { ...WAIT, message: `${where} の一覧で、部品が揃わないか、44px に届かない部品がある` })
          .toEqual({ missing: [], small: [] });
        await expect
          .poll(() => catalogShortOf(page, catalogSel("preview"), previewPartsOf(viewport.width)), { ...WAIT, message: `${where} の見本の枠で、部品が揃わないか、44px に届かない部品がある` })
          .toEqual({ missing: [], small: [] });
        const sized = viewport === TOUCH_CATALOG_SIZES[1];
        if (sized) {
          await expectSizes(() => catalogTargetsOf(page, catalogSel("crumb")), `${where} の道筋`, ["概要 44x44", "カタログ 68x44"]);
          await expectSizes(() => catalogTargetsOf(page, catalogSel("sidebar")), `${where} の一覧`, ["search 561x44", ...Array<string>(6).fill("item 609x44")]);
          await expectSizes(() => catalogTargetsOf(page, catalogSel("preview")), `${where} の見本の枠`, [
            "tab-figure 44x44",
            "tab-code 67x44",
            "palette 133x44",
            "zoom-out 44x44",
            "zoom-in 44x44",
            "fit 44x44",
            "expand 78x44",
            "open-editor 107x44",
          ]);
        }

        const { page: index } = await site.open({ path: `${BASE}catalog`, viewport, touch: true });
        await onScreen(index, "catalog", `指で触る ${viewport.width} × ${viewport.height} でカタログの一覧が出ない`);
        await expect
          .poll(() => catalogCrumbShortOf(index), { ...WAIT, message: `指で触る ${viewport.width} × ${viewport.height} のカタログの一覧の道筋で、札が無いか、44px に届かない` })
          .toEqual({ count: 1, small: [] });
        if (sized) await expectSizes(() => catalogTargetsOf(index, catalogSel("crumb")), `指で触る ${viewport.width} × ${viewport.height} のカタログの一覧の道筋`, ["概要 44x44"]);
      }
    },
  );


  it(
    "coarse-catalog-touch-targets-after-action",
    async () => {
      // 指で触る時は、検索に字を入れた時、コードの側に替えた時、重ね窓を開いた時に出る部品も 44px にする (#3078)
      for (const viewport of TOUCH_CATALOG_SIZES) {
        const page = await openSequence(viewport, true);
        const where = `指で触る ${viewport.width} × ${viewport.height} の時系列図の分類の頁`;
        const sized = viewport === TOUCH_CATALOG_SIZES[1];
        await page.locator(catalogSel("search")).fill("OAuth");
        await expect
          .poll(() => catalogShortOf(page, catalogSel("sidebar"), ["search", "search-clear", "item"]), { ...WAIT, message: `${where} で検索に字を入れた時、一覧の部品が揃わないか、44px に届かない部品がある` })
          .toEqual({ missing: [], small: [] });
        if (sized) await expectSizes(() => catalogTargetsOf(page, catalogSel("sidebar")), `${where} で検索に字を入れた時の一覧`, ["search 521x44", "search-clear 44x44", "item 609x44"]);
        await page.locator(catalogSel("search")).fill("");
        await page.locator(catalogSel("tab-code")).click();
        await expect
          .poll(() => catalogShortOf(page, catalogSel("source"), ["source-notation", "source-json", "copy"]), { ...WAIT, message: `${where} のコードの側で、部品が揃わないか、44px に届かない部品がある` })
          .toEqual({ missing: [], small: [] });
        if (sized) await expectSizes(() => catalogTargetsOf(page, catalogSel("source")), `${where} のコードの側`, ["source-notation 53x44", "source-json 57x44", "copy 122x44"]);
        await page.locator(catalogSel("tab-figure")).click();
        await page.locator(catalogSel("expand")).click();
        await expect
          .poll(() => catalogShortOf(page, catalogSel("overlay"), ["overlay-close"]), { ...WAIT, message: `${where} の重ね窓で、閉じるの釦が無いか、44px に届かない` })
          .toEqual({ missing: [], small: [] });
        if (sized) await expectSizes(() => catalogTargetsOf(page, catalogSel("overlay")), `${where} の重ね窓`, ["overlay-close 44x44"]);
      }
    },
  );


  it(
    "coarse-catalog-bar-fits",
    async () => {
      // 指で触る時に 44px の部品を並べても、見本の枠の上の帯は日本語でも英語でも部品を帯の中に収め、収まらない幅では道具を折り返す (#3078)
      for (const viewport of [...TOUCH_CATALOG_SIZES.slice(1), { width: 1180, height: 820 }]) {
        for (const lang of ["ja", "en"] as const) {
          const where = `指で触る ${viewport.width} × ${viewport.height} の${lang === "en" ? "英語の" : ""}時系列図の分類の頁`;
          const page = await openSequence(viewport, true);
          if (lang === "en") {
            await page.locator(siteSel("lang-en")).click();
            await expect.poll(() => page.evaluate(() => document.documentElement.lang), { ...WAIT, message: `${where} で、英語に切り替わらない` }).toBe("en");
          }
          await expect
            .poll(() => catalogBarOf(page), { ...WAIT, message: `${where} で、見本の枠の上の帯の部品が帯からはみ出すか、重なるか、頁が横にあふれる` })
            .toEqual({ count: 7, cut: [], overlap: [], pageOver: false });
        }
      }
    },
  );


  it(
    "coarse-catalog-crumb-keeps-place",
    async () => {
      // 道筋の札は字の位置を変えずに押せる範囲だけを広げる。最初の札の字は頁の題と左端が揃い、押せる範囲が隣の札にも区切りの › にも掛からない (#3078)
      for (const viewport of TOUCH_CATALOG_SIZES) {
        const page = await openSequence(viewport, true);
        await expect
          .poll(
            () =>
              page.evaluate(async () => {
                await document.fonts.ready;
                const textLeft = (node: Node): number => {
                  const range = document.createRange();
                  range.selectNodeContents(node);
                  return range.getBoundingClientRect().left;
                };
                const links = [...document.querySelectorAll<HTMLAnchorElement>('[data-catalog="crumb"] a')];
                const first = links[0];
                const title = document.querySelector(".catalog-title");
                if (!first || !title) return null;
                const boxes = links.map((a) => a.getBoundingClientRect());
                // 押せる範囲は区切りの › に掛けず、札の間に押しても何も起きない隙間を残す
                const marks = [...document.querySelectorAll<HTMLElement>('[data-catalog="crumb"] > [aria-hidden="true"]')].map((m) => m.getBoundingClientRect());
                const meets = (a: DOMRect, b: DOMRect): boolean => a.left < b.right - 0.5 && b.left < a.right - 0.5;
                return {
                  aligned: Math.abs(textLeft(first) - textLeft(title)) < 1,
                  apart: marks.length > 0 && boxes.every((r, i) => boxes.slice(i + 1).every((q) => !meets(r, q)) && marks.every((m) => !meets(r, m))),
                };
              }),
            { ...WAIT, message: `指で触る ${viewport.width} × ${viewport.height} の時系列図の分類の頁で、道筋の最初の札の字が題と揃わないか、札の押せる範囲が隣の札か区切りに掛かる` },
          )
          .toEqual({ aligned: true, apart: true });
      }
    },
  );


  it(
    "coarse-catalog-parts-work",
    async () => {
      // 指で触る時に部品を 44px にしても、カタログの頁の部品の働きは今と同じ (#3078)
      for (const viewport of [
        { width: 1366, height: 1024 },
        { width: 768, height: 1024 },
      ]) {
        const page = await openSequence(viewport, true);
        const where = `指で触る ${viewport.width} × ${viewport.height} の時系列図の分類の頁`;
        const preview = catalogSel("preview");
        const level = async (): Promise<number> => Number.parseInt((await catalogZoomOf(page)).level, 10);
        await expect.poll(level, { ...WAIT, message: `${where} で、倍率が出ない` }).toBeGreaterThan(0);
        const base = await level();
        await page.locator(`${preview} ${catalogSel("zoom-out")}`).click();
        await expect.poll(level, { ...WAIT, message: `${where} で、縮小の釦で倍率が下がらない` }).toBeLessThan(base);
        await page.locator(`${preview} ${catalogSel("zoom-in")}`).click();
        await page.locator(`${preview} ${catalogSel("zoom-in")}`).click();
        await expect.poll(level, { ...WAIT, message: `${where} で、拡大の釦で倍率が上がらない` }).toBeGreaterThan(base);
        await page.locator(`${preview} ${catalogSel("fit")}`).click();
        await expect.poll(level, { ...WAIT, message: `${where} で、合わせるの釦で元の倍率に戻らない` }).toBe(base);

        await page.locator(catalogSel("tab-code")).click();
        await expect.poll(() => page.locator(catalogSel("source")).isVisible(), { ...WAIT, message: `${where} で、コードの札でコードの側に替わらない` }).toBe(true);
        await page.locator(catalogSel("source-json")).click();
        await expect.poll(() => page.locator(catalogSel("source-json")).getAttribute("aria-pressed"), { ...WAIT, message: `${where} で、JSON の切替で JSON の側が選ばれない` }).toBe("true");
        await page.locator(catalogSel("tab-figure")).click();
        await page.locator(catalogSel("palette")).selectOption("paper");
        await expect.poll(() => page.locator(catalogSel("palette")).inputValue(), { ...WAIT, message: `${where} で、色味の選択で紙と墨を選べない` }).toBe("paper");

        await page.locator(catalogSel("expand")).click();
        await expect.poll(() => page.locator(catalogSel("overlay")).isVisible(), { ...WAIT, message: `${where} で、拡大して見るの釦で重ね窓が開かない` }).toBe(true);
        await page.locator(catalogSel("overlay-close")).click();
        await expect.poll(() => page.locator(catalogSel("overlay")).count(), { ...WAIT, message: `${where} で、閉じるの釦で重ね窓が閉じない` }).toBe(0);

        const items = page.locator(catalogSel("item"));
        const all = await items.count();
        await page.locator(catalogSel("search")).fill("OAuth");
        await expect.poll(() => items.count(), { ...WAIT, message: `${where} で、検索に字を入れても一覧が絞られない` }).toBeLessThan(all);
        await page.locator(catalogSel("search-clear")).click();
        await expect.poll(() => items.count(), { ...WAIT, message: `${where} で、消す釦で一覧が戻らない` }).toBe(all);
        const title = await page.locator(".catalog-preview-title").textContent();
        await items.nth(1).click();
        await expect.poll(() => page.locator(".catalog-preview-title").textContent(), { ...WAIT, message: `${where} で、一覧の行で見本が替わらない` }).not.toBe(title);

        await page.locator(`${catalogSel("crumb")} a[href="${BASE}catalog"]`).click();
        await expect.poll(() => page.evaluate(() => location.pathname), { ...WAIT, message: `${where} で、道筋のカタログの札でカタログの一覧へ移らない` }).toBe(`${BASE}catalog`);
      }
    },
  );


  it(
    "mouse-tablet-catalog-keeps-size",
    async () => {
      // マウスで使う時は、768px でもカタログの頁の部品は今の大きさのまま (#3078)
      for (const viewport of [
        { width: 768, height: 1024 },
        { width: 1440, height: 900 },
      ]) {
        const page = await openSequence(viewport);
        const where = `マウスで使う ${viewport.width} × ${viewport.height} の時系列図の分類の頁`;
        const read = (): Promise<{ sizes: Record<string, string[]>; heights: Record<string, number[]> }> =>
          page.evaluate(async () => {
            await document.fonts.ready;
            const all = (sel: string): Element[] => [...document.querySelectorAll(sel)].filter((el) => el.checkVisibility());
            const sizes = (sel: string): string[] => [
              ...new Set(
                all(sel).map((el) => {
                  const r = el.getBoundingClientRect();
                  return `${Math.round(r.width)}x${Math.round(r.height)}`;
                }),
              ),
            ];
            const heights = (sel: string): number[] => [...new Set(all(sel).map((el) => Math.round(el.getBoundingClientRect().height)))];
            return {
              sizes: {
                zoom: sizes('[data-catalog="preview"] .catalog-zoom-btn'),
                clear: sizes('[data-catalog="search-clear"]'),
                close: sizes('[data-catalog="overlay-close"]'),
              },
              heights: {
                crumb: heights('[data-catalog="crumb"] a'),
                search: heights('[data-catalog="search"]'),
                item: [Math.min(...all('[data-catalog="item"]').map((el) => Math.round(el.getBoundingClientRect().height)))],
                tabs: heights('[data-catalog^="tab-"]'),
                palette: heights('[data-catalog="palette"]'),
                openEditor: heights('[data-catalog="open-editor"]'),
                source: heights('[data-catalog^="source-"]:not([data-catalog="source-code"])'),
                copy: heights('[data-catalog="copy"]'),
              },
            };
          });
        await expect
          .poll(async () => (await read()).heights, { ...WAIT, message: `${where} で、道筋の札、一覧、見本の枠の部品の高さが今と違う` })
          .toEqual({ crumb: [19], search: [36], item: [34], tabs: [38], palette: [29], openEditor: [21], source: [], copy: [] });
        expect((await read()).sizes.zoom, `${where} で、縮小と拡大と合わせるの釦の大きさが今と違う`).toEqual(["28x26"]);
        await page.locator(catalogSel("search")).fill("OAuth");
        await expect.poll(async () => (await read()).sizes.clear, { ...WAIT, message: `${where} で、検索の消す釦の大きさが今と違う` }).toEqual(["24x24"]);
        await page.locator(catalogSel("search")).fill("");
        await page.locator(catalogSel("tab-code")).click();
        await expect.poll(async () => {
          const { source, copy } = (await read()).heights;
          return { source, copy };
        }, { ...WAIT, message: `${where} のコードの側で、切替か写すの釦の高さが今と違う` }).toEqual({ source: [32], copy: [34] });
        await page.locator(catalogSel("tab-figure")).click();
        await page.locator(catalogSel("expand")).click();
        await expect.poll(async () => (await read()).sizes.close, { ...WAIT, message: `${where} の重ね窓で、閉じるの釦の大きさが今と違う` }).toEqual(["34x34"]);
      }
    },
  );
});
