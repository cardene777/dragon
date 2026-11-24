/**
 * mdから書き出した頁を開いて押す (#3755)。
 *
 * 書き出した頁は、入口と項目の頁を`data-page`の要素に持ち、場所の名前を頁のURLの`#`の後ろに残す。
 * 組み立て`entry` (既定) は入口に全体の図と項目の札を並べ、`sidebar`は左の目次、`tabs`は上の段のタブで項目を選ぶ。
 * 項目の頁の中は`####`の見出しのタブ (`data-level="4"`)、その中は`#####`の見出しのタブ (`data-level="5"`) に分かれる。
 *
 * 頁は`http://localhost/`に置いた Chromium で開き、頁が jsDelivr から読む dragon は build した`dist/cdn`から渡す。
 *
 * 件の中で頁を開いて押して待つと、混んだ機械で 1 件 10 秒の上限を超えた (#3816)。
 * 書き出しと、頁を開いて押し、待つ仕事は file を読み込む段 (`at-load.ts`) で済ませ、件は記した値を元の件と同じ順で確かめる。
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { isDeepStrictEqual } from "node:util";
import type { Page } from "playwright-core";
import { describe, expect, it } from "vitest";

import { atLoad, type Loaded } from "./at-load";
import { ACTION_LIMIT_MS, PAGE_LIMIT_MS, inOrder, readUntil, within } from "./page-wait";
import { withSite } from "./cdn-page-support";
import {
  expectWritten,
  exportPageTool,
  LAYOUTS,
  type Layout,
  writeNote,
} from "./page-export-support";

/** 頁が書き換わるのを待つ長さ。元の件の 1 件の上限 (10 秒) より短く待ち、書き換わらない時も判定の文で落とす */
const WAIT = 4_000;
/** 携帯の幅 */
const PHONE = { width: 390, height: 844 };

/**
 * 見本のmdを組み立て`layout`で書き出し、`hash`の場所を開いて`run`を回す。
 * 書き出せない時は`exportPageTool`と`expectWritten`の判定の文で落ち、判定が落とさない時は頁を開かずに undefined を返す
 */
async function openNote<T>(
  layout: Layout | undefined,
  hash: string,
  run: (page: Page) => Promise<T>,
  viewport?: { width: number; height: number },
): Promise<T | undefined> {
  const exportPage = await exportPageTool();
  if (!exportPage) return undefined;
  const md = writeNote(layout);
  const path = expectWritten(await exportPage(md));
  if (path === "") return undefined;
  const files = {
    "notes.html": readFileSync(path, "utf8"),
    "parts/pic.png": readFileSync(join(dirname(md), "parts/pic.png")),
  };
  return within(withSite(files, `notes.html${hash}`, run, viewport), PAGE_LIMIT_MS, "mdから書き出した頁の仕事");
}

/** 見えている頁の場所の名前。入口は空の字 */
const shownPages = (page: Page): Promise<string[]> =>
  page.evaluate(() =>
    [...document.querySelectorAll<HTMLElement>("[data-page]")]
      .filter((el) => el.checkVisibility())
      .map((el) => el.dataset.page ?? ""),
  );

/** 見えている頁が`ids`になるまで待ち、最後に読んだ見えている頁を返す。件が`expectShown`で確かめる */
const untilShown = (page: Page, ids: string[]): Promise<string[]> =>
  readUntil(() => shownPages(page), (shown) => isDeepStrictEqual(shown, ids), WAIT);

/** 読み込む段で待って読んだ見えている頁`shown`が`ids`か。元の件が見えている頁を待った判定と同じ文で落とす */
const expectShown = (shown: string[], ids: string[], why: string): void => {
  expect(shown, why).toEqual(ids);
};

/** 読み込む段で待って読んだ値を、元の件が待った判定と同じ文で確かめる */
const polled = <T>(value: T, message: string) => expect(value, message);

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

// 頁は件ごとに 1 つずつ開き、落ちた仕事はそれを読む件だけを落とす。押す件は押す前に読んだ値も残し、件は元の件と同じ順に確かめる
const ENTRY = await atLoad("layout を書かない頁を開き、入口の全体の図と項目の札を読む", () =>
  openNote(undefined, "", async (page) => {
    const step = inOrder();
    const shown = await step("入口が見えるのを待つ", () => untilShown(page, [""]));
    const entry = await step("入口の全体の図と項目の札を読む", async () => {
      await figuresDrawn(page);
      return page.evaluate(() => {
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
    });
    return { shown, entry };
  }),
);

const CARD = await atLoad("入口の札を押して項目の頁を開き、戻る釦で入口へ戻る", () =>
  openNote(undefined, "", async (page) => {
    const step = inOrder();
    const entry = await step("入口が見えるのを待つ", () => untilShown(page, [""]));
    const item = await step("札を押して項目の頁を待つ", async () => {
      await page.locator('a.pg-card[href="#pay"]').click({ timeout: WAIT });
      return untilShown(page, ["pay"]);
    });
    const hash = await step("頁のURLの場所の名前を読む", () => page.evaluate(() => decodeURIComponent(location.hash)));
    const back = await step("戻る釦を押して入口を待つ", async () => {
      await page.locator('[data-page="pay"] a.pg-back').click({ timeout: WAIT });
      return untilShown(page, [""]);
    });
    return { entry, item, hash, back };
  }),
);

const OVERVIEW_BOX = await atLoad("入口の全体の図の箱を押し、結び付けた項目の頁を待つ", () =>
  openNote(undefined, "", async (page) => {
    await figuresDrawn(page);
    await page
      .locator('[data-page=""] .dragon-figure a[href="#配送"]')
      .first()
      .click({ timeout: WAIT });
    return untilShown(page, ["配送"]);
  }),
);

const SIDEBAR = await atLoad("sidebar の頁を開き、左の目次の項目を押す", () =>
  openNote("sidebar", "", async (page) => {
    const step = inOrder();
    const entry = await step("入口が見えるのを待つ", () => untilShown(page, [""]));
    const item = await step("左の目次の項目を押して項目の頁を待つ", async () => {
      await page.locator('nav.pg-toc a[href="#pay"]').click({ timeout: WAIT });
      return untilShown(page, ["pay"]);
    });
    const current = await step("目次の項目が開いた項目を示すかを読む", () => page.locator('nav.pg-toc a[href="#pay"]').getAttribute("aria-current", { timeout: ACTION_LIMIT_MS }));
    return { entry, item, current };
  }),
);

const TABS = await atLoad("tabs の頁を開き、段のタブと段の中の項目のタブを押す", () =>
  openNote("tabs", "", async (page) => {
    const step = inOrder();
    const entry = await step("入口が見えるのを待つ", () => untilShown(page, [""]));
    const group = await step("段のタブを押して段の最初の項目を待つ", async () => {
      await page
        .locator('nav.pg-groups [role="tab"]', { hasText: "支払いと配送" })
        .click({ timeout: WAIT });
      return untilShown(page, ["pay"]);
    });
    const item = await step("段の中の項目のタブを押して項目の頁を待つ", async () => {
      await page.locator('[role="tab"][href="#配送"]:visible').click({ timeout: WAIT });
      return untilShown(page, ["配送"]);
    });
    return { entry, group, item };
  }),
);

/** 選んだタブの名前が押したタブになったか */
const selectedIs = (name: string) => (selected: string[]) => isDeepStrictEqual(selected, [name]);

const HEADING_TABS = await atLoad("場所の名前を持つURLで項目の頁を開き、#### と ##### の見出しのタブを押す", () =>
  openNote(undefined, "#order", async (page) => {
    const step = inOrder();
    const opened = await step("項目の頁が見えるのを待つ", () => untilShown(page, ["order"]));
    const tabs = await step("#### の見出しのタブを読む", () => tabsOf(page, 4));
    const panel = await step("見えているタブの中身を読む", () => panelText(page, 4));
    const picked = await step("#### の見出しのタブを押し、選んだタブを待つ", async () => {
      await pickTab(page, 4, "仕組みの図");
      return readUntil(async () => (await tabsOf(page, 4)).selected, selectedIs("仕組みの図"), WAIT);
    });
    const pickedPanel = await step("押したタブの中身を読む", () => panelText(page, 4));
    const inner = await step("タブを押し、タブの中の ##### の見出しのタブを読む", async () => {
      await pickTab(page, 4, "出力の全文");
      return (await tabsOf(page, 5)).names;
    });
    const innerPanel = await step("##### の見出しのタブを押し、中身を待つ", async () => {
      await pickTab(page, 5, "pay.ts");
      return readUntil(() => panelText(page, 5), (texts) => texts.length === 1 && texts[0]!.includes("export const pay"), WAIT);
    });
    return { opened, tabs, panel, picked, pickedPanel, inner, innerPanel };
  }),
);

const RELOAD = await atLoad("項目の頁のタブを押してから頁を読み直す", () =>
  openNote(undefined, "", async (page) => {
    const step = inOrder();
    const item = await step("札を押して項目の頁を待つ", async () => {
      await page.locator('a.pg-card[href="#order"]').click({ timeout: WAIT });
      return untilShown(page, ["order"]);
    });
    const hash = await step("タブを押し、頁のURLに残る場所の名前を待つ", async () => {
      await pickTab(page, 4, "仕組みの図");
      return readUntil(() => page.evaluate(() => decodeURIComponent(location.hash)), (at) => at === "#order/仕組みの図", WAIT);
    });
    const reloaded = await step("頁を読み直して項目の頁を待つ", async () => {
      await page.reload({ timeout: ACTION_LIMIT_MS });
      return untilShown(page, ["order"]);
    });
    const selected = await step("読み直した頁の選んだタブを読む", async () => (await tabsOf(page, 4)).selected);
    return { item, hash, reloaded, selected };
  }),
);

const BARS = await atLoad("項目の頁の仕組みの図のタブを開き、図の帯を読む", () =>
  openNote(undefined, "", async (page) => {
    const step = inOrder();
    const item = await step("札を押して項目の頁を待つ", async () => {
      await page.locator('a.pg-card[href="#order"]').click({ timeout: WAIT });
      return untilShown(page, ["order"]);
    });
    const bars = await step("仕組みの図のタブを押し、図の帯を読む", async () => {
      await pickTab(page, 4, "仕組みの図");
      await figuresDrawn(page);
      return page.evaluate(() =>
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
    });
    return { item, bars };
  }),
);

/** 組み立て`layout`の頁を携帯の幅で開き、入口と項目の頁の表とコードと図の横にはみ出す幅を順に測る */
const phoneFit = (layout: Layout) =>
  openNote(
    layout,
    "",
    async (page) => {
      const step = inOrder();
      const entry = await step("入口の図を待ち、横にはみ出す幅を測る", async () => {
        await figuresDrawn(page);
        return overflow(page);
      });
      const item = await step("場所の名前で項目の頁を開いて待つ", async () => {
        await page.evaluate(() => {
          location.hash = "order";
        });
        return untilShown(page, ["order"]);
      });
      const table = await step("項目の頁の表の横にはみ出す幅を測る", () => overflow(page));
      const code = await step("出力の全文のタブの pay.ts を押し、コードの横にはみ出す幅を測る", async () => {
        await pickTab(page, 4, "出力の全文");
        await pickTab(page, 5, "pay.ts");
        return overflow(page);
      });
      const tab = await step("場所の名前で項目のタブを開いて待つ", async () => {
        await page.evaluate(() => {
          location.hash = "pay/仕組みの図";
        });
        return untilShown(page, ["pay"]);
      });
      const figure = await step("項目の頁の図を待ち、横にはみ出す幅を測る", async () => {
        await figuresDrawn(page);
        return overflow(page);
      });
      return { entry, item, table, code, tab, figure };
    },
    PHONE,
  );

// 組み立てごとに頁を開き、1 つの組み立ての頁が落ちても、ほかの組み立ての件は回る
const PHONE_FITS = await atLoad("3 つの組み立ての頁を幅390pxで開き、横にはみ出す幅を測る", async () => {
  const byLayout: Partial<Record<Layout, Loaded<Awaited<ReturnType<typeof phoneFit>>>>> = {};
  for (const layout of LAYOUTS) byLayout[layout] = await atLoad(`組み立て ${layout} の頁を幅390pxで開き、横にはみ出す幅を測る`, () => phoneFit(layout));
  return byLayout;
});

describe("mdから書き出した頁 (#3755)", () => {
  it("page-entry-shows-overview-and-cards", () => {
    const seen = ENTRY.get();
    if (!seen) return;
    expectShown(seen.shown.get(), [""], "layout を書かない頁を開いた時に入口が見えない");
    const entry = seen.entry.get();
    expect(entry.drawn, "入口に全体の図が描かれない").toBe(true);
    expect(entry.groups, "入口の段ごとの項目の札").toEqual([
      { name: "受付", cards: ["#order"] },
      { name: "支払いと配送", cards: ["#pay", "#配送"] },
    ]);
  });

  it("page-card-opens-item-and-back", () => {
    const seen = CARD.get();
    if (!seen) return;
    expectShown(seen.entry.get(), [""], "入口が見えない");
    expectShown(seen.item.get(), ["pay"], "札を押しても項目の頁へ移らない");
    expect(
      seen.hash.get(),
      "移った項目が頁のURLに残らない",
    ).toBe("#pay");
    expectShown(seen.back.get(), [""], "戻る釦で入口へ戻らない");
  });

  it("page-overview-box-opens-item", () => {
    const shown = OVERVIEW_BOX.get();
    if (!shown) return;
    expectShown(shown, ["配送"], "全体の図の箱を押しても結び付けた項目の頁へ移らない");
  });

  it("page-sidebar-layout-opens-item", () => {
    const seen = SIDEBAR.get();
    if (!seen) return;
    expectShown(seen.entry.get(), [""], "sidebar の頁を開いた時に入口が見えない");
    expectShown(seen.item.get(), ["pay"], "左の目次の項目を押しても項目の頁が出ない");
    expect(
      seen.current.get(),
      "目次が開いた項目を示さない",
    ).toBe("page");
  });

  it("page-tabs-layout-opens-item", () => {
    const seen = TABS.get();
    if (!seen) return;
    expectShown(seen.entry.get(), [""], "tabs の頁を開いた時に入口が見えない");
    expectShown(seen.group.get(), ["pay"], "段のタブを押しても段の最初の項目が出ない");
    expectShown(seen.item.get(), ["配送"], "段の中の項目のタブを押しても項目の頁が出ない");
  });

  it("page-item-headings-become-tabs", () => {
    const seen = HEADING_TABS.get();
    if (!seen) return;
    expectShown(seen.opened.get(), ["order"], "場所の名前を持つURLで項目の頁が開かない");
    expect(seen.tabs.get(), "項目の頁の #### の見出しのタブ").toEqual({
      names: ["結果", "仕組みの図", "出力の全文"],
      selected: ["結果"],
    });
    expect(seen.panel.get(), "最初のタブの中身だけが見える").toEqual([
      expect.stringContaining("受けた注文を確かめた。"),
    ]);
    polled(seen.picked.get(), "押したタブを選ばない").toEqual(["仕組みの図"]);
    expect(seen.pickedPanel.get(), "押したタブの中身だけが見える").toEqual([
      expect.not.stringContaining("受けた注文を確かめた。"),
    ]);
    expect(seen.inner.get(), "タブの中の ##### の見出しのタブ").toEqual([
      "design.md",
      "pay.ts",
    ]);
    polled(seen.innerPanel.get(), "押したタブの中のタブの中身が出ない").toEqual([expect.stringContaining("export const pay")]);
  });

  it("page-tab-survives-reload", () => {
    const seen = RELOAD.get();
    if (!seen) return;
    expectShown(seen.item.get(), ["order"], "札を押しても項目の頁へ移らない");
    polled(seen.hash.get(), "開いたタブが頁のURLに残らない").toBe("#order/仕組みの図");
    expectShown(seen.reloaded.get(), ["order"], "読み直すと同じ項目を開かない");
    expect(seen.selected.get(), "読み直すと同じタブを開かない").toEqual([
      "仕組みの図",
    ]);
  });

  it("page-diagrams-have-bar", () => {
    const seen = BARS.get();
    if (!seen) return;
    expectShown(seen.item.get(), ["order"], "札を押しても項目の頁へ移らない");
    expect(seen.bars.get(), "項目の頁の図が帯つきで描かれない").toEqual([
      { buttons: ["code", "editor", "copy", "export", "expand"], drawn: true },
    ]);
  });

  describe.for(LAYOUTS)("組み立て %s", (layout) => {
    it("page-fits-390px", () => {
      const seen = PHONE_FITS.get()[layout]!.get();
      if (!seen) return;
      expect(seen.entry.get(), `${layout} の入口が幅390pxで横にはみ出す`).toBe(0);
      expectShown(seen.item.get(), ["order"], "場所の名前で項目の頁を開けない");
      expect(seen.table.get(), `${layout} の項目の頁の表が幅390pxで横にはみ出す`).toBe(0);
      expect(seen.code.get(), `${layout} の項目の頁のコードが幅390pxで横にはみ出す`).toBe(
        0,
      );
      expectShown(seen.tab.get(), ["pay"], "場所の名前で項目のタブを開けない");
      expect(seen.figure.get(), `${layout} の項目の頁の図が幅390pxで横にはみ出す`).toBe(0);
    });
  });
});
