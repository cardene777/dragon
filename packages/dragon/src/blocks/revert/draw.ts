/**
 * 取り消しの描き方 (#3389)。
 *
 * `revert` の段で、落ちた者の列の下に取り消しの札を出し、落ちた理由を書く。落ちた呼び出しの管は桃色の点線で残り、
 * 落ちた呼び出しの内側の変更 (槽、値の札、イベント、流れた分) は、その段で取り消しの印を付けて元の値へ戻る。
 * この file は配管の図を描く部品 (`render/pipe.ts`) だけが読み、見本帳を開いた時に読む塊に入れない
 */
import type { PipeUndo } from "../../kinds/pipe/layout";
import type { Shown } from "../../render/ink";
import type { Ctx } from "../../render/parts";
import { card } from "../check/draw";

/** 取り消しの札 */
export function undo(u: PipeUndo, ctx: Ctx, shown: Shown[], attrs: string): string {
  return card(u, "rose", "undo", ctx, shown, attrs);
}
