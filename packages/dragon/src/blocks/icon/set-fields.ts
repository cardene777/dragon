/**
 * 原本の中の、絵柄集の絵柄を書いた `icon` の欄 (#3493)。原本の検査と書き出した頁が、欄の場所と値を引く。
 *
 * 原本の検査は軽い入口で後から読む塊 (`schemas/validator.ts`) なので、欄を辿る処理もその塊に置き、最初に読む束に入れない。
 */
import type { FieldError } from "../../schema";
import { isTabler, type TablerMessages, tablerError } from "./sets";

/** 原本 `input` の中の `icon` の欄のうち、絵柄集の絵柄を書いた欄の場所 (JSON Pointer) と値。原本を書いた形 (版1か版2) のまま辿る */
export function setIconFields(input: unknown): [pointer: string, value: string][] {
  const out: [string, string][] = [];
  const walk = (value: unknown, at: string): void => {
    if (value === null || typeof value !== "object") return;
    for (const [key, item] of Object.entries(value)) {
      const here = `${at}/${key.replaceAll("~", "~0").replaceAll("/", "~1")}`;
      if (key === "icon" && typeof item === "string" && isTabler(item)) out.push([here, item]);
      else walk(item, here);
    }
  };
  walk(input, "");
  return out;
}

/**
 * 原本 `input` の Tabler の絵柄のうち、表を読んでいないか表に無い名前の欄の誤り。誤りの文は `m` から引く。
 * 名前の書き方 (`tabler:<小文字と数字と ->`) に合わない値は形の検査が断るので、同じ欄に 2 つ目の誤りを重ねない
 */
export const tablerErrors = (input: unknown, m: TablerMessages): FieldError[] =>
  setIconFields(input).flatMap(([pointer, value]) => {
    const message = TABLER_NAME.test(value) ? tablerError(value, m) : undefined;
    return message === undefined ? [] : [{ pointer, message }];
  });

/** Tabler の絵柄の名前の書き方。原本の形の決まり (`shape.ts` の `setIcon`) もこの決まりを使う */
export const TABLER_NAME = /^tabler:[a-z0-9]+(?:-[a-z0-9]+)*$/u;
