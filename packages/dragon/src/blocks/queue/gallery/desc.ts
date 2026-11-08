/** 見本帳の部品の頁の、待ち行列の説明 (#3337、#3348、#3453、#3531)。部品の頁だけが読み、見本帳が最初に読む塊に入れない */
import type { BlockDesc } from "../../gallery";

export const desc: BlockDesc = {
  ja: "試す図だけの部品。最初の step より前に queue <名札> [order: <欄>, accept: <名前>] と書くと、チップが待つ行列を描く。order を書くとその欄の値の高い順に上から並べ、書かなければ入った順に並べる。accept を書くと、入力の帯はその名前のチップだけを送れ、ほかの名前では送る釦を押せない。名前を 2 つ以上書く時は accept: \"<名前>, <名前>\" と囲む。段の中の line <待ち行列>: <チップ>, <チップ> で中身を書く。",
  en: "Try diagrams only. Write queue <id> [order: <field>, accept: <name>] before the first step to draw a line where chips wait. With order, chips sort from the highest value of that field at the top; without it, they keep the order they came in. With accept, the input strip sends only chips with those names, and the send button cannot be pressed for any other name. Wrap two or more names as accept: \"<name>, <name>\". line <queue>: <chip>, <chip> in a step writes its contents.",
};
