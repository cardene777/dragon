import { STAGE_SVG_SELECTOR } from "@cardenelabs/cdl";

/**
 * 図を描く `<svg>` を取る (#985)。
 *
 * `CdlDiagramView` の DOM は panel が stage より先に来る (cdl `render.tsx` = panel →
 * `CdlStage`)。 interactive panel は widget ごとに `<svg>` を持つ (readout の ring / gauge /
 * sparkline 等)。 「最初の `<svg>`」 で取ると widget を掴み、 Fit も実寸換算も 120px 角の widget
 * を基準にしてしまう (実測 = `/catalog/interactive` で widget `viewBox="0 0 120 120"` に対し
 * stage は `"-35 59 1521 279"`)。
 *
 * selector は cdl から import する。 文字列を写すと、 cdl が目印を変えた時にこちらが何も掴まなく
 * なり、 しかも無言で全操作が効かなくなる (cardene777/cdl#401 で公開してもらった)。
 *
 * **見つからない時に「最初の `<svg>`」 へ戻さない**。 戻すと問題の状態に戻り、 しかも黙って
 * 戻るので気付けない。 Fit / リセット / 倍率 / 書き出しのどれも、 誤った対象に当てるより何も
 * しない方が良い。
 */
export function stageSvgOf(root: Element | Document | null | undefined): SVGSVGElement | null {
  return root?.querySelector<SVGSVGElement>(STAGE_SVG_SELECTOR) ?? null;
}
