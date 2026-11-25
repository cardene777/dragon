/** 見本帳の部品の頁の、場面の説明 (#3878)。部品の頁だけが読み、見本帳が最初に読む塊に入れない */
import type { BlockDesc } from "../../gallery";

export const desc: BlockDesc = {
  ja: "1つの図に、分かれる所から先の違う道を場面として3つまで書く。scenesで、場面を縦に並べて同時に送るか、場面の名前の釦で選んだ場面を追うかを選ぶ。stopを書いた段で場面は止まり、理由の文を出す。",
  en: "Up to three scenes in one diagram, each taking its own way from the point where they split. scenes picks whether the scenes are stacked and played together or one scene chosen with its name button is followed. A scene stops at the step with stop and shows the reason.",
};
