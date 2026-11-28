/**
 * 日本語と英語のmdを1組で書き出した説明の頁 (#3899)。
 *
 * `dragon export guide.md guide.en.md`は先に渡したfileの名前の頁を1枚だけ書き、2つの言葉の文と図を持つ。
 * ヘッダーの探す欄の右に地球の印と今の言葉の釦が在り、押すと2つの言葉の一覧が開く。選ぶと、開いていた話題と節と見出しのまま言葉が替わる。
 * 初めはブラウザの言葉で開き、切り替えた言葉を覚える。節を指すlinkはその節の言葉で開く。確かめた印は2つの言葉で同じにする。
 * 2つのfileで話題、節、`####`の見出し、用語、確かめる問いの数が違う時は、違う所を名指して書き出しを断る。
 *
 * 書き出しの形は頁を開かずに確かめ、押す動きと描いた形は`http://localhost/`に置いた Chromium で測る。
 * 頁を開いて押して待つ仕事は file を読み込む段 (`at-load.ts`) で済ませ、件は記した値を確かめる (#3816)。
 */
import { readdirSync, readFileSync } from "node:fs";
import { basename, join } from "node:path";
import type { Page } from "playwright-core";
import { describe, expect, it } from "vitest";

import { atLoad } from "./at-load";
import { SITE, withSite } from "./cdn-page-support";
import { runCli } from "./export-support";
import { exportPageTool, type PageExport, tempDir, writeFiles } from "./page-export-support";
import { ACTION_LIMIT_MS, inOrder, PAGE_LIMIT_MS, readUntil, within } from "./page-wait";

/** 頁が書き換わるのを待つ長さ */
const WAIT = 4_000;

/** 2つのfileを渡す Nodeの入口の`exportPage` */
type PairExport = (
  files: string | readonly string[],
  options?: { outDir?: string; lang?: "ja" | "en" },
) => Promise<PageExport>;

/** 確かめる問いの塊 */
const quiz = (question: string, answer: string): string =>
  `<details>\n<summary>${question}</summary>\n\n${answer}\n\n</details>`;

/** 段落を`n`個並べる。見出しを頁の上へ送れるだけの高さを作る */
const filler = (line: string, n: number): string => Array.from({ length: n }, () => line).join("\n\n");

/** 問いの節の図 */
const figure = (title: string, a: string, b: string, label: string): string =>
  ["```dragon", `sequence ${title}`, "", `box a as ${a}`, `box b as ${b}`, "", "step 1", `  a -> b: ${label}`, "```"].join(
    "\n",
  );

/** 日本語の説明の頁。話題が2つと用語の話題。1つ目の節は`####`の見出しを2つと確かめる問いを2つ、2つ目の節は見出しを持たず図を2つ持つ */
const GUIDE_JA = `---
layout: guide
---

# 送金の止め方

![用語](glossary.md)

## 止める仕組み

### 何を止めるのか

> 規則に合わない[送金](glossary.md#送金)を止める。

#### 宛先を照らす

宛先が許した一覧に在るかを照らす。

${figure("止める流れ", "利用者", "受付", "送金")}

${filler("宛先の一覧は毎朝に読み直し、一覧に無い宛先への送金は受付で止める。", 6)}

#### 額を照らす

額が上限を超えないかを照らす。

${filler("上限は宛先ごとに決まり、超えた送金は記録に残して止める。", 10)}

${quiz("35を送る依頼はどうなるか", "止まる。")}

${quiz("期限を過ぎた依頼はどうなるか", "止まる。")}

### どの順で確かめるのか

> [宛先](glossary.md#宛先)、額、期限の順に照らす。

${figure("照らす順", "受付", "照合", "宛先")}

${filler("順を替えると、止めた訳が記録の上で読めなくなる。", 10)}

${figure("止めた後", "照合", "記録", "止めた訳")}

${filler("止めた送金は訳と共に記録に残る。", 10)}

## 記録

### どこに残すのか

> 確かめた結果を記録に残す。

${quiz("止めた送金はどこに残るか", "記録に残る。")}
`;

/** 英語の説明の頁。日本語の頁と同じ数の話題と節と見出しと用語と確かめる問いを持つ */
const GUIDE_EN = `---
layout: guide
---

# Stopping transfers

![Terms](glossary.en.md)

## How it stops

### What is stopped?

> A [transfer](glossary.en.md#transfer) that breaks a rule.

#### Check the payee

Check that the payee is on the allowed list.

${figure("How it stops", "User", "Desk", "transfer")}

${filler("The payee list is read again every morning, and a transfer to a payee outside it stops at the desk.", 6)}

#### Check the amount

Check that the amount stays under the limit.

${filler("Each payee has its own limit, and a transfer over it is kept in the record and stopped.", 10)}

${quiz("What happens to a transfer of 35?", "It stops.")}

${quiz("What happens to a late request?", "It stops.")}

### In what order is it checked?

> The [payee](glossary.en.md#payee), the amount, then the deadline.

${figure("Order of checks", "Desk", "Match", "payee")}

${filler("Changing the order makes the reason for a stop unreadable in the record.", 10)}

${figure("After a stop", "Match", "Record", "reason")}

${filler("A stopped transfer stays in the record with its reason.", 10)}

## Records

### Where is it kept?

> The result of each check is kept in the record.

${quiz("Where does a stopped transfer go?", "Into the record.")}
`;

const GLOSSARY_JA = "### 送金\n\n口座から口座へお金を移すこと。\n\n### 宛先\n\nお金を受け取る口座。\n";
const GLOSSARY_EN = "### transfer\n\nMoving money from one account to another.\n\n### payee\n\nThe account that receives the money.\n";

/** 話題が1つで用語の無い頁。ヘッダーを持たない */
const ONE_JA = "---\nlayout: guide\n---\n\n# 一つの話題\n\n## 止める\n\n### 何を止めるのか\n\n> 送金を止める。\n";
const ONE_EN = "---\nlayout: guide\n---\n\n# One topic\n\n## Stop\n\n### What is stopped?\n\n> A transfer.\n";

/** `text`の中で`head`で始まる最初の行の番号 (1から) */
const lineOf = (text: string, head: string): number => text.split("\n").findIndex((line) => line.startsWith(head)) + 1;

/** 1組のfileを一時のdirに書き、2つのmdの path と dir を返す */
function writePair(files: Readonly<Record<string, string>>, name = "pair"): { dir: string; ja: string; en: string } {
  const dir = tempDir(name);
  writeFiles(dir, files);
  return { dir, ja: join(dir, "guide.md"), en: join(dir, "guide.en.md") };
}

const PAIR = { "guide.md": GUIDE_JA, "guide.en.md": GUIDE_EN, "glossary.md": GLOSSARY_JA, "glossary.en.md": GLOSSARY_EN };

/** Nodeの入口で1組を書き出す */
async function exportPair(files: readonly string[], outDir?: string): Promise<PageExport | undefined> {
  const tool = (await exportPageTool()) as unknown as PairExport | undefined;
  if (!tool) return undefined;
  return tool(files, outDir === undefined ? {} : { outDir });
}

/** dir の中の`.html`の名前 */
const pagesIn = (dir: string): string[] => readdirSync(dir).filter((name) => name.endsWith(".html")).sort();

/** 1組を書き出してHTMLの字を返す */
async function pairHtml(files: Readonly<Record<string, string>>, name: string): Promise<string | undefined> {
  const { ja, en } = writePair(files, name);
  const result = await exportPair([ja, en]);
  expect(result?.ok, `1組を書き出せない: ${JSON.stringify(result)}`).toBe(true);
  return result?.ok ? readFileSync(result.path, "utf8") : undefined;
}

/**
 * 頁の今の形。言葉、`#`の後ろ、話題のタブ、見えている問いの節の題、目次が示す行、切り替えの釦と一覧、確かめる問いの印、本文の字を読む。
 * 切り替えの釦は、ヘッダーか目次の中の`aria-haspopup`と`aria-expanded`を持つ釦で、字は見えている字だけを読む。一覧の行は`lang`を持つ「日本語」と`English`の`a`か`button`
 */
const read = (page: Page) =>
  page.evaluate(() => {
    const sq = (text: string | null | undefined): string => (text ?? "").replace(/\s+/gu, " ").trim();
    const vis = (el: Element | null | undefined): el is Element => !!el && (el as HTMLElement).checkVisibility();
    const dec = (href: string): string => {
      try {
        return decodeURIComponent(href);
      } catch {
        return href;
      }
    };
    const box = (el: Element | null | undefined) => {
      if (!vis(el)) return null;
      const r = el.getBoundingClientRect();
      return { left: Math.round(r.left), right: Math.round(r.right), top: Math.round(r.top), bottom: Math.round(r.bottom), width: Math.round(r.width), height: Math.round(r.height) };
    };
    const deepText = (el: Element): string => {
      let out = el.textContent ?? "";
      for (const child of el.querySelectorAll("*")) if (child.shadowRoot) out += ` ${[...child.shadowRoot.querySelectorAll("*")].map((c) => c.textContent ?? "").join(" ")}`;
      return sq(out);
    };
    const holders = [...document.querySelectorAll("header, nav.pg-menu")];
    const sw = holders.flatMap((h) => [...h.querySelectorAll<HTMLElement>("button[aria-haspopup][aria-expanded]")]).find(vis) ?? null;
    const options = holders
      .flatMap((h) => [...h.querySelectorAll("a[lang], button[lang]")])
      .filter((el) => el !== sw && vis(el) && /^(日本語|English)$/u.test(sq(el.textContent)))
      .map((el) => ({ text: sq(el.textContent), lang: el.getAttribute("lang"), bold: Number(getComputedStyle(el).fontWeight) >= 600, box: box(el) }));
    const title = document.querySelector(".pg-head-title");
    let titleLines = 0;
    if (vis(title)) {
      const range = document.createRange();
      range.selectNodeContents(title);
      titleLines = new Set([...range.getClientRects()].map((r) => Math.round(r.top))).size;
    }
    const target = document.getElementById(dec(location.hash.slice(1)));
    const head = document.querySelector("header");
    const sec = [...document.querySelectorAll(".pg-sec")].find(vis);
    return {
      lang: document.documentElement.lang,
      hash: dec(location.hash.slice(1)),
      kept: (window as unknown as { pairKept?: number }).pairKept ?? null,
      tab: sq([...document.querySelectorAll(".pg-head-tabs a")].find((a) => a.getAttribute("aria-current") === "true")?.textContent),
      section: sq(sec?.querySelector(".pg-sec-title")?.textContent),
      menu: sq([...document.querySelectorAll("nav.pg-menu a[aria-current='true']")].find(vis)?.textContent),
      switch: sw ? { text: sq(sw.innerText), expanded: sw.getAttribute("aria-expanded"), box: box(sw), inMenu: !!sw.closest("nav.pg-menu") } : null,
      options,
      opener: box(document.querySelector(".pg-sx-open")),
      search: box([...document.querySelectorAll(".pg-sx")].find(vis)),
      head: box(head),
      titleLines,
      targetTop: target && vis(target) ? Math.round(target.getBoundingClientRect().top) : null,
      headBottom: head && vis(head) ? Math.round(head.getBoundingClientRect().bottom) : 0,
      questions: [...document.querySelectorAll(".pg-q")].filter(vis).map((q) => q.hasAttribute("data-done")),
      rows: Object.fromEntries([...document.querySelectorAll(".pg-map-list a, nav.pg-menu a.pg-menu-q")].filter(vis).map((a) => [dec(a.getAttribute("href") ?? "").slice(1), a.hasAttribute("data-done")])),
      main: sq((document.querySelector(".pg-main") as HTMLElement | null)?.innerText),
      figures: [...document.querySelectorAll(".pg-figure")].filter(vis).map(deepText),
      raw: [...document.querySelectorAll(".pg-figure pre.dragon")].filter(vis).length,
      placeholder: (document.querySelector<HTMLInputElement>(".pg-sx input")?.placeholder ?? "").trim(),
      found: [...document.querySelectorAll(".pg-sx-r")].filter(vis).map((r) => sq(r.querySelector(".pg-sx-n")?.textContent)),
    };
  });

type Seen = Awaited<ReturnType<typeof read>>;

/** 頁の場所の名前を`place`に変える */
const openPlace = (page: Page, place: string): Promise<void> =>
  page.evaluate((to) => {
    location.hash = `#${to}`;
  }, place);

/** 見えている切り替えの釦を押す */
const pressSwitch = (page: Page): Promise<void> =>
  page.locator(":is(header, nav.pg-menu) button[aria-haspopup][aria-expanded]:visible").first().click({ timeout: ACTION_LIMIT_MS });

/** 切り替えの釦を押し、`lang`の言葉を選び、頁がその言葉になるまで待って読む */
async function switchTo(page: Page, lang: "ja" | "en"): Promise<Seen> {
  const name = lang === "ja" ? "日本語" : "English";
  const opened = await readUntil(
    async () => {
      const now = await read(page);
      if (now.switch && now.switch.expanded !== "true") await pressSwitch(page);
      return read(page);
    },
    (s) => s.options.length === 2,
    WAIT,
  );
  if (opened.options.length !== 2) return opened;
  await page.locator(`:is(header, nav.pg-menu) :is(a, button)[lang="${lang}"]`, { hasText: new RegExp(`^${name}$`, "u") }).first().click({ timeout: ACTION_LIMIT_MS });
  return readUntil(
    () => read(page),
    (s) => s.lang === lang && s.main !== "" && s.raw === 0,
    WAIT,
  );
}

/** ブラウザの言葉を`lang`にしてから頁を開く */
async function openAs(page: Page, lang: string, path: string, storage = true): Promise<void> {
  await page.addInitScript(
    ([language, keep]) => {
      Object.defineProperty(navigator, "language", { configurable: true, get: () => language });
      Object.defineProperty(navigator, "languages", { configurable: true, get: () => [language] });
      if (!keep)
        Object.defineProperty(window, "localStorage", {
          configurable: true,
          get() {
            throw new DOMException("blocked", "SecurityError");
          },
        });
    },
    [lang, storage] as const,
  );
  await page.goto(`${SITE}${path}`, { timeout: ACTION_LIMIT_MS });
  await page.reload({ timeout: ACTION_LIMIT_MS });
}

/** 頁が言葉の文を出すまで待って読む */
const settled = (page: Page, lang?: string): Promise<Seen> =>
  readUntil(
    () => read(page),
    (s) => s.main !== "" && (lang === undefined || s.lang === lang),
    WAIT,
  );

/** 見えている確かめる問いの`n`番目の答えの釦を押し、開くまで待つ */
async function press(page: Page, n: number): Promise<void> {
  await page.locator(".pg-q:visible").nth(n).locator(".pg-q-btn").click({ timeout: ACTION_LIMIT_MS });
  await readUntil(
    () => read(page),
    (s) => s.questions[n] === true,
    WAIT,
  );
}

const HTML = await atLoad("日本語と英語の説明の頁を1組で書き出す", () => pairHtml(PAIR, "lang-pair"));
const ONE = await atLoad("話題が1つで用語の無い頁を1組で書き出す", () => pairHtml({ "guide.md": ONE_JA, "guide.en.md": ONE_EN }, "lang-pair-one"));

/** `files`を置いた所で`path`の頁を`viewport`の大きさで開いて`run`を回す */
const onSite = <T>(files: Record<string, string>, run: (page: Page) => Promise<T>, viewport = { width: 1200, height: 800 }) =>
  within(withSite(files, "guide.html", run, viewport), PAGE_LIMIT_MS, "2つの言葉の頁の仕事");

/** 日本語のブラウザで開き、釦、節、見出し、図、用語、印、探す欄、印刷の形を順に読む */
const FLOW = await atLoad("日本語のブラウザで2つの言葉の頁を開き、言葉を替えて読む", async () => {
  const html = HTML.get();
  if (!html) return undefined;
  return onSite({ "guide.html": html }, async (page) => {
    const step = inOrder();
    await openAs(page, "ja-JP", `guide.html#${encodeURIComponent("何を止めるのか")}`);
    const before = await step("日本語の問いの節を開き、図を描き終えてから読む", () =>
      readUntil(
        () => read(page),
        (s) => s.lang === "ja" && s.main !== "" && s.raw === 0 && s.figures.length > 0,
        WAIT,
      ),
    );
    const listed = await step("切り替えの釦を押し、一覧を読む", async () => {
      await page.evaluate(() => {
        (window as unknown as { pairKept: number }).pairKept = 1;
      });
      await pressSwitch(page);
      return readUntil(
        () => read(page),
        (s) => s.options.length === 2,
        WAIT,
      );
    });
    const escaped = await step("Escapeを押し、一覧を読む", async () => {
      await page.keyboard.press("Escape");
      return readUntil(
        () => read(page),
        (s) => s.options.length === 0,
        WAIT,
      );
    });
    const outside = await step("一覧を開き直して外を押し、一覧を読む", async () => {
      await pressSwitch(page);
      await readUntil(
        () => read(page),
        (s) => s.options.length === 2,
        WAIT,
      );
      await page.mouse.click(600, 600);
      return readUntil(
        () => read(page),
        (s) => s.options.length === 0,
        WAIT,
      );
    });
    const english = await step("Englishを選び、問いの節を読む", () => switchTo(page, "en"));
    const heading = await step("日本語へ戻し、2つ目の見出しへ移ってから英語へ替える", async () => {
      await switchTo(page, "ja");
      await openPlace(page, "何を止めるのか-h-2");
      await readUntil(
        () => read(page),
        (s) => s.menu === "額を照らす",
        WAIT,
      );
      return switchTo(page, "en");
    });
    const figureAt = await step("見出しの無い節の2つ目の図へ移ってから日本語へ替える", async () => {
      await openPlace(page, "in-what-order-is-it-checked-fig-2");
      await readUntil(
        () => read(page),
        (s) => s.menu === "After a stop",
        WAIT,
      );
      return switchTo(page, "ja");
    });
    const term = await step("用語の話題の2つ目の用語を開いてから英語へ替える", async () => {
      await openPlace(page, "宛先");
      await readUntil(
        () => read(page),
        (s) => s.hash === "宛先" && s.targetTop !== null,
        WAIT,
      );
      return switchTo(page, "en");
    });
    const marked = await step("日本語の節で1つ目の確かめる問いを開き、英語へ替える", async () => {
      await switchTo(page, "ja");
      await openPlace(page, "何を止めるのか");
      await settled(page, "ja");
      await press(page, 0);
      return switchTo(page, "en");
    });
    const markedMap = await step("英語の話題の頭の一覧を読む", async () => {
      await openPlace(page, "how-it-stops");
      return readUntil(
        () => read(page),
        (s) => "what-is-stopped" in s.rows,
        WAIT,
      );
    });
    const both = await step("英語の節で2つ目の確かめる問いを開き、日本語へ替えて話題の頭の一覧を読む", async () => {
      await openPlace(page, "what-is-stopped");
      await settled(page, "en");
      await press(page, 1);
      await switchTo(page, "ja");
      await openPlace(page, "止める仕組み");
      return readUntil(
        () => read(page),
        (s) => "何を止めるのか" in s.rows,
        WAIT,
      );
    });
    const cleared = await step("日本語で印を消し、英語の節の印を読む", async () => {
      await page.getByRole("button", { name: "印を消す" }).click({ timeout: ACTION_LIMIT_MS });
      await switchTo(page, "en");
      await openPlace(page, "what-is-stopped");
      return readUntil(
        () => read(page),
        (s) => s.questions.length === 2,
        WAIT,
      );
    });
    const typeInto = async (word: string): Promise<Seen> => {
      await page.locator(".pg-head .pg-sx input").fill(word, { timeout: ACTION_LIMIT_MS });
      return readUntil(
        () => read(page),
        (s) => s.found.length > 0 || word === "",
        1_500,
      );
    };
    const searchEn = await step("英語の頁で探す欄に日本語と英語の語を打つ", async () => ({
      ja: await typeInto("止める"),
      en: await typeInto("stopped"),
    }));
    const searchJa = await step("日本語の頁で探す欄に日本語と英語の語を打つ", async () => {
      await typeInto("");
      await page.keyboard.press("Escape");
      await switchTo(page, "ja");
      return { ja: await typeInto("止める"), en: await typeInto("stopped") };
    });
    const printed = await step("印刷の形にして読む", async () => {
      await typeInto("");
      await page.keyboard.press("Escape");
      await page.emulateMedia({ media: "print" });
      const paper = await read(page);
      await page.emulateMedia({ media: "screen" });
      return paper;
    });
    return { before, listed, escaped, outside, english, heading, figureAt, term, marked, markedMap, both, cleared, searchEn, searchJa, printed };
  });
});

/** ブラウザの言葉と覚えた言葉と`#`の後ろで、最初に見せる言葉を読む */
const FIRST = await atLoad("ブラウザの言葉ごとに2つの言葉の頁を開き、最初の言葉を読む", async () => {
  const html = HTML.get();
  if (!html) return undefined;
  const files = { "guide.html": html };
  const first = (lang: string, path = "guide.html") =>
    onSite(files, async (page) => {
      await openAs(page, lang, path);
      return settled(page);
    });
  const ja = await first("ja-JP");
  const en = await first("en-US");
  const fr = await first("fr-FR");
  const linkEn = await first("ja-JP", "guide.html#what-is-stopped");
  const linkJa = await first("en-US", `guide.html#${encodeURIComponent("何を止めるのか")}`);
  const remembered = await onSite(files, async (page) => {
    await openAs(page, "ja-JP", "guide.html");
    await settled(page, "ja");
    await switchTo(page, "en");
    await page.goto(`${SITE}guide.html`, { timeout: ACTION_LIMIT_MS });
    await page.reload({ timeout: ACTION_LIMIT_MS });
    return settled(page);
  });
  const noStorage = await onSite(files, async (page) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await openAs(page, "ja-JP", "guide.html", false);
    await settled(page);
    const switched = await switchTo(page, "en");
    return { switched, errors };
  });
  return { ja, en, fr, linkEn, linkJa, remembered, noStorage };
});

/** 幅390pxで開き、ヘッダーの釦と一覧を読む */
const PHONE = await atLoad("幅390pxで2つの言葉の頁を開き、ヘッダーの釦と一覧を読む", async () => {
  const html = HTML.get();
  if (!html) return undefined;
  return onSite(
    { "guide.html": html },
    async (page) => {
      await openAs(page, "ja-JP", `guide.html#${encodeURIComponent("何を止めるのか")}`);
      const closed = await settled(page, "ja");
      await pressSwitch(page);
      const opened = await readUntil(
        () => read(page),
        (s) => s.options.length === 2,
        WAIT,
      );
      return { closed, opened };
    },
    { width: 390, height: 844 },
  );
});

/** ヘッダーの無い頁を開き、目次の頭の釦を読む */
const MENU = await atLoad("話題が1つで用語の無い2つの言葉の頁を開き、目次の頭の釦を読む", async () => {
  const html = ONE.get();
  if (!html) return undefined;
  return onSite({ "guide.html": html }, async (page) => {
    await openAs(page, "ja-JP", "guide.html");
    return settled(page, "ja");
  });
});

/** 命令で1組を書き出す */
const CLI = await atLoad("命令で日本語と英語のmdを1組で書き出す", async () => {
  const { dir, ja, en } = writePair(PAIR, "lang-pair-cli");
  const ran = await runCli(["export", ja, en]);
  return { dir, ran, pages: pagesIn(dir) };
});

/** 命令でmdを3つと、mdと余分な引数を渡す */
const CLI_BAD = await atLoad("命令でmdを3つと、mdと余分な引数を渡す", async () => {
  const three = writePair({ ...PAIR, "third.md": GUIDE_JA.replace("# 送金の止め方", "# 三つ目") }, "lang-pair-three");
  const threeRan = await runCli(["export", three.ja, three.en, join(three.dir, "third.md")]);
  const extra = writePair(PAIR, "lang-pair-extra");
  const extraRan = await runCli(["export", extra.ja, "out"]);
  return { three: { ran: threeRan, pages: pagesIn(three.dir) }, extra: { ran: extraRan, pages: pagesIn(extra.dir) } };
});

/** 使い方の文 */
const USAGE = await atLoad("使い方の文を出す", () => runCli(["help", "--lang", "ja"]));
const USAGE_EN = await atLoad("英語の使い方の文を出す", () => runCli(["help"]));

/** `section`の`from`の行から`to`の行の前までを外す */
const cut = (text: string, from: string, to: string): string => {
  const lines = text.split("\n");
  const a = lines.findIndex((line) => line.startsWith(from));
  const b = lines.findIndex((line, i) => i > a && line.startsWith(to));
  return [...lines.slice(0, a), ...lines.slice(b)].join("\n");
};

/** 1つ目の節に確かめる問いを1つ多く持つ英語の頁 */
const EXTRA_QUIZ_EN = GUIDE_EN.replace(
  quiz("What happens to a late request?", "It stops."),
  `${quiz("What happens to a late request?", "It stops.")}\n\n${quiz("Is it kept?", "Yes.")}`,
);

/** 1組を書き出し、断った訳を返す */
async function refused(files: Readonly<Record<string, string>>, name: string, pair: readonly string[] = ["guide.md", "guide.en.md"]) {
  const dir = tempDir(name);
  writeFiles(dir, files);
  const result = await exportPair(
    pair.map((file) => join(dir, file)),
    dir,
  );
  return { result, pages: pagesIn(dir) };
}

describe("日本語と英語のmdを1組で書き出した説明の頁 (#3899)", () => {
  it("lang-pair-one-page", async () => {
    const { dir, ran, pages } = CLI.get();
    expect({ code: ran.code, stdout: ran.stdout }, `命令で1組を書き出す: ${ran.stderr}`).toEqual({ code: 0, stdout: `${join(dir, "guide.html")}\n` });
    expect(pages, "命令が書いた頁").toEqual(["guide.html"]);
    const html = readFileSync(join(dir, "guide.html"), "utf8");
    for (const text of ["何を止めるのか", "What is stopped?", "止める流れ", "How it stops", "口座から口座へお金を移すこと。", "Moving money from one account to another."])
      expect(html, `頁が「${text}」を持たない`).toContain(text);
    const { ja, en } = writePair(PAIR, "lang-pair-node");
    const out = tempDir("lang-pair-node-out");
    const result = await exportPair([ja, en], out);
    expect(result, "Nodeの入口で1組を書き出す").toEqual({ ok: true, path: join(out, "guide.html") });
    expect(pagesIn(out), "Nodeの入口が書いた頁").toEqual(["guide.html"]);
  });

  it("lang-pair-switch-button", () => {
    const seen = FLOW.get();
    if (!seen) return;
    const before = seen.before.get();
    const sw = before.switch;
    expect(sw?.text, "日本語の頁の切り替えの釦の字").toBe("日本語");
    expect(sw?.expanded, "開く前の釦").toBe("false");
    expect(
      !!sw?.box && !!before.search && sw.box.left >= before.search.right && Math.abs(sw.box.top + sw.box.height / 2 - (before.search.top + before.search.height / 2)) <= 3,
      `釦は探す欄の右に並ぶ (釦 ${JSON.stringify(sw?.box)}、探す欄 ${JSON.stringify(before.search)})`,
    ).toBe(true);
    const listed = seen.listed.get();
    expect(
      listed.options.map((o) => ({ text: o.text, lang: o.lang, bold: o.bold })),
      "押した後の一覧",
    ).toEqual([
      { text: "日本語", lang: "ja", bold: true },
      { text: "English", lang: "en", bold: false },
    ]);
    expect(listed.switch?.expanded, "開いた釦").toBe("true");
    expect(seen.escaped.get().options, "Escapeで閉じた一覧").toEqual([]);
    expect(seen.outside.get().options, "外を押して閉じた一覧").toEqual([]);
    expect(seen.english.get().switch?.text, "英語の頁の切り替えの釦の字").toBe("English");
  });

  it("lang-pair-switch-keeps-section", () => {
    const seen = FLOW.get();
    if (!seen) return;
    const before = seen.before.get();
    expect({ lang: before.lang, tab: before.tab, section: before.section, hash: before.hash }, "替える前").toEqual({ lang: "ja", tab: "止める仕組み", section: "何を止めるのか", hash: "何を止めるのか" });
    const english = seen.english.get();
    expect({ lang: english.lang, tab: english.tab, section: english.section, hash: english.hash, kept: english.kept }, "英語へ替えた後").toEqual({
      lang: "en",
      tab: "How it stops",
      section: "What is stopped?",
      hash: "what-is-stopped",
      kept: 1,
    });
    expect(english.main, "英語へ替えた後の本文").toContain("Check that the payee is on the allowed list.");
    expect(english.main, "英語へ替えた後に日本語の本文が残る").not.toContain("宛先が許した一覧に在るかを照らす。");
    expect(english.figures.join(" "), "英語へ替えた後の図").toContain("How it stops");
    expect(english.figures.join(" "), "英語へ替えた後に日本語の図が残る").not.toContain("止める流れ");
    expect({ before: before.raw, english: english.raw }, "記法の字のまま残った図の数").toEqual({ before: 0, english: 0 });
    expect(before.figures.join(" "), "日本語の図の帯の字").toContain("コード");
    expect(english.figures.join(" "), "英語へ替えた後の図の帯に日本語の字が残る").not.toContain("コード");
  });

  it("lang-pair-switch-keeps-heading", () => {
    const seen = FLOW.get();
    if (!seen) return;
    const near = (s: Seen): boolean => s.targetTop !== null && s.targetTop >= s.headBottom - 2 && s.targetTop <= s.headBottom + 60;
    const heading = seen.heading.get();
    expect({ hash: heading.hash, menu: heading.menu }, "2つ目の見出しで英語へ替えた後").toEqual({ hash: "what-is-stopped-h-2", menu: "Check the amount" });
    expect(near(heading), `英語の2つ目の見出しが頁の上に在る (上 ${heading.targetTop}、ヘッダーの下 ${heading.headBottom})`).toBe(true);
    const fig = seen.figureAt.get();
    expect({ hash: fig.hash, menu: fig.menu }, "2つ目の図で日本語へ替えた後").toEqual({ hash: "どの順で確かめるのか-fig-2", menu: "止めた後" });
    expect(near(fig), `日本語の2つ目の図が頁の上に在る (上 ${fig.targetTop}、ヘッダーの下 ${fig.headBottom})`).toBe(true);
    const term = seen.term.get();
    expect({ hash: term.hash, tab: term.tab }, "用語の話題で英語へ替えた後").toEqual({ hash: "payee", tab: "Terms" });
    expect(term.targetTop, "英語の用語の札が見えている").not.toBeNull();
  });

  it("lang-pair-first-language", () => {
    const seen = FIRST.get();
    if (!seen) return;
    expect(
      { ja: seen.ja.lang, en: seen.en.lang, fr: seen.fr.lang },
      "ブラウザの言葉ごとの最初の言葉",
    ).toEqual({ ja: "ja", en: "en", fr: "en" });
    expect(seen.remembered.lang, "英語へ替えてから開き直した言葉").toBe("en");
    expect(
      { linkEn: [seen.linkEn.lang, seen.linkEn.section], linkJa: [seen.linkJa.lang, seen.linkJa.section] },
      "節を指すlinkで開いた言葉",
    ).toEqual({ linkEn: ["en", "What is stopped?"], linkJa: ["ja", "何を止めるのか"] });
    expect(seen.noStorage.errors, "頁の記録を使えない時の頁の誤り").toEqual([]);
    expect(seen.noStorage.switched.lang, "頁の記録を使えない時に替えた言葉").toBe("en");
  });

  it("lang-pair-marks-shared", () => {
    const seen = FLOW.get();
    if (!seen) return;
    expect(seen.marked.get().questions, "日本語で1つ目を開いた後の英語の問いの印").toEqual([true, false]);
    expect(seen.markedMap.get().rows["what-is-stopped"], "1つだけ開いた英語の節の一覧の印").toBe(false);
    const both = seen.both.get();
    expect(both.rows["何を止めるのか"], "英語で2つ目を開いた後の日本語の節の一覧の印").toBe(true);
    expect(seen.cleared.get().questions, "日本語で消した後の英語の問いの印").toEqual([false, false]);
  });

  it("lang-pair-refuses-mismatch", async () => {
    const named = (errors: readonly { file: string; line: number; message: string }[], file: string, line: number, other: string): boolean =>
      errors.some((e) => basename(e.file) === file && e.line === line && e.message.includes(other));
    const cases = [
      { what: "話題の数", files: { ...PAIR, "guide.en.md": GUIDE_EN.split("\n## Records")[0] ?? "" }, file: "guide.md", line: lineOf(GUIDE_JA, "## 記録"), other: "guide.en.md" },
      { what: "節の数", files: { ...PAIR, "guide.en.md": cut(GUIDE_EN, "### In what order", "## Records") }, file: "guide.md", line: lineOf(GUIDE_JA, "### どの順で確かめるのか"), other: "guide.en.md" },
      { what: "`####`の見出しの数", files: { ...PAIR, "guide.en.md": GUIDE_EN.replace("#### Check the amount\n", "") }, file: "guide.md", line: lineOf(GUIDE_JA, "#### 額を照らす"), other: "guide.en.md" },
      { what: "用語の数", files: { ...PAIR, "glossary.en.md": "### transfer\n\nMoving money.\n", "guide.en.md": GUIDE_EN.replace("[payee](glossary.en.md#payee)", "payee") }, file: "glossary.md", line: lineOf(GLOSSARY_JA, "### 宛先"), other: "glossary.en.md" },
      { what: "確かめる問いの数", files: { ...PAIR, "guide.en.md": EXTRA_QUIZ_EN }, file: "guide.en.md", line: lineOf(EXTRA_QUIZ_EN, "<summary>Is it kept?</summary>") - 1, other: "guide.md" },
    ];
    for (const c of cases) {
      const { result, pages } = await refused(c.files, "lang-pair-mismatch");
      expect(result?.ok, `${c.what}が違う1組を書き出した`).toBe(false);
      expect(pages, `${c.what}が違う1組で頁を書いた`).toEqual([]);
      const errors = result && !result.ok ? result.errors : [];
      expect(named(errors, c.file, c.line, c.other), `${c.what}の違いを${c.file}:${c.line}で名指し、${c.other}に触れる: ${JSON.stringify(errors)}`).toBe(true);
    }
  });

  it("lang-pair-refuses-bad-pair", async () => {
    const same = await refused({ ...PAIR, "other.md": GUIDE_JA.replace("# 送金の止め方", "# 別の頁") }, "lang-pair-same", ["guide.md", "other.md"]);
    expect(same.result?.ok, "同じ言葉の2つを書き出した").toBe(false);
    expect(same.pages, "同じ言葉の2つで頁を書いた").toEqual([]);
    const sameErrors = same.result && !same.result.ok ? same.result.errors : [];
    expect(sameErrors.some((e) => basename(e.file) === "other.md" && e.message.includes("guide.md")), `同じ言葉の2つを名指す: ${JSON.stringify(sameErrors)}`).toBe(true);
    const plain = await refused({ ...PAIR, "guide.en.md": GUIDE_EN.replace("layout: guide", "layout: tabs") }, "lang-pair-plain");
    expect(plain.result?.ok, "説明の頁でないmdを組んで書き出した").toBe(false);
    expect(plain.pages, "説明の頁でないmdを組んで頁を書いた").toEqual([]);
    const plainErrors = plain.result && !plain.result.ok ? plain.result.errors : [];
    expect(plainErrors.some((e) => basename(e.file) === "guide.en.md" && e.message.includes("layout: guide")), `説明の頁でないmdを名指す: ${JSON.stringify(plainErrors)}`).toBe(true);
    const { three, extra } = CLI_BAD.get();
    expect(three.ran.code, "mdを3つ渡した命令の終わり方").toBe(2);
    expect(three.ran.stderr, "mdを3つ渡した命令の断り").toContain("third.md");
    expect(three.pages, "mdを3つ渡して頁を書いた").toEqual([]);
    expect(extra.ran.code, "mdと余分な引数を渡した命令の終わり方").toBe(2);
    expect(extra.ran.stderr, "mdと余分な引数を渡した命令の断り").toContain("out");
    expect(extra.pages, "mdと余分な引数を渡して頁を書いた").toEqual([]);
  });

  it("lang-pair-phone-and-menu", () => {
    const phone = PHONE.get();
    if (!phone) return;
    const closed = phone.closed;
    const sw = closed.switch?.box;
    const opener = closed.opener;
    expect(closed.switch?.text, "幅390pxの釦は字を見せない").toBe("");
    expect(
      !!sw && !!opener && Math.abs(sw.width - opener.width) <= 1 && Math.abs(sw.height - opener.height) <= 1 && sw.left >= opener.right && Math.abs(sw.top - opener.top) <= 1,
      `幅390pxの釦は虫眼鏡と同じ大きさで右に並ぶ (釦 ${JSON.stringify(sw)}、虫眼鏡 ${JSON.stringify(opener)})`,
    ).toBe(true);
    expect(closed.titleLines, "幅390pxの題の行数").toBe(1);
    const list = phone.opened.options;
    expect(list.map((o) => o.text), "幅390pxで開いた一覧").toEqual(["日本語", "English"]);
    expect(
      list.every((o) => !!o.box && !!sw && o.box.left >= 0 && o.box.right <= 390 && o.box.top >= sw.bottom),
      `幅390pxの一覧は釦の下で画面に収まる (${JSON.stringify(list.map((o) => o.box))})`,
    ).toBe(true);
    const menu = MENU.get();
    if (!menu) return;
    const msw = menu.switch;
    expect(msw?.inMenu, "ヘッダーの無い頁の釦は目次に在る").toBe(true);
    expect(
      !!msw?.box && !!menu.search && msw.box.left >= menu.search.right - 1 && Math.abs(msw.box.top + msw.box.height / 2 - (menu.search.top + menu.search.height / 2)) <= 3,
      `ヘッダーの無い頁の釦は目次の頭の探す欄の右に並ぶ (釦 ${JSON.stringify(msw?.box)}、探す欄 ${JSON.stringify(menu.search)})`,
    ).toBe(true);
  });

  it("lang-pair-search-and-print", () => {
    const seen = FLOW.get();
    if (!seen) return;
    const en = seen.searchEn.get();
    expect({ placeholder: en.ja.placeholder, ja: en.ja.found, en: en.en.found.length > 0 }, "英語の頁の探す欄").toEqual({ placeholder: "Search questions and terms", ja: [], en: true });
    const ja = seen.searchJa.get();
    expect({ placeholder: ja.ja.placeholder, ja: ja.ja.found.length > 0, en: ja.en.found }, "日本語の頁の探す欄").toEqual({ placeholder: "問いと用語を探す", ja: true, en: [] });
    const paper = seen.printed.get();
    expect(paper.switch, "印刷の形の切り替えの釦").toBeNull();
    expect(paper.main, "印刷の形の本文").toContain("宛先が許した一覧に在るかを照らす。");
    expect(paper.main, "印刷の形にもう一方の言葉が出る").not.toContain("Check that the payee is on the allowed list.");
  });

  it("lang-pair-docs", () => {
    const readFile = (file: string): string => readFileSync(join(process.cwd(), file), "utf8");
    const section = (text: string, heading: string): string => text.split(heading)[1]?.split(/\n### /u)[0] ?? "";
    const pair = /dragon export \S+\.md \S+\.en\.md/u;
    expect(section(readFile("packages/dragon/README.md"), "### Guide page"), "READMEの説明の頁の節が1組の渡し方を書く").toMatch(pair);
    expect(section(readFile("packages/dragon/README.ja.md"), "### 説明の頁"), "日本語のREADMEの説明の頁の節が1組の渡し方を書く").toMatch(pair);
    expect(readFile("plugins/dragon/skills/dragon/references/page.md"), "スキルの`page`の手引きが1組の渡し方を書く").toMatch(pair);
    const usage = /^(?:Usage|使い方): dragon export <md[^\n]*\(\.md\)[^\n]*\(\.md\)/mu;
    expect(USAGE.get().stderr, "日本語の使い方の文が2つ目のmdを書く").toMatch(usage);
    expect(USAGE_EN.get().stderr, "英語の使い方の文が2つ目のmdを書く").toMatch(usage);
    const musubi = JSON.parse(readFile("plugins/dragon/skills/dragon/musubi.json")) as { provides: { page?: { version?: string } } };
    const [major = 0, minor = 0] = (musubi.provides.page?.version ?? "0.0.0").split(".").map(Number);
    expect(major > 1 || (major === 1 && minor >= 3), `スキルの\`page\`の版が1.3.0以上でない: ${musubi.provides.page?.version}`).toBe(true);
  });
});
