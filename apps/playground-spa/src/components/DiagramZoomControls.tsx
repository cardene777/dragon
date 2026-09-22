import { ZoomIn, ZoomOut } from "lucide-react";
import { 収める, 収めるの呼び名, 倍率の表示, 端か, type 倍率の指定 } from "@/lib/diagram-zoom";
import { useLocale } from "@/lib/useLocale";
import type { 二言語 } from "@/lib/bilingual";

/**
 * 図の倍率の欄 (#1964)。 下げる・今の倍率・上げる・器に合わせる のボタンを 1 列に並べる。
 *
 * カタログの並べて見る側 (#1749) と拡大表示 (#1745)、ひな形の詳細画面で同じものを使う。
 * 3 か所に同じ形を書き写すと、片方だけ直す形になる (#1961 で欄の文字を直した時に 2 か所を直した)。
 *
 * **押した時に何が起きるかは呼出側が決める**。 倍率の状態は画面が持ち、ホイールやドラッグ
 * (`useDiagramPanZoom`) と同じ状態を動かすため、この部品は状態を持たない。
 */

/** 欄を置く場所。 場所で器の形 (縦横とも収めるか、幅にだけ合わせるか) と、ホイールの受け方が違う */
export type 倍率の欄の場所 = "並び" | "拡大" | "詳細";


/** 幅にだけ合わせる場所の案内。 修飾キー無しのホイールは画面を送るので、押す鍵を名指しする */
const 幅に合わせる場所の案内: 二言語 = {
  ja: "⌘ か Ctrl を押しながら図の上で回すか、2 本指でつまむと拡大縮小。 拡げた図は押さえたまま動かせる",
  en: "Hold ⌘ or Ctrl and scroll over the diagram, or pinch with two fingers, to zoom. Drag an enlarged diagram to move it",
};

/**
 * 場所ごとの呼び名。 **ボタンの名前は場所ごとに違える** = 1 つの画面に並べて見る側と拡大表示が
 * 同時に出るので、同じ名前だと読み上げでも検査でもどちらのボタンか区別できない。
 *
 * 2 言語とも持つ (#2453)。 場所で名前を違えるのは読み上げと検査の都合なので、
 * **英語でも 3 つの名前が重ならないようにする**。
 */
const 場所ごとの呼び名: Record<
  倍率の欄の場所,
  { 群: 二言語; 下げる: 二言語; 上げる: 二言語; 収める: 二言語; 案内: 二言語 }
> = {
  並び: {
    群: { ja: "並びの倍率", en: "Zoom for the list view" },
    下げる: { ja: "並びの倍率を下げる", en: "Zoom out the list view" },
    上げる: { ja: "並びの倍率を上げる", en: "Zoom in the list view" },
    収める: 収めるの呼び名.幅だけ,
    案内: 幅に合わせる場所の案内,
  },
  拡大: {
    群: { ja: "表示の倍率", en: "Zoom for the enlarged view" },
    下げる: { ja: "倍率を下げる", en: "Zoom out the enlarged view" },
    上げる: { ja: "倍率を上げる", en: "Zoom in the enlarged view" },
    収める: 収めるの呼び名.両方,
    案内: {
      ja: "図の上で回すか、2 本指でつまむと拡大縮小。 拡げた図は押さえたまま動かせる",
      en: "Scroll over the diagram, or pinch with two fingers, to zoom. Drag an enlarged diagram to move it",
    },
  },
  詳細: {
    群: { ja: "図の倍率", en: "Zoom for the diagram" },
    下げる: { ja: "図の倍率を下げる", en: "Zoom out the diagram" },
    上げる: { ja: "図の倍率を上げる", en: "Zoom in the diagram" },
    収める: 収めるの呼び名.幅だけ,
    案内: 幅に合わせる場所の案内,
  },
};

export function DiagramZoomControls({
  場所,
  倍率,
  収めた倍率,
  使える,
  倍率を動かす,
  器に合わせる,
}: {
  場所: 倍率の欄の場所;
  /** いまの倍率 (呼出側の状態) */
  倍率: 倍率の指定;
  /** 器に収めている時に実際に描かれている倍率 (`useDiagramPanZoom` が測る) */
  収めた倍率: number | undefined;
  /** 倍率を指定できるか。 描けない図 (viewBox の幅を出せない図) では `false` */
  使える: boolean;
  倍率を動かす: (向き: "上げる" | "下げる") => void;
  器に合わせる: () => void;
}): React.ReactElement {
  const [locale] = useLocale();
  const 組 = 場所ごとの呼び名[場所];
  const 名 = {
    群: 組.群[locale],
    下げる: 組.下げる[locale],
    上げる: 組.上げる[locale],
    収める: 組.収める[locale],
    案内: 組.案内[locale],
  };
  return (
    <div className="cdl-zoom" role="group" aria-label={名.群} title={名.案内}>
      <button
        type="button"
        className="cdl-zoom-btn"
        aria-label={名.下げる}
        disabled={!使える || 端か(倍率, "下げる", 収めた倍率)}
        onClick={() => 倍率を動かす("下げる")}
      >
        <ZoomOut size={16} />
      </button>
      {/* 器に収めている時も描かれている倍率を数字で出す (#1961) */}
      <span className="cdl-zoom-value" aria-live="polite">
        {倍率の表示(倍率, 収めた倍率)}
      </span>
      <button
        type="button"
        className="cdl-zoom-btn"
        aria-label={名.上げる}
        disabled={!使える || 端か(倍率, "上げる", 収めた倍率)}
        onClick={() => 倍率を動かす("上げる")}
      >
        <ZoomIn size={16} />
      </button>
      <button
        type="button"
        className="cdl-zoom-fit"
        disabled={倍率 === 収める}
        onClick={器に合わせる}
      >
        {名.収める}
      </button>
    </div>
  );
}
