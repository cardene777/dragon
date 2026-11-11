/** 使い方の頁の「表どうしの関係の図」の節の、表と項目と段の中の行の段落 (#3618) */
import type { BlockDocs } from "../../gallery";

export const docs: BlockDocs = {
  section: "er",
  ja: [
    "表は最初の `step` の行より前に `table <名札> as <名前>` の行で宣言し、次の `table` の行までの `field <名前>: <値>` の行がその表の項目になる。表は 1 つから 6 つまで書け、書いた順に左から右へ横 1 列に並ぶ。`as <名前>` を省くと名札がそのまま名前になり、`[color: <色>]` で表の色を決める。",
    "項目の `[key]` は鍵の印 (PK) で、`field <名前>: <値> [ref: <表>.<項目>]` は別の表の項目への結び (FK) になる。結びを書いた項目が何件もの側で線の端に三つ叉を置き、指した項目が 1 件の側で縦の棒を置く。前に書いた表も後ろに書いた表も指せ、無い表か無い項目を指すと誤りで止まる。2 つを並べる時は `[key, ref: <表>.<項目>]` と書く。",
    "段の中の `pick <表>.<項目>` はその段で行の地と表の枠を光らせ、表の枠は後の段でも細く色を残す。`<表>.<項目> -> <表>.<項目> [tag: <値>]` は結んだ項目どうしの線に沿って値の札を走らせ、札は線の真ん中で止まる。結んでいない項目どうしの線と、`: <名前>` を付けた線は誤りで止まる。",
    "`set <表>.<項目>: <値>` はその段から項目の値を書き換え、書き換えた値を表の色で出す。`note <表>.<項目>: <文>` はその段から表の真下に式の札を出し、後の段も残す。同じ表の札は書いた順に下へ積む。段の番号は、その段で行を選んだ表の見出しの右に出す。",
  ],
  en: [
    "Declare a table with a `table <id> as <name>` line before the first `step` line; the `field <name>: <value>` lines up to the next `table` line become its fields. A diagram takes 1 to 6 tables, and they sit left to right in one row in the order written. Without `as <name>` the id is the name, and `[color: <color>]` sets the table color.",
    "`[key]` on a field is the key mark (PK), and `field <name>: <value> [ref: <table>.<field>]` links it to a field of another table (FK). The field that holds the link is the many side and gets a three-pronged end; the field it points at is the one side and gets a bar end. A link may point at a table written before or after, and a link to a missing table or field is refused. To write both, use `[key, ref: <table>.<field>]`.",
    "`pick <table>.<field>` in a step lights the row and the table frame in that step, and the frame keeps a thin color in later steps. `<table>.<field> -> <table>.<field> [tag: <value>]` runs a value chip along the line between linked fields, and the chip stops halfway. A line between fields that are not linked, or one with a `: <name>`, is refused.",
    "`set <table>.<field>: <value>` rewrites the value of a field from that step on and shows the new value in the table color. `note <table>.<field>: <text>` shows a formula card right under the table from that step on, and it stays in later steps. Cards on the same table stack downward in the order written. A step's number sits at the right of the header of the table that step picks a row from.",
  ],
};
