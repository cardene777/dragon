// packages/dragon/scripts/build-blocks.mjs が置き場の dir から書き出した。手で直さない
import { kind as architectureKind } from "./architecture/kind";
import { kind as sequenceKind } from "./sequence/kind";

/** 置き場を持つ図の種類の一覧。鍵は置き場の dir の名前 */
export const KIND_FOLDERS = {
  "architecture": architectureKind,
  "sequence": sequenceKind,
} as const;
