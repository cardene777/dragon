/**
 * 全ての種類に共通の登録 (#3763)。全てのブロックの読み方と、足すブロックの定義を読む処理と、原本の形の検査を読み込みの時に登録する。
 * 全部入りの入口 (`all.ts`) と種類を登録しない入口 (`core.ts`) が読む。読むだけで登録するので、`package.json` の `sideEffects` に載せる
 */
import { registerReading } from "../blocks/reading";
import { READINGS } from "../blocks/readings";
import { registerValidator } from "../schema";
import { VALIDATOR } from "../schemas/validator";
import { registerUserBlockReader } from "../user-blocks";
import { USER_BLOCK_READER } from "../user-blocks-read";

for (const [name, reading] of Object.entries(READINGS)) registerReading(name, reading);

// 使う人が足すブロックの定義を読む処理 (#3399)。軽い入口は定義の行を持つ図の時だけ後から読む
registerUserBlockReader(USER_BLOCK_READER);

// 原本の形の検査 (#3400)。軽い入口は原本の JSON を読む前にだけ後から読む
registerValidator(VALIDATOR);
