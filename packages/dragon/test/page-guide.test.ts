/**
 * mdから書き出す説明の頁 (`layout: guide`、#3876)。
 *
 * 頭の行に`layout: guide`を書いたmdは、`##`が話題、`###`が話題の中に番号つきで縦に積む節になり、話題が1つの頁は1つの頁に続けて積む (#3961)。
 * 話題が2つ以上の頁は、頁の上に全体像と話題ごとのタブを並べ、話題のタブはその話題の問いを書いた順に全て見せる (#3991)。
 * 話題のタブの頭には、全体像の図のうちその話題へのlinkを持つ箱に色を残した止め絵と、問いの番号と名前と答えの一覧を置き、タブの終わりに前と次の話題へのlinkを置く。
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
import { runCli } from "./export-support";
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

/** 1つ目の話題の頭の中身。話題のタブの中で問いの前に出す (#3991) */
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

/**
 * 全体像の図の箱に話題へのlinkを書いた頁のmd (#3991)。「エージェント」と「確かめる所」は1つ目の話題、「署名する所」は3つ目の話題を指し、2つ目の話題を指す箱は無い
 */
const TABS_GUIDE = OVERVIEW_GUIDE.replace("box agent as エージェント", "box agent as エージェント [link: #止める仕組み]")
  .replace("box check as 確かめる所", "box check as 確かめる所 [link: #止める仕組み]")
  .replace("box signer as 署名する所", "box signer as 署名する所 [link: #送り直す仕組み]");

/** 全体像の箱に話題へのlinkを書いた頁のmdと用語のfileを一時のdirに書き、mdのpathを返す (#3991) */
function writeTabsGuide(): string {
  const root = tempDir("guide-tabs");
  writeFiles(root, { "notes.md": TABS_GUIDE, "glossary.md": GLOSSARY });
  return join(root, "notes.md");
}

/**
 * 話題のタブの中を問いごとの頁に分ける頁のmd (#3998)。話題は2つで、1つ目の話題の1つ目の問いは図を2つ、2つ目の問いは図を1つ持ち、2つ目の話題の問いは図を持たない。
 * 図の後に長い箇条書きを置き、目次の図の題を押した時に頁が動いて図へ移るのを測る
 */
const PAGES_GUIDE = `---
layout: guide
---

# 送金の止め方

送金を止める仕組みを、問いごとの頁で読む。

## 止める仕組み

${TOPIC_LEAD}

### 何を止めるのか [menu: 止める物]

> 規則に合わない送金を止める。

\`\`\`dragon
architecture どこで止めるのか

box agent as エージェント
box check as 確かめる所

step 送る
  say エージェントが送金を確かめる所へ送る。
  agent -> check: 送金
\`\`\`

${LONG_FILLER}

\`\`\`dragon
architecture 止めた後に返す物

box check as 確かめる所
box agent as エージェント

step 返す
  say 確かめる所が止めた理由をエージェントへ返す。
  check -> agent: 止めた理由
\`\`\`

${LONG_FILLER}

### どの順で確かめるのか [menu: 確かめる順]

> 宛先、額、期限の順に照らす。

\`\`\`dragon
architecture 照らす順

box to as 宛先
box amount as 額

step 照らす
  say 宛先を照らしてから額を照らす。
  to -> amount: 次へ
\`\`\`

## 記録

### どこに残すのか [menu: 残す場所]

> 確かめた結果を記録に残す。
`;

/** 問いごとの頁のmdの、1つ目と2つ目の問いの図の題。書いた順 (#3998) */
const PAGES_FIGURES = { first: ["どこで止めるのか", "止めた後に返す物"], second: ["照らす順"] };

/** 問いごとの頁のmdを一時のdirに書き、mdのpathを返す (#3998) */
function writePagesGuide(): string {
  const root = tempDir("guide-pages");
  writeFiles(root, { "notes.md": PAGES_GUIDE });
  return join(root, "notes.md");
}

/** 頁の中を`####`の見出しで区切った問いと、見出しを持たない問いを持つ説明の頁 (#4010) */
const DOCS_GUIDE = `---
layout: guide
---

# 送金の止め方

送金を止める仕組みを、左の目次の3段で読む。

## 止める仕組み

${TOPIC_LEAD}

### 何を止めるのか [menu: 止める物]

> 規則に合わない送金を止める。

#### 止める場所

送金がどこで止まるかを追う。

\`\`\`dragon
architecture どこで止めるのか

box agent as エージェント
box check as 確かめる所

step 送る
  say エージェントが送金を確かめる所へ送る。
  agent -> check: 送金
\`\`\`

${LONG_FILLER}

#### 止めた後

${LONG_FILLER}

### どの順で確かめるのか [menu: 確かめる順]

> 宛先、額、期限の順に照らす。

\`\`\`dragon
architecture 照らす順

box to as 宛先
box amount as 額

step 照らす
  say 宛先を照らしてから額を照らす。
  to -> amount: 次へ
\`\`\`

## 記録

### どこに残すのか [menu: 残す場所]

> 確かめた結果を記録に残す。

#### 残す中身

止めた送金と理由を残す。

#### 読む人

利用者と運営が読む。
`;

/** 左の目次の3段の頁の、1つ目と3つ目の問いの`####`の見出し。書いた順 (#4010) */
const DOCS_HEADS = { first: ["止める場所", "止めた後"], third: ["残す中身", "読む人"] };

/** 左の目次の3段の頁のmdを一時のdirに書き、mdのpathを返す (#4010) */
function writeDocsGuide(): string {
  const root = tempDir("guide-docs");
  writeFiles(root, { "notes.md": DOCS_GUIDE });
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
 * 話題の名前は頁の上のヘッダー (印刷の形では隠す) の話題のタブ (最初の全体像のタブを除く) から読み、タブが指す話題の面を読む (#3961、#4024)
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
    const topics = [...document.querySelectorAll("header.pg-head nav.pg-head-tabs a")].slice(1).map((tab) => {
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
 * 今見えている頁の形 (#3983、#3991)。URLの`#`の後ろ、見えている節の番号と題、見えている話題の題と話題の頭の中身、頁の題と頭の中身と全体像が見えるか、
 * 目次の印の行き先、見えている前と次のlinkの向きと行き先と字、見えている話題の道筋の行き先、見えているタブの字と行き先と印、目次に見えている問いの番号、見えている話題の頭の一覧の行き先
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
      // 頁の行は頁の上のヘッダーの全体像と話題のタブ (#4024)
      tabs: [...document.querySelectorAll("header.pg-head nav.pg-head-tabs a")]
        .filter(vis)
        .map((a) => ({ text: sq(a.textContent), href: dec(a.getAttribute("href") ?? ""), current: a.getAttribute("aria-current") === "true" })),
      menu: [...document.querySelectorAll("nav.pg-menu a.pg-menu-q")].filter(vis).map((a) => sq(a.querySelector(".pg-menu-name")?.textContent)),
      map: [...document.querySelectorAll(".pg-map-list a")].filter(vis).map((a) => dec(a.getAttribute("href") ?? "")),
    };
  });

/** 頁のURLの場所の名前を`place`に変え、頁がその場所を開くのを待たずに返す。待つのは呼ぶ側が読む物で決める */
const openPlace = (page: Page, place: string): Promise<void> =>
  page.evaluate((to) => {
    location.hash = `#${to}`;
  }, place);

/** 見えている節の題を、頭の番号 (`1-2`) を外して`,`で繋ぐ。番号を持つ頁でも持たない頁 (#4024) でも同じ字になる */
const titlesOf = (sections: readonly string[]): string => sections.map((s) => s.replace(/^\s*\d+-\d+/u, "").trim()).join();

/** 押す動きを 1 つの頁で順に測る。話題が2つ以上の頁なので、全体像のタブから話題のタブへ移って押す (#3991)。印刷の形は最後に切り替える */
const PRESSED = await atLoad("説明の頁を開き、話題のタブと左の目次の問いと話題の頭の一覧と確かめる問いと用語の下線とタブの終わりのlinkを押してから印刷の形にする", () =>
  openGuide(
    async (page) => {
      const step = inOrder();
      const start = await step("頁を開いた時の、見えている節とタブと頁の題と頭の中身と話題の道筋を読む", async () => {
        await figuresDrawn(page);
        return pageState(page);
      });
      // 話題の頁へはURLで移る。話題の行は左の目次からヘッダーのタブへ移る (#4024)
      const tabbed = await step("1つ目の話題の頁をURLで開き、その話題の頭の地図が見えるのを待つ", async () => {
        await openPlace(page, "止める仕組み");
        return readUntil(() => pageState(page), (shown) => shown.hash === "#止める仕組み" && shown.map.length > 0, WAIT);
      });
      const jumped = await step("左の目次で2つ目の問いを押し、その問いの頁が開くのを待つ", async () => {
        const question = page.locator("nav.pg-menu a.pg-menu-q:visible", { hasText: "どの順で確かめるのか" });
        if ((await question.count()) === 0) return { ...(await pageState(page)), top: undefined };
        await question.first().click({ timeout: WAIT });
        const state = await readUntil(() => pageState(page), (shown) => shown.hash === "#どの順で確かめるのか" && titlesOf(shown.sections) === "どの順で確かめるのか", WAIT);
        return { ...state, top: await sectionTop(page, "どの順で確かめるのか") };
      });
      const mapped = await step("1つ目の話題の頁をURLで開いて頭へ戻り、話題の頭の一覧の2つ目の行を押して、その節が画面の上に来るのを待つ", async () => {
        await openPlace(page, "止める仕組み");
        await readUntil(() => pageState(page), (shown) => shown.hash === "#止める仕組み" && shown.map.length > 0, WAIT);
        const rows = page.locator(".pg-map a:visible");
        const count = await rows.count();
        if (count < 2) return { count, top: undefined, hash: "" };
        await rows.nth(1).click({ timeout: WAIT });
        const top = await readUntil(() => sectionTop(page, "どの順で確かめるのか"), (at) => at !== undefined && at >= 0 && at < 200, WAIT);
        return { count, top, hash: await page.evaluate(() => decodeURIComponent(location.hash)) };
      });
      // 確かめる問いと用語の下線は1つ目の問いの中に在るので、1つ目の問いの頁を開いてから押す (#3998)
      await step("左の目次で1つ目の問いを押し、その問いの頁が開くのを待つ", async () => {
        const question = page.locator("nav.pg-menu a.pg-menu-q:visible", { hasText: "何を止めるのか" });
        if ((await question.count()) === 0) return pageState(page);
        await question.first().click({ timeout: WAIT });
        return readUntil(() => pageState(page), (shown) => shown.hash === "#何を止めるのか" && titlesOf(shown.sections) === "何を止めるのか", WAIT);
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
        if (first.length === 0) return { first, opened: first, answer: "", closed: first };
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
        if ((await link.count()) === 0) return { underline: "", before: [], opened: [], anchor: { bottom: 0, secLeft: 0, secRight: 0 }, closedByIcon: [], closedOutside: [], closedAgain: [] };
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
      // 頁の並びは全体像、話題ごとの地図と問いなので、1つ目の問いの頁から次のlinkを2度押すと2つ目の話題の地図に着く (#3998)
      const ended = await step("1つ目の問いの頁の次のlinkを2度押して2つ目の話題のタブに切り替わり、目次でその話題の問いを開く", async () => {
        const next = page.locator(".pg-pager a.pg-pager-next:visible");
        for (const [at, sections] of [
          ["#どの順で確かめるのか", "どの順で確かめるのか"],
          ["#記録", ""],
        ] as const) {
          if ((await next.count()) === 0) break;
          await next.first().click({ timeout: WAIT });
          await readUntil(() => pageState(page), (shown) => shown.hash === at && titlesOf(shown.sections) === sections, WAIT);
        }
        const question = page.locator("nav.pg-menu a.pg-menu-q:visible", { hasText: "どこに残すのか" });
        if ((await question.count()) > 0) await question.first().click({ timeout: WAIT });
        return { state: await readUntil(() => pageState(page), (shown) => shown.topics.length === 1 && shown.topics[0] === "記録" && shown.sections.length === 1, WAIT) };
      });
      const glossary = await step("「記録」の用語の札を開き、札の中の「規則」のlinkを押して用語のタブに切り替わるのを待つ", async () => {
        const recorded = page.locator(".pg-sec:visible .pg-term", { hasText: "記録" });
        if ((await recorded.count()) === 0) return { links: 0, href: "", state: await pageState(page), entry: undefined };
        await recorded.first().click({ timeout: WAIT });
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
          tabs: await deepAll(page, "nav.pg-tabs"),
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
      return { start, tabbed, jumped, mapped, quiz, term, ended, glossary, printed };
    },
    { width: 1200, height: 500 },
    writeLinkedGuide,
  ),
);

/** 左の目次の問いが全て見えているか。話題のタブに分けた頁は、開いている話題の問いだけを数える (#3991)。ほかの話題の問いの並びは隠す (#4024) */
const menuShown = (page: Page): Promise<boolean> =>
  page.evaluate(() => {
    const links = [...document.querySelectorAll<HTMLElement>("nav.pg-menu a.pg-menu-q")].filter((a) => !a.closest("[data-off], [hidden]"));
    return links.length > 0 && links.every((a) => a.checkVisibility());
  });

/**
 * 幅`width`の枠で、最初の節の札と答えを開いた頁の字の大きさとはみ出す幅を測り、左の目次を開いた形でもう一度測る。
 * 話題が2つ以上の頁は話題ごとのタブに分けるので、1つ目の問いを開いて測り、用語のタブへ移って用語が見えるかと字を読む (#3983、#3991)
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
  // 目次は問いを持つ話題のタブで開く。用語のタブの目次は問いを持たない (#3991)
  await page.goto(at(ids.first), { timeout: ACTION_LIMIT_MS });
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
 * 左の目次 (`nav.pg-menu`) の話題と問い。話題ごとの並び (`.pg-menu-group`) を書いた順に読み、問いは`a.pg-menu-q`の番号 (`.pg-num`) と名前 (`.pg-menu-name`) と行き先を読む。
 * 話題の名前は並びの`.pg-menu-topic`の字 (中に問いを入れた形でも問いの字を外す) か、頁に分けた頁は並びが指す話題 (`data-topic`) の頁の上のヘッダーのタブの字 (#4024)
 */
function menuOf(doc: Document): { topic: string; questions: { number: string; name: string; href: string }[] }[] {
  const tabName = (id: string): string =>
    squash([...doc.querySelectorAll("header.pg-head nav.pg-head-tabs a")].find((a) => decodeURIComponent(a.getAttribute("href") ?? "") === `#${id}`)?.textContent);
  return [...(doc.querySelector("nav.pg-menu")?.querySelectorAll(".pg-menu-group") ?? [])].map((group) => {
    const row = group.querySelector(".pg-menu-topic");
    return {
      topic: row ? textWithout(row, "a.pg-menu-q") : tabName(group.getAttribute("data-topic") ?? ""),
      questions: [...group.querySelectorAll("a.pg-menu-q")].map((el) => ({
        number: squash(el.querySelector(".pg-num")?.textContent),
        name: squash(el.querySelector(".pg-menu-name")?.textContent),
        href: decodeURIComponent(el.getAttribute("href") ?? ""),
      })),
    };
  });
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

/** 問いごとの頁で見えている節と地図と頭の中身、目次の問いと図の題、前と次のlinkを読む (#3998) */
const pagesState = (page: Page) =>
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
      sections: [...document.querySelectorAll(".pg-sec")].filter(vis).map((sec) => sec.id),
      map: [...document.querySelectorAll(".pg-map")].some(vis),
      lead: [...document.querySelectorAll(".pg-topic-lead")].some(vis),
      questions: [...document.querySelectorAll("nav.pg-menu a.pg-menu-q")].filter(vis).map((a) => ({ text: sq(a.textContent), numbers: a.querySelectorAll(".pg-num").length })),
      figures: [...document.querySelectorAll("nav.pg-menu a.pg-menu-fig")].filter(vis).map((a) => ({ text: sq(a.textContent), href: dec(a.getAttribute("href") ?? "") })),
      pager: [...document.querySelectorAll(".pg-pager a")].filter(vis).map((a) => `${a.classList.contains("pg-pager-prev") ? "prev" : "next"} ${dec(a.getAttribute("href") ?? "")}`),
    };
  });

/** 場所の名前`id`の要素の上の縁の、画面の上の縁からの位置。要素が無いか見えない時は undefined */
const topOf = (page: Page, id: string): Promise<number | undefined> =>
  page.evaluate((at) => {
    const el = document.getElementById(at);
    return el && el.checkVisibility() ? el.getBoundingClientRect().top : undefined;
  }, id);

/** 話題のタブの中を問いごとの頁に分けた頁で、タブと目次の問いと図の題と地図の行と次のlinkを順に押す (#3998) */
const PAGED = await atLoad("問いごとの頁に分けた説明の頁を開き、話題のタブと目次の問いと図の題と地図の行と次のlinkを押す", () =>
  openGuide(
    async (page) => {
      const step = inOrder();
      const topic = await step("1つ目の話題の頁をURLで開き、話題の頭の地図が見えるのを待つ", async () => {
        await figuresDrawn(page);
        await openPlace(page, "止める仕組み");
        return readUntil(() => pagesState(page), (shown) => shown.hash === "#止める仕組み" && shown.map, WAIT);
      });
      const question = await step("目次で1つ目の問いを押し、その問いの頁が開くのを待つ", async () => {
        await page.locator("nav.pg-menu a.pg-menu-q:visible", { hasText: "止める物" }).first().click({ timeout: WAIT });
        return readUntil(() => pagesState(page), (shown) => shown.hash === "#何を止めるのか" && shown.sections.join() === "何を止めるのか", WAIT);
      });
      const figure = await step("目次で開いた問いの2つ目の図の題を押し、その図が画面の上に来るのを待つ", async () => {
        const rows = page.locator("nav.pg-menu a.pg-menu-fig:visible");
        if ((await rows.count()) < 2) return { href: "", before: undefined, top: undefined, hash: "" };
        const href = (await rows.nth(1).evaluate((a) => decodeURIComponent(a.getAttribute("href") ?? ""))).slice(1);
        const before = await topOf(page, href);
        await rows.nth(1).click({ timeout: WAIT });
        const top = await readUntil(() => topOf(page, href), (at) => at !== undefined && at >= 0 && at < 200, WAIT);
        return { href, before, top, hash: await page.evaluate(() => decodeURIComponent(location.hash)) };
      });
      const mapped = await step("1つ目の話題の頁をURLで開いて頭の地図へ戻り、地図の2つ目の行を押して、その問いの頁が開くのを待つ", async () => {
        await openPlace(page, "止める仕組み");
        await readUntil(() => pagesState(page), (shown) => shown.hash === "#止める仕組み" && shown.map, WAIT);
        const rows = page.locator(".pg-map a:visible");
        if ((await rows.count()) >= 2) await rows.nth(1).click({ timeout: WAIT });
        return readUntil(() => pagesState(page), (shown) => shown.hash === "#どの順で確かめるのか" && shown.sections.join() === "どの順で確かめるのか", WAIT);
      });
      const next = await step("2つ目の問いの頁の次のlinkを押し、2つ目の話題の頭の地図が開くのを待つ", async () => {
        const link = page.locator(".pg-pager a.pg-pager-next:visible");
        if ((await link.count()) > 0) await link.first().click({ timeout: WAIT });
        return readUntil(() => pagesState(page), (shown) => shown.hash === "#記録" && shown.map, WAIT);
      });
      return { topic, question, figure, mapped, next };
    },
    { width: 1200, height: 700 },
    writePagesGuide,
  ),
);

/** 左の目次の3段で見えている物。頁の見出しと図の題と、見えている節 (#4010) */
const docsState = (page: Page) =>
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
    const rows = (selector: string) => [...document.querySelectorAll(`nav.pg-menu ${selector}`)].filter(vis).map((a) => ({ text: sq(a.textContent), href: dec(a.getAttribute("href") ?? "") }));
    return {
      hash: dec(location.hash),
      heads: rows("a.pg-menu-head"),
      figures: rows("a.pg-menu-fig"),
      sections: [...document.querySelectorAll(".pg-sec")].filter(vis).map((sec) => sec.id),
    };
  });

/** 左の目次の3段の頁で、話題の頁から目次の問いと頁の見出しを順に押す (#4010)。全体像の頁は左の目次を出さないので、話題の頁をURLで開いてから押す (#4024) */
const DOCS = await atLoad("左の目次を3段にした説明の頁を開き、話題の頁から目次の問いと頁の見出しを押す", () =>
  openGuide(
    async (page) => {
      const step = inOrder();
      const question = await step("1つ目の話題の頁をURLで開き、目次で1つ目の問いを押して、その問いの頁と頁の見出しの並びが開くのを待つ", async () => {
        await figuresDrawn(page);
        await openPlace(page, "止める仕組み");
        await readUntil(() => docsState(page), (shown) => shown.hash === "#止める仕組み", WAIT);
        await page.locator("nav.pg-menu a.pg-menu-q:visible", { hasText: "止める物" }).first().click({ timeout: WAIT });
        return readUntil(() => docsState(page), (shown) => shown.sections.join() === "何を止めるのか" && shown.heads.length > 0, WAIT);
      });
      const head = await step("目次で開いた問いの2つ目の見出しを押し、その見出しが画面の上に来るのを待つ", async () => {
        const rows = page.locator("nav.pg-menu a.pg-menu-head:visible");
        if ((await rows.count()) < 2) return { href: "", before: undefined, top: undefined, hash: "" };
        const href = (await rows.nth(1).evaluate((a) => decodeURIComponent(a.getAttribute("href") ?? ""))).slice(1);
        const before = await topOf(page, href);
        await rows.nth(1).click({ timeout: WAIT });
        const top = await readUntil(() => topOf(page, href), (at) => at !== undefined && at >= 0 && at < 200, WAIT);
        return { href, before, top, hash: await page.evaluate(() => decodeURIComponent(location.hash)) };
      });
      const plain = await step("目次で見出しを持たない2つ目の問いを押し、その問いの頁が開くのを待つ", async () => {
        await page.locator("nav.pg-menu a.pg-menu-q:visible", { hasText: "確かめる順" }).first().click({ timeout: WAIT });
        return readUntil(() => docsState(page), (shown) => shown.sections.join() === "どの順で確かめるのか", WAIT);
      });
      return { question, head, plain };
    },
    { width: 1200, height: 700 },
    writeDocsGuide,
  ),
);

/** 見えている話題の頭の止め絵の、箱の名前の字と、薄くした箱 (`[data-dim]`) の中か (#3991) */
const focusBoxes = (page: Page, names: readonly string[]) =>
  page.evaluate((want) => {
    const out: { name: string; dim: boolean }[] = [];
    for (const map of document.querySelectorAll<HTMLElement>(".pg-map")) {
      if (!map.checkVisibility()) continue;
      for (const text of map.querySelectorAll("svg text")) {
        const name = (text.textContent ?? "").trim();
        if (want.includes(name)) out.push({ name, dim: text.closest("[data-dim]") !== null });
      }
    }
    return out;
  }, names);

/** 全体像の図の箱に話題へのlinkを書いた頁で、全体像の箱を押して話題のタブへ移り、話題の頭の止め絵を読む (#3991) */
const TABBED = await atLoad("全体像の図の箱に話題へのlinkを書いた頁を開き、全体像の箱を押して話題のタブへ移り、話題の頭の止め絵を読む", () =>
  openGuide(
    async (page) => {
      const step = inOrder();
      const start = await step("頁を開いた時の、見えているタブと節と全体像を読む", async () => {
        await figuresDrawn(page);
        return pageState(page);
      });
      const boxed = await step("全体像の図で1つ目の話題へのlinkを持つ箱を押し、1つ目の話題のタブに切り替わるのを待つ", async () => {
        const box = page.locator('section.pg-overview svg a[href="#止める仕組み"]');
        const count = await box.count();
        if (count === 0) return { count, state: await pageState(page) };
        await box.last().click({ timeout: WAIT, force: true });
        return { count, state: await readUntil(() => pageState(page), (shown) => shown.topics.length === 1, WAIT) };
      });
      const focus = await step("1つ目の話題のタブの頭の止め絵が描かれるのを待ち、箱の名前と薄くした箱を読む", () =>
        readUntil(() => focusBoxes(page, ["エージェント", "確かめる所", "署名する所"]), (boxes) => boxes.length >= 3, WAIT),
      );
      const plain = await step("2つ目の話題の頁をURLで開き、話題の頭に止め絵が在るかを読む", async () => {
        await openPlace(page, "記録");
        const state = await readUntil(() => pageState(page), (shown) => shown.topics[0] === "記録", WAIT);
        const stills = await page.evaluate(() => [...document.querySelectorAll<HTMLElement>(".pg-map .dragon-still, .pg-map pre.dragon")].filter((el) => el.checkVisibility()).length);
        return { state, stills };
      });
      return { start, boxed, focus, plain };
    },
    { width: 1200, height: 900 },
    writeTabsGuide,
  ),
);

describe("説明の頁 (#3876)", () => {
  it("guide-sections-stack-in-topics", async () => {
    const doc = await exportedGuide();
    if (!doc) return;
    expect(doc.body.classList.contains("pg-layout-guide"), "layout: guide の頁の組み立て").toBe(true);
    expect(topicsOf(doc), "## の話題と、話題の中の ### の節。節の題は番号を持たない (#4024)").toEqual([
      {
        topic: "止める仕組み",
        sections: [
          { number: "", title: "何を止めるのか", hidden: false },
          { number: "", title: "どの順で確かめるのか", hidden: false },
        ],
      },
      { topic: "記録", sections: [{ number: "", title: "どこに残すのか", hidden: false }] },
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

  it("guide-question-list-jumps-to-section", async () => {
    const doc = await exportedGuide();
    if (!doc) return;
    expect(
      menuOf(doc).map(({ topic, questions }) => ({ topic, items: questions.map(({ number, name }) => ({ number, name })) })),
      "左の目次の話題と、番号を持たない問い (#3998)。問いを持たない用語の話題は目次に並びを持たない (#4024)",
    ).toEqual([
      {
        topic: "止める仕組み",
        items: [
          { number: "", name: "何を止めるのか" },
          { number: "", name: "どの順で確かめるのか" },
        ],
      },
      { topic: "記録", items: [{ number: "", name: "どこに残すのか" }] },
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
    // 頁の上のヘッダーも、用語の話題のタブを最後に並べる (#4024)
    const lastTab = [...doc.querySelectorAll("header.pg-head nav.pg-head-tabs a")].at(-1);
    expect({ text: squash(lastTab?.textContent), href: decodeURIComponent(lastTab?.getAttribute("href") ?? "") }, "頁の上のヘッダーの最後のタブ").toEqual({ text: "用語", href: `#${topic?.id ?? ""}` });
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
      "左の目次の話題と、話題ごとの問いの番号と行き先。目次の問いは番号を持たない (#3998)",
    ).toEqual([
      {
        topic: "止める仕組み",
        questions: [
          { number: "", href: hrefs[0] },
          { number: "", href: hrefs[1] },
        ],
      },
      {
        topic: "記録",
        questions: [
          { number: "", href: hrefs[2] },
          { number: "", href: hrefs[3] },
        ],
      },
      { topic: "送り直す仕組み", questions: [{ number: "", href: hrefs[4] }] },
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
    // 頁の上のヘッダーの最初のタブは全体像へ移る (#4024)
    expect(overview?.id ?? "", "全体像に場所の名前が無い").not.toBe("");
    const first = doc.querySelector("header.pg-head nav.pg-head-tabs a");
    expect(
      { href: decodeURIComponent(first?.getAttribute("href") ?? ""), text: squash(first?.textContent) },
      "頁の上のヘッダーの最初のタブが全体像へ移らない",
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
    expect(doc.querySelectorAll('.pg-topics, .pg-qlist, [role="tablist"]').length, "#3876の話題のタブか問いの一覧の組み立てが残る").toBe(0);
    expect(
      [...doc.querySelectorAll("section.pg-topic")].map((topic) => ({
        title: topic.firstElementChild?.matches("h2.pg-topic-title") ? squash(topic.firstElementChild.textContent) : "",
        hidden: topic.closest("[hidden]") !== null,
        sections: topic.querySelectorAll(".pg-sec").length,
        numbers: topic.querySelectorAll(".pg-num").length,
      })),
      "話題ごとに頭の題 (h2.pg-topic-title) と、隠さずに続けて積む節の数。節の題は番号 (.pg-num) を持たない (#4024)",
    ).toEqual([
      { title: "止める仕組み", hidden: false, sections: 2, numbers: 0 },
      { title: "記録", hidden: false, sections: 2, numbers: 0 },
      { title: "送り直す仕組み", hidden: false, sections: 1, numbers: 0 },
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
 * 全体像の図の後の段落 (#3969)。
 *
 * 頭の中身のうち図の前の文は頁の頭に残し、図の後の段落は全体像 (`section.pg-overview`) の中で図の直後、話題の道筋の前に書いた順に出す。
 * その段落の用語のリンクも、頭の文と同じく押すと札がすぐ下に開く下線になる。問いの番号は出さない (#4024)。
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
});

/**
 * 話題が2つ以上ある説明の頁を、全体像と話題ごとのタブに分ける (#3991)。
 *
 * 頁の上に全体像と話題のタブを並べ、左の目次はその話題の問いだけを出す。話題のタブは頭の地図を見せ、問いは問いごとの頁で見せる (#3998)。
 * 話題のタブの頭には、全体像の図のうちその話題へのlinkを持つ箱に色を残した止め絵と、問いの番号と名前と答えの一覧を置く。
 * 全体像の図で`link: #<話題のid>`を持つ箱を押すと、その話題のタブに切り替わる。話題が1つの頁はタブを持たず、全ての節を1つの頁に積む。
 */
describe("話題のタブ (#3991)", () => {
  it("guide-tabs-open-on-overview", async () => {
    const doc = await exportedGuide(writeLinkedGuide());
    if (!doc) return;
    const glossaryId = [...doc.querySelectorAll("section.pg-topic")].find((topic) => topic.querySelector(".pg-glossary"))?.id ?? "";
    expect(glossaryId, "用語の話題に場所の名前が無い").not.toBe("");
    expect(
      [...doc.querySelectorAll("header.pg-head nav.pg-head-tabs a")].map((a) => `${squash(a.textContent)} ${decodeURIComponent(a.getAttribute("href") ?? "")}`),
      "頁の上のヘッダーのタブの名前と行き先。全体像の後に話題を書いた順に並べる (#4024)",
    ).toEqual(["全体像 #", "止める仕組み #止める仕組み", "記録 #記録", `用語 #${glossaryId}`]);
    const seen = PRESSED.get();
    if (!seen) return;
    const start = seen.start.get();
    expect(start.sections, "頁を開いた時に見えている問いの節").toEqual([]);
    // 頁の題はヘッダーに出し、本文の頭に重ねない (#4024)
    expect({ title: start.head.title, lead: start.head.lead }, "頁を開いた時に本文の頭に見えている頁の題 (h1) と頭の中身").toEqual({ title: false, lead: true });
    expect(start.tabs.filter((tab) => tab.current).map((tab) => tab.text), "頁を開いた時に印の付いたヘッダーのタブ").toEqual(["全体像"]);
    expect(start.route, "頁を開いた時に見えている話題の道筋の行き先").toEqual(["#止める仕組み", "#記録"]);
    const tabbed = TABBED.get();
    if (!tabbed) return;
    const top = tabbed.start.get();
    expect(top.sections, "全体像を持つ頁を開いた時に見えている問いの節").toEqual([]);
    expect(top.head.overview, "全体像を持つ頁を開いた時に全体像が見えない").toBe(true);
    expect(top.tabs.filter((tab) => tab.current).map((tab) => tab.text), "全体像を持つ頁を開いた時に印の付いたヘッダーのタブ").toEqual(["全体像"]);
    expect(top.tabs.length, "全体像を持つ頁のヘッダーのタブの数").toBe(5);
  });

  it("guide-tabs-topic-map-lists-answers", async () => {
    const doc = await exportedGuide(writeOverviewGuide());
    if (!doc) return;
    const ids = sectionIds(doc).map((id) => `#${id}`);
    expect(ids.length, "本文の節の数").toBe(5);
    expect(
      [...doc.querySelectorAll("section.pg-topic")].map((topic) => ({
        topic: squash(topic.querySelector(":scope > h2.pg-topic-title")?.textContent),
        rows: [...topic.querySelectorAll(":scope > .pg-topic-head > .pg-map a")].map((a) => ({
          number: squash(a.querySelector(".pg-num")?.textContent),
          name: squash(a.querySelector(".pg-map-name")?.textContent),
          answer: squash(a.querySelector(".pg-map-answer")?.textContent),
          href: decodeURIComponent(a.getAttribute("href") ?? ""),
        })),
      })),
      "話題の頭の一覧の行。番号を持たない (#4024) 目次の名前と答えの1文と、問いの節への行き先",
    ).toEqual([
      {
        topic: "止める仕組み",
        rows: [
          { number: "", name: "止める場所", answer: "確かめる所で止まり、署名する所へは届かない。", href: ids[0] },
          { number: "", name: "宛先と額と期限は、1回の送金でどの順に照らし合わせるのか", answer: "宛先、額、期限の順に照らす。", href: ids[1] },
        ],
      },
      { topic: "記録", rows: [{ number: "", name: "止めた送金とその理由は、後から誰がどこで読めるのか", answer: "記録の一覧に残り、利用者が読める。", href: ids[2] }] },
      {
        topic: "送り直す仕組み",
        rows: [
          { number: "", name: "止めた送金は、規則を直した後でもう一度送れるのか", answer: "送れる。直した規則で初めから確かめ直す。", href: ids[3] },
          { number: "", name: "送り直した送金は、前に止めた記録とどう繋がるのか", answer: "記録に前の送金の番号を残す。", href: ids[4] },
        ],
      },
      { topic: "用語", rows: [] },
    ]);
    const seen = PRESSED.get();
    if (!seen) return;
    const mapped = seen.mapped.get();
    expect(mapped.count, "1つ目の話題のタブの頭に見えている一覧の行の数").toBe(2);
    expect(mapped.top ?? -1, "一覧の行を押しても、その節が画面の上へ来ない").toBeGreaterThanOrEqual(0);
    expect(mapped.top ?? 999, "一覧の行を押しても、その節が画面の上へ来ない").toBeLessThan(200);
    expect(mapped.hash, "一覧の行を押した後のURLの#の後ろ").toBe("#どの順で確かめるのか");
  });

  it("guide-tabs-overview-box-opens-topic", () => {
    const tabbed = TABBED.get();
    if (!tabbed) return;
    const { count, state } = tabbed.boxed.get();
    expect(count, "全体像の図の中の、1つ目の話題へのlinkを持つ箱の数").toBe(2);
    expect(state.hash, "全体像の箱を押した後のURLの#の後ろ").toBe("#止める仕組み");
    expect(state.topics, "全体像の箱を押した後に見えている話題").toEqual(["止める仕組み"]);
    expect(state.sections, "全体像の箱を押した後に見えている節。話題の頭の地図だけを見せる (#3998)").toEqual([]);
    expect(state.map.length, "全体像の箱を押した後に見えている話題の頭の一覧の行の数").toBe(2);
    expect(state.head.overview, "全体像の箱を押した後も全体像が見える").toBe(false);
  });

  it("guide-tabs-topic-map-focus-figure", async () => {
    const doc = await exportedGuide(writeTabsGuide());
    if (!doc) return;
    expect(
      [...doc.querySelectorAll("section.pg-topic")].map((topic) => ({
        topic: squash(topic.querySelector(":scope > h2.pg-topic-title")?.textContent),
        focus: [...topic.querySelectorAll(":scope > .pg-topic-head > .pg-map pre.dragon[data-still]")].map((pre) => pre.getAttribute("data-focus")),
      })),
      "話題の頭の止め絵と、色を残す箱の行き先",
    ).toEqual([
      { topic: "止める仕組み", focus: ["#止める仕組み"] },
      { topic: "記録", focus: [] },
      { topic: "送り直す仕組み", focus: ["#送り直す仕組み"] },
      { topic: "用語", focus: [] },
    ]);
    // 止め絵は全体像の図と同じ図を描く
    expect(squash(doc.querySelector(".pg-map pre.dragon")?.textContent), "話題の頭の止め絵が全体像の図と違う").toBe(squash(doc.querySelector("section.pg-overview pre.dragon")?.textContent));
    const tabbed = TABBED.get();
    if (!tabbed) return;
    expect(
      Object.fromEntries(tabbed.focus.get().map((box) => [box.name, box.dim])),
      "1つ目の話題のタブの頭の止め絵の箱と、薄くしたか。1つ目の話題へのlinkを持つ箱だけ色を残す",
    ).toEqual({ エージェント: false, 確かめる所: false, 署名する所: true });
    expect(tabbed.plain.get().stills, "linkを持つ箱の無い2つ目の話題のタブの頭に見えている止め絵の数").toBe(0);
  });

  it("guide-tabs-term-link-opens-glossary-tab", () => {
    const seen = PRESSED.get();
    if (!seen) return;
    const glossary = seen.glossary.get();
    expect(glossary.links, "「記録」の札の中の「規則」のlinkの数").toBe(1);
    expect(glossary.state.topics, "札の中のlinkを押した後に見えている話題").toEqual(["用語"]);
    expect(glossary.state.tabs.filter((tab) => tab.current).map((tab) => tab.text), "札の中のlinkを押した後に印の付いたヘッダーのタブ").toEqual(["用語"]);
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
    expect(doc.querySelectorAll("nav.pg-tabs").length, "話題が1つの頁のタブの並びの数").toBe(0);
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

/**
 * 話題のタブの中を問いごとの頁に分ける (#3998)。
 *
 * 話題のタブは頭の地図と頭の中身だけを見せ、目次の問いか地図の行を押すとその問いの節だけを見せる。目次の問いは番号を持たず、
 * 開いた問いの下にその問いの図の題を並べ、題を押すとその図へ移る。地図と問いの頁の終わりには、全体像、話題ごとの地図と問いを書いた順に並べた前と次の頁へのlinkを置く。
 */
describe("問いごとの頁 (#3998)", () => {
  it("guide-question-pages-topic-shows-map-only", () => {
    const seen = PAGED.get();
    if (!seen) return;
    const topic = seen.topic.get();
    expect(topic.hash, "話題のタブを押した後のURLの#の後ろ").toBe("#止める仕組み");
    expect(topic.sections, "話題のタブを押した後に見えている問いの節").toEqual([]);
    expect({ map: topic.map, lead: topic.lead }, "話題のタブを押した後に見えている話題の頭の地図と頭の中身").toEqual({ map: true, lead: true });
    const next = seen.next.get();
    expect({ hash: next.hash, sections: next.sections, map: next.map }, "次のlinkで2つ目の話題のタブに移った後の、見えている問いの節と地図").toEqual({ hash: "#記録", sections: [], map: true });
  });

  it("guide-question-pages-menu-without-numbers", async () => {
    for (const [name, write] of [
      ["話題が2つの頁", writePagesGuide],
      ["話題が1つの頁", writeStackGuide],
    ] as const) {
      const doc = await exportedGuide(write());
      if (!doc) return;
      const rows = [...doc.querySelectorAll("nav.pg-menu a.pg-menu-q")];
      expect(rows.length, `${name}の目次の問いの数`).toBeGreaterThan(0);
      expect(
        rows.map((a) => a.querySelectorAll(".pg-num").length),
        `${name}の目次の問いが持つ番号の数`,
      ).toEqual(rows.map(() => 0));
    }
    const seen = PAGED.get();
    if (!seen) return;
    // 左の目次は開いている話題の問いだけを並べる (#4024)
    expect(seen.topic.get().questions, "話題の頁を開いた時に左の目次に見えている問いの字と番号の数").toEqual([
      { text: "止める物", numbers: 0 },
      { text: "確かめる順", numbers: 0 },
    ]);
  });

  it("guide-question-pages-menu-opens-one-question", () => {
    const seen = PAGED.get();
    if (!seen) return;
    const question = seen.question.get();
    expect(question.hash, "目次の問いを押した後のURLの#の後ろ").toBe("#何を止めるのか");
    expect(question.sections, "目次の問いを押した後に見えている問いの節").toEqual(["何を止めるのか"]);
    expect({ map: question.map, lead: question.lead }, "目次の問いを押した後に見えている話題の頭の地図と頭の中身").toEqual({ map: false, lead: false });
  });

  it("guide-question-pages-map-row-opens-question", () => {
    const seen = PAGED.get();
    if (!seen) return;
    const mapped = seen.mapped.get();
    expect(mapped.hash, "地図の行を押した後のURLの#の後ろ").toBe("#どの順で確かめるのか");
    expect(mapped.sections, "地図の行を押した後に見えている問いの節").toEqual(["どの順で確かめるのか"]);
    expect(mapped.map, "地図の行を押した後も話題の頭の地図が見える").toBe(false);
  });

  it("guide-question-pages-menu-lists-open-figures", async () => {
    const doc = await exportedGuide(writePagesGuide());
    if (!doc) return;
    const figureIds = (id: string): string[] => [...(doc.getElementById(id)?.querySelectorAll(".pg-figure") ?? [])].map((f) => `#${f.id}`);
    const first = figureIds("何を止めるのか");
    const second = figureIds("どの順で確かめるのか");
    expect({ first: first.length, second: second.length }, "問いの節の図の数").toEqual({ first: 2, second: 1 });
    expect([...first, ...second].filter((id) => id === "#"), "場所の名前を持たない問いの図").toEqual([]);
    const seen = PAGED.get();
    if (!seen) return;
    expect(seen.question.get().figures, "1つ目の問いを開いた時に目次に見えている図の題と行き先").toEqual(PAGES_FIGURES.first.map((text, n) => ({ text, href: first[n] ?? "" })));
    expect(seen.mapped.get().figures, "2つ目の問いを開いた時に目次に見えている図の題と行き先").toEqual(PAGES_FIGURES.second.map((text, n) => ({ text, href: second[n] ?? "" })));
  });

  it("guide-question-pages-menu-hides-closed-figures", async () => {
    const doc = await exportedGuide(writePagesGuide());
    if (!doc) return;
    expect(doc.querySelectorAll("nav.pg-menu a.pg-menu-fig").length, "目次の中の図の題の数").toBe(PAGES_FIGURES.first.length + PAGES_FIGURES.second.length);
    const seen = PAGED.get();
    if (!seen) return;
    expect(seen.topic.get().figures, "話題の頭の地図を開いた時に目次に見えている図の題").toEqual([]);
    expect(
      seen.question.get().figures.filter((f) => PAGES_FIGURES.second.includes(f.text)),
      "1つ目の問いを開いた時に見えている、閉じた2つ目の問いの図の題",
    ).toEqual([]);
    expect(
      seen.mapped.get().figures.filter((f) => PAGES_FIGURES.first.includes(f.text)),
      "2つ目の問いを開いた時に見えている、閉じた1つ目の問いの図の題",
    ).toEqual([]);
    expect(seen.next.get().figures, "2つ目の話題の頭の地図を開いた時に目次に見えている図の題").toEqual([]);
  });

  it("guide-question-pages-figure-row-scrolls", () => {
    const seen = PAGED.get();
    if (!seen) return;
    const figure = seen.figure.get();
    expect(figure.href, "開いた問いの目次に2つ目の図の題が無い").not.toBe("");
    expect(figure.before ?? 0, "押す前から2つ目の図が画面の上に在り、移ったかを測れない").toBeGreaterThan(200);
    expect(figure.top ?? -1, "図の題を押しても、その図が画面の上へ来ない").toBeGreaterThanOrEqual(0);
    expect(figure.top ?? 999, "図の題を押しても、その図が画面の上へ来ない").toBeLessThan(200);
    expect(figure.hash, "図の題を押した後のURLの#の後ろ").toBe(`#${figure.href}`);
  });

  it("guide-question-pages-pager-follows-order", async () => {
    const doc = await exportedGuide(writePagesGuide());
    if (!doc) return;
    expect(
      [...doc.querySelectorAll(".pg-pager")].map((nav) =>
        [...nav.querySelectorAll("a")].map((a) => `${a.classList.contains("pg-pager-prev") ? "prev" : "next"} ${decodeURIComponent(a.getAttribute("href") ?? "")}`),
      ),
      "頁の終わりの前と次のlink。頁は全体像、話題ごとの地図と問いを書いた順に並べる",
    ).toEqual([
      ["next #止める仕組み"],
      ["prev #", "next #何を止めるのか"],
      ["prev #止める仕組み", "next #どの順で確かめるのか"],
      ["prev #何を止めるのか", "next #記録"],
      ["prev #どの順で確かめるのか", "next #どこに残すのか"],
      ["prev #記録"],
    ]);
    const seen = PAGED.get();
    if (!seen) return;
    expect(seen.question.get().pager, "1つ目の問いの頁で見えている前と次のlink").toEqual(["prev #止める仕組み", "next #どの順で確かめるのか"]);
    expect(seen.mapped.get().pager, "2つ目の問いの頁で見えている前と次のlink").toEqual(["prev #何を止めるのか", "next #記録"]);
    const pressed = PRESSED.get();
    if (!pressed) return;
    const { pagers, tabs } = pressed.printed.get();
    expect(pagers.length, "印刷の形の頁の前と次のlinkの並びの数").toBeGreaterThan(0);
    expect(pagers.filter((p) => p.visible).length, "印刷の形で見える前と次のlinkの並び").toBe(0);
    expect(tabs.filter((t) => t.visible).length, "印刷の形で見えるタブの並び").toBe(0);
  });
});

/**
 * 左の目次の3段 (#4010)。
 *
 * 開いた問いの下にその頁の`####`の見出しを並べ、見出しを持たない問いは図の題を並べる。
 * 話題をヘッダーのタブへ移し、左の目次に開いている章の頁だけを並べる形は「ヘッダーの章のタブ (#4024)」が見る。
 */
describe("左の目次の3段 (#4010)", () => {
  it("guide-docs-menu-lists-page-headings", async () => {
    const doc = await exportedGuide(writeDocsGuide());
    if (!doc) return;
    const headIds = (id: string): string[] => [...(doc.getElementById(id)?.querySelectorAll("h4") ?? [])].map((h) => `#${h.id}`);
    const first = headIds("何を止めるのか");
    expect(first.length, "1つ目の問いの節の`####`の見出しの数").toBe(DOCS_HEADS.first.length);
    expect(first.filter((id) => id === "#"), "場所の名前を持たない`####`の見出し").toEqual([]);
    const seen = DOCS.get();
    if (!seen) return;
    expect(seen.question.get().heads, "1つ目の問いを開いた時に目次に見えている頁の見出しと行き先").toEqual(DOCS_HEADS.first.map((text, n) => ({ text, href: first[n] ?? "" })));
    const head = seen.head.get();
    expect(head.href, "開いた問いの目次に2つ目の見出しが無い").not.toBe("");
    expect(head.before ?? 0, "押す前から2つ目の見出しが画面の上に在り、移ったかを測れない").toBeGreaterThan(200);
    expect(head.top ?? -1, "見出しを押しても、その見出しが画面の上へ来ない").toBeGreaterThanOrEqual(0);
    expect(head.top ?? 999, "見出しを押しても、その見出しが画面の上へ来ない").toBeLessThan(200);
    expect(head.hash, "見出しを押した後のURLの#の後ろ").toBe(`#${head.href}`);
  });

  it("guide-docs-menu-falls-back-to-figures", async () => {
    const doc = await exportedGuide(writeDocsGuide());
    if (!doc) return;
    const rowsOf = (id: string) => {
      const li = doc.querySelector(`nav.pg-menu a.pg-menu-q[href="#${id}"]`)?.closest("li");
      return { heads: li?.querySelectorAll("a.pg-menu-head").length ?? -1, figures: [...(li?.querySelectorAll("a.pg-menu-fig") ?? [])].map((a) => squash(a.textContent)) };
    };
    expect(rowsOf("何を止めるのか"), "見出しを持つ問いの下に並べた見出しの数と図の題").toEqual({ heads: DOCS_HEADS.first.length, figures: [] });
    expect(rowsOf("どの順で確かめるのか"), "見出しを持たない問いの下に並べた見出しの数と図の題").toEqual({ heads: 0, figures: ["照らす順"] });
    const seen = DOCS.get();
    if (!seen) return;
    const plain = seen.plain.get();
    expect(plain.figures.map((f) => f.text), "見出しを持たない問いを開いた時に目次に見えている図の題").toEqual(["照らす順"]);
    expect(plain.heads, "見出しを持たない問いを開いた時に目次に見えている頁の見出し").toEqual([]);
  });
});

/** 頁の上のヘッダーの章のタブの頁 (#4024)。章の名前を長くし、タブが幅900pxでは題の横に入らず、幅390pxでは段を横に送る長さにする。1つ目の問いは段を2つ持つ図を置く */
const HEAD_GUIDE = `---
layout: guide
---

# 送金の止め方

送金を止める仕組みを、章ごとに読む。

## 送金を止める仕組み

### 何を止めるのか [menu: 止める物]

> 規則に合わない送金を止める。

\`\`\`dragon
architecture どこで止めるのか

box agent as エージェント
box check as 確かめる所
box sign as 署名する所

step 送る
  say エージェントが送金を確かめる所へ送る。
  agent -> check: 送金

step 通す
  say 確かめる所が規則に合う送金だけを署名する所へ通す。
  check -> sign: 通す
\`\`\`

## 止めた送金の記録

### どこに残すのか [menu: 残す場所]

> 確かめた結果を記録に残す。

## 規則の書き方

### 何を書くのか [menu: 書く物]

> 宛先と額と期限を書く。

## 確かめる順番

### どの順で確かめるのか [menu: 確かめる順]

> 宛先、額、期限の順に照らす。

## 運営の手引き

### 誰が読むのか [menu: 読む人]

> 利用者と運営が読む。
`;

/** ヘッダーの章のタブの頁のmdを一時のdirに書き、mdのpathを返す (#4024) */
function writeHeadGuide(): string {
  const root = tempDir("guide-head");
  writeFiles(root, { "notes.md": HEAD_GUIDE });
  return join(root, "notes.md");
}

/**
 * 頁の上のヘッダーと左の目次と本文で見えている物 (#4024)。ヘッダーの題とタブと印の付いたタブ、タブの段の送り、左の目次の頁の行と問いと頁の見出しと矢印の数、
 * 開いた問いの行の地と字の色と太さと線、見えている節と地図、頁の題 (`h1`) と頭の列の左右の縁、章の題の字と線の色、目次と本文の字の大きさ
 */
const headState = (page: Page) =>
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
    const textLeft = (el: Element | null): number | undefined => {
      if (!el) return undefined;
      const range = document.createRange();
      range.selectNodeContents(el);
      const rect = range.getClientRects()[0];
      return rect ? Math.round(rect.left) : undefined;
    };
    const sizes = (selector: string): string[] => [...new Set([...document.querySelectorAll<HTMLElement>(selector)].filter(vis).map((el) => getComputedStyle(el).fontSize))];
    const head = document.querySelector<HTMLElement>("header.pg-head");
    const title = head?.querySelector(".pg-head-title") ?? null;
    const row = head?.querySelector<HTMLElement>("nav.pg-head-tabs") ?? null;
    const tabs = [...(row?.querySelectorAll<HTMLElement>("a") ?? [])];
    const current = tabs.find((a) => a.getAttribute("aria-current") === "true") ?? null;
    const rowBox = row?.getBoundingClientRect();
    const curBox = current?.getBoundingClientRect();
    const openRow = [...document.querySelectorAll<HTMLElement>("nav.pg-menu a.pg-menu-q")].find((a) => vis(a) && (a.hasAttribute("data-open") || a.getAttribute("aria-current") === "true")) ?? null;
    const open = openRow ? getComputedStyle(openRow) : null;
    const top = document.querySelector<HTMLElement>(".pg-top");
    const col = top && vis(top) ? top.getBoundingClientRect() : undefined;
    const topicTitle = [...document.querySelectorAll<HTMLElement>("h2.pg-topic-title")].find(vis) ?? null;
    const topicStyle = topicTitle ? getComputedStyle(topicTitle) : null;
    const toggle = document.querySelector<HTMLElement>(".pg-menu-toggle");
    return {
      hash: dec(location.hash),
      head: head ? { shown: vis(head), title: sq(title?.textContent), titleLeft: textLeft(title), titleTop: title ? Math.round(title.getBoundingClientRect().top) : undefined } : null,
      current: current ? sq(current.textContent) : null,
      firstTabLeft: textLeft(tabs[0] ?? null),
      tabsTop: tabs[0] ? Math.round(tabs[0].getBoundingClientRect().top) : undefined,
      rowOverflows: row ? row.scrollWidth > row.clientWidth : false,
      currentInRow: rowBox !== undefined && curBox !== undefined && curBox.left >= rowBox.left - 1 && curBox.right <= rowBox.right + 1,
      menu: vis(document.querySelector("nav.pg-menu")),
      toggle: toggle && vis(toggle) ? toggle.getAttribute("aria-expanded") : null,
      topics: [...document.querySelectorAll("nav.pg-menu a.pg-menu-over, nav.pg-menu a.pg-menu-topic")].filter(vis).map((a) => sq(a.textContent)),
      questions: [...document.querySelectorAll("nav.pg-menu a.pg-menu-q")].filter(vis).map((a) => sq(a.textContent)),
      heads: [...document.querySelectorAll("nav.pg-menu a.pg-menu-head")].filter(vis).map((a) => sq(a.textContent)),
      open: open
        ? { text: sq(openRow?.textContent), background: open.backgroundColor, color: open.color, weight: Number(open.fontWeight), shadow: open.boxShadow, line: `${open.borderLeftWidth} ${open.borderLeftStyle}` }
        : null,
      sections: [...document.querySelectorAll(".pg-sec")].filter(vis).map((s) => s.id),
      map: [...document.querySelectorAll(".pg-topic-head")].some(vis),
      h1: vis(document.querySelector(".pg-top h1")),
      column: col ? { left: Math.round(col.left), right: Math.round(col.right) } : null,
      width: document.documentElement.clientWidth,
      topicTitle: topicStyle ? { color: topicStyle.color, line: topicStyle.borderBottomColor, lineWidth: topicStyle.borderBottomWidth } : null,
      ink: getComputedStyle(document.body).color,
      sizes: { page: sizes("nav.pg-menu a.pg-menu-q"), head: sizes("nav.pg-menu a.pg-menu-head"), text: sizes(".pg-sec > p") },
      overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    };
  });

/**
 * 見えている図の数と、図の再生の帯の段の数 (`01/02`、`[data-dragon="step-no"]`) のうち画面に見えている物の字 (#4024)。帯つきの図は帯の内側の影の根に描く。
 * `captions` は題と説明文を縦に積む狭い帯 (`.dg-say` が `grid`) ごとの、題と説明文の左端 (px、#4035)
 */
const stepCounts = (page: Page) =>
  page.evaluate(() => {
    const counts: string[] = [];
    const captions: { title: number; body: number }[] = [];
    let players = 0;
    const walk = (root: Document | ShadowRoot): void => {
      for (const el of root.querySelectorAll<HTMLElement>("*")) {
        if (el.shadowRoot) walk(el.shadowRoot);
        if (el.dataset.dragon === "player" && el.checkVisibility() && el.querySelector("svg") !== null) players += 1;
        if (el.dataset.dragon === "step-no" && el.checkVisibility() && (el.textContent ?? "").trim() !== "") counts.push((el.textContent ?? "").trim());
        if (el.classList.contains("dg-say") && el.checkVisibility() && getComputedStyle(el).display === "grid") {
          const title = el.querySelector('[data-dragon="step-title"]')?.getBoundingClientRect();
          const body = el.querySelector('[data-dragon="step-body"]')?.getBoundingClientRect();
          if (title && body) captions.push({ title: Math.round(title.left), body: Math.round(body.left) });
        }
      }
    };
    walk(document);
    return { players, counts, captions };
  });

/** 色の字が青に寄っているか。`rgb()` と `rgba()` は0から255、`color(srgb ...)` は0から1の値を読み、青の値が赤の値より20 (255で数えた値) を超えて大きい時に青とみなす */
const blueish = (color: string): boolean => {
  const values = (color.match(/[\d.]+/gu) ?? []).map(Number);
  const scale = color.startsWith("color(") ? 255 : 1;
  const [r = 0, , b = 0] = values;
  return b * scale > r * scale + 20;
};

/** 頁のURLを開き直す。同じ頁の中の場所の名前だけを変えると開き直さず前の状態が残るので、空の頁を挟む */
const reopen = async (page: Page, place: string): Promise<void> => {
  const base = page.url();
  await page.goto("about:blank", { timeout: ACTION_LIMIT_MS });
  await page.goto(new URL(`notes.html#${place}`, base).href, { timeout: ACTION_LIMIT_MS });
  await figuresDrawn(page);
};

/** ヘッダーに章のタブを置いた頁で、全体像と問いの頁と章のタブを順に開き、幅1440pxと幅390pxと印刷の形で読む (#4024) */
const HEADED = await atLoad("ヘッダーに章のタブを置いた説明の頁を開き、全体像と問いの頁と章のタブを順に開いて、幅1440pxと幅390pxと印刷の形で読む", () =>
  openGuide(
    async (page) => {
      const step = inOrder();
      const over = await step("頁を開いた時の、ヘッダーと左の目次と頁の頭の列を読む", async () => {
        await figuresDrawn(page);
        return headState(page);
      });
      const first = await step("1つ目の問いの頁をURLで開き、ヘッダーと左の目次を読む", async () => {
        await openPlace(page, "何を止めるのか");
        return readUntil(() => headState(page), (shown) => shown.sections.join() === "何を止めるのか", WAIT);
      });
      const third = await step("2つ目の章の問いの頁をURLで開き、ヘッダーと左の目次を読む", async () => {
        await openPlace(page, "どこに残すのか");
        return readUntil(() => headState(page), (shown) => shown.sections.join() === "どこに残すのか", WAIT);
      });
      // タブの無い頁でも章の題の色は章の地図の頁で読むので、タブが無い時はURLで開く
      const tabbed = await step("ヘッダーの1つ目の章のタブを押し、その章の地図の頁が開くのを待つ", async () => {
        const tab = page.locator("header.pg-head nav.pg-head-tabs a", { hasText: "止める仕組み" });
        const pressed = (await tab.count()) > 0;
        if (pressed) await tab.first().click({ timeout: WAIT });
        else await openPlace(page, "止める仕組み");
        return { pressed, state: await readUntil(() => headState(page), (shown) => shown.hash === "#止める仕組み" && shown.map, WAIT) };
      });
      const wide = await step("幅1440pxで1つ目の問いの頁を開き、目次と本文の字の大きさを読む", async () => {
        await page.setViewportSize({ width: 1440, height: 900 });
        await openPlace(page, "何を止めるのか");
        return readUntil(() => headState(page), (shown) => shown.sections.join() === "何を止めるのか", WAIT);
      });
      const phone = await step("幅390pxで1つ目の問いの頁を開き直し、目次の釦で目次を開いて2つ目の問いを押す", async () => {
        await page.setViewportSize({ width: 390, height: 844 });
        await reopen(page, "何を止めるのか");
        const folded = await readUntil(() => headState(page), (shown) => shown.sections.join() === "何を止めるのか", WAIT);
        const toggle = page.locator(".pg-menu-toggle:visible");
        if ((await toggle.count()) === 0) return { folded, opened: undefined, picked: undefined };
        await toggle.first().click({ timeout: WAIT });
        const opened = await readUntil(() => headState(page), (shown) => shown.toggle === "true" && shown.questions.length > 0, WAIT);
        const row = page.locator("nav.pg-menu a.pg-menu-q:visible", { hasText: "確かめる順" });
        if ((await row.count()) === 0) return { folded, opened, picked: undefined };
        await row.first().click({ timeout: WAIT });
        const picked = await readUntil(() => headState(page), (shown) => shown.sections.join() === "どの順で確かめるのか" && shown.toggle === "false", WAIT);
        return { folded, opened, picked };
      });
      const printed = await step("幅1200pxで印刷の形にし、ヘッダーが紙に出るかを読む", async () => {
        await page.setViewportSize({ width: 1200, height: 700 });
        await page.emulateMedia({ media: "print" });
        const shown = await headState(page);
        await page.emulateMedia({ media: "screen" });
        return shown;
      });
      return { over, first, third, tabbed, wide, phone, printed };
    },
    { width: 1200, height: 700 },
    writeDocsGuide,
  ),
);

/** 章の名前の長い頁で、幅900pxと幅1440pxのタブの段、幅390pxで最後の章の問いを開いた時のタブの段の送り、図の段の数を読む (#4024) */
const LONG_TABS = await atLoad("章の名前の長い説明の頁を幅900pxと幅1440pxと幅390pxで開き、ヘッダーのタブの段と図の段の数を読む", () =>
  openGuide(
    async (page) => {
      const step = inOrder();
      const narrow = await step("幅900pxで1つ目の問いの頁を開き、題とタブの段の位置と図の段の数を読む", async () => {
        await openPlace(page, "何を止めるのか");
        await readUntil(() => headState(page), (shown) => shown.sections.join() === "何を止めるのか", WAIT);
        await figuresDrawn(page);
        return { state: await headState(page), figure: await stepCounts(page) };
      });
      const wide = await step("幅1440pxにし、題とタブの段の位置を読む", async () => {
        await page.setViewportSize({ width: 1440, height: 900 });
        return readUntil(() => headState(page), (shown) => shown.head !== null && shown.tabsTop !== undefined && Math.abs(shown.tabsTop - (shown.head.titleTop ?? 0)) <= 20, WAIT);
      });
      const phone = await step("幅390pxで最後の章の問いの頁を開き直し、タブの段の送りと印の付いたタブを読む", async () => {
        await page.setViewportSize({ width: 390, height: 844 });
        await reopen(page, "誰が読むのか");
        return readUntil(() => headState(page), (shown) => shown.sections.join() === "誰が読むのか" && shown.currentInRow, WAIT);
      });
      return { narrow, wide, phone };
    },
    { width: 900, height: 700 },
    writeHeadGuide,
  ),
);

/**
 * ヘッダーの章のタブ (#4024)。
 *
 * 話題が2つ以上の説明の頁は、頁の上のヘッダーに題と全体像と章のタブを置き、開いている章のタブに印を付ける。
 * 左の目次は開いている章の頁と開いているページの見出しだけを並べ、開いている頁の行は灰色の地と太字で示す。番号と開閉の矢印は持たない。
 * 全体像の頁は左の目次を出さず本文を中央に置き、題をヘッダーと重ねない。タブが題の横に入らない幅ではタブを題の下の段へ移し、スマホではタブの段を横に送る。
 */
describe("ヘッダーの章のタブ (#4024)", () => {
  it("guide-head-tabs-mark-open-chapter", async () => {
    const doc = await exportedGuide(writeDocsGuide());
    if (!doc) return;
    const head = doc.querySelector("header.pg-head");
    expect(squash(head?.querySelector(".pg-head-title")?.textContent), "ヘッダーの題").toBe("送金の止め方");
    expect(
      [...(head?.querySelectorAll("nav.pg-head-tabs a") ?? [])].map((a) => `${squash(a.textContent)} ${decodeURIComponent(a.getAttribute("href") ?? "")}`),
      "ヘッダーのタブの名前と行き先。全体像の後に章を書いた順に並べる",
    ).toEqual(["全体像 #", "止める仕組み #止める仕組み", "記録 #記録"]);
    const seen = HEADED.get();
    if (!seen) return;
    expect(
      [seen.over.get().current, seen.first.get().current, seen.third.get().current],
      "全体像と1つ目の問いと2つ目の章の問いを開いた時の、印の付いたヘッダーのタブ",
    ).toEqual(["全体像", "止める仕組み", "記録"]);
  });

  it("guide-head-tab-opens-chapter", () => {
    const seen = HEADED.get();
    if (!seen) return;
    const { pressed, state } = seen.tabbed.get();
    expect(pressed, "ヘッダーに1つ目の章のタブが無い").toBe(true);
    expect(
      { hash: state.hash, map: state.map, sections: state.sections, current: state.current },
      "2つ目の章の問いの頁からヘッダーの1つ目の章のタブを押した後の、URLの#の後ろと見えている地図と節と印の付いたタブ",
    ).toEqual({ hash: "#止める仕組み", map: true, sections: [], current: "止める仕組み" });
  });

  it("guide-menu-lists-open-chapter-only", async () => {
    const doc = await exportedGuide(writeDocsGuide());
    if (!doc) return;
    expect(doc.querySelectorAll(".pg-menu-fold").length, "左の目次の開け閉めの矢印 (.pg-menu-fold) の数").toBe(0);
    const seen = HEADED.get();
    if (!seen) return;
    const first = seen.first.get();
    expect(
      { topics: first.topics, questions: first.questions, heads: first.heads },
      "1つ目の問いの頁を開いた時に左の目次に見えている全体像と章の行、問い、頁の見出し",
    ).toEqual({ topics: [], questions: ["止める物", "確かめる順"], heads: DOCS_HEADS.first });
    const third = seen.third.get();
    expect(
      { topics: third.topics, questions: third.questions, heads: third.heads },
      "2つ目の章の問いの頁を開いた時に左の目次に見えている全体像と章の行、問い、頁の見出し",
    ).toEqual({ topics: [], questions: ["残す場所"], heads: DOCS_HEADS.third });
  });

  it("guide-menu-marks-open-page-gray", () => {
    const seen = HEADED.get();
    if (!seen) return;
    const open = seen.first.get().open;
    expect(open?.text, "1つ目の問いの頁を開いた時に印の付いた左の目次の行").toBe("止める物");
    expect(open?.weight ?? 0, "開いている頁の行の字の太さ").toBeGreaterThanOrEqual(700);
    expect(blueish(open?.background ?? ""), `開いている頁の行の地の色 (${open?.background}) が青い`).toBe(false);
    expect(blueish(open?.color ?? ""), `開いている頁の行の字の色 (${open?.color}) が青い`).toBe(false);
    expect(open?.background, "開いている頁の行に地の色が無い").not.toBe("rgba(0, 0, 0, 0)");
    expect({ shadow: open?.shadow, line: open?.line }, "開いている頁の行の左の線 (影と左の縁)").toEqual({ shadow: "none", line: "0px none" });
  });

  it("guide-shows-no-numbers", async () => {
    for (const [name, write] of [
      ["左の目次の3段の頁", writeDocsGuide],
      ["問いごとの頁", writePagesGuide],
      ["全体像の頁", writeOverviewGuide],
    ] as const) {
      const doc = await exportedGuide(write());
      if (!doc) return;
      expect(doc.querySelectorAll(".pg-num").length, `${name}の番号 (.pg-num) の数`).toBe(0);
      expect(
        [...doc.querySelectorAll(".pg-sec-title, .pg-map a, .pg-pager a, nav.pg-menu a")].map((el) => squash(el.textContent)).filter((text) => /(^|\s)\d+-\d+(\s|$)/u.test(text)),
        `${name}の頁の題と章の地図の行と前後のlinkと目次の行のうち、番号を持つ字`,
      ).toEqual([]);
    }
  });

  it("guide-topic-title-ink", () => {
    const seen = HEADED.get();
    if (!seen) return;
    const { state } = seen.tabbed.get();
    expect(state.topicTitle, "章の地図の頁で見えている章の題").not.toBeNull();
    expect(state.topicTitle?.color, "章の題の字の色。本文の字の色と同じ").toBe(state.ink);
    expect(blueish(state.topicTitle?.line ?? ""), `章の題の下の線の色 (${state.topicTitle?.line}) が青い`).toBe(false);
    expect(state.topicTitle?.lineWidth, "章の題の下の線の太さ").not.toBe("0px");
  });

  it("guide-menu-and-text-sizes", () => {
    const seen = HEADED.get();
    if (!seen) return;
    expect(seen.wide.get().sizes, "幅1440pxで1つ目の問いの頁を開いた時の、目次の頁の行と見出しの行と本文の段落の字の大きさ").toEqual({ page: ["16px"], head: ["15px"], text: ["16px"] });
  });

  it("guide-overview-centers-without-menu", () => {
    const seen = HEADED.get();
    if (!seen) return;
    const over = seen.over.get();
    expect(over.menu, "全体像の頁で見えている左の目次").toBe(false);
    expect(over.h1, "全体像の頁でヘッダーの題に重ねて本文の頭に見えている頁の題 (h1)").toBe(false);
    expect(over.column, "全体像の頁の頭の列").not.toBeNull();
    const middle = over.column ? (over.column.left + over.column.right) / 2 : 0;
    expect(Math.abs(middle - over.width / 2), "全体像の頁の頭の列の中心と画面の中心のずれ (px)").toBeLessThanOrEqual(2);
  });

  it("guide-head-tabs-wrap-below-title", () => {
    const seen = LONG_TABS.get();
    if (!seen) return;
    const narrow = seen.narrow.get().state;
    expect(narrow.head, "章の名前の長い頁のヘッダー").not.toBeNull();
    expect((narrow.tabsTop ?? 0) - (narrow.head?.titleTop ?? 0), "幅900pxでタブの上の縁と題の上の縁の差 (px)。タブが題の下の段へ移る").toBeGreaterThan(20);
    expect(Math.abs((narrow.firstTabLeft ?? -99) - (narrow.head?.titleLeft ?? 99)), "幅900pxで1つ目のタブの字の左の縁と題の字の左の縁のずれ (px)").toBeLessThanOrEqual(1);
    expect(narrow.overflow, "幅900pxで頁が横にはみ出す幅").toBe(0);
    const wide = seen.wide.get();
    expect(Math.abs((wide.tabsTop ?? 99) - (wide.head?.titleTop ?? -99)), "幅1440pxでタブの上の縁と題の上の縁の差 (px)。タブが題の横に入る").toBeLessThanOrEqual(20);
  });

  it("guide-phone-menu-closes-on-pick", () => {
    const seen = HEADED.get();
    if (!seen) return;
    const { folded, opened, picked } = seen.phone.get();
    expect({ toggle: folded.toggle, questions: folded.questions }, "幅390pxで問いの頁を開いた時の目次の釦の開いた印と、見えている目次の問い").toEqual({ toggle: "false", questions: [] });
    expect(opened?.toggle, "幅390pxで目次の釦を押した後の開いた印").toBe("true");
    expect(
      { toggle: picked?.toggle, sections: picked?.sections, questions: picked?.questions },
      "幅390pxで目次から2つ目の問いを選んだ後の、目次の釦の開いた印と見えている節と目次の問い",
    ).toEqual({ toggle: "false", sections: ["どの順で確かめるのか"], questions: [] });
  });

  it("guide-phone-tabs-show-open-chapter", () => {
    const seen = LONG_TABS.get();
    if (!seen) return;
    const phone = seen.phone.get();
    expect(phone.current, "幅390pxで最後の章の問いを開いた時に印の付いたタブ").toBe("運営の手引き");
    expect(phone.rowOverflows, "幅390pxでタブの段が横に送る長さを持つ").toBe(true);
    expect(phone.currentInRow, "幅390pxで印の付いたタブがタブの段の見える範囲に入る").toBe(true);
    expect(phone.overflow, "幅390pxで頁が横にはみ出す幅").toBe(0);
  });

  it("guide-figure-hides-step-count", () => {
    const seen = LONG_TABS.get();
    if (!seen) return;
    const { players, counts } = seen.narrow.get().figure;
    expect(players, "幅900pxで1つ目の問いの頁に描かれた図の数").toBeGreaterThan(0);
    expect(counts, "幅900pxで1つ目の問いの図の再生の帯に見えている段の数").toEqual([]);
  });

  // 段の数を隠した狭い帯で、空の番号の列の後に列の間が残ると、題が説明文より右から始まる (#4035)
  it("guide-figure-title-starts-at-body-edge", () => {
    const seen = LONG_TABS.get();
    if (!seen) return;
    const { captions } = seen.narrow.get().figure;
    expect(captions.length, "幅900pxで1つ目の問いの頁に描かれた、題と説明文を縦に積む狭い帯の数").toBeGreaterThan(0);
    const off = captions.filter(({ title, body }) => Math.abs(title - body) > 1);
    expect(off, "段の数を隠した狭い帯で、題の左端が説明文の左端と揃わない帯").toEqual([]);
  });

  it("guide-print-hides-head-tabs", () => {
    const seen = HEADED.get();
    if (!seen) return;
    const printed = seen.printed.get();
    expect(printed.head, "印刷の形の頁のヘッダー").not.toBeNull();
    expect(printed.head?.shown, "印刷の形で紙に出るヘッダー").toBe(false);
  });
});

/** 見出しの段を全て持つ説明の頁 (#4029)。1つ目の問いの頁に`####`から`######`の見出しと、`####`と`#####`の見出しを持つ取り込んだ文書を置く */
const HEADINGS_GUIDE = `---
layout: guide
---

# 送金の止め方

送金を止める仕組みを、見出しの段ごとに読む。

## 止める仕組み

${TOPIC_LEAD}

### 何を止めるのか [menu: 止める物]

> 規則に合わない送金を止める。

#### 止める場所

送金がどこで止まるかを追う。

##### 確かめる所の中

確かめる所は規則と送金を照らす。

###### 照らす規則の例

宛先と額と期限を照らす。

![手引き](manual.md)

## 記録

### どこに残すのか [menu: 残す場所]

> 確かめた結果を記録に残す。
`;

/** 見出しの段の頁が取り込む文書。枠の中の見出しは枠の字に合わせた今の形のまま出る (#4029) */
const HEADINGS_MANUAL = `#### 手引きの見出し

手引きの本文を読む。

##### 手引きの小見出し

手引きの小見出しの本文を読む。
`;

/** 見出しの段の頁のmdと取り込む文書を一時のdirに書き、mdのpathを返す (#4029) */
function writeHeadingsGuide(): string {
  const root = tempDir("guide-headings");
  writeFiles(root, { "notes.md": HEADINGS_GUIDE, "manual.md": HEADINGS_MANUAL });
  return join(root, "notes.md");
}

/**
 * 説明の頁の見出しの段ごとの字の大きさと形 (#4029)。h1は頁の題、h2は章の題、h3はページの題、h4からh6はページの中の見出し、
 * docは取り込んだ文書の枠の中の見出し。章の色は、ページの題を持つ章の`--cc`を字の色に当てた要素で読む
 */
const headingState = (page: Page) =>
  page.evaluate(() => {
    const look = (el: Element | null | undefined) => {
      if (!el) return null;
      const s = getComputedStyle(el);
      return {
        size: Number.parseFloat(s.fontSize),
        color: s.color,
        background: s.backgroundColor,
        bottom: { width: s.borderBottomWidth, style: s.borderBottomStyle, color: s.borderBottomColor },
        left: { width: s.borderLeftWidth, style: s.borderLeftStyle, color: s.borderLeftColor },
        adjust: s.getPropertyValue("print-color-adjust") || s.getPropertyValue("-webkit-print-color-adjust"),
      };
    };
    const inPage = (selector: string): Element | undefined => [...document.querySelectorAll(selector)].find((el) => !el.closest(".pg-doc"));
    const h3 = document.querySelector(".pg-sec-title");
    const probe = document.createElement("i");
    probe.style.color = "var(--cc)";
    h3?.closest(".pg-topic")?.append(probe);
    const chapter = getComputedStyle(probe).color;
    probe.remove();
    return {
      h1: look(document.querySelector(".pg-top h1")),
      h2: look(document.querySelector("h2.pg-topic-title")),
      h3: look(h3),
      h4: look(inPage(".pg-sec h4.pg-h")),
      h5: look(inPage(".pg-sec h5.pg-h")),
      h6: look(inPage(".pg-sec h6.pg-h")),
      doc4: look(document.querySelector(".pg-doc h4.pg-h")),
      doc5: look(document.querySelector(".pg-doc h5.pg-h")),
      body: look(inPage(".pg-sec > p")),
      ink: getComputedStyle(document.body).color,
      page: getComputedStyle(document.body).backgroundColor,
      chapter,
    };
  });

/** 色の字の赤と緑と青の値の平均 (0から255)。明るい字ほど大きい */
const lightness = (color: string): number => {
  const values = (color.match(/[\d.]+/gu) ?? []).map(Number).slice(0, 3);
  const scale = color.startsWith("color(") ? 255 : 1;
  return values.length === 3 ? (values.reduce((sum, v) => sum + v, 0) * scale) / 3 : 0;
};

/** 見出しの段の頁の1つ目の問いの頁を幅1440pxと幅390pxと印刷の形で開き、見出しの段ごとの字の大きさと形を読む (#4029) */
const HEADINGS = await atLoad("見出しの段を全て持つ説明の頁の1つ目の問いの頁を、幅1440pxと幅390pxと印刷の形で開き、見出しの字の大きさと形を読む", () =>
  openGuide(
    async (page) => {
      const step = inOrder();
      const wide = await step("幅1440pxで1つ目の問いの頁を開き、見出しの段ごとの字の大きさと形を読む", async () => {
        await openPlace(page, "何を止めるのか");
        await readUntil(() => headState(page), (shown) => shown.sections.join() === "何を止めるのか", WAIT);
        return headingState(page);
      });
      const phone = await step("幅390pxにし、見出しの段ごとの字の大きさを読む", async () => {
        await page.setViewportSize({ width: 390, height: 844 });
        return headingState(page);
      });
      const printed = await step("幅1200pxで印刷の形にし、見出しの段ごとの形と紙に地の色を出す指定を読む", async () => {
        await page.setViewportSize({ width: 1200, height: 700 });
        await page.emulateMedia({ media: "print" });
        const shown = await headingState(page);
        await page.emulateMedia({ media: "screen" });
        return shown;
      });
      return { wide, phone, printed };
    },
    { width: 1440, height: 900 },
    writeHeadingsGuide,
  ),
);

/**
 * 見出しの段ごとの形 (#4029)。
 *
 * 説明の頁の見出しは、h1からh5まで段ごとに違う形で出て、どの段も本文の16pxより大きい。
 * h1は本文の字と同じ色の帯に明るい字、h2は本文の字と同じ色の下線、h3は章の色の縦線、h4は淡い地、h5は点線の下線で出る。
 * 取り込んだ文書の枠の中の見出しは、枠の字に合わせた今の形のまま出る。
 */
describe("見出しの段ごとの形 (#4029)", () => {
  it("guide-heading-h1-band", () => {
    const seen = HEADINGS.get();
    if (!seen) return;
    const { h1, ink } = seen.printed.get();
    expect(h1?.size, "印刷の形の頁の題 (h1) の字の大きさ (px)").toBe(30);
    expect(h1?.background, "印刷の形の頁の題 (h1) の地の色。本文の字と同じ色").toBe(ink);
    expect(lightness(h1?.color ?? ""), `印刷の形の頁の題 (h1) の字の色 (${h1?.color}) の明るさ`).toBeGreaterThan(200);
  });

  it("guide-heading-h2-underline", () => {
    const seen = HEADINGS.get();
    if (!seen) return;
    const { h2, ink } = seen.wide.get();
    expect(h2?.size, "幅1440pxの章の題 (h2) の字の大きさ (px)").toBe(25);
    expect(h2?.bottom, "幅1440pxの章の題 (h2) の下の線の太さと形と色").toEqual({ width: "2px", style: "solid", color: ink });
  });

  it("guide-heading-h3-chapter-bar", () => {
    const seen = HEADINGS.get();
    if (!seen) return;
    const { h3, chapter } = seen.wide.get();
    expect(h3?.size, "幅1440pxのページの題 (h3) の字の大きさ (px)").toBe(22);
    expect(h3?.left, "幅1440pxのページの題 (h3) の左の縦線の太さと形と色。色は章の色").toEqual({ width: "4px", style: "solid", color: chapter });
  });

  it("guide-heading-h4-band", () => {
    const seen = HEADINGS.get();
    if (!seen) return;
    const { h4, page } = seen.wide.get();
    expect(h4?.size, "幅1440pxの`####`の見出し (h4) の字の大きさ (px)").toBe(18);
    expect(h4?.background, "幅1440pxの`####`の見出し (h4) の地の色が透明").not.toBe("rgba(0, 0, 0, 0)");
    expect(h4?.background, "幅1440pxの`####`の見出し (h4) の地の色が頁の地と同じ").not.toBe(page);
  });

  it("guide-heading-h5-dashed", () => {
    const seen = HEADINGS.get();
    if (!seen) return;
    const { h5 } = seen.wide.get();
    expect(h5?.size, "幅1440pxの`#####`の見出し (h5) の字の大きさ (px)").toBe(17);
    expect(h5?.bottom.style, "幅1440pxの`#####`の見出し (h5) の下の線の形").toBe("dashed");
    expect(h5?.bottom.width, "幅1440pxの`#####`の見出し (h5) の下の線の太さ").not.toBe("0px");
  });

  it("guide-heading-h6-body-size", () => {
    const seen = HEADINGS.get();
    if (!seen) return;
    const { h6, body } = seen.wide.get();
    expect({ h6: h6?.size, body: body?.size }, "幅1440pxの`######`の見出し (h6) と本文の段落の字の大きさ (px)").toEqual({ h6: 16, body: 16 });
  });

  it("guide-heading-sizes-fall", () => {
    const seen = HEADINGS.get();
    if (!seen) return;
    for (const [name, shown] of [
      ["幅1440px", seen.wide.get()],
      ["幅390px", seen.phone.get()],
    ] as const) {
      const sizes = [shown.h1, shown.h2, shown.h3, shown.h4, shown.h5].map((h) => h?.size ?? 0);
      expect(
        sizes.every((size, i) => i === 0 || size < (sizes[i - 1] ?? 0)),
        `${name}のh1からh5の字の大きさ (${sizes.join("/")}px) が段ごとに小さくなる`,
      ).toBe(true);
      expect(shown.h5?.size ?? 0, `${name}のh5の字の大きさ (px) が本文の${shown.body?.size}pxより大きい`).toBeGreaterThan(shown.body?.size ?? 0);
    }
  });

  it("guide-heading-print-keeps-bands", () => {
    const seen = HEADINGS.get();
    if (!seen) return;
    const { h1, h4 } = seen.printed.get();
    expect({ h1: h1?.adjust, h4: h4?.adjust }, "印刷の形の頁の題 (h1) と`####`の見出し (h4) の、地の色を紙に出す指定").toEqual({ h1: "exact", h4: "exact" });
  });

  it("guide-doc-headings-unchanged", () => {
    const seen = HEADINGS.get();
    if (!seen) return;
    const { doc4, doc5 } = seen.wide.get();
    for (const [name, h] of [
      ["`####`", doc4],
      ["`#####`", doc5],
    ] as const) {
      expect(h, `取り込んだ文書の枠の中の${name}の見出し`).not.toBeNull();
      expect(
        { size: h?.size, background: h?.background, bottom: h?.bottom.width, left: h?.left.width },
        `幅1440pxで取り込んだ文書の枠の中の${name}の見出しの字の大きさ (px) と地の色と下と左の線の太さ`,
      ).toEqual({ size: 15, background: "rgba(0, 0, 0, 0)", bottom: "0px", left: "0px" });
    }
  });
});

/** 判定の表の例の行から追う場面の図 (#3892)。2つの場面を持つ手順の図で、通る送金は4段、宛先が違う送金は3段目で止まる */
const JUDGE_SCENES = (show: "pick" | "stack"): string => `flow 送金 [scenes: ${show}]

box ask as 送金を頼む
box look as 宛先を確かめる
box send as 送る
box back as 差し戻す

step 頼む
  say 利用者が送金を頼む。
  start -> ask

step 確かめる
  say 宛先を確かめる。
  ask -> look: 宛先

scene 通る送金
  step 送る
    say 宛先が正しいので送る。
    look -> send: 正しい
  step 終える
    say 送金を終える。
    send -> finish
end

scene 宛先が違う送金
  step 差し戻す
    say 宛先が違うので差し戻す。
    look -> back: 違う
    stop 宛先が登録されていない
end`;

/** 場面の図の宛先が違う送金が止まる段 (0から数える) と、止まる理由 */
const WRONG_STOP = 2;
const WRONG_REASON = "宛先が登録されていない";

/** 例の行が`[scene: <場面の名前>]`で同じ問いの節の場面を名指す判定の表 (#3892) */
const judgeWith = (pass: string, wrong: string): string => `judge どの送金を止めるのか

rule to as 宛先 [value: 0x2222…]
rule once as 1回 [value: 30まで]

case 通る送金 [scene: ${pass}]
case 宛先が違う送金 [scene: ${wrong}]
  fail to: 0x9999 [stop]`;

/** 判定の表と場面の図の間に置く長い箇条書き。押す前の場面の図を画面の外に置くため */
const SCENE_FILLER = Array.from({ length: 40 }, (_, n) => `- 照らす所${n + 1}`).join("\n");

/** `dragon`の囲み */
const fenced = (text: string): string => `\`\`\`dragon\n${text}\n\`\`\``;

/** 選ぶ見せ方の場面の図を置いた問いと、並べる見せ方の場面の図を置いた問いの題 */
const PICK_TITLE = "どの送金が止まるのか";
const STACK_TITLE = "並べた場面のどれが止まるのか";

/**
 * 判定の表と場面の図を同じ問いの節に置いた説明の頁のmd (#3892)。話題は1つで、問いは2つ。
 * 1つ目の問いは選ぶ見せ方、2つ目の問いは並べる見せ方の場面の図を置き、どちらの問いも同じ名前の場面を持つ。場面は問いの節の中で探すので、断らない
 */
const JUDGE_GUIDE = `---
layout: guide
---

# 送金の判定

## 送金

### ${PICK_TITLE}

> 宛先が違う送金は、宛先の規則で止まる。

表の行を押すと、下の図がその送金を追う。

${fenced(judgeWith("通る送金", "宛先が違う送金"))}

${SCENE_FILLER}

送金を場面ごとに1つずつ追う。

${fenced(JUDGE_SCENES("pick"))}

### ${STACK_TITLE}

> 並べた図でも、押した送金の場面が止まる段まで進む。

表の行を押すと、下の図がその送金の場面を目立たせる。

${fenced(judgeWith("通る送金", "宛先が違う送金"))}

${SCENE_FILLER}

送金の場面を並べて追う。

${fenced(JUDGE_SCENES("stack"))}
`;

/** 判定の表と場面の図の説明の頁のmdを一時のdirに書き、mdのpathを返す (#3892) */
function writeJudgeGuide(md: string = JUDGE_GUIDE): string {
  const root = tempDir("guide-judge");
  writeFiles(root, { "notes.md": md });
  return join(root, "notes.md");
}

/** 場面の図が止まる段まで進むのを待つ長さと、止まった後に留まるかを見る長さ */
const PLAY_WAIT = 20_000;
const HOLD_WAIT = 3_000;

/** 問い`title`の節の判定の表の例の行の、名前のセルより右の最初のセル */
const rowCell = (page: Page, title: string, row: number) =>
  page
    .locator(".pg-sec", { has: page.locator(".pg-sec-title", { hasText: title }) })
    .locator(`tr[data-case="${row}"] td[data-rule]`)
    .first();

/** 問い`title`の節の、判定の表の行の印と、場面の図の場面ごとの段と止まりと濃さと理由、選ぶ釦、場面の図の上と下の縁を読む (#3892) */
const judgeSceneState = (page: Page, title: string) =>
  page.evaluate((t) => {
    const sq = (text: string | null | undefined): string => (text ?? "").replace(/\s+/gu, " ").trim();
    const sec = [...document.querySelectorAll(".pg-sec")].find((s) => sq(s.querySelector(".pg-sec-title")?.textContent).endsWith(t));
    const figures = sec ? [...sec.querySelectorAll(".dragon-figure")] : [];
    const rootOf = (f: Element): ParentNode => f.querySelector(".dragon-frame")?.shadowRoot ?? f;
    const table = figures.map((f) => rootOf(f).querySelector('[data-dragon="judge"]')).find((el) => el !== null) ?? null;
    const sceneFigure = figures.find((f) => rootOf(f).querySelector('[data-dragon="scene"]') !== null);
    const scenes = sceneFigure ? rootOf(sceneFigure) : null;
    const box = sceneFigure?.getBoundingClientRect();
    return {
      rows: table ? [...table.querySelectorAll("tbody tr[data-case]")].map((tr) => tr.getAttribute("aria-current") === "true") : [],
      scenes: scenes
        ? [...scenes.querySelectorAll<HTMLElement>('[data-dragon="scene"]')].map((el) => {
            const reason = el.querySelector('[data-dragon="scene-stop"]');
            return {
              name: el.dataset.scene ?? "",
              shown: el.checkVisibility(),
              step: Number(el.dataset.step),
              stopped: el.hasAttribute("data-stopped"),
              opacity: Number(getComputedStyle(el).opacity),
              reason: reason && reason.checkVisibility() ? sq(reason.textContent) : "",
            };
          })
        : [],
      pressed: scenes ? [...scenes.querySelectorAll('[data-dragon="scene-pick"]')].map((b) => b.getAttribute("aria-pressed") === "true") : [],
      top: box?.top ?? Number.NaN,
      bottom: box?.bottom ?? Number.NaN,
      height: innerHeight,
    };
  }, title);

type JudgeSceneState = Awaited<ReturnType<typeof judgeSceneState>>;

/** 状態`state`の場面`name` */
const sceneIn = (state: JudgeSceneState, name: string) => state.scenes.find((s) => s.name === name);

/** 問い`title`の節で場面`name`が止まるまで読み続け、通った段を書いた順に返す。止まった後に`HOLD_WAIT`だけ待ってもう1度読む */
async function followScene(page: Page, title: string, name: string): Promise<{ steps: number[]; last: JudgeSceneState; held: JudgeSceneState }> {
  const steps: number[] = [];
  let last = await judgeSceneState(page, title);
  const until = Date.now() + PLAY_WAIT;
  while (Date.now() < until) {
    last = await judgeSceneState(page, title);
    const chosen = sceneIn(last, name);
    if (chosen && chosen.step !== steps.at(-1)) steps.push(chosen.step);
    if (chosen?.stopped) break;
    await page.waitForTimeout(100);
  }
  await page.waitForTimeout(HOLD_WAIT);
  return { steps, last, held: await judgeSceneState(page, title) };
}

/**
 * 判定の表と場面の図の頁 (`writeJudgeGuide`) を`dragon export`で書き出し、頁を`viewport`の大きさで開いて`run`を回す。
 * Nodeの入口の`exportPage`は後から読む種類 (判定の表と、手順の図が読む分かれ道) を登録しないので、全ての種類を読むコマンドで書き出す
 */
async function openJudgeGuide<T>(run: (page: Page) => Promise<T>, viewport: { width: number; height: number }): Promise<T | undefined> {
  const md = writeJudgeGuide();
  const ran = await runCli(["export", md]);
  expect(ran.code, `判定の表と場面の図の頁を書き出せない: ${ran.stderr}`).toBe(0);
  const path = join(dirname(md), "notes.html");
  if (ran.code !== 0 || !existsSync(path)) return undefined;
  return within(withSite({ "notes.html": readFileSync(path, "utf8") }, "notes.html", run, viewport), PAGE_LIMIT_MS, "判定の表と場面の図の頁の仕事");
}

const JUDGED = await atLoad("判定の表と場面の図を置いた説明の頁を開き、例の行を押して場面の図が止まる段まで進むのを読む", () =>
  openJudgeGuide(
    async (page) => {
      const step = inOrder();
      await figuresDrawn(page);
      const picked = await step("1つ目の問いの節で宛先が違う送金の行を押し、選ぶ見せ方の場面の図が止まる段まで進むのを読む", async () => {
        const before = await judgeSceneState(page, PICK_TITLE);
        await rowCell(page, PICK_TITLE, 1).click({ timeout: WAIT });
        const marked = await judgeSceneState(page, PICK_TITLE);
        return { before, marked, ...(await followScene(page, PICK_TITLE, "宛先が違う送金")) };
      });
      const again = await step("同じ節で通る送金の行を押し、行の印が移るのを読む", async () => {
        await rowCell(page, PICK_TITLE, 0).click({ timeout: WAIT });
        return readUntil(
          () => judgeSceneState(page, PICK_TITLE),
          (state) => state.rows[0] === true,
          WAIT,
        );
      });
      const stacked = await step("2つ目の問いの節で宛先が違う送金の行を押し、並べる見せ方の場面の図を読む", async () => {
        await rowCell(page, STACK_TITLE, 1).click({ timeout: WAIT });
        return followScene(page, STACK_TITLE, "宛先が違う送金");
      });
      return { picked, again, stacked };
    },
    { width: 1200, height: 900 },
  ),
);

/** 1つ目の問いの節で`line`を含む最初の行の番号 (1から数える) */
const lineOf = (md: string, line: string): number => md.split("\n").findIndex((row) => row.includes(line)) + 1;

/** 場面が無い例の行を持つ頁と、1つ目の問いの節に同じ場面を持つ場面の図を2つ置いた頁 */
const MISSING_GUIDE = JUDGE_GUIDE.replace("case 宛先が違う送金 [scene: 宛先が違う送金]", "case 宛先が違う送金 [scene: 無い場面]");
const TWICE_GUIDE = JUDGE_GUIDE.replace(`${fenced(JUDGE_SCENES("pick"))}\n`, `${fenced(JUDGE_SCENES("pick"))}\n\nもう1つの図でも追う。\n\n${fenced(JUDGE_SCENES("pick"))}\n`);

const REFUSED = await atLoad("例の行が無い場面を指した頁と、2つ以上の場面に当たる頁を、dragon exportとdragon checkに通す", async () => {
  const run = async (md: string) => {
    const path = writeJudgeGuide(md);
    const exported = await runCli(["export", path]);
    const written = existsSync(join(dirname(path), "notes.html"));
    return { path, exported, written, checked: await runCli(["check", path]) };
  };
  return { missing: await run(MISSING_GUIDE), twice: await run(TWICE_GUIDE) };
});

/**
 * 判定の表の例の行から場面の図を追う (#3892)。
 *
 * 説明の頁の同じ問いの節に判定の表と場面の図を置き、例の行に`[scene: <場面の名前>]`を書くと、例の行 (名前のセルより右) を押した時に、
 * 場面の図がその場面を選んで1段目に戻し、止まる段まで1段ずつ進めて止め、止まる理由を出す。押した行には印 (`aria-current`) が残り、場面の図が画面の外なら図まで移る。
 * 並べる見せ方の場面の図では、ほかの場面を薄くし、全ての場面を選んだ場面の止まる段まで進める。場面が無いか2つ以上当たる例の行は、`dragon export`と`dragon check`が断る
 */
describe("判定の表の例の行から場面の図を追う (#3892)", () => {
  it("guide-judge-row-plays-scene", () => {
    const seen = JUDGED.get();
    if (!seen) return;
    const { steps, last, held } = seen.picked.get();
    expect(last.pressed, "例の行を押した後に選ばれた場面の釦").toEqual([false, true]);
    expect(
      last.scenes.map((s) => ({ name: s.name, shown: s.shown })),
      "例の行を押した後に見えている場面",
    ).toEqual([
      { name: "通る送金", shown: false },
      { name: "宛先が違う送金", shown: true },
    ]);
    expect(steps, "例の行を押した後に、宛先が違う送金の場面が通った段").toEqual(Array.from({ length: WRONG_STOP + 1 }, (_, n) => n));
    const stopped = sceneIn(last, "宛先が違う送金");
    expect({ stopped: stopped?.stopped, reason: stopped?.reason }, "止まる段に着いた場面の止まりと理由").toEqual({ stopped: true, reason: WRONG_REASON });
    const after = sceneIn(held, "宛先が違う送金");
    expect({ step: after?.step, stopped: after?.stopped }, "止まった後も止まる段に留まらない").toEqual({ step: WRONG_STOP, stopped: true });
  });

  it("guide-judge-row-marks-and-scrolls", () => {
    const seen = JUDGED.get();
    if (!seen) return;
    const { before, marked, last } = seen.picked.get();
    expect(before.rows, "押す前の行の印").toEqual([false, false]);
    expect(before.top, "押す前から場面の図が画面の中に在り、移ったかを測れない").toBeGreaterThan(before.height);
    expect(marked.rows, "宛先が違う送金の行を押した後の行の印").toEqual([false, true]);
    expect(last.top >= 0 && last.top < last.height, `例の行を押しても場面の図が画面の中に入らない (上の縁 ${last.top}、画面の高さ ${last.height})`).toBe(true);
    expect(seen.again.get().rows, "通る送金の行を押した後の行の印").toEqual([true, false]);
  });

  it("guide-judge-row-stacked-scene", () => {
    const seen = JUDGED.get();
    if (!seen) return;
    const { steps, last, held } = seen.stacked.get();
    const chosen = sceneIn(last, "宛先が違う送金");
    const other = sceneIn(last, "通る送金");
    expect({ chosen: chosen?.shown, other: other?.shown }, "並べる見せ方で見えている場面").toEqual({ chosen: true, other: true });
    expect(chosen?.opacity, "押した例の場面が薄い").toBe(1);
    expect(other?.opacity ?? 1, "ほかの場面が薄くならない").toBeLessThan(1);
    expect(steps, "例の行を押した後に、宛先が違う送金の場面が通った段").toEqual(Array.from({ length: WRONG_STOP + 1 }, (_, n) => n));
    expect({ stopped: chosen?.stopped, reason: chosen?.reason }, "止まる段に着いた場面の止まりと理由").toEqual({ stopped: true, reason: WRONG_REASON });
    expect(
      { chosen: sceneIn(held, "宛先が違う送金")?.step, other: sceneIn(held, "通る送金")?.step },
      "全ての場面が選んだ場面の止まる段まで進んで留まらない",
    ).toEqual({ chosen: WRONG_STOP, other: WRONG_STOP });
  });

  it("guide-judge-scene-missing-refused", () => {
    const { missing, twice } = REFUSED.get();
    const cases = [
      { name: "無い場面を指した", md: MISSING_GUIDE, ran: missing, lines: [lineOf(MISSING_GUIDE, "[scene: 無い場面]")], word: "無い場面" },
      {
        name: "2つ以上の場面に当たる",
        md: TWICE_GUIDE,
        ran: twice,
        lines: [lineOf(TWICE_GUIDE, "case 通る送金 [scene: 通る送金]"), lineOf(TWICE_GUIDE, "case 宛先が違う送金 [scene: 宛先が違う送金]")],
        word: "通る送金",
      },
    ];
    /** 命令が`<file>:<行>`で始めて出した行の、行の番号と行の全文 */
    const refusals = (out: string, path: string): { line: number; text: string }[] =>
      out
        .split("\n")
        .filter((row) => row.startsWith(`${path}:`))
        .map((row) => ({ line: Number(row.slice(path.length + 1).split(/[:\s]/u)[0]), text: row }));
    for (const { name, ran, lines, word } of cases) {
      expect(ran.exported.code, `${name}頁をdragon exportが断らない ${ran.exported.stdout}`).toBe(1);
      const exported = refusals(ran.exported.stderr, ran.path);
      expect(
        exported.map((e) => e.line),
        `${name}頁でdragon exportが断った行`,
      ).toEqual(lines);
      expect(exported[0]?.text ?? "", `${name}頁のdragon exportの断りの文が場面の名前を名指さない`).toContain(word);
      expect(ran.written, `${name}のに頁を書いた`).toBe(false);
      expect(ran.checked.code, `${name}頁をdragon checkが断らない ${ran.checked.stdout}`).toBe(1);
      const said = refusals(ran.checked.stdout, ran.path);
      expect(
        said.map((e) => e.line),
        `${name}頁でdragon checkが断った行`,
      ).toEqual(lines);
      expect(said[0]?.text ?? "", `${name}頁のdragon checkの断りの文が場面の名前を名指さない`).toContain(word);
    }
  });
});
