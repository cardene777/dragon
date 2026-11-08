/** 見本帳の部品の頁の、釦の説明 (#3337、#3348、#3453、#3531)。部品の頁だけが読み、見本帳が最初に読む塊に入れない */
import type { BlockDesc } from "../../gallery";

export const desc: BlockDesc = {
  ja: "試す図だけの部品。最初の step より前に press <名札> [from: <待ち行列>, into: <機械の列>, take: <件数>] と書くと、押せる釦が出る。押すと待ち行列の上から take 件を機械の列の新しいブロックへ移す。from: \"<待ち行列>, <待ち行列>\" と 2 つ以上の待ち行列を書くと、書いた順にそれぞれの上から take 件ずつを 1 つにまとめ、どれかが take 件に満たない間は押せない。at に部品を書くとその部品の所に置き、書かなければ入力の帯に置く。段の中の press <名札> は書き手の例として押す。",
  en: "Try diagrams only. Write press <id> [from: <queue>, into: <chain>, take: <count>] before the first step and a button appears. Pressing it moves the top take chips of the queue into a new block of the chain. With from: \"<queue>, <queue>\" naming two or more queues, it gathers the top take chips of each, in the written order, into one, and cannot be pressed while any of them holds fewer than take. With at it sits on that part, and without it in the input strip. press <id> in a step presses it as the author's example.",
};
