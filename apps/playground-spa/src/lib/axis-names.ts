/**
 * 走査の軸の呼び名 (#1796、 #2454 で 2 言語にした)。
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

import type { Locale } from "./i18n";
import type { 二言語 } from "./bilingual";

/** 軸の識別子 → 2 言語の呼び名 */
export const AXIS_NAMES: Record<string, 二言語> = {
  "node-visibility": { ja: "箱の大きさが足りているか", en: "Whether the boxes are big enough" },
  "edge-label-overlap": { ja: "線の名札が他のものと重なっていないか", en: "Whether a line label overlaps something else" },
  "edge-label-proximity": { ja: "線の名札が線から離れすぎていないか", en: "Whether a line label sits too far from its line" },
  "text-readability": { ja: "題が箱の幅に収まるか", en: "Whether the title fits the width of its box" },
  "row-format": { ja: "箱の行が「名前: 値」 の形になっているか", en: "Whether a box row reads as \"name: value\"" },
  "alignment": { ja: "帯の中の箱の横位置が揃っているか", en: "Whether boxes line up across a lane" },
  "clearance": { ja: "要素どうしの間が空いているか", en: "Whether elements have room between them" },
  "arrow-endpoint-anchoring": { ja: "矢印の先が箱の縁に付いているか", en: "Whether an arrow head lands on the edge of its box" },
  "label-char-range": { ja: "名札の枠に字が収まっているか", en: "Whether the text fits inside the label" },
  "node-overlap": { ja: "箱どうしが重なっていないか", en: "Whether boxes overlap each other" },
  "edge-crossing": { ja: "線どうしの交差が多すぎないか", en: "Whether too many lines cross" },
  "edge-node-cross": { ja: "線が関係ない箱を貫いていないか", en: "Whether a line runs through an unrelated box" },
  "edge-segment-orthogonality": { ja: "線が決まった角度で引かれているか", en: "Whether lines are drawn at the set angles" },
  "label-inside-viewbox": { ja: "線の名札が図の枠に収まっているか", en: "Whether a line label fits inside the frame" },
  "lane-cx-consistency": { ja: "箱が帯の中心に揃っているか", en: "Whether boxes sit at the centre of their lane" },
  "row-vertical-spacing": { ja: "箱の高さに行が収まっているか", en: "Whether the rows fit the height of their box" },
  "group-boundary-clearance": { ja: "まとまりの枠と箱の間が空いているか", en: "Whether a group border has room around its boxes" },
  "node-vertical-clearance": { ja: "箱の上下の間が空いているか", en: "Whether boxes have room above and below" },
  "lane-lane-gap": { ja: "帯どうしの間が空いているか", en: "Whether lanes have room between them" },
  "arrow-marker-clearance": { ja: "矢じりと箱の間合いが合っているか", en: "Whether an arrow head keeps its distance from a box" },
  "grid-alignment": { ja: "箱の位置が目盛に乗っているか", en: "Whether boxes sit on the grid" },
  "phase-layout-stability": { ja: "段が変わっても配置がずれないか", en: "Whether the layout holds still as phases change" },
  "responsive-viewport": { ja: "画面の幅に収めても字が読めるか", en: "Whether the text stays readable at narrow widths" },
  "accessibility-basics": { ja: "読み上げに必要な説明が付いているか", en: "Whether the description a screen reader needs is there" },
  "animation-frame-integrity": { ja: "動きの指定が壊れていないか", en: "Whether the movement is described without gaps" },
  "i18n-cjk-detection": { ja: "書く向きが違う字が混じっていないか", en: "Whether text written in another direction is mixed in" },
  "contrast-basics": { ja: "名札の字と下地の明暗の差が足りているか", en: "Whether a label has enough contrast against its ground" },
  "print-media-compat": { ja: "白黒で刷っても見分けが付くか", en: "Whether it still reads when printed in black and white" },
  "color-blind-safety": { ja: "色の見え方が違う人にも見分けが付くか", en: "Whether it reads for people who see colour differently" },
  "marker-gradient-def-integrity": { ja: "線の色や矢じりの指定が定義にあるか", en: "Whether the line colours and arrow heads are defined" },
  "dom-complexity-budget": { ja: "図の要素が多すぎないか", en: "Whether the diagram has too many elements" },
  "reduced-motion-compat": { ja: "動きが速すぎたり長すぎたりしないか", en: "Whether the movement is too fast or too long" },
  "touch-target-size": { ja: "指で押せる大きさが取れているか", en: "Whether controls are large enough to press" },
  "row-content-typing": { ja: "箱の行の値が決まった形か", en: "Whether a box row value has the expected shape" },
  "terminal-safe-text": { ja: "表示できない字が混じっていないか", en: "Whether characters that cannot be shown are mixed in" },
  "gpu-layer-efficiency": { ja: "動く線が多すぎて描画が重くならないか", en: "Whether so many lines move that drawing slows down" },
  "svg-injection-safety": { ja: "危ない字が図に混じっていないか", en: "Whether unsafe characters are mixed into the drawing" },
  "seo-metadata-quality": { ja: "図に題と説明が付いているか", en: "Whether the diagram has a title and a description" },
  "bidi-hyphenation": { ja: "長い字が折り返せる形になっているか", en: "Whether long text can wrap" },
  "structured-data-extraction": { ja: "図の中身を機械が読み取れるだけの要素があるか", en: "Whether there is enough for a machine to read the diagram" },
  "diagram-version-semver": { ja: "図の版の書き方が決まりに沿っているか", en: "Whether the diagram version follows the rule" },
  "migration-path-consistency": { ja: "古い名前のまま残っていないか", en: "Whether old names are left behind" },
  "axis-coverage-meta": { ja: "一度も働いていない走査の軸が無いか", en: "Whether any check has never run" },
  "axis-documentation-completeness": { ja: "走査の軸の数が記録と合っているか", en: "Whether the number of checks matches the record" },
  "fixture-drift-detection": { ja: "カタログの指摘の数が基準から増えていないか", en: "Whether the catalogue findings have grown past the baseline" },
  "locale-parity": { ja: "日本語と英語の中身が揃っているか", en: "Whether the Japanese and the English hold the same content" },
  "validate-performance-budget": { ja: "走査にかかる時間が長引いていないか", en: "Whether the checks are taking too long" },
  "node-inside-viewbox": { ja: "箱が図の枠に収まっているか", en: "Whether the boxes fit inside the frame" },
  "node-inside-lane": { ja: "箱が帯の中に収まっているか", en: "Whether the boxes fit inside their lane" },
  "shape-label-dropped": { ja: "形に書いた名札が描かれているか", en: "Whether a label written on a shape is drawn" },
  "box-line-dropped": { ja: "箱に書いた補足が描かれているか", en: "Whether a note written on a box is drawn" },
  "edge-inside-viewbox": { ja: "線が図の枠に収まっているか", en: "Whether the lines fit inside the frame" },
  "lane-label-inside-viewbox": { ja: "帯の名札が図の枠に収まっているか", en: "Whether a lane label fits inside the frame" },
  "lane-label-overlap": { ja: "帯の名札どうしが重なっていないか", en: "Whether lane labels overlap each other" },
  "row-alignment": { ja: "同じ段の箱の高さが揃っているか", en: "Whether boxes on the same row share a height" },
  "column-alignment": { ja: "同じ列の箱の横位置が揃っているか", en: "Whether boxes in the same column line up" },
  "edge-stubout-min": { ja: "線が箱から出る長さが足りているか", en: "Whether a line leaves its box far enough" },
  "fan-origin-single-point": { ja: "同じ箱から出る線の起点が 1 点に集まっているか", en: "Whether lines from one box start at a single point" },
  "detour-slot-distinct": { ja: "迂回する線どうしの通り道が分かれているか", en: "Whether detouring lines take separate paths" },
  "arrow-endpoint-center": { ja: "矢印の先が辺の中央に付いているか", en: "Whether an arrow head lands at the middle of an edge" },
  "lane-border-clearance": { ja: "名札が関係ない帯にはみ出していないか", en: "Whether a label spills into an unrelated lane" },
  "row-gap-uniform": { ja: "段の間隔が揃っているか", en: "Whether the gaps between rows are even" },
  "column-gap-uniform": { ja: "列の間隔が揃っているか", en: "Whether the gaps between columns are even" },
  "rows-not-rendered": { ja: "書いた行が描かれる種別か", en: "Whether the kind actually draws the rows written for it" },
  "title-row-overlap": { ja: "題と 1 行目が重なっていないか", en: "Whether the title overlaps the first row" },
  "malformed-input": { ja: "図の書き方が壊れていないか", en: "Whether the diagram is written in a readable form" },
  "validation-interrupted": { ja: "走査が途中で止まっていないか", en: "Whether the checks stopped partway" },
};

/**
 * 軸の識別子を画面に出す字にする。
 *
 * **呼び名が無い時は識別子をそのまま返す** = 空にすると、どの軸かが画面から消える。
 * 表に無い軸が出ること自体は検査が 0 件に保つので、この道は通常は通らない。
 */
export function axisLabel(axis: string, locale: Locale): string {
  const 名 = AXIS_NAMES[axis];
  return 名 === undefined ? axis : 名[locale];
}

/**
 * 自動で直せない軸の、直し方の案内 (#1795 で日本語にした文)。
 *
 * 表に無い軸は `直し方の既定` に落ちる。 件数は書かない = 軸を足すたびに動く
 * (軸の全件は `AXIS_JA`、直し方まで書けている軸は下の `軸ごとの直し方` が持つ)。
 * 直し方を書くのは実際に出た軸だけで、残りは「記法の側で直す」 とだけ言う。
 */
export const 直し方の既定: 二言語 = {
  ja: "記法の側で直す",
  en: "fix it in the notation",
};

export const 軸ごとの直し方: Record<string, 二言語> = {
  "text-readability": {
    ja: "題を短くするか、箱の幅を明示する",
    en: "shorten the title, or write the width of the box",
  },
  "fan-origin-single-point": {
    ja: "同じ箱から出る線の高さを記法で揃える (配置の自動調整は未対応)",
    en: "level the lines leaving the same box in the notation (there is no automatic placement for this yet)",
  },
  "marker-gradient-def-integrity": {
    ja: "線の色味を、決められた呼び名のどれかに直す",
    en: "change the line colour to one of the named colours",
  },
  "dom-complexity-budget": {
    ja: "図を分けるか、要らない箱と線を減らす",
    en: "split the diagram, or drop boxes and lines you do not need",
  },
};

/**
 * 自動で直せる指摘が 0 件の時に画面へ出す 1 文を組み立てる。
 *
 * **軸は呼び名で出す** = 識別子のまま出すと、何を見て引っかかったのかが読めない。
 */
export function 直せない軸の案内(軸: readonly string[], locale: Locale): string {
  const 頭 =
    locale === "ja" ? "自動で直せるものはありません" : "None of these can be fixed for you";
  if (軸.length === 0) return 頭;
  const 並び = 軸.map(
    (a) => `${axisLabel(a, locale)} = ${(軸ごとの直し方[a] ?? 直し方の既定)[locale]}`,
  );
  return `${頭} (${並び.join(locale === "ja" ? "、 " : "; ")})`;
}

/**
 * 「まとめて直す」 を押した時、対象外の軸しか無かった場合に出す 1 文を組み立てる。
 */
export function まとめて直せない案内(軸: readonly string[], locale: Locale): string {
  const 並び = 軸.map(
    (a) => `${axisLabel(a, locale)} = ${(軸ごとの直し方[a] ?? 直し方の既定)[locale]}`,
  );
  const 添え = 並び.length > 0 ? ` (${並び.join(locale === "ja" ? "、 " : "; ")})` : "";
  return locale === "ja"
    ? `自動では直せません。 まとめて直せるのは線の名札の位置 (重なり / 間隔 / 近さ) だけで、他の軸は記法の側で直す必要があります${添え}。`
    : `These cannot be fixed for you. Only the places of line labels (overlap, spacing, distance) can be fixed in one go; the rest have to be fixed in the notation${添え}.`;
}
