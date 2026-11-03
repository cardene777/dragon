/** 使い方の頁の「帯」の節の段落 (#3345) */
import type { BlockDocs } from "../../gallery";

export const docs: BlockDocs = {
  section: "strip",
  ja: [
    "帯は図に添える中身の表で、段を追って替わる値を見せる。`strip <題>: <欄>, <欄>` で欄を宣言する。",
    "段の中で `set <欄>: <値>` と書くとその欄に値が入り、`set <欄> [tag: <札>]` と書くとその欄に札が付く。",
    "認可コードや注文の状態のように、やり取りの間に持ち物が替わる様子を、線とは別に追える。",
  ],
  en: [
    "The strip is a table that goes with the diagram and shows values that change step by step. Declare its fields with `strip <title>: <field>, <field>`.",
    "Inside a step, `set <field>: <value>` puts a value in a field, and `set <field> [tag: <tag>]` puts a tag on it.",
    "It lets you follow what is held while messages go back and forth, such as an authorization code or the state of an order, apart from the lines.",
  ],
};
