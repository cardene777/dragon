/**
 * 描かれた画素から対比を測る共通部。
 *
 * ## 計算で合成しない
 *
 * 文字色と地の重なりは、 色の alpha / 要素と祖先の `opacity` / 半透明の地 / gradient /
 * 混色 (`color-mix`) が絡み、 合成の順序まで含めて再現しないと合わない。 実際に
 * `muted-text-symmetry.spec.ts` は 2 度これを踏んだ (#1116 の review R1-F1)。
 *
 * 1 度目は `opacity` を数えていなかった (宣言 5.47 / 実際 3.58)。
 * 2 度目は数えたが半透明の地を読み飛ばし、 その下の不透明な祖先を地として採っていた
 * (白地に `rgba(0,0,0,0.5)` を重ねた上の文字を 5.47 と判定する形が残った)。
 *
 * **合成は描画側が既に正しく行っている**。 文字を隠した画面と出した画面を撮って画素を
 * 比べれば、 合成の規則をこちらで持たずに済む。
 *
 *   地の色   = 文字を隠した画面の、 その画素の色
 *   文字の色 = 文字を出した画面の、 **最も地から離れた** 画素の色
 *
 * ## 出どころ
 *
 * `rendered-contrast.spec.ts` (#1060 系) が先に確立した測り方を、 2 つ目の利用者が
 * できた時点でここへ出した。 判定の中身は変えていない。
 */
import { PNG } from "pngjs";
import type { Page } from "@playwright/test";

export type Box = { x: number; y: number; width: number; height: number };

export type Measured =
  | { kind: "ok"; fg: [number, number, number]; bg: [number, number, number]; ratio: number }
  | { kind: "invisible" }
  | { kind: "unmeasurable"; reason: string };

/** WCAG 2.x の相対輝度。 */
export function luminance([r, g, b]: [number, number, number]): number {
  const ch = [r, g, b].map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * ch[0]! + 0.7152 * ch[1]! + 0.0722 * ch[2]!;
}

export function contrast(a: [number, number, number], b: [number, number, number]): number {
  const [la, lb] = [luminance(a), luminance(b)];
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

/** WCAG AA の閾値。 large text = 24px 以上 or 太字 18.66px 以上。 */
export const requiredRatio = (px: number, weight: number): number =>
  px >= 24 || (weight >= 700 && px >= 18.66) ? 3.0 : 4.5;

export const at = (img: PNG, i: number): [number, number, number] => [
  img.data[i]!,
  img.data[i + 1]!,
  img.data[i + 2]!,
];

/** 画素を読む。 `clip` の範囲を撮って RGBA の配列で返す。 */
export async function shoot(page: Page, clip: Box): Promise<PNG> {
  // `floor(x)` と `ceil(width)` を組み合わせると右端 / 下端が欠ける (`x=0.9, w=10.9` で末尾
  // 0.8px が落ちる)。 端を先に丸めてから幅を出す。
  const left = Math.floor(clip.x), top = Math.floor(clip.y);
  const right = Math.ceil(clip.x + clip.width), bottom = Math.ceil(clip.y + clip.height);
  const buf = await page.screenshot({
    clip: { x: left, y: top, width: right - left, height: bottom - top },
  });
  return PNG.sync.read(buf);
}

/**
 * 文字の芯の色と、 その位置の地の色から対比を出す。
 *
 * ## 芯の採り方 = 最も濃く塗られた画素
 *
 * 変化量が最大の画素を採る。 そこが字が最も濃く乗っている場所で、 **指定された文字色に最も
 * 近い**。
 *
 * 「変化量の大きい画素群の中の最悪値」 を採る形は採らない。 小さい字はほぼ全ての画素が
 * anti-alias で地と混ざっており、 最悪値を採ると混色を測ることになる (実測で 12.37:1 の組が
 * 2.81:1 と出た)。
 *
 * WCAG の対比は指定された色で判定する。 anti-alias は rasterize の副産物で、 配色の問題では
 * ない。 1 つの文字列の中で字ごとに色が変わることは無いので、 最も濃い画素 1 つでその
 * 文字色を代表できる。
 *
 * ただし「最も濃い 1 画素」 だけを見ると「十分な対比の画素が 1 つある」 ことしか言えない。
 * 地が場所によって違えば (格子 / 模様 / 半透明の重なり)、 別の字は基準を割っているかも
 * しれない。 そこで **芯の候補それぞれを、 その画素の地と比べて最悪値を採る**。
 *
 * 拡大して撮っている前提なので芯の候補は実際に字で覆われた画素であり、 最悪値を採っても
 * anti-alias の混色を拾わない (等倍で同じことをすると 12.37:1 の組が 2.81:1 と出た)。
 *
 * @param 範囲 省略すると画像全体を見る。 渡すとその矩形の中だけを見る (画素の単位)。
 *   1 枚の大きな写しから複数の文字を測る時に使う。
 */
export function measure(visible: PNG, hidden: PNG, 範囲?: Box): Measured {
  const 芯 = cores(visible, hidden, 範囲);
  if (芯.kind !== "ok") return 芯;

  let worst: Measured | null = null;
  let worstRatio = Infinity;
  for (const { fg, bg } of 芯.画素) {
    const r = contrast(fg, bg);
    if (r < worstRatio) { worstRatio = r; worst = { kind: "ok", fg, bg, ratio: r }; }
  }
  return worst ?? { kind: "unmeasurable", reason: "候補なし" };
}

export type Cores =
  | { kind: "ok"; 画素: Array<{ fg: [number, number, number]; bg: [number, number, number] }> }
  | { kind: "invisible" }
  | { kind: "unmeasurable"; reason: string };

/**
 * 字の芯にあたる画素を返す。 `fg` は出した写しの色、 `bg` は隠した写しの色。
 *
 * **矩形の中を全部見てはいけない**。 要素の矩形には字が乗っていない場所も入り、 そこを通る
 * 枠線や隣の面を「地」 として拾う (実測 = 行番号の矩形の worst が `227,224,216` になり、
 * 実際の地 `245,244,239` より 2 段暗い所を見ていた)。 字が実際に覆った画素だけを見る。
 *
 * 芯の採り方の根拠は `measure` の説明を参照。
 */
export function cores(visible: PNG, hidden: PNG, 範囲?: Box): Cores {
  const w = Math.min(visible.width, hidden.width);
  const h = Math.min(visible.height, hidden.height);
  const x0 = Math.max(0, Math.floor(範囲?.x ?? 0));
  const y0 = Math.max(0, Math.floor(範囲?.y ?? 0));
  const x1 = Math.min(w, Math.ceil(範囲 ? 範囲.x + 範囲.width : w));
  const y1 = Math.min(h, Math.ceil(範囲 ? 範囲.y + 範囲.height : h));
  if (x1 <= x0 || y1 <= y0) return { kind: "unmeasurable", reason: "範囲が画像の外" };

  const diffs: Array<{ i: number; j: number; d: number }> = [];
  let maxDiff = 0;
  for (let y = y0; y < y1; y++) {
    for (let x = x0; x < x1; x++) {
      const i = (y * visible.width + x) * 4;
      const j = (y * hidden.width + x) * 4;
      const d = Math.abs(luminance(at(visible, i)) - luminance(at(hidden, j)));
      if (d > 0.001) diffs.push({ i, j, d });
      if (d > maxDiff) maxDiff = d;
    }
  }
  // 1 画素も変わっていなければ文字が見えていない。 対比 1:1 とすると「真っ黒な違反」 になる
  // ので分ける。
  if (maxDiff <= 0.001) return { kind: "invisible" };

  const core = diffs.filter((x) => x.d >= maxDiff * 0.97);
  if (core.length === 0) return { kind: "unmeasurable", reason: "字の芯を特定できない" };

  return { kind: "ok", 画素: core.map(({ i, j }) => ({ fg: at(visible, i), bg: at(hidden, j) })) };
}
