/**
 * 欄の境目のつまみ (#3612)。
 *
 * 境目の線の真ん中に縦長の握りを常に出し、掴んで横へ引くと左の欄の幅が変わる。
 * キーボードではつまみに移り、左右の矢印で 16px、Shift を足すと 64px 動く。
 * 引いている間は幅を変えるだけで、離した時と矢印を押した時に幅を残す (`onDone`)。
 */
import { type KeyboardEvent, type PointerEvent, type ReactElement, useRef } from "react";

import { KEY_STEP, KEY_STEP_LARGE, type Pane } from "./split";

interface Props {
  pane: Pane;
  label: string;
  /** 左の欄の見せる幅 */
  width: number;
  min: number;
  max: number | undefined;
  onResize: (next: number) => void;
  onDone: () => void;
}

export function SplitHandle({ pane, label, width, min, max, onResize, onDone }: Props): ReactElement {
  const start = useRef<{ x: number; width: number } | null>(null);

  const end = (e: PointerEvent<HTMLDivElement>): void => {
    if (!start.current) return;
    start.current = null;
    delete e.currentTarget.dataset.dragging;
    onDone();
  };

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>): void => {
    const dir = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
    if (dir === 0) return;
    e.preventDefault();
    onResize(width + dir * (e.shiftKey ? KEY_STEP_LARGE : KEY_STEP));
    onDone();
  };

  return (
    <div
      className="pg-split"
      data-playground={`split-${pane}`}
      data-pane={pane}
      role="separator"
      aria-orientation="vertical"
      aria-label={label}
      aria-valuenow={width}
      aria-valuemin={min}
      aria-valuemax={max}
      tabIndex={0}
      onPointerDown={(e) => {
        if (e.button !== 0) return;
        e.preventDefault();
        // 引いている間は指が欄の上へ出ても、知らせをつまみが受け続ける
        e.currentTarget.setPointerCapture?.(e.pointerId);
        e.currentTarget.dataset.dragging = "";
        start.current = { x: e.clientX, width };
      }}
      onPointerMove={(e) => {
        if (start.current) onResize(start.current.width + e.clientX - start.current.x);
      }}
      onPointerUp={end}
      onPointerCancel={end}
      onKeyDown={onKeyDown}
    />
  );
}
