/**
 * 取り消しの描き方 (#3389、#3398)。
 *
 * `revert` の段で、落ちた呼び出しの内側の変更 (槽、値の札、イベント、流れた分) は取り消しの印を付けて元の値へ戻る。
 * 戻った槽は桃色の縁で描き、取り消す前の水位に桃色の点線を引く。落ちた理由は、その段の吹き出しが桃色の縁で大きく書く。
 * この file は槽の描き方 (`hold/draw.ts`) だけが読み、見本帳を開いた時に読む塊に入れない
 */
import { r1 } from "../../render/parts";

/** 取り消す前の水位の線。槽の左の外から右の外まで */
export const undoneMark = (x1: number, x2: number, y: number): string =>
  `<line class="dg-pp-mark dg-pp-mark-rolled" x1="${r1(x1)}" y1="${r1(y)}" x2="${r1(x2)}" y2="${r1(y)}"/>`;
