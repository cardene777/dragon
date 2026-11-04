/** 使い方の頁の「時間軸の図」の節の、区切りと印の列と節目と拡大の帯の宣言の段落 (#3348) */
import type { BlockDocs } from "../../gallery";

export const docs: BlockDocs = {
  section: "time",
  ja: [
    "`period <名前> <目盛りの数>` は区切りの境ごとに名前と番号を置き、`row <名札> [empty: <目盛り>]` は目盛りごとの印の列を、`point <名札> at <目盛り>` は軸の下の節目を宣言する。`zoom <範囲>` で選んだ目盛りは上の帯に列として並び、宣言した箱が列ごとに同じ並びで出る。線は `[at: <目盛り>]` でその列の箱どうしを結び、`[into: <目盛り>]` を足すと受ける箱を別の列から選ぶ。",
  ],
  en: [
    "`period <name> <ticks>` puts a name and a number at each period boundary, `row <id> [empty: <ticks>]` declares a row of marks with one mark per tick, and `point <id> at <tick>` declares a point below the axis. The ticks chosen with `zoom <range>` become columns in the top band, and the declared boxes appear in every column in the same order. A line with `[at: <tick>]` joins the boxes in that column, and `[into: <tick>]` picks the receiving box from another column.",
  ],
};
