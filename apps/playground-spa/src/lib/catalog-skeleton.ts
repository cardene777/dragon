import { useLayoutEffect } from "react";

const skeletonShapeSelector =
  "rect, path, circle, ellipse, polygon, line, polyline, text, tspan";

function hasNoPaint(value: string): boolean {
  return (
    !value ||
    value === "none" ||
    value === "transparent" ||
    /rgba\([^)]*,\s*0\)$/.test(value)
  );
}

/** 元の図で見えない形へ印を付け、意味を持つ点線と矢じりの形を残す。 */
export function markCatalogSkeleton(svg: SVGSVGElement): void {
  for (const element of svg.querySelectorAll<SVGElement>(skeletonShapeSelector)) {
    const style = getComputedStyle(element);
    const hidden =
      style.display === "none" ||
      style.visibility === "hidden" ||
      Number(style.opacity) === 0 ||
      ((hasNoPaint(style.fill) || Number(style.fillOpacity) === 0) &&
        (hasNoPaint(style.stroke) ||
          Number.parseFloat(style.strokeWidth) === 0 ||
          Number(style.strokeOpacity) === 0));

    if (
      (hidden || element.hasAttribute("data-cdl-frame")) &&
      !element.hasAttribute("data-catalog-skeleton-hidden")
    ) {
      element.setAttribute("data-catalog-skeleton-hidden", "");
    }

    const dash = element.getAttribute("stroke-dasharray");
    if (
      dash &&
      dash !== "none" &&
      element.style.getPropertyValue("--catalog-skeleton-dash") !== dash
    ) {
      element.style.setProperty("--catalog-skeleton-dash", dash);
    }

    if (element.closest("marker")) {
      const filled = !hasNoPaint(style.fill) && Number(style.fillOpacity) !== 0;
      const markerKind = filled ? "fill" : "stroke";
      if (element.getAttribute("data-catalog-skeleton-marker") !== markerKind) {
        element.setAttribute("data-catalog-skeleton-marker", markerKind);
      }
      if (
        !filled &&
        element.style.getPropertyValue("--catalog-skeleton-sw") !== style.strokeWidth
      ) {
        element.style.setProperty("--catalog-skeleton-sw", style.strokeWidth);
      }
    }
  }
}

/** 図が描き直された時、次の描画前に骨組みの印を付け直す。 */
export function useCatalogSkeleton(stage: HTMLElement | null, on: boolean): void {
  useLayoutEffect(() => {
    if (!stage || !on) return;

    const mark = (): void => {
      // 骨組みの上書きではなく、図が持つ元の算出済み style を読む。
      stage.removeAttribute("data-catalog-skeleton");
      for (const svg of stage.querySelectorAll<SVGSVGElement>("svg[data-cdl-stage]")) {
        markCatalogSkeleton(svg);
      }
      stage.setAttribute("data-catalog-skeleton", "on");
    };

    let frame: number | null = null;
    const observer = new MutationObserver((mutations) => {
      const onlySkeletonToggle = mutations.every(
        (mutation) =>
          mutation.type === "attributes" &&
          mutation.target === stage &&
          mutation.attributeName === "data-catalog-skeleton",
      );
      if (onlySkeletonToggle || frame !== null) return;
      frame = requestAnimationFrame(() => {
        frame = null;
        mark();
      });
    });

    mark();
    observer.observe(stage, { attributes: true, childList: true, subtree: true });

    return () => {
      observer.disconnect();
      if (frame !== null) cancelAnimationFrame(frame);
      stage.removeAttribute("data-catalog-skeleton");
    };
  }, [stage, on]);
}
