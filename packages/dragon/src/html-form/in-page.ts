/**
 * 頁に置いたHTMLの形の図を原本へ読む、後から読む塊 (#3908)。
 *
 * scriptの1行の入口は、頁に`<dg-<種類>>`の図が在る時だけこの塊を読み、記法の塊だけの頁が最初に読む量を増やさない。
 * 読んだ原本は記法へ書き戻し、記法の塊と同じ道で描く。誤りは要素の名前を頭に付けた文で返す。
 */
import { parseHtml } from "./html";
import { figuresIn, formMessage, readFigure } from "./figure";
import { FORM_MESSAGES } from "./messages";
import type { NotationLang } from "../words";

/** HTMLの形の図の字 (要素の`outerHTML`) を原本へ読む。読めない時は誤りの文を返す */
export function readPageFigure(html: string, lang: NotationLang): { ok: true; diagram: Record<string, unknown> } | { ok: false; errors: string[] } {
  const [root] = figuresIn(parseHtml(html));
  if (!root) return { ok: false, errors: [FORM_MESSAGES[lang].noFigure] };
  const read = readFigure(root, lang);
  return read.ok ? { ok: true, diagram: read.figure.diagram } : { ok: false, errors: read.errors.map(formMessage) };
}
