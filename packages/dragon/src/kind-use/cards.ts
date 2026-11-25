/** `cards` の図の描く部品を登録簿へ登録する、種類の登録の file (#3846)。読むだけで登録し、検査は使う種類の分だけを読む */
import * as cards from "../kinds/cards";
import { registerKind } from "../kinds/registry";

registerKind("cards", cards);
