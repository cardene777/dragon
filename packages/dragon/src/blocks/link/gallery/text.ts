/** 見本帳の一覧の、飛び先の名前と説明 (#3345) */
import type { BlockText } from "../../gallery";

export const text: BlockText = {
  ja: {
    name: "飛び先",
    desc: "箱に書く飛び先。描いた図ではその箱が link になり、押すと中の仕組みを描いた頁などへ移る。/ で始まる path か、http:// か https:// で始まる URL で書く。",
  },
  en: {
    name: "Link",
    desc: "Where a box leads. The box becomes a link in the drawn diagram, for example to the page that draws what is inside it. Write a path that starts with / or a URL that starts with http:// or https://.",
  },
};
