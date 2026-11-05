/**
 * 換算の描き方 (#3389)。
 *
 * `calc` の段で、行う者の列の下に換算の札を出す。上に比率 (出る値を入る値で割った数)、下に入る値と出る値を矢印でつないで書く。
 * 札は同じ者の次の `check` の段まで残す。換算した値をその者が確かめるまでを 1 つの流れとして見せるため。
 * この file は配管の図を描く部品 (`render/pipe.ts`) だけが読み、見本帳を開いた時に読む塊に入れない
 */
import type { PipeConverter } from "../../kinds/pipe/layout";
import type { Shown } from "../../render/ink";
import type { Ctx } from "../../render/parts";
import { card } from "../check/draw";

/** 換算の札 */
export function converter(c: PipeConverter, ctx: Ctx, shown: Shown[], attrs: string): string {
  return card(c, "amber", "convert", ctx, shown, attrs);
}
