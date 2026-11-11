/** 見本帳の部品の頁の、集まりの円の説明 (#3620)。部品の頁だけが読み、見本帳が最初に読む塊に入れない */
import type { BlockDesc } from "../../gallery";

export const desc: BlockDesc = {
  ja: "集合の重なりの図だけの部品。最初の step より前に item <名札> as <名前> [color: <色>] と書くと集まりを宣言し、段の中の set <名札>: <数> で円が現れる。set <名札> & <名札>: <数> は重なりの数で、その段で重なりの区画が光る。set none: <数> はどれにも入らない数で、円の外の枠に出る。集まりは 2 つか 3 つ書ける。",
  en: "Set overlap diagrams only. Write item <id> as <name> [color: <color>] before the first step to declare a set, and set <id>: <count> in a step makes its circle appear. set <id> & <id>: <count> is the count of an overlap, and that region lights up in that step. set none: <count> is the count in no set, shown in the frame outside the circles. A diagram takes 2 or 3 sets.",
};
