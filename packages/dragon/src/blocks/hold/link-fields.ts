/**
 * 原本の中の、値の持ち分の線 (`blocks.hold[].link`) の決まりのうち、形の決まりに書けない分 (Tracelyth #133)。
 *
 * 2人を結ぶ線は別の2人を結ぶ (`from` と `to` が違う)。形の決まりは2つの欄の値を比べられないので、原本の検査がここで確かめる。
 * 原本の検査は軽い入口で後から読む塊 (`schemas/validator.ts`) なので、欄を辿る処理もその塊に置き、最初に読む束に入れない。
 */
import type { FieldError } from "../../schema";

/** 原本 `input` の値の持ち分の線のうち、同じ人どうしを結ぶ線の欄の誤り。誤りの文は `message` */
export function holdLinkErrors(input: unknown, message: string): FieldError[] {
  if (input === null || typeof input !== "object") return [];
  const blocks = (input as { blocks?: unknown }).blocks;
  if (blocks === null || typeof blocks !== "object") return [];
  const holds = (blocks as { hold?: unknown }).hold;
  if (!Array.isArray(holds)) return [];
  return holds.flatMap((hold: unknown, i) => {
    if (hold === null || typeof hold !== "object") return [];
    const link = (hold as { link?: unknown }).link;
    if (link === null || typeof link !== "object") return [];
    const { from, to } = link as { from?: unknown; to?: unknown };
    return typeof from === "string" && from === to ? [{ pointer: `/blocks/hold/${i}/link`, message }] : [];
  });
}
