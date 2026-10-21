// 色の値を求める script が使う、色の見分けと濃さの比を測る道具 (validate_palette.js) を読み込む。
// 道具は repo の外にあるので、置き場を環境変数 DATAVIZ_VALIDATOR で渡す。
// DATAVIZ_VALIDATOR=<validate_palette.js の path> node check-palettes.mjs
import { pathToFileURL } from "node:url";

export const VALIDATOR = process.env.DATAVIZ_VALIDATOR;
if (!VALIDATOR) {
  console.error("DATAVIZ_VALIDATOR に validate_palette.js の path を入れて実行する");
  process.exit(2);
}
export const { contrast, validate } = await import(pathToFileURL(VALIDATOR).href);
