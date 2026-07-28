/**
 * 編集画面の pan 層に置く SVG の表示サイズを決める。
 *
 * `CdlDiagramView` は `w-full h-auto` で親幅を欲しがるが、 pan の wrapper は
 * `inline-block` なので幅が循環参照になり、 SVG が既定の 300x150 に潰れる。
 * そのため実 pixel を明示する。
 *
 * ここで図全体の倍率 (`viewport.scale`) も一緒に効かせる。 cdl 側は SVG の inline
 * style に `width: {viewBox 幅 × k}px` を置いて倍率を表すが、 編集画面は上の理由で
 * その style を `!important` で上書きしてしまう。 上書きする側が倍率を知らないと
 * 「倍率を変えても画面が変わらない」 になるため、 SVG に載っている `data-cdl-scale`
 * を読んで同じ k を掛ける。
 */

/** 倍率として受け付ける範囲。 cdl 側の clamp と同じ。 */
const MIN = 0.125;
const MAX = 8;

export type PixelSize = { w: number; h: number };

/** `data-cdl-scale` を数値として読む。 未指定 / 不正値は 1。 */
export function readSvgScaleAttr(svg: { getAttribute(name: string): string | null }): number {
  const raw = svg.getAttribute("data-cdl-scale");
  if (raw === null || raw.trim() === "") return 1;
  const k = Number(raw);
  if (!Number.isFinite(k) || k <= 0) return 1;
  return Math.min(MAX, Math.max(MIN, k));
}

/** viewBox の実寸に倍率を掛けた表示サイズ。 */
export function scaledPixelSize(viewBox: { width: number; height: number }, scale: number): PixelSize {
  return { w: viewBox.width * scale, h: viewBox.height * scale };
}

/**
 * SVG に表示サイズを焼き込み、 適用した値を返す。
 *
 * `!important` を付けるのは、 cdl 側が同じ property を inline style で持っており、
 * 付けないと後勝ちが不定になるため。
 */
export function applySvgPixelSize(
  svg: SVGSVGElement,
  viewBox: { width: number; height: number },
): PixelSize {
  const px = scaledPixelSize(viewBox, readSvgScaleAttr(svg));
  svg.style.setProperty("width", `${px.w}px`, "important");
  svg.style.setProperty("height", `${px.h}px`, "important");
  svg.style.setProperty("max-width", "none", "important");
  return px;
}
