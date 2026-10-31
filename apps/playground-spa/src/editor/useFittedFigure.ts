/**
 * 再生の部品で図を置き、止めて見せる図を枠に合わせる倍率を測る (#3031、#3033)。
 *
 * 編集画面の図の側とカタログの見本が同じ置き方と測り方を使うよう、ここに 1 つだけ持つ。
 * 図か色味か明暗か言葉が替わると、前の再生の部品を片付けてから置き直す (動きの時計を残さない)。
 * 寄って追う図 (`data-view="follow"`) は再生の部品が枠の幅で描き直すので、倍率を返さない。
 * 止めて見せる図は枠の幅と高さの両方に収める。`fitHeight` では寄って追う図も枠の高さに収め、
 * 高さに収めると字が読めない図は寄って追う図にする (拡大の重ね窓、#3047)。
 * その時の字の下限は、再生の部品が見せ方を選ぶ字の大きさ (`@cardenelabs/dragon` の `READABLE_PX`) にそろえる。
 */
import { type Diagram, mountDiagram, type Player, READABLE_PX as VIEW_READABLE_PX, type Theme } from "@cardenelabs/dragon/light";
import { type RefObject, useEffect, useRef, useState } from "react";

import { useKind } from "../site/kinds";
import type { Lang } from "../text";
import { fitScale } from "./fit";

/** 測った図と、止めて見せる図の原寸の幅と、枠に合わせた倍率と、その倍率の図を送らずに見せる枠の高さ */
export interface Fit {
  /** 測った図。図を替えた直後は前の図を測った値が残るので、見比べて捨てる時に使う */
  diagram: Diagram;
  width: number;
  scale: number;
  /**
   * 枠に合わせた倍率 (拡大と縮小を掛ける前) の図を、上下の余白ごと収める枠の高さ (px)。
   * 字の下限で止まった図は今の枠より高くなる。枠を図に合わせて伸ばす置き場が使う (カタログの見本、#3250)
   */
  frame: number;
}

interface Options {
  palette: string;
  theme: Theme;
  lang: Lang;
  /** 段が替わるたびに今の段 (0 から) を受け取る */
  onStep: (step: number) => void;
  /** 寄って追う図も枠の高さに収める。枠の高さが決まっている置き場だけで使い、図に合わせて伸びる枠では使わない */
  fitHeight?: boolean;
  /** 再生の部品を置いた時にそれを、片付けた時に `null` を受け取る。段へ移る時と図の上を囲む時に呼ぶ (#3178) */
  onPlayer?: (player: Player | null) => void;
}

const px = (value: string): number => Number.parseFloat(value) || 0;

export function useFittedFigure(
  host: RefObject<HTMLDivElement | null>,
  diagram: Diagram | null,
  { palette, theme, lang, onStep, fitHeight = false, onPlayer }: Options,
): Fit | null {
  const [fit, setFit] = useState<Fit | null>(null);
  // 図の種類の部品が届くまでは置かない (#3248)
  const ready = useKind(diagram?.kind).status === "ready";
  // 段の知らせ先は描くたびに替わりうるので、置き直さずに最新の物を呼ぶ
  const stepTo = useRef(onStep);
  const playerTo = useRef(onPlayer);
  useEffect(() => {
    stepTo.current = onStep;
    playerTo.current = onPlayer;
  });

  // 再生の釦の読み上げと全体図の札は頁の言葉で出し、言葉を切り替えたら置き直す (#3001)
  useEffect(() => {
    const el = host.current;
    if (!el || !diagram || !ready) return;
    const player = mountDiagram(el, diagram, { palette, theme, lang, onStep: (step) => stepTo.current(step), fitHeight });
    playerTo.current?.(player);
    const frame = el.querySelector<HTMLElement>(".dg-frame");
    /** 枠の中身の大きさと図の原寸から、枠に合わせる倍率を出す。寄って追う図には当てない */
    const measure = (): void => {
      const svg = el.querySelector<SVGSVGElement>('svg[data-dragon="figure"]');
      if (!frame || !svg || svg.dataset.view !== "fixed") {
        setFit(null);
        return;
      }
      // 枠を隠している間 (カタログのコードの見出し) は測れないので、前に測った倍率を残す
      if (frame.clientWidth === 0) return;
      const style = getComputedStyle(frame);
      const inner = {
        width: frame.clientWidth - px(style.paddingLeft) - px(style.paddingRight),
        height: frame.clientHeight - px(style.paddingTop) - px(style.paddingBottom),
      };
      const view = svg.viewBox.baseVal;
      const name = svg.querySelector(".dg-sn");
      const namePx = name ? px(getComputedStyle(name).fontSize) : 0;
      // 高さに収める時は、再生の部品が止めて見せる図を選ぶ字の大きさを下限にする。
      // 下限が違うと、部品が止めて見せる図を選んだのに、ここで縮めるのを止めて送りが残る (#3047)
      const readable = fitHeight ? VIEW_READABLE_PX : undefined;
      const scale = fitScale(inner, { width: view.width, height: view.height }, namePx, readable);
      // 切り上げで、伸ばした枠の中で測り直しても倍率が下がらない (図の高さが枠の中の高さを超えない)。
      // 割り算の誤差で 1px 伸び続けないよう、0.01px 未満の端数は切り上げない
      const frameHeight = Math.ceil(view.height * scale - 0.01) + px(style.paddingTop) + px(style.paddingBottom);
      setFit({ diagram, width: view.width, scale, frame: frameHeight });
    };
    // 再生の部品も同じ枠を見て見せ方を選び直すので、その後に測る (先に見始めた方が先に呼ばれる)
    const observer = new ResizeObserver(measure);
    if (frame) observer.observe(frame);
    return () => {
      observer.disconnect();
      player.destroy();
      playerTo.current?.(null);
    };
  }, [host, diagram, ready, palette, theme, lang, fitHeight]);

  return fit;
}
