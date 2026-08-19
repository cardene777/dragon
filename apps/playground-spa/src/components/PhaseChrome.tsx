/**
 * 図に重ねる局面の表示 (#1143 でエディタに作り、#1239 で画面をまたげる形へ出した)。
 *
 * 設計 (`docs/design/app.pen`) は図を見せる画面すべてに 2 つを描いている。
 *
 * | 出すもの | 中身 |
 * |---|---|
 * | 局面の札 | いま何段目 / 全体で何段 / その段の題 |
 * | 進み具合の帯 | 段の数だけ区切り、過ぎた段を塗る |
 *
 * ## なぜ engine の表示を使わないか
 *
 * cdl は `CdlHeader` と小さい指標を持つが、**どちらも図と同じ入れ物の中に描かれる**。
 * エディタの舞台は掴んで動かす / 拡大縮小するため、中に置くと札まで一緒に動いて画面の外へ出る。
 * 加えて engine の指標は左下に段の題を出すだけで、設計が描く札と帯の形にならない。
 *
 * ## `ease-out` を書かない
 *
 * 設計は `600ms · ease-out · loop` と書いているが、easing は cdl の内部既定 (`easeOutQuint`)
 * で、書いた人が決められず API にも出ていない。ここに文字で写すと cdl が変えた時に黙って
 * 古くなるので、段の長さと繰り返しの有無だけを出す。
 */
import { useEffect, useState, type JSX } from "react";
import type { CdlPhase } from "@cardenelabs/cdl";

/** 段が 1 つ以下の図では何も出さない。進み具合を示す先が無い。 */
const 出す下限 = 2;

/**
 * いま何番目の段かを engine から読む。
 *
 * engine は図の入れ物に `data-cdl-phase-index` を付け、段が進むたびに書き換える。
 * React の外で変わるので、属性の変化を見張る。
 */
function usePhaseIndex(stage: HTMLElement | null): number {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    if (stage === null) return;
    // 見張る手段が無い環境 (jsdom) では 0 段目に留める。落とすと図を出す画面の検査が
    // 組み立ての時点で全て失敗する
    if (typeof MutationObserver === "undefined") return;

    const 読む = (): void => {
      const el = stage.querySelector("[data-cdl-diagram]");
      const v = Number(el?.getAttribute("data-cdl-phase-index") ?? "0");
      // 属性が読めない形 (図がまだ無い / 数でない) では 0 に倒す。NaN のまま持つと
      // 「N 番目」 の表示と配列の参照が両方壊れる
      setIdx(Number.isFinite(v) && v >= 0 ? v : 0);
    };

    読む();
    // 図そのものが差し替わる (記法を書き換えた / 別の項目を選んだ) 場合も拾うため、
    // 舞台ごと見張る
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

export function PhaseChrome({
  stage,
  phases,
  align = "left",
}: {
  /** 図の入れ物。ここを起点に engine の属性を読む */
  stage: HTMLElement | null;
  /** 段の一覧。エディタは組み上げ済みの図から、それ以外は図の定義から渡す */
  phases: readonly CdlPhase[] | undefined;
  /**
   * 札を寄せる側。設計が画面ごとに違う場所へ描いているため引数で受ける
   * (`04 エディタ` と `06 見本の詳細` は左上、`03 カタログの分類` は右上)。
   */
  align?: "left" | "right";
}): JSX.Element | null {
  const idx = usePhaseIndex(stage);
  const 一覧 = phases ?? [];

  if (一覧.length < 出す下限) return null;

  // 属性が配列より先に更新される瞬間がある (図を差し替えた直後)。範囲外を読むと
  // 題名と長さが `undefined` になるので、最後の段に丸める
  const 今 = Math.min(idx, 一覧.length - 1);
  const 段 = 一覧[今];

  return (
    // 掴む操作を邪魔しない。エディタの舞台はここを掴んで動かすので、重ねたものは受け取らない
    <div className="cdl-phase" aria-hidden="true">
      <div className={`cdl-phase-chip is-${align}`}>
        <span className="cdl-phase-dot" />
        <span>
          局面 {今 + 1} / {一覧.length}
        </span>
        {段.title !== "" && <span className="cdl-phase-title">· {段.title}</span>}
      </div>
      <div className="cdl-phase-foot">
        <div className="cdl-phase-bar">
          {一覧.map((p, i) => (
            <span key={p.id} className={`cdl-phase-seg ${i <= 今 ? "is-done" : ""}`} />
          ))}
        </div>
        <div className="cdl-phase-meta">{Math.round(段.duration)}ms · 繰り返し</div>
      </div>
    </div>
  );
}
