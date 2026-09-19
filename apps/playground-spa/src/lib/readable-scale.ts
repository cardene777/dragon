/**
 * 「画面に収める」 倍率に、 文字が読める下限を入れる (#1084)。
 *
 * 収める計算は枠に対する比 (`min(枠幅/図幅, 枠高/図高)`) で決まる。 横長の図では幅が上限を
 * 決めるため、 縦の空白を残したまま極端に縮む。 実測 (窓 1440×900、 絵の枠 688×840) で
 * 見本「利用者登録」 は 23% になり、 枠の高さ 840 のうち 97 しか使わずに文字が 4.6px まで
 * 縮んだ。 読めない全体表示は情報を持たない。
 *
 * ## 下限は「文字の大きさ」 から決める
 *
 * 図の大きさから決めてはいけない。 同じ幅でも、 文字を大きく持つ図と小さく持つ図では読める
 * 倍率が違う (実測 = 世界座標の最小文字は 11 から 24 まで散る)。 文字そのものを基準にすれば
 * どの図でも同じ「読めるかどうか」 で揃う。
 */
import { axisOffset } from "./fit-anchor";

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
 * 一致した)。 判定は **箱の右端が画面のどこに来るか** で行う。
 *
 * ## 画面上の位置は `axisOffset` が決める
 *
 * 箱の右端に倍率を掛けただけでは足りない。 実際の位置は直後の `axisOffset` (#1088) が決めており、
 * 枠に収まる図は中央に置かれるため右端が `(枠 - 図) / 2` だけ右へずれる。 収まらない図だけが
 * 左端に寄る。 判定と配置で別の式を使うと両者がずれるので、 **配置と同じ関数** を判定にも使う。
 *
 * Round 1 review はこのずれを実測で示した = 3 段の swimlane で名前を 14 文字にすると、 譲った
 * 倍率でも中央寄せの分で箱が枠から 10.7px 外に残り、 文字だけ小さくなっていた。
 *
 * ## 譲っても収まらないなら譲らない
 *
 * 譲った下限でも箱が枠から出るなら、 文字が小さくなるだけで見えない箱は見えないままになる。
 * それは損しかしないので好ましい下限に留める。 変更前 (`#1100` 時点) と同じ見え方になる。
 *
 * 測れない時 (`boxesRight` が null / 枠幅が正でない / 囲んだ範囲が取れない) は好ましい下限を
 * 返す = 判定材料が無いことを理由に文字を小さくしない。
 */
export function readableScaleForFrame(args: {
  fitScale: number;
  minFontWorld: number;
  diagramK: number;
  /** 箱の右端。 倍率をかける前の px 座標で、 図の左上を原点とする */
  boxesRight: number | null;
  /** 囲んだ範囲の左端。 図の外にパーツがあると負になる (倍率をかける前の px) */
  boundsLeft: number;
  /** 囲んだ範囲の幅 (倍率をかける前の px) */
  boundsWidth: number;
  frameWidth: number;
  minPx?: number;
  relaxedPx?: number;
}): number {
  const {
    fitScale,
    minFontWorld,
    diagramK,
    boxesRight,
    boundsLeft,
    boundsWidth,
    frameWidth,
    minPx = READABLE_MIN_PX,
    relaxedPx = READABLE_RELAXED_PX,
  } = args;
  const 好ましい = applyReadableFloor(fitScale, readableFloorScale(minFontWorld, diagramK, minPx));
  if (boxesRight === null || !Number.isFinite(boxesRight)) return 好ましい;
  if (!Number.isFinite(boundsLeft) || !Number.isFinite(boundsWidth) || boundsWidth <= 0) {
    return 好ましい;
  }
  if (!Number.isFinite(frameWidth) || frameWidth <= 0) return 好ましい;

  /** その倍率で置いた時、 箱の右端が枠の中に入るか */
  const 収まる = (scale: number): boolean => {
    if (!Number.isFinite(scale) || scale <= 0) return true;
    const tx = axisOffset({
      frame: frameWidth,
      content: boundsWidth * scale,
      origin: boundsLeft * scale,
    });
    return boxesRight * scale + tx <= frameWidth;
  };

  if (収まる(好ましい)) return 好ましい;
  const 譲った = applyReadableFloor(fitScale, readableFloorScale(minFontWorld, diagramK, relaxedPx));
  return 収まる(譲った) ? 譲った : 好ましい;
}

/**
 * 幅だけで器に合わせる場所で、収めると文字が読めなくなる図に使う倍率 (#2269)。
 *
 * ひな形の詳細のように **縦に伸びる台** では、収める倍率は器の幅だけで決まる。
 * `readableScaleForFrame` が要る判定 (箱が枠から出るか) はここでは要らない =
 * 台から出た分はドラッグとホイールで辿れるので、譲る下限へ落とす理由が無い。
 *
 * ## 土台に「いま描かれている倍率」 を渡してはいけない
 *
 * 描かれている倍率は、下限で幅を与えた後は **与えた倍率そのもの** になる。 それを土台に判定すると
 * 「もう下限に届いている」 と読んで幅を外し、外した次の測りでまた割って幅を与える =
 * 2 つの状態を行き来する (実測で同じ画面が 2.9px と 10.0px の間で揺れた)。
 *
 * 渡すのは **器の幅**。 図に幅を与えても器の幅は変わらないので、何度測っても同じ値を返す。
 *
 * ## 返り値
 *
 * 収める倍率で既に下限へ届いている図は `undefined` = 呼出側は今まで通り器に合わせる。
 * 測れていない値 (文字が 1 つも無い / 器の幅や viewBox の幅が正でない) も `undefined` に倒す
 * = 測れないことを理由に図の大きさを動かさない。
 */
export function readableScaleForWidth(args: {
  /** 器 (巻き取る要素) の内側の幅 (px) */
  frameWidth: number;
  /** 図の viewBox の幅。 描けない図では `undefined` */
  viewBoxWidth: number | undefined;
  /** 図の中で最も小さい文字 (世界座標)。 測れていなければ `undefined` */
  minFontWorld: number | undefined;
  minPx?: number;
  maxScale?: number;
}): number | undefined {
  const {
    frameWidth,
    viewBoxWidth,
    minFontWorld,
    minPx = READABLE_MIN_PX,
    maxScale = READABLE_MAX_SCALE,
  } = args;
  if (minFontWorld === undefined || !Number.isFinite(minFontWorld) || minFontWorld <= 0) {
    return undefined;
  }
  if (viewBoxWidth === undefined || !Number.isFinite(viewBoxWidth) || viewBoxWidth <= 0) {
    return undefined;
  }
  if (!Number.isFinite(frameWidth) || frameWidth <= 0) return undefined;
  const 収める倍率 = frameWidth / viewBoxWidth;
  const 下限 = applyReadableFloor(
    収める倍率,
    readableFloorScale(minFontWorld, 1, minPx),
    maxScale,
  );
  return 下限 > 収める倍率 ? 下限 : undefined;
}

/**
 * 箱の右端を、 倍率をかける前の px 座標で返す。 箱が 1 つも無ければ null。
 *
 * `getBBox` は利用者座標を返すので 2 段の変換が要る。 まず `viewBoxX` を引いて図の左上を原点に
 * 直し、 次に `pxPerViewBox` (= 図の pixel 幅 / viewBox 幅) を掛けて px 座標にする。
 *
 * **`viewBoxX` を引き忘れてはいけない**。 実データの `sequence` は `viewBox.x = -44` で、 引かないと
 * 右端を 44 利用者単位ぶん手前に見積もる (Round 1 review の指摘)。 原点がずれた値を
 * 図の左端を 0 とする枠と比べることになり、 判定が枠幅の側へ甘くなる。
 *
 * 画面上の矩形 (`getBoundingClientRect`) は使わない。 その時点の倍率が混ざり、 候補倍率での
 * 判定に使えない。
 */
export function boxesRightPx(
  svg: SVGSVGElement | null | undefined,
  pxPerViewBox: number,
  viewBoxX: number,
): number | null {
  if (!svg) return null;
  if (!Number.isFinite(pxPerViewBox) || pxPerViewBox <= 0) return null;
  if (!Number.isFinite(viewBoxX)) return null;
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
    右端 = Math.max(右端, (b.x + b.width - viewBoxX) * pxPerViewBox);
  }
  return Number.isFinite(右端) ? 右端 : null;
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
