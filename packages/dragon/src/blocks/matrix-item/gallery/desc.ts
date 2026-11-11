/** 見本帳の部品の頁の、2つの軸で置く図の課題の説明 (#3622)。部品の頁だけが読み、見本帳が最初に読む塊に入れない */
import type { BlockDesc } from "../../gallery";

export const desc: BlockDesc = {
  ja: "2つの軸で置く図だけの部品。最初の step より前に item <名札> as <名前> と書くと、課題の札が区画の左の置く前の一覧に書いた順に並ぶ。段の中に line <区画>: <課題> と書くと、その段で札が一覧から区画へ滑り、区画が光る。",
  en: "Two-axis matrices only. Write item <id> as <name> before the first step and the item's card waits in the list left of the areas, in written order. Write line <area>: <item> in a step and the card slides from the list into that area while the area lights up.",
};
