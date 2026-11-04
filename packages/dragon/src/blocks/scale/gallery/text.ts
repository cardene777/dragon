/** 見本帳の一覧の、目盛りと針の名前と説明 (#3165、#3348) */
import type { BlockText } from "../../gallery";

export const text: BlockText = {
  ja: {
    name: "目盛りと針",
    desc: "時間軸の図だけの部品。scale の行で目盛りの名前と 1 つの長さと数を書くと、時間軸に目盛りが並ぶ。段の中で now -> <目盛り> と書くと、針が決まった速さでその目盛りの終わりまで進む。period で区切りを、span で範囲の括弧か囲みを出す。",
  },
  en: {
    name: "Scale and needle",
    desc: "Time diagrams only. A scale line gives the unit name, the length of one unit and the count, and lays the units out along the axis. Inside a step, now -> <unit> moves the needle at a fixed speed to the end of that unit. period adds named periods, and span adds a bracket or a box over a range.",
  },
};
