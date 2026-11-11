/** 見本帳の部品の頁の、2つの軸で置く図の軸の説明 (#3622)。部品の頁だけが読み、見本帳が最初に読む塊に入れない */
import type { BlockDesc } from "../../gallery";

export const desc: BlockDesc = {
  ja: "2つの軸で置く図だけの部品。最初の step より前に axis <名前> [from: <小さい側>, to: <大きい側>] を横の軸、縦の軸の順に 2 行書くと、区画の下に横の軸、左に縦の軸の矢印を引き、軸の名前と両端の字を出す。",
  en: "Two-axis matrices only. Write axis <name> [from: <low end>, to: <high end>] twice before the first step, the horizontal axis first and then the vertical one. The horizontal arrow runs below the areas and the vertical arrow left of them, each with its name and both ends.",
};
