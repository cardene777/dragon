/** 見本帳の部品の頁の、判断の説明 (#3561)。部品の頁だけが読み、見本帳が最初に読む塊に入れない */
import type { BlockDesc } from "../../gallery";

export const desc: BlockDesc = {
  ja: "手順の図だけの部品。最初の step より前に choice <名札> as <問い> と書くと、問いを入れたひし形の判断を宣言する。判断から出る線は名前 (はいやいいえ) を持つ 2 本までで、段で通る線は下へ、最初の step より前に書いた線は点線の今回は通らない道として判断の右へ出る。",
  en: "Flow diagrams only. Write choice <id> as <question> before the first step to declare a diamond that holds the question. A choice leads to at most two places, and each line that leaves it carries a name such as yes or no. The line taken in a step goes down, and a line written before the first step leaves the diamond to the right as a dotted path not taken.",
};
