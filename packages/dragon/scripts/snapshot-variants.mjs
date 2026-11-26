/**
 * 見本の指紋を書き出す file と描き方の組 (#3345)。指紋を取る script (`snapshot-examples.mjs`) と、記録した指紋と比べる検査が読む。
 *
 * 指紋を取る script は組み上げた全部入りの入口 (`dist/index.js`) を読むので、それを読む検査は、関係する検査を選ぶ命令がどの種類を変えても選ぶ。
 * 記録と比べるだけの検査がこの2つの値を読んでも全ての種類へ結ばれないよう、値だけをこの file に置く (#3977)
 */
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));

/** 見本の指紋を書き出す file */
export const OUT = join(here, "../test/fixtures/examples-svg.json");

/** 描き方の組。既定、暗い地と止め絵と日本語、別の色味 */
export const VARIANTS = {
  default: {},
  "dark-still-ja": { theme: "dark", still: true, lang: "ja" },
  night: { palette: "night" },
};
