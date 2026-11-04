/** 見本帳の一覧の、機械の列の名前と説明 (#3337、#3348) */
import type { BlockText } from "../../gallery";

export const text: BlockText = {
  ja: {
    name: "機械の列",
    desc: "試す図だけの部品。最初の step より前に chain <名札> [edit: <欄>] と書くと、ブロックの鎖を描く。ブロックは 1 つ前のブロックの hash を prev に持ち、中身が変わると hash が変わってつながりが切れる。edit を書くと、読み手がブロックの中のチップのその欄を書き換えられる。",
  },
  en: {
    name: "Chain",
    desc: "Try diagrams only. Write chain <id> [edit: <field>] before the first step to draw a chain of blocks. Each block holds the previous block's hash as prev, so changing what is inside changes the hash and breaks the link. With edit, the reader can change that field of a chip inside a block.",
  },
};
