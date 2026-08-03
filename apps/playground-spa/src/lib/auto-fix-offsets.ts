/**
 * 位置関係の警告から、 edge label に当てる offset を組み立てる (#382)。
 *
 * `CdlEditor` の `handleAutoFix` と `fixableWarningCount` が同じ判定を 2 箇所に書いていた。
 * どちらも React component の中にあり、 editor を丸ごと描かないと確かめられなかった。
 * 判定だけを外に出して、 入力 (警告の配列) と出力 (edge ごとの offset) で検査できるようにする。
 *
 * **数え方と実際に当たる件数が一致する**。 以前は「対応可能な axis を持つ警告」 を数えていたが、
 * 実際に offset が当たるのは「detail から edge の id を取り出せた警告」 だけで、 取り出せない
 * 警告があると表示と結果がずれた (#382 の課題 3)。 本 module は 1 つの関数から両方を導く。
 */

/** offset を当てられる軸。 これ以外は DSL 側で直す。 */
export const FIXABLE_WARNING_AXES: ReadonlySet<string> = new Set([
  "edge-label-overlap",
  "clearance",
  "edge-label-proximity",
]);

export type PositionWarning = { axis: string; detail: string };

export type EdgeOffset = { offsetY?: number; offsetX?: number };

/**
 * 警告の detail から edge の id を取り出す。 軸によって書き方が 2 通りある。
 *
 * - `edge "e0-user-post" label が path segment から ...` (proximity)
 * - `node:X ↔ edge-label:e0-user-post overlap=...` (overlap / clearance)
 */
export function edgeIdOf(detail: string): string | null {
  return detail.match(/edge "([^"]+)"/)?.[1] ?? detail.match(/edge-label:([^\s↔"]+)/)?.[1] ?? null;
}

/**
 * 警告の配列から、 edge ごとに当てる offset を組み立てる。
 *
 * 補正量は現状すべて固定値か、 detail から取り出した距離の半分。 幾何から最小の移動量を導く形
 * (#382 の課題 2) は spec を決めてから別 issue で扱う。 本 module はその時に差し替える 1 箇所に
 * なる = 現状の値をここに集めておくことが目的。
 */
export function buildAutoFixOffsets(warnings: readonly PositionWarning[]): Map<string, EdgeOffset> {
  const out = new Map<string, EdgeOffset>();
  for (const w of warnings) {
    const step = offsetStepOf(w, out.get(edgeIdOf(w.detail) ?? "")?.offsetY);
    if (!step) continue;
    out.set(step.edgeId, { ...out.get(step.edgeId), offsetY: step.offsetY });
  }
  return out;
}

/**
 * 警告 1 件が実際に当てる offset。 当てる値が決まらなければ `null`。
 *
 * **件数の表示も適用も、 この 1 関数から導く**。 別々に判定していた頃は「N 件対応可」 と出して
 * 0 件しか当たらない食い違いが起きた (#382 の課題 3)。 detail の書式が変わって距離を読み取れ
 * なくなった時も、 ここが `null` を返すので表示と結果がずれない。
 *
 * @param prevY 同じ edge に既に積んである offset (clearance / proximity は積み上げる)
 */
export function offsetStepOf(
  w: PositionWarning,
  prevY: number | undefined,
): { edgeId: string; offsetY: number } | null {
  if (!FIXABLE_WARNING_AXES.has(w.axis)) return null;
  const edgeId = edgeIdOf(w.detail);
  if (!edgeId) return null;
  if (w.axis === "edge-label-overlap") {
    // label が node の中に埋まっている。 上へ逃がす。
    return { edgeId, offsetY: -140 };
  }
  if (w.axis === "clearance") {
    // 隣接が足りない。 更に離す。
    return { edgeId, offsetY: (prevY ?? -40) - 40 };
  }
  // label が線から離れすぎている。 detail の距離の半分だけ線へ寄せる。
  const dist = Number(w.detail.match(/(\d+)px 離れている/)?.[1] ?? 0);
  if (dist <= 0) return null; // 寄せる向きが決まらない
  return { edgeId, offsetY: (prevY ?? 0) + Math.floor(dist / 2) };
}

export function countFixableWarnings(warnings: readonly PositionWarning[]): number {
  // 積み上げの有無で「当たるか」 は変わらないので、 前の値は渡さずに数える。
  return warnings.filter((w) => offsetStepOf(w, undefined) !== null).length;
}
