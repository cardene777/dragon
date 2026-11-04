/**
 * 区画のブロック (#3345)。
 *
 * 最初の `step` より前の `group <名札> as <名前> [note: <添え書き>]` の行で区画を開き、`end` の行で閉じる。その間に書いた `box` の行の箱が区画の中に置かれる。
 * 同じ区画の箱が離れて並ぶ時は、同じ `group <名札>` をもう一度開いて続きを書く。2 度目は名札だけを書き、名前と属性は最初の 1 度だけ書く。
 * 構成図の部品 (`only: architecture`) で、見本帳は構成図にだけ置く。記法は今までどおり時系列図と状態遷移図と時間軸の図にも書け、
 * 枝分かれの図、木の図、列の図では断る (箱を区画の代わりに枝、木、列で並べるため)。
 * 区画の行は書き戻すと箱の行と 1 つの塊に混ざるので、宣言の塊は箱のブロックが書き、このブロックは区画の行の形 (`declareRegion`) を出す。
 * 段を始める時と記法の終わりに開いたままの区画を断るのは、段の始まりを知る parser が行う。
 */
import type { Block } from "../block";

export const GROUP_HEADS = ["group", "end"] as const;

export const block: Block = {
  name: "group",
  rank: 10,
  attach: { how: "place", only: "architecture" },
  words: { heads: GROUP_HEADS, attrs: { group: ["note"] } },
};
