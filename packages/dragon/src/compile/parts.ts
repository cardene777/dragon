import { layout, parseFormula } from "@cardenelabs/cdl";
import type { CdlDiagram, CdlEdge, FormulaAst, LaidDiagram } from "@cardenelabs/cdl";
import { isColorValue } from "../color";
import { parseFocusEntry } from "../focus";
import { MAX_INPUT_ELEMENTS, countDiagramElements } from "../input-size";
import { type AnchorBox } from "../relative-pos";
import type { DslActor, DslDocument, DslStep } from "../types";
import { deepRewriteStrings } from "./deep-rewrite";
import { recordDerivedSourceLine } from "./derived-source";
import type { CompileNotice } from "./notice";
import { lookupPartRaw } from "./parts-lookup";
import { PLACEMENT_TOLERANCE } from "./placement";
import { slugify } from "./slug";
import { truncateForMessage } from "./subtitle";
import { 近い名前 } from "../near-name";
import { NODE_KIND_VALID } from "../v05/parser";
/**
 * 見本 (parts) の取り込み (#2034 で `compile.ts` から移した)。
 *
 * 見本帳から引いた 1 つの図を、本文の図に重ねて 1 枚にする。 移した時点で
 * `compile.ts` の 38% を占めていた区画で、その中の宣言はここで閉じている。
 *
 * 外へ出す口は 4 つ。 入口 (`compileToCdl`) が呼ぶ `mergePartsFromActors` と
 * `reportPartNodeNotHonored`、相対の配置 (`resolveRelativeDoc`) が呼ぶ `partBoxes` と
 * `partSizes`。 残りはこの file の中だけで使う。
 *
 * ほかに `index.ts` と画面が読む宣言も持つ。 それらは `compile.ts` が再輸出するので、
 * 取り込む側の書き方は変わらない。
 */

/**
 * catalog からパーツ 1 個の図を引く。
 *
 * `Object.hasOwn` で引く。 素の添字だと `__proto__` 等の既定の持ち物が引けてしまう
 * (catalog は呼出側が渡す untrusted な値)。
 *
 * **測れない図は「無い」 として扱う** (#1015)。 大きさを測れないまま取り込むと、既定の
 * 400x200 の枠を確保した場所に中身が全て展開される。 上限を置いた目的 (大きすぎる入力で
 * 止まらないようにする) も達成されない。
 */
function lookupPart(
  partsCatalog: Record<string, CdlDiagram>,
  partId: string | undefined,
): CdlDiagram | undefined {
  const found = lookupPartRaw(partsCatalog, partId);
  if (found === undefined) return undefined;
  return partIsMeasurable(found) ? found : undefined;
}

/**
 * この図を取り込んでよいか (#1015)。
 *
 * 見るのは **要素数が上限 (`MAX_INPUT_ELEMENTS`) を超えていないこと** だけ。
 * 超えた図を取り込むと、既定の 400x200 の枠を確保した場所に中身が全て展開される。
 * 上限を置いた意図 (大きすぎる入力で止まらないようにする) も達成されない。
 *
 * **配置計算が通るかは見ない**。 取り込みは lane を張り替えるため、単体では配置計算が
 * 通らない図でも取り込みは成功する (実測 = 存在しない lane を指す箱を持つ見本が、
 * 取り込み後は正しい lane に載った)。 配置計算で弾くと、動いている本文が描けなくなる。
 */
export function partIsMeasurable(part: CdlDiagram): boolean {
  return countDiagramElements(part) <= MAX_INPUT_ELEMENTS;
}

/**
 * 箱の大きさを書かなかった時に cdl が使う値。
 *
 * 幅は実測で 340 固定 (縦列の幅を変えても変わらない)。 高さは種類で変わるため、 よく使われる
 * 値を既定にする。 パーツの図が大きさを書いていれば、 こちらは使われない。
 */
const CDL_DEFAULT_NODE_W = 340;

const CDL_DEFAULT_NODE_H = 200;

/** 有限で正の数だけを通す。 catalog は呼出側が渡す値なので、 異常値を計算に入れない。 */
function positiveOr(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) && value > 0 ? value : fallback;
}

/**
 * 配列の最大値 / 最小値。 spread で展開しない (要素数が多い catalog で stack が溢れる)。
 *
 * 空の時だけ既定値を返す。 既定値を初期値にすると、 全要素が既定値より小さい (大きい) 時に
 * 存在しない値を範囲に含める (実測 = stack 5 だけのパーツで 0 を含め、 高さが 5 段分になった)。
 */
function maxOf(values: readonly number[], fallback: number): number {
  if (values.length === 0) return fallback;
  let out = values[0]!;
  for (const v of values) if (v > out) out = v;
  return out;
}

function minOf(values: readonly number[], fallback: number): number {
  if (values.length === 0) return fallback;
  let out = values[0]!;
  for (const v of values) if (v < out) out = v;
  return out;
}

/**
 * 段 1 つぶんの送り幅。 2 つの用途で使う。
 *
 * - `大きさ:` の縦の基準 (`partScaleBase`)。 縦は段の送り幅の合計に対する倍率で掛かる
 * - 部品の頁を配置できない部品を、書いた値で置く時の段の間 (`書いた置き方`)
 *
 * 頁を配置できる部品の要素の縦位置は、頁で配置した位置から取る (#1992)。 この値で置くと、
 * 頁で段の間が 220 より広い部品 (実測 = `bind-grid-4` は段の中心の間 280) が置いた図で詰まる。
 */
const PART_STACK_PITCH = 220;

/**
 * 倍率の上限 (#1020)。
 *
 * 図枠は数百 world 単位なので、1000 倍で数十万になる。 これを超える倍率は画面上で意味を持たず、
 * 掛けた先が非有限になる危険だけが残る。
 */
export const MAX_PART_SCALE = 1000;

/**
 * 本文に書かれた倍率を、描ける値に直す (#1020 / #1026)。
 *
 * 記法は `倍率: -2` も `倍率: 0` も、桁が溢れて `Infinity` になる値も書ける。 置き場所と
 * 描画で別々に直すと、同じ見本が「置き場所は等倍・画面では消える」 状態になる (実測 =
 * `scale: 0` が等倍の場所を占めるのに画面には出なかった)。 読んだ時点で直す。
 *
 * **画面側と組み立て側の両方から呼ぶ**。 別々に持つと、同じ本文が経路で別の絵になる (#1026)。
 */
export function normalizePartScale(value: number): number {
  if (!Number.isFinite(value) || value <= 0) return 1;
  return Math.min(value, MAX_PART_SCALE);
}

/**
 * `大きさ:` と `倍率:` を合成した最終の伸縮率 (#1026)。
 *
 * **上限は合成した後に 1 度だけ掛ける**。 率ごとに掛けると、`大きさ:` 由来 1000 倍と
 * `倍率: 2` で合わせて 2000 倍になり、1 度だけ掛ける経路 (1000 倍) と食い違う (実測)。
 *
 * 基準は `大きさ:` と同じ物差し (縦列の外接矩形と段の送り幅)。 図枠を基準にすると、
 * 図枠と外接矩形の差のぶんだけ余分に掛かる (実測 = 3 倍と書いて 4.0875 倍になった)。
 *
 * 画面側 (重ねて描く時の `transform`) と組み立て側 (取り込む時の伸縮) が同じ値を使う。
 */
export function partScaleFactor(
  part: CdlDiagram,
  posW: number | undefined,
  posH: number | undefined,
  scale: number | undefined,
): { x: number; y: number } {
  const base = partScaleBase(part);
  const k = scale === undefined ? 1 : normalizePartScale(scale);
  const rx = posW !== undefined && posW > 0 ? posW / base.w : 1;
  const ry = posH !== undefined && posH > 0 ? posH / base.h : 1;
  return { x: normalizePartScale(rx * k), y: normalizePartScale(ry * k) };
}

/**
 * 見本 1 件の狙いの大きさ (#1026)。
 *
 * 合成した率を基準に掛けて返す。 取り込み側はこの値から自分で率を出し直すため、
 * ここで上限を掛けておかないと「見積りは上限どまり・実体は青天井」 になる (実測 =
 * 見積り 1000 倍に対して実体 10000 倍)。
 *
 * 何も書かれていない辺は「狙いなし」 のまま返す。 基準の値を入れると、取り込み側が
 * 自前で測る外接矩形との差だけ伸縮が掛かってしまう。
 */
export function partTargetSize(
  part: CdlDiagram,
  posW: number | undefined,
  posH: number | undefined,
  scale: number | undefined,
): { w: number | undefined; h: number | undefined } {
  if (posW === undefined && posH === undefined && scale === undefined) {
    return { w: undefined, h: undefined };
  }
  const base = partScaleBase(part);
  const f = partScaleFactor(part, posW, posH, scale);
  return {
    w: posW === undefined && scale === undefined ? undefined : base.w * f.x,
    h: posH === undefined && scale === undefined ? undefined : base.h * f.y,
  };
}

/**
 * `大きさ:` と `倍率:` が掛かる時の基準の大きさ (#1026)。
 *
 * 横は部品の頁で配置した縦列の外接矩形 (`部品の置き方を読む`)、縦は段の送り幅の合計。
 * **図枠 (`partRenderSize`) ではない**。 図枠は余白を含むため、これを基準にすると書いた倍率より
 * 大きく掛かる。
 *
 * 横を頁の縦列にするのは、組み込みが要素を頁の縦列に沿って置くため (#1992)。 書いた縦列を
 * 基準のまま残すと、頁で縦列が広がる部品は `大きさ:` に書いた幅より広く描かれる。
 *
 * `partTargetScale` と `partTargetSize` が同じ物差しを使うことで、
 * `partTargetScale(part, base.w * k, base.h * k)` が丁度 `k` 倍を返す関係が保たれる。
 * 組み込み (`mergePartIntoDiagram`) も同じ基準で伸縮する。
 */
function partScaleBase(part: CdlDiagram): { w: number; h: number } {
  const nodes = Array.isArray(part.nodes) ? part.nodes : [];
  const stacks = nodes.map((n) =>
    typeof n.stack === "number" && Number.isFinite(n.stack) ? n.stack : 0,
  );
  return {
    w: 部品の置き方を読む(part).幅,
    h: Math.max(1, (maxOf(stacks, 0) - minOf(stacks, 0) + 1) * PART_STACK_PITCH),
  };
}

/**
 * `大きさ:` を書いた時に、見本を何倍にするか (#1018)。
 *
 * 横は縦列の幅、縦は段の数から出す。 どちらも書かなければ 1 倍。
 *
 * **縦は「書いた高さにする」 ではなく「段の送り幅の合計に対する倍率」**。 `大きさ: 2000,300` を
 * 1 段の見本に書くと、横は 2000 になるが縦は 300 ではなく 409 になる (段の送り幅 220 に対して
 * 300 なので 1.36 倍、それが箱の高さ 300 に掛かる)。 意図した仕様かは怪しいが、既に本文が
 * この前提で書かれているため変えない。 画面側も同じ規則で拡大する。
 *
 * 組み立て側 (`partExtent`) と画面側 (playground) の両方から呼ぶ。 別々に持つと、`大きさ:` を
 * 書いた見本だけ経路で大きさが変わる。
 */
export function partTargetScale(
  part: CdlDiagram,
  targetW?: number,
  targetH?: number,
): { x: number; y: number } {
  const none = { x: 1, y: 1 };
  if (!Array.isArray(part.lanes) || !Array.isArray(part.nodes)) return none;
  // 箱が 1 つも無い図でも縦列があれば取り込み側は伸縮する。 ここで 1 に倒すと、
  // 箱を持たない外部の見本だけ画面が等倍のまま残る

  // 倍率を書かない場合の合成率。 上限の掛け方を 1 箇所に閉じるため同じ関数を通す
  return partScaleFactor(part, targetW, targetH, undefined);
}

/**
 * パーツ 1 個が図の上で占める外接矩形。
 *
 * `w` / `h` は大きさ、 `dx` / `dy` は矩形の中心が「merge に渡す座標」 からどれだけずれるか。
 *
 * merge がパーツを置く時に基準にするのは段の中心で、 外接矩形の中心とは一致しない。 段ごとに
 * 箱の高さが違うと、 上下の伸び方が非対称になるため (実測 = 段 0 に高さ 50、 段 5 に高さ 200 の
 * パーツで中心が 37.5 下にずれる)。 ずれを返して呼ぶ側が引く。
 *
 * 箱ごとに位置と大きさを見る。 一番高い箱の高さと段の数から概算すると実際の矩形と合わない
 * (実測 = 段 5 だけのパーツで 200 空けたいところが 750、 段 0,5 で高さが違うと 275 になった)。
 *
 * 箱の位置は merge と同じ置き方 (`部品の置き方を読む`) と同じ式 (`部品の要素のずれ`) から出す。
 * ここで見たいのは「merge がどこに置くか」 なので、merge と別の規則を持たない (#1992)。
 */
function partExtent(
  part: CdlDiagram,
  targetW?: number,
  targetH?: number,
): { w: number; h: number; dx: number; dy: number } {
  const fallback = { w: 400, h: 200, dx: 0, dy: 0 };
  if (!Array.isArray(part.lanes) || !Array.isArray(part.nodes)) return fallback;
  if (part.nodes.length === 0) return fallback;

  const 置き方 = 部品の置き方を読む(part);
  const { x: scaleX, y: scaleY } = partTargetScale(part, targetW, targetH);

  // 箱ごとに、 merge が置く位置 (基準からの相対) と大きさから上下左右の端を出す
  const tops: number[] = [];
  const bottoms: number[] = [];
  const lefts: number[] = [];
  const rights: number[] = [];
  part.nodes.forEach((n, i) => {
    const 頁 = 置き方.要素[i] ?? { x: 置き方.左端 + 置き方.幅 / 2, y: 0 };
    const { dx: cx, dy: cy } = 部品の要素のずれ(n, 頁, 置き方, scaleX, scaleY);
    const halfW = (positiveOr(n.w, CDL_DEFAULT_NODE_W) * scaleX) / 2;
    const halfH = (positiveOr(n.h, CDL_DEFAULT_NODE_H) * scaleY) / 2;
    lefts.push(cx - halfW);
    rights.push(cx + halfW);
    tops.push(cy - halfH);
    bottoms.push(cy + halfH);
  });
  const x0 = minOf(lefts, 0);
  const x1 = maxOf(rights, 400);
  const y0 = minOf(tops, 0);
  const y1 = maxOf(bottoms, 200);

  return {
    w: positiveOr(x1 - x0, 400),
    h: positiveOr(y1 - y0, 200),
    dx: Number.isFinite((x0 + x1) / 2) ? (x0 + x1) / 2 : 0,
    dy: Number.isFinite((y0 + y1) / 2) ? (y0 + y1) / 2 : 0,
  };
}

/**
 * パーツ 1 個が実際に描かれる大きさ (#937)。
 *
 * 図枠 (`viewBox`) を返す。 箱の外接矩形 (`partVisualSize`) ではない。 2 つは別物で、
 * 実測では図枠 525x520 に対し箱 380x400 と余白の分だけ違う。 SVG は図枠を基準に
 * `preserveAspectRatio` で収めるため、 箱の値を渡すと縮んで描いた大きさと食い違う
 * (実測 = achievement が箱の値で描くと約 275x275 になった)。
 *
 * 箱を持たないパーツ (実体が操作パネルの部品である 17 件) でも図枠は出る。 箱だけを見ると
 * 1x1 になり、 その値で描くと潰れる。
 *
 * ただし **図枠は場所を確保するだけで、図の中に何か描かれることは保証しない**。 上の 17 件は
 * 図の中に描く部品を持たず、重ねても図には出ない (`partDrawsInDiagram`、#1017)。
 *
 * 画面が描く大きさと、 組み立て側の格子が確保する場所の両方がこれを見る。 別々の物差しを
 * 持っていた頃は、 同じ本文でも通った経路でパーツの位置が変わっていた (#937)。
 *
 * 組み立てに失敗する図では、 既定の大きさに落とす (呼出側は catalog を渡すので通常起きない)。
 */
export function partRenderSize(part: CdlDiagram): { w: number; h: number } {
  const g = partFrameGeometry(part);
  return { w: g.w, h: g.h };
}

/**
 * この見本が、図の中に描かれる部品を持っているか (#1017)。
 *
 * 見本の中には実体が **操作パネルの部品** (`readouts`) だけのものがある。 配置計算も描画も
 * `readouts` を図の中では扱わないため、図として重ねても何も出ない。 位置決めのための
 * 1x1 の箱が 1 つあるだけになる。
 *
 * catalog 80 件を測ると、この 2 群は `readouts` の有無で完全に分かれた。
 * `readouts` を持つ 17 件は箱と図枠の面積比が全件 0.0000 (箱は 1x1)、
 * 持たない 63 件は最小でも 0.1877。 境目に入る件は無い。
 *
 * 判定は面積の閾値ではなく **`readouts` を持ち、かつ箱が図枠に対して極小** の 2 条件で行う。
 * 閾値だけで見ると、小さい箱を意図して置いた見本を巻き込む。 `readouts` だけで見ると、
 * 箱も実体も両方持つ見本 (現状 0 件だが作れる) を誤って弾く。
 *
 * 測れない図では「持っている」 側に倒す。 弾く側に倒すと、測れないだけの見本が使えなくなる。
 */
export function partDrawsInDiagram(part: CdlDiagram): boolean {
  const readouts = (part as { readouts?: unknown }).readouts;
  if (!Array.isArray(readouts) || readouts.length === 0) return true;
  const g = partFrameGeometry(part);
  if (!(g.w > 0) || !(g.h > 0)) return true;
  // 箱が図枠の 1% にも満たなければ、実体は図の外にある。
  //
  // **辺ごとに割ってから掛ける**。 面積を先に出すと桁の大きい図で溢れ、判定が反転する
  // (実測 = 箱 1.7e305 x 1e4 / 図枠 1.7e308 x 1e4 は比 0.001 で「描かない」 が正しいのに、
  // 面積を先に出すと Infinity / Infinity = NaN になって「描く」 に倒れた)。
  //
  // それでも出せない時は「持っている」 側に倒す。 弾く側に倒すと、
  // 測れないだけの見本が使えなくなる
  const ratio = (g.boxW / g.w) * (g.boxH / g.h);
  if (!Number.isFinite(ratio)) return true;
  return ratio >= 0.01;
}

/**
 * 図枠の中で、 箱の外接矩形がどこにどれだけの大きさで描かれるか (#1014)。
 *
 * `left` / `top` は図枠の左上からの余白、 `w` / `h` は箱の大きさ。 図枠は 1 対 1 で描かれるので、
 * 画面上の箱の位置は「図枠の左上 + `left`/`top`」 になる。
 *
 * 相対で書いた位置 (`位置: Web の右 200`) の間隔は、 見えている箱の縁から測る。 図枠の縁で
 * 測ると余白のぶんだけ広がる (実測 = 200 と書いて画面では 260 空いた)。 画面側が間隔を解く時に
 * 図枠ではなくこちらを使うことで、 組み立て側と同じ間隔になる。
 *
 * 測れない図では図枠と同じ大きさ・余白 0 を返す。 箱を持たない図でも同じで、 図枠がそのまま
 * 箱として扱われる。
 */
export function partBoxInFrame(part: CdlDiagram): {
  w: number;
  h: number;
  left: number;
  top: number;
} {
  const g = partFrameGeometry(part);
  return { w: g.boxW, h: g.boxH, left: g.left, top: g.top };
}

/**
 * 見本 1 個の図枠と、 その中の箱の外接矩形 (位置と大きさ)。
 *
 * 図枠の大きさ・余白・箱の大きさは同じ配置計算から出るので、 1 回で全部を取る。 別々に呼ぶと
 * 同じ図を何度も組み立てることになり、 パーツを 1 個置くたびに配置計算が 2 回走る。
 *
 * 結果は見本ごとに覚えておく。 catalog の見本は複数の別名から同じものを指すため、 覚えないと
 * 別名の数だけ組み立て直す (相対指定があると 1 個につき 4 回になる)。 覚えるのは大きさだけで、
 * 色などの見た目は含まないため、 呼出側が色を差し替えても古い値にはならない。
 *
 * 配置は `部品の頁を配置する` から受け取る。 置き方 (`部品の置き方を読む`) も同じ配置を読むので、
 * 部品を 1 つ置いても配置は 1 度で済む。
 *
 * 測れない図では既定の大きさと余白 0 に落とす。
 */
type PartFrameGeometry = {
  w: number;
  h: number;
  left: number;
  top: number;
  boxW: number;
  boxH: number;
};

const PART_FRAME_CACHE = new WeakMap<CdlDiagram, PartFrameGeometry>();

function partFrameGeometry(part: CdlDiagram): PartFrameGeometry {
  const cached = PART_FRAME_CACHE.get(part);
  if (cached) return cached;
  const fallback = { w: 400, h: 200, left: 0, top: 0, boxW: 400, boxH: 200 };
  let out = fallback;
  const own = 部品の頁を配置する(part);
  if (own !== undefined) {
    const vb = own.viewBox;
    const w = positiveOr(vb.w, 400);
    const h = positiveOr(vb.h, 200);
    if (own.nodes.length === 0) {
      // 箱を持たない図では図枠をそのまま箱として扱う。 相対指定の間隔は図枠の縁から測る
      out = { w, h, left: 0, top: 0, boxW: w, boxH: h };
    } else {
      let x0 = Infinity;
      let y0 = Infinity;
      let x1 = -Infinity;
      let y1 = -Infinity;
      for (const n of own.nodes) {
        x0 = Math.min(x0, n.cx - n.w / 2);
        x1 = Math.max(x1, n.cx + n.w / 2);
        y0 = Math.min(y0, n.cy - n.h / 2);
        y1 = Math.max(y1, n.cy + n.h / 2);
      }
      const left = x0 - vb.x;
      const top = y0 - vb.y;
      out = {
        w,
        h,
        left: Number.isFinite(left) ? left : 0,
        top: Number.isFinite(top) ? top : 0,
        boxW: positiveOr(x1 - x0, w),
        boxH: positiveOr(y1 - y0, h),
      };
    }
  }
  PART_FRAME_CACHE.set(part, out);
  return out;
}

/**
 * 部品の頁 (部品の図だけ) を配置した結果。 配置できない図では `undefined` (#1992)。
 *
 * 図枠 (`partFrameGeometry`) と置き方 (`部品の置き方を読む`) が同じ結果を読む。 見本ごとに
 * 覚えておくのは、catalog の見本が複数の別名から同じものを指し、画面を描くたびにも呼ばれるため。
 *
 * 大きすぎる図は配置する前に止める。 上限は組み立て側と同じ物差しを使う (#1005)。
 * catalog の見本は数十要素なので通常は掛からない。
 */
const PART_PAGE_CACHE = new WeakMap<CdlDiagram, LaidDiagram | null>();

function 部品の頁を配置する(part: CdlDiagram): LaidDiagram | undefined {
  const cached = PART_PAGE_CACHE.get(part);
  if (cached !== undefined) return cached ?? undefined;
  let out: LaidDiagram | null = null;
  if (countDiagramElements(part) <= MAX_INPUT_ELEMENTS) {
    try {
      out = layout(part);
    } catch {
      out = null;
    }
  }
  PART_PAGE_CACHE.set(part, out);
  return out ?? undefined;
}

/**
 * 部品を図に置く時に、縦列と要素をどこに置くか (#1992)。
 *
 * 部品の頁で配置した縦列の位置と幅、要素の中心を使う。 組み込み (`mergePartIntoDiagram`)、
 * 組み込んだ大きさの見積り (`partExtent`)、`大きさ:` の横の基準 (`partScaleBase`) の 3 か所が
 * これを読む。
 *
 * 部品が書いた縦列の位置と幅は、頁で配置した後の値と違う。 描画側が隣と近づきすぎないよう
 * 縦列を広げ、段の間を箱の高さに合わせて取るため。 書いた値で置くと頁で空いた分が消え、
 * 置いた図だけが間隔の検査に掛かる (実測 = 80 種のうち 14 種。 `wifi-signal` は頁で要素の間 80、
 * 書いた値で置くと 40)。
 *
 * 頁を配置できない図 (描画側が止める図と、大きすぎて測らない図) は書いた値に落とす
 * (`書いた置き方`)。 頁の位置が数にならない図も同じ。 描画側は書いた値が数でない時に止めずに
 * 数でない座標を返す (実測 = 幅を書かない縦列は幅が `NaN`、段が数でない要素は縦が `-Infinity`)。
 *
 * 1 つの部品で 2 つを混ぜない。 数にならない縦列や要素が 1 つでもあれば全体を書いた値にする。
 * 混ぜると、要素ごとに別の物差しで置くことになる。
 */
type 部品の置き方 = {
  /** 縦列ごとの左端と幅 */
  縦列: ReadonlyMap<string, { x: number; w: number }>;
  /** 縦列の外接矩形の左端と幅。 横に写す時の中心と、`大きさ:` の横の基準に使う */
  左端: number;
  幅: number;
  /**
   * 要素ごとの中心 (`part.nodes` と同じ並び)。 横は縦列と同じ座標、縦は要素全体の縦の中心からの差。
   * どちらも伸縮を掛ける前の値
   */
  要素: readonly { x: number; y: number }[];
};

const 部品の置き方の控え = new WeakMap<CdlDiagram, 部品の置き方>();

function 部品の置き方を読む(part: CdlDiagram): 部品の置き方 {
  const 控え = 部品の置き方の控え.get(part);
  if (控え) return 控え;
  const 置き方 = 頁の置き方(part) ?? 書いた置き方(part);
  部品の置き方の控え.set(part, 置き方);
  return 置き方;
}

/**
 * 縦列の外接矩形。 幅が正でない時 (縦列が 1 本も無い図) は 400 に落とす。
 * 1 未満の正の幅はそのまま使う。 1 に切り上げると、その分だけ `大きさ:` の倍率が小さくなる
 */
function 縦列の外接(縦列: ReadonlyMap<string, { x: number; w: number }>): { 左端: number; 幅: number } {
  const 値 = [...縦列.values()];
  const 左端 = minOf(値.map((g) => g.x), 0);
  const 右端 = maxOf(値.map((g) => g.x + g.w), 400);
  return { 左端, 幅: positiveOr(右端 - 左端, 400) };
}

/**
 * 部品の頁で配置した縦列と要素の中心。 頁を配置できない時と、頁の位置が数にならない時は
 * `undefined` を返し、呼出側が書いた値に落とす。
 *
 * 縦の中心は、頁に並んだ要素全体の上下の中心 (一番上と一番下の要素の中心の中間)。 書いた値の
 * 経路が段の番号の中間を中心にするのと同じ取り方で、部品の中心を置く位置に合わせる。
 *
 * 部品の要素が頁に見つからない場合も書いた値に落とす。 描画側は部品の要素を全て配置して返す
 * ため、この場合に届く入力は作れない (実測 = カタログ 80 種で見つからない要素は 0)。 残すのは、
 * 見つからない要素だけを別の物差しで置かないため。
 */
function 頁の置き方(part: CdlDiagram): 部品の置き方 | undefined {
  if (!Array.isArray(part.lanes) || !Array.isArray(part.nodes)) return undefined;
  const laid = 部品の頁を配置する(part);
  if (laid === undefined) return undefined;
  const 縦列 = new Map<string, { x: number; w: number }>();
  for (const l of laid.lanes) {
    if (!Number.isFinite(l.x) || !Number.isFinite(l.width) || !(l.width > 0)) return undefined;
    縦列.set(l.id, { x: l.x, w: l.width });
  }
  const 頁の箱 = new Map(laid.nodes.map((n) => [n.id, n]));
  const 箱たち: { cx: number; cy: number }[] = [];
  for (const n of part.nodes) {
    const 箱 = 頁の箱.get(n.id);
    if (箱 === undefined || !Number.isFinite(箱.cx) || !Number.isFinite(箱.cy)) return undefined;
    箱たち.push(箱);
  }
  const 縦たち = 箱たち.map((b) => b.cy);
  const 縦の中心 = (minOf(縦たち, 0) + maxOf(縦たち, 0)) / 2;
  return {
    縦列,
    ...縦列の外接(縦列),
    要素: 箱たち.map((b) => ({ x: b.cx, y: b.cy - 縦の中心 })),
  };
}

/**
 * 部品が書いた値で置く時の縦列と要素の中心。 頁を配置できない部品だけが使う。
 *
 * 横は書いた縦列の中心、縦は段の番号に段の送り幅 (`PART_STACK_PITCH`) を掛けた位置。
 * 縦列の位置と幅は先に正す。 catalog は呼出側が渡す値で、生値のまま外接矩形を出すと
 * 拡大の基準が崩れて箱が桁違いに大きくなる (実測 = 指定間隔 200 が -31800 になった)。
 * 数でない段は 0 として扱う (#1018)。
 */
function 書いた置き方(part: CdlDiagram): 部品の置き方 {
  const lanes = Array.isArray(part.lanes) ? part.lanes : [];
  const nodes = Array.isArray(part.nodes) ? part.nodes : [];
  const 縦列 = new Map<string, { x: number; w: number }>();
  for (const l of lanes) {
    縦列.set(l.id, {
      x: typeof l.x === "number" && Number.isFinite(l.x) ? l.x : 0,
      w: positiveOr(l.width, 400),
    });
  }
  const stacks = nodes.map((n) =>
    typeof n.stack === "number" && Number.isFinite(n.stack) ? n.stack : 0,
  );
  const 中央の段 = (minOf(stacks, 0) + maxOf(stacks, 0)) / 2;
  return {
    縦列,
    ...縦列の外接(縦列),
    要素: nodes.map((n, i) => {
      const l = 縦列.get(n.lane) ?? { x: 0, w: 320 };
      return { x: l.x + l.w / 2, y: ((stacks[i] ?? 0) - 中央の段) * PART_STACK_PITCH };
    }),
  };
}

/**
 * 部品の要素 1 つの中心が、置く位置 (merge に渡す座標) からどれだけずれるか (#1992)。
 *
 * 組み込み (`mergePartIntoDiagram`) と見積り (`partExtent`) が同じ式を通る。 別々に書くと、
 * 格子が確保した場所と実際に置いた場所がずれる。
 *
 * 要素が自分で位置を書いていれば、その値を使う。 横は縦列と同じ写し方 (縦列の外接矩形の中心を
 * 置く位置に合わせて伸縮する) で写し、縦は置く位置に足すだけで伸縮を掛けない。
 */
function 部品の要素のずれ(
  node: { posX?: number; posY?: number },
  頁: { x: number; y: number },
  置き方: 部品の置き方,
  scaleX: number,
  scaleY: number,
): { dx: number; dy: number } {
  return {
    dx: ((node.posX ?? 頁.x) - (置き方.左端 + 置き方.幅 / 2)) * scaleX,
    dy: node.posY ?? 頁.y * scaleY,
  };
}

/**
 * パーツ 1 個が図の上で確保する図枠 (merge に渡す座標での表し方)。
 *
 * `w` / `h` は図枠の大きさ、 `dx` / `dy` は図枠の中心が「merge に渡す座標」 からどれだけ
 * ずれるか。 画面側は図枠をそのまま置くので、 格子が図枠で場所を決めれば 2 経路が揃う。
 *
 * **合わせるのは箱の中心ではなく左上**。 段を 2 つ以上持つパーツは、 取り込んだ後に本体の
 * 送り幅で並び直すため箱の高さが単体の時と変わる (実測 = 単体 300 が取り込むと 320)。
 * 中心で合わせると、 高さの差の半分だけ上端がずれて段内の揃いが崩れる (実測で 12.5)。
 * 左上で合わせれば、 高さが変わっても上端は動かない。
 *
 * 図枠にも箱にも `大きさ:` の伸縮を掛ける。 画面側も同じ率で伸縮するので、掛けないと
 * 確保する場所だけが元の大きさのまま残る (実測 = 240 ずれた、#1018)。
 *
 * 確保するのは図枠と箱の両方を含む矩形。 縦横で率が違うと箱が図枠からはみ出すことがあり、
 * 図枠だけを確保すると隣に重なる (実測 = `大きさ: 2000,300` の箱が x=60..2060 に伸び、
 * 隣が 725 から始まって 1335 重なった)。 `大きさ:` を書かなければ図枠が箱を包むので、
 * 和は図枠と一致して 2 経路の一致は保たれる。
 */
function partFrameExtent(
  part: CdlDiagram,
  targetW?: number,
  targetH?: number,
): { w: number; h: number; dx: number; dy: number } {
  const box = partExtent(part, targetW, targetH);
  const geom = partFrameGeometry(part);
  // 図枠にも `大きさ:` の伸縮を掛ける。 掛けないと箱だけが伸びて、確保する場所が足りなくなる
  // (実測 = `大きさ: 2000,300` で組み立て側の箱が 60..2060、画面側が 300..2300 と 240 ずれた、#1018)
  const t = partTargetScale(part, targetW, targetH);
  const frame = {
    w: geom.w * t.x,
    h: geom.h * t.y,
    left: geom.left * t.x,
    top: geom.top * t.y,
  };
  // merge に渡す座標を原点にした時の、 図枠の中心
  const frameDx = box.dx + frame.w / 2 - frame.left - box.w / 2;
  const frameDy = box.dy + frame.h / 2 - frame.top - box.h / 2;
  const x0 = Math.min(frameDx - frame.w / 2, box.dx - box.w / 2);
  const x1 = Math.max(frameDx + frame.w / 2, box.dx + box.w / 2);
  const y0 = Math.min(frameDy - frame.h / 2, box.dy - box.h / 2);
  const y1 = Math.max(frameDy + frame.h / 2, box.dy + box.h / 2);
  return {
    w: positiveOr(x1 - x0, frame.w),
    h: positiveOr(y1 - y0, frame.h),
    dx: Number.isFinite((x0 + x1) / 2) ? (x0 + x1) / 2 : frameDx,
    dy: Number.isFinite((y0 + y1) / 2) ? (y0 + y1) / 2 : frameDy,
  };
}

/**
 * パーツ 1 個の箱の外接矩形。
 *
 * 図枠 (`partRenderSize`) とは別で、 余白を含まない。 相対指定を解く時の「縁からの距離」 に使う。
 */
export function partVisualSize(
  part: CdlDiagram,
  targetW?: number,
  targetH?: number,
): { w: number; h: number } {
  const e = partExtent(part, targetW, targetH);
  return { w: e.w, h: e.h };
}

/** 格子に並べる時の 1 行あたりの個数と隙間。 */
const PARTS_PER_ROW = 3;

const PARTS_GAP = 120;

/**
 * 組み立てた図の下端 (#2002)。 箱が 1 つも無ければ `undefined`。
 *
 * **段数で概算しない**。 かつては箱の数から `箱 1 つ = 1 段 (280)` で見積もっていたが、
 * `flow` の箱は実際には高さ 68 で 168 おきに並ぶため 1 段あたり 112 ずつ余分に見積もる。
 * 誤差は箱の数に比例して積み上がり、実測で箱 2 つの図に 496、箱 4 つの図に 720 の空きが
 * 入っていた (部品どうしの間は 120)。
 *
 * **箱の下端ではなく図枠の下端を返す**。 格子は図枠どうしを `PARTS_GAP` 空けて並べるので、
 * 既存の図との間も図枠で測らないと、部品どうしの間と既存の図との間が揃わない
 * (箱で測ると 180、図枠で測ると 240 で、後者が部品どうしの段の間と一致する)。
 *
 * **箱が無いことを 0 に潰さない**。 0 を下端として使うと、部品だけを並べた図で部品が
 * 図の上端へ貼り付く。 呼出側が「箱が無い」 と「下端が 0」 を分けられるように `undefined` を返す。
 */
export function partsBaseBottom(laid: LaidDiagram): number | undefined {
  if (laid.nodes.length === 0) return undefined;
  return laid.viewBox.y + laid.viewBox.h;
}

/**
 * 位置を書かなかったパーツを格子に並べた時の、 矩形の中心。
 *
 * 組み立て側 (`mergePartsFromActors`) と画面側 (playground の overlay) の両方から呼ぶ。
 * 別々に計算すると、 同じ本文でも経路によってパーツの位置が変わる。
 *
 * 列の送り幅は並べる全パーツの最大幅で揃える。 個々の幅で送ると、 幅の違うパーツが混ざった時に
 * 隣と重なる (実測 = 400 の次に 200 を置くと 280 重なった)。 段の高さも段内の最大高で揃える。
 * 縦は自分の高さの半分だけ段の上端から下げて、 段内で上端を揃える。
 *
 * @param baseBottom 既存の図の下端 (`partsBaseBottom`)。 その下に間を空けて並べ始める。
 *   箱が 1 つも無い図では `undefined` を渡す
 */
export function partsGridCenters(
  baseBottom: number | undefined,
  items: ReadonlyArray<{ id: string; w: number; h: number }>,
): Map<string, { cx: number; cy: number }> {
  const out = new Map<string, { cx: number; cy: number }>();
  if (items.length === 0) return out;
  // 公開している関数なので、 呼出側が渡す値を入口で閉じる。 数でない下端や桁溢れを
  // そのまま計算に入れると、 描けない座標を返すことになる。
  //
  // 負の下端は捨てない = 図は原点より上にも置ける。 0 で下げ止めると、上にある図の下に
  // 無駄な空きが入る
  const top =
    baseBottom === undefined || !Number.isFinite(baseBottom)
      ? PARTS_GAP * 2
      : baseBottom + PARTS_GAP;
  // 同じ名前が 2 度来たら先の方だけを見る。 後の分を残すと、 どちらを指したか決められない
  // まま列の送り幅にも影響する
  const seen = new Set<string>();
  const unique = items.filter((i) => {
    if (seen.has(i.id)) return false;
    seen.add(i.id);
    return true;
  });
  const cellW = maxOf(
    unique.map((i) => positiveOr(i.w, 400)),
    400,
  );
  const rowTops: number[] = [];
  {
    let y = top;
    for (let i = 0; i < unique.length; i += PARTS_PER_ROW) {
      rowTops.push(y);
      const rowH = maxOf(
        unique.slice(i, i + PARTS_PER_ROW).map((x) => positiveOr(x.h, 200)),
        200,
      );
      y += rowH + PARTS_GAP;
    }
  }
  unique.forEach((item, i) => {
    const col = i % PARTS_PER_ROW;
    const row = Math.floor(i / PARTS_PER_ROW);
    const cx = col * (cellW + PARTS_GAP) + cellW / 2;
    const cy = (rowTops[row] ?? top) + positiveOr(item.h, 200) / 2;
    // 桁溢れした座標は描けない。 返さずに落として、 呼出側が自動配置に倒せるようにする
    if (!Number.isFinite(cx) || !Number.isFinite(cy)) return;
    out.set(item.id, { cx, cy });
  });
  return out;
}

/**
 * 取り込んでよい見本の名前 (#1015)。
 *
 * 1 件ずつが上限以下でも、同じ見本を別名で何度も参照すれば合計は上限を超える
 * (実測 = 1,001 要素の見本を 3 名で参照して最終図が 3,005 要素になった)。
 * 本体の分を引いた残りを予算とし、本文に書かれた順に配る。
 *
 * 順に配るのは、どれを落とすかを決める規則が要るため。 先に書いたものを優先する形なら、
 * 書いた人から見て「後ろが落ちる」 と読める。
 */
function partsBudget(
  target: CdlDiagram,
  partsActors: ReadonlyArray<{ name: string; partId?: string }>,
  partsCatalog: Record<string, CdlDiagram>,
): Set<number> {
  // 名前ではなく **書かれた順番** で覚える。 名前で覚えると、同じ名前を 2 度書いた時に
  // 先の 1 件が入れた名前で後の 1 件まで採用扱いになる
  const accepted = new Set<number>();
  let used = countDiagramElements(target);
  partsActors.forEach((a, i) => {
    const part = lookupPart(partsCatalog, a.partId);
    if (part === undefined) return;
    const cost = countDiagramElements(part);
    if (used + cost > MAX_INPUT_ELEMENTS) return;
    used += cost;
    accepted.add(i);
  });
  return accepted;
}

/**
 * パーツを除いた図を組み立てて、その下端を返す (#2002)。 箱が 1 つも無ければ `undefined`。
 *
 * **宣言のままの箱は座標を持たない** (`CdlNode` に `cx` / `cy` が無い)。 下端を知るには
 * 一度組み立てる必要がある。 パーツを除いた図を組み立てるのは、パーツを含めて測ると
 * パーツを足すたびに下端が下がり、置き場所が自分自身に追随して逃げるため。
 *
 * ## 除く 3 つは、いまの呼び出し順では結果を変えない
 *
 * 箱 / 縦列 / 矢印の 3 つを除いているが、**この 3 つを残しても下端は 1 も動かない**
 * (変異試験で 3 つとも、また 3 つ同時でも落ちる検査は 0 件)。 この関数が走るのは
 * パーツを取り込む前で、その時点のパーツの仮の箱は書いた位置も縦列の段も反映しておらず、
 * 必ず本体の箱と同じ段に居るため。 図種 5 種 × 段の深さ 2 通り、位置を書いた深さ 3 通り、
 * 縦列に置いた段数 2 通りを実測して、1 件も差が出なかった。
 *
 * それでも残すのは、この関数が「パーツを除いた図を測る」 と読めることに意味があるため。
 * 呼び出し順が変わった時に黙って下端が動くより、除く形が書いてある方が直しやすい。
 */
function baseDiagramBottom(
  target: CdlDiagram,
  baseNodes: readonly CdlDiagram["nodes"][number][],
  partsLaneIds: ReadonlySet<string>,
): number | undefined {
  // 箱が 1 つも無い図では組み立てない。 **返す値を変えるための分岐ではない**
  // (`partsBaseBottom` も箱 0 個で `undefined` を返す) = 組み立て 1 回ぶんを省くためだけの
  // 早い戻り。 変異試験でこの行を外しても落ちる検査は 0 件で、それが期待どおり
  if (baseNodes.length === 0) return undefined;
  const baseIds = new Set(baseNodes.map((n) => n.id));
  return partsBaseBottom(
    layout({
      ...target,
      lanes: target.lanes.filter((l) => !partsLaneIds.has(l.id)),
      nodes: [...baseNodes],
      edges: target.edges.filter((e) => baseIds.has(e.from) && baseIds.has(e.to)),
    }),
  );
}

/**
 * 位置を書かなかったパーツの、 merge に渡す座標。
 *
 * 格子の規則は `partsGridCenters` が持つ。 merge は矩形の中心を渡された座標に合わせるので、
 * 中心をそのまま渡す。
 */
function partGridCenters(
  target: CdlDiagram,
  doc: DslDocument,
  partsCatalog: Record<string, CdlDiagram>,
  /** 取り込む見本の書かれた順番。 渡さなければ全部を並べる */
  accepted?: ReadonlySet<number>,
  /** 順番の元になった一覧 (本文に書かれた順) */
  acceptedFrom?: ReadonlyArray<{ name: string }>,
): Map<string, { cx: number; cy: number }> {
  const partsActors = doc.actors.filter((a) => a.partId !== undefined);
  // 格子に並ぶのは座標を 1 つも書かず相対でも書かなかった分だけ。
  //
  // merge 側は「縦横どちらも書かなかった時」 に格子へ落とす。 条件が食い違うと、 片方だけ
  // 書いたパーツが格子の枠を 1 つ消費して後続がずれる (実測 = 後続の中心が 200 から 720 に動いた)
  //
  // 縦列に置く部品も外す (#1980)。 格子の枠を使うと、縦列へ動かした後に後続の部品との間に
  // 空きが残る。 相対の位置を解く側 (`partBoxes`) も同じ関数を通るので、基準の位置は揃う
  const 縦列の部品 = 縦列に置く部品(target, doc).縦列;
  const autoActors = partsActors.filter(
    (a) =>
      a.posX === undefined &&
      a.posY === undefined &&
      a.posRel === undefined &&
      !縦列の部品.has(a.name),
  );
  if (autoActors.length === 0) return new Map();
  // パーツ自身の仮の箱は数えない。 この時点では未削除で残っており、 数えるとパーツを足すたびに
  // 置き場所が下へずれる。
  //
  // 名札 (`title`) だけを見ると、 順序図で 1 人につき作られる 3 つの箱のうち間隔用のものが
  // 漏れる (名札が空のため)。 パーツ 1 個につき 1 つ残り、 格子の起点が 1 段ぶん下がって
  // 画面側とずれていた (実測 = 縦が 840 = 3 段ぶん違った)。
  //
  // 属する列で特定するが、 列の id は名前を slug に変換して作るため名前とは一致しない
  // (実測 = `My Part` の列 id は `My-Part`)。 名前で引くと記号を含む名前だけ取りこぼす。
  // 列の `label` は slug の経路によらず名前の生値を持つので、 そちらで引く (§ merge の
  // 仮の箱の掃除が同じ方法を採っている)。
  //
  // どの列がパーツのものか決められない時は、 数から外さない。 外す側に倒すと本体の箱まで
  // 消えて、 パーツが本体の図に重なる (実測 = 同じ名前を本体とパーツの両方に書くと、
  // 上端が 1140 から 300 に飛んで本体の中に入った)。 外さなければ間隔が 1 段ぶん広がるだけで済む
  const otherActorNames = new Set(
    doc.actors.filter((a) => a.partId === undefined).map((a) => a.name),
  );
  // 本体にも同じ名前がある分は外さない。 名札でも列でも本体と区別できないため
  const partsActorNames = new Set(
    partsActors.map((a) => a.name).filter((n) => !otherActorNames.has(n)),
  );
  // 明示的に他の列へ張ったパーツは、 その列を専有していない (本体と共有している)
  const sharedLaneIds = new Set(
    partsActors.map((a) => a.lane).filter((l): l is string => l !== undefined),
  );
  const partsLaneIds = new Set<string>();
  for (const l of target.lanes) {
    if (l.label === undefined) continue;
    if (!partsActorNames.has(l.label)) continue;
    if (sharedLaneIds.has(l.id)) continue;
    partsLaneIds.add(l.id);
  }
  // 相対で書いた箱も数えない (#2041)。 位置が決まるのは格子を決めた後なので、数えると
  // **1 度目と 2 度目で起点が動く** = 基準の範囲を出す時 (`partBoxes`) は箱が自動配置の
  // 位置に居り、取り込む時 (`mergePartsFromActors`) には相対で解いた位置へ移っている。
  //
  // 横の間隔は書いたとおりに空くのに縦だけが外れる形で表に出る (実測 = 基準のパーツが
  // `cy=1118`、その右に置いた箱が `cy=654` で 464 離れた)。 効いたかを見る側
  // (`verifyPlacement`) も同じ `partBoxes` の値を期待値にするため、実物と期待値が同じ向きに
  // ずれて一致し、知らせを 1 件も出さないまま絵だけが崩れる。
  //
  // **座標で書いた箱は数える**。 こちらは格子より先に位置が決まっており、1 度目と 2 度目で
  // 動かない。 外すと、座標で下に置いた箱にパーツが重なる。
  const 相対で置く箱 = new Set(
    doc.actors.filter((a) => a.posRel !== undefined).map((a) => a.name),
  );
  const baseNodes = target.nodes.filter(
    (n) =>
      !partsActorNames.has(n.title) && !partsLaneIds.has(n.lane) && !相対で置く箱.has(n.title),
  );
  // 取り込まれない見本は格子の枠を使わない (#1015)。 枠を使うと、落とした見本の分だけ
  // 後続がずれる (実測 = 隣の見本の左端が 60 から 725 に動いた)
  const acceptedNames =
    accepted === undefined || acceptedFrom === undefined
      ? undefined
      : new Set(acceptedFrom.filter((_, i) => accepted.has(i)).map((a) => a.name));
  const placedActors = autoActors.filter(
    (a) =>
      lookupPart(partsCatalog, a.partId) !== undefined &&
      (acceptedNames === undefined || acceptedNames.has(a.name)),
  );
  const extents = new Map<string, { w: number; h: number; dx: number; dy: number }>();
  for (const a of placedActors) {
    const part = lookupPart(partsCatalog, a.partId)!;
    // 格子は図枠で決める。 画面側も図枠をそのまま置くので、 同じ物差しで並べれば
    // 2 経路の置き場所が揃う (#937)
    const t = partTargetSize(part, a.posW, a.posH, a.scale);
    extents.set(a.name, partFrameExtent(part, t.w, t.h));
  }
  const centers = partsGridCenters(
    baseDiagramBottom(target, baseNodes, partsLaneIds),
    placedActors.map((a) => ({ id: a.name, ...extents.get(a.name)! })),
  );
  // merge に渡すのは段の中心。 矩形の中心とのずれを引く。 引かないと、 段ごとに箱の高さが
  // 違うパーツで段内の上端が揃わない (実測 = 対称なパーツの上端 520 に対して 507.5)
  const out = new Map<string, { cx: number; cy: number }>();
  for (const [name, c] of centers) {
    const e = extents.get(name)!;
    out.set(name, { cx: c.cx - e.dx, cy: c.cy - e.dy });
  }
  return out;
}

/**
 * パーツごとの外接矩形 (catalog 由来)。 相対指定を解く時に自分の大きさとして使う。
 *
 * `dx` / `dy` は矩形の中心と merge に渡す座標のずれ。 狙った中心から引いて座標にする。
 */
export function partSizes(
  doc: DslDocument,
  partsCatalog: Record<string, CdlDiagram>,
): Map<string, { w: number; h: number; dx: number; dy: number }> {
  const out = new Map<string, { w: number; h: number; dx: number; dy: number }>();
  for (const a of doc.actors) {
    if (a.partId === undefined) continue;
    const part = lookupPart(partsCatalog, a.partId);
    if (part) {
      const t = partTargetSize(part, a.posW, a.posH, a.scale);
      out.set(a.name, partExtent(part, t.w, t.h));
    }
  }
  return out;
}

/**
 * パーツの箱 (中心と大きさ)。 相対指定を解く時の基準として使う。
 *
 * 大きさは catalog の図から求める。 組み立て前の図に残っている仮の箱を測ると、 実際に
 * 描かれる大きさと違う値で間隔を計算することになる。
 */
export function partBoxes(
  target: CdlDiagram,
  doc: DslDocument,
  partsCatalog: Record<string, CdlDiagram>,
): Map<string, AnchorBox> {
  const grid = partGridCenters(target, doc, partsCatalog);
  const out = new Map<string, AnchorBox>();
  for (const a of doc.actors) {
    if (a.partId === undefined) continue;
    const part = lookupPart(partsCatalog, a.partId);
    if (!part) continue;
    const t = partTargetSize(part, a.posW, a.posH, a.scale);
    const size = partExtent(part, t.w, t.h);
    const placed =
      a.posX !== undefined && a.posY !== undefined ? { cx: a.posX, cy: a.posY } : grid.get(a.name);
    // 相対で書いた分はここでは決まらない (解決側が後で埋める)
    if (!placed) continue;
    // 渡す座標は段の中心。 矩形の中心はそこからずれる
    out.set(a.name, { cx: placed.cx + size.dx, cy: placed.cy + size.dy, w: size.w, h: size.h });
  }
  return out;
}

/**
 * 部品へ引いた矢印を、部品の図の要素へ繋ぎ直す手順を作る (#1979)。
 *
 * 部品を置くと組み立ては仮の箱を消し、部品の図の要素を `{名前}__{要素の id}` で足す。 仮の箱へ
 * 引いた矢印は繋ぎ先を失うため、以前は知らせも無く消えていた。
 *
 * | 部品 | 繋ぎ先 |
 * |---|---|
 * | 要素 1 つ | その要素 |
 * | 要素 2 つ以上 | 矢印の行に書いた `fromPartNode` / `toPartNode` の要素 |
 *
 * **要素が 2 つ以上ある部品で 1 つを自動で選ばない**。 カタログの部品は外枠を持たず同格の要素が並ぶ
 * (信号の 3 灯、星 5 つ、棒 5 本) ため、最初の要素や一番大きい要素を選ぶと「その 1 つだけ」 を
 * 指す矢印に見える。 名指しが無い時、名指しした要素が無い時、部品を取り込まなかった時 (`part` が
 * `undefined`) は矢印を外し、矢印ごとに 1 件知らせる。
 *
 * **繋ぐのは書いた矢印だけ** = 矢印を書いた行の端の名前が、この部品の名前と一致する時。 静止した
 * `type: flow` は行を書かなくても箱を並び順で繋ぐが、その矢印は書き手が部品へ引いたものではないので
 * 従来どおり知らせずに外す。 繋ぐと、部品を本文から抜いて図の上に重ねる編集画面 (行が部品を指す
 * 本文だけを抜かずに描く) と絵が食い違う (実測 = 箱と部品を並べただけの本文に、組み立て側だけ矢印が出た)。
 */
function 部品の要素へ繋ぐ(
  部品の名前: string,
  partId: string,
  part: CdlDiagram | undefined,
  edgeSteps: Map<string, DslStep> | undefined,
  onNotice: ((notice: CompileNotice) => void) | undefined,
): (edge: CdlEdge, 端: { from: boolean; to: boolean }) => CdlEdge | undefined {
  const 要素 = (part?.nodes ?? []).map((n) => n.id);
  const 見せる数 = 8;
  const 要素の一覧 = `${要素.slice(0, 見せる数).map(truncateForMessage).join(", ")}${要素.length > 見せる数 ? ` ほか ${要素.length - 見せる数} 件` : ""}`;
  return (edge, 端) => {
    const s = edgeSteps?.get(edge.id);
    const 繋いだ: CdlEdge = { ...edge };
    for (const 側 of ["from", "to"] as const) {
      if (!端[側]) continue;
      // 書いていない矢印 (並び順で作られた矢印) は知らせずに外す
      if (s === undefined || s[側] !== 部品の名前) return undefined;
      const 欄 = 側 === "from" ? "fromPartNode" : "toPartNode";
      const 名指し = s[欄];
      let 理由: { message: string; hint: string } | undefined;
      if (part === undefined) {
        理由 = {
          message: "を図に取り込まなかった",
          hint: "部品が図に入らないため、矢印の端にできません",
        };
      } else if (名指し !== undefined) {
        if (要素.includes(名指し)) 繋いだ[側] = `${部品の名前}__${名指し}`;
        else
          理由 = {
            message: `の中に ${欄} に書いた "${truncateForMessage(名指し)}" という要素が無い`,
            hint: `この部品の要素 = ${要素の一覧}`,
          };
      } else if (要素.length === 1) {
        繋いだ[側] = `${部品の名前}__${要素[0]}`;
      } else {
        理由 =
          要素.length === 0
            ? { message: "の中に繋げる要素が無い", hint: "この部品は要素を持たないため、矢印の端にできません" }
            : {
                message: "の中のどの要素に繋ぐかが決まらない",
                hint: `要素が 2 つ以上ある部品は、矢印に ${欄}: <要素の id> を書いて繋ぐ要素を選ぶ (要素 = ${要素の一覧})`,
              };
      }
      if (理由 === undefined) continue;
      const 矢印 = `"${truncateForMessage(s.from)}" から "${truncateForMessage(s.to)}" への矢印`;
      onNotice?.({
        kind: "part-edge-dropped",
        actor: 部品の名前,
        line: s.pos.line,
        message: `${矢印}は、"${truncateForMessage(部品の名前)}" (${truncateForMessage(partId)}) ${理由.message}ため外しました`,
        hint: 理由.hint,
      });
      return undefined;
    }
    return 繋いだ;
  };
}

/**
 * 矢印に書いた部品の要素の名指し (`fromPartNode` / `toPartNode`) が効かないことを知らせる (#1979)。
 *
 * 名指しは部品の端でだけ読む。 部品でない箱の端に書くと値はどこにも届かず、黙って捨てると
 * 「書いたのに繋ぎ先が変わらない」 が手掛かりなしで起きる。
 *
 * 順序図 (`sequence` / `solidity`) は板の言づてが縦の線に届き、部品の要素へは繋がないため、
 * 部品の端に書いても効かない。 部品の一覧に無い部品は組み立てが部品を引いてから知らせる。
 */
export function reportPartNodeNotHonored(
  doc: DslDocument,
  onNotice?: (notice: CompileNotice) => void,
): void {
  if (!onNotice) return;
  const 順序図 = doc.type === "sequence" || doc.type === "solidity";
  const 部品 = new Set(doc.actors.filter((a) => a.partId !== undefined).map((a) => a.name));
  const 居る = new Set(doc.actors.map((a) => a.name));
  for (const s of doc.flow) {
    for (const [側, 欄] of [
      ["from", "fromPartNode"],
      ["to", "toPartNode"],
    ] as const) {
      const 値 = s[欄];
      if (値 === undefined) continue;
      const 名 = s[側];
      // 居ない名前は `flow-actor-missing` が知らせる
      if (!居る.has(名)) continue;
      if (!順序図 && 部品.has(名)) continue;
      onNotice({
        kind: "part-node-ignored",
        actor: 名,
        line: s.pos.line,
        message: 順序図
          ? `順序図の言づては "${truncateForMessage(名)}" の縦の線に届くため、${欄} に書いた "${truncateForMessage(値)}" は効きません`
          : `"${truncateForMessage(名)}" は部品ではないため、${欄} に書いた "${truncateForMessage(値)}" は効きません`,
        hint: 順序図
          ? "部品の中の要素へ矢印を繋ぐのは、矢印を箱の間に引く図種 (flow / swimlane など)"
          : "部品の中の要素の名指しは、kind に部品の名前を書いた箱の端にだけ効く",
      });
    }
  }
}

/**
 * 部品のために作られた仮の箱の id かを見分ける。
 *
 * 仮の箱の id は部品の名前の slug か、それを頭に持つ形 (`a-header` / `s0-a`) で作られる。
 * 仮の箱を消す側 (`cleanupPlaceholderActor`) と、部品を置く縦列を探す側 (`縦列に置く部品`) が
 * 同じ判定を使う = 別々に持つと、消した箱と縦列を探した箱が食い違う。
 *
 * 素の登場人物が持つ id は仮の箱に数えない (#1466)。 名前が重なった素の登場人物は
 * `重なりを解く` 側で `a-c40bf6` のような id に作り替えられるため、同じ頭で始まり
 * **本体の箱まで巻き込む** (実測で `flow` / `swimlane` / `er` / `state` / `topology` /
 * `class` / `c4` の 7 図種すべてで素の箱が黙って消えていた)。
 *
 * 名前の頭が自分と重なる別の登場人物 (`設備` に対する `設備-予備`) の仮の箱も数えない (#1980)。
 * 数えると `設備` の仮の箱が 2 本の縦列にまたがって見え、`設備` を消す時に `設備-予備` の
 * 仮の箱と縦列まで消す。 部品同士でも起き、後から組み込む `設備-予備` が消えた縦列を指して
 * 配置が止まっていた (`cdl layout: node "設備-予備__ind" の lane "設備-予備" が定義されていない`)。
 */
function 仮の箱のidか(doc: DslDocument, name: string): (id: string) => boolean {
  const aliasSlug = slugify(name);
  const 素の箱のid = new Set(
    doc.actors.filter((x) => x.partId === undefined).map((x) => slugify(x.name)),
  );
  const 頭が重なるid = [
    ...new Set(
      doc.actors
        .filter((x) => x.name !== name)
        .map((x) => slugify(x.name))
        .filter((s) => s.startsWith(`${aliasSlug}-`) || s.endsWith(`-${aliasSlug}`)),
    ),
  ];
  // sequence step anchor = `s{N}-{slug}` pattern
  const 自分の形か = (id: string, slug: string): boolean =>
    id === slug || id.startsWith(`${slug}-`) || (/^s\d+-/.test(id) && id.endsWith(`-${slug}`));
  return (id: string): boolean => {
    if (素の箱のid.has(id)) return false;
    if (頭が重なるid.some((s) => 自分の形か(id, s))) return false;
    return 自分の形か(id, aliasSlug);
  };
}

/**
 * 縦列の中に置く部品と、その縦列の id (#1980)。
 *
 * 位置を書かない部品は格子に並ぶが、格子は縦列の位置を読まない。 部品が縦列に属する図では、
 * 部品の要素だけが縦列に属し、描く位置は別の縦列の上になっていた (実測 = 縦列 b 480〜890 に
 * 属する部品が 60〜420 に描かれた)。
 *
 * 縦列に置くのは、位置 (`posX` / `posY` / `位置:`) を書かない部品のうち次のどちらかに当たるもの。
 *
 * | 形 | 縦列 |
 * |---|---|
 * | `lane:` に図にある縦列を書いた | 書いた縦列 |
 * | 仮の箱が自分だけの縦列を持つ (`swimlane` / `state` / `er` / `class` の作り方) | その縦列 |
 *
 * **自分だけの縦列は図の形で見分ける**。 図種の名前で分けると、縦列の作り方を変えた図種で
 * 黙って外れる。 仮の箱が入った縦列に他の登場人物の箱が無く、図に縦列が 2 本以上ある時に
 * 限る = 全員が 1 本の縦列を共有する図種 (`flow` / `topology` / `c4`) は格子のまま残る。
 * 仮の箱が作られない形 (流れに現れない `swimlane` の登場人物) は、名札が部品の名前の空の縦列で引く。
 *
 * **順序図 (`sequence` / `solidity`) は対象にしない**。 1 枚の板で描き、縦列を持たない (#1466)。
 *
 * **他の箱の位置の基準になっている部品は縦列に置かない**。 相対の位置 (`位置: 印 の右 200`) は
 * 組み立ての前に格子の位置を基準に解くため、基準の部品だけを縦列へ動かすと書いた位置関係が
 * 崩れる。 外した部品は `基準のため外した` に入れ、呼出側が知らせる。
 */
function 縦列に置く部品(
  target: CdlDiagram,
  doc: DslDocument,
): { 縦列: Map<string, string>; 基準のため外した: Map<string, string> } {
  const 縦列 = new Map<string, string>();
  const 基準のため外した = new Map<string, string>();
  if (doc.type === "sequence" || doc.type === "solidity") return { 縦列, 基準のため外した };
  const 基準の名前 = new Set(
    doc.actors.map((a) => a.posRel?.anchor).filter((n): n is string => n !== undefined),
  );
  const 縦列のid = new Set(target.lanes.map((l) => l.id));
  for (const a of doc.actors) {
    if (a.partId === undefined) continue;
    // 同じ名前を 2 度書いた時は先の 1 件を使う (組み立て側の他の判定と同じ)
    if (縦列.has(a.name) || 基準のため外した.has(a.name)) continue;
    if (a.posX !== undefined || a.posY !== undefined || a.posRel !== undefined) continue;
    const 置く縦列 = 部品の縦列(target, doc, a, 縦列のid);
    if (置く縦列 === undefined) continue;
    if (基準の名前.has(a.name)) 基準のため外した.set(a.name, 置く縦列);
    else 縦列.set(a.name, 置く縦列);
  }
  return { 縦列, 基準のため外した };
}

/** 部品を置く縦列。 書いた縦列か、仮の箱が自分だけで使う縦列。 どちらも無ければ `undefined` */
function 部品の縦列(
  target: CdlDiagram,
  doc: DslDocument,
  a: DslActor,
  縦列のid: ReadonlySet<string>,
): string | undefined {
  if (a.lane !== undefined) return 縦列のid.has(a.lane) ? a.lane : undefined;
  if (target.lanes.length < 2) return undefined;
  const 仮の箱か = 仮の箱のidか(doc, a.name);
  const 仮の箱の縦列 = new Set(target.nodes.filter((n) => 仮の箱か(n.id)).map((n) => n.lane));
  // 2 本にまたがる入力は見つかっていない (実測 = 縦列に置く 7 図種とも仮の箱は登場人物ごとに 1 つ。
  // 名前の頭が重なる登場人物の箱は `仮の箱のidか` が外す)。 またがった時にどちらかの縦列を選ぶと
  // 他の縦列を部品が占めるため、格子に残す
  if (仮の箱の縦列.size > 1) return undefined;
  const [入っていた] = [...仮の箱の縦列];
  const 候補 =
    入っていた ?? target.lanes.find((l) => l.label === a.name && !target.nodes.some((n) => n.lane === l.id))?.id;
  if (候補 === undefined) return undefined;
  // 他の登場人物の箱が同じ縦列に居れば、自分だけの縦列ではない
  return target.nodes.some((n) => n.lane === 候補 && !仮の箱か(n.id)) ? undefined : 候補;
}

/**
 * パーツ用に作られた仮の箱 / 線 / 列を掃除する (#1015 で helper 化)。
 *
 * 取り込む時だけでなく **落とす時にも呼ぶ**。 落とした時に残すと、格子から外した後続の見本と
 * 重なる (実測で 64,000 の重なりが出た)。
 */
function cleanupPlaceholderActor(
  target: CdlDiagram,
  doc: DslDocument,
  a: { name: string; lane?: string },
  /**
   * 仮の箱に繋がっていた矢印を、部品の図の要素へ繋ぎ直す (#1979)。 仮の箱の側の端を受け取り、
   * 繋ぎ直した矢印を返す。 `undefined` を返した矢印は外す。 渡さなければ全て外す
   */
  繋ぎ直す?: (edge: CdlEdge, 端: { from: boolean; to: boolean }) => CdlEdge | undefined,
): void {
  const aliasSlug = slugify(a.name);
  const ownedLaneIds = new Set<string>();
  if (doc.type === "sequence" || doc.type === "solidity") {
    for (const l of target.lanes) {
      // 明示 lane mapping (a.lane) 先は part の張替え先で actor 専用 lane ではないため除外
      if (a.lane !== undefined && l.id === a.lane) continue;
      if (l.label === a.name) ownedLaneIds.add(l.id);
    }
  }
  const ownedNodeIds = new Set<string>();
  for (const n of target.nodes) {
    if (ownedLaneIds.has(n.lane)) ownedNodeIds.add(n.id);
  }
  // actor 専用 lane を引き当てられない経路 (flow / topology 等の共有 lane preset) は従来どおり dragon
  // slug の prefix match に fallback する。 これらは 1 actor = 1 node (id = slug) の生成規則。
  const matchesAliasSlug = 仮の箱のidか(doc, a.name);
  const relatedToActor = (id: string): boolean =>
    ownedLaneIds.size > 0 ? ownedNodeIds.has(id) : matchesAliasSlug(id);
  // 仮の箱が入っていた縦列。 仮の箱を消して空になった縦列は下で消す (#1973)
  const 仮の箱の縦列 = new Set(target.nodes.filter((n) => relatedToActor(n.id)).map((n) => n.lane));
  target.nodes = target.nodes.filter((n) => !relatedToActor(n.id));
  // 仮の箱に繋がっていた矢印は、部品の要素へ繋ぎ直せたものだけ残す (#1979)。 以前は全て消しており、
  // 部品へ引いた矢印が知らせも無く図から消えていた。 繋ぎ直した矢印は id を変えないので、段の
  // 点灯 (`activate`) からも外さない。 外した矢印の id は `activate` に残ると存在しない参照になるため回収する
  const removedEdgeIds = new Set<string>();
  const 残す矢印: CdlEdge[] = [];
  for (const e of target.edges) {
    const 端 = { from: relatedToActor(e.from), to: relatedToActor(e.to) };
    if (!端.from && !端.to) {
      残す矢印.push(e);
      continue;
    }
    const 繋いだ = 繋ぎ直す?.(e, 端);
    if (繋いだ) 残す矢印.push(繋いだ);
    else removedEdgeIds.add(e.id);
  }
  target.edges = 残す矢印;
  // lane も削除 = sequence preset は parts actor 用に lane (id = aliasSlug、 label = actor 名) を
  // 生成する。 node/edge だけ消して lane を残すと、 merge 後の part 側 lane (label = alias) と 2 本が
  // 同じ label を lane-label として描画し二重表示になる (actor ラベル二重表示 bug の root cause)。
  //
  // 削除は seq-like preset (sequence / solidity = compileSequence 経由) に限定する。 これらは
  // 1 actor = 1 lane (lane.label === a.name、 lane.id は actor 名の slug) の生成規則が成立し、
  // parts actor 用 lane を安全に削除できる。 他 preset (flow / topology / class / pie 等) は複数
  // actor が共有 lane (id = "main" 等) を参照するため、 一致 lane を消すと通常 actor の node が
  // 削除済 lane を参照する不正 diagram になる。
  //
  // leftover lane の特定は lane.label === a.name を第一に使う。 seq-like preset は非 animate 経路
  // (cdl preset の slugify) と animate 経路 (dragon の slugify) で lane.id の slug 規則が異なり
  // (`_`/全角の扱い等)、 aliasSlug (dragon slugify) と lane.id が不一致になる actor 名がある。 lane.label
  // は両経路とも a.name 生値なので slug 差の影響を受けず確実に一致する。 id === aliasSlug は
  // label 未設定 preset への fallback (exact match のみ、 prefix は false match risk のため付けない)。
  /*
   * **図種で分けない** (#1466)。 以前は順序図系だけを掃除していたが、順序図が板になって
   * 面ごとの縦列を作らなくなり、この分岐は誰も通らなくなった。 一方で縦列を作る他の図種
   * (`swimlane` 等) では見本の仮の縦列が空のまま残っていた (実測)。
   *
   * **中身が残っている縦列は消さない**。 1 本の縦列を全員で共有する図種 (`flow` / `topology`)
   * では、その縦列の名札がたまたま登場人物の名前と一致することがある。 消すと本体の箱が
   * 行き場を失う。
   */
  const 残る箱を持つ = new Set(target.nodes.map((n) => n.lane));
  target.lanes = target.lanes.filter((l) => {
    // 明示 lane mapping (a.lane) 先は part の張替え先なので保持する。
    if (a.lane !== undefined && l.id === a.lane) return true;
    if (残る箱を持つ.has(l.id)) return true;
    if (l.label === a.name) return false;
    if (l.id === aliasSlug) return false;
    // 図種が自動で作った縦列 (`flow` 等) に部品の箱しか無かった図では、仮の箱を消すと縦列が
    // 空のまま残る (実測 = 部品 1 つだけの図に中身の無い `flow` の縦列)。 書き手が `lanes:` に
    // 書いた縦列は、空でも書いたとおりに残す (#1973)
    if (仮の箱の縦列.has(l.id) && !Object.hasOwn(doc.lanes ?? {}, l.id)) return false;
    return true;
  });
  // 削除された node / edge を activate 参照している既存 phase の cleanup (node 削除と同じ判定経路
  // = 取りこぼすと存在しない id が activate に残り dangling 参照になる、 #873)
  for (const phase of target.phases) {
    phase.activate = phase.activate.filter((id) => !relatedToActor(id) && !removedEdgeIds.has(id));
  }
}

/**
 * 種類に書いた名前が箱の種類にも部品の一覧にも無いことを、書いた行で伝える (#2113)。
 *
 * 記法は箱の種類に無い名前を部品の名前とみなすため、箱の種類の綴り違い (`evnet`) もここに来る。
 * 図は種類を書かなかった箱になる。 `console.warn` だけに出すと編集画面に理由が見えないので、
 * 知らせと `console.warn` の両方へ同じ文を出す。
 *
 * 案内には、箱の種類と一覧の部品の名前から綴りの近い名前を 1 つ出す。 部品の名前は `parts-` の
 * 前置きを外した形で勧める = どちらの形でも引けるので、短い方を書けば足りる。
 *
 * **部品を 1 つも持たない一覧では知らせない**。 比べる部品の名前が無く、部品を書いたのか綴りを
 * 間違えたのかを決められない (一覧を渡さない時と同じ)。 編集画面は部品を読み込み終わる前と
 * 読み込みに失敗した後に空の一覧を渡すため、知らせると正しい部品の名前にも注意が出る。
 * 図は一覧を渡さない時と同じなので、知らせの有無だけを揃える。
 */
function 部品が一覧に無いことを伝える(
  actor: DslActor,
  partId: string,
  partsCatalog: Record<string, CdlDiagram>,
  onNotice?: (notice: CompileNotice) => void,
): void {
  const 部品の名前 = new Set(Object.keys(partsCatalog).map((k) => k.replace(/^parts-/, "")));
  const message = `"${truncateForMessage(actor.name)}" の種類 "${truncateForMessage(partId)}" は、箱の種類にも部品の一覧にもありません (種類を書かなかった箱として描きます)`;
  if (typeof console !== "undefined" && console.warn) console.warn(`[dragon] ${message}`);
  if (部品の名前.size === 0) return;
  // 書いた側の `parts-` も外して比べる = 前置きの 6 文字が距離に入ると、どの部品も遠くなる
  const 近い = 近い名前(partId.replace(/^parts-/, ""), [...NODE_KIND_VALID, ...部品の名前]);
  onNotice?.({
    kind: "part-not-found",
    actor: actor.name,
    line: actor.pos?.line ?? 0,
    message,
    hint:
      近い === undefined
        ? "kind には、箱の種類か、部品の一覧にある部品の名前を書いてください"
        : `近い名前は ${近い} (${NODE_KIND_VALID.has(近い) ? "箱の種類" : "部品"}) です`,
  });
}

/**
 * CAR-1657 = doc.actors 中の partId set actor を検出、 partsCatalog から CdlDiagram を lookup、
 * mergePartIntoDiagram で target に prefix 付き統合する。 diagram render は継続 (壊さない設計)。
 *
 * 部品の一覧を渡さない時は `console.warn` だけに出し、知らせない (#2113)。 一覧が無いと、書いた名前が
 * 部品なのか箱の種類の書き間違いなのかを決められない。 一覧を渡して名前が無かった時は
 * `部品が一覧に無いことを伝える` が決める (部品を持つ一覧なら書いた行で知らせる)。
 */
export function mergePartsFromActors(
  target: CdlDiagram,
  doc: DslDocument,
  partsCatalog?: Record<string, CdlDiagram>,
  onNotice?: (notice: CompileNotice) => void,
  derivedSourceLines?: Map<string, number[]>,
  /** 矢印の id から、その矢印を書いた行。 行に書いた要素の名指しを読む (#1979) */
  edgeSteps?: Map<string, DslStep>,
): CdlDiagram {
  const partsActors = doc.actors.filter((a) => a.partId !== undefined);
  if (partsActors.length === 0) return target;
  // 値と状態の名前に使う前置きを **書いた順に 1 度だけ** 決める (#1189)。 見本ごとに作ると
  // 同じ形に潰れた時の番号が揃わず、後から重ねた見本が先の名前空間を踏む
  const 値の前置き = 値の前置きを作る(partsActors.map((a) => a.name));
  if (!partsCatalog) {
    if (typeof console !== "undefined" && console.warn) {
      const names = partsActors.map((a) => `${a.name} (kind: ${a.partId ?? "?"})`).join(", ");
      console.warn(
        `[dragon] 部品の一覧 (partsCatalog) を渡していないため、次の箱を部品として描けません (種類を書かなかった箱として描きます): ${names}`,
      );
    }
    return target;
  }
  // 位置を書かなかったパーツの置き場所は `partGridCenters` が決める。
  //
  // 以前はここで格子を組んでいたが、 相対指定を解く側も同じ位置を知る必要がある。
  // 別々に計算すると、 解決側が想定した位置と実際の置き場所がずれる。 規則を共有する。
  // 取り込んでよい合計を先に決める (#1015)。 1 件ずつ上限以下でも、同じ見本を別名で何度も
  // 参照すれば合計は上限を超える (実測 = 1,001 要素の見本を 3 名で参照して 3,005 要素になった)。
  // 本体の分を引いた残りを予算として、順に配って超えた分を落とす。
  //
  // 格子より先に決める。 後にすると、落とす見本が格子の枠を消費して後続がずれる
  const budget = partsBudget(target, partsActors, partsCatalog);
  const gridCenters = partGridCenters(target, doc, partsCatalog, budget, partsActors);
  // 縦列の中に置く部品 (#1980)。 仮の箱を消す前に探す = 消した後は自分だけの縦列を見分けられない
  const { 縦列: 縦列の部品, 基準のため外した } = 縦列に置く部品(target, doc);
  const 縦列に置いた: 縦列に置いた部品[] = [];
  const 自分の縦列に置いた: 自分の縦列に置いた部品[] = [];
  /** 図に取り込んだ部品。 段の `focus` に書いた部品の名前を要素へ広げる時に引く (#2150) */
  const 取り込んだ部品 = new Map<string, CdlDiagram>();

  for (const [actorIndex, actor] of partsActors.entries()) {
    const partId = actor.partId;
    // 部品の一覧は外から渡される = 自分が持つ key だけを見る (`Object.hasOwn`)。
    // 見ないと `__proto__` のような受け継いだ名前が部品として当たり、渡していない中身が図に入る。
    // `parts-` で始まる名前の経路も同じ確認を通す。
    if (typeof partId !== "string" || partId.length === 0) continue;
    const found = lookupPartRaw(partsCatalog, partId);
    // 見つかっても大きすぎる図は取り込まない (#1015)。 黙って落とすと「書いたのに出ない」 に
    // なるため、見つからなかった時と分けて知らせる。
    // 1 件では収まっても合計で超える分も同じく落とす
    if (found !== undefined && !budget.has(actorIndex)) {
      const overOne = !partIsMeasurable(found);
      onNotice?.({
        kind: "part-not-drawn",
        actor: actor.name,
        line: 0,
        message: `"${actor.name}" (${partId}) は大きすぎるため取り込みません。`,
        hint: overOne
          ? `要素数が上限 (${MAX_INPUT_ELEMENTS}) を超えています`
          : `図全体の要素数が上限 (${MAX_INPUT_ELEMENTS}) を超えます`,
      });
      // 落とす時も仮の箱を掃除する。 残すと格子から外した後続の見本と重なる。
      // 部品が図に入らないので、部品へ引いた矢印も繋ぎ先が無い = 矢印ごとに知らせて外す
      cleanupPlaceholderActor(
        target,
        doc,
        actor,
        部品の要素へ繋ぐ(actor.name, partId, undefined, edgeSteps, onNotice),
      );
      continue;
    }
    const part = found;
    if (!part) {
      部品が一覧に無いことを伝える(actor, partId, partsCatalog, onNotice);
      // 一覧に無い部品は仮の箱のまま描かれ、矢印も仮の箱に繋がる。 要素の名指しは効かない
      for (const s of doc.flow) {
        for (const [側, 欄] of [
          ["from", "fromPartNode"],
          ["to", "toPartNode"],
        ] as const) {
          const 値 = s[欄];
          if (値 === undefined || s[側] !== actor.name) continue;
          // 順序図は部品の有無に依らず名指しが効かない。 そちらの知らせと 2 度出さない
          if (doc.type === "sequence" || doc.type === "solidity") continue;
          onNotice?.({
            kind: "part-node-ignored",
            actor: actor.name,
            line: s.pos.line,
            message: `"${truncateForMessage(actor.name)}" (${truncateForMessage(partId)}) は部品の一覧に無いため、${欄} に書いた "${truncateForMessage(値)}" は効きません`,
            hint: "kind に部品の名前を書く (綴りを確かめる)",
          });
        }
      }
      continue;
    }
    // 型 (`sequence` 等) が作った、部品の登場人物に由来する箱と線を別名も辿って全て消す。
    // `sequence` は `{slug}-header` / `-spacer` / `-footer` / `s{N}-{slug}` を作るので、
    // slug で始まる名前をまとめて対象にする。
    //
    // sweep に使う slug は 2 系統ある (#873)。 dragon の slugify は `_` / 全角を保持するが、 非 animate
    // sequence / solidity の node は cdl preset 側の slugify (`_` → `-` 置換、 NFKC なし) で生成される
    // ため、 dragon slug だけで sweep すると `arc_one` → 実 id `arc-one-header` を取りこぼし、 header /
    // footer (title = actor 名) が残って actor 名が多重表示される。
    //
    // seq-like preset は「actor 専用 lane に属する node」 を exact set で特定する経路を使う。
    // lane.label === actor.name で lane を引き当て (label は両 slug 経路とも actor.name 生値)、 その
    // lane に属する node (header / spacer / footer / step anchor は全て actor lane 所属) を node.lane で
    // 厳密収集する。 slug の prefix 推測を挟まないため、 slug 実装差の取りこぼしと、 別 actor を巻き込む
    // 誤削除 (parts actor `a_b` の lane id `a-b` が actor `a-b-c` の `a-b-c-header` に prefix match する)
    // の両方を同時に排除する。
    //
    // 仮の箱に繋がっていた矢印は、部品の図の要素へ繋ぎ直す (#1979)。
    // 縦列に置く部品は、仮の箱の縦列を消さずに残す (#1980)。 部品用の縦列 (`名前__l`) を足すと、
    // 縦列が書いた順ではなく仮に置いた横位置の順に並ぶ (実測 = 3 人目に書いた部品が真ん中になった)
    const 置く縦列 = 縦列の部品.get(actor.name);
    cleanupPlaceholderActor(
      target,
      doc,
      置く縦列 !== undefined ? { name: actor.name, lane: 置く縦列 } : actor,
      部品の要素へ繋ぐ(actor.name, partId, part, edgeSteps, onNotice),
    );
    const 外した縦列 = 基準のため外した.get(actor.name);
    if (外した縦列 !== undefined) {
      onNotice?.({
        kind: "part-lane-ignored",
        actor: actor.name,
        line: actor.pos?.line ?? 0,
        message: `"${actor.name}" は他の箱の位置の基準になっているため、縦列 "${target.lanes.find((l) => l.id === 外した縦列)?.label ?? 外した縦列}" には置かず図の下に並べました`,
        hint: `縦列に置きたい時は、"${actor.name}" を基準にした位置 (位置: ${actor.name} の右 200 など) を座標で書く`,
      });
    }
    const merged = applyColorHex(part, actor.colorHex, actor.stateOverride ?? {});
    // 色番号は部品の色の状態へ入れる。 塗りを図形に直接書いた部品 (`arc-gauge` 等) は入れる先が
    // 無く、書いても絵が変わらない。 黙って既定の色で描くと手掛かりが残らないので知らせる (#1973)
    if (actor.colorHex && !(part.states ?? []).some((st) => isColorValue(st.initial))) {
      onNotice?.({
        kind: "part-color-ignored",
        actor: actor.name,
        line: actor.pos?.line ?? 0,
        message: `"${actor.name}" (${partId}) は色を変えられる状態を持たないため、色番号 ${actor.colorHex} は効きません`,
        hint: "色を変えられる部品は、初期値が色番号の状態を持つもの (例 = state-indicator)",
      });
    }
    // 色の名前は箱の色にしか効かず、部品の色の状態は色番号しか受けない。 名前の色は描く側の
    // 配色の変数 (`--cdl-tone-*`) で決まり固定の色番号を持たないため、置き換えて入れることもしない
    if (actor.partColorName) {
      onNotice?.({
        kind: "part-color-ignored",
        actor: actor.name,
        line: actor.pos?.line ?? 0,
        // 残っている名前は読み替えた後の正規の名前 (`成功` なら `success`) なので文には出さない
        message: `"${actor.name}" (${partId}) の色は色の名前では変わりません`,
        hint: '部品の色は色番号で書く (例 = color: "#d9534f")',
      });
    }
    // 上書きが読むのは部品の状態の名前と `phase` (段を外す) だけで、他の名前は何も変えない。
    // 綴り違いや、外した欄 (`nodes`、#1976) を書いた時に、効いていない値を黙って持たない
    const 部品の状態 = new Set((part.states ?? []).map((st) => st.id));
    const 無い状態 = Object.keys(actor.stateOverride ?? {}).filter(
      (k) => k !== "phase" && !部品の状態.has(k),
    );
    if (無い状態.length > 0) {
      onNotice?.({
        kind: "part-state-missing",
        actor: actor.name,
        line: actor.pos?.line ?? 0,
        message: `"${actor.name}" (${partId}) は ${無い状態.map((k) => `"${truncateForMessage(k)}"`).join(" / ")} という状態を持たないため、書いた値は効きません`,
        hint:
          部品の状態.size > 0
            ? `この部品の状態 = ${[...部品の状態].join(", ")}`
            : "この部品は状態を持たないため、値を書いても変わりません",
      });
    }
    // 位置を書いていないパーツは格子に並べる。 書いてあればその位置を使う
    let placeX = actor.posX;
    let placeY = actor.posY;
    // 格子に落とすのは縦横どちらも書かなかった時だけ。 片方だけ書いた時に残りを格子で
    // 埋めると、 書いた値と格子が混ざった位置になる (従来の条件をそのまま保つ)
    if (置く縦列 !== undefined) {
      // 縦列の位置は図を配置するまで決まらない。 ここでは座標で置く形にだけして、
      // 全部の部品を組み込んだ後に縦列へ寄せる (`縦列に置いた部品を揃える`)
      placeX = 0;
      placeY = 0;
    } else if (placeX === undefined && placeY === undefined) {
      const center = gridCenters.get(actor.name);
      placeX = center?.cx;
      placeY = center?.cy;
    }
    // `倍率` / `scale` は図形の倍率として予約した (#1026)。 同じ名前の状態を持つ見本では、
    // 予約する前は状態の上書きとして効いていた。 黙って意味が変わると気付けないので知らせる
    // 判定は **書かれた名前** で行う。 読めた値で判定すると `scale: x` のように値が
    // 読めない形で知らせが消え、逆に `scale` を書いて見本が `倍率` の状態を持つだけの
    // 組合せ (元から衝突していない) にも知らせてしまう
    const written = new Set(actor.scaleKeys ?? []);
    if (written.size > 0) {
      const clashed = (part.states ?? []).find((st) => written.has(String(st.id ?? "")));
      if (clashed) {
        onNotice?.({
          kind: "scale-reserved",
          actor: actor.name,
          line: actor.pos?.line ?? 0,
          message: `"${clashed.id}" は見本の大きさを変える項目として扱いました (${clashed.id} という名前の状態は変えていません)`,
          hint: `状態を変えたい時は \`state: { ${clashed.id}: ... }\` と書く`,
        });
      }
    }
    const t = partTargetSize(part, actor.posW, actor.posH, actor.scale);
    const 組み込む前の箱の数 = target.nodes.length;
    const 作った縦列 = mergePartIntoDiagram(
      target,
      part,
      actor.name,
      merged,
      置く縦列 ?? actor.lane,
      placeX,
      placeY,
      t.w,
      t.h,
      onNotice,
      actor.pos?.line ?? 0,
      derivedSourceLines,
      値の前置き.get(actor.name),
      置く縦列 !== undefined,
    );
    const 要素 = new Set(target.nodes.slice(組み込む前の箱の数).map((n) => n.id));
    取り込んだ部品.set(actor.name, part);
    if (置く縦列 !== undefined) {
      縦列に置いた.push({ 縦列: 置く縦列, 要素 });
    } else if (作った縦列.length > 0) {
      自分の縦列に置いた.push({ 名前: actor.name, 縦列: 作った縦列, 要素 });
    }
  }
  // 部品用の縦列を先に固定する。 縦列に置く部品は配置した縦列の位置に合わせるので、固定する前に
  // 揃えると、揃えた時の縦列 (部品用の縦列も詰める送りに加わる) と描いた図の縦列が食い違う
  部品の縦列を部品に固定する(target, 自分の縦列に置いた);
  縦列に置いた部品を揃える(target, 縦列に置いた);
  部品の名前で光らせる(target, doc, 取り込んだ部品, onNotice);
  return target;
}

/**
 * 段の `focus` に書いた部品の名前を、部品の要素と部品の中の線に広げる (#2150)。
 *
 * 組み立ては部品の名前を仮の箱として置き、段の `focus` を仮の箱の id に解決する。 部品を取り込む時に
 * 仮の箱を消し、段の光らせる相手からも外す (`cleanupPlaceholderActor`)。 外すだけでは、部品の名前を
 * 書いた段が何も光らせない (実測 = 部品を繋いで動かす頁の 5 見本で、部品の名前を書いた 13 段が
 * 1 つも部品を光らせていなかった)。
 *
 * **仮の箱を消す所で置き換えず、書いた `focus` を読み直す**。 仮の箱の id の形は図種で違い
 * (順序図は縦列の上端 / 下端 / 手順箱、流れ図は箱 1 つ)、置き換えると図種ごとに規則が要る。
 * 書いた名前から引けば、図種に依らず同じ規則で足せる。
 *
 * | 書いた相手 | 足すもの |
 * |---|---|
 * | 部品の名前 (か、他の名前と重ならない slug の形) | 部品の要素 (`{部品の名前}__{要素}`) と部品の中の線 (`{部品の名前}__{線}`) |
 * | `{部品の名前}__{要素}` / `{部品の名前}__{中の線}` (#2151) | その要素か線だけ。 部品に無ければ知らせる |
 * | それ以外 (箱の名前 / 矢印) | 足さない。 図種ごとの解決が既に光らせている |
 *
 * 要素の名指しの前半は、取り込んだ部品の名前のうち **一番長く一致するもの** で決める。 部品の名前
 * そのものが `__` を含む時 (`印` と `印__2`)、短い名前に当てると `印__2__inP` を `印` の要素 `2__inP` と
 * 読み、無い要素として知らせてしまう。 登場人物の名前と完全に一致する名前は、箱の名前として読む。
 *
 * 部品に無い名前はここで知らせる。 組み立ての入口 (`reportMissingFocusTargets`) は部品の一覧を持たず、
 * 前半が部品の名前なら中身を確かめずに通す = 知らせる所をここ 1 か所にし、同じ名前に 2 件出さない。
 *
 * 書いた段と組み立てた段は題 (`title` は書いた段の名前) で先頭から順に突き合わせる。 部品が宿主より
 * 多くの段を持つと組み立てた段が後ろに増えるが、書いた段は同じ順に並ぶ。 同じ id は 2 度入れない。
 */
function 部品の名前で光らせる(
  target: CdlDiagram,
  doc: DslDocument,
  取り込んだ: ReadonlyMap<string, CdlDiagram>,
  onNotice?: (notice: CompileNotice) => void,
): void {
  const 書いた段 = doc.animate?.phases ?? [];
  if (書いた段.length === 0 || 取り込んだ.size === 0) return;
  const 箱 = new Set(target.nodes.map((n) => n.id));
  const 線 = new Set(target.edges.map((e) => e.id));
  const 部品の相手 = new Map<string, string[]>();
  /** 部品ごとに、図に入った要素と中の線の元の id。 名指しの照合と、無い名前を知らせる時の案内に使う */
  const 部品の中 = new Map<string, { 要素: string[]; 線: string[] }>();
  for (const [名前, part] of 取り込んだ) {
    const 中 = {
      要素: part.nodes.map((n) => n.id).filter((id) => 箱.has(`${名前}__${id}`)),
      線: part.edges.map((e) => e.id).filter((id) => 線.has(`${名前}__${id}`)),
    };
    部品の中.set(名前, 中);
    部品の相手.set(名前, [...中.要素, ...中.線].map((id) => `${名前}__${id}`));
  }
  const 長い名前から = [...取り込んだ.keys()].sort((a, b) => b.length - a.length);
  const 見せる数 = 8;
  const 並べる = (ids: readonly string[]): string =>
    ids.length === 0
      ? "なし"
      : `${ids.slice(0, 見せる数).map(truncateForMessage).join(", ")}${ids.length > 見せる数 ? ` ほか ${ids.length - 見せる数} 件` : ""}`;
  // 図種ごとの解決は、名前が見つからない時に slug の形でも探す (`slugLookup`)。 同じ書き方で
  // 部品だけが光らない状態を作らないよう揃える。 2 つ以上の名前が同じ slug になる時は引かない
  const 書いた名前 = new Set(doc.actors.map((a) => a.name));
  const slugの数 = new Map<string, number>();
  for (const 名前 of 書いた名前) slugの数.set(slugify(名前), (slugの数.get(slugify(名前)) ?? 0) + 1);
  const slugから = new Map<string, string[]>();
  for (const [名前, 相手] of 部品の相手) {
    if (slugの数.get(slugify(名前)) === 1) slugから.set(slugify(名前), 相手);
  }
  let 次に見る = 0;
  for (const 段 of 書いた段) {
    // 光らせる相手を先に決める。 段の突き合わせに外れても、部品に無い名前は知らせる
    const 足す = (段.highlight ?? []).flatMap((書いた) => {
      const entry = parseFocusEntry(書いた, 書いた名前);
      if (entry.kind !== "node") return [];
      const 部品全体 = 部品の相手.get(entry.name);
      if (部品全体 !== undefined) return 部品全体;
      if (書いた名前.has(entry.name)) return [];
      const slugで引いた = slugから.get(entry.name);
      if (slugで引いた !== undefined) return slugで引いた;
      const 名前 = 長い名前から.find((p) => entry.name.startsWith(`${p}__`));
      if (名前 === undefined) return [];
      const 中 = 部品の中.get(名前)!;
      const 名指し = entry.name.slice(名前.length + 2);
      if (中.要素.includes(名指し) || 中.線.includes(名指し)) return [entry.name];
      onNotice?.({
        kind: "focus-target-missing",
        actor: 書いた,
        line: 段.pos.line,
        message: `光らせる相手が部品 "${truncateForMessage(名前)}" の中にありません: "${truncateForMessage(書いた)}"`,
        hint: `この部品の要素 = ${並べる(中.要素)} / 中の線 = ${並べる(中.線)}`,
      });
      return [];
    });
    const 番目 = target.phases.findIndex((p, i) => i >= 次に見る && p.title === 段.name);
    if (番目 < 0) continue;
    次に見る = 番目 + 1;
    if (足す.length === 0) continue;
    const 組み立てた段 = target.phases[番目]!;
    組み立てた段.activate = [...new Set([...組み立てた段.activate, ...足す])];
  }
}

type 自分の縦列に置いた部品 = {
  /** 登場人物の名前。 名札に使う */
  名前: string;
  /** 部品用に作った縦列。 部品の縦列の順 */
  縦列: readonly 部品用の縦列[];
  要素: ReadonlySet<string>;
};

type 部品用の縦列 = {
  id: string;
  /** 部品自身が縦列に書いた名札 */
  部品の名札: string | undefined;
};

/** 部品用の縦列の、部品の要素の上端から縦列の上端までの高さ。 名札 (縦列の上端から 26 下) を収める */
const 部品の縦列の名札の高さ = 60;

/**
 * 部品用の縦列を部品の位置に固定し、登場人物の名前の名札を部品のすぐ上に 1 つだけ出す (#1990)。
 *
 * 部品の要素は座標で置くが、縦列は描画側が左から詰めて並べ直す。 格子の 2 段目の部品の縦列は
 * 1 段目の縦列と重なるため右へ送られ、名札が別の部品の上に出て、送った分だけ図が横に伸びた
 * (実測 = 部品 4 つの流れ図で `稼働2` の名札が `稼働3` の上、図の右に 875 の空き)。 部品が 1 つでも
 * 名札は図の上端に出て、流れ図の途中に置くと先頭の箱の見出しに見えた。
 *
 * 描画側は `posX` と `posY` を両方持つ縦列を置いた位置に置き、詰める送りも幅の自動拡張もしない。
 * 幅は `posW` が無ければ縦列の `width` を使うので、横は位置だけを書く。
 *
 * | 向き | 固定する範囲 |
 * |---|---|
 * | 横 | 組み込みで決めた位置と幅のまま (部品が書いた縦列を、置いた位置へ写したもの。 #879 / #880) |
 * | 縦 | 部品全体の上端より名札の分 (60) 上から、部品全体の下端まで。 部品の縦列は全て同じ |
 *
 * | 縦列 | 名札 |
 * |---|---|
 * | 左端が最も左の縦列 (同じなら部品の縦列の順で先) | 部品が書いた名札、無ければ登場人物の名前 |
 * | 他の縦列 | 部品が書いた名札だけ |
 *
 * 縦を部品全体に揃えるのは、部品の頁の絵と同じく縦列の名札を 1 列に並べるため (部品の頁では
 * 縦列が全て同じ上端から始まる)。 縦列ごとの要素に合わせると、左の縦列の要素が他より低い部品で
 * 名前の名札が下がり、右の縦列の要素と重なる。
 *
 * **下に余白を足さない**。 縦列の枠は塗りも線も持たず絵に出ないが、図の大きさには数えられる。
 * 足すと、部品が一番下にある図だけ図の下の空きが広がる (実測 = 箱だけの図と直す前の図は 60、
 * 下に 25 足すと 85)。 高さを書かないと縦列は名札の分 (40) に縮み、部品の要素が縦列の外に出る。
 *
 * **要素の高さは配置しないと分からない** (種類ごとの既定値で描画側が決める)。 全ての部品を
 * 組み込んだ後に 1 度だけ配置して測る。 座標で置いた要素は配置で動かないので、測った範囲に
 * 固定しても要素は動かない。
 *
 * 座標で置かない要素を持つ部品は固定しない。 そういう要素は縦列の中心に描かれるため、縦列の
 * 詰める送りを止めると要素の位置も変わる。 **この分岐はテストで覆えていない** = 本文から入力を
 * 作れない。 格子の部品は必ず格子の中心を持ち、位置を書いた部品は縦横の両方を持つ (片方だけの
 * 位置と基準が見つからない位置は読む段階で止まる)。 どちらも座標で置かれる (`shouldForcePos`)。
 *
 * 配置できない図 (描画側が止める図) では固定しない。 描画でも同じ所で止まる。
 */
function 部品の縦列を部品に固定する(
  target: CdlDiagram,
  部品たち: readonly 自分の縦列に置いた部品[],
): void {
  const 座標で置いた = (id: string): boolean => {
    const n = target.nodes.find((x) => x.id === id);
    return n !== undefined && n.posX !== undefined && n.posY !== undefined;
  };
  const 対象 = 部品たち.filter((p) => [...p.要素].every(座標で置いた));
  if (対象.length === 0) return;
  let laid: LaidDiagram;
  try {
    laid = layout(target);
  } catch {
    return;
  }
  for (const p of 対象) {
    const 箱 = laid.nodes.filter((n) => p.要素.has(n.id));
    if (箱.length === 0) continue;
    const 上端 = Math.min(...箱.map((n) => n.cy - n.h / 2));
    const 下端 = Math.max(...箱.map((n) => n.cy + n.h / 2));
    const 縦列たち = p.縦列.flatMap((l) => {
      const 縦列 = target.lanes.find((x) => x.id === l.id);
      return 縦列 ? [{ ...l, 縦列 }] : [];
    });
    let 名札の縦列: (typeof 縦列たち)[number] | undefined;
    for (const l of 縦列たち) {
      if (名札の縦列 === undefined || (l.縦列.x ?? 0) < (名札の縦列.縦列.x ?? 0)) 名札の縦列 = l;
    }
    for (const l of 縦列たち) {
      l.縦列.posX = l.縦列.x ?? 0;
      l.縦列.posY = 上端 - 部品の縦列の名札の高さ;
      l.縦列.posH = 下端 - 上端 + 部品の縦列の名札の高さ;
      const 名札 = l === 名札の縦列 ? (l.部品の名札 ?? p.名前) : l.部品の名札;
      if (名札 === undefined) delete l.縦列.label;
      else l.縦列.label = 名札;
    }
  }
}

/**
 * 縦列に置く部品の 2 本目以降の縦列を、図の縦列として宿主の縦列のすぐ右に差し込む (#2145)。
 *
 * 以前は部品の縦列を全て宿主の縦列 1 本にまとめていた。 部品の要素は座標で置くので横並びは
 * 保たれるが、同じ縦列の中に中心の違う箱が並び、図の検査が揃いの誤りを出していた
 * (実測 = `split-router` を `swimlane` に置いて 5 件、`split-router` から `queue-depth` へ繋いで 9 件)。
 *
 * | 部品の縦列 | 要素を入れる縦列 |
 * |---|---|
 * | 1 本目 (頁で一番左) | 宿主の縦列。 画面側が「部品用の縦列の外にある要素」 で縦列に置いた部品を見分けるため残す |
 * | 2 本目以降 | 宿主の縦列の右に、部品の縦列の順で差し込んだ縦列 |
 *
 * **差し込む縦列は座標 (`posX` / `posY`) で固定しない普通の縦列にする**。 座標で固定した縦列は、
 * 描画側が並べる処理と矢印の札のために縦列の間を広げる処理の両方から外れる。 試作では部品どうしを
 * 繋ぐ矢印の札が宿主の縦列の境を貫いた (`lane-border-clearance`)。 普通の縦列なら並びも札の間も
 * 描画側が決め、要素を縦列の中心へ寄せるのは `縦列に置いた部品を揃える` が縦列ごとに行う。
 * 並びの鍵になる横位置 (`x`) だけは、宿主が横位置を持つ時に `差し込む縦列の横位置` が決める (#2147)。
 *
 * **名札を付けない**。 宿主の縦列の名札 (登場人物の名前) が部品全体の見出しになり、2 本目以降に
 * 部品の縦列の名札 (`出口` 等) を出すと、図の縦列の見出しの行に登場人物と部品の中の名前が混ざる。
 *
 * 同じ縦列に置いた部品どうしは、同じ番目の縦列を共有する (幅は広い方)。 要素は縦列の中心に
 * 揃うので、積んだ部品の 2 本目どうしも同じ中心に並ぶ。
 *
 * 返り値は、部品の縦列の id から要素を入れる図の縦列の id。 1 本目と要素を持たない縦列は入れない。
 * 要素を持つ縦列が 1 本以下の部品は何も差し込まず `undefined` を返す。
 */
function 部品の縦列を図に差し込む(
  target: CdlDiagram,
  part: CdlDiagram,
  宿主: string,
  置き方: 部品の置き方,
  倍率: number,
): Map<string, string> | undefined {
  const 要素を持つ = new Set(part.nodes.map((n) => n.lane));
  const 列 = part.lanes
    .map((l, 書いた順) => ({ l, 書いた順, x: 置き方.縦列.get(l.id)?.x ?? l.x ?? 0 }))
    .filter((c) => 要素を持つ.has(c.l.id))
    .sort((p, q) => p.x - q.x || p.書いた順 - q.書いた順);
  if (列.length < 2) return undefined;
  const 行き先 = new Map<string, string>();
  let 前 = 宿主;
  for (const [番目, c] of 列.entries()) {
    if (番目 === 0) continue;
    const id = `${宿主}__列${番目 + 1}`;
    const 幅 = (置き方.縦列.get(c.l.id)?.w ?? c.l.width) * 倍率;
    const 既に = target.lanes.find((l) => l.id === id);
    if (既に) {
      既に.width = Math.max(既に.width, 幅);
    } else {
      const 前の縦列 = target.lanes.find((l) => l.id === 前);
      const x = 前の縦列 === undefined ? undefined : 差し込む縦列の横位置(target, 前の縦列);
      const 前の位置 = 前の縦列 === undefined ? -1 : target.lanes.indexOf(前の縦列);
      target.lanes.splice(前の位置 < 0 ? target.lanes.length : 前の位置 + 1, 0, {
        id,
        width: 幅,
        ...(x === undefined ? {} : { x }),
      });
    }
    行き先.set(c.l.id, id);
    前 = id;
  }
  return 行き先;
}

/** 描画側 (`layoutLanes`) が縦列の間に空ける既定の幅。 描画側の `DEFAULT_LANE_GAP` と同じ (外へ出していない) */
const 描画側の縦列の間 = 80;

/**
 * 差し込む縦列の横位置 (#2147)。 `undefined` は横位置を持たせないこと。
 *
 * 描画側は縦列を横位置の小さい順に並べ、同じ横位置の縦列は書いた順に並べる。 横位置を持たない
 * 縦列は、書いた順で 1 つ前の縦列の右端から間を空けた位置になる。 差し込む縦列は書いた順で `前` の
 * すぐ後ろに入るので、`前` が横位置を持たなければ、横位置を持たないまま `前` のすぐ右に並ぶ。
 *
 * `前` が横位置を持つ時 (`lanes:` に `x` を書いた縦列) に横位置を持たせないと、見積もった位置が
 * 他の縦列の横位置を越え、その縦列より右に回る (実測 = `x: 0` を書いた `左` / `右` に分岐を置くと、
 * `左__列2` が `右` の右に描かれた)。
 *
 * | 描く順で `前` の次にある縦列 | 横位置 |
 * |---|---|
 * | 無い | 持たない = `前` の右端から並ぶ |
 * | 横位置を持たず、書いた順で `前` より後ろ | 持たない = 差し込むと、その縦列ごと右へずれる |
 * | 上記以外 | `前` と次の縦列の真ん中 (同じ横位置なら `前` と同じ) |
 *
 * **真ん中にする**。 描画側は縦列の中心の間隔を全ての組で一番広い組に揃える。 `前` と同じ横位置に
 * すると、差し込んだ縦列と次の縦列の間がそのまま全体の間隔になり、`x: 0` と `x: 900` を書いた図で
 * 右の縦列の左端が 1,900 まで押し出された (真ん中なら 980)。 縦列の幅にも依らないので、後で
 * `縦列に置いた部品を揃える` が縦列を広げても並びは変わらない。
 *
 * 座標 (`posX` / `posY`) で固定した縦列は描画側の並べる処理から外れるので、並びの相手にしない。
 */
function 差し込む縦列の横位置(
  target: CdlDiagram,
  前: CdlDiagram["lanes"][number],
): number | undefined {
  if (前.x === undefined) return undefined;
  const 間 = target.viewport?.laneGap ?? target.viewport?.gap ?? 描画側の縦列の間;
  const 前の順 = target.lanes.indexOf(前);
  let 次: { x: number; 後ろで動く: boolean } | undefined;
  // 横位置を持たない縦列の位置は、描画側と同じく書いた順に積んで見積もる
  let 見積もり = 0;
  for (const [順, l] of target.lanes.entries()) {
    if (l.posX !== undefined && l.posY !== undefined) continue;
    const x = l.x ?? 見積もり;
    見積もり = x + l.width + 間;
    if (l === 前 || x < 前.x || (x === 前.x && 順 < 前の順)) continue;
    // 同じ横位置の縦列は書いた順に並ぶので、先に見つけた方が次になる
    if (次 === undefined || x < 次.x) 次 = { x, 後ろで動く: l.x === undefined && 順 > 前の順 };
  }
  if (次 === undefined || 次.後ろで動く) return undefined;
  return (前.x + 次.x) / 2;
}

type 縦列に置いた部品 = { 縦列: string; 要素: ReadonlySet<string> };

/** 部品が縦列より広い時に、縦列の左右に残す余白。 描画側が縦列の中の箱に取る最小の余白と同じ */
const 部品の縦列の余白 = 25;

/**
 * 縦列に置いた部品を、縦列の中心と図の下へ動かす (#1980)。
 *
 * 部品は座標で置く (部品の中の要素の並びを保つため)。 座標で置いた箱は描画側の配置が動かさないので、
 * 縦列の位置を知るには図を 1 度配置する。
 *
 * **配置は 1 度で足りる**。 縦列の横位置は縦列の幅・中の箱の幅・矢印の札で決まり、座標で置いた箱の
 * 座標には依らない。 部品を動かしても縦列は動かない。
 *
 * | 向き | 置き方 |
 * |---|---|
 * | 横 | 要素を入れた縦列ごとに、その要素の中心を縦列の中心に合わせる。 要素が縦列より広ければ縦列を広げ、配置し直す |
 * | 縦 | 部品以外の箱の一番下から `PARTS_GAP` 空ける。 同じ縦列の部品は書いた順に下へ積む。 部品の要素は全て同じだけ動かす |
 *
 * 縦列を 2 本以上持つ部品は、要素が宿主の縦列と差し込んだ縦列に分かれている
 * (`部品の縦列を図に差し込む`、#2145)。 横を部品全体の中心で合わせると、差し込んだ縦列の要素が
 * 自分の縦列の中心からずれるので、縦列ごとに合わせる。
 *
 * **縦列の段には入れない**。 段の高さは縦列をまたいで共有され、背の高い部品を段に入れると隣の
 * 縦列の箱まで伸びる (実測 = `受付` の高さが 68 から 380 になった)。
 *
 * 配置できない図 (描画側が止める図) では動かさない。 描画でも同じ所で止まるので、ここで
 * 別の知らせは足さない。
 */
function 縦列に置いた部品を揃える(target: CdlDiagram, 置いた: readonly 縦列に置いた部品[]): void {
  if (置いた.length === 0) return;
  const 配置する = (): LaidDiagram | undefined => {
    try {
      return layout(target);
    } catch {
      return undefined;
    }
  };
  let laid = 配置する();
  if (!laid) return;
  const 範囲 = (d: LaidDiagram, 要素: ReadonlySet<string>) => {
    const 箱 = d.nodes.filter((n) => 要素.has(n.id));
    if (箱.length === 0) return undefined;
    return {
      x0: Math.min(...箱.map((n) => n.cx - n.w / 2)),
      x1: Math.max(...箱.map((n) => n.cx + n.w / 2)),
      y0: Math.min(...箱.map((n) => n.cy - n.h / 2)),
      y1: Math.max(...箱.map((n) => n.cy + n.h / 2)),
    };
  };
  // 部品の要素を、入れた縦列ごとに分ける。 縦列を 1 本しか持たない部品は宿主の縦列 1 つになる
  const 縦列ごと = (要素: ReadonlySet<string>): Map<string, Set<string>> => {
    const 出力 = new Map<string, Set<string>>();
    for (const n of target.nodes) {
      if (!要素.has(n.id)) continue;
      const 組 = 出力.get(n.lane) ?? new Set<string>();
      組.add(n.id);
      出力.set(n.lane, 組);
    }
    return 出力;
  };
  // 要素より狭い縦列を広げる。 描画側は縦列を中の箱 1 つの幅までしか広げず、同じ縦列の中で
  // 要素を横に並べた部品は隣の縦列へはみ出す
  let 広げた = false;
  for (const p of 置いた) {
    for (const [縦列のid, 組] of 縦列ごと(p.要素)) {
      const r = 範囲(laid, 組);
      const 縦列 = target.lanes.find((l) => l.id === 縦列のid);
      const 描いた縦列 = laid.lanes.find((l) => l.id === 縦列のid);
      if (!r || !縦列 || !描いた縦列) continue;
      const 要る幅 = r.x1 - r.x0 + 部品の縦列の余白 * 2;
      if (要る幅 > 描いた縦列.width && 要る幅 > 縦列.width) {
        縦列.width = 要る幅;
        広げた = true;
      }
    }
  }
  if (広げた) {
    laid = 配置する();
    if (!laid) return;
  }
  // 動かした後に配置し直して確かめ、狙いと合うまで繰り返す。 座標で置いた箱が他の箱と重なると
  // 描画側は他の箱を下げるため、仮の位置 (図の上端) のまま測った下端は実際より下にずれる
  // (実測 = 狙った上端 316 が 400 になった)。 部品を図の下へ動かせば重ならなくなり、2 回目で合う
  const 部品の要素 = new Set(置いた.flatMap((p) => [...p.要素]));
  for (let 回 = 0; 回 < 部品を揃え直す上限; 回 += 1) {
    // 下端は部品以外の箱 (格子に並べた部品を含む) と縦列の名札で測る。 箱を囲む縦列 (`contain`) は
    // 仮に置いた部品まで囲んでいるため数えない = 中の箱は箱として数えている
    const 他の箱の下端 = Math.max(
      ...laid.nodes.filter((n) => !部品の要素.has(n.id)).map((n) => n.cy + n.h / 2),
      ...laid.lanes.filter((l) => !l.contain).map((l) => l.y + l.height),
    );
    const 次の上端 = new Map<string, number>();
    let 動かした = false;
    for (const p of 置いた) {
      const r = 範囲(laid, p.要素);
      if (!r || !laid.lanes.some((l) => l.id === p.縦列)) continue;
      const 上端 = 次の上端.get(p.縦列) ?? 他の箱の下端 + PARTS_GAP;
      const dy = 上端 - r.y0;
      次の上端.set(p.縦列, 上端 + (r.y1 - r.y0) + PARTS_GAP);
      for (const [縦列のid, 組] of 縦列ごと(p.要素)) {
        const 組の範囲 = 範囲(laid, 組);
        const 縦列 = laid.lanes.find((l) => l.id === 縦列のid);
        if (!組の範囲 || !縦列) continue;
        const dx = 縦列.x + 縦列.width / 2 - (組の範囲.x0 + 組の範囲.x1) / 2;
        if (Math.abs(dx) <= PLACEMENT_TOLERANCE && Math.abs(dy) <= PLACEMENT_TOLERANCE) continue;
        for (const n of target.nodes) {
          if (!組.has(n.id) || n.posX === undefined || n.posY === undefined) continue;
          n.posX += dx;
          n.posY += dy;
        }
        動かした = true;
      }
    }
    if (!動かした) return;
    laid = 配置する();
    if (!laid) return;
  }
}

/** 縦列に置いた部品を配置し直して確かめる回数の上限。 実測では 2 回目で動かなくなる */
const 部品を揃え直す上限 = 3;

/**
 * 状態の初期値に上書きを当てた結果と、 色として読めないため捨てたかどうか。
 *
 * **元の値が色の状態は、 上書きも色に限る** (#1004)。 状態の値は `fill` に入るため、
 * `url(https://example.invalid/x)` のような外部を指す値を通すと、 図を開いた人の環境から
 * その URL へ要求が飛ぶ。 書き出した SVG を配布しても同じことが起きる。
 * 色として読めない上書きは捨てて元の色を残す = 図は出るが外部は指さない。
 *
 * 元の値が色でない状態 (数値 / 文字列) は制限しない。 色として描かれないため、
 * 一律に弾くとゲージの値や説明文の差し替えという正当な用途を壊す。
 *
 * 捨てたことは呼出側が知らせる。 黙って捨てると、 書いた人は色が変わらない理由
 * (書き間違い / 拒否 / 描画不具合) を区別できない。
 */
function resolveStateOverride(
  original: number | string,
  override: number | string | boolean | undefined,
): { initial: number | string; rejected: boolean } {
  if (override === undefined) return { initial: original, rejected: false };
  if (isColorValue(original) && !isColorValue(override))
    return { initial: original, rejected: true };
  return { initial: override as number | string, rejected: false };
}

/**
 * `色:` に書かれた色番号を、 パーツが持つ色の状態に入れる。
 *
 * 色を保持する状態の名前はパーツごとに違う (`bg` / `stFill` / `gFill` / `hue` など)。 名前を
 * 決め打ちすると、 別の名前を使うパーツで色を書いても何も起きない。
 *
 * パーツの状態のうち初期値が色番号のものを探して、 そこに入れる。 複数あれば全部に入れる
 * (`cpuC` / `memC` / `netC` のように系統ごとに分かれている場合、 1 つだけ変えるとちぐはぐになる)。
 */
function applyColorHex(
  part: CdlDiagram,
  colorHex: string | undefined,
  stateOverride: Record<string, number | string | boolean>,
): Record<string, number | string | boolean> {
  if (!colorHex) return stateOverride;
  const colorStates = part.states.filter((st) => isColorValue(st.initial));
  if (colorStates.length === 0) return stateOverride;
  const out = { ...stateOverride };
  for (const st of colorStates) {
    // 名前を指定して書いた値が優先。 `色:` はまとめて塗る指定
    if (out[st.id] === undefined) out[st.id] = colorHex;
  }
  return out;
}

/**
 * 本文に書いた状態の上書きと色番号を、部品の図そのものに当てて返す (#1973)。
 *
 * 編集画面の本文欄は、部品を図から抜いて別に重ねて描く。 重ねる側が部品の図をそのまま
 * 描くと、`state: { lvl: 0.4 }` や `color: "#d9534f"` がカタログの絵にだけ効き、
 * 編集画面では既定の値で描かれる。 値の決め方は組み立て側と同じ 2 つの関数を通す。
 *
 * `phase: false` は組み立て側と同じく部品の段を外す。 段の数は残し、中身 (点灯と値の変化)
 * だけを空にする = 段を消すと、重ねた部品だけ段の進みが止まらない形になる。
 *
 * 色として読めない上書きは組み立て側と同じく捨てる。 知らせは組み立て側が出すため、
 * ここでは出さない (同じ本文で 2 度出さない)。
 */
export function 部品に上書きを当てる(
  part: CdlDiagram,
  actor: Pick<DslActor, "stateOverride" | "colorHex">,
): CdlDiagram {
  const 上書き = applyColorHex(part, actor.colorHex, actor.stateOverride ?? {});
  const 段を外す = 上書き["phase"] === false;
  if (Object.keys(上書き).length === 0) return part;
  return {
    ...part,
    states: part.states.map((st) => ({
      ...st,
      initial: resolveStateOverride(st.initial, 上書き[st.id]).initial,
    })),
    phases: 段を外す
      ? part.phases.map((ph) => ({ ...ph, activate: [], tweens: [], sets: [] }))
      : part.phases,
  };
}

/**
 * 値と状態の名前に使う前置きを、登場人物の名前から作る (#1189)。
 *
 * `{名前}` に書ける字種は engine が 1 箇所で決めており (`template-name.ts`)、英数字と `_` に
 * 限る。 **読む側 (置き換え) と書ける側 (式) の両方がその定義を使う** ため、記法の側だけ
 * 広げることはできない。
 *
 * この記法では日本語の名前が普通なので、名前をそのまま前置きにすると値が 1 つも届かない。
 * 実測 = `受付 1` に見本を重ねると、状態は表に載るのに箱の `{受付 1__v}` が置き換わらず、
 * 見本の中の式は識別子として読めずに止まる (`value-unresolved`)。
 *
 * **箱 / 縦列 / 矢印の id は変えない**。 これらは `{名前}` の対象ではなく、画面側が id から
 * 登場人物の名前を取り出す経路があるため、変えると別の場所が壊れる。
 *
 * ## 同じ形に潰れる名前
 *
 * `受付 1` と `受付-1` はどちらも英数字だけにすると同じ形になる。 潰れたまま使うと 2 つの
 * 見本が同じ名前空間を共有し、片方の値がもう片方を上書きする。
 *
 * そこで **書いた順に番号を足して分ける**。 先に書いた方が番号なしを取り、後から同じ形に
 * なった方が `_2` / `_3` と続く。 英数字の名前しか無い図では 1 つも番号が付かないため、
 * 既存の図の名前は変わらない。
 */
function 値の前置きを作る(名前たち: readonly string[]): Map<string, string> {
  const 出力 = new Map<string, string>();
  const 使用中 = new Set<string>();
  const 次の番号 = new Map<string, number>();
  for (const 名前 of 名前たち) {
    if (出力.has(名前)) continue;
    let 素 = 名前
      .normalize("NFKC")
      .replace(/[^A-Za-z0-9_]+/g, "_")
      .replace(/^_+|_+$/g, "");
    // 空になる形 (記号だけの名前) と数字始まりは、そのままでは名前として使えない
    if (素 === "" || /^[0-9]/.test(素)) 素 = `p${素}`;
    // 接尾辞で分けた名前も使用済みとして扱う。 `p1` / `p1!` / `p1_2` の順では、
    // base ごとの回数だけを見ると後ろ 2 つがどちらも `p1_2` になって再衝突する
    let 候補 = 素;
    let 番号 = 次の番号.get(素) ?? 2;
    while (使用中.has(候補)) {
      候補 = `${素}_${番号}`;
      番号 += 1;
    }
    次の番号.set(素, 番号);
    使用中.add(候補);
    出力.set(名前, 候補);
  }
  return 出力;
}

/**
 * CAR-1657 = parts CdlDiagram (単一 part 内容) を target CdlDiagram に prefix 付きで merge する。
 * alias = user が書く actor 名 ('arc1')、 全 id を '{alias}__{origId}' で prefix、 lane 参照 rename、
 * state initial は stateOverride で上書き可、 shape / subtitle / value 内の '{stateName}' template は
 * 値の前置き ('{valueAlias}__{stateName}'、 #1189) に rewrite する。 見本が持つ他の値から決まる値
 * (`derived`) も同じ前置きで閉じる (#1180)。 phase parallel merge (activate / tweens / sets の id 参照 rename)。
 */
function mergePartIntoDiagram(
  target: CdlDiagram,
  part: CdlDiagram,
  alias: string,
  stateOverride: Record<string, number | string | boolean>,
  laneMapping: string | undefined,
  /**
   * parts drop 位置 (drag-and-drop or click 追加時に呼出側が SVG viewBox 座標を書出す)。
   * 未指定 = 従来 (lane.x = 0 baked-in で canvas 左端に描画)、 指定時 = parts 内部 lane の
   * x / y に加算して drop 座標付近に描画。 D1 forensic (drop 座標乖離) の core fix。
   */
  offsetX?: number,
  offsetY?: number,
  /**
   * parts 全体 resize 対応 (I2 forensic) = parts を Miro 相当の「1 unit」 として扱い、
   * user が SE handle drag で拡大すると actor.posW/posH が書出される。 compile で受け取り、
   * parts 全 sub-node の w / h と cx / cy 相対位置に scale 係数を適用して等比拡大する。
   * 未指定 = 従来の parts 原寸 で描画 (scale なし)。
   */
  targetW?: number,
  targetH?: number,
  /** 書いたのに使わなかった上書きを知らせる口。 黙って捨てると理由を追えない (#1004) */
  onNotice?: (notice: CompileNotice) => void,
  /** 知らせに載せる行。 パーツを書いた行を指す。 行が取れない経路 (JSON) では 0 */
  noticeLine = 0,
  /** 見本から引き継いだ値の宣言元。 notice を見本を書いた行へ戻すために使う */
  derivedSourceLines?: Map<string, number[]>,
  /**
   * 値と状態の名前に使う前置き (#1189)。 `{名前}` は英数字と `_` しか読めないため、
   * 登場人物の名前をそのまま使えない。 渡されない経路では従来どおり名前をそのまま使う
   */
  valueAlias?: string,
  /**
   * 部品を図の縦列の中に置くか (#1980)。 置く時は、部品の 2 本目以降の縦列を図の縦列として
   * 差し込む (`部品の縦列を図に差し込む`、#2145)。 位置を書いた部品は `laneMapping` を持っても
   * 縦列の中に置かないので渡さない
   */
  縦列の中に置く = false,
): 部品用の縦列[] {
  const prefix = (id: string): string => `${alias}__${id}`;
  // 値と状態だけ別の前置きを使う (#1189)。 箱 / 縦列 / 矢印の id は `prefix` のまま
  const 値前置き = valueAlias ?? alias;
  const valuePrefix = (id: string): string => `${値前置き}__${id}`;
  // 見本が自分で持つ名前。 **状態と、他の値から決まる値の両方** (#1180)。
  //
  // 値を含めないと、見本の中の `{決まる値}` が名前を付け替えられずに残り、重ねた先の同名の
  // 値を指してしまう (見本どうしが互いの値を読む形になる)。
  const ownIdSet = new Set([
    ...part.states.map((s) => s.id),
    ...(part.derived ?? []).map((d) => d.id),
  ]);
  const rewriteTemplate = (s: string | undefined): string | undefined => {
    if (!s) return s;
    return s.replace(/\{(\w+)\}/g, (m, name: string) => {
      return ownIdSet.has(name) ? `{${valuePrefix(name)}}` : m;
    });
  };
  // 値の式は見本の名前空間の中で閉じる。 見本が持つ名前だけを書き換えると、綴り違いの参照が
  // 取り込み先の同名の値に偶然つながり、単体では止まる見本の意味が置いた場所で変わる。
  //
  // **どれが参照かは engine に決めさせる**。 engine は `{v}` と裸の `v` の両方を参照として
  // 読み、関数名 (`min` / `Math.max` 等) は参照に数えない (実測)。 ここで関数の一覧を持つと
  // 記法側 (`value-syntax.ts`) と engine に続く 3 つ目の写しになり、engine が関数を足した時に
  // 静かにずれる。
  const rewriteDerivedExpression = (expression: string): string => {
    try {
      return writeFormula(renameFormulaIdentifiers(parseFormula(expression), valuePrefix));
    } catch {
      // 読めない式は engine が止めて伝える (`value-unresolved`)。 書き換えられないので
      // そのまま載せる = 名前は前置き無しのままだが、式自体が解けないため値は出ない
      return expression;
    }
  };

  // 決定的 lane 参照 = user が書いた lane 指定を優先、 なければ parts 内部 lane を prefix 付きで作る
  const targetLaneId = laneMapping;
  const laneIdMap = new Map<string, string>();
  // 部品用に作った縦列。 組み込んだ後に部品の位置へ固定する (#1990)
  const 作った縦列: 部品用の縦列[] = [];
  // parts lane の横位置。
  //   offset (drop / click 座標) 指定時 = part 中心を offsetX に合わせる = user が置いた位置に
  //     parts の中心が来る。 node は lane 中心 (lane.x + laneW/2) に描画されるため、 lane 左端を
  //     offsetX - laneW/2 に置くと node 中心 = offsetX となり cursor / viewport 中央に一致する
  //     (縦方向 offsetY と対称、 offsetY 側は要素全体の縦の中心で合わせる = `部品の置き方を読む`)。
  //     従来の auto-adjust (max(offsetX, existingMax + gap) で既存 lane 右端へ強制右寄せ) は user
  //     directive で廃止 (2026-07-21)。 重なりは user の意図位置を優先し、 手動移動で回避する経路。
  //   未指定 (座標なし fallback) 時のみ existingMax + gap で右外配置 (通常経路は drop/click で座標を渡す)。
  const PARTS_LANE_GAP = 300;
  const existingLaneMaxX =
    target.lanes.length > 0 ? Math.max(...target.lanes.map((l) => (l.x ?? 0) + l.width)) : 0;
  // parts 全体 resize (I2 forensic): user が SE handle drag で targetW/H 指定 = actor.posW/H。
  // scale 基準は part 全体の bbox 幅 (全 lane の最左端〜最右端) にする。 lane[0] 幅だけを基準にすると
  // multi-lane part (複数 lane を横に並べた part) で全体幅を過小評価し、 非先頭 lane の node が自 lane
  // 中心からずれる (#880)。
  //
  // 縦列の位置と幅、要素の中心は部品の頁で配置した値を使う (`部品の置き方を読む`、#1992)。
  // 書いた値で置くと、頁で描画側が広げた縦列の間と段の間が消え、要素が頁より詰まる。
  // 伸縮の基準は画面側 (`partScaleFactor`) と同じ関数から取る
  const 置き方 = 部品の置き方を読む(part);
  const 伸縮の基準 = partScaleBase(part);
  // 非有限は 1 に倒す。 桁が溢れた `大きさ:` (`Number()` が Infinity を返す長さ) を
  // そのまま掛けると描けない座標になり、 大きさを見積る側 (`partTargetScale`) だけが
  // 1 に倒していたため経路で食い違っていた (#1018)
  const rawLaneScaleX = targetW !== undefined && targetW > 0 ? targetW / 伸縮の基準.w : 1;
  const laneScaleX = Number.isFinite(rawLaneScaleX) && rawLaneScaleX > 0 ? rawLaneScaleX : 1;
  // part 全体を「元 bbox 中心 → drop 座標」 の scale 変換で写す単一式 mapLaneX。 lane も node も同じ式で
  // 変換し、 lane.x = mapLaneX(元 lane 左端) にすることで全 lane / 全 node が一貫して drop 座標を中心に
  // scale 配置される (cc-codex #879 の mapPartX と同じ発想を lane push まで前倒し、 #880 root fix)。
  // node 側は `部品の要素のずれ` が同じ中心と倍率で写す
  const partOrigBboxCenterX = 置き方.左端 + 置き方.幅 / 2;
  const dropCenterX =
    offsetX !== undefined
      ? offsetX
      : existingLaneMaxX + PARTS_LANE_GAP + (置き方.幅 * laneScaleX) / 2;
  const mapLaneX = (x: number): number => (x - partOrigBboxCenterX) * laneScaleX + dropCenterX;

  const 差し込んだ縦列 =
    targetLaneId !== undefined && 縦列の中に置く
      ? 部品の縦列を図に差し込む(target, part, targetLaneId, 置き方, laneScaleX)
      : undefined;
  for (const laneOrig of part.lanes) {
    if (targetLaneId) {
      laneIdMap.set(laneOrig.id, 差し込んだ縦列?.get(laneOrig.id) ?? targetLaneId);
    } else {
      const newLaneId = prefix(laneOrig.id);
      laneIdMap.set(laneOrig.id, newLaneId);
      // lane の左端を mapLaneX で変換 = 元 lane 左端 (x) を scale 変換後の位置に置く。 lane 幅も
      // scale して lane 中心が mapLaneX(元 lane 中心) に一致する。 これで multi-lane でも各 lane が
      // part 全体の scale 変換に沿って配置される。
      const geom = 置き方.縦列.get(laneOrig.id) ?? { x: 0, w: 400 };
      target.lanes.push({
        ...laneOrig,
        id: newLaneId,
        label: laneOrig.label ?? alias,
        x: mapLaneX(geom.x),
        width: geom.w * laneScaleX,
      });
      作った縦列.push({ id: newLaneId, 部品の名札: laneOrig.label });
    }
  }

  // parts drop 位置 fix (D1 + D2 root fix):
  //   D2 = parts の stack 番号 (0/1/2/…) が target sequence の stack と衝突すると
  //        CDL layout の rowH 計算で全 lane の同 row cy が拡張、 sequence footer 等が縦 shift。
  //        → 2 段防御 で分離する:
  //             (1) 全 parts node に posX/posY 明示 set (CDL layout の絶対配置経路 = stack 計算 skip)
  //             (2) parts の stack 番号を target 側 max stack + STACK_ISOLATION_OFFSET (1000) に shift
  //                 = 万一 layout が rowH で参照しても sequence stack と重ならず影響 0 化
  //   D1 = drop 座標尊重 = 部品の頁で配置した要素の中心を、部品の中心が drop 座標に来るよう
  //        写して描画する (#1992、`部品の要素のずれ`)。
  //
  const STACK_ISOLATION_OFFSET = 1000;
  const shouldForcePos = offsetX !== undefined || offsetY !== undefined;
  // target 側の現在 max stack + isolation offset で parts node の stack を shift、
  // sequence の rowH 計算と完全分離 (D2 fix、 posX/posY 明示との 2 段防御)。
  const targetMaxStack =
    shouldForcePos && target.nodes.length > 0
      ? Math.max(...target.nodes.map((n) => n.stack ?? 0))
      : 0;
  const stackShiftBase = shouldForcePos ? targetMaxStack + STACK_ISOLATION_OFFSET : 0;
  // parts 全体 resize scale (I2 forensic 対応): targetW / targetH 指定時、 parts の元 total size
  // に対する比率 = scale 係数、 全 sub-node の w / h + cx / cy 相対位置に scale 反映。
  // scaleX は lane push と同じ part bbox 幅基準 (laneScaleX) を使う = multi-lane で lane と node の
  // scale 係数が一致する (#880、 lane[0] 幅基準だと非先頭 lane の node がずれる)。
  // 縦の基準は段の送り幅の合計 (`partScaleBase`)。 `大きさ:` の縦は、この合計に対する倍率で掛かる
  const scaleX = laneScaleX;
  const rawScaleY = targetH !== undefined && targetH > 0 ? targetH / 伸縮の基準.h : 1;
  const scaleY = Number.isFinite(rawScaleY) && rawScaleY > 0 ? rawScaleY : 1;

  // 縦列を 2 本以上持つ部品を図の縦列に入れる時は、要素ごとに別の段番号を振る (#1980)。
  // 位置を書いた部品は縦列を 1 本へまとめるので、元の段番号のままだと横に並んでいた要素が同じ段で
  // 重なり、配置が止まる (実測 = `lane "b" の stack=1000 に node が重複`)。 縦列の中に置く部品は
  // 2 本目以降を別の縦列に入れる (#2145) が、振り直しても重ならない側に倒れるだけなので分けない。
  // 座標で置く要素の位置は段番号で決まらないので、振り直しても絵は変わらない
  const 段を振り直す = targetLaneId !== undefined && shouldForcePos && part.lanes.length > 1;
  // node merge = id prefix + lane 参照 rewrite + shape / subtitle / value 内 template rewrite
  for (const [nodeIndex, nodeOrig] of part.nodes.entries()) {
    const mappedLane = laneIdMap.get(nodeOrig.lane) ?? nodeOrig.lane;
    // 形の中の文字は、入れ子の底まで辿って差し替える。
    // 1 段だけ見る形だと `fill: { gradient: "{v}" }` のような書き方が置き換わらずに残る。
    let newShape = nodeOrig.shape
      ? deepRewriteStrings(nodeOrig.shape, rewriteTemplate)
      : undefined;
    // parts 全体 resize (I2 forensic): shape 内 radius / outerRadius / innerRadius / thickness に
    // scale 反映 = user が SE handle drag で拡大すると shape の見た目も比例拡大される。 scaleX を採用
    // (等比 scale 相当、 縦方向 scaleY と乖離する場合は近似)、 shape 内数値 field のうち幾何寸法系
    // のみ scale 適用 (fill / stroke 色 field 等 non-numeric は影響なし)。
    if (newShape && (scaleX !== 1 || scaleY !== 1)) {
      const shapeScale = Math.min(scaleX, scaleY); // 等比 scale で circle 崩れ回避
      const geomKeys = new Set(["radius", "outerRadius", "innerRadius", "thickness"]);
      const scaleGeom = (obj: unknown): unknown => {
        if (obj === null || typeof obj !== "object") return obj;
        if (Array.isArray(obj)) return obj.map(scaleGeom);
        const out: Record<string, unknown> = {};
        for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
          if (geomKeys.has(k) && typeof v === "number") {
            out[k] = v * shapeScale;
          } else if (typeof v === "object" && v !== null) {
            out[k] = scaleGeom(v);
          } else {
            out[k] = v;
          }
        }
        return out;
      };
      newShape = scaleGeom(newShape);
    }
    // parts drop 位置 offset 反映:
    //   - node.posX / posY set 済 (parts が座標を持つ) = 横は part 中心基準で scale 変換、縦は offsetY を足す
    //   - offset 指定時 (drop 経路) で未設定 = 部品の頁で配置した node の中心を同じ式で変換
    //   - offset なし (従来経路) は auto layout 継続 (posX / posY undefined)
    //
    // 明示 posX と頁の中心の両経路を、 lane push と同じ中心と倍率で写す (cc-codex #879 Round 2/3
    // + #880)。 写す式は見積り (`partExtent`) と共有する `部品の要素のずれ` が持つため、
    // lane.x != 0 でも multi-lane でも node 中心と自 lane 中心が一致し、格子が確保した場所とも一致する。
    //
    // offset なしの経路 (格子が場所を返さない部品だけが通る) では、node が書いた縦位置は
    // `...nodeOrig` がそのまま残す。 足す offsetY が無いので写す必要が無い
    const 頁 = 置き方.要素[nodeIndex] ?? { x: partOrigBboxCenterX, y: 0 };
    const ずれ = 部品の要素のずれ(nodeOrig, 頁, 置き方, scaleX, scaleY);
    const nodePosX =
      shouldForcePos || nodeOrig.posX !== undefined ? dropCenterX + ずれ.dx : undefined;
    const nodePosY = shouldForcePos ? (offsetY ?? 0) + ずれ.dy : undefined;
    // parts sub-node の w / h に scale 適用 (I2 forensic 対応、 targetW/H 指定時のみ)
    // catalog の値は呼出側が渡すので、 拡大しない時も数として通るか確かめる。 通さないと
    // 座標が非有限になって図が描けない (実測 = 箱の中心が NaN になった)
    const rawNodeW = nodeOrig.w !== undefined ? positiveOr(nodeOrig.w, 200) : undefined;
    const rawNodeH = nodeOrig.h !== undefined ? positiveOr(nodeOrig.h, 200) : undefined;
    const nodeW =
      rawNodeW !== undefined && (scaleX !== 1 || scaleY !== 1) ? rawNodeW * scaleX : rawNodeW;
    const nodeH =
      rawNodeH !== undefined && (scaleX !== 1 || scaleY !== 1) ? rawNodeH * scaleY : rawNodeH;
    target.nodes.push({
      ...nodeOrig,
      id: prefix(nodeOrig.id),
      lane: mappedLane,
      title: rewriteTemplate(nodeOrig.title) ?? nodeOrig.title,
      subtitle: rewriteTemplate(nodeOrig.subtitle),
      value: rewriteTemplate(nodeOrig.value),
      // parts stack を target 側と分離 (D2 fix、 posX/posY 明示との 2 段防御)
      stack: (段を振り直す ? nodeIndex : (nodeOrig.stack ?? 0)) + stackShiftBase,
      ...(newShape ? { shape: newShape as CdlDiagram["nodes"][number]["shape"] } : {}),
      ...(nodePosX !== undefined ? { posX: nodePosX } : {}),
      ...(nodePosY !== undefined ? { posY: nodePosY } : {}),
      ...(nodeW !== undefined ? { w: nodeW } : {}),
      ...(nodeH !== undefined ? { h: nodeH } : {}),
    });
  }

  // state merge = id prefix + initial override
  for (const stateOrig of part.states) {
    const { initial, rejected } = resolveStateOverride(
      stateOrig.initial,
      stateOverride[stateOrig.id],
    );
    if (rejected) {
      onNotice?.({
        kind: "state-override-rejected",
        actor: alias,
        line: noticeLine,
        message: `"${alias}" の ${stateOrig.id} に書いた値は色として読めないため使いません`,
        hint: "色は `#ff0000` のような色番号か、 `red` のような色名で書く",
      });
    }
    target.states.push({ id: valuePrefix(stateOrig.id), initial });
  }

  // 見本が持つ「他の値から決まる値」 を引き継ぐ (#1180)。
  //
  // 引き継がないと、見本の中で書いた関係が重ねた先で解かれず、その値を読む箱に `{名前}` の
  // 生の形が出る。 名前は状態と同じ規則で前置きを付ける = 見本を 2 つ重ねても互いの値を
  // 読まない。 式の中の参照は、未定義の名前も含めて見本の名前空間へ閉じ込める。
  for (const derivedOrig of part.derived ?? []) {
    if (!target.derived) target.derived = [];
    const id = valuePrefix(derivedOrig.id);
    target.derived.push({
      id,
      expression: rewriteDerivedExpression(derivedOrig.expression),
    });
    recordDerivedSourceLine(derivedSourceLines, id, noticeLine);
  }

  // edge merge = id / from / to prefix (parts 内 edge は稀だが対応)
  for (const edgeOrig of part.edges) {
    target.edges.push({
      ...edgeOrig,
      id: prefix(edgeOrig.id),
      from: prefix(edgeOrig.from),
      to: prefix(edgeOrig.to),
    });
  }

  // 数値を表示する部品 (`percent-ring` / `sparkline` / `donut` / KPI 等) は、箱と値だけでは描かれず
  // `readouts` が要る。 取り込む時は全ての `readouts` に名前の前置きを付け、
  // 参照先 (`source` / `historySource` / `*Source`) の差し込み文字も書き換える。
  if (part.readouts && part.readouts.length > 0) {
    if (!target.readouts) target.readouts = [];
    for (const readoutOrig of part.readouts) {
      const rewritten = deepRewriteStrings(
        readoutOrig,
        rewriteTemplate,
      ) as CdlDiagram["readouts"] extends readonly (infer R)[] ? R : never;
      // id は shape 全 walk で rewrite されないので個別に prefix
      target.readouts.push({
        ...(rewritten as { id: string }),
        id: prefix((rewritten as { id: string }).id),
      } as CdlDiagram["readouts"] extends readonly (infer R)[] ? R : never);
    }
  }

  // 部品の縦列は、取り込み先の縦列の後ろに足すのではなく同じ順番の縦列に重ねる (既定は同時進行)。
  // 長さは長い方を採り、光らせる対象と動きと値の設定は両方を合わせる。
  // 本文が `phase: false` と書いている時は、部品側の縦列を捨てる。
  const phaseOptOut = stateOverride["phase"] === false;
  if (phaseOptOut) {
    return 作った縦列; // parts phase を破棄、 activate / tweens / sets の rewrite 不要
  }
  if (target.phases.length === 0) {
    // target に phase なし = parts phase をそのまま追加 (prefix 付き)
    for (const phaseOrig of part.phases) {
      target.phases.push({
        ...phaseOrig,
        id: prefix(phaseOrig.id),
        activate: phaseOrig.activate.map(prefix),
        tweens: phaseOrig.tweens.map((t) => ({ ...t, stateId: valuePrefix(t.stateId) })),
        sets: phaseOrig.sets.map((s) => ({ ...s, stateId: valuePrefix(s.stateId) })),
      });
    }
  } else {
    // parallel merge = 各 target phase に対応する parts phase を index-wise で合成 (min の phase 数まで)、
    // 残 parts phase は追加 append (target より parts phase 数が多い場合)
    const targetLen = target.phases.length;
    const partsLen = part.phases.length;
    const commonLen = Math.min(targetLen, partsLen);
    for (let i = 0; i < commonLen; i++) {
      const targetPhase = target.phases[i]!;
      const partPhase = part.phases[i]!;
      targetPhase.duration = Math.max(targetPhase.duration, partPhase.duration);
      targetPhase.activate = [...targetPhase.activate, ...partPhase.activate.map(prefix)];
      targetPhase.tweens = [
        ...targetPhase.tweens,
        ...partPhase.tweens.map((t) => ({ ...t, stateId: valuePrefix(t.stateId) })),
      ];
      targetPhase.sets = [
        ...targetPhase.sets,
        ...partPhase.sets.map((s) => ({ ...s, stateId: valuePrefix(s.stateId) })),
      ];
    }
    // parts phase 余剰は append (target より parts が長い場合)
    for (let i = commonLen; i < partsLen; i++) {
      const phaseOrig = part.phases[i]!;
      target.phases.push({
        ...phaseOrig,
        id: prefix(phaseOrig.id),
        activate: phaseOrig.activate.map(prefix),
        tweens: phaseOrig.tweens.map((t) => ({ ...t, stateId: valuePrefix(t.stateId) })),
        sets: phaseOrig.sets.map((s) => ({ ...s, stateId: valuePrefix(s.stateId) })),
      });
    }
  }
  return 作った縦列;
}

/**
 * 式の中の名前を付け替える (#1180)。
 *
 * **字句ではなく木を経由する**。 engine の式は `{v}` / 裸の `v` / 数字始まり / `$` 入りと
 * 参照の書き方が複数あり、正規表現で追うと書き方が 1 つ増えるたびに漏れる (review が 3 round
 * 続けて別の漏れを見つけた)。 木は識別子をそのまま持つので、字句を網羅しなくてよい。
 *
 * 関数呼び出し (`min` / `Math.max`) は木の上で別の種類なので、名前と取り違えない。
 */
function renameFormulaIdentifiers(ast: FormulaAst, rename: (name: string) => string): FormulaAst {
  switch (ast.type) {
    case "number":
      return ast;
    case "identifier":
      return { type: "identifier", name: rename(ast.name) };
    case "unaryOp":
      return { ...ast, operand: renameFormulaIdentifiers(ast.operand, rename) };
    case "binaryOp":
      return {
        ...ast,
        left: renameFormulaIdentifiers(ast.left, rename),
        right: renameFormulaIdentifiers(ast.right, rename),
      };
    case "ternary":
      return {
        type: "ternary",
        condition: renameFormulaIdentifiers(ast.condition, rename),
        whenTrue: renameFormulaIdentifiers(ast.whenTrue, rename),
        whenFalse: renameFormulaIdentifiers(ast.whenFalse, rename),
      };
    case "call":
      return { ...ast, args: ast.args.map((a) => renameFormulaIdentifiers(a, rename)) };
  }
}

/**
 * 数を、engine の読み手が受け付ける形で書く (#1180)。
 *
 * **指数表記を出さない**。 `0.0000001` は JavaScript の既定では `"1e-7"` になるが、engine の
 * 読み手は指数表記を読めない (実測 = `unexpected token after expression`)。 そのまま書くと、
 * 元は解けていた式が書き換えた後だけ止まる。
 *
 * 展開は桁をずらすだけで、丸めない。 `String` が返す最短の形をそのまま使うため、値は変わらない。
 * 有限でない数は書けないので投げる (呼出側が元の式のまま載せる)。
 */
function writeNumber(value: number): string {
  if (!Number.isFinite(value)) throw new Error(`cannot write non-finite number: ${String(value)}`);
  const s = String(value);
  if (!/[eE]/.test(s)) return s;
  const m = /^(-?)(\d+)(?:\.(\d+))?[eE]([+-]?\d+)$/.exec(s);
  if (!m) throw new Error(`cannot write number: ${s}`);
  const sign = m[1] ?? "";
  const int = m[2] ?? "";
  const frac = m[3] ?? "";
  const digits = int + frac;
  // 小数点の位置。 元の整数部の桁数を指数のぶんだけずらす
  const point = int.length + Number(m[4] ?? "0");
  if (point <= 0) return `${sign}0.${"0".repeat(-point)}${digits}`;
  if (point >= digits.length) return `${sign}${digits}${"0".repeat(point - digits.length)}`;
  return `${sign}${digits.slice(0, point)}.${digits.slice(point)}`;
}

/**
 * 式の木を文字列へ戻す (#1180)。
 *
 * **括弧を全て付ける**。 演算子の優先順位を再現しようとすると engine の表を写すことになり、
 * 表がずれた時に式の意味が静かに変わる。 括弧が増えても解いた結果は変わらない。
 */
function writeFormula(ast: FormulaAst): string {
  switch (ast.type) {
    case "number":
      return writeNumber(ast.value);
    case "identifier":
      // **裸で書ける形とそうでない形がある**。 engine は裸の名前を `[A-Za-z_$][\w$]*` で読む
      // 一方、波括弧の中は `\w+` なので数字始まりの名前は波括弧付きでしか書けない。
      // 名前は前置きで変わる (`1p__v` のように数字始まりになりうる) ため、書ける方を選ぶ
      return /^[A-Za-z_$][\w$]*$/.test(ast.name) ? ast.name : `{${ast.name}}`;
    case "unaryOp":
      // 空白は挟まない。 読み手は負の数を字面として持たず (`-5` は単項 `-` と `5` の木になる)、
      // `--5` も単項の 2 段として読む (実測)。 挟んでも挟まなくても意味が同じなので足さない
      return `(${ast.op}${writeFormula(ast.operand)})`;
    case "binaryOp":
      return `(${writeFormula(ast.left)} ${ast.op} ${writeFormula(ast.right)})`;
    case "ternary":
      return `(${writeFormula(ast.condition)} ? ${writeFormula(ast.whenTrue)} : ${writeFormula(ast.whenFalse)})`;
    case "call":
      return `${ast.fn}(${ast.args.map(writeFormula).join(", ")})`;
  }
}
