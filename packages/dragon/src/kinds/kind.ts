/**
 * 図の種類の定義の型 (#3342、#3345)。
 *
 * 図の種類ごとに `kinds/<種類>/` の置き場を1つ持ち、並べ方 (`layout.ts`) と、受け付ける付け方の定義 (`kind.ts`) だけを置く。
 * 図の種類はブロックを描かず、付け方の合うブロックを並べる。描くのはブロックの描き方 (`blocks/<名前>/draw.ts`) と描く所 (`render/draw.ts`)。
 * 一覧 (`kinds/index.ts` の `KIND_FOLDERS`) は `scripts/build-blocks.mjs` が置き場の dir から書き出す。
 */
import type { AttachHow, KindName } from "../blocks/block";
import type { Layout } from "../layout/scene";
import type { Diagram } from "../schema";
import type { NotationLang } from "../words";

export interface Kind {
  /** 置き場の dir の名前。最初の行の頭の語と同じ */
  name: KindName;
  /** 受け付ける付け方 */
  accepts: readonly AttachHow[];
  /** 並べ方。`lang` は並べ方が出す字 (断りの文など) の言葉 */
  layout: (diagram: Diagram, lang: NotationLang) => Layout;
}
