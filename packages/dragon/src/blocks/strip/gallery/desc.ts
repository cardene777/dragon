/** 見本帳の部品の頁の、中身の帯の説明 (#3345、#3531)。部品の頁だけが読み、見本帳が最初に読む塊に入れない */
import type { BlockDesc } from "../../gallery";

export const desc: BlockDesc = {
  ja: "図の下に置く中身の帯。段ごとに欄の値を入れ替え、運ばれる物の中身を追う。",
  en: "A strip of fields under the diagram. Each step can rewrite a field to follow what is carried.",
};
