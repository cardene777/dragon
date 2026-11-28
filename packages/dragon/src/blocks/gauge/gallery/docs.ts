/** 使い方の頁の「帯」の節の、量の目盛りの段落 (#3880)。押すと開く内訳の札の段落は #3896 */
import type { BlockDocs } from "../../gallery";

export const docs: BlockDocs = {
  section: "strip",
  ja: [
    "目盛りは上限のある量を横の棒で見せる部品で、手順の図と列の図に置ける。最初の `step` より前に `gauge <名札> as <名前> [on: <箱>, limit: <上限>, unit: <単位>]` で宣言する。",
    "段の中で `set <目盛り>: <総量>` と書くと、棒がその値まで動き、`20 / 100 USDC` の字と、前の段から増えた量か減った量の札が出る。値を書かない段は前の段の値を保つ。",
    "目盛りは `on` の箱のすぐ下に置き、`on` を書かない目盛りは図の上の帯に置く。上限を超えた段は超えた分を赤で伸ばし、目盛りの下に「上限を超えた」の札を出す。札の字は `[over: <字>]` で替えられる。",
    "`set <目盛り>: <確定> [hold: <予約>]` と書くと、確定した量を濃い色、続けて予約した量を同じ色の淡い塗りで同じ棒に塗り、棒の下に「確定 40」「予約 30」の内訳を出す。値の字は 2 つの合計になり、合計で上限と比べる。`hold` を書かない `set` は予約を 0 に戻す。",
    "1 行目に `[note: pop]` を書いた手順の図は、値を書いた目盛りの名前のすぐ右に丸い i の印が付き、目盛りを押すとすぐ下に内訳の札が開く。札は値を書いた段ごとに、段の名前、その段の終わりの目盛りの小さな棒、増えた量、その時の値を今見ている段まで並べ、印刷の形では全ての段を並べる。",
  ],
  en: [
    "A gauge shows an amount with a limit as a bar, in a flow or a lineup diagram. Declare it before the first `step` with `gauge <id> as <name> [on: <box>, limit: <limit>, unit: <unit>]`.",
    "Inside a step, `set <gauge>: <total>` moves the bar to that value. It shows `20 / 100 USDC` and a tag with the change from the step before. A step without it keeps the value.",
    "A gauge sits right under its `on` box, and a gauge without `on` sits in the band at the top. Over the limit, the extra part grows in red with an over the limit tag under it. Change the tag with `[over: <text>]`.",
    "`set <gauge>: <confirmed> [hold: <held>]` paints the confirmed amount in the full color and the held amount after it in a pale shade of the same color, with `confirmed 40` and `held 30` under the bar. The value shows their sum, and the sum is compared with the limit. A `set` without `hold` clears the held amount.",
    "In a flow diagram with `[note: pop]` on the first line, a gauge with a value gets a round i mark right after its name. Clicking the gauge opens a breakdown card just below it. The card lists each step that sets a value, up to the step on screen, with its name, a small bar, the change, and the value. The printed form lists every step.",
  ],
};
