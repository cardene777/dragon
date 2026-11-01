/**
 * 字の CSS (`@font-face`) を最初の CSS に入れず、頁が動いてから読む (#3292)。
 *
 * 字は `font-display: swap` なので、指定を読み終えても字の file が届くまでは端末の字で出る。
 * 初めて開く端末は指定を待っても字が替わらないので、最初の画面を先に描き、描いた後に読む。
 * 2 度目からは描く前に読み終える。字の file が cache に在れば、端末の字を挟まずに最初の画面が出る。
 * 読めなかった時は端末の字のまま頁を使えるので、誤りにしない。
 */
const SEEN = "dragon-fonts-seen";

/** この端末が前に字の CSS を読んだか。保存を止めた browser では初めての端末として扱う */
export function fontsSeen(): boolean {
  try {
    return localStorage.getItem(SEEN) !== null;
  } catch {
    return false;
  }
}

function rememberFonts(): void {
  try {
    localStorage.setItem(SEEN, "1");
  } catch {
    // 残せなくても、次に開いた時に初めての端末として読むだけで済む
  }
}

/** 字の CSS を読む。2 度目からは何もしない */
export async function loadFonts(): Promise<void> {
  try {
    await import("@cardenelabs/dragon/fonts");
    rememberFonts();
  } catch {
    // 読めなかった時は端末の字で頁を使う
  }
}
