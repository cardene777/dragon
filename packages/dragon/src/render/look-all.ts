/**
 * パイプ図の部品で描く時系列図の見た目 (#3720) の組を読み込みの時に置く。全部を持つ入口と、頁の再生の script と、書き出しが読む。
 * 軽い入口は読まず、`loadLook("pipe")` か `loadFor` を待った時に後から置く。
 * 構成図の寄って追う窓の線の端の箱と名前の札 (#3871) も、同じ入口のために読み込みの時に置く
 */
import { ARCHITECTURE_ENDS } from "./architecture-ends";
import { registerArchitectureEnds } from "./follow-ends-store";
import { registerSequenceLook } from "./look-store";
import { SEQUENCE_PIPE } from "./sequence";

registerSequenceLook(SEQUENCE_PIPE);
registerArchitectureEnds(ARCHITECTURE_ENDS);
