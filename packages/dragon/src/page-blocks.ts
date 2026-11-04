/**
 * 頁に置いた記法の塊 (`<pre class="dragon">`) を動く図に置き換える (#3343)。script の1行の入口と、`dragon embed` が埋める script が共に使う。
 *
 * 塊の字から共通の字下げを外して記法として読み、塊を図の枠 (`<div class="dragon-figure">`) に置き換えて描く。
 * 記法に誤りがある塊は図にせず、誤りの文を行ごとに並べた `<pre class="dragon-error">` に置き換える。
 * 言葉は頁の `lang` 属性が `ja` で始まれば日本語、ほかは英語にする。図の中の字と誤りの文の両方に使う。
 * 頁を読み終えた時に在る塊だけを描き、後から足した塊は見張らない。
 */
import { parseNotation } from "./parser";
import { mountDiagram } from "./player";
import type { NotationLang } from "./words";

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

async function drawBlock(block: Element, prepare: (text: string) => Promise<void>, lang: NotationLang): Promise<void> {
  const doc = block.ownerDocument;
  const text = dedent(block.textContent ?? "");
  try {
    await prepare(text);
  } catch (error) {
    block.replaceWith(errorBox(doc, [detail(error)]));
    return;
  }
  const parsed = parseNotation(text, { lang });
  if (!parsed.ok) {
    block.replaceWith(errorBox(doc, parsed.errors.map((error) => `${error.line}: ${error.message}`)));
    return;
  }
  // 図は枠の幅で見せ方を選ぶので、枠を頁に置いてから描く
  const host = doc.createElement("div");
  host.className = "dragon-figure";
  block.replaceWith(host);
  try {
    mountDiagram(host, parsed.diagram, { lang });
  } catch (error) {
    host.replaceWith(errorBox(doc, [detail(error)]));
  }
}

/**
 * 頁の記法の塊を全て図に置き換える。`prepare` は記法を読む前に待ち、その記法が使う部品を読む。
 * 頁を読み終える前に呼ばれた時は、読み終えてから置き換える
 */
export function drawPageBlocks(doc: Document, prepare: (text: string) => Promise<void>): void {
  const lang: NotationLang = doc.documentElement.lang.toLowerCase().startsWith("ja") ? "ja" : "en";
  const draw = (): void => {
    for (const block of doc.querySelectorAll("pre.dragon")) void drawBlock(block, prepare, lang);
  };
  if (doc.readyState === "loading") doc.addEventListener("DOMContentLoaded", draw, { once: true });
  else draw();
}
