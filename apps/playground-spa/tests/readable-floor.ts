/**
 * 見本ごとの「画面上の文字の下限」 の期待値 (#1102)。 検査から参照する共有の期待値で、
 * 検査 file ではない (Playwright は `*.spec.ts` だけを拾う)。
 *
 * ## 実装の定数を import しない
 *
 * `src/lib/readable-scale.ts` の `READABLE_MIN_PX` / `READABLE_RELAXED_PX` を import すると、
 * 実装側の値を変えた時に検査の期待値も一緒に動いて何も落ちなくなる。 ここには実測した数を
 * 書き写す。
 *
 * ## どの見本がどちらに落ちるか
 *
 * 好ましい下限 10px で箱が枠から出る図だけが 8px まで譲る。 窓 1440×900 (絵の枠 840px) での
 * 実測が下の表。
 *
 * | 見本 | 下限 | 理由 |
 * |---|---|---|
 * | `swimlane` | 8px | 10px では箱が枠から出る |
 * | `state-machine` | 8px | 同上 |
 * | `er` | 8px | 同上 |
 * | それ以外の 9 件 | 10px | 箱が枠に収まる |
 *
 * `sequence` は図の外枠が 886px で枠 840px を超えるが、 箱は 17 個すべて内側なので譲らない。
 * 外枠で判定すると全図が譲る側に落ちる (実測)。
 */

/** 画面上でこれを下回ると本文として読めない (`src/lib/readable-scale.ts` と同じ値を書き写す)。 */
export const MIN_PX = 10;

/** 箱が枠から出る図に限って譲る下限 (同上)。 */
export const RELAXED_PX = 8;

/** 8px まで譲る見本。 窓 1440×900 での実測。 */
export const 譲る見本: readonly string[] = ["swimlane", "state-machine", "er"];

/** 見本の下限 (px)。 窓 1440×900 が前提で、 枠が狭い場合は別の見本も譲る側に落ちる。 */
export const 下限 = (slug: string): number => (譲る見本.includes(slug) ? RELAXED_PX : MIN_PX);
