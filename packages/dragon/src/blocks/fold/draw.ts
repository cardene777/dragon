/**
 * 畳みの描き方 (#3389)。
 *
 * `[fold]` の呼び出しの内側の段は 1 つの段にまとめ、呼ばれた者の列の下に点線の縁の箱を出す。箱は内側の段の数と、内側の段にしか出ない関係者の数を書き、
 * 押すと内側の段を開いて描き直す (再生の部品が `data-pipe-fold` を見る)。まとめた段の槽と値の札とイベントは、内側の出来事を全て当てた後の値で描く。
 * この file は配管の図を描く部品 (`render/pipe.ts`) だけが読み、見本帳を開いた時に読む塊に入れない
 */
import type { PipeFoldBox } from "../../kinds/pipe/layout";
import type { Shown } from "../../render/ink";
import type { Ctx } from "../../render/parts";
import { card } from "../check/draw";

/** 畳んだ箱。押すと開く */
export function foldBox(f: PipeFoldBox, ctx: Ctx, shown: Shown[], attrs: string): string {
  return card(f, "blue", "fold", ctx, shown, `${attrs} data-pipe-fold="${f.call}" role="button"`, "dg-pp-card dg-pp-fold");
}
