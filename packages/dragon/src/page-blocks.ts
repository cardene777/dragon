/**
 * 頁に置いた記法の塊 (`<pre class="dragon">`) を動く図に置き換える (#3343)。script の1行の入口と、`dragon embed` が埋める script が共に使う。
 * Markdown の ```dragon の囲みから作った HTML (`<pre><code class="language-dragon">`) も塊として読み、`<pre>` ごと置き換える (#3455)。
 *
 * 塊の字から共通の字下げを外して記法として読み、塊を図の枠 (`<div class="dragon-figure">`) に置き換えて描く。
 * 記法に誤りがある塊は図にせず、誤りの文を行ごとに並べた `<pre class="dragon-error">` に置き換える。
 * 言葉は頁の `lang` 属性が `ja` で始まれば日本語、ほかは英語にする。図の中の字と誤りの文の両方に使う。
 * 頁を読み終えた時に在る塊だけを描き、後から足した塊は見張らない。
 *
 * 属性 `data-header` を持つ塊は、図を描いた後に呼ぶ側の処理 (`framed`) へ渡して帯を付ける (#3699)。持たない塊は帯の無い図のまま。
 *
 * 頁の `<link rel="dragon-blocks" href="…">` が指す file は、使う人が足すブロックの定義として 1 度だけ読み、頁の全ての塊に渡す (#3399)。
 * file は記法 (`blocks 1` で始まる) か JSON (`"format": 1`) で書く。読む file は頁を書いた人が指した所だけで、定義は外の物を読ませない。
 * 定義を読めない時は、全ての塊をその誤りの文に置き換える。
 */
import { parseNotation } from "./parser";
import { registerUserBlockReader, type UserBlocks, userBlockReader } from "./user-blocks";
import { mountDiagram, type Player, type PlayerOptions } from "./player";
import type { Diagram } from "./schema";
import type { NotationLang } from "./words";

/** 属性 `data-header` を持つ塊の、描いた図を受け取る処理。図を描いた後に呼ぶ (#3699) */
export type FramedBlock = (host: HTMLElement, drawn: Player, source: string, diagram: Diagram, options: PlayerOptions) => void;

const detail = (error: unknown): string => (error instanceof Error ? error.message : String(error));

/** 塊の字から、空でない行に共通の字下げを外す。入れ子の HTML の中で書いた塊は、全ての行に同じ字下げが付くため */
function dedent(text: string): string {
  const lines = text.split("\n");
  const indents = lines.filter((line) => line.trim() !== "").map((line) => /^[ \t]*/u.exec(line)?.[0].length ?? 0);
  const cut = indents.length === 0 ? 0 : Math.min(...indents);
  return lines.map((line) => line.slice(cut)).join("\n");
}

/** 誤りの文を行ごとに並べた要素。読み上げにも誤りと伝える。誤りの文は使える語を並べて長くなるので、枠の幅で折り返して頁の横へはみ出させない */
function errorBox(doc: Document, lines: string[]): HTMLElement {
  const box = doc.createElement("pre");
  box.className = "dragon-error";
  box.setAttribute("role", "alert");
  box.style.whiteSpace = "pre-wrap";
  box.style.overflowWrap = "anywhere";
  box.textContent = lines.join("\n");
  return box;
}

async function drawBlock(block: Element, prepare: (text: string) => Promise<void>, lang: NotationLang, defined: Promise<UserBlocks[]>, framed?: FramedBlock): Promise<void> {
  const doc = block.ownerDocument;
  const text = dedent(block.textContent ?? "");
  let blocks: UserBlocks | undefined;
  try {
    await prepare(text);
    blocks = merged(await defined);
  } catch (error) {
    block.replaceWith(errorBox(doc, [detail(error)]));
    return;
  }
  const parsed = parseNotation(text, { lang, ...(blocks ? { blocks } : {}) });
  if (!parsed.ok) {
    block.replaceWith(errorBox(doc, parsed.errors.map((error) => `${error.line}: ${error.message}`)));
    return;
  }
  // 図は枠の幅で見せ方を選ぶので、枠を頁に置いてから描く
  const host = doc.createElement("div");
  host.className = "dragon-figure";
  block.replaceWith(host);
  try {
    const options = { lang, ...(blocks ? { blocks } : {}) };
    const drawn = mountDiagram(host, parsed.diagram, options);
    if (framed && block.hasAttribute("data-header")) framed(host, drawn, text, parsed.diagram, options);
  } catch (error) {
    host.replaceWith(errorBox(doc, [detail(error)]));
  }
}

/** 定義の並びを 1 つにまとめる。後ろの並びが同じ名前の定義を上書きする。並びが無ければ undefined */
function merged(sets: readonly UserBlocks[]): UserBlocks | undefined {
  if (sets.length === 0) return undefined;
  const byName = new Map(sets.flatMap((set) => set.blocks.map((b) => [b.name, b] as const)));
  return { format: 1, blocks: [...byName.values()] };
}

/** 頁の `<link rel="dragon-blocks">` が指す定義の file を全て読む。読めないか誤りのある file は、その file の URL を添えた誤りで断る */
async function pageDefinitions(doc: Document, lang: NotationLang): Promise<UserBlocks[]> {
  const links = [...doc.querySelectorAll('link[rel~="dragon-blocks"][href]')].map((link) => new URL(link.getAttribute("href") ?? "", doc.baseURI).href);
  return Promise.all(
    [...new Set(links)].map(async (url) => {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`${url}: ${response.status}`);
      const text = await response.text();
      const { readBlocks, USER_BLOCK_READER } = await import("./user-blocks-read");
      // 頁が指す定義の形の箱を描いて測る処理も、定義を読む処理と一緒に登録する (#3520)
      if (userBlockReader() === undefined) registerUserBlockReader(USER_BLOCK_READER);
      const read = readBlocks(text.trimStart().startsWith("{") ? (JSON.parse(text) as unknown) : text, { lang });
      if (!read.ok) throw new Error(read.errors.map((e) => `${url} ${e.line}: ${e.message}`).join("\n"));
      return read.blocks;
    }),
  );
}

/** 頁の記法の塊。`<pre class="dragon">` と、Markdown の囲みから作った `<pre><code class="language-dragon">` の `<pre>` */
const pageBlocks = (doc: Document): Element[] => [
  ...doc.querySelectorAll("pre.dragon"),
  ...[...doc.querySelectorAll("pre > code.language-dragon")].flatMap((code) => (code.parentElement && !code.parentElement.matches("pre.dragon") ? [code.parentElement] : [])),
];

/**
 * 頁の記法の塊を全て図に置き換える。`prepare` は記法を読む前に待ち、その記法が使う部品を読む。
 * `framed` を渡すと、属性 `data-header` を持つ塊の図を描いた後にそれへ渡す。
 * 頁を読み終える前に呼ばれた時は、読み終えてから置き換える
 */
export function drawPageBlocks(doc: Document, prepare: (text: string) => Promise<void>, framed?: FramedBlock): void {
  const lang: NotationLang = doc.documentElement.lang.toLowerCase().startsWith("ja") ? "ja" : "en";
  const draw = (): void => {
    const defined = pageDefinitions(doc, lang);
    // 誤りは塊ごとに誤りの文として出すので、まとめて待つ側では握らない
    defined.catch(() => undefined);
    for (const block of pageBlocks(doc)) void drawBlock(block, prepare, lang, defined, framed);
  };
  if (doc.readyState === "loading") doc.addEventListener("DOMContentLoaded", draw, { once: true });
  else draw();
}
