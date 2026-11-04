/** 見本帳の一覧の、釦の名前と説明 (#3337、#3348) */
import type { BlockText } from "../../gallery";

export const text: BlockText = {
  ja: {
    name: "釦",
    desc: "試す図だけの部品。最初の step より前に press <名札> [from: <待ち行列>, into: <機械の列>, take: <件数>] と書くと、押せる釦が出る。押すと待ち行列の上から take 件を機械の列の新しいブロックへ移す。at に部品を書くとその部品の所に置き、書かなければ入力の帯に置く。段の中の press <名札> は書き手の例として押す。",
  },
  en: {
    name: "Button",
    desc: "Try diagrams only. Write press <id> [from: <queue>, into: <chain>, take: <count>] before the first step and a button appears. Pressing it moves the top take chips of the queue into a new block of the chain. With at it sits on that part, and without it in the input strip. press <id> in a step presses it as the author's example.",
  },
};
