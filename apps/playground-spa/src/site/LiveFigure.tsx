/**
 * 記法の字から動く図を置く部品 (#3032)。
 *
 * 記法を読み、再生の部品 (`mountDiagram`) で描く。頁の側では SVG を組まない。
 * 記法か言葉か色味か明暗が替わると、前の再生の部品を片付けてから置き直す (動きの時計を残さない)。
 * `whole` を渡すと、枠の幅に関わらず全体を止めて見せる (`fixed`)。縮小版と小さな図に使う。
 * 寄って追う見せ方は小さな枠では動く所だけが大きく映り、何の図かが分からないため。
 * `json` を渡すと、記法ではなく原本の JSON の字として読む (#3034、使い方の JSON の節)。
 */
import { type Diagram, mountDiagram, parseNotation, readDiagram, type Theme } from "@cardenelabs/dragon";
import { type ReactElement, useEffect, useMemo, useRef } from "react";

import type { Lang } from "../text";

interface Props {
  notation: string;
  lang: Lang;
  theme: Theme;
  /** 図の色味。上の帯で選んだ色味を受け取る (#3033) */
  palette: string;
  /** 枠の幅に関わらず全体を止めて見せる */
  whole?: boolean;
  /** `notation` に記法ではなく原本の JSON の字を渡す */
  json?: boolean;
  /** 段が替わるたびに今の段 (0 から) を受け取る */
  onStep?: (step: number) => void;
  className?: string;
}

/** 原本の JSON の字を読む。JSON として読めない時と検査を通らない時は `null` */
function readJson(text: string): Diagram | null {
  let input: unknown;
  try {
    input = JSON.parse(text);
  } catch {
    return null;
  }
  const read = readDiagram(input);
  return read.ok ? read.diagram : null;
}

/** 記法の字を読む。読めない時は `null` */
function readNotation(text: string): Diagram | null {
  const parsed = parseNotation(text);
  return parsed.ok ? parsed.diagram : null;
}

export function LiveFigure({ notation, lang, theme, palette, whole = false, json = false, onStep, className }: Props): ReactElement {
  const host = useRef<HTMLDivElement>(null);
  const diagram = useMemo((): Diagram | null => {
    const read = json ? readJson(notation) : readNotation(notation);
    if (!read) return null;
    return whole ? { ...read, view: "fixed" } : read;
  }, [notation, whole, json]);
  // 段の知らせ先は描くたびに替わりうるので、置き直さずに最新の物を呼ぶ
  const stepTo = useRef(onStep);
  useEffect(() => {
    stepTo.current = onStep;
  });

  useEffect(() => {
    const el = host.current;
    if (!el || !diagram) return;
    const player = mountDiagram(el, diagram, { palette, theme, lang, onStep: (step) => stepTo.current?.(step) });
    return () => player.destroy();
  }, [diagram, palette, theme, lang]);

  return <div ref={host} className={className} />;
}
