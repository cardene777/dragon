/**
 * mdから書き出した頁を開いて押す (#3755)。
 *
 * 書き出した頁は、入口と項目の頁を`data-page`の要素に持ち、場所の名前を頁のURLの`#`の後ろに残す。
 * 組み立て`entry` (既定) は入口に全体の図と項目の札を並べ、`sidebar`は左の目次、`tabs`は上の段のタブで項目を選ぶ。
 * 項目の頁の中は`####`の見出しのタブ (`data-level="4"`)、その中は`#####`の見出しのタブ (`data-level="5"`) に分かれる。
 *
 * 頁は`http://localhost/`に置いた Chromium で開き、頁が jsDelivr から読む dragon は build した`dist/cdn`から渡す。
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import type { Page } from "playwright-core";
import { describe, expect, it } from "vitest";

import { withSite } from "./cdn-page-support";
import {
  expectWritten,
  exportPageTool,
  LAYOUTS,
  type Layout,
  writeNote,
} from "./page-export-support";

/** 頁が書き換わるのを待つ長さ。1 件の上限 (10 秒) より短く待ち、書き換わらない時も判定の文で落とす */
const WAIT = 4_000;
/** 携帯の幅 */
const PHONE = { width: 390, height: 844 };

/** 見本のmdを組み立て`layout`で書き出し、`hash`の場所を開いて`run`を回す */
async function openNote(
  layout: Layout | undefined,
  hash: string,
  run: (page: Page) => Promise<void>,
  viewport?: { width: number; height: number },
): Promise<void> {
  const exportPage = await exportPageTool();
  if (!exportPage) return;
  const md = writeNote(layout);
  const path = expectWritten(await exportPage(md));
  if (path === "") return;
  const files = {
    "notes.html": readFileSync(path, "utf8"),
    "parts/pic.png": readFileSync(join(dirname(md), "parts/pic.png")),
  };
  await withSite(files, `notes.html${hash}`, run, viewport);
}

/** 見えている頁の場所の名前。入口は空の字 */
const shownPages = (page: Page): Promise<string[]> =>
  page.evaluate(() =>
    [...document.querySelectorAll<HTMLElement>("[data-page]")]
      .filter((el) => el.checkVisibility())
      .map((el) => el.dataset.page ?? ""),
  );

/** 見えている頁が`ids`になるまで待つ */
const expectShown = async (page: Page, ids: string[], why: string): Promise<void> => {
  await expect.poll(() => shownPages(page), { message: why, timeout: WAIT }).toEqual(ids);
};

/** 見えている図が全て描かれるまで待つ。帯つきの図は帯の内側の影の根に描く */
const figuresDrawn = (page: Page): Promise<unknown> =>
  page
    .waitForFunction(
      () => {
        const visible = (el: Element): boolean => (el as HTMLElement).checkVisibility();
        if ([...document.querySelectorAll("pre.dragon")].some(visible)) return false;
        const figures = [...document.querySelectorAll(".dragon-figure")].filter(visible);
        return (
          figures.length > 0 &&
          figures.every(
            (f) =>
              (f.querySelector(".dragon-frame")?.shadowRoot ?? f).querySelector(
                '[data-dragon="player"] svg',
              ) !== null,
          )
        );
      },
      null,
      { timeout: WAIT },
    )
    .catch(() => undefined);

/** 見えている頁の`level`の深さのタブの名前と、選んだタブの名前 */
const tabsOf = (page: Page, level: 4 | 5): Promise<{ names: string[]; selected: string[] }> =>
  page.evaluate((lv) => {
    const lists = [
      ...document.querySelectorAll<HTMLElement>(`[role="tablist"][data-level="${lv}"]`),
    ].filter((el) => el.checkVisibility());
    const tabs = lists.flatMap((list) => [...list.querySelectorAll<HTMLElement>('[role="tab"]')]);
    return {
      names: tabs.map((t) => t.textContent?.trim() ?? ""),
      selected: tabs
        .filter((t) => t.getAttribute("aria-selected") === "true")
        .map((t) => t.textContent?.trim() ?? ""),
    };
  }, level);

/** 見えている`level`の深さのタブの中身の字 */
const panelText = (page: Page, level: 4 | 5): Promise<string[]> =>
  page.evaluate(
    (lv) =>
      [...document.querySelectorAll<HTMLElement>(`[role="tabpanel"][data-level="${lv}"]`)]
        .filter((el) => el.checkVisibility())
        .map((el) => el.textContent ?? ""),
    level,
  );

/** 見えている頁の`level`の深さのタブのうち、名前が`name`のタブを押す */
const pickTab = (page: Page, level: 4 | 5, name: string): Promise<void> =>
  page
    .locator(`[role="tablist"][data-level="${level}"] [role="tab"]:visible`, { hasText: name })
    .first()
    .click({ timeout: WAIT });

/** 頁が横にはみ出す幅。はみ出さない時は 0 */
const overflow = (page: Page): Promise<number> =>
  page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);

describe("mdから書き出した頁 (#3755)", () => {
  it("page-entry-shows-overview-and-cards", async () => {
    await openNote(undefined, "", async (page) => {
      await expectShown(page, [""], "layout を書かない頁を開いた時に入口が見えない");
      await figuresDrawn(page);
      const entry = await page.evaluate(() => {
        const root = document.querySelector('[data-page=""]');
        return {
          drawn: [...(root?.querySelectorAll(".dragon-figure") ?? [])].some(
            (f) =>
              (f.querySelector(".dragon-frame")?.shadowRoot ?? f).querySelector(
                '[data-dragon="player"] svg',
              ) !== null,
          ),
          groups: [...(root?.querySelectorAll(".pg-group") ?? [])].map((g) => ({
            name: g.querySelector(".pg-group-name")?.textContent?.trim() ?? "",
            cards: [...g.querySelectorAll("a.pg-card")].map((a) => a.getAttribute("href")),
          })),
        };
      });
      expect(entry.drawn, "入口に全体の図が描かれない").toBe(true);
      expect(entry.groups, "入口の段ごとの項目の札").toEqual([
        { name: "受付", cards: ["#order"] },
        { name: "支払いと配送", cards: ["#pay", "#配送"] },
      ]);
    });
  });

  it("page-card-opens-item-and-back", async () => {
    await openNote(undefined, "", async (page) => {
      await expectShown(page, [""], "入口が見えない");
      await page.locator('a.pg-card[href="#pay"]').click({ timeout: WAIT });
      await expectShown(page, ["pay"], "札を押しても項目の頁へ移らない");
      expect(
        await page.evaluate(() => decodeURIComponent(location.hash)),
        "移った項目が頁のURLに残らない",
      ).toBe("#pay");
      await page.locator('[data-page="pay"] a.pg-back').click({ timeout: WAIT });
      await expectShown(page, [""], "戻る釦で入口へ戻らない");
    });
  });

  it("page-overview-box-opens-item", async () => {
    await openNote(undefined, "", async (page) => {
      await figuresDrawn(page);
      await page
        .locator('[data-page=""] .dragon-figure a[href="#配送"]')
        .first()
        .click({ timeout: WAIT });
      await expectShown(page, ["配送"], "全体の図の箱を押しても結び付けた項目の頁へ移らない");
    });
  });

  it("page-sidebar-layout-opens-item", async () => {
    await openNote("sidebar", "", async (page) => {
      await expectShown(page, [""], "sidebar の頁を開いた時に入口が見えない");
      await page.locator('nav.pg-toc a[href="#pay"]').click({ timeout: WAIT });
      await expectShown(page, ["pay"], "左の目次の項目を押しても項目の頁が出ない");
      expect(
        await page.locator('nav.pg-toc a[href="#pay"]').getAttribute("aria-current"),
        "目次が開いた項目を示さない",
      ).toBe("page");
    });
  });

  it("page-tabs-layout-opens-item", async () => {
    await openNote("tabs", "", async (page) => {
      await expectShown(page, [""], "tabs の頁を開いた時に入口が見えない");
      await page
        .locator('nav.pg-groups [role="tab"]', { hasText: "支払いと配送" })
        .click({ timeout: WAIT });
      await expectShown(page, ["pay"], "段のタブを押しても段の最初の項目が出ない");
      await page.locator('[role="tab"][href="#配送"]:visible').click({ timeout: WAIT });
      await expectShown(page, ["配送"], "段の中の項目のタブを押しても項目の頁が出ない");
    });
  });

  it("page-item-headings-become-tabs", async () => {
    await openNote(undefined, "#order", async (page) => {
      await expectShown(page, ["order"], "場所の名前を持つURLで項目の頁が開かない");
      expect(await tabsOf(page, 4), "項目の頁の #### の見出しのタブ").toEqual({
        names: ["結果", "仕組みの図", "出力の全文"],
        selected: ["結果"],
      });
      expect(await panelText(page, 4), "最初のタブの中身だけが見える").toEqual([
        expect.stringContaining("受けた注文を確かめた。"),
      ]);
      await pickTab(page, 4, "仕組みの図");
      await expect
        .poll(async () => (await tabsOf(page, 4)).selected, {
          message: "押したタブを選ばない",
          timeout: WAIT,
        })
        .toEqual(["仕組みの図"]);
      expect(await panelText(page, 4), "押したタブの中身だけが見える").toEqual([
        expect.not.stringContaining("受けた注文を確かめた。"),
      ]);
      await pickTab(page, 4, "出力の全文");
      expect((await tabsOf(page, 5)).names, "タブの中の ##### の見出しのタブ").toEqual([
        "design.md",
        "pay.ts",
      ]);
      await pickTab(page, 5, "pay.ts");
      await expect
        .poll(() => panelText(page, 5), {
          message: "押したタブの中のタブの中身が出ない",
          timeout: WAIT,
        })
        .toEqual([expect.stringContaining("export const pay")]);
    });
  });

  it("page-tab-survives-reload", async () => {
    await openNote(undefined, "", async (page) => {
      await page.locator('a.pg-card[href="#order"]').click({ timeout: WAIT });
      await expectShown(page, ["order"], "札を押しても項目の頁へ移らない");
      await pickTab(page, 4, "仕組みの図");
      await expect
        .poll(() => page.evaluate(() => decodeURIComponent(location.hash)), {
          message: "開いたタブが頁のURLに残らない",
          timeout: WAIT,
        })
        .toBe("#order/仕組みの図");
      await page.reload();
      await expectShown(page, ["order"], "読み直すと同じ項目を開かない");
      expect((await tabsOf(page, 4)).selected, "読み直すと同じタブを開かない").toEqual([
        "仕組みの図",
      ]);
    });
  });

  it("page-diagrams-have-bar", async () => {
    await openNote(undefined, "", async (page) => {
      await page.locator('a.pg-card[href="#order"]').click({ timeout: WAIT });
      await expectShown(page, ["order"], "札を押しても項目の頁へ移らない");
      await pickTab(page, 4, "仕組みの図");
      await figuresDrawn(page);
      const bars = await page.evaluate(() =>
        [...document.querySelectorAll<HTMLElement>('[data-page="order"] .dragon-figure')]
          .filter((f) => f.checkVisibility())
          .map((figure) => {
            const root = figure.querySelector(".dragon-frame")?.shadowRoot;
            return {
              buttons: root
                ? [...root.querySelectorAll<HTMLElement>(".dg-header-actions > [data-action]")].map(
                    (el) => el.dataset.action,
                  )
                : [],
              drawn: (root ?? figure).querySelector('[data-dragon="player"] svg') !== null,
            };
          }),
      );
      expect(bars, "項目の頁の図が帯つきで描かれない").toEqual([
        { buttons: ["code", "editor", "copy", "export", "expand"], drawn: true },
      ]);
    });
  });

  describe.for(LAYOUTS)("組み立て %s", (layout) => {
    it("page-fits-390px", async () => {
      await openNote(
        layout,
        "",
        async (page) => {
          await figuresDrawn(page);
          expect(await overflow(page), `${layout} の入口が幅390pxで横にはみ出す`).toBe(0);
          await page.evaluate(() => {
            location.hash = "order";
          });
          await expectShown(page, ["order"], "場所の名前で項目の頁を開けない");
          expect(await overflow(page), `${layout} の項目の頁の表が幅390pxで横にはみ出す`).toBe(0);
          await pickTab(page, 4, "出力の全文");
          await pickTab(page, 5, "pay.ts");
          expect(await overflow(page), `${layout} の項目の頁のコードが幅390pxで横にはみ出す`).toBe(
            0,
          );
          await page.evaluate(() => {
            location.hash = "pay/仕組みの図";
          });
          await expectShown(page, ["pay"], "場所の名前で項目のタブを開けない");
          await figuresDrawn(page);
          expect(await overflow(page), `${layout} の項目の頁の図が幅390pxで横にはみ出す`).toBe(0);
        },
        PHONE,
      );
    });
  });
});
