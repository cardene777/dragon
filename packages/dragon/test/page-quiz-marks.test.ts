/**
 * 説明の頁の確かめた問いの印 (#3898)。
 *
 * 説明の頁 (`layout: guide`) の確かめる問いは左に丸を持ち、答えを開くと緑の丸に白いチェックが入る。答えを閉じても印は残る。
 * 確かめる問いを持つ節は、話題の頭の問いの一覧の行と左の目次の問いの行の右の端に丸を持ち、節の全ての確かめる問いを開くとチェックが入る。
 * 印は頁の置き場ごとに端末の頁の記録 (`localStorage`) に残し、開き直しても残る。印が付くと一覧の下の右に印を消す釦が出る。
 * 頁の記録を読み書きできない端末でも頁はそのまま読め、印刷の形では印と釦を出さない。
 *
 * 書き出したHTMLの形は頁を開かずに確かめ、押す動きと描いた印は`http://localhost/`に置いた Chromium で測る。
 * 頁を開いて押して待つ仕事は file を読み込む段 (`at-load.ts`) で済ませ、件は記した値を確かめる (#3816)。
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { JSDOM } from "jsdom";
import type { Page } from "playwright-core";
import { describe, expect, it } from "vitest";

import { atLoad } from "./at-load";
import { SITE, withSite } from "./cdn-page-support";
import { expectWritten, exportPageTool, tempDir, writeFiles } from "./page-export-support";
import { ACTION_LIMIT_MS, inOrder, PAGE_LIMIT_MS, readUntil, within } from "./page-wait";

/** 頁が書き換わるのを待つ長さ */
const WAIT = 4_000;

/** 確かめる問いの塊 */
const quiz = (question: string, answer: string): string =>
  `<details>\n<summary>${question}</summary>\n\n${answer}\n\n</details>`;

/** 話題が2つの説明の頁。1つ目の話題の1つ目の節は確かめる問いを2つ持ち、2つ目の節は持たない。2つ目の話題の節は1つ持つ */
const GUIDE = (title: string): string => `---
layout: guide
---

# ${title}

## 止める仕組み

### 何を止めるのか

> 規則に合わない送金を止める。

${quiz("35を送る依頼はどうなるか", "止まる。")}

${quiz("期限を過ぎた依頼はどうなるか", "止まる。")}

### どの順で確かめるのか

> 宛先、額、期限の順に照らす。

## 記録

### どこに残すのか

> 確かめた結果を記録に残す。

${quiz("止めた送金はどこに残るか", "記録に残る。")}
`;

/** 英語の説明の頁。仮名と漢字を持たないmdは英語の頁になる */
const GUIDE_EN = `---
layout: guide
---

# Stopping transfers

## How it stops

### What is stopped?

> Transfers that break a rule.

${quiz("What happens to a transfer of 35?", "It stops.")}

## Records

### Where is it kept?

> In the record.
`;

/** mdを一時のdirに書いて書き出し、HTMLの字を返す。書き出せない時は判定の文で落とし、undefined を返す */
async function exportGuide(md: string): Promise<string | undefined> {
  const exportPage = await exportPageTool();
  if (!exportPage) return undefined;
  const root = tempDir("quiz-marks");
  writeFiles(root, { "notes.md": md });
  const path = expectWritten(await exportPage(join(root, "notes.md")));
  return path === "" ? undefined : readFileSync(path, "utf8");
}

/** 頁の場所の名前を`place`に変える */
const openPlace = (page: Page, place: string): Promise<void> =>
  page.evaluate((to) => {
    location.hash = `#${to}`;
  }, place);

/**
 * 確かめる問いと一覧と目次の印。印は要素の`::before`か`::after`に描く丸で読み、緑の地にチェックの絵を持つ丸は`check`、地の無い丸は`ring`、丸を描かない時は`none`。
 * 問いは見えている確かめる問いの行 (`.pg-q`) の`::before`、一覧の行は見えている`.pg-map-list a`の`::after`、目次の行は見えている`nav.pg-menu a.pg-menu-q`の`::after`を節の場所の名前ごとに読む
 */
const marks = (page: Page) =>
  page.evaluate(() => {
    const sq = (text: string | null | undefined): string =>
      (text ?? "").replace(/\s+/gu, " ").trim();
    const vis = (el: Element | null): boolean =>
      el !== null && (el as HTMLElement).checkVisibility();
    const dec = (href: string): string => {
      try {
        return decodeURIComponent(href);
      } catch {
        return href;
      }
    };
    const state = (el: Element, pseudo: string): string => {
      const s = getComputedStyle(el, pseudo);
      if (s.content === "none" || s.content === "normal" || s.display === "none") return "none";
      const [r = 0, g = 0, b = 0, a = 1] = (s.backgroundColor.match(/[\d.]+/gu) ?? []).map(Number);
      const green =
        a > 0 && g > r + 0.08 * (s.backgroundColor.startsWith("color(") ? 1 : 255) && g > b;
      return green && s.backgroundImage.includes("url(") ? "check" : "ring";
    };
    const rows = (selector: string) =>
      Object.fromEntries(
        [...document.querySelectorAll(selector)]
          .filter(vis)
          .map((a) => [dec(a.getAttribute("href") ?? "").slice(1), state(a, "::after")]),
      );
    const clear =
      [...document.querySelectorAll<HTMLButtonElement>("button")].find(
        (b) => sq(b.textContent) === "印を消す" || sq(b.textContent) === "Clear marks",
      ) ?? null;
    const list = [...document.querySelectorAll(".pg-map-list")].find(vis) ?? null;
    const box = (el: Element | null) => {
      if (!el || !vis(el)) return null;
      const r = el.getBoundingClientRect();
      return {
        left: Math.round(r.left),
        right: Math.round(r.right),
        top: Math.round(r.top),
        bottom: Math.round(r.bottom),
      };
    };
    return {
      questions: [...document.querySelectorAll(".pg-q")].filter(vis).map((q) => ({
        text: sq(q.querySelector(".pg-q-text")?.textContent),
        mark: state(q, "::before"),
        open: !(q.querySelector<HTMLElement>(".pg-q-a")?.hidden ?? true),
      })),
      map: rows(".pg-map-list a"),
      menu: rows("nav.pg-menu a.pg-menu-q"),
      clear: clear ? { shown: vis(clear), text: sq(clear.textContent), box: box(clear) } : null,
      list: box(list),
    };
  });

type Marks = Awaited<ReturnType<typeof marks>>;

/** 見えている確かめる問いのうち`text`の問いの答えの釦を押す */
const press = (page: Page, text: string): Promise<void> =>
  page
    .locator(".pg-q:visible", { hasText: text })
    .first()
    .locator(".pg-q-btn")
    .click({ timeout: ACTION_LIMIT_MS });

/** 問いの節を開き、確かめる問いが見えるまで待って読む */
async function openQuestion(page: Page, place: string): Promise<Marks> {
  await openPlace(page, place);
  return readUntil(
    () => marks(page),
    (m) => m.questions.length > 0,
    WAIT,
  );
}

/** 話題の頭の地図を開き、一覧が見えるまで待って読む */
async function openMap(page: Page, place: string): Promise<Marks> {
  await openPlace(page, place);
  return readUntil(
    () => marks(page),
    (m) => Object.keys(m.map).length > 0,
    WAIT,
  );
}

/** 頁を開き直し、`place`を開いて待って読む */
async function reopen(page: Page, place: string, map = false): Promise<Marks> {
  await page.goto(`${SITE}notes.html#${encodeURIComponent(place)}`, { timeout: ACTION_LIMIT_MS });
  await page.reload({ timeout: ACTION_LIMIT_MS });
  return readUntil(
    () => marks(page),
    (m) => (map ? Object.keys(m.map).length > 0 : m.questions.length > 0),
    WAIT,
  );
}

const HTML = await atLoad("説明の頁を書き出す", () => exportGuide(GUIDE("送金の止め方")));

/** `files`を置いた所で`path`の頁を開いて`run`を回す */
const onSite = <T>(files: Record<string, string>, path: string, run: (page: Page) => Promise<T>) =>
  within(withSite(files, path, run, { width: 1200, height: 800 }), PAGE_LIMIT_MS, "説明の頁の仕事");

/** 確かめる問いを順に開き、問いと一覧と目次の印、開き直した後、消す釦、印刷の形を読む */
const FLOW = await atLoad(
  "説明の頁で確かめる問いを順に開き、印と開き直した後と消す釦と印刷の形を読む",
  async () => {
    const html = HTML.get();
    if (!html) return undefined;
    return onSite({ "notes.html": html }, "notes.html", async (page) => {
      const step = inOrder();
      const mapBefore = await step("話題の頭の地図を開き、一覧と目次と消す釦を読む", () =>
        openMap(page, "止める仕組み"),
      );
      const first = await step("1つ目の節を開き、確かめる問いの印を読む", () =>
        openQuestion(page, "何を止めるのか"),
      );
      const opened = await step("1つ目の確かめる問いの答えを開き、印を読む", async () => {
        await press(page, "35を送る依頼はどうなるか");
        return readUntil(
          () => marks(page),
          (m) => m.questions[0]?.open === true,
          WAIT,
        );
      });
      const closed = await step("1つ目の確かめる問いの答えを閉じ、印を読む", async () => {
        await press(page, "35を送る依頼はどうなるか");
        return readUntil(
          () => marks(page),
          (m) => m.questions[0]?.open === false,
          WAIT,
        );
      });
      const partial = await step(
        "話題の頭の地図を開き、一部だけ開いた節の一覧と目次と消す釦を読む",
        () => openMap(page, "止める仕組み"),
      );
      const all = await step(
        "1つ目の節へ戻り、2つ目の確かめる問いの答えを開いてから地図を読む",
        async () => {
          await openQuestion(page, "何を止めるのか");
          await press(page, "期限を過ぎた依頼はどうなるか");
          await readUntil(
            () => marks(page),
            (m) => m.questions[1]?.open === true,
            WAIT,
          );
          return openMap(page, "止める仕組み");
        },
      );
      const menuAll = await step("1つ目の節を開き、目次の印を読む", () =>
        openQuestion(page, "何を止めるのか"),
      );
      const reloaded = await step("頁を開き直し、1つ目の節の問いの印と答えを読む", () =>
        reopen(page, "何を止めるのか"),
      );
      const reloadedMap = await step("開き直した頁で話題の頭の地図を読む", () =>
        openMap(page, "止める仕組み"),
      );
      const printed = await step("印刷の形にし、問いと一覧と消す釦を読む", async () => {
        await page.emulateMedia({ media: "print" });
        const paper = await marks(page);
        await page.emulateMedia({ media: "screen" });
        return paper;
      });
      const cleared = await step("話題の頭の地図の印を消す釦を押し、印と釦を読む", async () => {
        await openMap(page, "止める仕組み");
        await page.getByRole("button", { name: "印を消す" }).click({ timeout: ACTION_LIMIT_MS });
        return readUntil(
          () => marks(page),
          (m) => m.map["何を止めるのか"] !== "check",
          WAIT,
        );
      });
      const clearedQuestion = await step("消した後に1つ目の節を開き、問いの印を読む", () =>
        openQuestion(page, "何を止めるのか"),
      );
      const clearedReload = await step("消した後に頁を開き直し、1つ目の節の問いの印を読む", () =>
        reopen(page, "何を止めるのか"),
      );
      return {
        mapBefore,
        first,
        opened,
        closed,
        partial,
        all,
        menuAll,
        reloaded,
        reloadedMap,
        printed,
        cleared,
        clearedQuestion,
        clearedReload,
      };
    });
  },
);

/** 置き場の違う2つの頁で、片方の確かめる問いを開いてからもう片方を読む */
const APART = await atLoad(
  "置き場の違う2つの説明の頁で、片方だけ確かめる問いを開いてもう片方の印を読む",
  async () => {
    const html = HTML.get();
    if (!html) return undefined;
    return onSite({ "a.html": html, "b.html": html }, "a.html", async (page) => {
      await page.goto(`${SITE}a.html#${encodeURIComponent("何を止めるのか")}`, {
        timeout: ACTION_LIMIT_MS,
      });
      await readUntil(
        () => marks(page),
        (m) => m.questions.length > 0,
        WAIT,
      );
      await press(page, "35を送る依頼はどうなるか");
      const a = await readUntil(
        () => marks(page),
        (m) => m.questions[0]?.open === true,
        WAIT,
      );
      await page.goto(`${SITE}b.html#${encodeURIComponent("何を止めるのか")}`, {
        timeout: ACTION_LIMIT_MS,
      });
      const b = await readUntil(
        () => marks(page),
        (m) => m.questions.length > 0,
        WAIT,
      );
      return { a, b };
    });
  },
);

/** 頁の記録を読み書きできない形で頁を開き直し、確かめる問いの答えを開く */
const NO_STORAGE = await atLoad(
  "頁の記録を読み書きできない形で説明の頁を開き、確かめる問いの答えを開く",
  async () => {
    const html = HTML.get();
    if (!html) return undefined;
    return onSite({ "notes.html": html }, "notes.html", async (page) => {
      const errors: string[] = [];
      page.on("pageerror", (error) => errors.push(error.message));
      await page.addInitScript(() => {
        Object.defineProperty(window, "localStorage", {
          configurable: true,
          get() {
            throw new DOMException("blocked", "SecurityError");
          },
        });
      });
      await page.goto(`${SITE}notes.html#${encodeURIComponent("何を止めるのか")}`, {
        timeout: ACTION_LIMIT_MS,
      });
      await page.reload({ timeout: ACTION_LIMIT_MS });
      await readUntil(
        () => marks(page),
        (m) => m.questions.length > 0,
        WAIT,
      );
      await press(page, "35を送る依頼はどうなるか");
      const opened = await readUntil(
        () => marks(page),
        (m) => m.questions[0]?.open === true,
        WAIT,
      );
      return { opened, errors };
    });
  },
);

describe("説明の頁の確かめた問いの印 (#3898)", () => {
  it("quiz-mark-on-open", () => {
    const seen = FLOW.get();
    if (!seen) return;
    expect(
      seen.first.get().questions.map((q) => q.mark),
      "開く前の確かめる問いの印",
    ).toEqual(["ring", "ring"]);
    expect(
      seen.opened.get().questions.map((q) => q.mark),
      "1つ目の答えを開いた後の印",
    ).toEqual(["check", "ring"]);
    const closed = seen.closed.get().questions;
    expect(
      { marks: closed.map((q) => q.mark), open: closed[0]?.open },
      "1つ目の答えを閉じた後も印は残る",
    ).toEqual({ marks: ["check", "ring"], open: false });
  });

  it("quiz-mark-section-rows", () => {
    const seen = FLOW.get();
    if (!seen) return;
    const before = seen.mapBefore.get();
    expect(
      { map: before.map, menu: before.menu },
      "開く前の一覧と目次。確かめる問いを持たない節は丸を持たない",
    ).toEqual({
      map: { 何を止めるのか: "ring", どの順で確かめるのか: "none" },
      menu: { 何を止めるのか: "ring", どの順で確かめるのか: "none" },
    });
    const partial = seen.partial.get();
    expect({ map: partial.map, menu: partial.menu }, "1つだけ開いた節の一覧と目次").toEqual({
      map: { 何を止めるのか: "ring", どの順で確かめるのか: "none" },
      menu: { 何を止めるのか: "ring", どの順で確かめるのか: "none" },
    });
    const all = seen.all.get();
    expect({ map: all.map, menu: all.menu }, "全て開いた節の一覧と目次").toEqual({
      map: { 何を止めるのか: "check", どの順で確かめるのか: "none" },
      menu: { 何を止めるのか: "check", どの順で確かめるのか: "none" },
    });
    expect(seen.menuAll.get().menu["何を止めるのか"], "問いの頁を開いている間の目次の印").toBe(
      "check",
    );
  });

  it("quiz-mark-survives-reload", () => {
    const seen = FLOW.get();
    if (!seen) return;
    const reloaded = seen.reloaded.get().questions;
    expect(
      reloaded.map((q) => ({ mark: q.mark, open: q.open })),
      "開き直した後の問いの印と答え",
    ).toEqual([
      { mark: "check", open: false },
      { mark: "check", open: false },
    ]);
    const map = seen.reloadedMap.get();
    expect(
      { map: map.map["何を止めるのか"], menu: map.menu["何を止めるのか"] },
      "開き直した後の一覧と目次の印",
    ).toEqual({ map: "check", menu: "check" });
  });

  it("quiz-mark-clear-button", async () => {
    const seen = FLOW.get();
    if (!seen) return;
    expect(seen.mapBefore.get().clear?.shown ?? false, "印が無い時は消す釦を出さない").toBe(false);
    const partial = seen.partial.get();
    const button = partial.clear?.box;
    const list = partial.list;
    expect(partial.clear?.shown, "印が付くと消す釦が出る").toBe(true);
    expect(
      button && list && button.top >= list.bottom && Math.abs(button.right - list.right) <= 2,
      `消す釦は一覧の下の右に在る (釦 ${JSON.stringify(button)}、一覧 ${JSON.stringify(list)})`,
    ).toBe(true);
    const cleared = seen.cleared.get();
    expect(
      {
        map: cleared.map["何を止めるのか"],
        menu: cleared.menu["何を止めるのか"],
        clear: cleared.clear?.shown ?? false,
      },
      "押した後の一覧と目次の印と釦",
    ).toEqual({
      map: "ring",
      menu: "ring",
      clear: false,
    });
    expect(
      seen.clearedQuestion.get().questions.map((q) => q.mark),
      "押した後の問いの印",
    ).toEqual(["ring", "ring"]);
    expect(
      seen.clearedReload.get().questions.map((q) => q.mark),
      "押した後に開き直した問いの印",
    ).toEqual(["ring", "ring"]);
    const en = await exportGuide(GUIDE_EN);
    if (!en) return;
    const doc = new JSDOM(en).window.document;
    expect(
      [...doc.querySelectorAll(".pg-map button")].map((b) => (b.textContent ?? "").trim()),
      "英語の頁の消す釦の字",
    ).toContain("Clear marks");
  });

  it("quiz-mark-pages-kept-apart", () => {
    const seen = APART.get();
    if (!seen) return;
    expect(
      seen.a.questions.map((q) => q.mark),
      "開いた頁の印",
    ).toEqual(["check", "ring"]);
    expect(
      seen.b.questions.map((q) => q.mark),
      "置き場の違う頁の印",
    ).toEqual(["ring", "ring"]);
  });

  it("quiz-mark-without-storage", () => {
    const seen = NO_STORAGE.get();
    if (!seen) return;
    expect(seen.errors, "頁の記録を読めない時の頁の誤り").toEqual([]);
    expect(
      seen.opened.questions.map((q) => ({ mark: q.mark, open: q.open })),
      "答えを開いた後の印と答え",
    ).toEqual([
      { mark: "check", open: true },
      { mark: "ring", open: false },
    ]);
  });

  it("quiz-mark-print-hidden", () => {
    const seen = FLOW.get();
    if (!seen) return;
    expect(seen.reloadedMap.get().clear?.shown, "画面では印が付いた後に消す釦が見える").toBe(true);
    const paper = seen.printed.get();
    expect(
      {
        questions: [...new Set(paper.questions.map((q) => q.mark))],
        map: [...new Set(Object.values(paper.map))],
        clear: paper.clear?.shown ?? false,
      },
      "印刷の形の問いと一覧の丸と消す釦",
    ).toEqual({ questions: ["none"], map: paper.list ? ["none"] : [], clear: false });
  });

  it("quiz-mark-docs", () => {
    const read = (file: string): string => readFileSync(join(process.cwd(), file), "utf8");
    const section = (text: string, heading: string): string =>
      text.split(heading)[1]?.split(/\n### /u)[0] ?? "";
    expect(
      section(read("packages/dragon/README.md"), "### Guide page"),
      "READMEの説明の頁の節が印を消す釦を書く",
    ).toMatch(/Clear marks/u);
    expect(
      section(read("packages/dragon/README.ja.md"), "### 説明の頁"),
      "日本語のREADMEの説明の頁の節が印を消す釦を書く",
    ).toMatch(/印を消す/u);
    expect(
      read("plugins/dragon/skills/dragon/references/page.md"),
      "スキルの`page`の手引きが印を消す釦を書く",
    ).toMatch(/Clear marks/u);
    const musubi = JSON.parse(read("plugins/dragon/skills/dragon/musubi.json"));
    // 後の課題が手引きの版を上げても落ちないよう、この課題で上げた1.2.0以上と見る (#3899)
    const [major = 0, minor = 0] = String(musubi.provides.page?.version ?? "0.0.0").split(".").map(Number);
    expect(major > 1 || (major === 1 && minor >= 2), `スキルの\`page\`の版 (${musubi.provides.page?.version}) が1.2.0より前`).toBe(true);
  });
});
