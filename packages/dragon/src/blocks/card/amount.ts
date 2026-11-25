/**
 * 持ち主ごとのカードの量 (#3846)。
 *
 * カードの `[amount: <量>]` は数と単位の組 (`1000 USDC`、`1,200円`、`0.5 ETH`) で、単位は省ける。
 * 読む処理 (`read.ts`) は量の形を確かめ、並べ方 (`kinds/cards/layout.ts`) は列の合計を単位ごとに足して、書いた形に揃えた字にする。
 * 原本の形の決まり (`shape.ts`) も同じ形を持つ
 */

/** 量の字。3 桁ごとの `,` と小数を書ける数と、数の後ろの単位。単位は数の字と `.` と `,` で始まらない */
const AMOUNT = /^(\d+(?:,\d{3})*(?:\.\d+)?)(\s*)([^\s\d.,]\S*)?$/u;

/** 量の字の形。原本の形の決まりの `pattern` に書く */
export const AMOUNT_PATTERN = "^[0-9]+(,[0-9]{3})*(\\.[0-9]+)?(\\s*[^\\s0-9.,]\\S*)?$";

/** 読んだ量。`gap` は数と単位の間の空白、`comma` は 3 桁ごとの `,` を書いたか、`places` は小数の桁の数 */
export interface Amount {
  value: number;
  unit: string;
  gap: string;
  comma: boolean;
  places: number;
}

/** 量の字を読む。形に合わない字は `undefined` */
export function amountOf(text: string): Amount | undefined {
  const found = AMOUNT.exec(text);
  const digits = found?.[1];
  if (!found || digits === undefined) return undefined;
  const unit = found[3] ?? "";
  return { value: Number(digits.replaceAll(",", "")), unit, gap: unit === "" ? "" : (found[2] ?? ""), comma: digits.includes(","), places: digits.split(".")[1]?.length ?? 0 };
}

/** 数 `value` を、`like` の量と同じ単位と書き方 (3 桁ごとの `,` と小数の桁) の字にする */
export function writeAmount(value: number, like: Amount): string {
  const [whole = "0", part] = value.toFixed(like.places).split(".");
  const grouped = like.comma ? whole.replace(/\B(?=(\d{3})+(?!\d))/gu, ",") : whole;
  return `${grouped}${part === undefined ? "" : `.${part}`}${like.unit === "" ? "" : `${like.gap}${like.unit}`}`;
}
