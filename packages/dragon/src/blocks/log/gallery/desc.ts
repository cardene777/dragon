/** 見本帳の部品の頁の、記録の列の説明 (#3441、#3531)。部品の頁だけが読み、見本帳が最初に読む塊に入れない */
import type { BlockDesc } from "../../gallery";

export const desc: BlockDesc = {
  ja: "試す図だけの部品。最初の step より前に log <名札> [all: <欄> = <値>, yes: <印>, no: <印>] と書き、釦の into に名札を書くと、釦は待ち行列の上から take 件を番号の付いた 1 つの記録にまとめる。記録は番号と中のチップの名前と欄の値だけを持ち、機械の列と違って prev と hash を持たない。all を書くと、記録の中のチップのその欄が全てその値なら yes の印、1 つでも違えば no の印を出す。",
  en: "Try diagrams only. Write log <id> [all: <field> = <value>, yes: <mark>, no: <mark>] before the first step and name it in a button's into, and the button gathers the top take chips of its queue into one numbered record. A record holds only its number and the names and field values of its chips, with no prev or hash unlike a chain. With all, a record shows the yes mark when that field of every chip in it has the value, and the no mark when even one differs.",
};
