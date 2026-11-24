/**
 * mdから書き出す説明の頁 (`layout: guide`、#3876)。
 *
 * 頭の行に`layout: guide`を書いたmdは、`##`が話題のタブ、`###`がそのタブの中に番号つきで縦に積む節になる。
 * タブの頭には、そのタブの節の題を番号つきで並べた「このタブで答える問い」の一覧が出て、問いを押すとその節へ移る。
 * 節の題の直後の引用は題の下の答えになり、`<details>`と`<summary>`は答えを押すまで隠す確かめる問いになる。
 * 頁の頭の`![用語](glossary.md)`の行で読み込んだ用語のfileは「用語」のタブになり、本文の`[用語](glossary.md#用語)`のリンクは押すと札が開く下線になる。
 * 印刷の形では、用語の札と箱の札と確かめる問いの答えが全て開く。
 *
 * 書き出したHTMLの形は頁を開かずに確かめ、押す動きと描いた大きさは`http://localhost/`に置いた Chromium で測る。
 * 頁を開いて押して待つ仕事は file を読み込む段 (`at-load.ts`) で済ませ、件は記した値を確かめる (#3816)。
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { basename, dirname, join } from "node:path";
import { JSDOM } from "jsdom";
import type { Page } from "playwright-core";
import { describe, expect, it } from "vitest";

import { atLoad } from "./at-load";
import { withSite } from "./cdn-page-support";
import { expectWritten, exportPageTool, tempDir, writeFiles } from "./page-export-support";
import { ACTION_LIMIT_MS, inOrder, PAGE_LIMIT_MS, readUntil, within } from "./page-wait";

const ROOT = join(process.cwd(), "packages/dragon");
/** 説明の頁の見本の置き場。英語と日本語の頁と、それぞれが読み込む用語のfile */
const EXAMPLES = join(ROOT, "examples/guide");
const EXAMPLE_PAGES = ["guide.en.md", "guide.md"];
const EXAMPLE_GLOSSARIES = ["glossary.en.md", "glossary.md"];

/** 字が読める大きさの下限 (`look/values.ts` の `READABLE_PX`) */
const READABLE_PX = 10.5;
/** 頁が書き換わるのを待つ長さ */
const WAIT = 4_000;
/** 押してから札の上の縁が下線の下の縁から離れてよい長さ。札の部品の箱からの隙間 (8px) に揃え、少しの丸めを許す */
const CARD_GAP_MAX = 16;

/** 用語のfile。`###`の見出しが用語、続く段落が説明、その後の引用が例 */
const GLOSSARY = `# 用語

### エージェント

利用者に代わって送金を組み立てるプログラム。

> 毎朝の支払いを自動で頼む

### 規則

宛先と額と期限の組。

> 1回30まで

### 記録

確かめた結果を並べた物。

> 止めた送金と理由
`;

/** 節を縦に長くする箇条書き。問いを押した時に頁が動いて節へ移るのを測るため */
const FILLER = Array.from({ length: 16 }, (_, n) => `- 確かめる段 ${n + 1}`).join("\n");

/** 説明の頁のmd。`note: pop` で図の箱の説明を札で見せる */
const GUIDE = `---
layout: guide
note: pop
---

# 送金の確かめ方

送金を止める仕組みを、問いごとに読む。

![用語](glossary.md)

## 止める仕組み

### 何を止めるのか

> [エージェント](glossary.md#エージェント)が作った送金のうち、[規則](glossary.md#規則)に合わない物を止める。

\`\`\`dragon
architecture どこで止めるのか

box agent as エージェント [note: 送金を作る, example: 毎朝の支払い]
box check as 確かめる所 [note: 規則と照らす]
box signer as 署名する所

step 送る
  agent -> check: 送金
step 通す
  check -> signer: 合う送金
\`\`\`

止めた送金は、理由と共に返す。

> 止めた送金は記録に残る。

${FILLER}

<details>
<summary>35を送る依頼はどうなるか</summary>

止まる。1回の上限30を超える。

</details>

<details>
<summary>期限を過ぎた依頼はどうなるか</summary>

止まる。規則の期限は年の終わりまで。

</details>

### どの順で確かめるのか

1回の送金を確かめる順を見る。

> 順は変えられない。

${FILLER}

## 記録

### どこに残すのか

> 確かめた結果を[記録](glossary.md#記録)に残す。

${FILLER}
`;

/** 説明の頁のmdと用語のfileを一時のdirに書き、mdのpathを返す */
function writeGuide(files: Readonly<Record<string, string>> = {}): string {
  const root = tempDir("guide");
  writeFiles(root, { "notes.md": GUIDE, "glossary.md": GLOSSARY, ...files });
  return join(root, "notes.md");
}

/** 書き出したHTMLを読んで文書にする */
const documentOf = (path: string): Document => new JSDOM(readFileSync(path, "utf8")).window.document;

/** 字の空白を詰める */
const squash = (text: string | null | undefined): string => (text ?? "").replace(/\s+/gu, " ").trim();

/** 見本のmdを書き出して文書にする。書き出せない時は判定の文で落とし、undefined を返す */
async function exportedGuide(md = writeGuide()): Promise<Document | undefined> {
  const exportPage = await exportPageTool();
  if (!exportPage) return undefined;
  const path = expectWritten(await exportPage(md));
  return path === "" ? undefined : documentOf(path);
}

/** 話題のタブの名前と、タブごとの節の番号と題 */
function topicsOf(doc: Document): { tab: string; sections: { number: string; title: string; hidden: boolean }[] }[] {
  const tabs = [...doc.querySelectorAll('.pg-topics [role="tab"]')];
  return tabs.map((tab) => {
    const panel = doc.getElementById(tab.getAttribute("aria-controls") ?? "");
    return {
      tab: squash(tab.textContent),
      sections: [...(panel?.querySelectorAll(".pg-sec") ?? [])].map((sec) => ({
        number: squash(sec.querySelector(".pg-sec-title .pg-num")?.textContent),
        title: squash(sec.querySelector(".pg-sec-title")?.textContent).replace(/^\d+\s*/u, ""),
        hidden: sec.closest("[hidden]") !== null && sec.closest("[hidden]") !== panel,
      })),
    };
  });
}

/** 題で節を探す */
const sectionOf = (doc: Document, title: string): Element | undefined =>
  [...doc.querySelectorAll(".pg-sec")].find((sec) => squash(sec.querySelector(".pg-sec-title")?.textContent).endsWith(title));

/** 頁の要素と影の根の中の要素を全て返す。帯つきの図は帯の内側の影の根に描く */
const deepAll = (page: Page, selector: string): Promise<{ visible: boolean; text: string }[]> =>
  page.evaluate((sel) => {
    const out: { visible: boolean; text: string }[] = [];
    const walk = (root: Document | ShadowRoot): void => {
      for (const el of root.querySelectorAll<HTMLElement>(sel)) out.push({ visible: el.checkVisibility(), text: (el.textContent ?? "").trim() });
      for (const host of root.querySelectorAll("*")) if (host.shadowRoot) walk(host.shadowRoot);
    };
    walk(document);
    return out;
  }, selector);

/** 見えている図が全て描かれるまで待つ。帯つきの図は帯の内側の影の根に描く */
const figuresDrawn = (page: Page): Promise<unknown> =>
  page
    .waitForFunction(
      () => {
        const visible = (el: Element): boolean => (el as HTMLElement).checkVisibility();
        if ([...document.querySelectorAll("pre.dragon")].some(visible)) return false;
        const figures = [...document.querySelectorAll(".dragon-figure")].filter(visible);
        return figures.every((f) => (f.querySelector(".dragon-frame")?.shadowRoot ?? f).querySelector('[data-dragon="player"] svg') !== null);
      },
      null,
      { timeout: WAIT },
    )
    .catch(() => undefined);

/** 頁が横にはみ出す幅。はみ出さない時は 0 */
const overflow = (page: Page): Promise<number> => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);

/** 見えている字の大きさのうち、最も小さい物と、`READABLE_PX` より小さい字を持つ要素 */
const smallText = (page: Page, readable: number): Promise<{ min: number; small: string[] }> =>
  page.evaluate((limit) => {
    let min = Number.POSITIVE_INFINITY;
    const small: string[] = [];
    for (const el of document.body.querySelectorAll<HTMLElement>("*")) {
      if (el.closest("script,style,pre.dragon,.dragon-figure")) continue;
      const own = [...el.childNodes].some((n) => n.nodeType === 3 && (n.textContent ?? "").trim() !== "");
      if (!own || !el.checkVisibility()) continue;
      const px = Number.parseFloat(getComputedStyle(el).fontSize);
      min = Math.min(min, px);
      if (px < limit) small.push(`${el.tagName.toLowerCase()}.${el.className} ${px}px ${(el.textContent ?? "").trim().slice(0, 20)}`);
    }
    return { min, small };
  }, readable);

/** 見本のmdを書き出し、頁を`viewport`の大きさで開いて`run`を回す。書き出せない時は判定の文で落とす */
async function openGuide<T>(run: (page: Page) => Promise<T>, viewport: { width: number; height: number }): Promise<T | undefined> {
  const exportPage = await exportPageTool();
  if (!exportPage) return undefined;
  const md = writeGuide();
  const path = expectWritten(await exportPage(md));
  if (path === "") return undefined;
  return within(withSite({ "notes.html": readFileSync(path, "utf8") }, "notes.html", run, viewport), PAGE_LIMIT_MS, "説明の頁の仕事");
}

/** 節の上の縁の、画面の上の縁からの位置 */
const sectionTop = (page: Page, title: string): Promise<number | undefined> =>
  page.evaluate((t) => {
    const sec = [...document.querySelectorAll(".pg-sec")].find((s) => (s.querySelector(".pg-sec-title")?.textContent ?? "").replace(/\s+/gu, " ").trim().endsWith(t));
    return sec?.getBoundingClientRect().top;
  }, title);

/** 押す動きを 1 つの頁で順に測る。印刷の形は最後に切り替える */
const PRESSED = await atLoad("説明の頁を開き、問いと確かめる問いと用語の下線を押してから印刷の形にする", () =>
  openGuide(
    async (page) => {
      const step = inOrder();
      const stack = await step("最初のタブの節の並びを測る", async () => {
        await figuresDrawn(page);
        return page.evaluate(() =>
          [...document.querySelectorAll<HTMLElement>(".pg-sec")]
            .filter((s) => s.checkVisibility())
            .map((s) => {
              const r = s.getBoundingClientRect();
              return { left: Math.round(r.left), top: Math.round(r.top + scrollY), bottom: Math.round(r.bottom + scrollY) };
            }),
        );
      });
      const list = await step("最初のタブの問いの一覧を読む", () =>
        page.evaluate(() =>
          [...document.querySelectorAll<HTMLElement>(".pg-qlist")]
            .filter((l) => l.checkVisibility())
            .map((l) => ({
              heading: (l.querySelector(".pg-qlist-h")?.textContent ?? "").trim(),
              items: [...l.querySelectorAll("a")].map((a) => (a.textContent ?? "").replace(/\s+/gu, " ").trim()),
            })),
        ),
      );
      const jumped = await step("2つ目の問いを押し、その節が画面の上に来るのを待つ", async () => {
        const before = await sectionTop(page, "どの順で確かめるのか");
        await page.locator(".pg-qlist a:visible", { hasText: "どの順で確かめるのか" }).click({ timeout: WAIT });
        const after = await readUntil(() => sectionTop(page, "どの順で確かめるのか"), (top) => top !== undefined && top >= 0 && top < 60, WAIT);
        return { before, after, hash: await page.evaluate(() => decodeURIComponent(location.hash)) };
      });
      const quiz = await step("確かめる問いの答えを押して開き、もう一度押して隠す", async () => {
        await page.evaluate(() => scrollTo(0, 0));
        const read = () =>
          page.evaluate(() =>
            [...document.querySelectorAll<HTMLElement>(".pg-q")]
              .filter((q) => q.checkVisibility())
              .map((q) => ({ question: (q.querySelector(".pg-q-text")?.textContent ?? "").trim(), shown: q.querySelector<HTMLElement>(".pg-q-a")?.checkVisibility() ?? false })),
          );
        const first = await read();
        const button = page.locator(".pg-q:visible .pg-q-btn").first();
        await button.click({ timeout: WAIT });
        const opened = await readUntil(read, (qs) => qs[0]?.shown === true, WAIT);
        const answer = await page.locator(".pg-q:visible .pg-q-a").first().textContent({ timeout: WAIT });
        await button.click({ timeout: WAIT });
        const closed = await readUntil(read, (qs) => qs[0]?.shown === false, WAIT);
        return { first, opened, answer: (answer ?? "").trim(), closed };
      });
      const term = await step("用語の下線を押して札を開き、閉じる", async () => {
        const link = page.locator(".pg-sec:visible .pg-answer .pg-term", { hasText: "エージェント" }).first();
        const underline = await link.evaluate((el) => getComputedStyle(el).textDecorationLine);
        const card = () =>
          page.evaluate(() =>
            [...document.querySelectorAll<HTMLElement>('[role="dialog"]')]
              .filter((c) => c.checkVisibility())
              .map((c) => {
                const r = c.getBoundingClientRect();
                const example = c.querySelector<HTMLElement>(".pg-tc-e");
                return {
                  label: c.getAttribute("aria-label"),
                  name: (c.querySelector(".pg-tc-n")?.textContent ?? "").trim(),
                  text: (c.querySelector(".pg-tc-t")?.textContent ?? "").trim(),
                  example: (example?.textContent ?? "").trim(),
                  bandDiffers: example !== null && getComputedStyle(example).backgroundColor !== getComputedStyle(c).backgroundColor,
                  top: r.top,
                  left: r.left,
                  right: r.right,
                };
              }),
          );
        const before = await card();
        await link.click({ timeout: WAIT });
        const opened = await readUntil(card, (cards) => cards.length === 1, WAIT);
        const anchor = await link.evaluate((el) => {
          const r = el.getBoundingClientRect();
          const sec = el.closest(".pg-sec")?.getBoundingClientRect();
          return { bottom: r.bottom, secLeft: sec?.left ?? 0, secRight: sec?.right ?? 0 };
        });
        await page.locator('[role="dialog"]:visible .pg-tc-x').click({ timeout: WAIT });
        const closedByIcon = await readUntil(card, (cards) => cards.length === 0, WAIT);
        await link.click({ timeout: WAIT });
        await readUntil(card, (cards) => cards.length === 1, WAIT);
        await page.locator("h1").click({ timeout: WAIT });
        const closedOutside = await readUntil(card, (cards) => cards.length === 0, WAIT);
        await link.click({ timeout: WAIT });
        await readUntil(card, (cards) => cards.length === 1, WAIT);
        await link.click({ timeout: WAIT });
        const closedAgain = await readUntil(card, (cards) => cards.length === 0, WAIT);
        return { underline, before, opened, anchor, closedByIcon, closedOutside, closedAgain };
      });
      const other = await step("2つ目のタブを押し、その問いの一覧の問いを押す", async () => {
        await page.locator('.pg-topics [role="tab"]', { hasText: "記録" }).click({ timeout: WAIT });
        const items = await readUntil(
          () => page.evaluate(() => [...document.querySelectorAll<HTMLElement>(".pg-qlist a")].filter((a) => a.checkVisibility()).map((a) => (a.textContent ?? "").replace(/\s+/gu, " ").trim())),
          (shown) => shown.length > 0,
          WAIT,
        );
        await page.locator(".pg-qlist a:visible", { hasText: "どこに残すのか" }).click({ timeout: WAIT });
        const top = await readUntil(() => sectionTop(page, "どこに残すのか"), (at) => at !== undefined && at >= 0 && at < 60, WAIT);
        return { items, top, hash: await page.evaluate(() => decodeURIComponent(location.hash)) };
      });
      const printed = await step("最初のタブへ戻り、印刷の形で札と答えを読む", async () => {
        await page.locator('.pg-topics [role="tab"]', { hasText: "止める仕組み" }).click({ timeout: WAIT });
        await figuresDrawn(page);
        await page.emulateMedia({ media: "print" });
        return {
          terms: await deepAll(page, ".pg-topic:not([hidden]) .pg-tc"),
          answers: await deepAll(page, ".pg-topic:not([hidden]) .pg-q-a"),
          boxes: await deepAll(page, '[data-dragon="note-card"]'),
        };
      });
      return { stack, list, jumped, quiz, term, other, printed };
    },
    { width: 1200, height: 500 },
  ),
);

/** 幅`width`の枠で、最初のタブの札と答えを開いた形と用語のタブの字の大きさとはみ出す幅を測る */
const measureAt = async (page: Page, width: number) => {
  // 前の幅で開いた札と答えを閉じた形から測るため、読み直す
  await page.setViewportSize({ width, height: 900 });
  await page.reload({ timeout: ACTION_LIMIT_MS });
  await figuresDrawn(page);
  await page.locator(".pg-q:visible .pg-q-btn").first().click({ timeout: WAIT });
  await page.locator(".pg-sec:visible .pg-term").first().click({ timeout: WAIT });
  const topic = { text: await smallText(page, READABLE_PX), overflow: await overflow(page) };
  await page.locator('.pg-topics [role="tab"]', { hasText: "用語" }).click({ timeout: WAIT });
  const glossary = { text: await smallText(page, READABLE_PX), overflow: await overflow(page) };
  await page.locator('.pg-topics [role="tab"]', { hasText: "止める仕組み" }).click({ timeout: WAIT });
  return { topic, glossary };
};

const MEASURED = await atLoad("説明の頁を幅728pxと幅390pxで開き、字の大きさとはみ出す幅を測る", () =>
  openGuide(
    async (page) => {
      const step = inOrder();
      const wide = await step("幅728pxで測る", () => measureAt(page, 728));
      const phone = await step("幅390pxで測る", () => measureAt(page, 390));
      return { wide, phone };
    },
    { width: 728, height: 900 },
  ),
);

describe("説明の頁 (#3876)", () => {
  it("guide-sections-stack-in-topic-tabs", async () => {
    const doc = await exportedGuide();
    if (!doc) return;
    expect(doc.body.classList.contains("pg-layout-guide"), "layout: guide の頁の組み立て").toBe(true);
    expect(topicsOf(doc), "## の話題のタブと、タブの中の ### の番号つきの節").toEqual([
      {
        tab: "止める仕組み",
        sections: [
          { number: "1", title: "何を止めるのか", hidden: false },
          { number: "2", title: "どの順で確かめるのか", hidden: false },
        ],
      },
      { tab: "記録", sections: [{ number: "1", title: "どこに残すのか", hidden: false }] },
      { tab: "用語", sections: [] },
    ]);
    const seen = PRESSED.get();
    if (!seen) return;
    const stack = seen.stack.get();
    expect(stack.length, "最初のタブで見えている節の数").toBe(2);
    expect(stack[1]!.left, "2つ目の節が1つ目の節と同じ左の縁に並ばない").toBe(stack[0]!.left);
    expect(stack[1]!.top, "2つ目の節が1つ目の節の下に積まれない").toBeGreaterThanOrEqual(stack[0]!.bottom);
    // 見本の英語と日本語の頁も、話題のタブと節を持つ頁に書き出せる
    const exportPage = await exportPageTool();
    if (!exportPage) return;
    const names = existsSync(EXAMPLES) ? readdirSync(EXAMPLES).filter((name) => name.endsWith(".md")).sort() : [];
    expect(names, "説明の頁の見本の英語と日本語のmdと用語のfile").toEqual([...EXAMPLE_GLOSSARIES, ...EXAMPLE_PAGES].sort());
    for (const name of EXAMPLE_PAGES) {
      const out = tempDir("guide-example");
      const result = await exportPage(join(EXAMPLES, name), { outDir: out });
      expect(result, `見本 ${name} を書き出せない`).toEqual({ ok: true, path: join(out, name.replace(/\.md$/u, ".html")) });
      if (!result.ok) continue;
      const topics = topicsOf(documentOf(result.path));
      expect(topics.length, `見本 ${name} の話題のタブの数`).toBeGreaterThanOrEqual(3);
      expect(topics[0]!.sections.length, `見本 ${name} の最初のタブの節の数`).toBeGreaterThanOrEqual(2);
    }
  });

  it("guide-question-list-jumps-to-section", () => {
    const seen = PRESSED.get();
    if (!seen) return;
    expect(seen.list.get(), "最初のタブの頭の問いの一覧").toEqual([
      { heading: "このタブで答える問い", items: ["1 何を止めるのか", "2 どの順で確かめるのか"] },
    ]);
    const jumped = seen.jumped.get();
    expect(jumped.before ?? 0, "押す前から2つ目の節が画面の上に在り、移ったかを測れない").toBeGreaterThan(500);
    expect(jumped.after ?? -1, "2つ目の問いを押しても、その節が画面の上へ来ない").toBeGreaterThanOrEqual(0);
    expect(jumped.after ?? 999, "2つ目の問いを押しても、その節が画面の上へ来ない").toBeLessThan(60);
    expect(jumped.hash, "移った節の場所の名前が頁のURLに残らない").toBe("#どの順で確かめるのか");
    const other = seen.other.get();
    expect(other.items, "2つ目のタブの頭の問いの一覧").toEqual(["1 どこに残すのか"]);
    expect(other.top ?? 999, "2つ目のタブの問いを押しても、その節が画面の上へ来ない").toBeLessThan(60);
    expect(other.hash, "2つ目のタブの移った節の場所の名前").toBe("#どこに残すのか");
  });

  it("guide-answer-from-quote-after-title", async () => {
    const doc = await exportedGuide();
    if (!doc) return;
    const first = sectionOf(doc, "何を止めるのか");
    const answer = first?.querySelector(".pg-answer");
    expect(squash(answer?.textContent), "題の直後の引用の答え").toBe("エージェントが作った送金のうち、規則に合わない物を止める。");
    expect(answer?.previousElementSibling?.classList.contains("pg-sec-title"), "答えが題のすぐ下に出ない").toBe(true);
    expect(
      [...(first?.querySelectorAll("blockquote") ?? [])].map((q) => squash(q.textContent)),
      "題の直後でない引用",
    ).toEqual(["止めた送金は記録に残る。"]);
    const second = sectionOf(doc, "どの順で確かめるのか");
    expect(second?.querySelector(".pg-answer"), "題の直後が段落の節に答えが出た").toBeNull();
    expect(
      [...(second?.querySelectorAll("blockquote") ?? [])].map((q) => squash(q.textContent)),
      "段落の後の引用",
    ).toEqual(["順は変えられない。"]);
  });

  it("guide-quiz-hides-answer-until-pressed", () => {
    const seen = PRESSED.get();
    if (!seen) return;
    const quiz = seen.quiz.get();
    expect(quiz.first, "押す前の確かめる問い").toEqual([
      { question: "35を送る依頼はどうなるか", shown: false },
      { question: "期限を過ぎた依頼はどうなるか", shown: false },
    ]);
    expect(quiz.opened, "押した問いの答えだけが開かない").toEqual([
      { question: "35を送る依頼はどうなるか", shown: true },
      { question: "期限を過ぎた依頼はどうなるか", shown: false },
    ]);
    expect(quiz.answer, "開いた答えの字").toBe("止まる。1回の上限30を超える。");
    expect(quiz.closed.map((q) => q.shown), "もう一度押しても答えが隠れない").toEqual([false, false]);
  });

  it("guide-term-link-opens-card", () => {
    const seen = PRESSED.get();
    if (!seen) return;
    const term = seen.term.get();
    expect(term.underline, "用語のリンクに下線が無い").toContain("underline");
    expect(term.before, "押す前に札が開いている").toEqual([]);
    expect(
      term.opened.map(({ label, name, text, example, bandDiffers }) => ({ label, name, text, example, bandDiffers })),
      "押した用語の札",
    ).toEqual([{ label: "エージェント", name: "エージェント", text: "利用者に代わって送金を組み立てるプログラム。", example: "毎朝の支払いを自動で頼む", bandDiffers: true }]);
    const card = term.opened[0]!;
    expect(card.top - term.anchor.bottom, "札の上の縁が下線のすぐ下に無い").toBeGreaterThanOrEqual(0);
    expect(card.top - term.anchor.bottom, "札の上の縁が下線のすぐ下に無い").toBeLessThanOrEqual(CARD_GAP_MAX);
    expect(card.left, "札が節の左へはみ出す").toBeGreaterThanOrEqual(term.anchor.secLeft - 0.5);
    expect(card.right, "札が節の右へはみ出す").toBeLessThanOrEqual(term.anchor.secRight + 0.5);
    expect(term.closedByIcon, "閉じるのアイコンを押しても札が閉じない").toEqual([]);
    expect(term.closedOutside, "札の外を押しても札が閉じない").toEqual([]);
    expect(term.closedAgain, "同じ下線をもう一度押しても札が閉じない").toEqual([]);
  });

  it("guide-glossary-file-becomes-tab", async () => {
    const doc = await exportedGuide();
    if (!doc) return;
    const tab = [...doc.querySelectorAll('.pg-topics [role="tab"]')].find((t) => squash(t.textContent) === "用語");
    expect(tab, "用語のfileを読み込んだ「用語」のタブが無い").toBeDefined();
    const panel = doc.getElementById(tab?.getAttribute("aria-controls") ?? "");
    expect(
      [...(panel?.querySelectorAll(".pg-gl") ?? [])].map((entry) => ({
        name: squash(entry.querySelector(".pg-gl-n")?.textContent),
        text: squash(entry.querySelector(".pg-gl-t")?.textContent),
        example: squash(entry.querySelector(".pg-gl-e")?.textContent),
      })),
      "「用語」のタブに用語ごとに並ぶ説明と例",
    ).toEqual([
      { name: "エージェント", text: "利用者に代わって送金を組み立てるプログラム。", example: "毎朝の支払いを自動で頼む" },
      { name: "規則", text: "宛先と額と期限の組。", example: "1回30まで" },
      { name: "記録", text: "確かめた結果を並べた物。", example: "止めた送金と理由" },
    ]);
    expect(doc.querySelectorAll(".pg-include, img").length, "用語のfileを読み込む行が載せたfileか画像として出た").toBe(0);
  });

  it("guide-print-opens-cards-and-answers", () => {
    const seen = PRESSED.get();
    if (!seen) return;
    const printed = seen.printed.get();
    expect(printed.terms.length, "印刷の形の最初のタブの用語の札の数").toBe(2);
    expect(printed.terms.filter((c) => !c.visible).map((c) => c.text), "印刷の形で開かない用語の札").toEqual([]);
    expect(printed.answers.length, "印刷の形の最初のタブの確かめる問いの答えの数").toBe(2);
    expect(printed.answers.filter((a) => !a.visible).map((a) => a.text), "印刷の形で開かない確かめる問いの答え").toEqual([]);
    expect(printed.boxes.length, "印刷の形の図の箱の札の数").toBe(2);
    expect(printed.boxes.filter((b) => !b.visible).map((b) => b.text), "印刷の形で開かない箱の札").toEqual([]);
  });

  it("guide-readable-and-fits", () => {
    const seen = MEASURED.get();
    if (!seen) return;
    for (const [width, at] of [
      [728, seen.wide],
      [390, seen.phone],
    ] as const) {
      const { topic, glossary } = at.get();
      expect(topic.text.small, `幅${width}pxの最初のタブで${READABLE_PX}pxより小さい字`).toEqual([]);
      expect(topic.overflow, `幅${width}pxの最初のタブが横にはみ出す`).toBe(0);
      expect(glossary.text.small, `幅${width}pxの用語のタブで${READABLE_PX}pxより小さい字`).toEqual([]);
      expect(glossary.overflow, `幅${width}pxの用語のタブが横にはみ出す`).toBe(0);
    }
  });

  it("guide-term-twice-or-missing-refused", async () => {
    const exportPage = await exportPageTool();
    if (!exportPage) return;
    const twice = `${GLOSSARY}\n### 規則\n\n2度目の説明。\n`;
    const twiceLine = twice.split("\n").lastIndexOf("### 規則") + 1;
    const missing = GUIDE.replace("[規則](glossary.md#規則)", "[署名](glossary.md#署名)");
    const missingLine = missing.split("\n").findIndex((line) => line.includes("glossary.md#署名")) + 1;
    const cases: [string, Record<string, string>, { file: string; line: number }, string][] = [
      ["用語のfileに同じ用語を2度書いた", { "glossary.md": twice }, { file: "glossary.md", line: twiceLine }, "規則"],
      ["用語のfileに無い用語へのリンク", { "notes.md": missing }, { file: "notes.md", line: missingLine }, "署名"],
    ];
    for (const [name, files, where, word] of cases) {
      const md = writeGuide(files);
      const result = await exportPage(md);
      expect(result.ok, `${name} 頁を書き出した`).toBe(false);
      const errors = result.ok ? [] : result.errors;
      expect(errors.map((e) => ({ file: basename(e.file), line: e.line })), `${name} 行`).toEqual([where]);
      expect(errors[0]?.message ?? "", `${name} 断りの文が用語を名指さない`).toContain(word);
      expect(existsSync(join(dirname(md), "notes.html")), `${name} のに頁を書いた`).toBe(false);
    }
  });
});
