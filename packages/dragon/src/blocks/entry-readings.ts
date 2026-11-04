// packages/dragon/scripts/build-blocks.mjs が置き場の dir から書き出した。手で直さない
import type { BlockReading } from "./block";
import { reading as actReading } from "./act/read";
import { reading as boxReading } from "./box/read";
import { reading as carryReading } from "./carry/read";
import { reading as colorReading } from "./color/read";
import { reading as edgeReading } from "./edge/read";
import { reading as edgeLabelReading } from "./edge-label/read";
import { reading as groupReading } from "./group/read";
import { reading as iconReading } from "./icon/read";
import { reading as lifelineReading } from "./lifeline/read";
import { reading as linkReading } from "./link/read";
import { reading as noteReading } from "./note/read";
import { reading as sourceReading } from "./source/read";
import { reading as stepReading } from "./step/read";
import { reading as stripReading } from "./strip/read";

/** 入口が初めから持つ読み方。コアブロックと、後から読まない図の種類の個別ブロック。鍵は置き場の dir の名前 (#3349) */
export const ENTRY_READINGS: Readonly<Record<string, BlockReading>> = {
  "act": actReading,
  "box": boxReading,
  "carry": carryReading,
  "color": colorReading,
  "edge": edgeReading,
  "edge-label": edgeLabelReading,
  "group": groupReading,
  "icon": iconReading,
  "lifeline": lifelineReading,
  "link": linkReading,
  "note": noteReading,
  "source": sourceReading,
  "step": stepReading,
  "strip": stripReading,
};
