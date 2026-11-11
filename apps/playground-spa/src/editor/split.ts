/**
 * 編集画面の欄の幅 (#3612)。
 *
 * 棚と記法の欄は幅を持ち、図の欄は残りの幅を取る。
 * 人が引いた幅 (頼んだ幅) を手元に残し、次に編集画面を開いた時も同じ幅で並べる。
 * 並べる幅 (見せる幅) は編集画面の幅から決め、図の欄 320px、記法の欄 240px、棚 180px を割らない。
 * 編集画面が狭くなった時は、先に記法の欄が頼んだ幅を諦め、それでも足りない時に棚が諦める。
 */

export type Pane = "shelf" | "code";
export type Widths = Record<Pane, number>;

/** 何も残っていない時の幅。0.35.0 より前のサイトの編集画面と同じ */
export const DEFAULT_WIDTHS: Readonly<Widths> = { shelf: 240, code: 300 };

/** 欄ごとの最も狭い幅。図の欄は CCIP の箱の名前を読める幅を残す */
export const MIN_WIDTHS: Readonly<Widths & { stage: number }> = { shelf: 180, code: 240, stage: 320 };

/** 矢印 1 回で動く幅。Shift を足すと 4 倍 */
export const KEY_STEP = 16;
export const KEY_STEP_LARGE = KEY_STEP * 4;

const STORE = "dragon-editor-widths";

const kept = (value: unknown, pane: Pane): number =>
  typeof value === "number" && Number.isFinite(value) && value >= MIN_WIDTHS[pane] ? Math.round(value) : DEFAULT_WIDTHS[pane];

/** 残した頼んだ幅。読めない値と最小より狭い値は最初の幅に戻す */
export function readWidths(): Widths {
  try {
    const saved = JSON.parse(localStorage.getItem(STORE) ?? "null") as Partial<Record<Pane, unknown>> | null;
    return { shelf: kept(saved?.shelf, "shelf"), code: kept(saved?.code, "code") };
  } catch {
    return { ...DEFAULT_WIDTHS };
  }
}

export function saveWidths(widths: Widths): void {
  try {
    localStorage.setItem(STORE, JSON.stringify(widths));
  } catch {
    // 手元に残せない時 (保存を断る閲覧) は、開いている間だけ幅を持つ
  }
}

const clamp = (value: number, low: number, high: number): number => Math.max(low, Math.min(value, high));

/**
 * 並べる幅。total は編集画面の幅、withShelf は棚を横に並べているか (幅 1100px 以下では棚を引き出しに畳む)。
 * 幅を測れていない間 (total が 0) は頼んだ幅のまま並べる
 */
export function shownWidths(asked: Widths, total: number, withShelf: boolean): Widths {
  if (total <= 0) return asked;
  const room = total - MIN_WIDTHS.stage;
  const shelf = withShelf ? clamp(asked.shelf, MIN_WIDTHS.shelf, room - MIN_WIDTHS.code) : 0;
  return { shelf: withShelf ? shelf : asked.shelf, code: clamp(asked.code, MIN_WIDTHS.code, room - shelf) };
}

/** 欄の見せる幅を next にした時の頼んだ幅。もう一方の欄の見せる幅と図の欄の 320px を残す所で止める */
export function resizeTo(asked: Widths, pane: Pane, next: number, total: number, withShelf: boolean): Widths {
  const shown = shownWidths(asked, total, withShelf);
  const other = pane === "shelf" ? shown.code : withShelf ? shown.shelf : 0;
  const high = total > 0 ? total - MIN_WIDTHS.stage - other : Number.POSITIVE_INFINITY;
  return { ...asked, [pane]: Math.round(clamp(next, MIN_WIDTHS[pane], high)) };
}
