/** 見本帳の部品の頁の、輪の説明 (#3623)。部品の頁だけが読み、見本帳が最初に読む塊に入れない */
import type { BlockDesc } from "../../gallery";

export const desc: BlockDesc = {
  ja: "回り続ける図だけの部品。box の行で宣言した手順を、書いた順に真上から右回りに輪の上へ置き、隣どうしを弧の矢印で結ぶ。段の中の線は輪の次の手順へだけ引け、[tag: <字>] の札がその弧を走る。手順は 2 つから 8 つまで書く。図の種類の行に [shape: clock] を書くと、手順を [time: <長さ>] の長さの弧で時計の文字盤に置き、札は針の先に乗って走る。[shape: clock, turn: left] は左回りにする。",
  en: "Cycle diagrams only. The steps declared with box lines sit on a ring clockwise from the top in the order written, and neighbours are joined by arc arrows. A line in a step goes only to the next step on the ring, and its [tag: <text>] chip runs along that arc. A ring takes 2 to 8 steps. With [shape: clock] on the first line, the steps sit on a clock dial as arcs as long as their [time: <length>], and the chip rides the tip of the hand. [shape: clock, turn: left] turns the dial counterclockwise.",
};
