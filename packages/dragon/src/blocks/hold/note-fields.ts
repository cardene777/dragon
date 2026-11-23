/**
 * 原本の中の、配管の図の箱の名前の下の字 (`blocks.box[].sub`) の決まりのうち、形の決まりに書けない分 (#3803)。
 *
 * 配管の図の箱の `sub` は、トークンの箱の名前の下に `balanceOf` の代わりに描く字で、トークンの箱にだけ書ける。
 * トークンの箱は、残高 (`blocks.hold[]` の `token`) の ETH でない単位に名前を書いた箱で、形の決まりは別の欄の値を比べられないので、原本の検査がここで確かめる。
 * 原本の検査は軽い入口で後から読む塊 (`schemas/validator.ts`) なので、誤りの文もこの塊に置き、最初に読む束に入れない。
 */
import type { FieldError } from "../../schema";
import type { NotationLang } from "../../words";

/** 送る値の決まった名前。宣言しないので、箱の名前にならない (`return/block.ts` の `ETH` と同じ字。定義の束を後から読む塊に入れないため写す) */
const ETH = "ETH";

const MESSAGES: Record<NotationLang, string> = {
  ja: "配管の図の箱のsubは、トークンの箱にだけ書ける。トークンの箱は、holdの残高の単位に名前を書いた箱",
  en: "In a pipe diagram, sub can be written only on a token box, a box whose name is the unit of a balance in hold",
};

/** 原本 `input` の配管の図で、トークンの箱でない箱に書いた `sub` の欄の誤り。誤りの文は `lang` の言葉 */
export function holdNoteErrors(input: unknown, lang: NotationLang): FieldError[] {
  if (input === null || typeof input !== "object") return [];
  const { kind, blocks } = input as { kind?: unknown; blocks?: unknown };
  if (kind !== "pipe" || blocks === null || typeof blocks !== "object") return [];
  const { box, hold } = blocks as { box?: unknown; hold?: unknown };
  if (!Array.isArray(box)) return [];
  const tokens = new Set(
    (Array.isArray(hold) ? hold : []).flatMap((h: unknown) => {
      const token = h !== null && typeof h === "object" ? (h as { token?: unknown }).token : undefined;
      return typeof token === "string" && token !== ETH ? [token] : [];
    }),
  );
  return box.flatMap((b: unknown, i) => {
    if (b === null || typeof b !== "object") return [];
    const { name, sub } = b as { name?: unknown; sub?: unknown };
    return sub !== undefined && !(typeof name === "string" && tokens.has(name)) ? [{ pointer: `/blocks/box/${i}/sub`, message: MESSAGES[lang] }] : [];
  });
}
