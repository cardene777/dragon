/** `sequence` の図の並べ方を登録簿へ登録する、種類の登録の file (#3763)。既定の入口と軽い入口は読み込みの時に読み、検査は使う時だけ読む */
import { registerEagerLayout } from "../kinds/registry";
import { layoutSequence } from "../kinds/sequence/layout";

registerEagerLayout("sequence", layoutSequence);
