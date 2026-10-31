/**
 * 全ての種類の部品を読み込みの時に登録する (#3248)。全部入りの入口が読む。
 * 読むだけで登録するので、`package.json` の `sideEffects` に載せて束ねる道具に消させない。
 */
import * as git from "./git";
import * as lineup from "./lineup";
import { registerKind } from "./registry";
import * as state from "./state";
import * as time from "./time";
import * as tree from "./tree";

registerKind("git", git);
registerKind("lineup", lineup);
registerKind("state", state);
registerKind("time", time);
registerKind("tree", tree);
