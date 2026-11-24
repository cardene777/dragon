/** `docs/design/base/GRAMMAR.md` の部品と使い方の表の、中身の帯の行 (#3345)。値の字の決まりは #3856 */
import type { BlockRule } from "../../gallery";

export const rule: BlockRule = [
  {
    part: "中身の帯",
    rule: "図の下に 1 本。左に印と題、欄は細い線で区切り、上に欄の名前、下に値。語を並べた地の文の値は日本語の値と同じ字で、コードの印を持つ値、数で始まる値、hash、`v`で始まる版、道、`…`で途中を切った値とbacktickで囲んだ値は等幅の字で描く (#3856)",
    name: "`E.stripBg` と `E.field`",
  },
];
