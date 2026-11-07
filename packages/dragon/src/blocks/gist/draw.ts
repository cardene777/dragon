/**
 * 段の要点の読み上げの描き方 (#3464)。
 *
 * 要点は図の SVG に描かない。配管の図の下の要点の札は再生の部品の図の下の入れ物 (`pipe-player.ts`) が出し、
 * この file は頁に置いた図の下の、読み上げの道具が段の順に読む一覧 (`player.ts`) に出す。
 * 段の項目の本文と出典の後ろに、要点の名札と要点の文を 1 つの段落にして足す。要点を書かない段には何も足さない。
 */

/** 段の項目 `item` に、要点の名札 `label` と要点の文 `gist` の段落を足す */
export function drawGist(doc: Document, item: HTMLElement, gist: string | undefined, label: string): void {
  if (gist === undefined) return;
  const text = doc.createElement("span");
  text.dataset.dragon = "step-gist";
  text.textContent = gist;
  const line = doc.createElement("p");
  line.append(`${label} `, text);
  item.append(line);
}
