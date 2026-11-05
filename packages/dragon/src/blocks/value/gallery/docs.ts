/** 使い方の頁の「配管の図」の節の、ETHの送金の段落 (#3389) */
import type { BlockDocs } from "../../gallery";

export const docs: BlockDocs = {
  section: "pipe",
  ja: [
    "`[value: <量> ETH]` を付けると、呼び出しに ETH を添えて送る。呼んだ者の ETH の槽から呼ばれた者の ETH の槽へ移り、呼び出しが落ちると元へ戻る。",
  ],
  en: [
    "`[value: <amount> ETH]` sends ETH along with the call. It moves from the caller's ETH tank to the callee's ETH tank, and returns if the call is reverted.",
  ],
};
