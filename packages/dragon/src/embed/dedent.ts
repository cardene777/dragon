/**
 * 頁に書いた記法の字から、空でない行に共通の字下げを外す (#3343、#3700)。
 *
 * 入れ子の HTML の中で書いた記法は全ての行に同じ字下げが付くので、外してから記法として読む。
 * scriptの1行の入口の塊 (`page-blocks.ts`) と、Web Componentの要素 (`embed/element.ts`) が共に使う。
 */
export function dedent(text: string): string {
  const lines = text.split("\n");
  const indents = lines.filter((line) => line.trim() !== "").map((line) => /^[ \t]*/u.exec(line)?.[0].length ?? 0);
  const cut = indents.length === 0 ? 0 : Math.min(...indents);
  return lines.map((line) => line.slice(cut)).join("\n");
}
