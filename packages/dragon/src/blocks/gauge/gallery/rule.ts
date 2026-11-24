/** `docs/design/base/GRAMMAR.md` の部品と使い方の表の、量の目盛りの行 (#3880) */
import type { BlockRule } from "../../gallery";

export const rule: BlockRule = [
  {
    part: "量の目盛り",
    rule: "`on` の箱のすぐ下か、`on` を書かない時は図の上の帯に、宣言した順に縦に積む。上に名前と「値 / 上限 単位」、下に横の棒と、値が変わった段の増えた量の札。上限を超えた段は上限の位置の点線から超えた分を赤で伸ばし、値の字を赤にして、棒の下に赤い札を出す。上限の無い目盛りは値と単位だけ (#3880)",
    name: "`LOOK.gauge` と `TYPE.gaugeName`、`TYPE.gaugeValue`、`TYPE.gaugeTag`",
  },
];
