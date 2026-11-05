/**
 * ETH の送金の描き方 (#3389)。
 *
 * 呼び出しに添えた ETH は、呼び出しの管の字の札に `+<量> ETH` を足して出し、呼んだ者の ETH の槽から呼ばれた者の ETH の槽へ、
 * ETH の管を流れた分として描く。流れた分は槽の描き方 (`hold/draw.ts` の `flow`) が描き、ETH の管は弁を持たない。
 * この file は ETH の流れた分の色の役を持ち、配管の図を描く部品 (`render/pipe.ts`) が読む
 */
import type { ColorKey } from "../../look/values";

/** ETH の管の名前の札の色の役。トークンの管と同じ水の色で描く */
export const ETH_COLOR: ColorKey = "amber";
