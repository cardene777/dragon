/**
 * 宣言と段を省いた短い記法の決まり (#3438)。読む処理 (`parser.ts`) と書き戻す処理 (`printer.ts`) が、同じ決まりで段の題と本文を導く。
 *
 * 省き方を読む図の種類は、種類の定義 (`kinds/<種類>/kind.ts`) の `short` が名乗る。
 * 本文 (`say`) を書かない段の本文は、段の線ごとに 1 行で、線の名前を書く。名前の無い線は、送る側と受ける側の箱の名前を「→」で結ぶ。
 * 段を書かない図は線 1 本を 1 段にし、段の題と本文を同じ字にする。
 */
import type { DiagramEvent } from "./schema";

/** 名札から箱の名前を引く。箱でない端 (状態遷移図の始まりと終わりの印) は名札のまま返す */
export type NameOf = (id: string) => string;

/** 線から導く本文の 1 行。線の名前か、名前の無い線は送る側と受ける側の箱の名前を「→」で結んだ字 */
export function lineText(edge: { from: string; to: string; label?: string }, nameOf: NameOf): string {
  return edge.label ?? `${nameOf(edge.from)} → ${nameOf(edge.to)}`;
}

/** 本文を書かない段の本文の行。段の線ごとに 1 行。線を持たない段は `undefined` (本文が無い段の誤りになる) */
export function derivedBody(events: readonly DiagramEvent[], nameOf: NameOf): string[] | undefined {
  const lines = events.flatMap((event) => (event.type === "edge" ? [lineText(event, nameOf)] : []));
  return lines.length > 0 ? lines : undefined;
}
