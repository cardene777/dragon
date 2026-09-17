/**
 * Dragon — Text DSL public API
 *
 * Mermaid 感覚で animated SVG を生成する Text DSL。 cdl engine を呼出して CdlDiagram を返す。
 *
 * 使い方:
 *   const diagram = textDslToDiagram(source);
 *   // diagram は @cardenelabs/cdl の CdlDiagram、 そのまま CdlDiagramView 等に渡せる
 */

export { parseTextDsl } from "./parser";
export { compileToCdl } from "./compile";
export type { CompileNotice } from "./compile";
/**
 * 組み立てた図の型 (#1415)。
 *
 * `textDslToDiagram` が返す型そのもので、実体は `@cardenelabs/cdl` が持つ。 使う側が
 * 戻り値に型を付けるには必ず要るので、ここから引けるようにする。
 *
 * 再 export が無い間、使う側は `@cardenelabs/cdl` を直接の依存に足す必要があった。
 * 足さずに書くと **型が暗黙の `any` に落ち、その先の `.map((n) => ...)` まで検査が効かなく
 * なる** (実測 = この 1 件が 39 件の暗黙 `any` を生んでいた)。
 */
export type { CdlDiagram } from "@cardenelabs/cdl";
export { parseTextDslV05 } from "./v05";
// 記法一覧が「実際に受け付ける値」 を実装から引くための公開。 手書きすると説明と実装がずれる。
export { DRAW_TARGETS, DRAW_WORDS, PHASE_ITEM_WORDS, PRESET_TYPES, TOP_LEVEL_KEYS } from "./v05/parser";
export { TONE_ALIAS, NODE_KIND_ALIAS, DIRECTION_ALIAS } from "./keywords";
export { lintDiagram, autoFix } from "./notation-lint";
export type { LintIssue, LintReport, LintSeverity } from "./notation-lint";
// canvas pivot 新 spec 図境界計算 helper (§diagram-boundary SSOT)
export { computeDiagramBoundingBox, rectsOverlap, DIAGRAM_BOUNDARY_PADDING } from "./canvas-bounds";
export type { DiagramBoundingBox } from "./canvas-bounds";
// 位置を相対で書くための解決。 組み立て側と画面側の両方が同じ規則を使うために公開する。
export {
  parseRelativePos,
  resolveRelativePos,
  orderByDependency,
  RELATIVE_GAP_DEFAULT,
} from "./relative-pos";
export type { RelativePos, RelativeDirection, AnchorBox } from "./relative-pos";
// 光らせる相手の書き方の読み取り。 図種ごとの解決経路が同じ規則を共有する。
export { parseFocusEntry } from "./focus";
export type { FocusEntry } from "./focus";
// 画面で見えている座標を記法に落とすための書込み。 記法を知る側に置く。
export { writeActorPosition } from "./write-position";
// 図の上での位置を測る。 editor が現在位置を出すのと、 相対指定を解くので同じ規則を使う。
export { measureActorBoxes } from "./compile";
// 本文に書いた部品の状態の上書きと色番号を、部品の図へ当てる。 編集画面が重ねて描く部品にも
// 組み立て側と同じ値を使う (#1973)
export { 部品に上書きを当てる } from "./compile";
// パーツの見た目の大きさと、 位置を書かなかった時の格子。 画面側と組み立て側で同じ規則を使う。
// 記法が受理する種類の全体。 画面側が「本文が見本を使っているか」 を判定するのに使う (#1022)。
export { NODE_KIND_VALID } from "./v05/parser";

// パーツの大きさを測る 3 つ。 用途で使い分ける (取り違えると経路ごとに絵が変わる)。
//
// - `partRenderSize` = 図枠。 画面が描く大きさと、 格子が確保する場所に使う
// - `partBoxInFrame` = 図枠の中の箱 (パーツ自身の座標)。 画面が書いた座標と相対指定を解くのに使う
// - `partVisualSize` = 箱の外接矩形 (merge の座標)。 組み立て側が取り込んだ後の大きさに使う
//
// 格子だけ図枠なのは、 隣と重ならない幅を確保するのが目的で描く大きさそのものが要るため。
// 座標と間隔は見えている箱で測る (#937 / #1014)。
// `大きさ:` の倍率は `partTargetScale` が持つ。 画面側も同じ規則で拡大しないと、
// 書いた見本だけ経路で大きさが変わる (#1018)。
// `partDrawsInDiagram` = その見本が図の中に描かれる部品を持つか。 実体が操作パネルの
// 部品だけの見本 (catalog 80 件中 17 件) は重ねても図に出ないため、画面側が知らせる (#1017)。
// `倍率:` (`scale`) は図形の倍率として予約する (#1026)。 画面と組み立てで意味が違うと、
// 同じ本文が経路で別の絵になる。 正規化 (`normalizePartScale`) と `大きさ:` との掛け合わせ
// (`partTargetSize`) を engine 側に置き、画面側も同じ関数を呼ぶ。
export {
  partRenderSize,
  partVisualSize,
  partBoxInFrame,
  partTargetScale,
  partTargetSize,
  partScaleFactor,
  normalizePartScale,
  MAX_PART_SCALE,
  partDrawsInDiagram,
  partIsMeasurable,
  partsBaseBottom,
  partsGridCenters,
} from "./compile";
// 色として読めるかの判定と、 図の外を指す値かの判定。 状態の上書きを受け取る側 / 画面が色欄を
// 作る側 / 画面が背景色を直接書く側で同じ物差しを使う (別々に持つと、 片方だけ直した時に片方が通す)。
export { isColorValue, pointsOutside, stripExternalPaint } from "./color";
// 引用符の外し方 (#1028)。 画面側が本文から見本を抜く時に同じ判定を使う。
// 別々に持つと、片方だけが読める本文ができる (実測 = `位置: '300,200"` が
// 画面側では座標 300 として通り、組み立て側では読めない値として知らせが出た)
export { stripQuotes } from "./v05/parser";

// 画面で色分けするための分解器 (#1310)。 色は持たず、種類名と位置だけを返す
export { 記法を分解する, JSONを分解する, 区間に広げる } from "./tokenize";
export type { トークン, トークンの種類 } from "./tokenize";
// 大きすぎる入力を組み立てる前に止める上限 (#1005)。 画面側も同じ物差しで事前に知らせられるよう公開する。
export {
  MAX_INPUT_ELEMENTS,
  MAX_INPUT_BYTES,
  countDocElements,
  countDiagramElements,
  countBytes,
  describeOversize,
  describeOversizeSource,
} from "./input-size";
export type { InputSize } from "./input-size";

// LLM 向け JSON DSL (Issue #208)
export { jsonToDiagram, validateDragonJson } from "./json-parser";
// JSON / YAML の本文で書いた場所を指す鍵 (#2117)。 表を作る側 (画面の YAML 欄) と引く側
// (`json-parser.ts`) が同じ規則を使うために公開する
export { 書いた場所の鍵 } from "./json-line-map";
export type { 書いた行の表 } from "./json-line-map";
export { diagramJsonSchema } from "./schema";
export type {
  DragonJson,
  JsonActor,
  JsonAxes,
  JsonStep,
  JsonPhase,
  JsonDslError,
} from "./json-parser";
export type {
  DslDocument,
  DslActor,
  DslStep,
  DslAnimate,
  DslState,
  DslPhase,
  DslTween,
  DslSet,
  // `DslDocument.values` を触る利用者が型を import できるようにする (#1169)。
  // 兄弟の `DslState` / `DslTween` / `DslSet` は公開されており、これだけ漏れていた
  DslValue,
  DslError,
  PresetType,
  DslLane,
  DslGroup,
  DslViewport,
  // CAR-1693 Phase 1: canvas pivot DSL 表面 pos + layout mode の public 型
  LayoutPos,
  LayoutMode,
} from "./types";

import { parseTextDsl } from "./parser";
import { parseTextDslV05 } from "./v05";
import { compileToCdl } from "./compile";
import { describeOversizeSource } from "./input-size";
import type { CompileNotice } from "./compile";
import type { CdlDiagram } from "@cardenelabs/cdl";

/**
 * CAR-1657 = compile 時 parts identifier lookup 用 catalog。
 * caller (CdlEditor 等) が loadPartsItems() の結果を Record<partId, CdlDiagram> で inject。
 * 未渡し時 partId set actor は「未解決」 として skip + console.warn (diagram render は継続)。
 */
export interface CompileOpts {
  partsCatalog?: Record<string, CdlDiagram>;
  /**
   * 図は出せるが書いた通りにならなかったことの受け取り口 (`位置: Web の下` が順序図で
   * 効かない等)。 判定は組み立て側が持ち、 呼出側は受け取って表示するだけにする。
   */
  onNotice?: (notice: CompileNotice) => void;
  /**
   * edge が DSL のどの行から来たかの受け取り口 (#998)。
   *
   * preset によっては書いた step と生成される edge が一致しない (`type: flow` は actor を鎖状に
   * 繋ぐため `a -> c` と書いても `a -> b` になる)。 edge を起点に本文の行を直す機能 (自動修正の
   * 書き戻し等) は、 この対応が無いと別の行を書き換える。
   *
   * **対応が取れない edge については呼ばれない**。 「対応が無い」 と「行 0」 を区別するため。
   */
  onEdgeSource?: (edgeId: string, line: number) => void;
}

/**
 * Dragon DSL から CdlDiagram に一発変換。 v0.5 (英語 keyword) / v0.4 (日本語 keyword) を auto-detect。
 *
 * 判定 ... src 内に v0.5 専用 syntax (`animation:` block / `- A -> B` flow / `step: "..."` ) を含むなら v0.5、
 * 含まなければ v0.4 (deprecated、 console.warn を出す)。
 *
 * エラー時は throw、 詳細を取りたい場合は parseTextDslV05 / parseTextDsl を直接呼ぶ。
 * opts.partsCatalog を渡すと CAR-1657 parts kind (arc-gauge 等) の actor が merge 展開される。
 */
export function textDslToDiagram(src: string, opts?: CompileOpts): CdlDiagram {
  // 読み取る前に大きさを見る (#1005)。 要素数の上限は読み取った後にしか分からないため、
  // 巨大な本文そのものによる待ちと記憶の消費はここでしか防げない
  const oversize = describeOversizeSource(src);
  if (oversize) throw new Error(oversize);

  if (isV05Source(src)) {
    const r = parseTextDslV05(src);
    if (!r.ok) {
      const msg = r.errors
        .map((e) => `  L${e.line}: ${e.message}${e.hint ? `\n         hint: ${e.hint}` : ""}`)
        .join("\n");
      throw new Error(`Dragon DSL v0.5 parse error:\n${msg}`);
    }
    return compileToCdl(r.doc, opts);
  }
  // v0.4 fallback (deprecated)
  if (typeof console !== "undefined" && console.warn) {
    console.warn(
      "[dragon] v0.4 syntax (Japanese keywords) is deprecated. Please migrate to v0.5 (English keywords) by 2026-12-31.",
    );
  }
  const r = parseTextDsl(src);
  if (!r.ok) {
    const msg = r.errors
      .map((e) => `  L${e.line}: ${e.message}${e.hint ? `\n         ヒント: ${e.hint}` : ""}`)
      .join("\n");
    throw new Error(`Dragon DSL parse error:\n${msg}`);
  }
  return compileToCdl(r.doc, opts);
}

function isV05Source(src: string): boolean {
  // 既定は v0.5 で、v0.4 の目印を 1 つでも見つけた時だけ v0.4 として読む (CAR-1657)。
  // v0.4 は 2026-12-31 に廃止予定なので、新しく書かれた本文は v0.5 として扱うのが当たりやすい。
  //
  // 目印に見出しの名前だけを使うと足りない = v0.4 も英語の別名 (`animate:` / `animation:`) を受けるため。
  // v0.4 にしかない書き方 (`step "..." Xs` = コロンの無い段、`^\d+\.\s+` = 番号付きの流れ) も目印に足す。
  const V04_KEYWORDS = [
    // Japanese v0.4 専用 keyword (v0.5 は英語のみ)。
    //
    // **字下げした行には当てない** (#1300)。 v0.4 の見出しは行頭に書くが、v0.5 の縦書き形は
    // 必ず字下げする。 同じ語が「v0.4 の見出し」 と「v0.5 の箱の欄 / 見本の状態名」 の両方で
    // 使われるため、`\s*` を許すと **正しい v0.5 の本文が旧 parser へ回る**。
    //
    // 実測 = `種類:` を箱の欄として縦に書いた本文と、見本の状態名が下の 7 語のいずれかである
    // 本文が、いずれも v0.4 として読まれて別の行を指す誤りを返していた。
    /^タイトル\s*[:：]/, // title (JA)
    /^種類\s*[:：]/, // type (JA)
    /^登場人物\s*[:：]/, // actors (JA)
    /^流れ\s*[:：]/, // flow (JA)
    /^アニメーション\s*[:：]/, // animation (JA)
    /^動作\s*[:：]/, // step (JA)
    /^状態\s*[:：]/, // state (JA)
    // 鉤括弧が続く形は v0.5 に無い (状態名は `ステップ: 5` の形しか取れない) ため、
    // 字下げを許しても v0.5 と衝突しない。 v0.4 では `アニメーション:` の下に字下げして書く
    /^\s*ステップ\s*[「『]/, // step (JA)
    // v0.4 English-specific syntax = colon なし step (v0.5 は step: 必須)
    /^\s*step\s+"[^"]+"\s+[\d.]+\s*s\b/,
    /^\s*step\s+'[^']+'\s+[\d.]+\s*s\b/,
    // v0.4 numbered flow (`1. A → B`、 v0.5 は `- A -> B`)
    /^\s*\d+\.\s+\S+\s*(?:→|->)\s*\S+/,
  ];
  const lines = src.split("\n");
  for (const ln of lines) {
    for (const kw of V04_KEYWORDS) {
      if (kw.test(ln)) return false; // v0.4 detected → false
    }
  }
  return true; // no v0.4 marker → v0.5 default
}
