/**
 * 再生の部品で図を置き、止めて見せる図を枠に合わせる倍率を測る (#3031、#3033)。
 *
 * 編集画面の図の側とカタログの見本が同じ置き方と測り方を使うよう、ここに 1 つだけ持つ。
 * 図か色味か明暗か言葉が替わると、前の再生の部品を片付けてから置き直す (動きの時計を残さない)。
 * 寄って追う図 (`data-view="follow"`) は再生の部品が枠の幅で描き直すので、倍率を返さない。
 * 既定は枠の幅と高さの両方に収め、`fitTo: "width"` では幅だけに合わせて縦は枠の中で送る (拡大の重ね窓)。
 */
import { type Diagram, mountDiagram, type Theme } from "@cardenelabs/dragon";
import { type RefObject, useEffect, useRef, useState } from "react";

import type { Lang } from "../text";
import { fitScale } from "./fit";

/** 止めて見せる図の原寸の幅と、枠に合わせた倍率 */
export interface Fit {
  width: number;
  scale: number;
}

interface Options {
  palette: string;
  theme: Theme;
  lang: Lang;
  /** 段が替わるたびに今の段 (0 から) を受け取る */
  onStep: (step: number) => void;
  /** 枠の幅と高さの両方に収めるか、幅だけに合わせるか */
  fitTo?: "frame" | "width";
}

const px = (value: string): number => Number.parseFloat(value) || 0;

export function useFittedFigure(
  host: RefObject<HTMLDivElement | null>,
  diagram: Diagram | null,
  { palette, theme, lang, onStep, fitTo = "frame" }: Options,
): Fit | null {
  const [fit, setFit] = useState<Fit | null>(null);
  // 段の知らせ先は描くたびに替わりうるので、置き直さずに最新の物を呼ぶ
  const stepTo = useRef(onStep);
  useEffect(() => {
    stepTo.current = onStep;
  });

  // 再生の釦の読み上げと全体図の札は頁の言葉で出し、言葉を切り替えたら置き直す (#3001)
  useEffect(() => {
    const el = host.current;
    if (!el || !diagram) return;
    const player = mountDiagram(el, diagram, { palette, theme, lang, onStep: (step) => stepTo.current(step) });
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
        // 幅だけに合わせる時は、高さで縮めない
        height: fitTo === "width" ? Number.POSITIVE_INFINITY : frame.clientHeight - px(style.paddingTop) - px(style.paddingBottom),
      };
      const view = svg.viewBox.baseVal;
      const name = svg.querySelector(".dg-sn");
      const namePx = name ? px(getComputedStyle(name).fontSize) : 0;
      setFit({ width: view.width, scale: fitScale(inner, { width: view.width, height: view.height }, namePx) });
    };
    // 再生の部品も同じ枠を見て見せ方を選び直すので、その後に測る (先に見始めた方が先に呼ばれる)
    const observer = new ResizeObserver(measure);
    if (frame) observer.observe(frame);
    return () => {
      observer.disconnect();
      player.destroy();
    };
  }, [host, diagram, palette, theme, lang, fitTo]);

  return fit;
}
