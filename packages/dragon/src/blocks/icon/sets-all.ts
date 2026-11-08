/**
 * 全ての絵柄集の形の表を読み込みの時に登録する (#3493)。既定の入口と、書き出しの命令が描く部品の入口が読む。
 * 読むだけで登録するので、`package.json` の `sideEffects` に載せて束ねる道具に消させない。
 * 書き出した頁の script と `dragon embed` の script は読まない。頁は図が使った絵柄だけを収めて登録する (`page-icons.ts`)
 */
import { registerTabler } from "./sets";
import tabler from "./tabler.js";

registerTabler(tabler);
