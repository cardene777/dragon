/** 使い方の頁の「時間軸の図」の節の、時間軸の図の始め方と目盛りの段落 (#3348) */
import type { BlockDocs } from "../../gallery";

export const docs: BlockDocs = {
  section: "time",
  ja: [
    "決まった間隔で進む時間の上で、出来事がどの目盛りで起きたかを段ごとに追う時は、最初の行を `time <題>` にする。`scale <単位> <長さ> <数>` で目盛りを宣言すると、その数の目盛りが軸に等間隔で並ぶ。長さは数と単位 (`ms`、`s`、`min`、`h`、`d`) の組で書き、軸の時刻の字はこの長さから計算する。",
  ],
  en: [
    "To follow, step by step, which tick each event happens on while time moves at a fixed interval, start the first line with `time <title>`. `scale <unit> <length> <count>` declares the ticks, and that many ticks are spaced evenly along the axis. Write the length as a number and a unit (`ms`, `s`, `min`, `h`, `d`); the time labels on the axis are worked out from it.",
  ],
};
