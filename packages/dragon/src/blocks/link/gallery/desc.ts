/** 見本帳の部品の頁の、飛び先の説明 (#3345、#3531)。部品の頁だけが読み、見本帳が最初に読む塊に入れない */
import type { BlockDesc } from "../../gallery";

export const desc: BlockDesc = {
  ja: "箱に書く飛び先。描いた図ではその箱が link になり、押すと中の仕組みを描いた頁などへ移る。/ で始まる path か、http:// か https:// で始まる URL で書く。",
  en: "Where a box leads. The box becomes a link in the drawn diagram, for example to the page that draws what is inside it. Write a path that starts with / or a URL that starts with http:// or https://.",
};
