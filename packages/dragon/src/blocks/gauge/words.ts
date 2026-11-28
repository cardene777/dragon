/**
 * 量の目盛りの字の既定 (#4043)。上限を超えた段に出す札の既定の字 (#3880) と、棒の下の内訳の行の確定と予約の語 (#3895) と、
 * 目盛りを押すと出る内訳の札の見出しの上限の語 (#3896) を、描く言葉ごとに持つ。
 * 目盛りは手順の図と列の図の後から読む塊だけが描くので、最初に読む言葉の表 (`figure-text.ts`) に置かず、目盛りの置き場が持つ。
 * 最初に読む言葉の表に置くと、目盛りを描かない頁も目盛りの語を読み、最初に読む量の上限を超えた (#4043)
 */
import type { NotationLang } from "../../words";
import type { Split } from "./layout";

export interface GaugeWords {
  /** 上限を超えた段に出す札の既定の字。目盛りの `over` で替えられる */
  over: string;
  /** 内訳の行の、確定した量と予約した量の語 */
  split: Split;
  /** 内訳の札 (#3896) の見出しで、上限の数と単位の前に置く語 */
  limit: string;
}

export const GAUGE_WORDS: Record<NotationLang, GaugeWords> = {
  ja: { over: "上限を超えた", split: ["確定", "予約"], limit: "上限" },
  en: { over: "over the limit", split: ["confirmed", "held"], limit: "Limit" },
};
