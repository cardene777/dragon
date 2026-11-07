/** 配管の図の描く部品 (#3389)。並べ方と畳み方は図の種類の置き場 (`kinds/pipe/layout.ts`) が持つ */
export { foldPipe, layoutPipe } from "./pipe/layout";
export { drawPipe } from "../render/pipe";
/** 配管の図の再生の部品の、図の下の段の矢印と呼び出しの記録 (#3418、#3450)。再生の部品は配管の図を描けた後に、登録簿から引いて置く */
export { mountPipeCalls, type PipeCalls } from "../pipe-player";
