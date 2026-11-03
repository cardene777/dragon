/**
 * 出典の描き方 (#3199、#3345)。
 *
 * 出典は図の SVG に描かない。頁に置いた図の下の、読み上げの道具が段の順に読む一覧 (`player.ts`) に出す。
 * 段の項目の本文の後ろに、名前を URL への link にした項目を書いた順に並べる。出典を書かない段には何も足さない。
 */
import type { StepSource } from "./block";

/** 段の項目 `item` に、出典の link の並びを足す */
export function drawSources(doc: Document, item: HTMLElement, sources: readonly StepSource[] | undefined): void {
  if (!sources) return;
  const list = doc.createElement("ul");
  for (const source of sources) {
    const link = doc.createElement("a");
    link.href = source.url;
    link.textContent = source.name;
    const entry = doc.createElement("li");
    entry.append(link);
    list.append(entry);
  }
  item.append(list);
}
