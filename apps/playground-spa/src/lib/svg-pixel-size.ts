/**
 * 編集画面の pan 層に置く SVG の表示サイズを決める。
 *
 * `CdlDiagramView` は `w-full h-auto` で親幅を欲しがるが、 pan の wrapper は
 * `inline-block` なので幅が循環参照になり、 SVG が既定の 300x150 に潰れる。
 * そのため実 pixel を明示する。
 *
 * ここで図全体の倍率 (`viewport.scale`) も一緒に効かせる。 cdl 側は SVG の inline
 * style に `width: {k × 100}%` を置いて倍率を表す (親幅基準)。 編集画面は上の理由で
 * その style を `!important` の px で上書きするため、 上書きする側が倍率を知らないと
 * 「倍率を変えても画面が変わらない」 になる。 SVG に載っている `data-cdl-scale` を
 * 読んで同じ k を掛ける。
 *
 * 幅の基準は cdl (親幅) と編集画面 (viewBox 実寸) で違うが、 どちらも倍率 1 に対して
 * k 倍という意味は同じ。 編集画面は pan の中で実 pixel を要求されるので絶対値を使い、
 * cdl は埋め込み先の幅に追随する必要があるので相対値を使う。
 */

/** 倍率として受け付ける範囲。 cdl 側の clamp と同じ。 */
const MIN = 0.125;
const MAX = 8;

export type PixelSize = { w: number; h: number };

/**
 * 倍率の正規化。 cdl の `normalizeDiagramScale` と同じ規則。
 *
 * 図に載る倍率と overlay parts に載る倍率がずれると、 図を拡大した時に parts だけ
 * 取り残される。 ずれないよう cdl と同じ規則をここに置き、 DOM 属性からでも
 * diagram object からでも同じ値が出るようにする。
 */
export function normalizeScale(value: number | undefined | null): number {
  if (value === undefined || value === null) return 1;
  if (!Number.isFinite(value) || value <= 0) return 1;
  return Math.min(MAX, Math.max(MIN, value));
}

/** `data-cdl-scale` を数値として読む。 未指定 / 不正値は 1。 */
export function readSvgScaleAttr(svg: { getAttribute(name: string): string | null }): number {
  const raw = svg.getAttribute("data-cdl-scale");
  if (raw === null || raw.trim() === "") return 1;
  const k = Number(raw);
  return normalizeScale(k);
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
