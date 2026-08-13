/**
 * 舞台に重ねる局面の表示 (#1143)。
 *
 * 設計 (`docs/design/app.pen` の `04 エディタ`) は 3 つを描いているが、 実装は 1 つも持って
 * いなかった。 いまの画面からは「図がどの局面を見せているのか」 「あと何段あるのか」
 * 「どの速さで回っているのか」 が一切分からない。
 *
 * | 出すもの | 位置 |
 * |---|---|
 * | 局面の札 | 左上 |
 * | 進み具合のバー | 下端 |
 * | 動きの説明 | 下端の左 |
 *
 * ## なぜ engine の表示を使わないか
 *
 * cdl は `CdlHeader` と mini indicator を持つが、 **どちらも図と同じ入れ物の中に描かれる**。
 * 舞台は掴んで動かす / 拡大縮小するため、 中に置くと札まで一緒に動いて画面の外へ出る。
 *
 * ## `ease-out` を書かない
 *
 * 設計は `600ms · ease-out · loop` と書いているが、 easing は cdl の内部既定 (`easeOutQuint`)
 * で、 書いた人が決められず API にも出ていない。 ここに文字で写すと cdl が変えた時に黙って
 * 古くなるので、 局面の長さと繰り返しの有無だけを出す。
 */
import { useEffect, useState, type JSX } from "react";
import type { LaidDiagram } from "@cardenelabs/cdl";

/** 局面が 1 つ以下の図では何も出さない。 進み具合を示す先が無い。 */
const 出す下限 = 2;

/**
 * いま何番目の局面かを engine から読む。
 *
 * engine は図の入れ物に `data-cdl-phase-index` を付け、 局面が進むたびに書き換える。
 * React の外で変わるので、 属性の変化を見張る。
 */
function usePhaseIndex(stage: HTMLElement | null): number {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    if (stage === null) return;

    const 読む = (): void => {
      const el = stage.querySelector("[data-cdl-diagram]");
      const v = Number(el?.getAttribute("data-cdl-phase-index") ?? "0");
      // 属性が読めない形 (図がまだ無い / 数でない) では 0 に倒す。 NaN のまま持つと
      // 「N 番目」 の表示と配列の参照が両方壊れる
      setIdx(Number.isFinite(v) && v >= 0 ? v : 0);
    };

    読む();
    // 図そのものが差し替わる (記法を書き換えた) 場合も拾うため、 舞台ごと見張る
    const mo = new MutationObserver(読む);
    mo.observe(stage, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ["data-cdl-phase-index"],
    });
    return () => mo.disconnect();
  }, [stage]);

  return idx;
}

export function EditorPhaseChrome({
  stage,
  laid,
}: {
  /** 舞台の要素。 ここを起点に engine の属性を読む */
  stage: HTMLElement | null;
  laid: LaidDiagram | null;
}): JSX.Element | null {
  const phases = laid?.phases ?? [];
  const idx = usePhaseIndex(stage);

  if (phases.length < 出す下限) return null;

  // 属性が配列より先に更新される瞬間がある (図を差し替えた直後)。 範囲外を読むと
  // 題名と長さが `undefined` になるので、 最後の局面に丸める
  const 今 = Math.min(idx, phases.length - 1);
  const 局面 = phases[今];

  return (
    // 掴む操作を邪魔しない。 舞台はここを掴んで動かすので、 重ねたものは受け取らない
    <div className="v4-editor-phase" aria-hidden="true">
      <div className="v4-editor-phase-chip">
        <span className="v4-editor-phase-dot" />
        <span>
          局面 {今 + 1} / {phases.length}
        </span>
        {局面.title !== "" && <span className="v4-editor-phase-title">· {局面.title}</span>}
      </div>
      <div className="v4-editor-phase-foot">
        <div className="v4-editor-phase-bar">
          {phases.map((p, i) => (
            <span
              key={p.id}
              className={`v4-editor-phase-seg ${i <= 今 ? "is-done" : ""}`}
            />
          ))}
        </div>
        <div className="v4-editor-phase-meta">
          {Math.round(局面.duration)}ms · 繰り返し
        </div>
      </div>
    </div>
  );
}
