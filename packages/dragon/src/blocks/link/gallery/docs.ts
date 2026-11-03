/** 使い方の頁の「箱」の節の、飛び先の段落 (#3345) */
import type { BlockDocs } from "../../gallery";

export const docs: BlockDocs = {
  section: "boxes",
  ja: [
    "`link: <飛び先>` を足すと、描いた図でその箱が飛び先への link になり、箱の中の仕組みを描いた別の図の頁などへ移れる。飛び先は `/` で始まる path か、`http://` か `https://` で始まる URL で書く。",
  ],
  en: [
    "Add `link: <target>` and the box becomes a link to that target in the drawn diagram, for example to the page of another diagram that draws what is inside the box. Write the target as a path that starts with `/` or a URL that starts with `http://` or `https://`.",
  ],
};
