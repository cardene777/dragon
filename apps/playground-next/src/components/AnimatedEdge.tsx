"use client";

/**
 * Animated edge — dot-flow が edge line 上を動く演出。
 * dragon 元来の "animated diagram DSL" 名を live で見せるため、 mount 後に
 * stroke-dashoffset を animation で連続的にずらす CSS keyframe を仕込む。
 *
 * DiagramEdge 内で active 時 or animate=true prop で起動。
 * reduce-motion 対応 = @media (prefers-reduced-motion: reduce) で停止。
 */
export function AnimatedEdgeStyle(): React.ReactElement {
  return (
    <style>{`
      @keyframes cdl-edge-flow {
        from { stroke-dashoffset: 40; }
        to { stroke-dashoffset: 0; }
      }
      .cdl-edge-animated {
        stroke-dasharray: 8 8;
        animation: cdl-edge-flow 1.5s linear infinite;
      }
      @media (prefers-reduced-motion: reduce) {
        .cdl-edge-animated {
          animation: none;
          stroke-dasharray: none;
        }
      }
      /* focus visibility for keyboard nav */
      button:focus-visible,
      a:focus-visible {
        outline: 2px solid var(--color-accent);
        outline-offset: 2px;
        border-radius: 8px;
      }
    `}</style>
  );
}
