/** 使い方の頁の「区画」の節の段落 (#3345) と、構成図の絵柄と名前の書き方の段落 (#3633) */
import type { BlockDocs } from "../../gallery";

export const docs: BlockDocs = {
  section: "regions",
  ja: [
    "構成図では、箱を区画に分けて置ける。区画は `group <名札> as <名前> [note: <添え書き>]` の行で開いて `end` の行で閉じ、その間に書いた `box` の行の箱が区画の中に置かれる。",
    "区画も `color:` と `icon:` を持てる。仕組みの持ち主や置き場所の境目 (チェーンと網、店と倉庫) を見せる時に使う。",
    "同じ区画の箱が離れて並ぶ時は、同じ `group <名札>` をもう一度開いて続きの箱を書く。2 度目は名札だけを書き、名前と札は最初の 1 度だけ書く。",
    "クラウドの事業者のアイコンで描く時は、配る元の最新のアイコンと名前を使う。色付きのアイコンは、手元の SVG を `dragon icon <file.svg>` で印のブロックの定義に変えると、図の頭に書いて元の色のまま箱に置ける。箱の名前は初出で略さず、略した名前は 2 度目から使う。",
  ],
  en: [
    "In an architecture diagram, boxes can be placed in regions. Open a region with a `group <id> as <name> [note: <note>]` line and close it with an `end` line, and the boxes on the `box` lines in between go inside it.",
    "Regions can also take `color:` and `icon:`. Use them to show where ownership or placement changes, such as between chains and a network, or a shop and a warehouse.",
    "When boxes of the same region are not next to each other, open the same `group <id>` again and write the rest of its boxes. The second time, write only the id, and give the name and attributes only the first time.",
    "When you draw with a cloud provider's icons, use the latest icons and names from the provider. Turn a colored icon you have into a block definition with `dragon icon <file.svg>`, write it at the head of the diagram, and the box shows the icon in its own colors. Do not abbreviate a box name the first time it appears; use the short name only after that.",
  ],
};
