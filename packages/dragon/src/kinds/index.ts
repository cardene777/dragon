// packages/dragon/scripts/build-blocks.mjs が置き場の dir から書き出した。手で直さない
import { kind as architectureKind } from "./architecture/kind";
import { kind as chartKind } from "./chart/kind";
import { kind as cycleKind } from "./cycle/kind";
import { kind as erKind } from "./er/kind";
import { kind as flowKind } from "./flow/kind";
import { kind as gitKind } from "./git/kind";
import { kind as lineupKind } from "./lineup/kind";
import { kind as pipeKind } from "./pipe/kind";
import { kind as sequenceKind } from "./sequence/kind";
import { kind as stateKind } from "./state/kind";
import { kind as timeKind } from "./time/kind";
import { kind as treeKind } from "./tree/kind";
import { kind as tryKind } from "./try/kind";

/** 置き場を持つ図の種類の一覧。鍵は置き場の dir の名前 */
export const KIND_FOLDERS = {
  "architecture": architectureKind,
  "chart": chartKind,
  "cycle": cycleKind,
  "er": erKind,
  "flow": flowKind,
  "git": gitKind,
  "lineup": lineupKind,
  "pipe": pipeKind,
  "sequence": sequenceKind,
  "state": stateKind,
  "time": timeKind,
  "tree": treeKind,
  "try": tryKind,
} as const;
