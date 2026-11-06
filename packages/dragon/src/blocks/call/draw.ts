/**
 * 呼び出しの種類の描き方 (#3389)。
 *
 * 呼び出しの種類は呼び出しの管の見た目で分ける。処理を借りる呼び出し (`[call: delegate]`) の管は芯を抜いた 2 本線、
 * 書き込めない呼び出し (`[call: static]`) の管は普通の管の半分の太さで描く (太さは並べ方が `width` に持つ)。
 * この file は呼び出しの管の描き方 (`return/draw.ts`) だけが読み、見本帳を開いた時に読む塊に入れない
 */
import { PIPE_LOOK } from "../../look/pipe";
import { r1 } from "../../render/parts";

/** 処理を借りる管の芯。管の道 `d` の上に地の色の細い線を重ね、2 本線に見せる。ほかの種類は何も描かない */
export function kindCore(lane: { kind: string; width: number }, d: string): string {
  return lane.kind === "delegate" ? `<path class="dg-pp-core" stroke-width="${r1(lane.width * PIPE_LOOK.call.core)}" d="${d}"/>` : "";
}
