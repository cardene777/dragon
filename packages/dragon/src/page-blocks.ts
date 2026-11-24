/**
 * 頁に置いた記法の塊 (`<pre class="dragon">`) を動く図に置き換える (#3343)。script の1行の入口と、`dragon embed` が埋める script が共に使う。
 * Markdown の ```dragon の囲みから作った HTML (`<pre><code class="language-dragon">`) も塊として読み、`<pre>` ごと置き換える (#3455)。
 *
 * 塊の字から共通の字下げを外して記法として読み、塊を図の枠 (`<div class="dragon-figure">`) に置き換えて描く。
 * 記法に誤りがある塊は図にせず、誤りの文を行ごとに並べた `<pre class="dragon-error">` に置き換える。
 * 言葉は頁の `lang` 属性が `ja` で始まれば日本語、ほかは英語にする。図の中の字と誤りの文の両方に使う。
 * 頁を読み終えた時に在る塊だけを描き、後から足した塊は見張らない。
 * 読み終えた時に幅を持たない塊 (`display: none` で隠したタブの中など) は、幅を持った時に描く (#3755)。
 * 図は枠の幅で見せ方を選ぶので、隠れた間に描くと幅の無い枠に描き、見えた時に図が空のまま残る。
 *
 * 属性 `data-header` を持つ塊は、呼ぶ側が渡した帯の塊 (`framed`) を記法が使う部品と同時に読み、帯の内側に図を 1 度だけ描く (#3699、#3789)。
 * 帯の塊が届くまで塊は記法のまま残り、帯の無い図を描いてから描き直すことはしない。持たない塊は帯の無い図のまま。
 * 頁の `<script type="application/json" id="dragon-header">` (帯の設定の塊) は、SDK の `mountDragon` と同じ鍵 (`buttons` と `look`) で
 * 帯のボタンの並びと見た目を持ち、頁の全ての `data-header` の塊に効く (#3789)。読めない時は、`data-header` の塊をその誤りの文に置き換える。
 * 属性 `data-still` を持つ塊は、再生の部品を置かず、最後の段の形を描いた SVG (`div.dragon-figure.dragon-still`) に置き換える (#3801)。
 * 属性 `data-note="pop"` を持つ塊は、1 行目に `note` を書かない図を、箱の説明を押すと出る札で見せる (#3877)。
 * 1 行目に `[note: under]` を書いた図は名前の下の字で見せる。mdから書き出した頁の頭の `note: pop` が全ての塊に付ける。
 *
 * 頁の `<link rel="dragon-blocks" href="…">` が指す file は、使う人が足すブロックの定義として 1 度だけ読み、頁の全ての塊に渡す (#3399)。
 * file は記法 (`blocks 1` で始まる) か JSON (`"format": 1`) で書く。読む file は頁を書いた人が指した所だけで、定義は外の物を読ませない。
 * 定義を読めない時は、全ての塊をその誤りの文に置き換える。
 *
 * `dragon embed` が収めた配管の図の並べ方 (`#dragon-layouts`、#3748) が在れば全ての塊に渡し、鍵が合う図は道を探さずに描く。
 * `drawn` を渡すと、全ての塊の図を描いた後に、描いた原本と設定を渡す。jsDelivr の入口はここで配管の図の箱を開いた形を先に組む (#3753)。
 */
import { dedent } from "./embed/dedent";
import type { StoredPipeLayout } from "./kinds/pipe/layout";
import { parseNotation } from "./parser";
import { registerUserBlockReader, type UserBlocks, userBlockReader } from "./user-blocks";
import { mountDiagram, type PlayerOptions } from "./player";
import type { Diagram } from "./schema";
import { STILL_ATTR, stillFigureHtml } from "./still-figure";
import type { BuiltinButton, EmbedLook } from "./frame/types";
import type { NotationLang } from "./words";

/** 帯の設定の塊 (`#dragon-header`) に書ける設定。SDK の `mountDragon` の `buttons` と `look` と同じ (#3789) */
export interface HeaderSettings {
  buttons?: readonly BuiltinButton[];
  look?: EmbedLook;
}

/** 属性 `data-header` を持つ塊の図を、`host` に置いた帯の内側に描く処理 (#3699、#3789)。描けない時は投げる */
export type FramedBlock = (host: HTMLElement, source: string, diagram: Diagram, options: PlayerOptions & HeaderSettings) => void;

/** 塊の図を描いた後に、描いた原本と設定を受け取る処理 (#3753) */
export type DrawnBlock = (diagram: Diagram, options: PlayerOptions & { lang: NotationLang }) => void;

const detail = (error: unknown): string => (error instanceof Error ? error.message : String(error));

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

/** 帯の設定の塊を読めない時の誤りの文 */
const HEADER_TEXT: Record<NotationLang, { json(detail: string): string; shape: string; field(key: string): string; buttons: string; look: string }> = {
  ja: {
    json: (detail) => `#dragon-header: 帯の設定をJSONとして読めない。${detail}`,
    shape: "#dragon-header: 帯の設定は「buttons」と「look」の欄を持つ物で書く",
    field: (key) => `#dragon-header: 帯の設定に「${key}」は書けない。書けるのは「buttons」と「look」`,
    buttons: "#dragon-header: 「buttons」はボタンの名前の並びで書く",
    look: "#dragon-header: 「look」は欄を持つ物で書く",
  },
  en: {
    json: (detail) => `#dragon-header: cannot read the header settings as JSON. ${detail}`,
    shape: '#dragon-header: write the header settings as an object with "buttons" and "look"',
    field: (key) => `#dragon-header: the header settings cannot hold "${key}"; write "buttons" and "look" only`,
    buttons: '#dragon-header: write "buttons" as a list of button names',
    look: '#dragon-header: write "look" as an object',
  },
};

/** 欄を持つ物か。並びと null は数えない */
const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null && !Array.isArray(value);

/**
 * 頁の帯の設定の塊 (`<script type="application/json" id="dragon-header">`、#3789)。塊の無い頁は空の設定にする。
 * JSON として読めない時と、`buttons` と `look` のほかの鍵や形の違う値を持つ時は誤りの文を返す。ボタンの名前は帯を置く時に帯が確かめる
 */
function headerSettings(doc: Document, lang: NotationLang): { ok: true; settings: HeaderSettings } | { ok: false; message: string } {
  const text = doc.getElementById("dragon-header")?.textContent;
  if (text === undefined || text === null) return { ok: true, settings: {} };
  const words = HEADER_TEXT[lang];
  let read: unknown;
  try {
    read = JSON.parse(text);
  } catch (error) {
    return { ok: false, message: words.json(detail(error)) };
  }
  if (!isRecord(read)) return { ok: false, message: words.shape };
  const unknownKey = Object.keys(read).find((key) => key !== "buttons" && key !== "look");
  if (unknownKey !== undefined) return { ok: false, message: words.field(unknownKey) };
  if (read.buttons !== undefined && !(Array.isArray(read.buttons) && read.buttons.every((name) => typeof name === "string"))) return { ok: false, message: words.buttons };
  if (read.look !== undefined && !isRecord(read.look)) return { ok: false, message: words.look };
  return { ok: true, settings: read as HeaderSettings };
}

/**
 * `dragon embed` が頁に収めた配管の図の並べ方 (`<script type="application/json" id="dragon-layouts">`、#3748)。
 * 収めていない頁と、読めない字の頁では無い物とし、図はその場で並べ方を組んで描く
 */
function storedLayouts(doc: Document): StoredPipeLayout[] | undefined {
  const text = doc.getElementById("dragon-layouts")?.textContent;
  if (!text) return undefined;
  try {
    const read: unknown = JSON.parse(text);
    return Array.isArray(read) ? (read as StoredPipeLayout[]) : undefined;
  } catch {
    return undefined;
  }
}

/** 頁の全ての塊に共通する物。頁を読み終えた時に 1 度だけ作る */
interface PageShared {
  lang: NotationLang;
  defined: Promise<UserBlocks[]>;
  layouts: StoredPipeLayout[] | undefined;
  header: ReturnType<typeof headerSettings>;
}

async function drawBlock(
  block: Element,
  prepare: (text: string) => Promise<void>,
  page: PageShared,
  framed?: () => Promise<FramedBlock>,
  drawnBlock?: DrawnBlock,
): Promise<void> {
  const doc = block.ownerDocument;
  const { lang, layouts, header } = page;
  const text = dedent(block.textContent ?? "");
  // 止めて置く塊は帯を付けないので、帯の塊を読まない
  const wantsFrame = framed !== undefined && block.hasAttribute("data-header") && !block.hasAttribute(STILL_ATTR);
  let blocks: UserBlocks | undefined;
  let mountFramed: FramedBlock | undefined;
  try {
    // 帯の塊は記法が使う部品と同時に読み始め、届いてから帯の内側に 1 度だけ描く (#3789)
    const [, sets, frame] = await Promise.all([prepare(text), page.defined, wantsFrame ? framed() : undefined]);
    blocks = merged(sets);
    mountFramed = frame;
  } catch (error) {
    block.replaceWith(errorBox(doc, [detail(error)]));
    return;
  }
  // `data-note="pop"` を持つ塊は、1 行目に note を書かない図を箱の説明を押すと出る札で見せる。mdから書き出した頁の頭の `note: pop` が付ける (#3877)
  const parsed = parseNotation(text, { lang, ...(blocks ? { blocks } : {}), ...(block.getAttribute("data-note") === "pop" ? { note: "pop" as const } : {}) });
  if (!parsed.ok) {
    block.replaceWith(errorBox(doc, parsed.errors.map((error) => `${error.line}: ${error.message}`)));
    return;
  }
  // 帯の設定の塊を読めない頁では、帯つきの塊を既定の帯で黙って描かず、誤りの文にする (#3789)
  if (mountFramed && !header.ok) {
    block.replaceWith(errorBox(doc, [header.message]));
    return;
  }
  // 属性 `data-still` を持つ塊は、再生の部品を置かず、最後の段の形を描いた SVG に置き換える (#3801)
  if (block.hasAttribute(STILL_ATTR)) {
    const width = Math.round(block.getBoundingClientRect().width);
    try {
      const holder = doc.createElement("div");
      holder.innerHTML = stillFigureHtml(parsed.diagram, { lang, ...(blocks ? { blocks } : {}), ...(width > 0 ? { width } : {}) });
      block.replaceWith(holder.firstElementChild ?? holder);
    } catch (error) {
      block.replaceWith(errorBox(doc, [detail(error)]));
    }
    return;
  }
  // 図は枠の幅で見せ方を選ぶので、枠を頁に置いてから描く
  const host = doc.createElement("div");
  host.className = "dragon-figure";
  block.replaceWith(host);
  try {
    const options = { lang, ...(blocks ? { blocks } : {}), ...(layouts ? { layouts } : {}) };
    if (mountFramed && header.ok) mountFramed(host, text, parsed.diagram, { ...options, ...header.settings });
    else mountDiagram(host, parsed.diagram, options);
    drawnBlock?.(parsed.diagram, options);
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

/** 塊が幅を持てば `run` を呼ぶ。幅を持たなければ、幅を持った時に 1 度だけ呼ぶ (#3755)。大きさを見張れない環境ではすぐ呼ぶ */
function whenShown(block: Element, run: () => void): void {
  const Observer = block.ownerDocument.defaultView?.ResizeObserver;
  if (!Observer || block.getBoundingClientRect().width > 0) {
    run();
    return;
  }
  const observer = new Observer(() => {
    if (block.getBoundingClientRect().width === 0) return;
    observer.disconnect();
    run();
  });
  observer.observe(block);
}

/** 頁の記法の塊。`<pre class="dragon">` と、Markdown の囲みから作った `<pre><code class="language-dragon">` の `<pre>` */
const pageBlocks = (doc: Document): Element[] => [
  ...doc.querySelectorAll("pre.dragon"),
  ...[...doc.querySelectorAll("pre > code.language-dragon")].flatMap((code) => (code.parentElement && !code.parentElement.matches("pre.dragon") ? [code.parentElement] : [])),
];

/**
 * 頁の記法の塊を全て図に置き換える。`prepare` は記法を読む前に待ち、その記法が使う部品を読む。
 * `framed` を渡すと、属性 `data-header` を持つ塊は `prepare` と同時にそれを待ち、返った処理で帯の内側に図を描く。
 * `drawnBlock` を渡すと、全ての塊の図を描いた後にそれへ渡す。
 * 頁を読み終える前に呼ばれた時は、読み終えてから置き換える
 */
export function drawPageBlocks(doc: Document, prepare: (text: string) => Promise<void>, framed?: () => Promise<FramedBlock>, drawnBlock?: DrawnBlock): void {
  const lang: NotationLang = doc.documentElement.lang.toLowerCase().startsWith("ja") ? "ja" : "en";
  const draw = (): void => {
    const defined = pageDefinitions(doc, lang);
    // 誤りは塊ごとに誤りの文として出すので、まとめて待つ側では握らない
    defined.catch(() => undefined);
    const page: PageShared = { lang, defined, layouts: storedLayouts(doc), header: headerSettings(doc, lang) };
    for (const block of pageBlocks(doc)) whenShown(block, () => void drawBlock(block, prepare, page, framed, drawnBlock));
  };
  if (doc.readyState === "loading") doc.addEventListener("DOMContentLoaded", draw, { once: true });
  else draw();
}
