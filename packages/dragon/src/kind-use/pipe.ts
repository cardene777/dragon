/** `pipe` の図の描く部品を登録簿へ登録する、種類の登録の file (#3763)。読むだけで登録し、検査は使う種類の分だけを読む */
import * as pipe from "../kinds/pipe";
import { registerKind } from "../kinds/registry";

registerKind("pipe", pipe);
