/**
 * 全ての種類の部品と、全てのブロックの読み方を読み込みの時に登録する (#3248、#3349)。全部入りの入口が読む。
 * 読むだけで登録するので、`package.json` の `sideEffects` に載せて束ねる道具に消させない。
 */
import { registerReading } from "../blocks/reading";
import { READINGS } from "../blocks/readings";
import * as git from "./git";
import * as lineup from "./lineup";
import { registerKind } from "./registry";
import * as state from "./state";
import * as time from "./time";
import * as tree from "./tree";
import * as tryKind from "./try";

registerKind("git", git);
registerKind("lineup", lineup);
registerKind("state", state);
registerKind("time", time);
registerKind("tree", tree);
registerKind("try", tryKind);

for (const [name, reading] of Object.entries(READINGS)) registerReading(name, reading);
