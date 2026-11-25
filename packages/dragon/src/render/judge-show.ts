/**
 * 判定の表 (#3879) の段の印を書く処理と消す処理。外の名前を読まないので、書き出す入口 (`capture/`) も表の描き方を読まずに使う (#3937)。
 * 再生の部品は段を送るたびに `showJudge` で表の根に `data-play` を、照らした列のセルに `data-on` を、今の段の列に `data-now` を書く。
 * 書き出す入口は頁の表の写しから `clearJudge` で印を消し、全てのセルと判定を照らさずに見せた形を撮る。
 */

/** 段 `step` までの列を照らす。段は規則の列ごとに 1 つで、最後の段は判定の列。再生の部品が段を送るたびに呼ぶ */
export function showJudge(figure: HTMLElement, step: number): void {
  figure.dataset.play = "";
  for (const cell of figure.querySelectorAll<HTMLElement>("[data-col]")) {
    const col = Number(cell.dataset.col);
    cell.toggleAttribute("data-on", col <= step);
    cell.toggleAttribute("data-now", col === step);
  }
}

/** 段の印を全て消し、描いただけの表と同じく全てのセルと判定を照らさずに見せる */
export function clearJudge(figure: HTMLElement): void {
  delete figure.dataset.play;
  for (const cell of figure.querySelectorAll<HTMLElement>("[data-col]")) {
    cell.removeAttribute("data-on");
    cell.removeAttribute("data-now");
  }
}
