/**
 * 走査の軸の日本語の呼び名 (#1796)。
 *
 * engine (`@cardenelabs/cdl`) が返す軸は `structured-data-extraction` のような識別子で、
 * 画面にそのまま出すと何を見て引っかかったのかが読めない。
 *
 * **呼び名は画面の側で持つ**。 engine の版を上げずに言葉を直せるのと、同じ軸でも
 * 出す場所によって言い方を変えられるため。 表が遅れる心配は検査が受け持つ =
 * engine が返しうる軸を実物から導き、呼び名を持たない軸が 1 つでもあれば落ちる。
 *
 * 呼び名は engine が出す指摘文から導いている。 識別子の直訳ではなく
 * 「その軸が何を見ているか」 を書く。
 */

/** 軸の識別子 → 日本語の呼び名 */
export const AXIS_JA: Record<string, string> = {
  "node-visibility": "箱の大きさが足りているか",
  "edge-label-overlap": "線の名札が他のものと重なっていないか",
  "edge-label-proximity": "線の名札が線から離れすぎていないか",
  "text-readability": "題が箱の幅に収まるか",
  "row-format": "箱の行が「名前: 値」 の形になっているか",
  alignment: "帯の中の箱の横位置が揃っているか",
  clearance: "要素どうしの間が空いているか",
  "arrow-endpoint-anchoring": "矢印の先が箱の縁に付いているか",
  "label-char-range": "名札の枠に字が収まっているか",
  "node-overlap": "箱どうしが重なっていないか",
  "edge-crossing": "線どうしの交差が多すぎないか",
  "edge-node-cross": "線が関係ない箱を貫いていないか",
  "edge-segment-orthogonality": "線が決まった角度で引かれているか",
  "label-inside-viewbox": "線の名札が図の枠に収まっているか",
  "lane-cx-consistency": "箱が帯の中心に揃っているか",
  "row-vertical-spacing": "箱の高さに行が収まっているか",
  "group-boundary-clearance": "まとまりの枠と箱の間が空いているか",
  "node-vertical-clearance": "箱の上下の間が空いているか",
  "lane-lane-gap": "帯どうしの間が空いているか",
  "arrow-marker-clearance": "矢じりと箱の間合いが合っているか",
  "grid-alignment": "箱の位置が目盛に乗っているか",
  "phase-layout-stability": "段が変わっても配置がずれないか",
  "responsive-viewport": "画面の幅に収めても字が読めるか",
  "accessibility-basics": "読み上げに必要な説明が付いているか",
  "animation-frame-integrity": "動きの指定が壊れていないか",
  "i18n-cjk-detection": "書く向きが違う字が混じっていないか",
  "contrast-basics": "名札の字と下地の明暗の差が足りているか",
  "print-media-compat": "白黒で刷っても見分けが付くか",
  "color-blind-safety": "色の見え方が違う人にも見分けが付くか",
  "marker-gradient-def-integrity": "線の色や矢じりの指定が定義にあるか",
  "dom-complexity-budget": "図の要素が多すぎないか",
  "reduced-motion-compat": "動きが速すぎたり長すぎたりしないか",
  "touch-target-size": "指で押せる大きさが取れているか",
  "row-content-typing": "箱の行の値が決まった形か",
  "terminal-safe-text": "表示できない字が混じっていないか",
  "gpu-layer-efficiency": "動く線が多すぎて描画が重くならないか",
  "svg-injection-safety": "危ない字が図に混じっていないか",
  "seo-metadata-quality": "図に題と説明が付いているか",
  "bidi-hyphenation": "長い字が折り返せる形になっているか",
  "structured-data-extraction": "図の中身を機械が読み取れるだけの要素があるか",
  "diagram-version-semver": "図の版の書き方が決まりに沿っているか",
  "migration-path-consistency": "古い名前のまま残っていないか",
  "axis-coverage-meta": "一度も働いていない走査の軸が無いか",
  "axis-documentation-completeness": "走査の軸の数が記録と合っているか",
  "fixture-drift-detection": "カタログの指摘の数が基準から増えていないか",
  "locale-parity": "日本語と英語の中身が揃っているか",
  "validate-performance-budget": "走査にかかる時間が長引いていないか",
  "node-inside-viewbox": "箱が図の枠に収まっているか",
  "node-inside-lane": "箱が帯の中に収まっているか",
  "shape-label-dropped": "形に書いた名札が描かれているか",
  "box-line-dropped": "箱に書いた補足が描かれているか",
  "edge-inside-viewbox": "線が図の枠に収まっているか",
  "lane-label-inside-viewbox": "帯の名札が図の枠に収まっているか",
  "lane-label-overlap": "帯の名札どうしが重なっていないか",
  "row-alignment": "同じ段の箱の高さが揃っているか",
  "column-alignment": "同じ列の箱の横位置が揃っているか",
  "edge-stubout-min": "線が箱から出る長さが足りているか",
  "fan-origin-single-point": "同じ箱から出る線の起点が 1 点に集まっているか",
  "detour-slot-distinct": "迂回する線どうしの通り道が分かれているか",
  "arrow-endpoint-center": "矢印の先が辺の中央に付いているか",
  "lane-border-clearance": "名札が関係ない帯にはみ出していないか",
  "row-gap-uniform": "段の間隔が揃っているか",
  "column-gap-uniform": "列の間隔が揃っているか",
  "rows-not-rendered": "書いた行が描かれる種別か",
  "title-row-overlap": "題と 1 行目が重なっていないか",
  "malformed-input": "図の書き方が壊れていないか",
  "validation-interrupted": "走査が途中で止まっていないか",
};

/**
 * 軸の識別子を画面に出す字にする。
 *
 * **呼び名が無い時は識別子をそのまま返す** = 空にすると、どの軸かが画面から消える。
 * 表に無い軸が出ること自体は検査が 0 件に保つので、この道は通常は通らない。
 */
export function axisLabel(axis: string): string {
  return AXIS_JA[axis] ?? axis;
}

/**
 * 自動で直せない軸の、直し方の案内 (#1795 で日本語にした文)。
 *
 * 表に無い軸は `直し方の既定` に落ちる。 軸は 67 件あり、直し方まで書けているのは
 * 実際に出た 4 件だけなので、残りは「記法の側で直す」 とだけ言う。
 */
export const 直し方の既定 = "記法の側で直す";

export const 軸ごとの直し方: Record<string, string> = {
  "text-readability": "題を短くするか、箱の幅を明示する",
  "fan-origin-single-point": "同じ箱から出る線の高さを記法で揃える (配置の自動調整は未対応)",
  "marker-gradient-def-integrity": "線の色味を、決められた呼び名のどれかに直す",
  "dom-complexity-budget": "図を分けるか、要らない箱と線を減らす",
};

/**
 * 自動で直せる指摘が 0 件の時に画面へ出す 1 文を組み立てる。
 *
 * **軸は呼び名で出す** = 識別子のまま出すと、何を見て引っかかったのかが読めない。
 */
export function 直せない軸の案内(軸: readonly string[]): string {
  if (軸.length === 0) return "自動で直せるものはありません";
  const 並び = 軸.map((a) => `${axisLabel(a)} = ${軸ごとの直し方[a] ?? 直し方の既定}`);
  return `自動で直せるものはありません (${並び.join("、 ")})`;
}

/**
 * 「まとめて直す」 を押した時、対象外の軸しか無かった場合に出す 1 文を組み立てる。
 */
export function まとめて直せない案内(軸: readonly string[]): string {
  const 並び = 軸.map((a) => `${axisLabel(a)} = ${軸ごとの直し方[a] ?? 直し方の既定}`);
  const 添え = 並び.length > 0 ? ` (${並び.join("、 ")})` : "";
  return `自動では直せません。 まとめて直せるのは線の名札の位置 (重なり / 間隔 / 近さ) だけで、他の軸は記法の側で直す必要があります${添え}。`;
}
