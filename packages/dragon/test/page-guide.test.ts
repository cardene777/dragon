/**
 * mdから書き出す説明の頁 (`layout: guide`、#3876)。
 *
 * 頭の行に`layout: guide`を書いたmdは、`##`が話題、`###`が話題の中に番号つきで縦に積む節になり、話題が1つの頁は1つの頁に続けて積む (#3961)。
 * 話題が2つ以上の頁は、頁の題と頭の中身と全体像の頭の頁と、問いごとの頁に分け、目次の問いと頁の下の前と次のlinkで頁を切り替える (#3983)。
 * 左の目次が全ての話題と問いを並べ、問いを押すとその節へ移る。節の番号は話題ごとに1から数え直し、`話題の番号-問いの番号`で出す (#3969)。
 * 節の題の直後の引用は題の下の答えになり、`<details>`と`<summary>`は答えを押すまで隠す確かめる問いになる。
 * 頁の頭の`![用語](glossary.md)`の行で読み込んだ用語のfileは頁の終わりの「用語」の話題になり、本文の`[用語](glossary.md#用語)`のリンクは押すと札が開く下線になる。
 * 印刷の形では、用語の札と箱の札と確かめる問いの答えが全て開き、左の目次を隠す。
 * 印刷の形では、全ての話題の節を書いた順に並べ、各話題を新しい紙から始めて紙の上に話題の名前を出す。
 * 箱の札は図に重ねず図の下に箱の名前と並べ、段のある図は全ての段の止め絵と段の say の文を並べる (#3956)。
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

/** 説明の頁の見本の置き場。英語と日本語の頁と、それぞれが読み込む用語のfile。package の根を歩かないよう、置き場を 1 つの字で書く */
const EXAMPLES = join(process.cwd(), "packages/dragon/examples/guide");
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

/** 図の段の say の文。印刷の形で段ごとの止め絵の下に出る */
const SAYS = ["エージェントが送金を確かめる所へ送る。", "規則に合う送金を署名する所へ通す。"];

/** 1つ目の話題の頭の中身。話題の最初の問いの頁だけが見せる (#3983) */
const TOPIC_LEAD = "止める所と確かめる順を、問いごとに見る。";

/** 説明の頁のmd。`note: pop` で図の箱の説明を札で見せる。話題は2つで、用語の話題を足して3つになる */
const GUIDE = `---
layout: guide
note: pop
---

# 送金の確かめ方

送金を止める仕組みを、問いごとに読む。

![用語](glossary.md)

## 止める仕組み

${TOPIC_LEAD}

### 何を止めるのか

> [エージェント](glossary.md#エージェント)が作った送金のうち、[規則](glossary.md#規則)に合わない物を止める。

\`\`\`dragon
architecture どこで止めるのか

box agent as エージェント [note: 送金を作る, example: 毎朝の支払い]
box check as 確かめる所 [note: 規則と照らす]
box signer as 署名する所

step 送る
  say エージェントが送金を確かめる所へ送る。
  agent -> check: 送金
step 通す
  say 規則に合う送金を署名する所へ通す。
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

/** 「記録」の説明に「規則」の用語へのlinkを持つ用語のfile。札の中のlinkから用語の頁へ移るのを測るため (#3983) */
const GLOSSARY_LINKED = GLOSSARY.replace("確かめた結果を並べた物。", "確かめた結果を並べた物。[規則](glossary.md#規則)に合わない送金も残す。");

/** 説明の頁のmdと、説明の中にlinkを持つ用語のfileを一時のdirに書き、mdのpathを返す (#3983) */
const writeLinkedGuide = (): string => writeGuide({ "glossary.md": GLOSSARY_LINKED });

/** 左の目次と全体像の頁の節を縦に長くする箇条書き。下へ送ると今読んでいる問いが変わるのを測るため、節を画面の高さより長くする */
const LONG_FILLER = Array.from({ length: 24 }, (_, n) => `- 照らす段${n + 1}`).join("\n");

/**
 * 左の目次と全体像の頁のmd (#3961)。頭の段落の後の図が頁の頭の全体像になり、`##`の話題を3つ、`###`の問いを5つ書く。
 * 1つ目と3つ目と5つ目の問いは`[menu: 短い名前]`で目次の名前を短くし、2つ目と4つ目の問いは書かない
 */
const MENU_GUIDE = `---
layout: guide
---

# 送金の止め方

送金が通る道の全体を見てから、問いごとに読む。

\`\`\`dragon
architecture 送金が通る道

box agent as エージェント
box check as 確かめる所
box signer as 署名する所

step 送る
  agent -> check: 送金
step 通す
  check -> signer: 合う送金
\`\`\`

## 止める仕組み

### エージェントが作った送金のうち、規則に合わない物はどこで止まるのか [menu: 止める場所]

> 確かめる所で止まり、署名する所へは届かない。

${LONG_FILLER}

### 宛先と額と期限は、1回の送金でどの順に照らし合わせるのか

> 宛先、額、期限の順に照らす。

${LONG_FILLER}

## 記録

### 止めた送金とその理由は、後から誰がどこで読めるのか [menu: 記録の読み手]

> 記録の一覧に残り、利用者が読める。

${LONG_FILLER}

### 記録に残した送金は、後から消したり書き換えたりできるのか

> できない。記録は足すだけで、消さない。

${LONG_FILLER}

## 送り直す仕組み

### 止めた送金は、規則を直した後でもう一度送れるのか [menu: 送り直し]

> 送れる。直した規則で初めから確かめ直す。

${LONG_FILLER}
`;

/** 左の目次と全体像の頁の問いの全文。書いた順 */
const MENU_QUESTIONS = [
  "エージェントが作った送金のうち、規則に合わない物はどこで止まるのか",
  "宛先と額と期限は、1回の送金でどの順に照らし合わせるのか",
  "止めた送金とその理由は、後から誰がどこで読めるのか",
  "記録に残した送金は、後から消したり書き換えたりできるのか",
  "止めた送金は、規則を直した後でもう一度送れるのか",
];

/** 左の目次と全体像の頁のmdを一時のdirに書き、mdのpathを返す */
function writeMenuGuide(files: Readonly<Record<string, string>> = {}): string {
  const root = tempDir("guide-menu");
  writeFiles(root, { "notes.md": MENU_GUIDE, ...files });
  return join(root, "notes.md");
}

/** 左の目次と全体像の頁のmdから2つ目と3つ目の話題の見出しを外し、5つの問いを1つの話題に入れたmd。話題が1つの頁は全ての節を1つの頁に積む (#3983) */
const STACK_GUIDE = MENU_GUIDE.replace("## 記録\n\n", "").replace("## 送り直す仕組み\n\n", "");

/** 話題が1つの頁のmdを一時のdirに書き、mdのpathを返す (#3983) */
function writeStackGuide(): string {
  const root = tempDir("guide-stack");
  writeFiles(root, { "notes.md": STACK_GUIDE });
  return join(root, "notes.md");
}

/** 全体像の頁の、図の前に書いた頭の文 (#3969) */
const BEFORE_FIGURE = "送金が通る道の全体を見てから、問いごとに読む。";
/** 全体像の頁の、図の後に書いた段落。書いた順。1つ目は用語のリンクを持つ (#3969) */
const AFTER_FIGURE = ["エージェントが作った送金は、確かめる所で規則と照らしてから署名する所へ届く。", "止めた送金は、理由と共に記録の一覧に残る。"];

/**
 * 全体像の図の後の段落と、話題ごとに数え直す問いの番号を確かめる頁のmd (#3969)。
 * 頭の文の後に用語のfileを読み込み、図の後に段落を2つ書く。話題は3つで、問いは2つ、1つ、2つ
 */
const OVERVIEW_GUIDE = `---
layout: guide
---

# 送金の止め方

${BEFORE_FIGURE}

![用語](glossary.md)

\`\`\`dragon
architecture 送金が通る道

box agent as エージェント
box check as 確かめる所
box signer as 署名する所

step 送る
  agent -> check: 送金
step 通す
  check -> signer: 合う送金
\`\`\`

[エージェント](glossary.md#エージェント)が作った送金は、確かめる所で規則と照らしてから署名する所へ届く。

${AFTER_FIGURE[1]}

## 止める仕組み

### エージェントが作った送金のうち、規則に合わない物はどこで止まるのか [menu: 止める場所]

> 確かめる所で止まり、署名する所へは届かない。

### 宛先と額と期限は、1回の送金でどの順に照らし合わせるのか

> 宛先、額、期限の順に照らす。

## 記録

### 止めた送金とその理由は、後から誰がどこで読めるのか

> 記録の一覧に残り、利用者が読める。

## 送り直す仕組み

### 止めた送金は、規則を直した後でもう一度送れるのか

> 送れる。直した規則で初めから確かめ直す。

### 送り直した送金は、前に止めた記録とどう繋がるのか

> 記録に前の送金の番号を残す。
`;

/** 全体像の段落と章ごとの番号を確かめる頁のmdと用語のfileを一時のdirに書き、mdのpathを返す */
function writeOverviewGuide(files: Readonly<Record<string, string>> = {}): string {
  const root = tempDir("guide-overview");
  writeFiles(root, { "notes.md": OVERVIEW_GUIDE, "glossary.md": GLOSSARY, ...files });
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

/** 話題 (`section.pg-topic`) の頭の題 (`h2.pg-topic-title`) と、話題ごとの節の番号 (`話題の番号-問いの番号`) と題と、隠した節か */
function topicsOf(doc: Document): { topic: string; sections: { number: string; title: string; hidden: boolean }[] }[] {
  return [...doc.querySelectorAll("section.pg-topic")].map((topic) => ({
    topic: squash(topic.querySelector(":scope > h2.pg-topic-title")?.textContent),
    sections: [...topic.querySelectorAll(".pg-sec")].map((sec) => ({
      number: squash(sec.querySelector(".pg-sec-title .pg-num")?.textContent),
      title: squash(sec.querySelector(".pg-sec-title")?.textContent).replace(/^\d+-\d+\s*/u, ""),
      hidden: sec.closest("[hidden]") !== null,
    })),
  }));
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

/** `write`が書いた見本のmd (既定は`writeGuide`) を書き出し、頁を`viewport`の大きさで開いて`run`を回す。書き出せない時は判定の文で落とす */
async function openGuide<T>(run: (page: Page) => Promise<T>, viewport: { width: number; height: number }, write: () => string = writeGuide): Promise<T | undefined> {
  const exportPage = await exportPageTool();
  if (!exportPage) return undefined;
  const md = write();
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

/** 印刷の形で段の止め絵が見えるまで待つ。止め絵は印刷の形に切り替わった時に作る。待ちきれなくても投げず、判定に任せる */
const stillsShown = (page: Page): Promise<unknown> =>
  page
    .waitForFunction(
      () => {
        const walk = (root: Document | ShadowRoot): boolean =>
          [...root.querySelectorAll<HTMLElement>('[data-dragon="step-still"]')].some((el) => el.checkVisibility()) ||
          [...root.querySelectorAll("*")].some((host) => host.shadowRoot !== null && walk(host.shadowRoot));
        return walk(document);
      },
      null,
      { timeout: WAIT },
    )
    .catch(() => undefined);

/**
 * 印刷の形の頁で、話題ごとの面と節、箱の札と同じ図の絵、段の止め絵を読む (#3956)。
 * 話題の名前は左の目次 (印刷の形では隠す) の話題の行から読み、行が指す話題の面を読む (#3961)
 */
const printedPage = async (page: Page) => {
  await stillsShown(page);
  return page.evaluate(() => {
    const squash = (text: string | null | undefined): string => (text ?? "").replace(/\s+/gu, " ").trim();
    const deep = (selector: string): Element[] => {
      const out: Element[] = [];
      const walk = (root: Document | ShadowRoot): void => {
        out.push(...root.querySelectorAll(selector));
        for (const host of root.querySelectorAll("*")) if (host.shadowRoot) walk(host.shadowRoot);
      };
      walk(document);
      return out;
    };
    const shown = (el: Element): boolean => (el as HTMLElement).checkVisibility();
    const rect = (el: Element) => {
      const r = el.getBoundingClientRect();
      return { left: r.left, top: r.top, right: r.right, bottom: r.bottom };
    };
    const topics = [...document.querySelectorAll("nav.pg-menu .pg-menu-topic")].map((tab) => {
      let id = (tab.getAttribute("href") ?? "").slice(1);
      try {
        id = decodeURIComponent(id);
      } catch {
        // 読めない`%`はそのままの字で探す
      }
      const panel = document.getElementById(id);
      // 面の中で最初に見える字。紙の上の見出し
      let head = "";
      for (const el of panel?.querySelectorAll<HTMLElement>("*") ?? []) {
        const own = [...el.childNodes].some((n) => n.nodeType === 3 && (n.textContent ?? "").trim() !== "");
        if (own && el.checkVisibility()) {
          head = squash(el.textContent);
          break;
        }
      }
      return {
        name: squash(tab.textContent),
        shown: panel ? shown(panel) : false,
        breakBefore: panel ? getComputedStyle(panel).breakBefore : "",
        head,
        sections: [...(panel?.querySelectorAll(".pg-sec") ?? [])].filter(shown).map((sec) => squash(sec.querySelector(".pg-sec-title")?.textContent)),
      };
    });
    const written = [...document.querySelectorAll(".pg-sec")].map((sec) => squash(sec.querySelector(".pg-sec-title")?.textContent));
    const notes = deep('[data-dragon="note-card"]').map((card) => {
      const player = card.closest('[data-dragon="player"]');
      return {
        shown: shown(card),
        name: squash(card.querySelector('[data-dragon="note-name"]')?.textContent),
        card: rect(card),
        figures: player ? [...player.querySelectorAll('svg[data-dragon="figure"]')].filter(shown).map(rect) : [],
      };
    });
    const stills = deep('[data-dragon="step-still"]')
      .filter(shown)
      .map((still) =>
        squash(
          [...still.childNodes]
            .filter((node) => !(node instanceof SVGElement) && !(node instanceof Element && node.querySelector("svg")))
            .map((node) => node.textContent ?? "")
            .join(" "),
        ),
      );
    return { topics, written, notes, stills };
  });
};

/** 開いている用語の札 (`[role="dialog"]`) の名前と説明と例、例の帯の色が札と違うか、札の縁 */
const openedCards = (page: Page) =>
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

/**
 * 今見えている頁の形 (#3983)。URLの`#`の後ろ、見えている節の番号と題、見えている話題の題と話題の頭の中身、頁の題と頭の中身と全体像が見えるか、
 * 目次の印の行き先、見えている前と次のlinkの向きと行き先と字、見えている話題の道筋の行き先
 */
const pageState = (page: Page) =>
  page.evaluate(() => {
    const sq = (text: string | null | undefined): string => (text ?? "").replace(/\s+/gu, " ").trim();
    const vis = (el: Element | null): boolean => el !== null && (el as HTMLElement).checkVisibility();
    const dec = (href: string): string => {
      try {
        return decodeURIComponent(href);
      } catch {
        return href;
      }
    };
    return {
      hash: dec(location.hash),
      sections: [...document.querySelectorAll(".pg-sec")]
        .filter(vis)
        .map((sec) => `${sq(sec.querySelector(".pg-sec-title .pg-num")?.textContent)} ${sq(sec.querySelector(".pg-sec-title > span:last-child")?.textContent)}`),
      topics: [...document.querySelectorAll("section.pg-topic")].filter(vis).map((topic) => sq(topic.querySelector(":scope > h2.pg-topic-title")?.textContent)),
      leads: [...document.querySelectorAll(".pg-topic-lead")].filter(vis).map((lead) => sq(lead.textContent)),
      head: { title: vis(document.querySelector("h1")), lead: vis(document.querySelector(".pg-top .pg-lead")), overview: vis(document.querySelector("section.pg-overview")) },
      marks: [...document.querySelectorAll('nav.pg-menu [aria-current="true"]')].map((a) => dec(a.getAttribute("href") ?? "")),
      pager: [...document.querySelectorAll(".pg-pager a")]
        .filter(vis)
        .map((a) => ({ rel: a.classList.contains("pg-pager-prev") ? "prev" : "next", href: dec(a.getAttribute("href") ?? ""), text: sq(a.textContent) })),
      route: [...document.querySelectorAll("ol.pg-route a")].filter(vis).map((a) => dec(a.getAttribute("href") ?? "")),
    };
  });

/** 押す動きを 1 つの頁で順に測る。話題が2つ以上の頁なので、頭の頁から問いの頁へ移って押す。印刷の形は最後に切り替える */
const PRESSED = await atLoad("説明の頁を開き、左の目次の問いと前と次のlinkと確かめる問いと用語の下線を押してから印刷の形にする", () =>
  openGuide(
    async (page) => {
      const step = inOrder();
      const start = await step("頁を開いた時の、見えている節と頁の題と頭の中身と話題の道筋を読む", async () => {
        await figuresDrawn(page);
        return pageState(page);
      });
      const list = await step("左の目次の話題と問いを読む", () =>
        page.evaluate(() => {
          // 問いは、書いた順で前の話題に入れる
          const text = (part: Element | null): string => (part?.textContent ?? "").replace(/\s+/gu, " ").trim();
          const groups: { topic: string; items: { number: string; name: string }[] }[] = [];
          for (const el of document.querySelectorAll<HTMLElement>("nav.pg-menu .pg-menu-topic, nav.pg-menu a.pg-menu-q")) {
            if (!el.checkVisibility()) continue;
            if (el.matches(".pg-menu-topic")) groups.push({ topic: text(el), items: [] });
            else groups[groups.length - 1]?.items.push({ number: text(el.querySelector(".pg-num")), name: text(el.querySelector(".pg-menu-name")) });
          }
          return groups;
        }),
      );
      const jumped = await step("左の目次で2つ目の問いを押し、その問いの頁に切り替わるのを待つ", async () => {
        await page.locator("nav.pg-menu a.pg-menu-q", { hasText: "どの順で確かめるのか" }).click({ timeout: WAIT });
        const state = await readUntil(() => pageState(page), (shown) => shown.sections.length === 1 && shown.sections[0] === "1-2 どの順で確かめるのか", WAIT);
        return { ...state, top: await sectionTop(page, "どの順で確かめるのか") };
      });
      const back = await step("頁の下の前の問いのlinkを押し、1つ目の問いの頁に切り替わるのを待つ", async () => {
        const prev = page.locator(".pg-pager a.pg-pager-prev:visible");
        if ((await prev.count()) === 0) return pageState(page);
        await prev.first().click({ timeout: WAIT });
        return readUntil(() => pageState(page), (shown) => shown.sections[0] === "1-1 何を止めるのか", WAIT);
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
        const card = () => openedCards(page);
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
        await page.locator(".pg-sec:visible .pg-sec-title").first().click({ timeout: WAIT });
        const closedOutside = await readUntil(card, (cards) => cards.length === 0, WAIT);
        await link.click({ timeout: WAIT });
        await readUntil(card, (cards) => cards.length === 1, WAIT);
        await link.click({ timeout: WAIT });
        const closedAgain = await readUntil(card, (cards) => cards.length === 0, WAIT);
        return { underline, before, opened, anchor, closedByIcon, closedOutside, closedAgain };
      });
      const other = await step("左の目次で2つ目の話題の問いを押し、その問いの頁に切り替わるのを待つ", async () => {
        await page.locator("nav.pg-menu a.pg-menu-q", { hasText: "どこに残すのか" }).click({ timeout: WAIT });
        const state = await readUntil(() => pageState(page), (shown) => shown.sections[0] === "2-1 どこに残すのか", WAIT);
        return { ...state, top: await sectionTop(page, "どこに残すのか") };
      });
      const glossary = await step("「記録」の用語の札を開き、札の中の「規則」のlinkを押して用語の頁に切り替わるのを待つ", async () => {
        await page.locator(".pg-sec:visible .pg-term", { hasText: "記録" }).first().click({ timeout: WAIT });
        const link = page.locator('[role="dialog"]:visible a', { hasText: "規則" }).first();
        const links = await link.count();
        if (links === 0) return { links, href: "", state: await pageState(page), entry: undefined };
        const href = await link.evaluate((a) => decodeURIComponent(a.getAttribute("href") ?? ""));
        await link.click({ timeout: WAIT });
        const state = await readUntil(() => pageState(page), (shown) => shown.topics.length === 1 && shown.topics[0] === "用語", WAIT);
        const entry = await page.evaluate((id) => {
          const el = document.getElementById(id);
          if (!el) return undefined;
          const r = el.getBoundingClientRect();
          return { top: r.top, bottom: r.bottom, height: innerHeight, shown: el.checkVisibility() };
        }, href.slice(1));
        return { links, href, state, entry };
      });
      const printed = await step("印刷の形にし、札と答えと左の目次と話題の頁の改め方を読む", async () => {
        await figuresDrawn(page);
        await page.emulateMedia({ media: "print" });
        return {
          terms: await deepAll(page, ".pg-topic .pg-tc"),
          answers: await deepAll(page, ".pg-topic .pg-q-a"),
          boxes: await deepAll(page, '[data-dragon="note-card"]'),
          menu: await deepAll(page, "nav.pg-menu, .pg-menu-toggle"),
          pagers: await deepAll(page, ".pg-pager"),
          // 続く物と同じ頁に留めたい題と段落の、後ろの改め方 (#3975)
          breaks: await page.evaluate(() => {
            const out: [string, string][] = [];
            const add = (name: string, el: Element): void => void out.push([name, getComputedStyle(el).breakAfter]);
            for (const el of document.querySelectorAll(".pg-topic .pg-topic-title")) add("話題の題", el);
            for (const el of document.querySelectorAll(".pg-sec .pg-sec-title")) add("節の題", el);
            for (const el of document.querySelectorAll(".pg-sec .pg-answer")) add("答えの1文", el);
            for (const el of document.querySelectorAll(".pg-sec p")) if (el.nextElementSibling?.matches(".pg-figure")) add("図の前の段落", el);
            return out;
          }),
          ...(await printedPage(page)),
        };
      });
      return { start, list, jumped, back, quiz, term, other, glossary, printed };
    },
    { width: 1200, height: 500 },
    writeLinkedGuide,
  ),
);

/** 左の目次の問いが全て見えているか */
const menuShown = (page: Page): Promise<boolean> =>
  page.evaluate(() => {
    const links = [...document.querySelectorAll<HTMLElement>("nav.pg-menu a.pg-menu-q")];
    return links.length > 0 && links.every((a) => a.checkVisibility());
  });

/**
 * 幅`width`の枠で、最初の節の札と答えを開いた頁の字の大きさとはみ出す幅を測り、左の目次を開いた形でもう一度測る。
 * 話題が2つ以上の頁は問いごとの頁に分けるので、1つ目の問いの頁を開いて測り、用語の話題の頁へ移って用語が見えるかと字を読む (#3983)
 */
const measureAt = async (page: Page, width: number) => {
  // 前の幅で開いた札と答えと目次を閉じた形から測るため、読み直す
  await page.setViewportSize({ width, height: 900 });
  const ids = await page.evaluate(() => ({
    first: document.querySelector(".pg-sec")?.id ?? "",
    glossary: [...document.querySelectorAll("section.pg-topic")].find((topic) => topic.querySelector(".pg-glossary"))?.id ?? "",
  }));
  const at = (id: string): string => `${new URL("notes.html", page.url()).href}#${encodeURIComponent(id)}`;
  await page.goto(at(ids.first), { timeout: ACTION_LIMIT_MS });
  await page.reload({ timeout: ACTION_LIMIT_MS });
  await figuresDrawn(page);
  await page.locator(".pg-q:visible .pg-q-btn").first().click({ timeout: WAIT });
  await page.locator(".pg-sec:visible .pg-term").first().click({ timeout: WAIT });
  const text = await smallText(page, READABLE_PX);
  const wide = await overflow(page);
  await page.goto(at(ids.glossary), { timeout: ACTION_LIMIT_MS });
  const glossaryShown = await readUntil(() => page.evaluate(() => document.querySelector<HTMLElement>(".pg-glossary")?.checkVisibility() ?? false), (shown) => shown, WAIT);
  const glossaryText = await smallText(page, READABLE_PX);
  const whole = { text: { min: Math.min(text.min, glossaryText.min), small: [...text.small, ...glossaryText.small] }, overflow: Math.max(wide, await overflow(page)), glossaryShown };
  // 目次を本文の上に畳む幅では、釦を押して開く。広い幅では目次が初めから開いている
  const toggle = page.locator(".pg-menu-toggle:visible");
  if ((await toggle.count()) > 0) await toggle.click({ timeout: WAIT });
  const menu = { opened: await readUntil(() => menuShown(page), (shown) => shown, WAIT), text: await smallText(page, READABLE_PX), overflow: await overflow(page) };
  return { whole, menu };
};

const MEASURED = await atLoad("説明の頁を幅1200pxと幅728pxと幅390pxで開き、頁と開いた目次の字の大きさとはみ出す幅を測る", () =>
  openGuide(
    async (page) => {
      const step = inOrder();
      const desk = await step("幅1200pxで測る", () => measureAt(page, 1200));
      const wide = await step("幅728pxで測る", () => measureAt(page, 728));
      const phone = await step("幅390pxで測る", () => measureAt(page, 390));
      return { desk, wide, phone };
    },
    { width: 728, height: 900 },
  ),
);

/** 要素の字。`drop`に当たる中の要素の字を外す */
const textWithout = (el: Element, drop: string): string => {
  const copy = el.cloneNode(true) as Element;
  for (const part of copy.querySelectorAll(drop)) part.remove();
  return squash(copy.textContent);
};

/**
 * 左の目次 (`nav.pg-menu`) の話題と問い。話題は`.pg-menu-topic`の字 (中に問いを入れた形でも問いの字を外す)、
 * 問いは`a.pg-menu-q`の番号 (`.pg-num`) と名前 (`.pg-menu-name`) と行き先で、書いた順に前の話題に入れる
 */
function menuOf(doc: Document): { topic: string; questions: { number: string; name: string; href: string }[] }[] {
  const groups: { topic: string; questions: { number: string; name: string; href: string }[] }[] = [];
  for (const el of doc.querySelector("nav.pg-menu")?.querySelectorAll(".pg-menu-topic, a.pg-menu-q") ?? []) {
    if (el.matches(".pg-menu-topic")) {
      groups.push({ topic: textWithout(el, "a.pg-menu-q"), questions: [] });
      continue;
    }
    if (groups.length === 0) groups.push({ topic: "", questions: [] });
    groups[groups.length - 1]!.questions.push({
      number: squash(el.querySelector(".pg-num")?.textContent),
      name: squash(el.querySelector(".pg-menu-name")?.textContent),
      href: decodeURIComponent(el.getAttribute("href") ?? ""),
    });
  }
  return groups;
}

/** 本文の節の場所の名前。書いた順 */
const sectionIds = (doc: Document): string[] => [...doc.querySelectorAll(".pg-sec")].map((sec) => sec.id);

/** 左の目次で今読んでいる問いの印 (`aria-current="true"`) を持つ要素の行き先と、画面の中に見えているか */
const currentMarks = (page: Page): Promise<{ href: string | null; inView: boolean }[]> =>
  page.evaluate(() =>
    [...document.querySelectorAll<HTMLElement>('nav.pg-menu [aria-current="true"]')].map((el) => {
      const r = el.getBoundingClientRect();
      const href = el.getAttribute("href");
      return { href: href === null ? null : decodeURIComponent(href), inView: el.checkVisibility() && r.top >= 0 && r.bottom <= innerHeight };
    }),
  );

/** `n`番目 (0から数える) の節の上の縁の、画面の上の縁からの位置 */
const sectionTopAt = (page: Page, n: number): Promise<number | undefined> =>
  page.evaluate((at) => document.querySelectorAll(".pg-sec")[at]?.getBoundingClientRect().top, n);

/** `n`番目 (0から数える) の節の上の縁が画面の上の縁より`into`px上に来るまで頁を送り、節の場所の名前と送った後の上の縁を返す */
const scrollIntoSection = (page: Page, n: number, into: number): Promise<{ id: string; top: number | undefined }> =>
  page.evaluate(
    ({ at, by }) => {
      const sec = document.querySelectorAll(".pg-sec")[at];
      if (!sec) return { id: "", top: undefined };
      scrollTo({ top: sec.getBoundingClientRect().top + scrollY + by, behavior: "instant" });
      return { id: sec.id, top: sec.getBoundingClientRect().top };
    },
    { at: n, by: into },
  );

/** 幅390pxの枠で読む、目次を畳むボタンと目次の問いと最初の節の形 */
const phoneMenu = (page: Page) =>
  page.evaluate(() => {
    const toggle = document.querySelector<HTMLElement>(".pg-menu-toggle");
    const menu = document.querySelector("nav.pg-menu")?.getBoundingClientRect();
    const sec = document.querySelector(".pg-sec")?.getBoundingClientRect();
    const links = [...document.querySelectorAll<HTMLElement>("nav.pg-menu a.pg-menu-q")];
    return {
      toggle: toggle ? { tag: toggle.tagName.toLowerCase(), expanded: toggle.getAttribute("aria-expanded"), visible: toggle.checkVisibility() } : null,
      links: links.length,
      shown: links.filter((a) => a.checkVisibility()).length,
      menuBottom: menu?.bottom,
      secTop: sec?.top,
      secLeft: sec?.left,
    };
  });

/** 左の目次と全体像の頁で、目次の並び、下へ送った時の印、目次の問いを押した時の移り、幅390pxの畳みを順に測る (#3961) */
const MENU = await atLoad("左の目次と全体像の頁を開き、下へ送って目次の印を読み、目次の問いを押してから幅390pxで開き直す", () =>
  openGuide(
    async (page) => {
      const step = inOrder();
      const layout = await step("頁を送る前に、左の目次と頁の題と最初の節の並びと、目次の最初の行を読む", async () => {
        await figuresDrawn(page);
        return page.evaluate(() => {
          const menu = document.querySelector<HTMLElement>("nav.pg-menu");
          const box = menu?.getBoundingClientRect();
          const first = document.querySelector("nav.pg-menu a");
          return {
            menu: menu && box ? { visible: menu.checkVisibility(), right: box.right, left: box.left, top: box.top + scrollY } : null,
            h1Left: document.querySelector("h1")?.getBoundingClientRect().left,
            secLeft: document.querySelector(".pg-sec")?.getBoundingClientRect().left,
            links: [...document.querySelectorAll<HTMLElement>("nav.pg-menu a.pg-menu-q")].filter((a) => a.checkVisibility()).length,
            first: first ? { href: decodeURIComponent(first.getAttribute("href") ?? ""), current: first.getAttribute("aria-current") } : null,
            overviewId: document.querySelector("section.pg-overview")?.id ?? "",
            split: document.querySelector(".pg-split") !== null,
            pagers: document.querySelectorAll(".pg-pager").length,
            stack: [...document.querySelectorAll<HTMLElement>(".pg-sec")]
              .filter((sec) => sec.checkVisibility())
              .map((sec) => {
                const r = sec.getBoundingClientRect();
                return { left: Math.round(r.left), top: Math.round(r.top + scrollY), bottom: Math.round(r.bottom + scrollY) };
              }),
          };
        });
      });
      const marked = await step("2つ目と4つ目の節まで下へ送り、左の目次の今読んでいる問いの印を読む", async () => {
        const at = async (n: number) => {
          const { id, top } = await scrollIntoSection(page, n, 40);
          const marks = await readUntil(() => currentMarks(page), (shown) => shown.length === 1 && shown[0]?.href === `#${id}`, WAIT);
          return { id, top, marks };
        };
        const second = await at(1);
        const fourth = await at(3);
        return { second, fourth };
      });
      const jumped = await step("頁の頭へ戻り、左の目次で3つ目の問いを押して、その節が画面の上に来るのを待つ", async () => {
        await page.evaluate(() => scrollTo({ top: 0, behavior: "instant" }));
        const id = await page.evaluate(() => document.querySelectorAll(".pg-sec")[2]?.id ?? "");
        const before = await sectionTopAt(page, 2);
        const link = await page.evaluate((href) => [...document.querySelectorAll("nav.pg-menu a.pg-menu-q")].findIndex((a) => decodeURIComponent(a.getAttribute("href") ?? "") === href), `#${id}`);
        if (link < 0) return { id, clicked: false, before, after: undefined, hash: "" };
        await page.locator("nav.pg-menu a.pg-menu-q").nth(link).click({ timeout: WAIT });
        const after = await readUntil(() => sectionTopAt(page, 2), (top) => top !== undefined && top >= 0 && top < 60, WAIT);
        return { id, clicked: true, before, after, hash: await page.evaluate(() => decodeURIComponent(location.hash)) };
      });
      const phone = await step("幅390pxで開き直し、目次を畳むボタンと最初の節の左の縁とはみ出す幅を測ってから、ボタンを押して目次を開く", async () => {
        // 前の段で頁のURLに残った節の場所の名前を外し、頁の頭から開き直す
        await page.setViewportSize({ width: 390, height: 900 });
        await page.goto(new URL("notes.html", page.url()).href, { timeout: ACTION_LIMIT_MS });
        await figuresDrawn(page);
        await page.evaluate(() => scrollTo({ top: 0, behavior: "instant" }));
        const folded = { ...(await phoneMenu(page)), overflow: await overflow(page) };
        if (!folded.toggle) return { folded, opened: undefined };
        await page.locator(".pg-menu-toggle").first().click({ timeout: WAIT });
        const opened = await readUntil(() => phoneMenu(page), (shown) => shown.toggle?.expanded === "true" && shown.links > 0 && shown.shown === shown.links, WAIT);
        return { folded, opened: { ...opened, overflow: await overflow(page) } };
      });
      return { layout, marked, jumped, phone };
    },
    { width: 1200, height: 500 },
    writeStackGuide,
  ),
);

/** 全体像の頁で、図の後の段落の用語の下線を押し、開いた札と下線と全体像の縁を読む (#3969) */
const OVERVIEW = await atLoad("全体像の頁を開き、全体像の図の後の段落の用語の下線を押して札を開く", () =>
  openGuide(
    async (page) => {
      const step = inOrder();
      const start = await step("頁を開いた時の、見えている節と全体像を読む", async () => {
        await figuresDrawn(page);
        return pageState(page);
      });
      const term = await step("全体像の図の後の段落の用語の下線を押し、開いた札を読む", async () => {
        const link = page.locator("section.pg-overview .pg-term", { hasText: "エージェント" }).first();
        const links = await link.count();
        const before = await openedCards(page);
        if (links === 0) return { links, before, opened: before, anchor: undefined };
        await link.click({ timeout: WAIT });
        const opened = await readUntil(() => openedCards(page), (cards) => cards.length === 1, WAIT);
        const anchor = await link.evaluate((el) => {
          const r = el.getBoundingClientRect();
          const box = el.closest("section.pg-overview")?.getBoundingClientRect();
          return { bottom: r.bottom, boxLeft: box?.left ?? 0, boxRight: box?.right ?? 0 };
        });
        return { links, before, opened, anchor };
      });
      return { start, term };
    },
    { width: 1200, height: 900 },
    writeOverviewGuide,
  ),
);

describe("説明の頁 (#3876)", () => {
  it("guide-sections-stack-in-topics", async () => {
    const doc = await exportedGuide();
    if (!doc) return;
    expect(doc.body.classList.contains("pg-layout-guide"), "layout: guide の頁の組み立て").toBe(true);
    expect(topicsOf(doc), "## の話題と、話題の中の ### の節。節の番号は話題ごとに1から数え直す").toEqual([
      {
        topic: "止める仕組み",
        sections: [
          { number: "1-1", title: "何を止めるのか", hidden: false },
          { number: "1-2", title: "どの順で確かめるのか", hidden: false },
        ],
      },
      { topic: "記録", sections: [{ number: "2-1", title: "どこに残すのか", hidden: false }] },
      { topic: "用語", sections: [] },
    ]);
    // 見本の英語と日本語の頁も、話題と節を持つ頁に書き出せる
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
      expect(topics.length, `見本 ${name} の話題の数`).toBeGreaterThanOrEqual(3);
      expect(topics[0]!.sections.length, `見本 ${name} の最初の話題の節の数`).toBeGreaterThanOrEqual(2);
    }
  });

  it("guide-question-list-jumps-to-section", () => {
    const seen = PRESSED.get();
    if (!seen) return;
    expect(seen.list.get(), "左の目次の話題と、話題ごとに1から数え直す番号の問い").toEqual([
      {
        topic: "止める仕組み",
        items: [
          { number: "1-1", name: "何を止めるのか" },
          { number: "1-2", name: "どの順で確かめるのか" },
        ],
      },
      { topic: "記録", items: [{ number: "2-1", name: "どこに残すのか" }] },
      { topic: "用語", items: [] },
    ]);
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

  it("guide-glossary-file-becomes-topic", async () => {
    const doc = await exportedGuide();
    if (!doc) return;
    const topics = [...doc.querySelectorAll("section.pg-topic")];
    const topic = topics.find((t) => squash(t.querySelector(":scope > h2.pg-topic-title")?.textContent) === "用語");
    expect(topic, "用語のfileを読み込んだ「用語」の話題が無い").toBeDefined();
    expect(topics[topics.length - 1], "「用語」の話題が頁の終わりに無い").toBe(topic);
    // 左の目次も、用語の話題を問いを持たない話題として最後に並べる
    expect(menuOf(doc).slice(-1), "左の目次の最後の話題").toEqual([{ topic: "用語", questions: [] }]);
    expect(
      [...(topic?.querySelectorAll(".pg-gl") ?? [])].map((entry) => ({
        name: squash(entry.querySelector(".pg-gl-n")?.textContent),
        text: squash(entry.querySelector(".pg-gl-t")?.textContent),
        example: squash(entry.querySelector(".pg-gl-e")?.textContent),
      })),
      "「用語」の話題に用語ごとに並ぶ説明と例",
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
    expect(printed.terms.length, "印刷の形の頁の用語の札の数").toBe(3);
    expect(printed.terms.filter((c) => !c.visible).map((c) => c.text), "印刷の形で開かない用語の札").toEqual([]);
    expect(printed.answers.length, "印刷の形の頁の確かめる問いの答えの数").toBe(2);
    expect(printed.answers.filter((a) => !a.visible).map((a) => a.text), "印刷の形で開かない確かめる問いの答え").toEqual([]);
    expect(printed.boxes.length, "印刷の形の図の箱の札の数").toBe(2);
    expect(printed.boxes.filter((b) => !b.visible).map((b) => b.text), "印刷の形で開かない箱の札").toEqual([]);
    expect(printed.menu.length, "左の目次と目次を開く釦の数").toBe(2);
    expect(printed.menu.filter((m) => m.visible).length, "印刷の形で見える左の目次か目次を開く釦").toBe(0);
  });

  it("guide-print-keeps-titles-with-figure", () => {
    // 話題の題と節の題と答えの1文と図の前の段落は、続く物が無いと意味を持たないので、紙で後ろに頁を分けない (#3975)
    const seen = PRESSED.get();
    if (!seen) return;
    const { breaks } = seen.printed.get();
    const found = new Set(breaks.map(([name]) => name));
    for (const name of ["話題の題", "節の題", "答えの1文", "図の前の段落"]) expect(found.has(name), `印刷の形の頁に${name}が無い`).toBe(true);
    expect(
      breaks.filter(([, value]) => value !== "avoid").map(([name, value]) => `${name}: ${value}`),
      "印刷の形で後ろに頁を分けうる題と段落",
    ).toEqual([]);
  });

  it("guide-print-shows-every-topic", () => {
    const seen = PRESSED.get();
    if (!seen) return;
    const printed = seen.printed.get();
    // 全ての話題の面と節を書いた順に紙に出す
    expect(printed.topics.map((t) => t.name), "説明の頁の話題").toEqual(["止める仕組み", "記録", "用語"]);
    expect(printed.topics.filter((t) => !t.shown).map((t) => t.name), "印刷の形で紙に出ない話題").toEqual([]);
    expect(printed.written.length, "説明の頁の節の数").toBeGreaterThan(0);
    expect(printed.topics.flatMap((t) => t.sections), "印刷の形で紙に出る節の並び").toEqual(printed.written);
  });

  it("guide-print-starts-each-topic-on-new-paper", () => {
    const seen = PRESSED.get();
    if (!seen) return;
    const printed = seen.printed.get();
    // 2つ目からの話題は新しい紙から始め、どの話題も紙の上に話題の名前の見出しを出す
    expect(printed.topics.slice(1).map((t) => `${t.name} ${t.breakBefore}`), "印刷の形で話題の前で紙を改める").toEqual(printed.topics.slice(1).map((t) => `${t.name} page`));
    expect(printed.topics.map((t) => t.head), "印刷の形の話題の面の最初の見出し").toEqual(printed.topics.map((t) => t.name));
  });

  it("guide-print-notes-below-figure", () => {
    const seen = PRESSED.get();
    if (!seen) return;
    const printed = seen.printed.get();
    // 箱の札は図の絵に重ならず、図の下に箱の名前と並ぶ
    expect(printed.notes.map((n) => n.name).sort(), "印刷の形の箱の札の箱の名前").toEqual(["エージェント", "確かめる所"]);
    for (const note of printed.notes) {
      expect(note.shown, `印刷の形で「${note.name}」の札が開かない`).toBe(true);
      expect(note.figures.length, `印刷の形で「${note.name}」の札の図の絵が見えない`).toBeGreaterThan(0);
      const bottom = Math.max(...note.figures.map((f) => f.bottom));
      expect(note.card.top, `印刷の形で「${note.name}」の札が図の絵の下の端 ${Math.round(bottom)} より上に在る`).toBeGreaterThanOrEqual(bottom - 0.5);
    }
  });

  it("guide-print-shows-every-step", () => {
    const seen = PRESSED.get();
    if (!seen) return;
    const printed = seen.printed.get();
    // 段のある図は全ての段の止め絵を段の順に並べ、各絵の下に段の番号と say の文を出す
    expect(printed.stills.length, "印刷の形の段の止め絵の数").toBe(SAYS.length);
    for (const [i, say] of SAYS.entries()) {
      expect(printed.stills[i] ?? "", `段 ${i + 1} の止め絵の下に段の番号が無い`).toContain(String(i + 1));
      expect(printed.stills[i] ?? "", `段 ${i + 1} の止め絵の下に say の文が無い`).toContain(say);
    }
  });

  it("guide-readable-and-fits", () => {
    const seen = MEASURED.get();
    if (!seen) return;
    for (const [width, at] of [
      [1200, seen.desk],
      [728, seen.wide],
      [390, seen.phone],
    ] as const) {
      const { whole, menu } = at.get();
      expect(whole.glossaryShown, `幅${width}pxで用語の話題が頁に出ない`).toBe(true);
      expect(whole.text.small, `幅${width}pxの頁で${READABLE_PX}pxより小さい字`).toEqual([]);
      expect(whole.overflow, `幅${width}pxの頁が横にはみ出す`).toBe(0);
      expect(menu.opened, `幅${width}pxで左の目次の問いが見えない`).toBe(true);
      expect(menu.text.small, `幅${width}pxの目次を開いた頁で${READABLE_PX}pxより小さい字`).toEqual([]);
      expect(menu.overflow, `幅${width}pxで目次を開いた頁が横にはみ出す`).toBe(0);
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

/**
 * 説明の頁の左の目次と全体像 (#3961)。
 *
 * 話題のタブと問いの一覧の代わりに、左の目次 (`nav.pg-menu`) が全ての話題と問いを並べ、話題は1つの頁に続けて積む。
 * 問いの題の終わりの`[menu: 短い名前]`は目次の名前だけを短くし、頭の段落の後の図は頁の頭の全体像になる。
 */
describe("左の目次と全体像 (#3961)", () => {
  it("guide-side-menu-lists-every-question", async () => {
    const doc = await exportedGuide(writeMenuGuide());
    if (!doc) return;
    expect(doc.querySelectorAll("nav.pg-menu").length, "左の目次 (nav.pg-menu) の数").toBe(1);
    const hrefs = sectionIds(doc).map((id) => `#${id}`);
    expect(hrefs.length, "本文の節の数").toBe(5);
    expect(
      menuOf(doc).map(({ topic, questions }) => ({ topic, questions: questions.map(({ number, href }) => ({ number, href })) })),
      "左の目次の話題と、話題ごとの問いの番号と行き先",
    ).toEqual([
      {
        topic: "止める仕組み",
        questions: [
          { number: "1-1", href: hrefs[0] },
          { number: "1-2", href: hrefs[1] },
        ],
      },
      {
        topic: "記録",
        questions: [
          { number: "2-1", href: hrefs[2] },
          { number: "2-2", href: hrefs[3] },
        ],
      },
      { topic: "送り直す仕組み", questions: [{ number: "3-1", href: hrefs[4] }] },
    ]);
    const seen = MENU.get();
    if (!seen) return;
    const layout = seen.layout.get();
    expect(layout.menu?.visible, "幅1200pxで左の目次が見えない").toBe(true);
    expect(layout.menu?.right ?? Number.POSITIVE_INFINITY, "幅1200pxで左の目次が本文の節の左に並ばない").toBeLessThanOrEqual((layout.secLeft ?? 0) + 0.5);
    expect(layout.links, "幅1200pxで見えている左の目次の問いの数").toBe(5);
    // 目次は頁の頭から左の列に在り、頁の題と全体像も目次の右に並ぶ
    expect(layout.menu?.top ?? Number.POSITIVE_INFINITY, "幅1200pxで左の目次が頁の頭から始まらない").toBeLessThanOrEqual(40);
    expect(layout.menu?.left ?? Number.POSITIVE_INFINITY, "幅1200pxで左の目次が頁の題の左に無い").toBeLessThan(layout.h1Left ?? 0);
  });

  it("guide-menu-uses-short-name", async () => {
    const doc = await exportedGuide(writeMenuGuide());
    if (!doc) return;
    expect(
      menuOf(doc).flatMap((group) => group.questions.map((q) => q.name)),
      "左の目次の問いの名前。[menu: 短い名前]を書いた問いはその名前、書かない問いは問いの全文",
    ).toEqual(["止める場所", MENU_QUESTIONS[1], "記録の読み手", MENU_QUESTIONS[3], "送り直し"]);
    expect(
      [...doc.querySelectorAll(".pg-sec .pg-sec-title")].map((title) => textWithout(title, ".pg-num")),
      "本文の節の題は[menu: 短い名前]を外した問いの全文",
    ).toEqual(MENU_QUESTIONS);
    expect(textWithout(doc.body, "script, style"), "頁の字に[menu: 短い名前]の書き方が残る").not.toContain("[menu");
    expect(sectionIds(doc).filter((id) => id.includes("menu")), "[menu: 短い名前]の字を含む節の場所の名前").toEqual([]);
  });

  it("guide-menu-empty-name-refused", async () => {
    const exportPage = await exportPageTool();
    if (!exportPage) return;
    for (const empty of ["[menu: ]", "[menu:   ]", "[menu:]"]) {
      const md = MENU_GUIDE.replace("[menu: 記録の読み手]", empty);
      const line = md.split("\n").findIndex((row) => row.includes(empty)) + 1;
      const path = writeMenuGuide({ "notes.md": md });
      const result = await exportPage(path);
      expect(result.ok, `空の名前の${empty}を書いた頁を書き出した`).toBe(false);
      const errors = result.ok ? [] : result.errors;
      expect(errors.map((e) => ({ file: basename(e.file), line: e.line })), `空の名前の${empty}の行`).toEqual([{ file: "notes.md", line }]);
      expect(errors[0]?.message ?? "", `空の名前の${empty}の断りの文がmenuを名指さない`).toContain("menu");
      expect(existsSync(join(dirname(path), "notes.html")), `空の名前の${empty}を書いたのに頁を書いた`).toBe(false);
    }
  });

  it("guide-overview-from-lead-figure", async () => {
    const doc = await exportedGuide(writeMenuGuide());
    if (!doc) return;
    const overview = doc.querySelector("section.pg-overview");
    expect(overview, "頭の図の全体像 (section.pg-overview) が無い").not.toBeNull();
    const header = doc.querySelector("header.pg-top");
    expect(overview?.closest("header.pg-top") === header || header?.nextElementSibling === overview, "全体像が頁の頭の中か直後に無い").toBe(true);
    const figures = [...doc.querySelectorAll(".pg-figure")].filter((f) => squash(f.textContent).startsWith("architecture 送金が通る道"));
    expect(figures.length, "頭の段落の後に書いた図の数").toBe(1);
    expect(figures[0]?.closest("section.pg-overview"), "頭の段落の後に書いた図が全体像の中に無い").toBe(overview);
    expect(
      [...(overview?.querySelectorAll(".pg-figure, ol.pg-route") ?? [])].map((el) => (el.matches(".pg-figure") ? "図" : "道筋")),
      "全体像の中の図と、その後の話題の道筋 (ol.pg-route)",
    ).toEqual(["図", "道筋"]);
    // 左の目次の最初の行は全体像へ移る
    expect(overview?.id ?? "", "全体像に場所の名前が無い").not.toBe("");
    const first = doc.querySelector("nav.pg-menu a");
    expect(
      { href: decodeURIComponent(first?.getAttribute("href") ?? ""), text: squash(first?.textContent) },
      "左の目次の最初の行が全体像へ移らない",
    ).toEqual({ href: `#${overview?.id ?? ""}`, text: "全体像" });
    const route = [...(overview?.querySelectorAll("ol.pg-route a") ?? [])].map((a) => decodeURIComponent(a.getAttribute("href") ?? ""));
    expect(route, "道筋が書いた順に話題を指さない").toEqual(["#止める仕組み", "#記録", "#送り直す仕組み"]);
    expect(
      route.map((href) => doc.getElementById(href.slice(1))?.matches("section.pg-topic") ?? false),
      "道筋の行き先が話題 (section.pg-topic) でない",
    ).toEqual([true, true, true]);
  });

  it("guide-topics-flow-one-after-another", async () => {
    const doc = await exportedGuide(writeMenuGuide());
    if (!doc) return;
    expect(doc.querySelectorAll('.pg-topics, .pg-qlist, [role="tablist"]').length, "話題のタブか、タブの頭の問いの一覧が残る").toBe(0);
    expect(
      [...doc.querySelectorAll("section.pg-topic")].map((topic) => ({
        title: topic.firstElementChild?.matches("h2.pg-topic-title") ? squash(topic.firstElementChild.textContent) : "",
        hidden: topic.closest("[hidden]") !== null,
        numbers: [...topic.querySelectorAll(".pg-sec-title .pg-num")].map((num) => squash(num.textContent)),
      })),
      "話題ごとに頭の題 (h2.pg-topic-title) と、隠さずに続けて積む節。節の番号は話題ごとに1から数え直す",
    ).toEqual([
      { title: "止める仕組み", hidden: false, numbers: ["1-1", "1-2"] },
      { title: "記録", hidden: false, numbers: ["2-1", "2-2"] },
      { title: "送り直す仕組み", hidden: false, numbers: ["3-1"] },
    ]);
  });

  it("guide-menu-marks-current-question", () => {
    const seen = MENU.get();
    if (!seen) return;
    // 頁を送る前は、全体像を読んでいるので目次の最初の行の全体像に印が付く
    const layout = seen.layout.get();
    expect(layout.overviewId, "全体像に場所の名前が無い").not.toBe("");
    expect(layout.first, "頁を送る前に、目次の最初の行の全体像に印が付かない").toEqual({ href: `#${layout.overviewId}`, current: "true" });
    const { second, fourth } = seen.marked.get();
    for (const [name, at] of [
      ["2つ目", second],
      ["4つ目", fourth],
    ] as const) {
      expect(at.id, `${name}の節が無い`).not.toBe("");
      expect(at.top ?? 1, `${name}の節まで頁を送れない`).toBeLessThanOrEqual(0);
      expect(at.top ?? -999, `${name}の節まで頁を送れない`).toBeGreaterThan(-60);
      expect(at.marks.map((mark) => mark.href), `${name}の節を読む時に、左の目次でその問いだけに印が付かない`).toEqual([`#${at.id}`]);
      expect(at.marks[0]?.inView, `${name}の節を読む時に、印の付いた目次の問いが画面に見えない`).toBe(true);
    }
    const jumped = seen.jumped.get();
    expect(jumped.clicked, "左の目次に3つ目の節へ移る問いが無い").toBe(true);
    expect(jumped.before ?? 0, "押す前から3つ目の節が画面の上に在り、移ったかを測れない").toBeGreaterThan(500);
    expect(jumped.after ?? -1, "左の目次の問いを押しても、その節が画面の上へ来ない").toBeGreaterThanOrEqual(0);
    expect(jumped.after ?? 999, "左の目次の問いを押しても、その節が画面の上へ来ない").toBeLessThan(60);
    expect(jumped.hash, "移った節の場所の名前が頁のURLに残らない").toBe(`#${jumped.id}`);
  });

  it("guide-menu-folds-on-phone", () => {
    const seen = MENU.get();
    if (!seen) return;
    const { folded, opened } = seen.phone.get();
    expect(folded.toggle, "幅390pxで目次を畳むボタン (.pg-menu-toggle) が無いか、押す前に開いている").toEqual({ tag: "button", expanded: "false", visible: true });
    expect(folded.links, "幅390pxの左の目次の問いの数").toBe(5);
    expect(folded.shown, "幅390pxでボタンを押す前に見えている目次の問いの数").toBe(0);
    expect(folded.menuBottom ?? Number.POSITIVE_INFINITY, "幅390pxで目次が本文の上に無い").toBeLessThanOrEqual((folded.secTop ?? 0) + 0.5);
    expect(folded.secLeft ?? Number.POSITIVE_INFINITY, "幅390pxで最初の節が目次に右へ押される").toBeLessThan(40);
    expect(folded.overflow, "幅390pxで目次を畳んだ頁が横にはみ出す").toBe(0);
    expect(opened?.toggle?.expanded, "幅390pxでボタンを押しても目次が開いた印にならない").toBe("true");
    expect(opened?.shown, "幅390pxでボタンを押した後に見えている目次の問いの数").toBe(5);
    expect(opened?.overflow, "幅390pxで目次を開いた頁が横にはみ出す").toBe(0);
  });
});

/**
 * 全体像の図の後の段落と、話題ごとに数え直す問いの番号 (#3969)。
 *
 * 頭の中身のうち図の前の文は頁の頭に残し、図の後の段落は全体像 (`section.pg-overview`) の中で図の直後、話題の道筋の前に書いた順に出す。
 * その段落の用語のリンクも、頭の文と同じく押すと札がすぐ下に開く下線になる。
 * 問いの番号は話題ごとに1から数え直し、目次と節の題に「話題の番号-問いの番号」で出す。用語の話題は問いも番号も持たない。
 */
describe("全体像の図の後の段落と章ごとの番号 (#3969)", () => {
  it("guide-overview-keeps-text-after-figure", async () => {
    const doc = await exportedGuide(writeOverviewGuide());
    if (!doc) return;
    const header = doc.querySelector("header.pg-top");
    const overview = doc.querySelector("section.pg-overview");
    expect(overview, "頭の図の全体像 (section.pg-overview) が無い").not.toBeNull();
    const top = textWithout(header ?? doc.createElement("header"), ".pg-tc");
    expect(top, "図の前の文が頁の頭 (header.pg-top) に無い").toContain(BEFORE_FIGURE);
    expect(
      AFTER_FIGURE.filter((text) => top.includes(text)),
      "図の後の段落が図の上の頁の頭 (header.pg-top) に出る",
    ).toEqual([]);
    // 全体像の中は、図、図の後の段落を書いた順、話題の道筋の順に並ぶ。札と図と道筋の中の段落は数えない
    expect(
      [...(overview?.querySelectorAll(".pg-figure, p, ol.pg-route") ?? [])]
        .filter((el) => !el.parentElement?.closest(".pg-figure, ol.pg-route, .pg-tc"))
        .map((el) => (el.matches(".pg-figure") ? "図" : el.matches("ol.pg-route") ? "道筋" : squash(el.textContent))),
      "全体像の中の図と、図の後の段落と、話題の道筋 (ol.pg-route) の並び",
    ).toEqual(["図", ...AFTER_FIGURE, "道筋"]);
    expect(textWithout(overview ?? doc.createElement("section"), ".pg-tc"), "図の前の文が全体像の中にも出る").not.toContain(BEFORE_FIGURE);
    expect(
      AFTER_FIGURE.map((text) => [...doc.querySelectorAll("p")].filter((p) => !p.closest(".pg-tc") && squash(p.textContent) === text).length),
      "図の後の段落が頁に出る数",
    ).toEqual(AFTER_FIGURE.map(() => 1));
  });

  it("guide-overview-text-opens-term-card", async () => {
    const doc = await exportedGuide(writeOverviewGuide());
    if (!doc) return;
    // 図の後の段落の用語のリンクは、押すと札が開く下線になり、札は同じ全体像の中の札の置き場に在る
    const overview = doc.querySelector("section.pg-overview");
    const terms = [...(overview?.querySelectorAll(".pg-term") ?? [])].map((term) => {
      const box = term.closest("[data-terms]");
      const key = term.getAttribute("data-term") ?? "";
      return {
        text: squash(term.textContent),
        tag: term.tagName.toLowerCase(),
        inOverview: box !== null && box.closest("section.pg-overview") === overview,
        card: [...(box?.querySelectorAll(".pg-tc") ?? [])].filter((card) => card.getAttribute("data-term") === key).length,
      };
    });
    expect(terms, "全体像の図の後の段落の用語の下線 (.pg-term) と、同じ全体像の中の札の置き場の札の数").toEqual([
      { text: "エージェント", tag: "button", inOverview: true, card: 1 },
    ]);
    const seen = OVERVIEW.get();
    if (!seen) return;
    const term = seen.term.get();
    expect(term.links, "頁の全体像に用語の下線が無い").toBe(1);
    expect(term.before, "押す前に札が開いている").toEqual([]);
    expect(
      term.opened.map(({ label, name, text, example }) => ({ label, name, text, example })),
      "全体像の段落で押した用語の札",
    ).toEqual([{ label: "エージェント", name: "エージェント", text: "利用者に代わって送金を組み立てるプログラム。", example: "毎朝の支払いを自動で頼む" }]);
    const card = term.opened[0];
    const anchor = term.anchor;
    if (!card || !anchor) return;
    expect(card.top - anchor.bottom, "札の上の縁が下線のすぐ下に無い").toBeGreaterThanOrEqual(0);
    expect(card.top - anchor.bottom, "札の上の縁が下線のすぐ下に無い").toBeLessThanOrEqual(CARD_GAP_MAX);
    expect(card.left, "札が全体像の左へはみ出す").toBeGreaterThanOrEqual(anchor.boxLeft - 0.5);
    expect(card.right, "札が全体像の右へはみ出す").toBeLessThanOrEqual(anchor.boxRight + 0.5);
  });

  it("guide-numbers-restart-per-topic", async () => {
    const doc = await exportedGuide(writeOverviewGuide());
    if (!doc) return;
    const want = [
      { topic: "止める仕組み", numbers: ["1-1", "1-2"] },
      { topic: "記録", numbers: ["2-1"] },
      { topic: "送り直す仕組み", numbers: ["3-1", "3-2"] },
      { topic: "用語", numbers: [] },
    ];
    expect(
      menuOf(doc).map(({ topic, questions }) => ({ topic, numbers: questions.map((q) => q.number) })),
      "左の目次の問いの番号。話題ごとに1から数え直し、話題の番号-問いの番号で出す",
    ).toEqual(want);
    expect(
      [...doc.querySelectorAll("section.pg-topic")].map((topic) => ({
        topic: squash(topic.querySelector(":scope > h2.pg-topic-title")?.textContent),
        numbers: [...topic.querySelectorAll(".pg-sec-title .pg-num")].map((num) => squash(num.textContent)),
      })),
      "本文の節の題の番号。左の目次の問いと同じ番号",
    ).toEqual(want);
    // 用語の話題は、目次の行にも本文の話題にも番号を出さない
    const glossary = [...doc.querySelectorAll("section.pg-topic")].find((topic) => squash(topic.querySelector(":scope > h2.pg-topic-title")?.textContent) === "用語");
    const row = [...doc.querySelectorAll("nav.pg-menu .pg-menu-topic")].find((el) => textWithout(el, "a.pg-menu-q") === "用語");
    expect(
      { topic: glossary !== undefined, row: row !== undefined, numbers: (glossary?.querySelectorAll(".pg-num").length ?? 0) + (row?.querySelectorAll(".pg-num").length ?? 0) },
      "用語の話題と目次の行の番号 (.pg-num) の数",
    ).toEqual({ topic: true, row: true, numbers: 0 });
  });
});

/**
 * 話題が2つ以上ある説明の頁を、頭の頁と問いごとの頁に分ける (#3983)。
 *
 * 頭の頁は頁の題と頭の中身と全体像と話題の道筋を見せ、問いの頁は話題の題とその問いの節と、頁の下の前と次のlinkを見せる。
 * 目次の問いと前と次のlinkは、URLの`#`の後ろを節のidにして頁を切り替える。話題が1つの頁は今と同じく全ての節を1つの頁に積む。
 */
describe("問いごとの頁 (#3983)", () => {
  it("guide-split-opens-on-overview", async () => {
    const doc = await exportedGuide(writeLinkedGuide());
    if (!doc) return;
    expect(doc.querySelector(".pg-split") !== null, "話題が2つ以上の頁が頁に分ける組み立て (.pg-split) を持たない").toBe(true);
    const seen = PRESSED.get();
    if (!seen) return;
    const start = seen.start.get();
    expect(start.sections, "頁を開いた時に見えている問いの節").toEqual([]);
    expect(start.head.title && start.head.lead, "頁を開いた時に頁の題と頭の中身が見えない").toBe(true);
    expect(start.route, "頁を開いた時に見えている話題の道筋の行き先").toEqual(["#止める仕組み", "#記録"]);
    const overview = OVERVIEW.get();
    if (!overview) return;
    const top = overview.start.get();
    expect(top.sections, "全体像を持つ頁を開いた時に見えている問いの節").toEqual([]);
    expect(top.head.overview, "全体像を持つ頁を開いた時に全体像が見えない").toBe(true);
  });

  it("guide-split-menu-opens-question-page", () => {
    const seen = PRESSED.get();
    if (!seen) return;
    for (const [name, at, want] of [
      ["1つ目の話題の2つ目の問い", seen.jumped.get(), "どの順で確かめるのか"],
      ["2つ目の話題の問い", seen.other.get(), "どこに残すのか"],
    ] as const) {
      expect(at.sections.map((sec) => sec.replace(/^\d+-\d+ /u, "")), `目次で${name}を押した後に見えている節`).toEqual([want]);
      expect(at.hash, `目次で${name}を押した後のURLの#の後ろ`).toBe(`#${want}`);
      expect(at.marks, `目次で${name}を押した後に目次が印を付ける行`).toEqual([`#${want}`]);
      expect(at.head.title, `目次で${name}を押した後も頁の題が見える`).toBe(false);
      expect(at.top ?? -1, `目次で${name}を押した後に節の題が画面の上に無い`).toBeGreaterThanOrEqual(0);
      expect(at.top ?? 999, `目次で${name}を押した後に節の題が画面の上に無い`).toBeLessThan(200);
    }
  });

  it("guide-split-pager-links-neighbors", async () => {
    const doc = await exportedGuide(writeLinkedGuide());
    if (!doc) return;
    const glossaryId = [...doc.querySelectorAll("section.pg-topic")].find((topic) => topic.querySelector(".pg-glossary"))?.id ?? "";
    expect(glossaryId, "用語の話題に場所の名前が無い").not.toBe("");
    const seen = PRESSED.get();
    if (!seen) return;
    const links = (pager: { rel: string; href: string }[]) => pager.map(({ rel, href }) => `${rel} ${href}`);
    expect(links(seen.back.get().pager), "1つ目の問いの頁の前と次のlink。前は頭の頁を指す").toEqual(["prev #", "next #どの順で確かめるのか"]);
    expect(links(seen.jumped.get().pager), "2つ目の問いの頁の前と次のlink").toEqual(["prev #何を止めるのか", "next #どこに残すのか"]);
    expect(links(seen.other.get().pager), "2つ目の話題の問いの頁の前と次のlink。次は用語の話題の頁を指す").toEqual(["prev #どの順で確かめるのか", `next #${glossaryId}`]);
    expect(links(seen.glossary.get().state.pager), "最後の頁 (用語の話題) は次のlinkを持たない").toEqual(["prev #どこに残すのか"]);
    const jumped = seen.jumped.get().pager;
    expect(jumped[0]?.text ?? "", "前のlinkが前の問いの番号を出さない").toContain("1-1");
    expect(jumped[1]?.text ?? "", "次のlinkが次の問いの番号を出さない").toContain("2-1");
    const { pagers } = seen.printed.get();
    expect(pagers.length, "印刷の形の頁の前と次のlinkの並びの数").toBeGreaterThan(0);
    expect(pagers.filter((p) => p.visible).length, "印刷の形で見える前と次のlinkの並び").toBe(0);
  });

  it("guide-split-topic-name-on-question-page", () => {
    const seen = PRESSED.get();
    if (!seen) return;
    const back = seen.back.get();
    expect(back.topics, "話題の最初の問いの頁に見えている話題の題").toEqual(["止める仕組み"]);
    expect(back.leads, "話題の最初の問いの頁に見えている話題の頭の中身").toEqual([TOPIC_LEAD]);
    const jumped = seen.jumped.get();
    expect(jumped.topics, "話題の2つ目の問いの頁に見えている話題の題").toEqual(["止める仕組み"]);
    expect(jumped.leads, "話題の2つ目の問いの頁に話題の頭の中身が繰り返し出る").toEqual([]);
    expect(seen.other.get().topics, "2つ目の話題の問いの頁に見えている話題の題").toEqual(["記録"]);
  });

  it("guide-split-term-link-opens-glossary-page", () => {
    const seen = PRESSED.get();
    if (!seen) return;
    const glossary = seen.glossary.get();
    expect(glossary.links, "「記録」の札の中の「規則」のlinkの数").toBe(1);
    expect(glossary.state.topics, "札の中のlinkを押した後に見えている話題").toEqual(["用語"]);
    expect(glossary.state.sections, "札の中のlinkを押した後に見えている問いの節").toEqual([]);
    expect(glossary.state.hash, "札の中のlinkを押した後のURLの#の後ろ").toBe(glossary.href);
    const entry = glossary.entry;
    expect(entry?.shown, "linkが指す用語の説明が見えない").toBe(true);
    expect(entry?.top ?? -1, "linkが指す用語の説明が画面に入らない").toBeGreaterThanOrEqual(0);
    expect(entry?.bottom ?? Number.POSITIVE_INFINITY, "linkが指す用語の説明が画面に入らない").toBeLessThanOrEqual(entry?.height ?? 0);
  });

  it("guide-single-topic-stacks", async () => {
    const doc = await exportedGuide(writeStackGuide());
    if (!doc) return;
    expect(doc.querySelectorAll("section.pg-topic").length, "話題が1つの頁の話題の数").toBe(1);
    expect(doc.querySelector(".pg-split"), "話題が1つの頁が頁に分ける組み立てを持つ").toBeNull();
    expect(doc.querySelectorAll(".pg-pager").length, "話題が1つの頁の前と次のlinkの並びの数").toBe(0);
    const seen = MENU.get();
    if (!seen) return;
    const { stack, split, pagers } = seen.layout.get();
    expect({ split, pagers }, "話題が1つの頁を開いた時の、頁に分ける組み立てと前と次のlinkの並びの数").toEqual({ split: false, pagers: 0 });
    expect(stack.length, "話題が1つの頁で見えている節の数").toBe(5);
    for (const [n, sec] of stack.entries()) {
      if (n === 0) continue;
      expect(sec.left, `${n + 1}つ目の節が1つ目の節と同じ左の縁に並ばない`).toBe(stack[0]!.left);
      expect(sec.top, `${n + 1}つ目の節が前の節の下に積まれない`).toBeGreaterThanOrEqual(stack[n - 1]!.bottom);
    }
  });
});
