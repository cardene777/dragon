/**
 * 原本の JSON から図を描く本体。置き場所と時刻の表を作り、部品を重なりの順に並べて SVG にする。
 * 後から読む種類の並べ方と札の時刻の直しと描き方と段で動く物は、種類の名前で登録簿から引いた部品の組 (`kinds/parts.ts`) から呼ぶので、読んでいない種類は描けない (`kinds/registry.ts`、#3248)。
 * 本体は種類の名前を並べた分かれ道を持たず、種類を足しても本体の字は増えない (#3656)。
 * 時系列図と構成図の並べ方は、種類の登録の file (`kind-use/<種類>.ts`) が登録した物を登録簿から引く (#3345、#3763)。
 * 置き場へ移したブロックの部品は、ブロックの置き場の描き方 (`blocks/<名前>/draw.ts`) から引く。動きの名前は呼んだ順に番号が付くので、呼ぶ順は変えない。
 *
 * 動きは全て SVG の中の CSS の keyframes が回す。1 周の長さは `--T`、止める時刻は `--at`、
 * 止めるか流すかは `--play` の変数で外から変えられる (頁に置く `player.ts` がこれを使う)。
 * 色と字は値の表から CSS の変数として 1 度だけ書き、部品はその変数だけを読む。
 * 止め絵を選ぶと (`still`)、最後の段の止め絵に全ての段の線の名前と箱の中の処理を出し、流れ全体を 1 枚で読ませる (#3200)。
 * 頁に止めて置く図 (`figure`) は keyframes を組まず、最後の段の止め絵の時刻の値を部品の style に書き込む (#3812)。
 */
import { drawUserBlocks, isUserPath, type UserBlock, type UserBlocks, userBlock, userBlockReader, userBlockUseMessages, withUserBlocks } from "../user-blocks";
import { action } from "../blocks/act/draw";
import { boxTextY, card, headCard } from "../blocks/box/draw";
import { carrier } from "../blocks/carry/draw";
import { type CarrierTime, seatsOf } from "../blocks/carry/timing";
import { cs } from "../blocks/color/draw";
import { edge } from "../blocks/edge/draw";
import { fadeBefore, label } from "../blocks/edge-label/draw";
import { TABLER_MESSAGES, tablerError } from "../blocks/icon/sets";
import { band } from "../blocks/group/draw";
import { lifeline } from "../blocks/lifeline/draw";
import { linkTo } from "../blocks/link/draw";
import { subChanges } from "../blocks/note/draw";
import { NOTE_CSS, noteMark, placeNotes, takeNotes } from "../blocks/pop/draw";
import { ghostCard, path, side } from "../blocks/side-path/draw";
import { endMark } from "../blocks/start-finish/draw";
import { fieldChanges, strip } from "../blocks/strip/draw";
import { FIGURE_TEXT } from "../figure-text";
import type { PipeWordsInput, StoredPipeLayout } from "../kinds/pipe/layout";
import { textWidth } from "../layout/measure";
import {
  type Layout,
  type Point,
  type Rect,
  rewrapStrip,
  type SceneField,
  type SceneStrip,
  unionRect,
} from "../layout/scene";
import { eagerLayout, partsOf } from "../kinds/registry";
import { FONTS } from "../look/fonts";
import {
  type ColorKey,
  type Colors,
  type Corner,
  EASE,
  FONT_VARS,
  isColorName,
  isColorValue,
  KIND_PALETTE,
  LOOK,
  type Palette,
  paletteVars,
  PLAIN_TEXT,
  resolvePalette,
  type Theme,
  TYPE,
} from "../look/values";
import { readDiagram } from "../version";
import { toModel } from "../model";
import type { Diagram, DiagramModel, SceneShow, ViewMode } from "../schema";
import { buildTimeline, type Span, type Timeline } from "../timeline";
import { DEFAULT_LANG, type NotationLang } from "../words";
import { badge, cssFont as font, cssMix as mix, type Ctx, doneMark, esc, sansOf } from "./parts";
import { frameShape, partRadius, sharpJoins } from "./corner";
import { type SequenceLook, sequenceLookFor } from "./look-store";
import { drawLines, type LineStyle } from "./pen-store";
import type { BreakFinder, LayoutBreak, PipePiece } from "./breaks";
import { findOverlaps, type Framed, type Ink, type Overlap, type Stroke, type Trace } from "./ink";
import { Motion } from "./motion";
import { r1 } from "./round";

export interface RenderOptions {
  /** Native input diagrams align their SVG ports to the controls' measured rectangles. */
  anchors?: Readonly<Record<string, Rect>>;
  overlay?: boolean;

  /** 色味の名前。書かないか知らない名前なら紙と墨 */
  palette?: string;
  /**
   * `palette` の色味に重ねる色の値 (#3198)。鍵は色味が持つ色の変数の名前 (`bg`、`ink`、`c-green` など) で、値は描く `theme` の色になる。
   * 渡さない色は色味の値のまま残る。色味に無い名前と、色の値として読めない値は、名前を挙げて描かずに断る
   */
  colors?: Colors;
  theme?: Theme;
  /** 描く部品が出す字 (断りの文、全体図の札、読み上げの名前) の言葉。書かなければ英語 (#3001、#3338) */
  lang?: NotationLang;
  /**
   * 描く枠の幅。列の図は、箱を横に並べると箱の名前が読めない幅で縦に組む (#3351)。書かなければ横に並べる。
   * 配管の図は幅に関わらず横に長いまま並べ、再生の部品が枠の中を横に送る (#3398)。
   * 量の図 (#3560) は、凡例を輪の右に置けない幅で輪の下に置き、横棒を枠に入る長さまで縮める
   */
  width?: number;
  /** 配管の図 (#3389) で開いて描く `[fold]` の呼び出しの番号 (出てきた順、0 から)。書かない呼び出しは内側の段を 1 つの箱に畳む */
  open?: readonly number[];
  /**
   * 最後の段の止め絵に、全ての段の線の名前と箱の中の処理を最後の段と同じ濃さで出す (#3200)。途中の段の止め絵は今の段の名前だけを出す。
   * 箱の下の 1 行に出す処理は、その箱で最後に起きた処理か書き換えの字を出す。違う段の名前が重なっても置き直さず、最後の段の重なり (`overlaps`) に出す
   */
  still?: boolean;
  /**
   * 頁に止めて置く図 (#3801)。最後の段の止め絵の時刻を図の中に書き込み、再生の部品が無くても最後の段の形を描く。
   * 段の番号の丸を出さず、量の図は段の名前の所に図の題を出す。字の並びは一般の sans-serif と monospace に落ちる。
   * 色味を渡さない時は、頁の白い地に馴染む `clear` で描く (配管の図は今どおり `sea`)。
   * 色は頁の `data-theme="dark"` の時と、`data-theme="light"` でない頁で暗い `prefers-color-scheme` の時に暗い色に変わる。
   * 頁が `--dragon-figure-background` を渡すと、図の地をその色で塗る。手順の帯 (`cycle` の `[shape: band]`) は番号の丸の空きを取らず、手順の名前を山形の中に書く (#3809)
   */
  figure?: boolean;
  /**
   * 書き出す絵の形で描く (#3891)。HTML で描く種類 (判定の表) は、頁の表の代わりに SVG の要素だけで描いた絵を返す。
   * 判定の表は例を帯に置き、幅 728px に収まらない表は規則の列を分けて縦に積む。SVG で描く種類はこの指定で変わらない
   */
  picture?: boolean;
  /** 原本の頭に書かずに渡す、使う人が足すブロックの定義 (#3399)。`readBlocks` が読んだ物。原本の `define` と同じ名前の定義は原本の物を使う */
  blocks?: UserBlocks;
  /**
   * 図の中に描く語を、描く言葉 (`lang`) の語の代わりに渡す (#3584)。画面を持つ側が自分の語で描くために使う。
   * `pipe` は配管の図の槽の下の語と、入力と出力の札と、内側の段をまとめた枠の文。一部だけ渡せ、渡さない語は `lang` の語で描く
   */
  words?: DiagramWords;
  /**
   * 線の描き方 (#3643)。`ruler` (既定) は定規の線、`pen` は箱の縁と線と矢印と輪をゆるく揺れる手描きのペンの線で描く。
   * 絵柄の線と字と図の地の枠は変えず、図の形と字の位置も変えない。揺れは線の形から決めるので、同じ図は何度描いても同じ形になる
   */
  line?: LineStyle;
  /**
   * 配管の図の、build の時に組んで収めた並べ方 (#3748)。書き出した頁と見本帳が渡す。
   * 図と言葉と語と code の指紋から作った鍵が合う並べ方が在れば、道を探さずにその並べ方で描く。合わなければその場で組む
   */
  layouts?: readonly StoredPipeLayout[];
}

/** 図の種類ごとの、呼ぶ側が渡す語 (#3584) */
export interface DiagramWords {
  pipe?: PipeWordsInput;
}

/**
 * package の中だけで使う描き方の指定。公開する `RenderOptions` に、崩れを数える関数を足す (#3494)
 */
export interface DrawOptions extends RenderOptions {
  /**
   * 描いた図の崩れ (`breaks`) を数える関数 (#3484、#3494)。`dragon check --layout` が渡す。書かなければ数えない。
   * 描く処理は崩れを探す処理を読まず、渡された関数に描いた物を渡すだけにする。描くだけの頁が崩れの検査を持たないため
   */
  findBreaks?: BreakFinder;
}

export interface Rendered {
  svg: string;
  palette: string;
  theme: Theme;
  /** 書き手が原本で決めた見せ方 */
  view?: ViewMode;
  fonts: { sans: string; mono: string };
  layout: Layout;
  timeline: Timeline;
  /** 描いた図の形。版1と同じ欄と並びで、図の id はこの形の字から作る (#3346) */
  diagram: DiagramModel;
  /**
   * 配管の図の `[fold]` の呼び出しの内側を 1 段にまとめる前の形 (#3398)。まとめた段を持つ図だけが持つ。
   * 書き出した頁はこの形を収め、読み手が箱を押した時に内側の段を開いて描き直す
   */
  source?: DiagramModel;
  /** 段ごとの止め絵で、同時に見えている字どうしの重なりと、線が札を持たない字を横切る所 (#3175)。重なりが無ければ空 */
  overlaps: Overlap[];
  /** 描いた図の崩れ (#3484)。`findBreaks` を渡して描いた時だけ持つ */
  breaks?: LayoutBreak[];
  /**
   * 場面を書いた図 (#3878) の、場面ごとに描いた図。書いた順に並べ、場面を書かない図は持たない。
   * 場面を書いた図の `svg` と `layout` は、場面ごとの図を場面の名前と止まる理由と一緒に上から縦に並べた図
   */
  scenes?: RenderedScene[];
  /** 場面の見せ方 (#3878)。場面を書いた図だけが持つ */
  sceneShow?: SceneShow;
}

/** 場面ごとに描いた図 (#3878)。場面の名前と止まる理由と場面の色と、全ての場面に共通の段の数を持つ */
export interface RenderedScene extends Rendered {
  name: string;
  stop?: string;
  color: ColorKey;
  common: number;
}

const S = LOOK.stroke;
const X = LOOK.mix;
/** 状態遷移図で段が終わった線と番号の灰 (#3171) */
const PAST = `color-mix(in srgb,var(--mute) ${X.past}%,var(--bg))`;

/** 部品の見た目。どの値も値の表から読む。 */
const PART_CSS = [
  // 字の大きさは字の幅の表で測るので、置いた頁の字の間と大文字を受け継がない (#3787)
  `.dg{display:block;width:100%;height:auto;overflow:visible;${PLAIN_TEXT}}`,
  ".dg .dg-a{animation-duration:var(--T);animation-timing-function:linear;animation-iteration-count:infinite;animation-fill-mode:both;animation-delay:calc(var(--at,0) * -1s);animation-play-state:var(--play,running)}",
  ".dg .dg-popc{transform-box:fill-box;transform-origin:center}",
  ".dg-bg{fill:var(--bg)}",
  ".dg-band{fill:color-mix(in srgb,var(--c) var(--tint),var(--bg));stroke:color-mix(in srgb,var(--c) var(--edge),transparent)}",
  `.dg-bi{fill:${mix(X.regionIcon)};stroke:${mix(X.regionIconEdge, "transparent")}}`,
  `.dg-bz{${font(TYPE.regionName)};fill:var(--ct)}`,
  `.dg-bx{${font(TYPE.regionNote)};fill:var(--mute)}`,
  ".dg-st{fill:var(--surf);stroke:var(--hair)}",
  `.dg-halo{fill:none;stroke:var(--c);stroke-width:${S.halo};stroke-opacity:.16}`,
  `.dg-on{fill:none;stroke:var(--c);stroke-width:${S.on}}`,
  `.dg-ic{fill:${mix(X.icon)}}`,
  `.dg-slot{fill:none;stroke:${mix(X.slot, "transparent")};stroke-width:${S.slot};stroke-dasharray:3 3}`,
  `.dg-gl{fill:none;stroke:var(--c);stroke-width:${S.glyph};stroke-linecap:round;stroke-linejoin:round}`,
  `.dg-sn{${font(TYPE.boxName)};fill:var(--ink)}`,
  `.dg-ss{${font(TYPE.boxSub)};fill:var(--mute)}`,
  `.dg-ss-ok{${font(TYPE.boxSubStrong)};fill:var(--ct)}`,
  `.dg-ss-act{${font(TYPE.boxSubStrong)};fill:var(--ink)}`,
  `.dg-ll{stroke:var(--line);stroke-width:${S.lifeline};stroke-dasharray:3 4}`,
  `.dg-e{fill:none;stroke:var(--line);stroke-width:${S.edge};stroke-linecap:round;stroke-dasharray:0 ${LOOK.edge.ghostDash}}`,
  `.dg-eh{fill:none;stroke:var(--line);stroke-width:${S.arrow};stroke-linecap:round;stroke-linejoin:round}`,
  `.dg-e-on{fill:none;stroke:var(--c);stroke-width:${S.edgeOn};stroke-linecap:round;stroke-dasharray:1 2}`,
  `.dg-eh-on{fill:none;stroke:var(--c);stroke-width:${S.edgeOn};stroke-linecap:round;stroke-linejoin:round}`,
  `.dg-flow{fill:none;stroke:var(--surf);stroke-width:${S.flow};stroke-linecap:round;stroke-dasharray:1.5 ${LOOK.edge.flowDash}}`,
  `.dg-e-past{fill:none;stroke:${PAST};stroke-width:${S.edge};stroke-linecap:round}`,
  `.dg-eh-past{fill:none;stroke:${PAST};stroke-width:${S.arrow};stroke-linecap:round;stroke-linejoin:round}`,
  ".dg-bd{cursor:pointer}",
  ".dg-bdf{fill:var(--c)}",
  `.dg-bdft{${font(TYPE.badge)};fill:var(--on-c)}`,
  `.dg-bdr{fill:none;stroke:var(--c);stroke-width:${S.badgeRing};pointer-events:none}`,
  `.dg-bdp{fill:${mix(X.badgePast)};stroke:${mix(X.badgePastEdge, "transparent")};stroke-width:${S.hair}}`,
  `.dg-bdpt{${font(TYPE.badge)};fill:var(--ct)}`,
  `.dg-bdp-g{fill:var(--surf);stroke:${PAST};stroke-width:${S.hair}}`,
  `.dg-bdpt-g{${font(TYPE.badge)};fill:var(--mute)}`,
  `.dg-cap rect,.dg-act rect{fill:${mix(X.cap)};stroke:${mix(X.capEdge, "transparent")}}`,
  `.dg-cap text{${font(TYPE.label)};fill:var(--ct)}`,
  `.dg-capj text{${font(TYPE.labelJa)}}`,
  `.dg-cap-past text{${font(TYPE.label)};fill:var(--mute);fill-opacity:${LOOK.state.pastLabel}}`,
  `.dg-cap-pastj text{${font(TYPE.labelJa)}}`,
  `.dg-act text{${font(TYPE.action)};fill:var(--ct)}`,
  ".dg-car{fill:var(--carry,var(--ink))}",
  `.dg-car-t{${font(TYPE.carrier)};fill:var(--bg)}`,
  `.dg-car-tj{${font(TYPE.carrierJa)}}`,
  `.dg-env{fill:var(--carry,var(--ink));stroke:var(--surf);stroke-width:${S.envelope}}`,
  `.dg-env-in{fill:none;stroke:var(--surf);stroke-width:${S.flow};stroke-linejoin:round;stroke-linecap:round}`,
  ".dg-coin{fill:var(--coin);stroke:var(--surf);stroke-width:1.2}",
  ".dg-coin-in{fill:none;stroke:var(--coinin);stroke-width:1.1}",
  ".dg-strip{fill:var(--surf);stroke:var(--hair)}",
  `.dg-sep{stroke:var(--hair);stroke-width:${S.hair}}`,
  `.dg-sh{${font(TYPE.stripTitle)};fill:var(--ink)}`,
  `.dg-fl{${font(TYPE.fieldName)};fill:var(--mute)}`,
  `.dg-fv{${font(TYPE.fieldValue)};fill:var(--ink)}`,
  `.dg-fvj{${font(TYPE.fieldValueJa)};fill:var(--ink)}`,
  ".dg-fv-c{fill:var(--ct)}",
  ".dg-fl-now{fill:var(--c)}",
  `.dg-tr-ring{fill:none;stroke:var(--line);stroke-width:${S.trail}}`,
  ".dg-tr-fill{fill:var(--c)}",
  ".dg-tg rect{fill:var(--c)}",
  `.dg-tg text{${font(TYPE.tag)};fill:var(--on-c)}`,
  `.dg-side{fill:color-mix(in srgb,var(--c) ${X.side}%,var(--bg));stroke:${mix(X.sideEdge, "transparent")};stroke-dasharray:4 4}`,
  `.dg-side-t{${font(TYPE.regionName)};fill:var(--ct)}`,
  `.dg-side-n{${font(TYPE.regionNote)};fill:var(--mute)}`,
  `.dg-ghost{fill:var(--surf);stroke:${mix(X.ghostEdge, "transparent")};stroke-dasharray:4 3}`,
  `.dg-path{fill:none;stroke:${mix(X.path, "transparent")};stroke-width:${S.path};stroke-linecap:round;stroke-dasharray:0 ${LOOK.edge.ghostDash}}`,
  `.dg-path-h{fill:none;stroke:${mix(X.path, "transparent")};stroke-width:${S.arrow};stroke-linecap:round;stroke-linejoin:round}`,
  `.dg-path-t{${font(TYPE.label)};fill:var(--ct)}`,
  `.dg-path-tj{${font(TYPE.labelJa)}}`,
  ".dg-start{fill:var(--ink)}",
  `.dg-end{fill:var(--bg);stroke:var(--ink);stroke-width:${S.end}}`,
  ".dg-end-in{fill:var(--ink)}",
  `.dg-end-x{fill:var(--bg);stroke:${mix(X.path, "transparent")};stroke-width:${S.arrow};stroke-dasharray:2 2.5}`,
  `.dg-end-xi{fill:${mix(X.path, "transparent")}}`,
  `.dg-mark{${font(TYPE.regionNote)};fill:var(--mute)}`,
  `.dg-done{fill:var(--ink);stroke:var(--surf);stroke-width:${S.done}}`,
  `.dg-done-ck{fill:none;stroke:var(--surf);stroke-width:${S.glyph};stroke-linecap:round;stroke-linejoin:round}`,
  `.dg-git-l{fill:none;stroke:var(--c);stroke-width:${S.git};stroke-linecap:round;stroke-linejoin:round;stroke-dasharray:1 2}`,
  `.dg-git-cp{fill:none;stroke:var(--c);stroke-width:${S.gitOrphan};stroke-linecap:round;stroke-dasharray:3 3;stroke-opacity:.7}`,
  `.dg-git-c{fill:var(--surf);stroke:var(--c);stroke-width:${S.git}}`,
  `.dg-git-id{${font(TYPE.gitId)};fill:var(--ct)}`,
  `.dg-git-h{${font(TYPE.gitHash)};fill:var(--mute)}`,
  `.dg-git-n{${font(TYPE.gitNote)};fill:var(--ink2)}`,
  `.dg-git-old{fill:var(--surf);stroke:var(--c);stroke-width:${S.gitOrphan};stroke-dasharray:3 3;stroke-opacity:.6}`,
  `.dg-git-oldl{${font(TYPE.gitId)};fill:var(--ct);opacity:.55}`,
  // 木の図 (#3233)。木の線は線の灰で、運ぶ物が通った跡は運ぶ物の色で引く
  `.dg-tree-l{fill:none;stroke:var(--line);stroke-width:${S.tree};stroke-linecap:round;stroke-linejoin:round;stroke-dasharray:1 2}`,
  `.dg-tree-tr{fill:none;stroke:var(--c);stroke-width:${S.treeTrail};stroke-linecap:round;stroke-linejoin:round;stroke-dasharray:1 2}`,
  `.dg-tree-h{fill:none;stroke:var(--c);stroke-width:${S.treeTrail};stroke-linecap:round;stroke-linejoin:round}`,
  `.dg-tree-con{fill:none;stroke:var(--line);stroke-width:${S.treeCon};stroke-linecap:round;stroke-dasharray:2 3.5}`,
  `.dg-tree-card{fill:var(--surf);stroke:var(--hair);stroke-width:${S.hair}}`,
  `.dg-tree-cg{fill:none;stroke:var(--mute);stroke-width:${S.glyph};stroke-linecap:round;stroke-linejoin:round}`,
  `.dg-tree-ct{${font(TYPE.treeCard)};fill:var(--ink)}`,
  `.dg-tree-hash{${font(TYPE.treeHash)};fill:var(--ink)}`,
  `.dg-tree-name{${font(TYPE.treeName)};fill:var(--mute)}`,
  `.dg-tree-one{${font(TYPE.boxName)};fill:var(--ink)}`,
  `.dg-tree-rh{${font(TYPE.rootHash)};fill:var(--ink)}`,
  `.dg-tree-rn{${font(TYPE.rootName)};fill:var(--mute)}`,
  // 時間軸の図 (#3165)。和文を含む字は、末尾に j を付けた class で同じ大きさと太さの和文の字にする
  `.dg-tm-ep{fill:color-mix(in srgb,var(--ink) ${X.timeShade}%,transparent)}`,
  `.dg-tm-sep{stroke:var(--hair);stroke-width:${S.hair};stroke-dasharray:2 4}`,
  `.dg-tm-hd{${font(TYPE.timeHead)};fill:var(--ink)}`,
  `.dg-tm-hdj{${font(sansOf(TYPE.timeHead))}}`,
  `.dg-tm-slot{fill:none;stroke:var(--line);stroke-width:${S.timeSlot};opacity:.55}`,
  ".dg-tm-m{fill:var(--c)}",
  ".dg-tm-x{fill:var(--c-slate)}",
  `.dg-tm-fr{fill:none;stroke:var(--c-blue);stroke-width:${S.timeFrame};stroke-dasharray:3 2}`,
  `.dg-tm-gd{fill:none;stroke:color-mix(in srgb,var(--c-blue) ${X.timeGuide}%,transparent);stroke-width:${S.hair};stroke-dasharray:2 3}`,
  `.dg-tm-ax{fill:none;stroke:var(--line);stroke-width:${S.timeAxis}}`,
  `.dg-tm-tk{${font(TYPE.timeTick)};fill:var(--mute)}`,
  `.dg-tm-tkj{${font(sansOf(TYPE.timeTick))}}`,
  `.dg-tm-en{${font(TYPE.timePeriod)};fill:var(--ink2)}`,
  `.dg-tm-er{${font(TYPE.timeRange)};fill:var(--mute)}`,
  `.dg-tm-erj{${font(sansOf(TYPE.timeRange))}}`,
  `.dg-tm-rn{${font(TYPE.timeRow)};fill:var(--ink2)}`,
  `.dg-tm-br{fill:none;stroke:var(--c);stroke-width:${S.timeSpan};stroke-linecap:round;stroke-linejoin:round}`,
  `.dg-tm-bt{${font(TYPE.spanText)};fill:var(--ct)}`,
  `.dg-tm-bx{fill:color-mix(in srgb,var(--c) ${X.timeSpan}%,transparent);stroke:var(--c);stroke-width:${S.timeSpan};stroke-dasharray:4 3}`,
  `.dg-tm-con{fill:none;stroke:var(--line);stroke-width:${S.timeDrop};stroke-linecap:round;stroke-dasharray:0 3.5}`,
  ".dg-tm-pg{fill:var(--surf);stroke:var(--line);stroke-dasharray:2 2.5}",
  `.dg-tm-pgl{fill:none;stroke:var(--mute);stroke-width:${S.timeFlag};stroke-linecap:round;stroke-linejoin:round}`,
  `.dg-tm-pc{fill:var(--surf);stroke:var(--c);stroke-width:${S.timePoint}}`,
  `.dg-tm-pcg{fill:none;stroke:var(--c);stroke-width:${S.timeFlag};stroke-linecap:round;stroke-linejoin:round}`,
  `.dg-tm-pn{${font(TYPE.pointName)};fill:var(--ink)}`,
  `.dg-tm-pnj{${font(sansOf(TYPE.pointName))}}`,
  ".dg-tm-pn-g{fill:var(--mute)}",
  `.dg-tm-ps{${font(TYPE.pointState)};fill:var(--ct)}`,
  `.dg-tm-ln{fill:none;stroke:var(--c);stroke-width:${S.edgeOn};stroke-linecap:round;stroke-dasharray:1 2}`,
  `.dg-tm-nd{stroke:var(--ink);stroke-width:${S.timeNeedle};opacity:.55}`,
  ".dg-tm-nh{fill:var(--ink)}",
  ".dg-tm-ph{fill:none;stroke:var(--line);stroke-dasharray:3 3}",
  `.dg-tm-ex{fill:color-mix(in srgb,var(--c-slate) ${X.timeEmpty}%,var(--surf));stroke:var(--c-slate);stroke-width:${S.timeFrame};stroke-dasharray:3 3}`,
  `.dg-tm-ext{${font(TYPE.emptyText)};fill:var(--t-slate)}`,
  ".dg-tm-mt{fill:var(--hair)}",
  ".dg-tm-mf{fill:var(--c);transform-box:fill-box;transform-origin:0 50%}",
  `.dg-tm-mk{stroke:var(--ink2);stroke-width:${S.timeMeter}}`,
  `.dg-tm-ml{${font(TYPE.meterLine)};fill:var(--ink2)}`,
  ".dg-vp-bg{fill:var(--bg)}",
  ".dg-vp-frame{fill:none;stroke:var(--hair)}",
  ".dg-hd-bg{fill:var(--bg)}",
  ".dg-mm-bg{fill:var(--surf);stroke:var(--hair)}",
  `.dg-mm-t{${font(TYPE.miniTitle)};fill:var(--mute)}`,
  ".dg-mm-world{fill:var(--sunk);stroke:var(--hair)}",
  `.dg-mm-band{fill:${mix(X.miniBand)};stroke:${mix(X.miniBandEdge, "transparent")};stroke-width:.6}`,
  `.dg-mm-card{fill:${mix(X.mini)}}`,
  `.dg-mm-vp{fill:color-mix(in srgb,var(--ink) ${X.view}%,transparent);stroke:var(--ink);stroke-width:${S.badgeRing};vector-effect:non-scaling-stroke}`,
].join("");

/**
 * 全体図の円と塗った形と線の見た目 (#3849)。全体図にそれを描く寄って追う図にだけ書き、ほかの図の SVG を変えない。
 * 円の地は半透明に塗り、重なった所を元の図と同じく混ざった色に見せる
 */
const MINI_SHAPE_CSS = [
  `.dg-mm-dot{fill:${mix(X.mini)}}`,
  `.dg-mm-disc{fill:var(--c);fill-opacity:${LOOK.mini.disc};stroke:var(--c);stroke-opacity:${LOOK.mini.discEdge};stroke-width:.6}`,
  `.dg-mm-area{fill:var(--c);fill-opacity:${LOOK.mini.area}}`,
  `.dg-mm-line{fill:none;stroke:${mix(X.mini)};stroke-width:${LOOK.mini.line};stroke-linecap:round;stroke-linejoin:round}`,
].join("");

/** 同じ原本と同じ見た目からは同じ名前になるよう、中身から短い名前を作る (keyframes の名前が頁の中で混ざらないため)。 */
function nameOf(text: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(36);
}

/** 各箱が動く段。線の両端、処理、字の書き換えの箱。 */
function involved(diagram: DiagramModel): Map<string, number[]> {
  const on = new Map<string, Set<number>>();
  const add = (id: string, s: number): void => {
    on.set(id, (on.get(id) ?? new Set()).add(s));
  };
  diagram.steps.forEach((step, s) => {
    for (const event of step.events) {
      if (event.type === "edge") {
        add(event.from, s);
        add(event.to, s);
      } else if (event.type === "action" || event.type === "swap") add(event.box, s);
    }
  });
  return new Map([...on].map(([id, steps]) => [id, [...steps].sort((a, b) => a - b)]));
}

export interface FollowFrame {
  /** 枠の幅 (px)。寄って追う窓はこの幅で、字を原寸で見せる */
  width: number;
  /** 枠の中で見える高さ (px)。渡すと、窓と全体図をこの高さに収め (#3047)、窓をこの高さまで伸ばす (#3053)。枠の高さが図で伸びる置き場では渡さない */
  height?: number;
  /**
   * 枠の中で見える高さ (px)。`height` を渡さない時に渡すと、窓の下の全体図だけをこの高さに収まるまで縮める (#3554)。
   * 窓の高さは幅で決めたまま変えず、全体図の下の表は収めずに枠の中で送って見せる。枠の高さが決まっている置き場 (編集画面) で渡す
   */
  visible?: number;
  /** 隅の全体図の札の言葉。渡し忘れを型の検査で止めるため、省けない欄にする */
  lang: NotationLang;
}

/**
 * 等幅の字では … の3つの点が1文字の幅に詰まって _ に見え、... は3文字分の幅を取って点が大きく離れるので、
 * 等幅の字で描く字の … は、点だけを普通の字の ... で描く (Tracelyth #234, #236)。字の幅は textWidth が普通の字の ... の幅で測る。
 * 字体は図の CSS の class から読み、同じ重みの規則は後の規則が勝ち、字体の規則を持たない要素は親の字体を継ぐ
 */
function monoDots(body: string, css: string): string {
  if (!body.includes("…")) return body;
  const rules: { classes: string[]; family: string }[] = [];
  for (const [, selectors, decl] of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    const family = /var\(--(mono|sans)\)/.exec(decl as string)?.[1];
    if (!family) continue;
    for (const s of (selectors as string).split(",")) {
      const last = s.trim().split(/[\s>+~]+/).pop() ?? "";
      if (/^(?:\.[\w-]+)+$/.test(last)) rules.push({ classes: last.slice(1).split("."), family });
    }
  }
  const familyOf = (attrs: string, parent: string | undefined): string | undefined => {
    const own = /\bstyle="[^"]*var\(--(mono|sans)\)/.exec(attrs)?.[1];
    if (own) return own;
    const classes = new Set((/\bclass="([^"]*)"/.exec(attrs)?.[1] ?? "").split(/\s+/));
    let found = parent;
    for (const r of rules) if (r.classes.every((c) => classes.has(c))) found = r.family;
    return found;
  };
  const stack: { tag: string; family: string | undefined }[] = [];
  return body.replace(/<(\/?)([a-zA-Z][\w-]*)([^>]*)>|[^<]+/g, (part: string, close?: string, tag?: string, attrs?: string) => {
    const top = stack.at(-1);
    if (tag === undefined) return top?.family === "mono" && (top.tag === "text" || top.tag === "tspan") ? part.replaceAll("…", MONO_DOTS) : part;
    if (close) stack.pop();
    else if (!(attrs as string).endsWith("/")) stack.push({ tag, family: familyOf(attrs as string, top?.family) });
    return part;
  });
}
const MONO_DOTS = '<tspan style="font-family:var(--sans)">...</tspan>';

/**
 * 図を描く。`follow` を渡すと、寄って追う窓と隅の全体図で描く。`ink` を渡すと、描いた字の四角と見えている間をそこへ記録する (#3175)。
 * `framed`には、時間軸の囲みの枠の内に収める部品を記録する (#3527)。
 * `pieces` を渡すと、配管の図の描いた部品をそこへ記録する (#3523)。`strokes`には、時間軸の図の針と範囲の囲みの線を記録する (#3631)
 */
export function drawSvg(
  diagram: DiagramModel,
  layout: Layout,
  timeline: Timeline,
  palette: Palette,
  theme: Theme,
  follow?: FollowFrame,
  ink: Ink[] = [],
  traces: Trace[] = [],
  framed: Framed[] = [],
  pieces?: PipePiece[],
  strokes: Stroke[] = [],
  figure?: StillFigure,
): string {
  // 札の言葉で全体図の地の幅が変わりうるので、同じ頁に置いた別の言葉の図と名前を分ける。
  // 色は色味の名前でなく色の値から名前を作り、色の値を重ねた図 (#3198) と同じ色味の名前の図の変数の規則を分ける
  const vars = paletteVars(palette, theme);
  const id = nameOf(
    `${JSON.stringify(diagram)}|${vars}|${follow ? `${follow.width}|${follow.lang}` : ""}`,
  );
  // 止めて置く図 (#3801) は keyframes を組まず、最後の段の止め絵の時刻の値を書き込む (#3812)
  const m = new Motion(`dg${id}`, timeline.total, timeline.last, figure?.at);
  // 後から読む種類の部品の組。最初から読む種類 (時系列図と構成図) は持たない (#3656)
  const parts = partsOf(layout.kind);
  // 種類の行に `[shape: pipe]` を書いた時系列図は、後から読んだ見た目の部品の組が列の頭と線と札と段の番号と処理の札を描く (#3720)
  const look = sequenceLookFor(diagram, follow?.lang ?? DEFAULT_LANG);
  // 運ぶ物の見えている間は、種類の部品が描く間だけ直せる (木の図の運ぶ物は着いた所で消える)
  const carried: CarrierTime[] = parts?.carried?.(timeline) ?? timeline.carriers;
  const ctx: Ctx = {
    m,
    t: timeline,
    id,
    sh: `filter="url(#dg-sh-${id})"`,
    end: (timeline.steps[timeline.steps.length - 1] as Span).end,
    ink,
    traces,
    framed,
    strokes,
    ...(pieces ? { pieces } : {}),
    boxText: boxTextY(layout.boxes),
    corner: palette.corner,
    ...(theme === "dark" ? { dark: true } : {}),
    ...(figure ? { figure: true } : {}),
    seats: seatsOf(layout.edges, carried),
    ...parts?.hooks?.(m, timeline),
  };
  // 時系列図の処理は生存線の上の札に出し、他の図の種類は箱の下の字に出す
  const subs = subChanges(diagram, timeline, layout.kind !== "sequence");

  const L = {
    band: [] as string[],
    base: [] as string[],
    lit: [] as string[],
    node: [] as string[],
    badge: [] as string[],
    top: [] as string[],
  };
  for (const region of layout.regions) L.band.push(band(region, ink, ctx.corner));
  // 並べる見せ方の場面の図 (#3878) は、分かれる位置の縦の点線を箱と線より下の層に引く
  const fork = layout.scene?.fork;
  if (fork) L.band.push(`<line class="dg-scene-fork" data-dragon="scene-fork" x1="${r1(fork.x)}" y1="${r1(fork.y1)}" x2="${r1(fork.x)}" y2="${r1(fork.y2)}" stroke-dasharray="${LOOK.scene.dash}"/>`);
  const ghostColor = layout.boxes.find((b) => b.ghost)?.color ?? "slate";
  if (layout.side) L.band.push(side(layout.side, ghostColor, ink, ctx.corner));
  // 脇道へ入る道は脇道の状態の色、それ以外の道は送る側の色で描く
  const boxColor = (id: string, ghost?: boolean): ColorKey | undefined =>
    layout.boxes.find((b) => b.id === id && (ghost === undefined || b.ghost === ghost))?.color;
  for (const p of layout.paths)
    L.base.push(path(p, boxColor(p.to, true) ?? boxColor(p.from) ?? ghostColor, ink, traces, ctx.corner));
  for (const e of layout.ends) L.node.push(endMark(e, ghostColor, ink));
  // 状態遷移図は、段で変わった値を今の状態の色で描き、帯の通った状態の点を着いた時刻に塗る (#3171)。
  // 手順の図も同じく、済んだ線と番号を灰にし、印が着いた箱を光らせる (#3561)
  const isState = parts?.states === true;
  const arrivals = new Map(
    (timeline.states ?? []).flatMap((s) =>
      s.lit[0] ? [[s.box, s.lit[0].start] as [string, number]] : [],
    ),
  );
  // 物差しの欄 (時間軸の図だけが書ける) は、種類の部品が満ち具合の動きで棒を伸ばす (#3165)
  const meters = new Map((timeline.meters ?? []).map((meter) => [meter.field, meter.keys]));
  const gauge = (field: SceneField): string | undefined =>
    field.meter ? parts?.meter?.({ ...field, meter: field.meter }, meters.get(field.name) ?? [[0, 0]], ctx) : undefined;
  // 値の移り変わりは本体が 1 度だけ出し、中身の帯と種類の描き方に渡す。種類の部品に中身の帯を描く処理を読ませない (#3657)
  const fields = fieldChanges(diagram, timeline, layout);
  const drawStrip = (s: SceneStrip): string => strip(s, fields, ctx, isState, arrivals, gauge);
  // 寄って追う図の表は窓の下に置くので、窓の中身には描かない (#3270)
  if (layout.strip && !follow) L.band.push(drawStrip(layout.strip));
  for (const line of look ? [] : layout.lifelines) L.base.push(lifeline(line.x, line.y1, line.y2));
  if (look) look.draw(layout, timeline, ctx, L);
  // 後から読む種類の物は、種類の部品の組が描いて図の層ごとに返す。見た目の規則もその種類の図の SVG にだけ書く (#3656)
  const drawn = parts?.draw?.(layout, diagram, ctx, subs, follow !== undefined, fields);
  for (const layer of ["base", "lit", "node", "top"] as const) {
    const text = drawn?.[layer];
    if (text) L[layer].push(text);
  }
  const on = drawn?.on ?? involved(diagram);
  for (const e of look ? [] : layout.edges) {
    const time = timeline.edges.find((t) => t.step === e.step && t.event === e.event);
    // 種類の部品は、共通の線を描かない線と、線を出し始める時刻を決められる
    const since = drawn?.edge ? drawn.edge(e) : 0;
    if (!time || since === undefined) continue;
    // 並べる見せ方の場面の図 (#3878) は、段が済んだ線も灰に替えず、共通の段の灰色と場面の色のまま残す
    const line = edge(e, time, ctx, isState && layout.scene === undefined, since);
    L.base.push(line.base);
    L.lit.push(line.lit);
  }
  if (drawn?.after) L.top.push(drawn.after());
  const states = new Map((timeline.states ?? []).map((s) => [s.box, s]));
  // 飛び先を持つ箱は、箱の札をその飛び先への link で包む (#3199)。時間軸の図の箱は時間軸の図を描く部品が包む
  const links = new Map(
    diagram.boxes.flatMap((b) =>
      b.link === undefined ? [] : [[b.id, b.link] as [string, string]],
    ),
  );
  const linked = (id: string, markup: string): string => linkTo(links.get(id), markup);
  // 札で見せる図 (#3877) の札を持つ箱は、箱の札ごと押せる組で包み、右上に i の印を描く
  const notes = new Map((layout.noteCards ?? []).map((note) => [note.box, note]));
  const noted = (id: string, markup: string, y?: number): string => {
    const note = notes.get(id);
    return note ? noteMark(note, markup, y) : markup;
  };
  for (const box of parts?.ownBoxes || look ? [] : layout.boxes) {
    if (box.ghost) {
      L.node.push(linked(box.id, ghostCard(box, ink, ctx.corner)));
      continue;
    }
    const state = states.get(box.id);
    L.node.push(
      linked(
        box.id,
        noted(
          box.id,
          card(
            box,
            ctx,
            on.get(box.id) ?? [],
            subs.get(box.id) ?? [],
            isState ? (state?.lit ?? []) : undefined,
          ),
        ),
      ),
    );
    if (state?.done !== undefined) L.node.push(doneMark(box, state.done, ctx));
  }
  for (const b of look ? [] : layout.badges)
    if (!(follow && onStrip(layout, b))) L.badge.push(badge(b, ctx, isState));
  for (const l of look ? [] : layout.labels) {
    const time = timeline.labels.find((t) => t.step === l.step && t.event === l.event);
    if (time) L.top.push(label(l, fadeBefore(l, time, timeline.steps), ctx));
  }
  // 止め絵を選んだ図は、全ての段の名前を出す間にも処理の札を出す。その間に見えている札は繰り返す前まで延ばす (#3200)
  const { whole } = timeline;
  for (const a of look ? [] : layout.actions) {
    const time = timeline.events.find((t) => t.step === a.step && t.event === a.event);
    if (!time) continue;
    const until = (timeline.steps[a.step] as Span).end;
    L.top.push(
      whole && until > whole.start
        ? action(a, time.at, whole.end, ctx)
        : action(a, time.at, until, ctx, whole),
    );
  }
  for (const time of carried) {
    const e = layout.edges.find((x) => x.step === time.step && x.event === time.event);
    if (e) L.top.push(carrier(e, time, ctx));
  }
  const layers = Object.values(L).map((parts) => parts.join(""));
  const content = layers.join("");
  // 寄って追う窓の線の端の箱の札 (#3836) は番号の丸の下に描くので、番号の丸より下の層の字の長さを渡す
  const under = layers.slice(0, Object.keys(L).indexOf("badge")).join("").length;

  const { near, far, nearY, farY } = LOOK.shadow;
  const shadow = `<filter id="dg-sh-${id}" x="-20%" y="-30%" width="140%" height="180%"><feDropShadow dx="0" dy="${nearY}" stdDeviation="${near}" style="flood-color:var(--sh);flood-opacity:var(--shA)"/><feDropShadow dx="0" dy="${farY}" stdDeviation="${far}" style="flood-color:var(--sh);flood-opacity:var(--shB)"/></filter>`;
  // 寄って追う時系列図は、頭の箱を窓の上端に貼る頭の列にも描く (#3118)。頭の列の箱はアイコンを外した 2 段 (#3120)。止めて見せる図では描かない。
  // 見た目を選んだ時系列図は、見た目の部品の組が列の頭と器と札を留める帯を描く (#3720)
  const heads = !follow
    ? ""
    : look
      ? look.band(layout, timeline, m, LOOK.follow.head.pad, ctx.corner)
      : layout.kind === "sequence"
      ? layout.boxes
          .map((box) =>
            // 頭の列の箱の印は、頭の箱の上端から同じ間の所に置く (#3877)
            linked(box.id, noted(box.id, headCard(box, ctx, on.get(box.id) ?? [], subs.get(box.id) ?? []), LOOK.follow.head.pad + LOOK.note.inset)),
          )
          .join("")
      : "";
  // 表の値だけが変わる段の番号の丸は表の隅に在るので、表と一緒に窓の下へ移す (#3270)。
  // 窓の下の表は図の左端から始まるので、丸の半径だけ内へ寄せる。寄せないと丸の左が図の端で切れる
  const drawTable = (s: SceneStrip, from: SceneStrip): string =>
    drawStrip(s) +
    layout.badges
      .filter((b) => onStrip(layout, b))
      .map((b) =>
        badge({ ...b, x: b.x - from.x + s.x + LOOK.badge.r, y: b.y - from.y + s.y }, ctx, isState),
      )
      .join("");
  const bg = frameShape(
    ctx.corner,
    ' class="dg-bg"',
    { x: 0, y: 0, w: layout.width, h: layout.height },
    `<rect class="dg-bg" width="${layout.width}" height="${layout.height}" rx="${LOOK.region.radius}"/>`,
  );
  const view = follow
    ? followView(layout, timeline, diagram, m, id, content, under, follow, heads, drawTable, ctx.corner, look)
    : { body: `${bg}${content}`, w: layout.width, h: layout.height, css: "" };
  const still = figure ? figureCss(id, figure, look ? look.vars(figure.dark, "dark") : "", palette[theme].bg ?? "") : "";
  // 印の見た目の規則は札で見せる図にだけ書き、ほかの図の SVG を変えない (#3877)。分かれる位置の点線の規則も、点線を引く場面の図にだけ書く (#3878)
  const forkCss = fork ? `.dg-scene-fork{fill:none;stroke:var(--mute);stroke-width:${S.edge}}` : "";
  const css = `.dg-${id}{${FONT_VARS};--T:${timeline.total}s;${vars}${look ? `;${look.vars(palette, theme)}` : ""}}${still}${PART_CSS}${notes.size > 0 ? NOTE_CSS : ""}${forkCss}${view.css}${look?.css ?? ""}${drawn?.css ?? ""}${sharpJoins(ctx.corner, id)}${m.frames.join("")}`;
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" class="dg dg-${id}" viewBox="0 0 ${Math.ceil(view.w)} ${Math.ceil(view.h)}" width="${Math.ceil(view.w)}" height="${Math.ceil(view.h)}" role="img" aria-label="${esc(diagram.title)}" data-dragon="figure" data-view="${follow ? "follow" : "fixed"}"${drawn?.attrs ?? ""}>` +
    `<style>${css}</style><defs>${shadow}</defs>${monoDots(view.body, css)}</svg>`
  );
}

/** 頁に止めて置く図 (#3801) の止め絵の時刻と、暗い頁で使う色味 */
export interface StillFigure {
  /** 最後の段の止め絵の時刻 (秒) */
  at: number;
  /** 頁が暗い時に描く色味 */
  dark: Palette;
}

/**
 * 止めて置く図の見た目の規則 (#3801)。図の根に止め絵の時刻を書き込み、動きを止めたまま最後の段の形を描く。
 * 字の並びは全ての図と同じ字の変数 (`FONT_VARS`) が持ち、同梱した字を読まない頁でも明朝に落ちない (#3847)。
 * 頁の `data-theme="dark"` と、`data-theme="light"` でない頁の暗い `prefers-color-scheme` で、暗い色味の色に替える。
 * 地の色 (`--bg`) は頁が `--dragon-figure-background` を渡した時にその色を読み、図の地も `--bg` で塗る縁取りや札の地も頁の枠の色に揃える (#3809)。
 * 渡さない頁では色味の地の色のまま描く
 */
function figureCss(id: string, figure: StillFigure, lookDark: string, lightBg: string): string {
  const pageBg = (bg: string): string => `--bg:var(--dragon-figure-background,${bg})`;
  const dark = `${paletteVars(figure.dark, "dark")}${lookDark ? `;${lookDark}` : ""};${pageBg(figure.dark.dark.bg ?? "")}`;
  return (
    `.dg-${id}{--at:${figure.at};--play:paused;${pageBg(lightBg)}}` +
    `:root[data-theme="dark"] .dg-${id}{${dark}}` +
    `@media (prefers-color-scheme: dark){:root:not([data-theme="light"]) .dg-${id}{${dark}}}`
  );
}

/** 番号の丸が値の表の上に在るか。表の値だけが変わる段の丸は表の隅に置かれる */
function onStrip(layout: Layout, badge: { y: number }): boolean {
  return layout.strip !== undefined && badge.y >= layout.strip.y;
}

/** 段で動く物が占める所。 */
function focusOf(layout: Layout, diagram: DiagramModel, step: number): Rect | undefined {
  const rects = focusParts(layout, diagram, step);
  return rects.length === 0 ? undefined : unionRect(rects);
}

/**
 * 番号の丸が窓から外れる段で、窓に入れる所 (#3046)。
 * 丸とその周りを起点に、丸に近い動く物から順に、窓 (`vw` × `vh`) に収まる間だけ囲む。収まらない物は飛ばして次を見る
 */
function badgeFocus(badge: { x: number; y: number }, parts: Rect[], vw: number, vh: number): Rect {
  const room = LOOK.badge.r + LOOK.follow.badgeRoom;
  const { x: bx, y: by } = badge;
  const away = (p: Rect): number =>
    Math.hypot(Math.max(0, p.x - bx, bx - p.x - p.w), Math.max(0, p.y - by, by - p.y - p.h));
  let held: Rect = { x: bx - room, y: by - room, w: room * 2, h: room * 2 };
  for (const p of [...parts].sort((a, b) => away(a) - away(b))) {
    const next = unionRect([held, p]);
    if (next.w <= vw && next.h <= vh) held = next;
  }
  return held;
}

/** 段で動く物を 1 つずつ。 */
function focusParts(layout: Layout, diagram: DiagramModel, step: number): Rect[] {
  const rects: Rect[] = [];
  for (const e of layout.edges.filter((x) => x.step === step)) {
    const xs = e.points.map((p) => p[0]);
    const ys = e.points.map((p) => p[1]);
    rects.push({
      x: Math.min(...xs),
      y: Math.min(...ys),
      w: Math.max(...xs) - Math.min(...xs),
      h: Math.max(...ys) - Math.min(...ys),
    });
  }
  rects.push(
    ...layout.labels.filter((l) => l.step === step),
    ...layout.actions.filter((a) => a.step === step),
  );
  // 後から読む種類は、種類の部品の組がその段で動く物を挙げる (#3656)
  rects.push(...(partsOf(layout.kind)?.focus?.(layout, diagram, step) ?? []));
  for (const event of diagram.steps[step]?.events ?? []) {
    const ids =
      event.type === "edge"
        ? [event.from, event.to]
        : event.type === "action" || event.type === "swap"
          ? [event.box]
          : [];
    for (const id of ids) {
      const box = layout.boxes.find((b) => b.id === id);
      // 時系列図の頭の箱は遠いので、線の行だけを見る
      if (box && (layout.kind === "architecture" || event.type === "swap")) rects.push(box);
    }
  }
  return rects;
}

/**
 * 寄って追う窓。段ごとに動く所へ寄り、窓の外の全体図に今見ている所の枠を同じ動きで出す。
 * 全体図は窓に重ねると今動く線や箱を覆うので、窓の外に置く (#3042)。
 * 縦長の全体図は窓の右に列を取り、横長の全体図は窓の下に置く。失う窓の幅か図の高さの小さい側を選ぶ。
 * 枠の中で見える高さを渡された時は、窓と全体図がその高さに入るまで窓を低くする (#3047)。
 * 枠が余る時は窓を広げ、図の原寸の幅と、見える高さか図の高さまで使う。全体図は今の大きさのまま置く (#3053)。
 * 枠の幅が `LOOK.follow.narrow` より狭い時は、縦長の全体図を出さずに窓へ枠の幅の全部を渡す (#3055)。値の表を持つ図は、狭い枠では横長の全体図も出さない (#3274)。
 * 段で動く物を全部囲んだ所の真ん中に寄せると今の段の番号の丸が窓から外れる段では、丸に近い動く物から窓に収まるだけ囲んだ所へ寄せる (#3046)。
 * 時系列図は頭の箱 `heads` を窓の上端の頭の列に貼り、窓が横に動く時だけ一緒に動かす。頭の箱は図の上端に在り、線を追う窓からは外れるため。
 * 窓は頭の列の下の残りの高さで動く物を真ん中に見せる (#3118)。
 * 頭の列の箱はアイコンを外した 2 段にして低く貼り、線は図の頭の箱の下から見せ始める (#3120)。
 * 見た目を選んだ時系列図は頭の列に列の頭と頭の下の器と札を留め、線は器と札の下から見せ始め、全体図を出さず窓を縦に長く取る (Tracelyth #91、#93)。
 * 見た目を選ばない時系列図は、窓が図の高さを全部見せる時は頭の列を貼らず、図の頭の箱をアイコンごと窓に見せて横にだけ追う。
 * 頭の列を貼る時は、図の頭の箱の下から図の下端までを頭の列の下に見せ、窓がそれより高い時は窓を詰める。どちらも箱の行を 2 重に映さないため (#3834)。
 * 値の表は図の一番下に在り、窓が近づくまで映らず、窓より広い表は右側が切れる。全体図と同じ理由で窓の外に出し、
 * 窓と全体図の下に図の枠の幅で組み直す (#3270)。窓と全体図は表を除いた図の高さ `worldH` の中だけを見る。
 * 線の端の箱を挙げる種類 (考えを広げる地図、量の行き先の図、状態遷移図) は、段で引いた線の端の箱を窓に入れる所へ寄せ直し、
 * 窓の端で切れる箱に名前の札を窓の枠の内に出す (#3836)。寄せ直しと札は種類の部品の組の `ends` が持ち、後から読む塊に置く。
 * 札は番号の丸と処理の札の下に描き、窓と一緒に動く中身の層 (番号の丸より下の層の字の長さ `under` の所) に入れる。
 */
function followView(
  layout: Layout,
  timeline: Timeline,
  diagram: DiagramModel,
  m: Motion,
  id: string,
  content: string,
  under: number,
  follow: FollowFrame,
  heads: string,
  drawTable: (s: SceneStrip, from: SceneStrip) => string,
  corner: Corner,
  look: SequenceLook | undefined,
): { body: string; w: number; h: number; css: string } {
  const F = LOOK.follow;
  const M = LOOK.mini;
  const frameWidth = Math.max(1, follow.width);
  const full = Math.min(layout.width, frameWidth);
  const worldH = layout.strip ? layout.strip.y : layout.height;
  const title = FIGURE_TEXT[follow.lang].overview;
  /** 窓の高さ `vh` の時の全体図の寸法。全体図は窓の高さで縮むので、窓を低くしたら測り直す。`least` を渡すと全体図の幅をそれ以下にする */
  const sized = (vh: number, least = Number.POSITIVE_INFINITY) => {
    // 全体図の寸法は枠の幅と窓の高さで決め、置き場所に依らない
    // 全体図の幅は表を含む図の比で決める。表を除いた比にすると全体図の列が太り、窓が狭くなる
    const mw = Math.min(M.w, full * 0.4, ((vh * 0.4) / layout.height) * layout.width, least);
    const k = mw / layout.width;
    const mh = worldH * k;
    // 地の幅は図の縦横の比で決まるので、縦に長い図では札より狭くなる。その時は地を札の幅まで広げ、図は広げた地の真ん中に置く
    const bw = Math.max(mw, Math.ceil(textWidth(title, TYPE.miniTitle)));
    // 縦横の比は窓の高さに依らないので、低くしても全体図の置き場所は変わらない
    return {
      vh,
      mw,
      k,
      mh,
      bw,
      bgW: bw + M.pad * 2,
      bgH: mh + M.pad * 2 + M.title,
      beside: mh > mw,
    };
  };
  // 見た目を選んだ時系列図の窓は電話の縦の画面を使い、留めた列の頭と器の下に今のステップの行を収める (#86 の問い3と問い4の案A、Tracelyth #93)
  const natural = sized(Math.min(worldH, Math.max(F.minH, full * (look ? look.followAspect : F.aspect))));
  // 携帯の幅では縦長の全体図の列が枠の幅の 3 割を取り、窓が図の横の 3 割ほどしか見せない。その時は全体図を出さない。
  // 横長の全体図は窓の下に出して幅を取らないので、狭い枠でも出す。
  // ただし値の表を持つ図は、窓の下に全体図と表が重なって段を送る釦を最初の画面の外へ押し出すので、狭い枠では全体図を出さない (#3274)
  // 見た目を選んだ時系列図は、選んだ絵 (#86 の問い3と問い4) と同じく全体図の小窓を出さない (Tracelyth #91)
  const bare = look !== undefined || (frameWidth < F.narrow && (natural.beside || layout.strip !== undefined));
  const tableH = layout.strip ? rewrapStrip(layout.strip, 0, 0, full).h + M.inset : 0;
  // 窓の右の全体図は窓の高さの中に収まり、窓の下の全体図と表は窓の高さに足される
  const room =
    follow.height === undefined
      ? Number.POSITIVE_INFINITY
      : (natural.beside || bare ? follow.height : follow.height - natural.bgH - M.inset) - tableH;
  // 見える高さが窓より低ければ窓と全体図を縮め、高ければ全体図はそのままに窓を図の高さまで伸ばす。
  // 全体図も伸ばすと、狭い枠では右の全体図の列が太って窓が狭くなる
  const fitted =
    room < natural.vh
      ? sized(Math.max(F.fitMinH, room))
      : { ...natural, vh: Number.isFinite(room) ? Math.min(worldH, room) : natural.vh };
  // 高さを渡さない枠で窓の下に出す全体図は、見える高さ `visible` から窓を引いた残りに収まるまで縮める (#3554)。
  // 窓の高さは枠の幅で決まるので、図が伸びると全体図だけが枠の下へ出て切れる。全体図は半分の大きさまで縮め、それでも収まらない時は枠の中で送る
  const spare =
    follow.height === undefined && follow.visible !== undefined && !fitted.beside && !bare
      ? follow.visible - fitted.vh - M.inset - M.pad * 2 - M.title
      : Number.POSITIVE_INFINITY;
  const { vh: fullVh, mw, k, mh, bw, bgW, bgH, beside } =
    fitted.mh > spare ? sized(fitted.vh, (Math.max(spare, fitted.mh / 2) / worldH) * layout.width) : fitted;
  // 右の全体図の列は枠の余りに置き、窓は図の原寸の幅まで広げる。枠が図より狭い時は今までどおり枠の幅から列を引く
  const vw = beside && !bare ? Math.min(layout.width, frameWidth - bgW - M.inset) : full;
  const clampX = (x: number): number => Math.min(layout.width - vw / 2, Math.max(vw / 2, x));
  // 時系列図は窓の上端に頭の列を貼るので、動く物は頭の列の下の残りの高さ `below` に見せる (#3118)。
  // 線は図の頭の箱の下 `top` から見せ始め、図の頭の箱は頭の列の下か窓の上に隠す (#3120)
  // 後から読む種類は、見せ始める高さを種類の部品の組が決める (列の図は描かない見出しの文の下、#3365)
  const parts = partsOf(layout.kind);
  // 見た目を選んだ時系列図の留める帯は、列の頭の下の器と札まで入れる (Tracelyth #93)
  const headLow = look ? look.shelf(layout) : Math.max(...layout.boxes.map((b) => b.y + b.h));
  // 見た目を選ばない時系列図は、窓が図の高さを全部見せる時に頭の列を貼らない。窓が縦に動かず図の頭の箱が常に窓に入るので、
  // 貼ると頭の列の下に図の頭の箱が映り、箱の行が 2 重になる (#3834)
  const pinned = look !== undefined || worldH > fullVh ? heads : "";
  const top = pinned !== "" ? headLow + F.headRoom : (parts?.top?.(layout) ?? 0);
  const strip = pinned === "" ? 0 : look ? look.bandHeight(layout, F.head.pad) : F.head.pad * 2 + F.head.h;
  // 頭の列を貼る時、図の頭の箱の下から図の下端までが頭の列の下の残りより低ければ、窓をその高さまで詰める。
  // 詰めないと窓が図の下端で止まって上に寄り、頭の列の下に図の頭の箱の下の端が映る (#3834)
  const vh = pinned !== "" && !look && worldH - headLow < fullVh - strip ? strip + worldH - headLow : fullVh;
  const below = vh - strip;
  /**
   * 頭の列の下の残りの窓の真ん中の高さを、図の頭の箱の下と図の下端で止める。
   * 見た目を選んだ時系列図は、図が窓の高さに収まる時も元の列の頭を留めた帯の下に隠すため、上の限りを下の限りより優先し、窓の下に余りが出るのを許す (Tracelyth #86)
   */
  const clampY = (y: number): number =>
    look ? Math.max(top + below / 2, Math.min(worldH - below / 2, y)) : Math.min(worldH - below / 2, Math.max(top + below / 2, y));
  const r = LOOK.badge.r;
  let prev: [number, number] = [layout.width / 2, worldH / 2];
  /** 段 `s` の頭の列の下の残りの窓の真ん中 */
  const aimAt = (s: number): [number, number] => {
    // 寄せる所を種類の部品の組が決める種類 (時間軸の図の針と印の列 #3165、試す図の出来事が着く所 #3337) は、番号の丸へ寄せ直さない
    if (parts?.aim) {
      prev = parts.aim(layout, timeline, s, focusParts(layout, diagram, s), vw, below) ?? prev;
      return [clampX(prev[0]), clampY(prev[1])] as [number, number];
    }
    const f = focusOf(layout, diagram, s);
    // 見た目を選んだ時系列図は、見た目の部品の組が窓の真ん中を決め、番号の丸へ寄せ直さない (Tracelyth #91)
    if (look) {
      prev = look.follow(layout, s, f, prev, vw, below);
      return [clampX(prev[0]), clampY(prev[1])] as [number, number];
    }
    prev = f ? [f.x + f.w / 2, f.y + f.h / 2] : prev;
    const at: [number, number] = [clampX(prev[0]), clampY(prev[1])];
    // 動く物を全部囲んだ所が窓より大きいと、その端に在る番号の丸が窓から外れる。その段だけ丸の近くへ寄せ直す (#3046)。
    // 窓が見せ始める所 `top` より上の丸 (列の図の見出しの横の丸) へは窓が届かないので寄せ直さない (#3365)
    const b = layout.badges.find((x) => x.step === s);
    if (
      !b ||
      onStrip(layout, b) ||
      b.y < top ||
      (Math.abs(b.x - at[0]) <= vw / 2 - r && Math.abs(b.y - at[1]) <= below / 2 - r)
    )
      return at;
    const near = badgeFocus(b, focusParts(layout, diagram, s), vw, below);
    // 動く物の無い次の段は、寄せ直した窓のまま止める
    prev = [near.x + near.w / 2, near.y + near.h / 2];
    return [clampX(prev[0]), clampY(prev[1])] as [number, number];
  };
  // 線の端の箱を挙げる種類は、段で引いた線の端の箱を窓に入れる所へ寄せ直し、窓の端で切れる箱に名前の札を出す (#3836)
  const ends = parts?.ends?.(layout, diagram, {
    vw,
    vh: below,
    strip,
    top,
    sh: `filter="url(#dg-sh-${id})"`,
    clamp: ([x, y]) => [clampX(x), clampY(y)],
    moving: (s) => focusParts(layout, diagram, s),
  });
  // 頭の列の下の残りの窓の真ん中。窓の真ん中は、これより頭の列の高さの半分だけ上に在る
  const middles = timeline.steps.map((_, s): [number, number] => {
    if (!ends) return aimAt(s);
    // 寄せ直した所を次の段が留まる所にする
    prev = ends.aim(aimAt(s), s);
    return prev;
  });
  const centers = middles.map(([x, y]): [number, number] => [x, y - strip / 2]);
  const c0 = centers[0] as [number, number];
  const cam: [number, number, number, number?, string?][] = [
    [0, c0[0], c0[1]],
    [(timeline.steps[0] as Span).start, c0[0], c0[1]],
  ];
  centers.forEach((c, s) => {
    if (s === 0) return;
    const before = centers[s - 1] as [number, number];
    const start = (timeline.steps[s] as Span).start;
    cam.push([start, before[0], before[1], 1, EASE.inOut], [start + F.ease, c[0], c[1]]);
  });
  const cl = centers[centers.length - 1] as [number, number];
  cam.push([timeline.last, cl[0], cl[1], 1, EASE.inOut], [timeline.total, c0[0], c0[1]]);
  const camKf = m.move(cam.map(([t, cx, cy, s, e]) => [t, vw / 2 - cx, vh / 2 - cy, s, e]));

  // 右に出す時は窓の上端に揃え、下に出す時は窓の右端から内へ寄せる
  const bgX = beside ? vw + M.inset : vw - bgW - M.inset;
  const bgY = beside ? 0 : vh + M.inset;
  const bx = bgX + M.pad;
  const mx = bx + (bw - mw) / 2;
  const my = bgY + M.pad + M.title;
  /**
   * 全体図の地と札と、今見ている所の枠。窓と同じ動きで枠を動かす。
   * 時系列図の枠は頭の列の下の線を見せる所だけを囲む。頭の箱は頭の列に常に出ているため (#3122)
   */
  const overview = (): { clip: string; body: string; css: string } => {
    // 図の上の点の並びを、全体図の上の点の並び (`x,y` を空白で区切る) にする
    const miniPoints = (points: readonly Point[]): string => points.map(([x, y]) => `${r1(mx + x * k)},${r1(my + y * k)}`).join(" ");
    const own = parts?.overview?.(layout) ?? [];
    const shapes = [
      ...layout.regions.map(
        (r) =>
          `<rect class="dg-mm-band" style="${cs(r.color)}" x="${mx + r.x * k}" y="${my + r.y * k}" width="${r.w * k}" height="${r.h * k}" rx="${partRadius(corner, M.band)}"/>`,
      ),
      ...layout.boxes.map(
        (b) =>
          `<rect class="dg-mm-card" style="${cs(b.color)}" x="${mx + b.x * k}" y="${my + b.y * k}" width="${b.w * k}" height="${b.h * k}" rx="${partRadius(corner, M.card)}"/>`,
      ),
      // 後から読む種類は、全体図に描く部品を種類の部品の組が挙げる (試す図は待ち行列の枠を地に、網の節と出ているブロックを札に描く、#3337)。
      // 円と塗った形と線は、量の帯の曲線と集まりの円と結びの線を縮めても元の図と同じ形に見せるために描く (#3849)
      ...own.map((s) => {
        const style = `style="${cs(s.color)}"`;
        if ("disc" in s) return `<circle class="${s.band ? "dg-mm-disc" : "dg-mm-dot"}" ${style} cx="${r1(mx + s.disc.cx * k)}" cy="${r1(my + s.disc.cy * k)}" r="${r1(s.disc.r * k)}"/>`;
        if ("area" in s) return `<path class="dg-mm-area" ${style} d="M${miniPoints(s.area)}Z"/>`;
        if ("line" in s) return `<polyline class="dg-mm-line" ${style} points="${miniPoints(s.line)}"/>`;
        const t = s.rect;
        return `<rect class="${s.band ? "dg-mm-band" : "dg-mm-card"}" ${style} x="${mx + t.x * k}" y="${my + t.y * k}" width="${t.w * k}" height="${t.h * k}" rx="${partRadius(corner, s.band ? M.band : M.card)}"/>`;
      }),
    ].join("");
    const vp = m.move(
      cam.map(([t, cx, cy, , e]) => [t, mx + (cx - vw / 2) * k, my + (cy - vh / 2) * k, 1, e]),
    );
    return {
      css: own.some((shape) => !("rect" in shape)) ? MINI_SHAPE_CSS : "",
      clip: `<clipPath id="dg-mm-${id}">${frameShape(corner, "", { x: mx, y: my, w: mw, h: mh }, `<rect x="${mx}" y="${my}" width="${mw}" height="${mh}" rx="4"/>`)}</clipPath>`,
      body:
        frameShape(
          corner,
          ' class="dg-mm-bg"',
          { x: bgX, y: bgY, w: bgW, h: bgH },
          `<rect class="dg-mm-bg" x="${bgX}" y="${bgY}" width="${bgW}" height="${bgH}" rx="${M.radius}"/>`,
        ) +
        `<text class="dg-mm-t" x="${bx}" y="${my - M.pad + 2}">${title}</text>` +
        `<g clip-path="url(#dg-mm-${id})"><rect class="dg-mm-world" x="${mx}" y="${my}" width="${mw}" height="${mh}"/>${shapes}<rect class="dg-mm-vp dg-a"${strip === 0 ? "" : ` y="${strip * k}"`} width="${vw * k}" height="${(vh - strip) * k}" rx="${partRadius(corner, 2)}" style="${vp}"/></g>`,
    };
  };
  const mini = bare ? { clip: "", body: "", css: "" } : overview();
  // 頭の列は窓の中身の上に重ね、窓と同じ時刻と緩急で横にだけ動かす (#3118)
  const head =
    strip === 0
      ? ""
      : `<g class="dg-hd"><rect class="dg-hd-bg" width="${vw}" height="${strip}"/><line class="dg-sep" x1="0" y1="${strip}" x2="${vw}" y2="${strip}"/>` +
        `<g class="dg-a" style="${m.move(cam.map(([t, cx, , s, e]) => [t, vw / 2 - cx, 0, s, e]))}">${pinned}</g></g>`;
  const tags = ends ? ends.tags(middles, m, timeline) : "";
  const body =
    `<defs><clipPath id="dg-vp-${id}">${frameShape(corner, "", { x: 0, y: 0, w: vw, h: vh }, `<rect width="${vw}" height="${vh}" rx="${LOOK.region.radius}"/>`)}</clipPath>${mini.clip}</defs>` +
    `<g clip-path="url(#dg-vp-${id})"><rect class="dg-vp-bg" width="${vw}" height="${vh}"/><g class="dg-a" style="${camKf}">${content.slice(0, under)}${tags}${content.slice(under)}</g>${head}</g>` +
    `${frameShape(corner, ' class="dg-vp-frame"', { x: 0.5, y: 0.5, w: vw - 1, h: vh - 1 }, `<rect class="dg-vp-frame" x="0.5" y="0.5" width="${vw - 1}" height="${vh - 1}" rx="${LOOK.region.radius}"/>`)}${mini.body}`;
  const w = beside && !bare ? vw + M.inset + bgW : full;
  // 全体図を出さない時は、窓のすぐ下に表を置く
  const bottom = beside || bare ? vh : bgY + bgH;
  if (!layout.strip) return { body, w, h: bottom, css: mini.css };
  const table = rewrapStrip(layout.strip, 0, bottom + M.inset, full);
  return { body: body + drawTable(table, layout.strip), w, h: table.y + table.h, css: mini.css };
}

/**
 * 描く色味。名前で選んだ色味の `theme` の色に `colors` の色を重ねる (#3198)。
 * 色味に無い色の名前と、色の値として読めない値は、名前を全て挙げて描かずに断る
 */
export function paletteOf(options: RenderOptions, theme: Theme): Palette {
  const palette = resolvePalette(options.palette);
  if (!options.colors) return palette;
  const words = FIGURE_TEXT[options.lang ?? DEFAULT_LANG];
  const errors = Object.entries(options.colors).flatMap(([name, value]) =>
    !isColorName(name)
      ? [words.unknownColor(name)]
      : isColorValue(value)
        ? []
        : [words.unreadableColor(name)],
  );
  if (errors.length > 0) throw new Error(words.cannotDraw(errors.join(" / ")));
  return { ...palette, [theme]: { ...palette[theme], ...options.colors } };
}

/**
 * 寄って追う形の SVG を描く (Tracelyth #91)。`renderDiagram` が返した図の原本と並びと時刻の表を渡す。`palette` はパレットの名前かパレット。
 * 再生の部品が狭い枠に置いた図をこの形で描くので、全体図の小窓と列の頭の留め方を画面を開かずに確かめるのに使う
 */
export function followSvg(diagram: DiagramModel, layout: Layout, timeline: Timeline, palette: string | Palette, theme: Theme, follow: FollowFrame): string {
  return drawSvg(diagram, layout, timeline, typeof palette === "string" ? resolvePalette(palette) : palette, theme, follow);
}

/** 原本の JSON から図を描く。原本が形に合わない時は、誤りの場所を添えて断る。 */
export function renderDiagram(input: unknown, options: RenderOptions = {}): Rendered {
  return drawDiagram(input, options);
}

/** `renderDiagram` の中身。package の中の崩れの検査は、崩れを数える関数を足してここを呼ぶ (#3494) */
export function drawDiagram(input: unknown, options: DrawOptions = {}): Rendered {
  const lang = options.lang ?? DEFAULT_LANG;
  return withDrawnBlocks(readOrFail(input, lang), options.blocks, lang, (diagram) => renderRead(diagram, options, lang));
}

/**
 * 描いた図を、足したブロックの定義を有効にしたまま描き直す (#3606)。
 * 足した箱の形と足した線の模様は描く間だけ引けるので (`userBoxOf`、`userEdgeOf`)、描き終えた後に窓の幅で描き直す書き出しは、ここを通して描く。
 * `blocks` には `renderDiagram` に渡したのと同じ定義を渡す
 */
export function redrawWithBlocks<T>(input: unknown, options: { blocks?: UserBlocks; lang?: NotationLang }, run: () => T): T {
  const lang = options.lang ?? DEFAULT_LANG;
  return withDrawnBlocks(readOrFail(input, lang), options.blocks, lang, run);
}

/** 原本を読む。読めない時は描けない訳の文で断る */
function readOrFail(input: unknown, lang: NotationLang): Diagram {
  const read = readDiagram(input, { lang });
  if (!read.ok)
    throw new Error(
      FIGURE_TEXT[lang].cannotDraw(read.errors.map((e) => `${e.pointer} ${e.message}`).join(" / ")),
    );
  return read.diagram;
}

/** 使う人が足したブロックの定義は、描く間だけ有効にする。原本の頭の定義が、引数で渡した同じ名前の定義に勝つ (#3399) */
function withDrawnBlocks<T>(diagram: Diagram, blocks: UserBlocks | undefined, lang: NotationLang, run: (drawn: Diagram) => T): T {
  return withUserBlocks([blocks, diagram.define], () => run(useUserBlocks(diagram, lang)));
}

/**
 * 原本が使う足したブロックを、描く処理が名札と出来事の番号で引けるようにし、描く原本を返す。
 * 定義に無い名前か、元のブロックの違う名前を使っていれば、その誤りの文で断る。
 * 定義に絵柄を持つ箱のブロックの箱は、箱の行に絵柄が無ければ定義の絵柄で描く (#3489)。並べ方も絵柄の枠を空けるので、描く原本の写しの箱に絵柄を入れる。
 * 軽い入口で絵柄集の表を読む前に絵柄集の絵柄を描こうとすると、空の枠を描かずに `loadFor` を待つよう断る
 */
function useUserBlocks(diagram: Diagram, lang: NotationLang): Diagram {
  const m = userBlockUseMessages(lang);
  const boxes = new Map<string, UserBlock>();
  const edges = new Map<string, UserBlock>();
  const fail = (message: string): never => {
    throw new Error(FIGURE_TEXT[lang].cannotDraw(message));
  };
  const find = (name: string, want: UserBlock["base"]): UserBlock => {
    const found = userBlock(name) ?? fail(m.undefinedBlock(name));
    if (found.base !== want) fail(m.wrongBase(name, found.base, want));
    // 引数 blocks で渡した定義は原本の形の検査を通らないので、SVG に入る path をここで確かめる (#3400)
    if (found.path !== undefined && !isUserPath(found.path)) fail(`${name}: ${m.badPath}`);
    // 色付きの絵柄 (#3633) の色と path も、描く前に描き方で確かめる。描き方は定義を読む処理と一緒に読み、読む前は足した箱の形と同じく絵柄を描かない
    const reader = userBlockReader();
    if (found.paints && reader && reader.paint(name, 0, 0, 1) === undefined) fail(`${name}: ${m.badPath}`);
    const error = found.icon && tablerError(found.icon, TABLER_MESSAGES[lang]);
    if (error) fail(error);
    return found;
  };
  const box = diagram.blocks.box?.map((b) => {
    const found = b.block === undefined ? undefined : find(b.block, "box");
    if (b.icon?.startsWith("+")) find(b.icon, "icon");
    if (!found) return b;
    boxes.set(b.id, found);
    // 箱の行に書いた絵柄は後ろに広げて、定義の絵柄に勝たせる
    return found.icon === undefined ? b : { icon: found.icon, ...b };
  });
  for (const region of diagram.blocks.group ?? []) if (region.icon?.startsWith("+")) find(region.icon, "icon");
  for (const [s, step] of diagram.steps.entries())
    for (const [e, event] of step.events.entries()) if (event.type === "edge" && event.block !== undefined) edges.set(`${s}:${e}`, find(event.block, "edge"));
  drawUserBlocks(boxes, edges);
  return box ? { ...diagram, blocks: { ...diagram.blocks, box } } : diagram;
}

/** 検査を通った原本を並べて描く */
function renderRead(source: Diagram, options: DrawOptions, lang: NotationLang): Rendered {
  const read = { diagram: source };
  // 並べ方と描き方は版1と同じ欄の形を読み、図の id もこの形の字から作る (#3346)。
  // 後から読む種類は、種類の名前で引いた部品の組が並べる前の直しと並べ方を持つ (#3656)。
  // 配管の図は `[fold]` の呼び出しの内側の段を、開くと頼まれていなければ 1 つの段にまとめてから並べる (#3389)
  // 止めて置く図 (#3801) は、種類の部品の組が持つ止めて置く時の直し (量の図は段の名前の所に図の題を出す) を、並べる前に当てる
  const given = toModel(read.diagram);
  const parts = partsOf(given.kind, lang);
  // 場面を書いた図 (#3878) は、場面を書ける種類の部品の組の場面の描き方が、場面ごとの図と縦に並べた図を描く
  if (given.scenes && parts?.scenes) return parts.scenes.render(given, options, lang);
  const model = options.figure === true ? (parts?.figure?.(given) ?? given) : given;
  // 札で見せる図 (#3877) は、箱の説明を名前の下の字から札へ移してから並べる。箱は説明の字の幅まで広がらない
  const { diagram, notes } = takeNotes(parts?.fold?.(model, options, lang) ?? model);
  // 後から読む図の種類 (#3347) は部品の組の並べ方で並べ、時系列図は登録簿に登録した並べ方で並べ (#3345、#3763)、
  // 構成図と知らない種類は構成図の並べ方で並べる。種類の行に `[shape: pipe]` を書いた時系列図は、見た目の部品の組の並べ方で並べる (#3720)
  const look = sequenceLookFor(diagram, lang);
  const laid = look
    ? look.layout(diagram, lang)
    : parts
      ? parts.layout(diagram, lang, options)
      : eagerLayout(diagram.kind === "sequence" ? "sequence" : "architecture", lang)(diagram, lang);
  // 札を持つ箱の印は、並べた箱の右上に置く (#3877)
  const placed = placeNotes(notes, laid.boxes);
  const layout = placed.length > 0 ? { ...laid, noteCards: placed } : laid;
  const rendered = drawLaid(diagram, layout, options, lang);
  return diagram === model || diagram.steps.length === model.steps.length ? rendered : { ...rendered, source: model };
}

/**
 * 並べた図を、図の種類の既定の色味と札の時刻の直しで描く。場面を書いた図 (#3878) の場面の描き方も、場面ごとの図をここで描く。
 * 色味を指定しない図は、図の種類の既定の色味で描く (#3398)。頁に止めて置く図 (#3801) は、頁の白い地に馴染む澄んだ色味 (`clear`) を既定にする
 */
export function drawLaid(diagram: DiagramModel, layout: Layout, options: DrawOptions, lang: NotationLang): Rendered {
  const parts = partsOf(diagram.kind, lang);
  const kindPalette = options.palette === undefined ? (KIND_PALETTE[diagram.kind] ?? (options.figure === true ? "clear" : undefined)) : undefined;
  const drawn = kindPalette === undefined ? options : { ...options, palette: kindPalette };
  const timeline = buildTimeline(diagram, options.still === true);
  // 札の時刻は部品の組が直す。手順の図は段の印の点と運ぶ物と光る間を直し (#3561)、
  // 回り続ける図と表どうしの関係の図の札は、走り出しを待たずに出て段の終わりに消える (#3623、#3618)
  const timed = parts?.times?.(diagram, timeline) ?? timeline;
  return renderLayout(diagram, layout, timed, drawn);
}

/**
 * 置き場所を決めた図を描き、描いた字の重なりを数える (#3175)。`renderDiagram` が原本を読んで置き場所を決めた後に呼ぶ。
 * 重なりは、字を描く部品が記録した字だけから数えるので、描く所が位置を決める字 (箱の名前) も対象に入る
 */
export function renderLayout(
  diagram: DiagramModel,
  layout: Layout,
  timeline: Timeline,
  options: DrawOptions = {},
): Rendered {
  const theme: Theme = options.theme === "dark" ? "dark" : "light";
  const palette = paletteOf(options, theme);
  const ink: Ink[] = [];
  const traces: Trace[] = [];
  const framed: Framed[] = [];
  const pieces: PipePiece[] = [];
  const strokes: Stroke[] = [];
  // 止めて置く図 (#3801) は、最後の段の止め絵の時刻と、頁が暗い時の色味を渡す
  const figure: StillFigure | undefined =
    options.figure === true ? { at: timeline.stills[timeline.steps.length - 1] ?? 0, dark: paletteOf(options, "dark") } : undefined;
  // HTML で描く種類 (判定の表、#3879) は SVG を描かず、種類の部品が HTML の字を返す。字を記録しないので、重なりと崩れも数えない
  const html = partsOf(layout.kind)?.html;
  // 手描きの線は描き終えた SVG の形を描き替える。崩れは描いた時に記録した字と線から数えるので、描き替えても変わらない
  const svg = html
    ? options.picture === true && html.picture
      ? html.picture(layout, palette, theme)
      : html.markup(layout, palette, theme)
    : drawLines(drawSvg(diagram, layout, timeline, palette, theme, undefined, ink, traces, framed, pieces, strokes, figure), options.line, options.lang ?? DEFAULT_LANG);
  // 箱の札を種類の部品の組が描く図の種類 (時間軸の図と列の図) は、崩れの確かめも共通の描き方が箱の札を描いた図の種類の箱だけを見る
  const carded = partsOf(layout.kind)?.ownBoxes ? [] : layout.boxes.filter((box) => !box.ghost);
  const breaks = options.findBreaks?.({
    inks: ink,
    traces,
    framed,
    stills: timeline.stills,
    frame: { w: layout.width, h: layout.height },
    boxes: carded,
    edges: layout.edges,
    layout,
    ...(pieces.length > 0 ? { pieces } : {}),
    ...(strokes.length > 0 ? { strokes } : {}),
  });
  return {
    svg,
    palette: palette.id,
    theme,
    ...(diagram.view ? { view: diagram.view } : {}),
    fonts: { ...FONTS },
    layout,
    timeline,
    diagram,
    overlaps: findOverlaps(ink, timeline.stills, traces),
    ...(breaks ? { breaks } : {}),
  };
}
