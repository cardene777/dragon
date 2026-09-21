import { useEffect, useState } from "react";
import { 隠れている端, type 隠れた端 } from "@/lib/scroll-edges";

/**
 * 掴んで動かす台の、続きが隠れている端を追う (#2433)。
 *
 * 判定は `隠れている端` (#2427) をそのまま使う。 違うのは **どこから 3 つの数を取るか**。
 *
 * ## 巻き取る台と、動かす台
 *
 * `useScrollEdges` は巻き取る要素の `scrollLeft` / `scrollWidth` / `clientWidth` を読む。
 * 編集画面の台は `overflow: hidden` で、中身を `transform` で動かすため **送りが発生しない**
 * = `scrollLeft` は常に 0 で、`scroll` も飛ばない。 そちらの仕掛けは使えない。
 *
 * ここは台と動く中身の、**画面上の矩形** を読む。 倍率も図の左の余白も掛かった後の値なので、
 * 読む人が実際に見ている位置と同じものを測る。
 *
 * | | `useScrollEdges` | この仕掛け |
 * |---|---|---|
 * | 送り | `scrollLeft` | 台の左辺 - 中身の左辺 |
 * | 中身の幅 | `scrollWidth` | 中身の矩形の幅 |
 * | 枠の幅 | `clientWidth` | 台の矩形の幅 |
 *
 * ## 測る合図も見張りに任せる
 *
 * `useScrollEdges` と同じく、効果の中に測る呼出を書かない。 書くと描画の中で状態を置く形になり、
 * 描き直しが 1 つ余分に連なる。 `ResizeObserver` は見張り始めた時に 1 度呼ぶので、
 * **見張りを置き直すこと自体が測り直しの合図** になる。
 *
 * だから `位置の鍵` を依存に持つ。 動かしても中身の大きさは変わらない
 * (`ResizeObserver` が報じるのは `transform` を掛ける前の大きさ) ため、
 * 見張りを置きっぱなしにすると動かした時に 1 度も測り直さない。
 *
 * **見張りを持たない場所では置かない** (`useScrollEdges` と同じ形)。 `jsdom` は
 * `ResizeObserver` を持たず、配置も計算しないので測る先が無い。
 */
export function usePanEdges(設定: {
  /** 図を入れている台。 描画の前は `null` */
  台: HTMLElement | null;
  /** 台の中で実際に動く要素を探す */
  動く中身を探す: (台: HTMLElement) => HTMLElement | null;
  /** 動かすたびに測り直すための鍵。 位置と倍率を持つ値を渡す */
  位置の鍵?: unknown;
}): 隠れた端 {
  const { 台, 動く中身を探す, 位置の鍵 } = 設定;
  const [測った端, set測った端] = useState<隠れた端>("無し");

  useEffect(() => {
    if (台 === null || typeof ResizeObserver === "undefined") return;
    const 測る = (): void => {
      // 中身は描き直しで入れ替わるので、測るたびに探す
      const 中身 = 動く中身を探す(台);
      if (中身 === null) {
        set測った端("無し");
        return;
      }
      const 枠 = 台.getBoundingClientRect();
      const 絵 = 中身.getBoundingClientRect();
      set測った端(
        隠れている端({
          scrollLeft: 枠.left - 絵.left,
          scrollWidth: 絵.width,
          clientWidth: 枠.width,
        }),
      );
    };

    const 見張り = new ResizeObserver(測る);
    見張り.observe(台);
    return () => 見張り.disconnect();
  }, [台, 動く中身を探す, 位置の鍵]);

  return 台 === null ? "無し" : 測った端;
}
