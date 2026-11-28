/**
 * 説明の頁の検索の欄 (#3897)。
 *
 * 話題が2つ以上の説明の頁 (`layout: guide`) は、頁の上のヘッダーの右の端に、問いと用語を探す欄を置く。
 * 欄に語を打つと、題 (目次の短い名前を含む) か1文の答えにその語を含む問いを話題ごとにまとめ、続けて名前か説明にその語を含む用語を並べた一覧が欄のすぐ下に出る。
 * 一覧の問いを押すとその問いの頁へ、用語を押すと用語のタブのその用語の札へ移る。当たる物が無い時は無いことを一覧の所に出す。
 * 幅860px以下では欄を隠して題の右に虫眼鏡の釦を置き、ヘッダーを持たない話題が1つの頁は左の目次の頭に欄を置く。印刷の形では欄を出さない。
 *
 * 書き出したHTMLの形は頁を開かずに確かめ、打つ動きと押す動きと描いた位置は`http://localhost/`に置いた Chromium で測る。
 * 頁を開いて打って押して待つ仕事は file を読み込む段 (`at-load.ts`) で済ませ、件は記した値を確かめる (#3816)。
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { JSDOM } from "jsdom";
import type { Page } from "playwright-core";
import { describe, expect, it } from "vitest";

import { atLoad } from "./at-load";
import { withSite } from "./cdn-page-support";
import { expectWritten, exportPageTool, tempDir, writeFiles } from "./page-export-support";
import { ACTION_LIMIT_MS, inOrder, PAGE_LIMIT_MS, readUntil, within } from "./page-wait";

/** 頁が書き換わるのを待つ長さ */
const WAIT = 4_000;

/** 話題が3つ (用語の話題を含む) の説明の頁。2つ目の話題の1つ目の問いは、目次の短い名前にだけ「送り出し」を持ち、答えにだけ「注文」を持つ */
const GUIDE = `---
layout: guide
---

# 注文を届けるまでの手引き

店が注文を受けてから届けるまでを読む。

![用語](glossary.md)

## 注文を受ける

### 店はどの注文を受けるのか [menu: 受ける注文]

> 在庫の在る品物だけの[注文](glossary.md#注文)を受け、注文の番号を返す。

店は品物の数を確かめてから受ける。

### 断った注文はどこに残るのか

> 断った訳と共に受付の記録に残る。

## 届ける

### 代金を受け取った後、どう送り出すのか [menu: 送り出し]

> 支払いが済んだ注文だけを倉庫へ回す。

### ＡＰＩの鍵はいつ替えるのか

> 倉庫の鍵は月に1度替える。
`;

/** 用語のfile。`API`の説明は大文字の`Key`を持つ */
const GLOSSARY = `# 用語

### 注文

利用者が選んだ品物と届け先の組。

> りんごを3つ

### 支払い

注文の代金を受け取ること。

### API

倉庫へ頼む窓口。Keyを付けて呼ぶ。
`;

/** 英語の説明の頁 */
const GUIDE_EN = `---
layout: guide
---

# Order guide

![Terms](glossary.md)

## Take orders

### Which orders does the shop take?

> Only [orders](glossary.md#order) for items in stock.

## Ship

### How are paid orders shipped?

> Paid orders go to the warehouse.
`;

const GLOSSARY_EN = `# Terms

### order

The items a user picked and where to send them.
`;

/** 話題が1つで用語を持たない頁。ヘッダーを持たず、左の目次に話題と問いを並べる */
const SINGLE = `---
layout: guide
---

# 鍵の手引き

## 鍵を替える

### いつ替えるのか

> 月に1度替える。

${Array.from({ length: 30 }, (_, n) => `- 替える段${n + 1}`).join("\n")}

### 誰が鍵を持つのか

> 倉庫の係が持つ。

${Array.from({ length: 30 }, (_, n) => `- 持つ段${n + 1}`).join("\n")}
`;

/** mdと用語のfileを一時のdirに書き、mdのpathを返す */
function write(name: string, files: Readonly<Record<string, string>>): () => string {
  return () => {
    const root = tempDir(name);
    writeFiles(root, files);
    return join(root, "notes.md");
  };
}
const writeGuide = write("search", { "notes.md": GUIDE, "glossary.md": GLOSSARY });
const writeEnglish = write("search-en", { "notes.md": GUIDE_EN, "glossary.md": GLOSSARY_EN });
const writeSingle = write("search-single", { "notes.md": SINGLE });

/** 見本のmdを書き出して文書にする。書き出せない時は判定の文で落とし、undefined を返す */
async function exported(md: string): Promise<Document | undefined> {
  const exportPage = await exportPageTool();
  if (!exportPage) return undefined;
  const path = expectWritten(await exportPage(md));
  return path === "" ? undefined : new JSDOM(readFileSync(path, "utf8")).window.document;
}

/** `write`が書いたmdを書き出し、頁を`viewport`の大きさで開いて`run`を回す。書き出せない時は判定の文で落とす */
async function openGuide<T>(
  run: (page: Page) => Promise<T>,
  viewport: { width: number; height: number },
  md: () => string,
): Promise<T | undefined> {
  const exportPage = await exportPageTool();
  if (!exportPage) return undefined;
  const path = expectWritten(await exportPage(md()));
  if (path === "") return undefined;
  return within(
    withSite({ "notes.html": readFileSync(path, "utf8") }, "notes.html", run, viewport),
    PAGE_LIMIT_MS,
    "説明の頁の仕事",
  );
}

/** 欄の場所の名前 */
const BOX = 'input[type="search"]';

/**
 * 検索の欄と一覧とヘッダーで見えている物。欄はヘッダーか左の目次の中の`input[type="search"]`、一覧は欄の`aria-controls`が指す`role="listbox"`。
 * 一覧の塊 (`role="group"`) ごとに見出し (`aria-labelledby`が指す要素) の字と、行 (`role="option"`) ごとの子の要素の字と印 (`mark`) の字を読む
 */
const searchState = (page: Page) =>
  page.evaluate((selector) => {
    const sq = (text: string | null | undefined): string =>
      (text ?? "").replace(/\s+/gu, " ").trim();
    const vis = (el: Element | null | undefined): boolean =>
      !!el && (el as HTMLElement).checkVisibility();
    const rect = (el: Element | null | undefined) => {
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return {
        left: Math.round(r.left),
        right: Math.round(r.right),
        top: Math.round(r.top),
        bottom: Math.round(r.bottom),
      };
    };
    const dec = (href: string): string => {
      try {
        return decodeURIComponent(href);
      } catch {
        return href;
      }
    };
    const box =
      [...document.querySelectorAll<HTMLInputElement>(selector)].find(vis) ??
      document.querySelector<HTMLInputElement>(selector);
    const list = box?.getAttribute("aria-controls")
      ? document.getElementById(box.getAttribute("aria-controls") ?? "")
      : null;
    const options = [...(list?.querySelectorAll<HTMLElement>('[role="option"]') ?? [])];
    const head = document.querySelector("header.pg-head");
    const title = head?.querySelector(".pg-head-title");
    const opener = head
      ? ([...head.querySelectorAll<HTMLElement>("button")].find(
          (b) => b.getAttribute("aria-controls") !== null && !b.closest('[role="listbox"]'),
        ) ?? null)
      : null;
    const tab = [...(head?.querySelectorAll("nav.pg-head-tabs a") ?? [])].find(
      (a) => a.getAttribute("aria-current") === "true",
    );
    const target = location.hash ? document.getElementById(dec(location.hash.slice(1))) : null;
    const cards = [...document.querySelectorAll<HTMLElement>(".pg-gl")];
    const otherCard = cards.find((c) => c !== target);
    return {
      hash: dec(location.hash),
      box: box
        ? {
            shown: vis(box),
            rect: rect(box),
            placeholder: box.placeholder,
            label: box.getAttribute("aria-label"),
            focused: document.activeElement === box,
            inHead: !!box.closest("header.pg-head"),
            inMenu: !!box.closest("nav.pg-menu"),
          }
        : null,
      head: rect(head),
      title: rect(title),
      opener: opener
        ? { shown: vis(opener), rect: rect(opener), label: opener.getAttribute("aria-label") }
        : null,
      list: list ? { shown: vis(list), rect: rect(list), text: sq(list.textContent) } : null,
      groups: [...(list?.querySelectorAll('[role="group"]') ?? [])].map((g) => ({
        head: sq(document.getElementById(g.getAttribute("aria-labelledby") ?? "")?.textContent),
        rows: [...g.querySelectorAll('[role="option"]')].map((o) => ({
          lines: [...o.children].map((c) => sq(c.textContent)),
          marks: [...o.querySelectorAll("mark")].map((m) => m.textContent ?? ""),
        })),
      })),
      options: options.length,
      selected: options.findIndex((o) => o.getAttribute("aria-selected") === "true"),
      tab: tab ? sq(tab.textContent) : null,
      sections: [...document.querySelectorAll(".pg-sec")]
        .filter(vis)
        .map((s) => sq(s.querySelector(".pg-sec-title")?.textContent)),
      card: target?.classList.contains("pg-gl")
        ? {
            name: sq(target.querySelector(".pg-gl-n")?.textContent),
            inView:
              target.getBoundingClientRect().top >= 0 &&
              target.getBoundingClientRect().bottom <= innerHeight,
            line: getComputedStyle(target).borderTopColor,
            other: otherCard ? getComputedStyle(otherCard).borderTopColor : null,
          }
        : null,
      sectionTop: target?.classList.contains("pg-sec")
        ? Math.round(target.getBoundingClientRect().top)
        : null,
      width: document.documentElement.clientWidth,
      overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    };
  }, BOX);

type State = Awaited<ReturnType<typeof searchState>>;

/** 欄に`word`を打ち、一覧が`done`を満たすまで待って読む */
async function typeAndRead(page: Page, word: string, done: (s: State) => boolean): Promise<State> {
  const box = page.locator(`${BOX}:visible`).first();
  await box.fill(word, { timeout: ACTION_LIMIT_MS });
  return readUntil(() => searchState(page), done, WAIT);
}

/** 一覧が見えて行を持つか */
const listed = (s: State): boolean => !!s.list?.shown && s.options > 0;
/** 一覧が隠れたか */
const closed = (s: State): boolean => !s.list?.shown;

/** 色の字が青に寄っているか。青の値が赤の値より20を超えて大きい時に青とみなす */
const blueish = (color: string | null | undefined): boolean => {
  const [r = 0, , b = 0] = (color ?? "").match(/[\d.]+/gu)?.map(Number) ?? [];
  const scale = (color ?? "").startsWith("color(") ? 255 : 1;
  return b * scale > r * scale + 20;
};

/** 頁のURLの場所の名前を`place`に変える */
const openPlace = (page: Page, place: string): Promise<void> =>
  page.evaluate((to) => {
    location.hash = `#${to}`;
  }, place);

/** 幅1200pxで日本語の頁を開き、欄の位置、打った語の一覧、押した行の行き先、鍵の動き、印刷の形を順に読む */
const WIDE = await atLoad(
  "幅1200pxで説明の頁を開き、欄に語を打って一覧を読み、行を押して移った先と、鍵で動かした一覧と、印刷の形を読む",
  () =>
    openGuide(
      async (page) => {
        const step = inOrder();
        const over = await step("全体像の頁で欄を読む", () =>
          readUntil(
            () => searchState(page),
            (s) => !!s.box?.shown,
            WAIT,
          ),
        );
        const question = await step("問いの頁をURLで開き、欄を読む", async () => {
          await openPlace(page, "店はどの注文を受けるのか");
          return readUntil(
            () => searchState(page),
            (s) => s.sections.length === 1,
            WAIT,
          );
        });
        const glossary = await step("用語のタブを押し、欄を読む", async () => {
          await page
            .locator("header.pg-head nav.pg-head-tabs a", { hasText: "用語" })
            .first()
            .click({ timeout: ACTION_LIMIT_MS });
          return readUntil(
            () => searchState(page),
            (s) => s.tab === "用語",
            WAIT,
          );
        });
        const order = await step("欄に「注文」を打ち、一覧を読む", () =>
          typeAndRead(page, "注文", listed),
        );
        const short = await step("欄に「送り出し」を打ち、一覧を読む", () =>
          typeAndRead(page, "送り出し", listed),
        );
        const api = await step("欄に前後に空白を付けた小文字の「api」を打ち、一覧を読む", () =>
          typeAndRead(page, "  api ", listed),
        );
        const key = await step("欄に全角の「ｋｅｙ」を打ち、一覧を読む", () =>
          typeAndRead(page, "ｋｅｙ", listed),
        );
        const none = await step("欄に当たる物の無い語を打ち、一覧の所を読む", () =>
          typeAndRead(page, "存在しない語", (s) => !!s.list?.shown && s.list.text !== ""),
        );
        const pickedQuestion = await step(
          "欄に「代金」を打ち、届けるの問いの行を押して移った先を読む",
          async () => {
            await typeAndRead(page, "代金", listed);
            await page
              .locator('[role="option"]', { hasText: "代金を受け取った後" })
              .first()
              .click({ timeout: ACTION_LIMIT_MS });
            return readUntil(
              () => searchState(page),
              (s) => s.sections.length === 1 && closed(s),
              WAIT,
            );
          },
        );
        const pickedTerm = await step(
          "全体像へ戻り、欄に「支払」を打ち、用語の行を押して移った先を読む",
          async () => {
            await openPlace(page, "");
            await typeAndRead(page, "支払", listed);
            await page
              .locator('[role="option"]', { hasText: "注文の代金を受け取ること" })
              .first()
              .click({ timeout: ACTION_LIMIT_MS });
            return readUntil(
              () => searchState(page),
              (s) => s.card !== null && closed(s) && s.tab === "用語",
              WAIT,
            );
          },
        );
        const keys = await step(
          "欄に「注文」を打ち、↓↓↑とEnterで移り、Escと欄の外と欄を空にして一覧を閉じる",
          async () => {
            await openPlace(page, "");
            const typed = await typeAndRead(page, "注文", listed);
            const box = page.locator(`${BOX}:visible`).first();
            await box.press("ArrowDown", { timeout: ACTION_LIMIT_MS });
            const down1 = await searchState(page);
            await box.press("ArrowDown", { timeout: ACTION_LIMIT_MS });
            const down2 = await searchState(page);
            await box.press("ArrowUp", { timeout: ACTION_LIMIT_MS });
            const up = await searchState(page);
            await box.press("Enter", { timeout: ACTION_LIMIT_MS });
            const entered = await readUntil(
              () => searchState(page),
              (s) => s.sections.length === 1 && closed(s),
              WAIT,
            );
            await typeAndRead(page, "注文", listed);
            await box.press("Escape", { timeout: ACTION_LIMIT_MS });
            const escaped = await readUntil(() => searchState(page), closed, WAIT);
            await typeAndRead(page, "注文", listed);
            const size = page.viewportSize() ?? { width: 1200, height: 800 };
            await page.mouse.click(8, size.height - 8);
            const outside = await readUntil(() => searchState(page), closed, WAIT);
            await typeAndRead(page, "注文", listed);
            const emptied = await typeAndRead(page, "", closed);
            return {
              typed: typed.selected,
              down1: down1.selected,
              down2: down2.selected,
              up: up.selected,
              entered,
              escaped: closed(escaped),
              outside: closed(outside),
              emptied: closed(emptied),
            };
          },
        );
        const printed = await step(
          "欄に「注文」を打って一覧を出し、印刷の形にして欄と一覧と釦を読む",
          async () => {
            const screen = await typeAndRead(page, "注文", listed);
            await page.emulateMedia({ media: "print" });
            const paper = await searchState(page);
            await page.emulateMedia({ media: "screen" });
            return { screen, paper };
          },
        );
        return {
          over,
          question,
          glossary,
          order,
          short,
          api,
          key,
          none,
          pickedQuestion,
          pickedTerm,
          keys,
          printed,
        };
      },
      { width: 1200, height: 800 },
      writeGuide,
    ),
);

/** 幅390pxで日本語の頁を開き、虫眼鏡の釦を押して欄を開き、語を打った一覧を読む */
const PHONE = await atLoad(
  "幅390pxで説明の頁を開き、虫眼鏡の釦で欄を開いて語を打ち、一覧を読む",
  () =>
    openGuide(
      async (page) => {
        const step = inOrder();
        const folded = await step("頁を開いた時の欄と釦を読む", () =>
          readUntil(
            () => searchState(page),
            (s) => !!s.opener?.shown,
            WAIT,
          ),
        );
        const opened = await step("虫眼鏡の釦を押し、欄を読む", async () => {
          const opener = page.locator("header.pg-head button[aria-controls]:visible").first();
          await opener.click({ timeout: ACTION_LIMIT_MS });
          return readUntil(
            () => searchState(page),
            (s) => !!s.box?.shown,
            WAIT,
          );
        });
        const typed = await step("欄に「注文」を打ち、一覧を読む", () =>
          typeAndRead(page, "注文", listed),
        );
        return { folded, opened, typed };
      },
      { width: 390, height: 844 },
      writeGuide,
    ),
);

/** 英語の頁で当たる物の無い語を打ち、一覧の所を読む */
const ENGLISH = await atLoad("英語の説明の頁を開き、当たる物の無い語を打って一覧の所を読む", () =>
  openGuide(
    async (page) => {
      await readUntil(
        () => searchState(page),
        (s) => !!s.box?.shown,
        WAIT,
      );
      return typeAndRead(page, "zzz", (s) => !!s.list?.shown && s.list.text !== "");
    },
    { width: 1200, height: 800 },
    writeEnglish,
  ),
);

/** 話題が1つの頁を開き、左の目次の欄で問いを探して押す */
const ONE = await atLoad("話題が1つの説明の頁を開き、左の目次の欄に語を打って問いの行を押す", () =>
  openGuide(
    async (page) => {
      const step = inOrder();
      const shown = await step("頁を開いた時の欄と目次の行の位置を読む", async () => {
        const state = await readUntil(
          () => searchState(page),
          (s) => !!s.box?.shown,
          WAIT,
        );
        const firstRow = await page.evaluate(() => {
          const row = [...document.querySelectorAll<HTMLElement>("nav.pg-menu a.pg-menu-q")].find(
            (a) => a.checkVisibility(),
          );
          return row ? Math.round(row.getBoundingClientRect().top) : null;
        });
        return { state, firstRow };
      });
      const picked = await step(
        "欄に「鍵を持つ」を打ち、問いの行を押して移った先を読む",
        async () => {
          const typed = await typeAndRead(page, "鍵を持つ", listed);
          await page
            .locator('[role="option"]', { hasText: "誰が鍵を持つのか" })
            .first()
            .click({ timeout: ACTION_LIMIT_MS });
          const moved = await readUntil(
            () => searchState(page),
            (s) => s.hash === "#誰が鍵を持つのか" && closed(s),
            WAIT,
          );
          return { typed, moved };
        },
      );
      return { shown, picked };
    },
    { width: 1200, height: 800 },
    writeSingle,
  ),
);

describe("説明の頁の検索の欄 (#3897)", () => {
  it("search-box-in-head", async () => {
    const doc = await exported(writeGuide());
    const en = await exported(writeEnglish());
    if (!doc || !en) return;
    const box = doc.querySelector<HTMLInputElement>(`header.pg-head ${BOX}`);
    expect(box?.getAttribute("placeholder"), "日本語の頁のヘッダーの欄の淡い字").toBe(
      "問いと用語を探す",
    );
    expect(
      en.querySelector(`header.pg-head ${BOX}`)?.getAttribute("placeholder"),
      "英語の頁のヘッダーの欄の淡い字",
    ).toBe("Search questions and terms");
    const seen = WIDE.get();
    if (!seen) return;
    const states = {
      全体像: seen.over.get(),
      問い: seen.question.get(),
      用語: seen.glossary.get(),
    };
    for (const [name, s] of Object.entries(states)) {
      expect(s.box?.shown && s.box.inHead, `${name}の頁でヘッダーの欄が見える`).toBe(true);
      const box = s.box?.rect;
      const head = s.head;
      expect(
        box &&
          head &&
          head.right - box.right <= 48 &&
          box.top >= head.top &&
          box.bottom <= head.bottom,
        `${name}の頁の欄はヘッダーの右の端に在る (欄 ${JSON.stringify(box)}、ヘッダー ${JSON.stringify(head)})`,
      ).toBe(true);
    }
    expect(states.問い.box?.rect, "問いの頁の欄は全体像の頁と同じ所に在る").toEqual(
      states.全体像.box?.rect,
    );
    expect(states.用語.box?.rect, "用語のタブの欄は全体像の頁と同じ所に在る").toEqual(
      states.全体像.box?.rect,
    );
  });

  it("search-lists-questions-and-terms", () => {
    const seen = WIDE.get();
    if (!seen) return;
    const order = seen.order.get();
    expect(
      order.groups,
      "「注文」の一覧。問いは話題ごとに題と答え、用語は名前と説明を並べ、打った語の全ての所に印を付ける",
    ).toEqual([
      {
        head: "注文を受ける 2",
        rows: [
          {
            lines: [
              "店はどの注文を受けるのか",
              "在庫の在る品物だけの注文を受け、注文の番号を返す。",
            ],
            marks: ["注文", "注文", "注文"],
          },
          {
            lines: ["断った注文はどこに残るのか", "断った訳と共に受付の記録に残る。"],
            marks: ["注文"],
          },
        ],
      },
      {
        head: "届ける 1",
        rows: [
          {
            lines: ["代金を受け取った後、どう送り出すのか", "支払いが済んだ注文だけを倉庫へ回す。"],
            marks: ["注文"],
          },
        ],
      },
      {
        head: "用語 2",
        rows: [
          { lines: ["注文", "利用者が選んだ品物と届け先の組。"], marks: ["注文"] },
          { lines: ["支払い", "注文の代金を受け取ること。"], marks: ["注文"] },
        ],
      },
    ]);
    const list = order.list?.rect;
    const box = order.box?.rect;
    expect(
      list && box && list.top >= box.bottom && list.top - box.bottom <= 16,
      `一覧は欄のすぐ下に出る (欄 ${JSON.stringify(box)}、一覧 ${JSON.stringify(list)})`,
    ).toBe(true);
    expect(
      seen.short.get().groups.map((g) => [g.head, g.rows.map((r) => r.lines[0])]),
      "目次の短い名前にだけ在る語でも問いに当たる",
    ).toEqual([["届ける 1", ["代金を受け取った後、どう送り出すのか"]]]);
  });

  it("search-ignores-case-and-width", () => {
    const seen = WIDE.get();
    if (!seen) return;
    expect(
      seen.api.get().groups.map((g) => [g.head, g.rows.map((r) => r.marks)]),
      "前後に空白を付けた小文字の「api」が、全角の「ＡＰＩ」の題と「API」の用語に当たり、元の字に印を付ける",
    ).toEqual([
      ["届ける 1", [["ＡＰＩ"]]],
      ["用語 1", [["API"]]],
    ]);
    expect(
      seen.key.get().groups.map((g) => [g.head, g.rows.map((r) => r.marks)]),
      "全角の「ｋｅｙ」が説明の「Key」に当たる",
    ).toEqual([["用語 1", [["Key"]]]]);
  });

  it("search-question-opens-section", () => {
    const seen = WIDE.get();
    if (!seen) return;
    const s = seen.pickedQuestion.get();
    expect(
      { tab: s.tab, sections: s.sections, hash: s.hash, list: closed(s) },
      "届けるの問いの行を押した後の、印の付いたタブと見えている節とURLと一覧",
    ).toEqual({
      tab: "届ける",
      sections: ["代金を受け取った後、どう送り出すのか"],
      hash: "#代金を受け取った後どう送り出すのか",
      list: true,
    });
  });

  it("search-term-opens-glossary-card", () => {
    const seen = WIDE.get();
    if (!seen) return;
    const s = seen.pickedTerm.get();
    expect(
      { tab: s.tab, card: s.card?.name, inView: s.card?.inView, list: closed(s) },
      "用語の行を押した後の、印の付いたタブと移った札と一覧",
    ).toEqual({ tab: "用語", card: "支払い", inView: true, list: true });
    expect(blueish(s.card?.line), `移った札の枠の線は青い (${s.card?.line})`).toBe(true);
    expect(blueish(s.card?.other), `ほかの札の枠の線は青くない (${s.card?.other})`).toBe(false);
  });

  it("search-empty-says-none", () => {
    const seen = WIDE.get();
    const en = ENGLISH.get();
    if (!seen || !en) return;
    const none = seen.none.get();
    expect(
      { text: none.list?.text, options: none.options },
      "日本語の頁で当たる物が無い時の一覧の所",
    ).toEqual({ text: "「存在しない語」を含む問いと用語はありません", options: 0 });
    expect(
      { text: en.list?.text, options: en.options },
      "英語の頁で当たる物が無い時の一覧の所",
    ).toEqual({ text: 'No questions or terms contain "zzz"', options: 0 });
  });

  it("search-keys-move-and-close", () => {
    const seen = WIDE.get();
    if (!seen) return;
    const k = seen.keys.get();
    expect([k.typed, k.down1, k.down2, k.up], "打った時と↓↓↑を押した時の選んだ行の番号").toEqual([
      0, 1, 2, 1,
    ]);
    expect(
      { sections: k.entered.sections, hash: k.entered.hash, list: closed(k.entered) },
      "Enterで選んだ2つ目の行の問いへ移る",
    ).toEqual({
      sections: ["断った注文はどこに残るのか"],
      hash: "#断った注文はどこに残るのか",
      list: true,
    });
    expect(
      { escape: k.escaped, outside: k.outside, emptied: k.emptied },
      "Escと欄の外を押した時と欄を空にした時に一覧を閉じる",
    ).toEqual({ escape: true, outside: true, emptied: true });
  });

  it("search-phone-icon-opens-box", () => {
    const seen = PHONE.get();
    if (!seen) return;
    const folded = seen.folded.get();
    expect(folded.box?.shown, "幅390pxでは欄を隠す").toBe(false);
    const opener = folded.opener?.rect;
    const title = folded.title;
    expect(folded.opener?.label, "虫眼鏡の釦の名前").toBe("問いと用語を探す");
    expect(
      opener &&
        title &&
        opener.left >= title.right &&
        opener.top < title.bottom &&
        opener.bottom > title.top,
      `虫眼鏡の釦は題の右に在る (釦 ${JSON.stringify(opener)}、題 ${JSON.stringify(title)})`,
    ).toBe(true);
    const opened = seen.opened.get();
    expect(
      { shown: opened.box?.shown, focused: opened.box?.focused },
      "釦を押すと欄が開き、字を打てる状態になる",
    ).toEqual({ shown: true, focused: true });
    expect(
      (opened.box?.rect?.top ?? 0) >= (opened.title?.bottom ?? Number.POSITIVE_INFINITY),
      "開いた欄は題の下に在る",
    ).toBe(true);
    const reopener = opened.opener?.rect;
    expect(
      !!opened.opener?.shown &&
        !!reopener &&
        !!opened.title &&
        reopener.left >= opened.title.right &&
        reopener.top < opened.title.bottom &&
        reopener.bottom > opened.title.top,
      `欄を開いた後も虫眼鏡の釦は題の右に在る (釦 ${JSON.stringify(reopener)}、題 ${JSON.stringify(opened.title)})`,
    ).toBe(true);
    const typed = seen.typed.get();
    const list = typed.list?.rect;
    expect(
      list && list.left >= 0 && list.right <= typed.width,
      `一覧は頁の幅に収まる (${JSON.stringify(list)})`,
    ).toBe(true);
    expect(typed.overflow, "頁は横にはみ出さない").toBe(0);
  });

  it("search-single-topic-in-menu", () => {
    const seen = ONE.get();
    if (!seen) return;
    const { state, firstRow } = seen.shown.get();
    expect(
      { head: state.head, inMenu: state.box?.inMenu },
      "ヘッダーを持たず、欄は左の目次に在る",
    ).toEqual({ head: null, inMenu: true });
    expect(
      (state.box?.rect?.bottom ?? Number.POSITIVE_INFINITY) <= (firstRow ?? 0),
      "欄は目次の問いの行より上に在る",
    ).toBe(true);
    const { typed, moved } = seen.picked.get();
    expect(
      typed.groups.map((g) => [g.head, g.rows.map((r) => r.lines[0])]),
      "「鍵を持つ」の一覧",
    ).toEqual([["鍵を替える 1", ["誰が鍵を持つのか"]]]);
    expect(
      moved.sectionTop !== null && moved.sectionTop >= 0 && moved.sectionTop <= 200,
      `押した問いの節が画面の上に来る (${moved.sectionTop})`,
    ).toBe(true);
  });

  it("search-print-hides-box", () => {
    const seen = WIDE.get();
    if (!seen) return;
    const { screen, paper } = seen.printed.get();
    expect(
      { box: screen.box?.shown, list: screen.list?.shown },
      "画面では欄と一覧が見える",
    ).toEqual({ box: true, list: true });
    expect(
      { box: !!paper.box?.shown, list: !!paper.list?.shown, opener: !!paper.opener?.shown },
      "印刷の形では欄と一覧と虫眼鏡の釦を出さない",
    ).toEqual({ box: false, list: false, opener: false });
  });

  it("search-docs", () => {
    const read = (file: string): string => readFileSync(join(process.cwd(), file), "utf8");
    const section = (text: string, heading: string): string =>
      text.split(heading)[1]?.split(/\n### /u)[0] ?? "";
    expect(
      section(read("packages/dragon/README.md"), "### Guide page"),
      "READMEの説明の頁の節が検索の欄を書く",
    ).toMatch(/search box/u);
    expect(
      section(read("packages/dragon/README.ja.md"), "### 説明の頁"),
      "日本語のREADMEの説明の頁の節が検索の欄を書く",
    ).toMatch(/検索の欄/u);
    expect(
      read("plugins/dragon/skills/dragon/references/page.md"),
      "スキルの`page`の手引きが検索の欄を書く",
    ).toMatch(/search box/u);
    const musubi = JSON.parse(read("plugins/dragon/skills/dragon/musubi.json"));
    const [major = 0, minor = 0] = (musubi.provides.page?.version ?? "0.0").split(".").map(Number);
    expect(major > 1 || (major === 1 && minor >= 1), `スキルの\`page\`の版 (${musubi.provides.page?.version}) が1.1.0より前`).toBe(true);
  });
});
