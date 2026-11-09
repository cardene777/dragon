/**
 * 全ての種類の部品と、全てのブロックの読み方を読み込みの時に登録する (#3248、#3349)。全部入りの入口が読む。
 * 読むだけで登録するので、`package.json` の `sideEffects` に載せて束ねる道具に消させない。
 */
import { registerReading } from "../blocks/reading";
import { READINGS } from "../blocks/readings";
import * as chart from "./chart";
import * as git from "./git";
import * as lineup from "./lineup";
import * as pipe from "./pipe";
import { registerKind } from "./registry";
import { registerValidator } from "../schema";
import { VALIDATOR } from "../schemas/validator";
import { registerUserBlockReader } from "../user-blocks";
import { USER_BLOCK_READER } from "../user-blocks-read";
import * as state from "./state";
import * as time from "./time";
import * as tree from "./tree";
import * as tryKind from "./try";

registerKind("chart", chart);
registerKind("git", git);
registerKind("lineup", lineup);
registerKind("pipe", pipe);
registerKind("state", state);
registerKind("time", time);
registerKind("tree", tree);
registerKind("try", tryKind);

for (const [name, reading] of Object.entries(READINGS)) registerReading(name, reading);

// 使う人が足すブロックの定義を読む処理 (#3399)。軽い入口は定義の行を持つ図の時だけ後から読む
registerUserBlockReader(USER_BLOCK_READER);

// 原本の形の検査 (#3400)。軽い入口は原本の JSON を読む前にだけ後から読む
registerValidator(VALIDATOR);
