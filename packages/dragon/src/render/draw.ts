/**
 * 原本の JSON から図を描く本体。置き場所と時刻の表を作り、部品を重なりの順に並べて SVG にする。
 * chart、cycle、er、flow、git、lineup、pipe、state、time、tree、try、venn の部品は登録簿から引くので、読んでいない種類は描けない (`kinds/registry.ts`、#3248)。
 * 時系列図と構成図の並べ方は、図の種類の置き場 (`kinds/<種類>/`) の一覧 `KIND_FOLDERS` から引く (#3345)。
 * 置き場へ移したブロックの部品は、ブロックの置き場の描き方 (`blocks/<名前>/draw.ts`) から引く。動きの名前は呼んだ順に番号が付くので、呼ぶ順は変えない。
 *
 * 動きは全て SVG の中の CSS の keyframes が回す。1 周の長さは `--T`、止める時刻は `--at`、
 * 止めるか流すかは `--play` の変数で外から変えられる (頁に置く `player.ts` がこれを使う)。
 * 色と字は値の表から CSS の変数として 1 度だけ書き、部品はその変数だけを読む。
 * 止め絵を選ぶと (`still`)、最後の段の止め絵に全ての段の線の名前と箱の中の処理を出し、流れ全体を 1 枚で読ませる (#3200)。
 */
import { drawUserBlocks, isUserPath, type UserBlock, type UserBlocks, userBlock, userBlockUseMessages, withUserBlocks } from "../user-blocks";
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
import { ghostCard, path, side } from "../blocks/side-path/draw";
import { endMark } from "../blocks/start-finish/draw";
import { fieldChanges, strip } from "../blocks/strip/draw";
import { FIGURE_TEXT } from "../figure-text";
import type { ChartLayout } from "../kinds/chart/layout";
import type { GitLayout } from "../kinds/git/layout";
import type { LineupLayout } from "../kinds/lineup/layout";
import type { PipeLayout, PipeWordsInput } from "../kinds/pipe/layout";
import { textWidth } from "../layout/measure";
import {
  type Layout,
  type Rect,
  rewrapStrip,
  type SceneField,
  type SceneStrip,
} from "../layout/scene";
import type { CycleLayout } from "../kinds/cycle/layout";
import type { ErLayout } from "../kinds/er/layout";
import type { TimeLayout } from "../kinds/time/layout";
import type { TreeLayout } from "../kinds/tree/layout";
import type { TryLayout } from "../kinds/try/layout";
import type { VennLayout } from "../kinds/venn/layout";
import { KIND_FOLDERS } from "../kinds/index";
import type { Kind } from "../kinds/kind";
import { kindParts } from "../kinds/registry";
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
  MOTION,
  type Palette,
  paletteVars,
  resolvePalette,
  type Theme,
  TYPE,
} from "../look/values";
import { readDiagram } from "../version";
import { toModel } from "../model";
import type { Diagram, DiagramModel, ViewMode } from "../schema";
import { buildTimeline, type Span, type Timeline } from "../timeline";
import { DEFAULT_LANG, type NotationLang } from "../words";
import { badge, cssFont as font, cssMix as mix, type Ctx, doneMark, esc, sansOf } from "./parts";
import { frameShape, partRadius, sharpJoins } from "./corner";
import type { BreakFinder, LayoutBreak, PipePiece } from "./breaks";
import { findOverlaps, type Framed, type Ink, type Overlap, type Stroke, type Trace } from "./ink";
import { Motion } from "./motion";

/** 置き場を持つ図の種類を、図の種類の名前で引く表 */
const FOLDERS: Readonly<Partial<Record<string, Kind>>> = KIND_FOLDERS;

const isChartLayout = (layout: Layout): layout is ChartLayout => layout.kind === "chart";
const isVennLayout = (layout: Layout): layout is VennLayout => layout.kind === "venn";
const isCycleLayout = (layout: Layout): layout is CycleLayout => layout.kind === "cycle";
const isErLayout = (layout: Layout): layout is ErLayout => layout.kind === "er";
const isGitLayout = (layout: Layout): layout is GitLayout => layout.kind === "git";
const isLineupLayout = (layout: Layout): layout is LineupLayout => layout.kind === "lineup";
const isPipeLayout = (layout: Layout): layout is PipeLayout => layout.kind === "pipe";
const isTimeLayout = (layout: Layout): layout is TimeLayout => layout.kind === "time";
const isTreeLayout = (layout: Layout): layout is TreeLayout => layout.kind === "tree";
const isTryLayout = (layout: Layout): layout is TryLayout => layout.kind === "try";

export interface RenderOptions {
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
  /** 原本の頭に書かずに渡す、使う人が足すブロックの定義 (#3399)。`readBlocks` が読んだ物。原本の `define` と同じ名前の定義は原本の物を使う */
  blocks?: UserBlocks;
  /**
   * 図の中に描く語を、描く言葉 (`lang`) の語の代わりに渡す (#3584)。画面を持つ側が自分の語で描くために使う。
   * `pipe` は配管の図の槽の下の語と、入力と出力の札と、内側の段をまとめた枠の文。一部だけ渡せ、渡さない語は `lang` の語で描く
   */
  words?: DiagramWords;
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
}

const S = LOOK.stroke;
const X = LOOK.mix;
/** 状態遷移図で段が終わった線と番号の灰 (#3171) */
const PAST = `color-mix(in srgb,var(--mute) ${X.past}%,var(--bg))`;

/** 部品の見た目。どの値も値の表から読む。 */
const PART_CSS = [
  ".dg{display:block;width:100%;height:auto;overflow:visible}",
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
): string {
  // 札の言葉で全体図の地の幅が変わりうるので、同じ頁に置いた別の言葉の図と名前を分ける。
  // 色は色味の名前でなく色の値から名前を作り、色の値を重ねた図 (#3198) と同じ色味の名前の図の変数の規則を分ける
  const vars = paletteVars(palette, theme);
  const id = nameOf(
    `${JSON.stringify(diagram)}|${vars}|${follow ? `${follow.width}|${follow.lang}` : ""}`,
  );
  const m = new Motion(`dg${id}`, timeline.total, timeline.last);
  // 木の図の運ぶ物は着いた所で消える。通った跡が行き先を残し、兄弟の箱から同じ親へ着いた運ぶ物が重ならないため
  const carried: CarrierTime[] = isTreeLayout(layout)
    ? timeline.carriers.map((time) => ({ ...time, start: time.depart, end: time.arrive + MOTION.fade }))
    : timeline.carriers;
  // 手順の図は、判断をひし形で、本筋に無い箱を点線の縁と薄い名前で描き、点が着いた判断を塗る。段で動く線を青で引いて段の印の点を走らせ、
  // 段が終わった線を濃い墨の色で残す (#3561)。見た目の規則も手順の図の SVG にだけ書く
  const flowParts = layout.kind === "flow" ? kindParts("flow") : undefined;
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
    seats: seatsOf(layout.edges, carried),
    ...flowParts?.flowHooks(m, timeline),
  };
  // 回り続ける図の弧と輪の真ん中の字は、回り続ける図を描く部品が描き、段ごとにその段の手順の箱だけを光らせる (#3623)。見た目の規則も回り続ける図の SVG にだけ書く
  const cycle = isCycleLayout(layout) ? kindParts("cycle").drawCycle(layout, diagram, ctx) : undefined;
  const on = cycle?.on ?? involved(diagram);
  // 表どうしの関係の図の結びの線と表と式の札は、表どうしの関係の図を描く部品が描く (#3618)。見た目の規則も表どうしの関係の図の SVG にだけ書く
  const er = isErLayout(layout) ? kindParts("er").drawEr(layout, diagram, ctx) : undefined;
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
  if (cycle) L.base.push(cycle.base);
  if (er) {
    L.base.push(er.base);
    L.node.push(er.node);
  }
  for (const region of layout.regions) L.band.push(band(region, ink, ctx.corner));
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
  const isState = layout.kind === "state" || layout.kind === "flow";
  const arrivals = new Map(
    (timeline.states ?? []).flatMap((s) =>
      s.lit[0] ? [[s.box, s.lit[0].start] as [string, number]] : [],
    ),
  );
  // 時間軸の図の物差しの欄は、満ち具合の動きで棒を伸ばす (#3165)
  const meters = new Map((timeline.meters ?? []).map((meter) => [meter.field, meter.keys]));
  const gauge = (field: SceneField): string | undefined =>
    field.meter
      ? kindParts("time").meterField(
          { ...field, meter: field.meter },
          meters.get(field.name) ?? [[0, 0]],
          ctx,
        )
      : undefined;
  const drawStrip = (s: SceneStrip): string =>
    strip(s, fieldChanges(diagram, timeline, layout), ctx, isState, arrivals, gauge);
  // 寄って追う図の表は窓の下に置くので、窓の中身には描かない (#3270)
  if (layout.strip && !follow) L.band.push(drawStrip(layout.strip));
  for (const line of layout.lifelines) L.base.push(lifeline(line.x, line.y1, line.y2));
  // 枝分かれの図の線と commit と札は、枝分かれの図を描く部品が描く (#3164)
  if (isGitLayout(layout)) {
    const git = kindParts("git").drawGit(layout, diagram, timeline, ctx);
    L.base.push(git.links);
    L.lit.push(git.lines);
    L.node.push(git.commits);
    L.top.push(git.tags);
  }
  // 木の図の木の線と通った跡と木の箱と札は、木の図を描く部品が描く (#3233)。木の線を走る線は通った跡が見せるので、ほかの線と同じ線で描かない
  const treeLayout = isTreeLayout(layout) ? layout : undefined;
  const tree = treeLayout
    ? kindParts("tree").drawTree(treeLayout, diagram, timeline, ctx)
    : undefined;
  if (tree) {
    L.base.push(tree.links);
    L.lit.push(tree.trails);
    L.node.push(tree.nodes);
  }
  const runs = new Set((treeLayout?.runs ?? []).map((r) => `${r.step}/${r.event}`));
  // 列の図の列とチップと封と札は、列の図を描く部品が描く (#3239)。
  // 列の図の見た目の規則も列の図を描く部品が持ち、列の図の SVG にだけ書く。ほかの図の SVG と最初に読む script に入れない (#3351)
  const lineupLayout = isLineupLayout(layout) ? layout : undefined;
  const lineup = lineupLayout
    ? kindParts("lineup").drawLineup(lineupLayout, diagram, timeline, ctx, subs)
    : undefined;
  if (lineup) {
    // 寄って追う窓は見出しの文 (図の題、段の題、説明) を描かない。図の幅で組んだ文は窓で切れ、段の題と説明は部品の帯が出すため (#3365)
    if (!follow) L.base.push(lineup.heading);
    L.base.push(lineup.lanes);
    L.node.push(lineup.chips);
  }
  // 試す図の網と待ち行列と機械の列とチップは、試す図を描く部品が描く (#3337)。見た目の規則も試す図の SVG にだけ書く
  const tryDrawn = isTryLayout(layout)
    ? kindParts("try").drawTry(layout, diagram, timeline, ctx)
    : undefined;
  if (tryDrawn) {
    L.base.push(tryDrawn.base);
    L.lit.push(tryDrawn.lit);
    L.node.push(tryDrawn.node);
    L.top.push(tryDrawn.top);
  }
  // 配管の図は段ごとに図の全てを 1 枚の絵に描くので、描く部品が全ての層を持つ (#3389)。見た目の規則も配管の図の SVG にだけ書く
  const pipeDrawn = isPipeLayout(layout) ? kindParts("pipe").drawPipe(layout, timeline, ctx) : undefined;
  if (pipeDrawn) L.base.push(pipeDrawn.base);
  // 量の図の輪と弧と棒と字は、量の図を描く部品が描く (#3560)。段の番号はほかの図の種類と同じくここで描く。見た目の規則も量の図の SVG にだけ書く
  const chartDrawn = isChartLayout(layout) ? kindParts("chart").drawChart(layout, diagram, ctx) : undefined;
  if (chartDrawn) L.base.push(chartDrawn.base);
  // 集合の重なりの図の円と区画と字と札は、集合の重なりの図を描く部品が描く (#3620)。段の番号はほかの図の種類と同じくここで描く。見た目の規則も集合の重なりの図の SVG にだけ書く
  const vennDrawn = isVennLayout(layout) ? kindParts("venn").drawVenn(layout, ctx) : undefined;
  if (vennDrawn) L.base.push(vennDrawn.base);
  // 時間軸の図の目盛りと印と拡大の帯の箱と節目は、時間軸の図を描く部品が描く (#3165)。拡大の帯の線は他の図と同じ線で描く。
  // 作業の棒 (#3562) の見た目の規則は、作業を持つ時間軸の図の SVG にだけ書く
  const timeLayout = isTimeLayout(layout) ? layout : undefined;
  const timeDrawn = timeLayout ? kindParts("time").drawTime(timeLayout, diagram, timeline, ctx, subs) : undefined;
  if (timeDrawn) {
    L.base.push(timeDrawn.base);
    L.lit.push(timeDrawn.lit);
    L.node.push(timeDrawn.node);
    L.top.push(timeDrawn.top);
  }
  const wired = new Set((timeLayout?.wires ?? []).map((w) => `${w.step}/${w.event}`));
  for (const e of layout.edges) {
    const time = timeline.edges.find((t) => t.step === e.step && t.event === e.event);
    if (
      !time ||
      (timeLayout && !wired.has(`${e.step}/${e.event}`)) ||
      runs.has(`${e.step}/${e.event}`) ||
      cycle ||
      er
    )
      continue;
    // 木の図の箱は段ごとに現れるので、木の線を走らない線の点線は、両端の木の箱が現れてから出す (#3240)
    const since = Math.max(tree?.appear.get(e.from) ?? 0, tree?.appear.get(e.to) ?? 0);
    const drawn = edge(e, time, ctx, isState, since);
    L.base.push(drawn.base);
    L.lit.push(drawn.lit);
  }
  if (flowParts) L.top.push(flowParts.stepMarks(layout, ctx));
  const states = new Map((timeline.states ?? []).map((s) => [s.box, s]));
  // 飛び先を持つ箱は、箱の札をその飛び先への link で包む (#3199)。時間軸の図の箱は時間軸の図を描く部品が包む
  const links = new Map(
    diagram.boxes.flatMap((b) =>
      b.link === undefined ? [] : [[b.id, b.link] as [string, string]],
    ),
  );
  const linked = (id: string, markup: string): string => linkTo(links.get(id), markup);
  for (const box of timeLayout || lineupLayout ? [] : layout.boxes) {
    if (box.ghost) {
      L.node.push(linked(box.id, ghostCard(box, ink, ctx.corner)));
      continue;
    }
    const state = states.get(box.id);
    L.node.push(
      linked(
        box.id,
        card(
          box,
          ctx,
          on.get(box.id) ?? [],
          subs.get(box.id) ?? [],
          isState ? (state?.lit ?? []) : undefined,
        ),
      ),
    );
    if (state?.done !== undefined) L.node.push(doneMark(box, state.done, ctx));
  }
  for (const b of layout.badges)
    if (!(follow && onStrip(layout, b))) L.badge.push(badge(b, ctx, isState));
  for (const l of layout.labels) {
    const time = timeline.labels.find((t) => t.step === l.step && t.event === l.event);
    if (time) L.top.push(label(l, fadeBefore(l, time, timeline.steps), ctx));
  }
  // 止め絵を選んだ図は、全ての段の名前を出す間にも処理の札を出す。その間に見えている札は繰り返す前まで延ばす (#3200)
  const { whole } = timeline;
  for (const a of layout.actions) {
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
  const content = Object.values(L)
    .map((parts) => parts.join(""))
    .join("");

  const { near, far, nearY, farY } = LOOK.shadow;
  const shadow = `<filter id="dg-sh-${id}" x="-20%" y="-30%" width="140%" height="180%"><feDropShadow dx="0" dy="${nearY}" stdDeviation="${near}" style="flood-color:var(--sh);flood-opacity:var(--shA)"/><feDropShadow dx="0" dy="${farY}" stdDeviation="${far}" style="flood-color:var(--sh);flood-opacity:var(--shB)"/></filter>`;
  // 寄って追う時系列図は、頭の箱を窓の上端に貼る頭の列にも描く (#3118)。頭の列の箱はアイコンを外した 2 段 (#3120)。止めて見せる図では描かない
  const heads =
    follow && layout.kind === "sequence"
      ? layout.boxes
          .map((box) =>
            linked(box.id, headCard(box, ctx, on.get(box.id) ?? [], subs.get(box.id) ?? [])),
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
    ? followView(layout, timeline, diagram, m, id, content, follow, heads, drawTable, ctx.corner)
    : { body: `${bg}${content}`, w: layout.width, h: layout.height };
  const css = `.dg-${id}{${FONT_VARS};--T:${timeline.total}s;${vars}}${PART_CSS}${lineup?.css ?? ""}${tryDrawn?.css ?? ""}${pipeDrawn?.css ?? ""}${timeDrawn?.css ?? ""}${chartDrawn?.css ?? ""}${vennDrawn?.css ?? ""}${cycle?.css ?? ""}${er?.css ?? ""}${flowParts?.flowCss(id) ?? ""}${sharpJoins(ctx.corner, id)}${m.frames.join("")}`;
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" class="dg dg-${id}" viewBox="0 0 ${Math.ceil(view.w)} ${Math.ceil(view.h)}" width="${Math.ceil(view.w)}" height="${Math.ceil(view.h)}" role="img" aria-label="${esc(diagram.title)}" data-dragon="figure" data-view="${follow ? "follow" : "fixed"}"${isLineupLayout(layout) ? ` data-lineup-arrangement="${layout.arrangement}"` : ""}>` +
    `<style>${css}</style><defs>${shadow}</defs>${view.body}</svg>`
  );
}

/** 四角を全部囲む四角。 */
function union(rects: Rect[]): Rect {
  const x = Math.min(...rects.map((r) => r.x));
  const y = Math.min(...rects.map((r) => r.y));
  return {
    x,
    y,
    w: Math.max(...rects.map((r) => r.x + r.w)) - x,
    h: Math.max(...rects.map((r) => r.y + r.h)) - y,
  };
}

/** 番号の丸が値の表の上に在るか。表の値だけが変わる段の丸は表の隅に置かれる */
function onStrip(layout: Layout, badge: { y: number }): boolean {
  return layout.strip !== undefined && badge.y >= layout.strip.y;
}

/** 列の図の見出しの文 (図の題と、段ごとの題と説明) の下の端 */
function lineupHeadingBottom(layout: LineupLayout): number {
  const texts = [layout.heading, ...layout.headlines.flatMap((h) => (h.say ? [h.title, h.say] : [h.title]))];
  return Math.max(...texts.map((t) => t.y + t.h));
}

/** 段で動く物が占める所。 */
function focusOf(layout: Layout, diagram: DiagramModel, step: number): Rect | undefined {
  const rects = focusParts(layout, diagram, step);
  return rects.length === 0 ? undefined : union(rects);
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
    const next = union([held, p]);
    if (next.w <= vw && next.h <= vh) held = next;
  }
  return held;
}

/**
 * 動く物を全部囲んだ所の真ん中 (#3337)。囲んだ所が窓 (`vw` × `vh`) より大きい時は、最初の物が窓から外れない所までに留める。
 * 動く物が無ければ `undefined`
 */
function anchoredCenter(parts: Rect[], vw: number, vh: number): [number, number] | undefined {
  const first = parts[0];
  if (!first) return undefined;
  const all = union(parts);
  // 窓の幅 `size` で `[lo, lo + len]` を外さない真ん中の範囲に、全部を囲んだ所の真ん中 `c` を収める。窓より大きい物は真ん中に置く
  const keep = (c: number, lo: number, len: number, size: number): number =>
    len > size ? lo + len / 2 : Math.min(lo + size / 2, Math.max(lo + len - size / 2, c));
  return [
    keep(all.x + all.w / 2, first.x, first.w, vw),
    keep(all.y + all.h / 2, first.y, first.h, vh),
  ];
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
  // 木の図は、その段で現れる木の箱と木の線と、線の両端の木の箱を見る (#3233)
  if (isTreeLayout(layout)) {
    const ends = new Set(
      (diagram.steps[step]?.events ?? []).flatMap((e) => (e.type === "edge" ? [e.from, e.to] : [])),
    );
    rects.push(...layout.nodes.filter((n) => n.step === step || ends.has(n.id)));
    for (const l of layout.links.filter((x) => x.step === step)) {
      const xs = l.points.map((p) => p[0]);
      const ys = l.points.map((p) => p[1]);
      rects.push({
        x: Math.min(...xs),
        y: Math.min(...ys),
        w: Math.max(...xs) - Math.min(...xs),
        h: Math.max(...ys) - Math.min(...ys),
      });
    }
  }
  // 列の図は、その段で変わる列を見る (#3239)
  if (isLineupLayout(layout)) {
    const changed = new Set(
      (diagram.steps[step]?.events ?? []).flatMap((e) => ("box" in e ? [e.box] : [])),
    );
    rects.push(...layout.lanes.filter((lane) => changed.has(lane.id)));
  }
  // 試す図は、その段の出来事が触る部品を、出来事が着く所から順に見る (#3337)
  if (isTryLayout(layout)) rects.push(...kindParts("try").tryFocusParts(layout, diagram, step));
  // 配管の図は、その段に関わる関係者の列を見る (#3389)
  if (isPipeLayout(layout)) rects.push(...layout.focus.filter((f) => f.step === step));
  // 表どうしの関係の図は、その段で行を選ぶか値を変える表と、線の両端の表と、その段から出る式の札を見る (#3618)
  if (isErLayout(layout)) rects.push(...kindParts("er").erFocusParts(layout, diagram, step));
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
 * 値の表は図の一番下に在り、窓が近づくまで映らず、窓より広い表は右側が切れる。全体図と同じ理由で窓の外に出し、
 * 窓と全体図の下に図の枠の幅で組み直す (#3270)。窓と全体図は表を除いた図の高さ `worldH` の中だけを見る。
 */
function followView(
  layout: Layout,
  timeline: Timeline,
  diagram: DiagramModel,
  m: Motion,
  id: string,
  content: string,
  follow: FollowFrame,
  heads: string,
  drawTable: (s: SceneStrip, from: SceneStrip) => string,
  corner: Corner,
): { body: string; w: number; h: number } {
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
  const natural = sized(Math.min(worldH, Math.max(F.minH, full * F.aspect)));
  // 携帯の幅では縦長の全体図の列が枠の幅の 3 割を取り、窓が図の横の 3 割ほどしか見せない。その時は全体図を出さない。
  // 横長の全体図は窓の下に出して幅を取らないので、狭い枠でも出す。
  // ただし値の表を持つ図は、窓の下に全体図と表が重なって段を送る釦を最初の画面の外へ押し出すので、狭い枠では全体図を出さない (#3274)
  const bare = frameWidth < F.narrow && (natural.beside || layout.strip !== undefined);
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
  const { vh, mw, k, mh, bw, bgW, bgH, beside } =
    fitted.mh > spare ? sized(fitted.vh, (Math.max(spare, fitted.mh / 2) / worldH) * layout.width) : fitted;
  // 右の全体図の列は枠の余りに置き、窓は図の原寸の幅まで広げる。枠が図より狭い時は今までどおり枠の幅から列を引く
  const vw = beside && !bare ? Math.min(layout.width, frameWidth - bgW - M.inset) : full;
  const clampX = (x: number): number => Math.min(layout.width - vw / 2, Math.max(vw / 2, x));
  // 時系列図は窓の上端に頭の列を貼るので、動く物は頭の列の下の残りの高さ `below` に見せる (#3118)。
  // 線は図の頭の箱の下 `top` から見せ始め、図の頭の箱は頭の列の下か窓の上に隠す (#3120)
  // 列の図は描かない見出しの文の下 `top` から見せ始める (#3365)
  const top =
    heads !== ""
      ? Math.max(...layout.boxes.map((b) => b.y + b.h)) + F.headRoom
      : isLineupLayout(layout)
        ? lineupHeadingBottom(layout)
        : 0;
  const strip = heads === "" ? 0 : F.head.pad * 2 + F.head.h;
  const below = vh - strip;
  /** 頭の列の下の残りの窓の真ん中の高さを、図の頭の箱の下と図の下端で止める */
  const clampY = (y: number): number => Math.min(worldH - below / 2, Math.max(top + below / 2, y));
  const r = LOOK.badge.r;
  let prev: [number, number] = [layout.width / 2, worldH / 2];
  // 頭の列の下の残りの窓の真ん中。窓の真ん中は、これより頭の列の高さの半分だけ上に在る
  const middles = timeline.steps.map((_, s) => {
    // 時間軸の図は、針と印の列を必ず窓に入れる (#3165)。番号の丸へ寄せ直すと、針が窓から外れるため
    if (isTimeLayout(layout)) {
      const f = kindParts("time").timeFocus(
        layout,
        timeline,
        s,
        focusParts(layout, diagram, s),
        vw,
        below,
      );
      prev = [f.x + f.w / 2, f.y + f.h / 2];
      return [clampX(prev[0]), clampY(prev[1])] as [number, number];
    }
    // 試す図は、出来事が着く所 (送った先の待ち行列、作ったブロック、書き換えたブロック) を窓から外さずに寄せる (#3337)。
    // 網は図の幅いっぱいに広がるので、全部を囲んだ所の真ん中へ寄せると、狭い窓では送った先の待ち行列が窓から外れる
    if (isTryLayout(layout)) {
      prev = anchoredCenter(focusParts(layout, diagram, s), vw, below) ?? prev;
      return [clampX(prev[0]), clampY(prev[1])] as [number, number];
    }
    const f = focusOf(layout, diagram, s);
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
  const overview = (): { clip: string; body: string } => {
    const shapes = [
      ...layout.regions.map(
        (r) =>
          `<rect class="dg-mm-band" style="${cs(r.color)}" x="${mx + r.x * k}" y="${my + r.y * k}" width="${r.w * k}" height="${r.h * k}" rx="${partRadius(corner, M.band)}"/>`,
      ),
      ...layout.boxes.map(
        (b) =>
          `<rect class="dg-mm-card" style="${cs(b.color)}" x="${mx + b.x * k}" y="${my + b.y * k}" width="${b.w * k}" height="${b.h * k}" rx="${partRadius(corner, M.card)}"/>`,
      ),
      ...(isTreeLayout(layout) ? layout.nodes : []).map(
        (n) =>
          `<rect class="dg-mm-card" style="${cs(n.color)}" x="${mx + n.x * k}" y="${my + n.y * k}" width="${n.w * k}" height="${n.h * k}" rx="${partRadius(corner, M.card)}"/>`,
      ),
      // 試す図は、待ち行列の枠を地に、網の節と出ているブロックを札に描く (#3337)
      ...(isTryLayout(layout) ? kindParts("try").tryOverview(layout) : []).map(
        ({ rect: t, band, color }) =>
          `<rect class="${band ? "dg-mm-band" : "dg-mm-card"}" style="${cs(color)}" x="${mx + t.x * k}" y="${my + t.y * k}" width="${t.w * k}" height="${t.h * k}" rx="${partRadius(corner, band ? M.band : M.card)}"/>`,
      ),
    ].join("");
    const vp = m.move(
      cam.map(([t, cx, cy, , e]) => [t, mx + (cx - vw / 2) * k, my + (cy - vh / 2) * k, 1, e]),
    );
    return {
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
  const mini = bare ? { clip: "", body: "" } : overview();
  // 頭の列は窓の中身の上に重ね、窓と同じ時刻と緩急で横にだけ動かす (#3118)
  const head =
    strip === 0
      ? ""
      : `<g class="dg-hd"><rect class="dg-hd-bg" width="${vw}" height="${strip}"/><line class="dg-sep" x1="0" y1="${strip}" x2="${vw}" y2="${strip}"/>` +
        `<g class="dg-a" style="${m.move(cam.map(([t, cx, , s, e]) => [t, vw / 2 - cx, 0, s, e]))}">${heads}</g></g>`;
  const body =
    `<defs><clipPath id="dg-vp-${id}">${frameShape(corner, "", { x: 0, y: 0, w: vw, h: vh }, `<rect width="${vw}" height="${vh}" rx="${LOOK.region.radius}"/>`)}</clipPath>${mini.clip}</defs>` +
    `<g clip-path="url(#dg-vp-${id})"><rect class="dg-vp-bg" width="${vw}" height="${vh}"/><g class="dg-a" style="${camKf}">${content}</g>${head}</g>` +
    `${frameShape(corner, ' class="dg-vp-frame"', { x: 0.5, y: 0.5, w: vw - 1, h: vh - 1 }, `<rect class="dg-vp-frame" x="0.5" y="0.5" width="${vw - 1}" height="${vh - 1}" rx="${LOOK.region.radius}"/>`)}${mini.body}`;
  const w = beside && !bare ? vw + M.inset + bgW : full;
  // 全体図を出さない時は、窓のすぐ下に表を置く
  const bottom = beside || bare ? vh : bgY + bgH;
  if (!layout.strip) return { body, w, h: bottom };
  const table = rewrapStrip(layout.strip, 0, bottom + M.inset, full);
  return { body: body + drawTable(table, layout.strip), w, h: table.y + table.h };
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
  // 配管の図は `[fold]` の呼び出しの内側の段を、開くと頼まれていなければ 1 つの段にまとめてから並べる (#3389)
  const model = toModel(read.diagram);
  const diagram = model.kind === "pipe" ? kindParts("pipe", lang).foldPipe(model, options.open ?? [], lang, options.words?.pipe) : model;
  // 置き場を持つ図の種類は、置き場の並べ方で並べる (#3345)。後から読む図の種類 (#3347) と置き場の無い図の種類は登録簿から並べ方を引き、
  // 知らない種類は構成図の並べ方で並べる
  const folder = FOLDERS[diagram.kind];
  const layout = folder?.layout
    ? folder.layout(diagram, lang)
    : diagram.kind === "state"
      ? kindParts("state", lang).layoutState(diagram, lang)
      : diagram.kind === "flow"
        ? kindParts("flow", lang).layoutFlow(diagram, lang)
      : diagram.kind === "cycle"
        ? kindParts("cycle", lang).layoutCycle(diagram)
      : diagram.kind === "er"
        ? kindParts("er", lang).layoutEr(diagram)
      : diagram.kind === "venn"
        ? kindParts("venn", lang).layoutVenn(diagram, lang)
      : diagram.kind === "git"
        ? kindParts("git", lang).layoutGit(diagram)
        : diagram.kind === "time"
          ? kindParts("time", lang).layoutTime(diagram, lang)
          : diagram.kind === "tree"
            ? kindParts("tree", lang).layoutTree(diagram)
            : diagram.kind === "lineup"
              ? kindParts("lineup", lang).layoutLineup(diagram, {
                  lang,
                  ...(options.width === undefined ? {} : { width: options.width }),
                })
              : diagram.kind === "try"
                ? kindParts("try", lang).layoutTry(diagram, lang, {
                    ...(options.width === undefined ? {} : { width: options.width }),
                  })
                : diagram.kind === "pipe"
                  ? kindParts("pipe", lang).layoutPipe(diagram, {
                      lang,
                      ...(options.words?.pipe === undefined ? {} : { words: options.words.pipe }),
                      ...(options.width === undefined ? {} : { width: options.width }),
                    })
                  : diagram.kind === "chart"
                    ? kindParts("chart", lang).layoutChart(diagram, {
                        ...(options.width === undefined ? {} : { width: options.width }),
                      })
                    : KIND_FOLDERS.architecture.layout(diagram, lang);
  // 色味を指定しない図は、図の種類の既定の色味で描く (#3398)
  const kindPalette = options.palette === undefined ? KIND_PALETTE[diagram.kind] : undefined;
  const drawn = kindPalette === undefined ? options : { ...options, palette: kindPalette };
  const timeline = buildTimeline(diagram, options.still === true);
  // 手順の図の段の印の点と運ぶ物と光る間は、手順の図の描く部品が時刻の表を直す (#3561)
  // 回り続ける図と表どうしの関係の図の札は、走り出しを待たずに出て段の終わりに消える (#3623、#3618)
  const timed =
    diagram.kind === "flow"
      ? kindParts("flow", lang).flowTimes(diagram, timeline)
      : diagram.kind === "cycle"
        ? kindParts("cycle", lang).cycleTimes(diagram, timeline)
        : diagram.kind === "er"
          ? kindParts("er", lang).erTimes(diagram, timeline)
        : timeline;
  const rendered = renderLayout(diagram, layout, timed, drawn);
  return diagram === model || diagram.steps.length === model.steps.length ? rendered : { ...rendered, source: model };
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
  const svg = drawSvg(diagram, layout, timeline, palette, theme, undefined, ink, traces, framed, pieces, strokes);
  // 箱の札は、時間軸の図と列の図では描く部品が別に描くので、崩れの確かめも箱の札を描いた図の種類の箱だけを見る
  const carded = isTimeLayout(layout) || isLineupLayout(layout) ? [] : layout.boxes.filter((box) => !box.ghost);
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
