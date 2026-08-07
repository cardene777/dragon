/**
 * 「画面に収める」 倍率に、 文字が読める下限を入れる (#1084)。
 *
 * 収める計算は枠に対する比 (`min(枠幅/図幅, 枠高/図高)`) で決まる。 横長の図では幅が上限を
 * 決めるため、 縦の空白を残したまま極端に縮む。 実測 (窓 1440×900、 絵の枠 688×840) で
 * 見本「Client登録」 は 23% になり、 枠の高さ 840 のうち 97 しか使わずに文字が 4.6px まで
 * 縮んだ。 読めない全体表示は情報を持たない。
 *
 * ## 下限は「文字の大きさ」 から決める
 *
 * 図の大きさから決めてはいけない。 同じ幅でも、 文字を大きく持つ図と小さく持つ図では読める
 * 倍率が違う (実測 = 世界座標の最小文字は 11 から 24 まで散る)。 文字そのものを基準にすれば
 * どの図でも同じ「読めるかどうか」 で揃う。
 */

/** 画面上でこれを下回ると本文として読めない (px)。 */
export const READABLE_MIN_PX = 10;

/**
 * 100% を超えて引き伸ばさない。
 *
 * 下限は「小さすぎるのを止める」 ための床であって、 実寸より大きく見せる仕組みではない。
 * 上限を置かないと、 文字を小さく持つ図が実寸の何倍にも膨らむ。
 */
export const READABLE_MAX_SCALE = 1;

/**
 * 文字が読める最小の表示倍率。
 *
 * `minFontWorld` は図の中で最も小さい文字の大きさ (世界座標)。 `diagramK` は図そのものの倍率
 * (記法の `viewport.scale`) で、 画面上の文字は `minFontWorld * diagramK * 表示倍率` になる。
 *
 * 測れない時 (文字が 1 つも無い / 値が数でない) は 0 を返す = 下限を課さない。 測れないことを
 * 理由に倍率を動かすと、 根拠の無い拡大になる。
 */
export function readableFloorScale(
  minFontWorld: number,
  diagramK: number,
  minPx: number = READABLE_MIN_PX,
): number {
  if (!Number.isFinite(minFontWorld) || minFontWorld <= 0) return 0;
  if (!Number.isFinite(diagramK) || diagramK <= 0) return 0;
  if (!Number.isFinite(minPx) || minPx <= 0) return 0;
  return minPx / (minFontWorld * diagramK);
}

/**
 * 収める倍率と読める下限を合わせた、 実際に使う倍率。
 *
 * 下限は上限 (既定 100%) で頭打ちにしてから比べる。 先に比べると、 文字を極端に小さく持つ図で
 * 下限が 100% を大きく超え、 実寸より膨らんだまま採用される。
 *
 * 収める倍率が既に下限より大きい図では何も起きない (縦長の図はここに落ちる)。
 */
export function applyReadableFloor(
  fitScale: number,
  floorScale: number,
  maxScale: number = READABLE_MAX_SCALE,
): number {
  if (!Number.isFinite(fitScale) || fitScale <= 0) return fitScale;
  if (!Number.isFinite(floorScale) || floorScale <= 0) return fitScale;
  const capped = Math.min(floorScale, maxScale);
  return Math.max(fitScale, capped);
}

/**
 * 画面に出ていない文字か。 `display: none` / `visibility: hidden` / 透明度 0 の 3 形を見る。
 *
 * 見えていない文字を数えると、 誰も読まない文字のために図が大きくなる。 実測では見本
 * 「プロジェクト構想」 に `display: none` の 20 の文字があり、 見えている最小 (24) ではなく
 * そちらが下限を決めていた (42% で足りるところが 50% になっていた)。
 *
 * 大きさ 0 の枠は判定に使わない。 描画のある環境では見えない文字と一致するが、 枠を持たない
 * 環境 (単体テストの仮想 DOM) では全ての文字が 0 になり、 判定が全消しになる。
 */
function 見えない(t: Element): boolean {
  if (typeof globalThis.getComputedStyle !== "function") return false;
  const cs = globalThis.getComputedStyle(t);
  if (cs.display === "none") return true;
  if (cs.visibility === "hidden" || cs.visibility === "collapse") return true;
  const op = Number.parseFloat(cs.opacity);
  return Number.isFinite(op) && op === 0;
}

/**
 * 図の中で最も小さい文字の大きさ (世界座標)。 1 つも取れなければ 0。
 *
 * `getComputedStyle` を先に見る。 cdl は文字の大きさを CSS でも属性でも書くため、 属性だけを
 * 見ると CSS 側で決まっている図で拾えない。 逆に属性だけの図もあるので、 計算値が取れない時は
 * 属性に落ちる。
 *
 * 数えないものが 2 つある。 空文字の `<text>` は位置合わせのために置かれた中身の無い節点で、
 * 数えると「読めない文字」 が実在しないのに下限が上がる。 画面に出ていない文字も同じ理由で
 * 数えない (`見えない` の説明を参照)。
 */
export function smallestFontWorld(svg: SVGSVGElement | null | undefined): number {
  if (!svg) return 0;
  let min = Number.POSITIVE_INFINITY;
  for (const t of svg.querySelectorAll("text")) {
    if ((t.textContent ?? "").trim().length === 0) continue;
    if (見えない(t)) continue;
    let size = Number.NaN;
    if (typeof globalThis.getComputedStyle === "function") {
      size = Number.parseFloat(globalThis.getComputedStyle(t).fontSize);
    }
    if (!Number.isFinite(size) || size <= 0) {
      size = Number.parseFloat(t.getAttribute("font-size") ?? "");
    }
    if (!Number.isFinite(size) || size <= 0) continue;
    min = Math.min(min, size);
  }
  return Number.isFinite(min) ? min : 0;
}
