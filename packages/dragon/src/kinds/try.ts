/** 試す図の描く部品 (#3337)。寄って追う窓が段ごとに見る所と、全体図に描く部品も持つ */
export { layoutTry, tryFocusParts, tryOverview } from "./try/layout";
export { drawTry } from "../render/try";
/** 試す図の再生の部品の操作 (#3337)。再生の部品は試す図を描けた後に、登録簿から引いて置く */
export { mountTryControls, type TryControls } from "../try-player";
