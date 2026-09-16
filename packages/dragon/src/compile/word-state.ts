import type { CdlDiagram } from "@cardenelabs/cdl";
/**
 * 書いた語を図の状態へ読み替える表 (#2030 で `compile.ts` から移した)。
 *
 * 道のり図の顔と、四象限の置き場所。 どちらも記法に書く語と描画側の値が 1 対 1 で対応する。
 *
 * **葉に置く** = 図種ごとの組み立て器と、`compile.ts` に残る読み替えの両方が呼ぶ。
 * どちらかの側に置くと、もう片方から逆向きの取り込みが生まれる。
 */

export const 気持ち = new Map<string, "delighted" | "happy" | "neutral" | "frustrated" | "angry">([
  ["最高", "delighted"],
  ["満足", "happy"],
  ["普通", "neutral"],
  ["不満", "frustrated"],
  ["怒り", "angry"],
]);

export const 区画 = new Map<string, "topLeft" | "topRight" | "bottomLeft" | "bottomRight">([
  ["左上", "topLeft"],
  ["右上", "topRight"],
  ["左下", "bottomLeft"],
  ["右下", "bottomRight"],
]);

/**
 * 記法の語で書いた状態を、図の語へ直す (#1201)。
 *
 * 語の欄が `{名前}` を持つとき、その名前が指す状態には記法の語 (「不満」 「左上」) が
 * 入っている。 描画側が知っているのは図の語 (`frustrated` / `topLeft`) なので、ここで直す。
 *
 * **記法の語彙に engine の内部語を混ぜないため**にこの形にしている。 状態にも図の語を
 * 書かせる形なら直す処理は要らないが、記法の語と内部語が同じ file に並ぶことになる。
 *
 * 直すのは語の欄から参照されている名前だけ。 同じ名前を数の欄からも参照している図では
 * 直さない (数として読めなくなるため)。
 *
 * **この「数の欄からも参照している」 分岐は、到達する入力を今は作れない**。 記法の図は
 * 1 つの型しか持たず、語の欄を持つ型 (`journey` / `quadrant`) と数の欄を持つ型
 * (`bar` / `line` / `pie` / `funnel`) は同時に現れないため。 変異試験でもこの行を外して
 * 検査が落ちないことを確かめた = 覆えていない。 見本を重ねる経路で両方の欄を持つ箱が
 * できた時のために残す。
 */
export function 語の状態を図の語へ直す(diagram: CdlDiagram): void {
  const 対象 = new Map<string, Map<string, string>>();
  const 数の欄から = new Set<string>();
  const 拾う = (v: unknown, 語表: Map<string, string>) => {
    const m = typeof v === "string" ? v.match(/^\{(\w+)/) : null;
    if (m) 対象.set(m[1]!, 語表);
  };
  for (const n of diagram.nodes) {
    for (const st of n.journeyData ?? []) 拾う(st.emotion, 気持ち);
    for (const it of n.quadrantData?.items ?? []) 拾う(it.quadrant, 区画);
    for (const d of n.chartData ?? []) {
      const m = typeof d.value === "string" ? d.value.match(/^\{(\w+)/) : null;
      if (m) 数の欄から.add(m[1]!);
    }
    for (const f of n.funnelData ?? []) {
      const m = typeof f.count === "string" ? f.count.match(/^\{(\w+)/) : null;
      if (m) 数の欄から.add(m[1]!);
    }
  }
  if (対象.size === 0) return;

  const 直す = (名前: string, 値: string | number): string | number => {
    const 語表 = 対象.get(名前);
    if (!語表 || 数の欄から.has(名前)) return 値;
    return 語表.get(String(値).trim()) ?? 値;
  };
  for (const s of diagram.states) s.initial = 直す(s.id, s.initial);
  for (const p of diagram.phases) {
    for (const st of p.sets) st.value = 直す(st.stateId, st.value);
  }
}
