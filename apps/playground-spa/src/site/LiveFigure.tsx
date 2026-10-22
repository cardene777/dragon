/**
 * 記法の字から動く図を置く部品 (#3032)。
 *
 * 記法を読み、再生の部品 (`mountDiagram`) で描く。頁の側では SVG を組まない。
 * 記法か言葉か明暗が替わると、前の再生の部品を片付けてから置き直す (動きの時計を残さない)。
 * `whole` を渡すと、枠の幅に関わらず全体を止めて見せる (`fixed`)。縮小版と小さな図に使う。
 * 寄って追う見せ方は小さな枠では動く所だけが大きく映り、何の図かが分からないため。
 */
import { DEFAULT_PALETTE, type Diagram, mountDiagram, parseNotation, type Theme } from "@cardenelabs/dragon";
import { type ReactElement, useEffect, useMemo, useRef } from "react";

import type { Lang } from "../text";

interface Props {
  notation: string;
  lang: Lang;
  theme: Theme;
  /** 枠の幅に関わらず全体を止めて見せる */
  whole?: boolean;
  /** 段が替わるたびに今の段 (0 から) を受け取る */
  onStep?: (step: number) => void;
  className?: string;
}

export function LiveFigure({ notation, lang, theme, whole = false, onStep, className }: Props): ReactElement {
  const host = useRef<HTMLDivElement>(null);
  const diagram = useMemo((): Diagram | null => {
    const parsed = parseNotation(notation);
    if (!parsed.ok) return null;
    return whole ? { ...parsed.diagram, view: "fixed" } : parsed.diagram;
  }, [notation, whole]);
  // 段の知らせ先は描くたびに替わりうるので、置き直さずに最新の物を呼ぶ
  const stepTo = useRef(onStep);
  useEffect(() => {
    stepTo.current = onStep;
  });

  useEffect(() => {
    const el = host.current;
    if (!el || !diagram) return;
    const player = mountDiagram(el, diagram, { palette: DEFAULT_PALETTE, theme, lang, onStep: (step) => stepTo.current?.(step) });
    return () => player.destroy();
  }, [diagram, theme, lang]);

  return <div ref={host} className={className} />;
}
