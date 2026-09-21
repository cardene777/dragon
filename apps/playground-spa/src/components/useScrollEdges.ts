import { useEffect, useState } from "react";
import { 隠れている端, type 隠れた端 } from "@/lib/scroll-edges";

/**
 * 巻き取る要素の、続きが隠れている端を追う (#2427)。
 *
 * **`useDiagramPanZoom` に足さない**。 あちらが測り直すのは器の大きさか図が替わった時で、
 * 送った時ではない。 送るたびに測る必要があるものを混ぜると、測り直しの条件が 2 つになり、
 * どちらの都合で測っているかが読めなくなる。
 *
 * 測るのは 3 つの数を読むだけ (`隠れている端` が判定を持つ)。 送るたびに走るので、
 * ここで図を走査しない。
 *
 * ## 最初の 1 回も見張りに任せる
 *
 * `ResizeObserver` は見張り始めた時に 1 度呼ぶので、効果の中で測る呼出を書かない。
 * 書くと、描画の中で状態を置くことになり、描き直しが 1 つ余分に連なる。
 *
 * **持たない場所では見張りを置かない** (`useDiagramPanZoom` と同じ形)。 `jsdom` は
 * `ResizeObserver` を持たないので、そのまま呼ぶと画面を組む検査が落ちる。
 * 置かない場合は送った時にだけ測るが、`jsdom` は配置を計算しないので測る先が無い。
 *
 * ## 器が無い時は測った値を返さない
 *
 * 器が `null` の間は前の図の端が残る。 状態を消しにいくのではなく、**返す時に落とす** =
 * 効果の中で状態を置く形を作らずに済む。
 */
export function useScrollEdges(設定: {
  /** 図を入れている器。 描画の前は `null` */
  器: HTMLElement | null;
  /** 器の中で実際に巻き取る要素を探す。 渡さなければ器そのもの */
  巻き取りを探す?: (器: HTMLElement) => HTMLElement | null;
  /** 描く図が替わった時に測り直すための鍵。 図そのものを渡す */
  図の鍵?: unknown;
}): 隠れた端 {
  const { 器, 巻き取りを探す, 図の鍵 } = 設定;
  const [測った端, set測った端] = useState<隠れた端>("無し");

  useEffect(() => {
    if (器 === null) return;
    const 巻き取り = 巻き取りを探す?.(器) ?? 器;
    const 測る = (): void => set測った端(隠れている端(巻き取り));

    巻き取り.addEventListener("scroll", 測る, { passive: true });
    if (typeof ResizeObserver === "undefined") {
      return () => 巻き取り.removeEventListener("scroll", 測る);
    }
    // 図の幅が変わる経路は 2 つある。 器が広がる (画面の幅) と、図が拡がる (倍率)。
    // 前者は巻き取り自身、後者は中身を見ないと捕まえられない
    const 見張り = new ResizeObserver(測る);
    見張り.observe(巻き取り);
    const 中身 = 巻き取り.firstElementChild;
    if (中身 !== null) 見張り.observe(中身);

    return () => {
      巻き取り.removeEventListener("scroll", 測る);
      見張り.disconnect();
    };
  }, [器, 巻き取りを探す, 図の鍵]);

  return 器 === null ? "無し" : 測った端;
}
