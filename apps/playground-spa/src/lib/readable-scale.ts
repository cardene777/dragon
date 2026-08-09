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
 * 箱が枠から出る図に限って譲る下限 (px、 #1102)。
 *
 * 10px を全図で下げると、 いま足りている見本まで巻き添えになる (実測 = `sequence` 10 → 8.7px、
 * `sequence-checkout` 10 → 9.2px、 `gantt` 10 → 9.7px)。 10px は `#1084` が「本文として
 * 読めない境界」 として置いた値なので、 守れる図では守る。
 */
export const READABLE_RELAXED_PX = 8;

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
 * 実際に使う倍率。 好ましい下限で箱が枠から出る図に限って、 譲れる下限まで下げる (#1102)。
 *
 * ## 判定に図の外枠を使ってはいけない
 *
 * 図の外枠は余白を含むため、 箱がすべて枠の中にある見本でも「収まらない」 と判定される
 * (実測 = `sequence` は外枠 886px で枠 840px を超えるが、 箱は 17 個すべて内側)。 外枠で
 * 分岐させると全図が譲る側に落ち、 下限を一律に下げたのと同じ結果になる (実測で 12 見本すべて
 * 一致した)。 判定は **箱の広がり** で行う。
 *
 * `boxesSpan` は「箱の右端 - 図の左端」 を倍率をかける前の px 座標で表したもの。 枠に収まらない
 * 図は左端に寄せられる (#1088) ため、 画面上の箱の右端はこの値に倍率を掛けた位置になる。
 *
 * ## 譲っても収まらないなら譲らない
 *
 * 譲った下限でも箱が枠から出るなら、 文字が小さくなるだけで見えない箱は見えないままになる。
 * それは損しかしないので好ましい下限に留める。 変更前 (`#1100` 時点) と同じ見え方になる。
 *
 * 測れない時 (`boxesSpan` が null / 枠幅が正でない) は好ましい下限を返す = 判定材料が無いことを
 * 理由に文字を小さくしない。
 */
export function readableScaleForFrame(args: {
  fitScale: number;
  minFontWorld: number;
  diagramK: number;
  boxesSpan: number | null;
  frameWidth: number;
  minPx?: number;
  relaxedPx?: number;
}): number {
  const {
    fitScale,
    minFontWorld,
    diagramK,
    boxesSpan,
    frameWidth,
    minPx = READABLE_MIN_PX,
    relaxedPx = READABLE_RELAXED_PX,
  } = args;
  const 好ましい = applyReadableFloor(fitScale, readableFloorScale(minFontWorld, diagramK, minPx));
  if (boxesSpan === null || !Number.isFinite(boxesSpan) || boxesSpan <= 0) return 好ましい;
  if (!Number.isFinite(frameWidth) || frameWidth <= 0) return 好ましい;
  if (boxesSpan * 好ましい <= frameWidth) return 好ましい;
  const 譲った = applyReadableFloor(fitScale, readableFloorScale(minFontWorld, diagramK, relaxedPx));
  if (boxesSpan * 譲った > frameWidth) return 好ましい;
  return 譲った;
}

/**
 * 「箱の右端 - 図の左端」 を、 倍率をかける前の px 座標で返す。 箱が 1 つも無ければ null。
 *
 * `getBBox` は利用者座標 (viewBox 単位) を返すので、 `pxPerViewBox` (= 図の pixel 幅 / viewBox
 * 幅) を掛けて px 座標に直す。 画面上の矩形 (`getBoundingClientRect`) を使うと、 その時点の
 * 倍率が混ざって候補倍率の判定に使えない。
 *
 * `boundsLeft` は図の左端 (パーツが図の外にあると負になる)。 枠に収まらない図はこの点が枠の
 * 左辺に来るように寄せられる (#1088) ため、 そこからの距離が画面上の箱の右端になる。
 */
export function boxesSpanPx(
  svg: SVGSVGElement | null | undefined,
  pxPerViewBox: number,
  boundsLeft: number,
): number | null {
  if (!svg) return null;
  if (!Number.isFinite(pxPerViewBox) || pxPerViewBox <= 0) return null;
  if (!Number.isFinite(boundsLeft)) return null;
  let 右端 = Number.NEGATIVE_INFINITY;
  for (const n of svg.querySelectorAll("[data-cdl-node]")) {
    if (typeof (n as SVGGraphicsElement).getBBox !== "function") continue;
    let b: DOMRect;
    try {
      b = (n as SVGGraphicsElement).getBBox();
    } catch {
      // 描画されていない節点は getBBox が投げる環境がある。 数えない
      continue;
    }
    if (!Number.isFinite(b.x) || !Number.isFinite(b.width) || b.width <= 0) continue;
    右端 = Math.max(右端, (b.x + b.width) * pxPerViewBox);
  }
  if (!Number.isFinite(右端)) return null;
  const span = 右端 - boundsLeft;
  return span > 0 ? span : null;
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
