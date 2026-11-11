/** 見本帳の部品の頁の、表の説明 (#3618)。部品の頁だけが読み、見本帳が最初に読む塊に入れない */
import type { BlockDesc } from "../../gallery";

export const desc: BlockDesc = {
  ja: "表どうしの関係の図だけの部品。最初の step より前に table <名札> as <名前> と書くと表を宣言し、その下の field <名前>: <値> [key, ref: <表>.<項目>] の行が表の項目になる。表は書いた順に左から右へ並び、ref で結んだ項目どうしを線で繋ぐ。段の中の pick で行を光らせ、set で値を書き換え、note で式の札を添える。表は 1 つから 6 つまで書く。",
  en: "Table relation diagrams only. Write table <id> as <name> before the first step to declare a table, and the field <name>: <value> [key, ref: <table>.<field>] lines under it become its fields. Tables sit left to right in the order written, and a line joins the fields linked with ref. In a step, pick lights a row, set rewrites a value and note adds a formula card. A diagram takes 1 to 6 tables.",
};
