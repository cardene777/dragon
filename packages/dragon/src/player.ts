/**
 * 頁に図を置いて動かす。
 *
 * 動きを嫌う設定 (`prefers-reduced-motion: reduce`) は描く前に読み、その人には一瞬も自動再生せず、
 * 段ごとの止め絵を釦で送る。各段の題と本文と出典は、読み上げの道具が段の順に読める番号付きの一覧として置き、
 * 図そのものは読み上げから隠して同じ中身を 2 度読ませない。
 * 見せ方は枠の幅で選び (`view.ts`)、寄って追う時は窓と全体図で描き直す。
 * 釦と段の一覧の読み上げの名前と全体図の札は、渡した言葉 (`options.lang`、書かなければ英語) で出す (#3001)。
 * 色は `options.palette` の名前の色味に `options.colors` の色の値を重ね、図と全体図と釦と段の帯を同じ色で塗る (#3198)。
 * 段が替わるたびに `options.onStep` で今の段を知らせ、頁の側が段の札や進み具合を出せるようにする (#3031)。
 * 置いた時に流さず決めた段で止めて置く (`options.pausedAt`) ことと、1 度だけ流して最後の段で止める (`options.playOnce`) ことを選べる。
 * 止め絵を選んだ図 (`options.still`) は、最後の段で止まった時に全ての段の線の名前を出す (#3200)。
 * 頁は `goTo` で段へ移って止め、`mark` で図の上に点線の四角を描く。頁の側では SVG を組まないので、編集画面が字の重なりを囲む時もこれを呼ぶ (#3178)。
 * 段の本文の帯は本文の最も長い段の高さに保ち、段を送っても図の大きさと位置を変えない (#3049)。
 * 帯の中身の幅が `LOOK.player.narrow` より狭い時は、段を送る釦を指で押せる大きさにして段の番号と上の段に並べ、
 * 題と本文をその下の段の全幅に置く (#3057、#3069)。
 * 試す図 (`try`) は書き手の最初の段だけを持つ原本 (今の原本) で描き、流さずに最初の段の止め絵で置く。図の下に段の説明とゲージの帯を、その下に入力の帯を置き (#3437)、
 * 読み手が送るか釦を押すかチップを書き換えるたびに、その出来事の段を今の原本の最後に足して描き直し、足した段を 1 度だけ流す。
 * 動きを嫌う設定では流さずに足した段の止め絵で止める。今の原本は `player.diagram` で読め、置き直すと最初の段に戻る (#3337)。
 * 入力の帯などの操作は試す図の描く部品と同じ塊が持ち、試す図を描けた後に登録簿 (`kinds/registry.ts`) から引いて置く。
 * 配管の図 (`pipe`) は帯に段の番号と題を出して段の説明の文を出さず、図の下に段の動きの矢印と畳んだ呼び出しの結果を置く (#3450)。
 * 矢印と記録は配管の図の描く部品と同じ塊が持ち、配管の図を描けた後に登録簿から引いて置く。
 * 配管の図の枠 (`[data-dragon="zoom-frame"]`、図が枠より広い間は `[data-dragon="pan"]`) は図を 100% から 400% まで拡大でき、
 * 釦、Ctrl か Command を押しながらのホイール、ダブルクリックで拡大し、拡大した図を引いて枠の中を縦横に送る。
 * 100% の図は、枠の幅が `ZOOM.fit` より狭い時は枠の幅に収め、広い時は縮めずに置く。配管の図は枠の幅を渡して描く。
 * ただし狭い枠に収めると槽の残高の字が `PIPE_LOOK.narrow.px` に届かない図は、字が届く幅で置いて横に送る (#3450)。
 */
import { drawSources } from "./blocks/source/draw";
import { drawRooms, drawStepItem } from "./blocks/step/draw";
import { FIGURE_TEXT } from "./figure-text";
import type { Rect } from "./layout/scene";
import type { PipeLayout } from "./kinds/pipe/layout";
import type { TryLayout } from "./kinds/try/layout";
import { PIPE_LOOK } from "./look/pipe";
import { FONT_VARS, LOOK, paletteVars, type TextStyle, TYPE } from "./look/values";
import { partRadius } from "./render/corner";
import {
  drawSvg,
  paletteOf,
  type RenderOptions,
  type Rendered,
  renderDiagram,
} from "./render/draw";
import { kindParts } from "./kinds/registry";
import { isParsed, markParsed } from "./parsed";
import type { PipeCalls } from "./pipe-player";
import type { Diagram, Step, ViewMode } from "./schema";
import type { Span } from "./timeline";
import { chooseView } from "./view";
import { DEFAULT_LANG } from "./words";

export interface PlayerOptions extends RenderOptions {
  /** 段が替わるたびに今の段 (0 から) を受け取る。置いた時にも最初の段で 1 度呼ぶ。頁の側で段の札や進み具合を出す時に使う (#3031) */
  onStep?: (step: number) => void;
  /**
   * 図を、図の枠の中で見える高さに収める (#3047)。高さに収めると字が読めない図は寄って追う図にし、寄って追う窓と全体図をその高さに収める。
   * 枠の高さが決まっている置き場 (カタログの拡大の重ね窓) で使う。枠の高さが図に合わせて伸びる置き場で使うと、描くたびに低くなる
   */
  fitHeight?: boolean;
  /** 置いた時に流さず、段 `pausedAt` (0 から) の止め絵で止めて置く。段の数を超えた時は最後の段で止める。書かなければ置いた時から流す (#3200) */
  pausedAt?: number;
  /** 流した時に最後の段の止め絵で止め、繰り返さない。最後の段で止まった図を流すと、最初の段から流し直す (#3200) */
  playOnce?: boolean;
}

export interface Player {
  /** 今の段 (0 から) */
  readonly step: number;
  /** 動いているか */
  readonly playing: boolean;
  next(): void;
  prev(): void;
  play(): void;
  pause(): void;
  /** 段 `step` (0 から) へ移って止める。段の数を超えた時は最後の段で止める (#3178) */
  goTo(step: number): void;
  /** 図の上に点線の四角を描く。四角は図の座標で渡し、空を渡すと消す。図を置き直しても残る (#3178) */
  mark(rects: readonly Rect[]): void;
  /** 今の原本。試す図では読み手が足した段を含む写しを返し、ほかの種類の図では渡した原本を返す (#3337) */
  readonly diagram: unknown;
  destroy(): void;
}

const font = (t: TextStyle): string => `font:${t.weight} ${t.size}px var(--${t.family})`;
const px = (v: number): string => `${v}px`;

/**
 * 配管の図の拡大 (#3418)。度合いの下限と上限、釦 1 回の倍率、ダブルクリックの倍率と 100% へ戻す度合い、
 * 100% の図を枠の幅に収める枠の幅の上限、ホイールの 1px で変わる度合いの割合、引いて動かすと見る動きの下限 (px)、
 * 押せない拡大の釦の濃さ
 */
const ZOOM = { min: 1, max: 4, step: 1.25, double: 1.6, reset: 2.5, fit: 600, wheel: 0.002, drag: 3, dim: 0.4 } as const;

function playerCss(): string {
  const P = LOOK.player;
  const C = LOOK.corner.cut;
  const hidden = px(P.hidden);
  return [
    `.dg-player{display:flex;flex-direction:column;gap:${px(P.gap)};color:var(--ink)}`,
    `.dg-player .dg-frame{border-radius:${px(P.radius)};overflow:hidden}`,
    // 横に長い配管の図は縮めずに枠の中を横に送る。手でも送れるように枠の外を動かせる (#3398)。
    // 置いた頁が枠の高さを決めていて図の方が高い時も、縦に送って図の下まで見せる
    // 配管の図の拡大する枠も同じく送り、拡大した図を縦横に送る (#3418)
    `.dg-player .dg-frame:is([data-dragon="pan"],[data-dragon="zoom-frame"]){overflow-x:auto;overflow-y:auto;scrollbar-width:none;overscroll-behavior-x:contain}`,
    `.dg-player .dg-frame:is([data-dragon="pan"],[data-dragon="zoom-frame"])::-webkit-scrollbar{display:none}`,
    // 枠より狭い図は枠の真ん中に置く。枠より広い図は左の端から送る
    `.dg-player .dg-frame:is([data-dragon="pan"],[data-dragon="zoom-frame"])>svg{max-width:none;margin-inline:auto}`,
    // 送れる図は引いて動かせることを指の形で示し、引く間に字を選ばない
    `.dg-player .dg-frame:is([data-dragon="pan"],[data-zoomed]){cursor:grab;user-select:none}`,
    `.dg-player .dg-frame[data-drag]{cursor:grabbing}`,
    `.dg-ov{position:relative;height:${px(P.overview)};margin-top:${px(P.overviewGap - P.gap)};border-radius:${px(P.overview / 2)};background:var(--hair)}`,
    `.dg-ov-t{position:absolute;top:0;bottom:0;border-radius:${px(P.overview / 2)};background:var(--mute)}`,
    // 角を落とす色味の再生の枠は、図の枠と同じく右上と左下を落として切り抜き、釦の角を丸めない (#3344)
    `.dg-player[data-corner="cut"] .dg-frame{border-radius:0;clip-path:polygon(0 0,calc(100% - ${px(C)}) 0,100% ${px(C)},100% 100%,${px(C)} 100%,0 calc(100% - ${px(C)}))}`,
    `.dg-player[data-corner="cut"] .dg-btn,.dg-player[data-corner="cut"] .dg-seg{border-radius:0}`,
    // 帯は段の番号と大きな段の題、題の下の小さな説明文、操作 (やり直し、前、名前の付いた再生、次、段ごとの進み具合) を持つ (#3398)。
    // 中身の幅が `wide` より狭い帯は上から操作の段、題、説明文の順に積む。広い帯は釦を題の行の右に置き、進み具合を全幅の細い帯にして帯を低く保つ。
    // 帯が高いと図に使える高さが減り、低い画面で大きな図が寄って追う図に替わるため。帯の左右の余白は置いた頁が帯に付ける
    `.dg-bar{container:dg-bar/inline-size}`,
    `.dg-lay{display:flex;flex-direction:column;gap:${px(P.gap)}}`,
    `.dg-say{display:flex;align-items:baseline;gap:${px(P.captionGap)};min-width:0}`,
    `.dg-no{${font(TYPE.stepNo)};font-size:${px(TYPE.stepNo.size)};color:var(--mute);flex:none}`,
    `.dg-txt{display:grid;grid-template-columns:minmax(0,1fr);min-width:0;flex:1}`,
    `.dg-txt>*{grid-area:1/1}`,
    `.dg-room{visibility:hidden}`,
    `.dg-tt{${font(TYPE.stepTitle)};font-size:${px(TYPE.stepTitle.size)};line-height:${P.titleLine};margin:0}`,
    `.dg-tb{${font(TYPE.stepBody)};font-size:${px(TYPE.stepBody.size)};line-height:${P.bodyLine};color:var(--ink2);margin:0;white-space:pre-line}`,
    `.dg-ctl{display:flex;align-items:center;gap:${px(P.gap)};min-width:0}`,
    `.dg-btns{display:flex;gap:${px(P.segmentGap)};flex:none}`,
    `.dg-btn{min-width:${px(P.button)};height:${px(P.button)};padding:0;border-radius:${px(P.radius)};border:${px(LOOK.stroke.hair)} solid var(--line);background:var(--surf);color:var(--ink);${font(TYPE.button)};cursor:pointer;white-space:nowrap}`,
    `.dg-btn[data-dragon="toggle"]{padding:0 ${px(P.button / 2)};background:var(--c-blue);border-color:var(--c-blue);color:var(--on-c)}`,
    `.dg-btn:focus-visible{outline:${px(P.focus)} solid var(--c-blue);outline-offset:${px(P.focus)}}`,
    `.dg-segs{display:flex;gap:${px(P.segmentGap)};flex:1;min-width:0}`,
    `.dg-seg{flex:1;min-width:${px(P.focus)};height:${px(P.segment)};border-radius:${px(P.segment / 2)};background:var(--line);cursor:pointer}`,
    `.dg-seg[data-state="done"]{background:color-mix(in srgb,var(--c-blue) ${P.segmentPast}%,var(--line))}`,
    `.dg-seg[data-state="now"]{background:var(--c-blue)}`,
    `.dg-sr{position:absolute;width:${hidden};height:${hidden};margin:-${hidden};padding:0;overflow:hidden;clip:rect(0 0 0 0);clip-path:inset(50%);white-space:nowrap;border:0}`,
    // 積む帯は操作の段 (釦と進み具合) を図のすぐ下に置き、段を送る釦を携帯の最初の画面に収める (#3061)。
    // その下の番号の右に題、その下に説明文を帯の全幅で置く。説明文を番号の右の欄に入れると行が増えて帯が高くなり、
    // 重ね窓の図の枠が低くなる (#3059)。題と説明文を包む箱を外して写しも同じ升に重ねるので、題の升は最も高い題、
    // 説明文の升は最も長い説明文の高さになる (#3049)。題を小さくし、題と説明文から操作の段までを詰めて、図の枠の高さを残す
    `@container dg-bar (width < ${px(P.wide)}){.dg-lay{gap:${px(P.progressGap)}}.dg-ctl{order:-1}.dg-tt{font-size:${px(TYPE.stepTitleStacked.size)}}` +
      `.dg-say{display:grid;grid-template-columns:auto minmax(0,1fr);column-gap:${px(P.captionGap)};align-items:baseline}` +
      `.dg-txt,.dg-txt>*{display:contents}.dg-no{grid-area:1/1}.dg-tt{grid-area:1/2}.dg-tb{grid-area:2/1/3/3}}`,
    // 狭い帯 (携帯の幅) では、段を送る釦を指で押せる大きさにする (#3057、#3069)。題と説明文の字を小さくし、帯を低く保つ (#3061)
    `@container dg-bar (width < ${px(P.narrow)}){.dg-btn{min-width:${px(P.touch)};height:${px(P.touch)}}` +
      `.dg-tt{font-size:${px(TYPE.stepTitleNarrow.size)}}.dg-tb{font-size:${px(TYPE.stepBodyNarrow.size)};line-height:${P.bodyLineNarrow}}}`,
    // 広い帯は題と説明文の右に釦、その下の行に全幅の進み具合。題と説明文を隠した頁 (見本帳の欄) では釦が左に寄る
    `@container dg-bar (width >= ${px(P.wide)}){.dg-lay{display:grid;grid-template-columns:minmax(0,1fr) auto;column-gap:${px(P.captionGap)};row-gap:${px(P.progressGap)}}.dg-ctl{display:contents}.dg-btns{justify-self:start;align-self:start}.dg-segs{grid-column:1/-1}}`,
    // 指で触る時は、広い帯でも段を送る釦を指で押せる大きさにする (#3076)。並びは変えない
    `@media (pointer: coarse){.dg-btn{min-width:${px(P.touch)};height:${px(P.touch)}}}`,
    // 配管の図の帯は段の番号と題を出し、段の説明の文は出さない (#3450)。段の動きは図の下の矢印が見せ、説明の文は読み上げの一覧が読む。
    // 説明の文の写しも隠し、帯の高さを最も長い題で決める
    ".dg-player[data-pipe] .dg-tb{display:none}",
    // 拡大の釦と度合いの札。積む帯では操作の段の右の端に置き、釦と並ばない幅では次の行へ送る。
    // 広い帯では段を送る釦の右に置き、帯を 1 段に保つ
    `.dg-zm{display:flex;align-items:center;gap:${px(P.segmentGap)};flex:none;margin-left:auto}`,
    `.dg-zl{${font(TYPE.stepNo)};min-width:${px(P.button * 1.5)};text-align:center;color:var(--mute)}`,
    `.dg-zm .dg-btn:disabled{opacity:${ZOOM.dim};cursor:default}`,
    ".dg-player[data-pipe] .dg-ctl{flex-wrap:wrap}",
    `@container dg-bar (width >= ${px(P.wide)}){.dg-player[data-pipe] .dg-lay{grid-template-columns:minmax(0,1fr) auto auto}.dg-zm{grid-area:1/3;align-self:start}}`,
    `.dg-spot{fill:none;stroke:var(--t-amber);stroke-width:${px(LOOK.stroke.mark)};stroke-dasharray:${LOOK.mark.dash} ${LOOK.mark.gap};pointer-events:none}`,
  ].join("");
}

/** 試す図の原本か */
function isTrySource(input: unknown): input is Diagram {
  if (typeof input !== "object" || input === null) return false;
  const source = input as { kind?: unknown; steps?: unknown };
  return source.kind === "try" && Array.isArray(source.steps);
}

/** 配管の図の原本か。描く前に読み、枠の幅を渡して描く (#3418) */
function isPipeSource(input: unknown): boolean {
  return typeof input === "object" && input !== null && (input as { kind?: unknown }).kind === "pipe";
}

/**
 * 記法から読んだ図 (`from`) を写した図 (`copy`) に、記法から読んだ印を引き継ぐ (#3416)。
 * 写した図は印を持たないので、引き継がないと軽い入口は原本の形の検査を求めて止まる。原本の JSON を写した図には付けない
 */
function keepParsed<T extends object>(from: unknown, copy: T): T {
  return isParsed(from) ? markParsed(copy) : copy;
}

/** 書き手の最初の段だけを持つ今の原本。渡した原本は書き換えない */
function startSession(input: Diagram): Diagram {
  const copy = JSON.parse(JSON.stringify(input)) as Diagram;
  return keepParsed(input, { ...copy, steps: copy.steps.slice(0, 1) });
}

function ensureCss(doc: Document): void {
  if (doc.getElementById("dragon-player-css")) return;
  const style = doc.createElement("style");
  style.id = "dragon-player-css";
  style.textContent = playerCss();
  doc.head.appendChild(style);
}

/** 釦に出す字。HTML に書き出す時は、この字も字の file に残す。 */
export const BUTTON_TEXT = { restart: "↺", prev: "‹", pause: "❚❚", play: "▶", next: "›" } as const;
/** 配管の図だけが置く拡大と縮小の釦の字 (#3418)。配管の図を HTML に書き出す時だけ、字の file に残す */
export const ZOOM_TEXT = { out: "−", in: "+" } as const;

/** 図の上に四角を描く時の SVG の名前空間 */
const SVG_NS = "http://www.w3.org/2000/svg";

const pad = (n: number): string => String(n).padStart(2, "0");
/** 段の番号の札 (`01/12`)。`step` は 0 から数える。 */
export const stepNo = (step: number, count: number): string => `${pad(step + 1)}/${pad(count)}`;

export function mountDiagram(
  host: HTMLElement,
  diagram: unknown,
  options: PlayerOptions = {},
): Player {
  const doc = host.ownerDocument;
  const win = doc.defaultView;
  // 描く前に読む。描いた後に読むと、動きを嫌う人にも一瞬だけ流れてしまう
  const reduce = Boolean(win?.matchMedia?.("(prefers-reduced-motion: reduce)").matches);
  // 試す図は書き手の最初の段だけを持つ今の原本で描き、読み手が押すたびに段を足す (#3337)
  let session = isTrySource(diagram) ? startSession(diagram) : undefined;
  /** 描く原本。試す図では今の原本 */
  let source: unknown = session ?? diagram;
  /** 配管の図で、読み手が押して開いた `[fold]` の呼び出しの番号 (#3389)。描き直す時に渡す */
  let open: number[] = [...(options.open ?? [])];
  /** 置く所の中身の幅。枠を置く前に配管の図を描く幅にする。測れない時は 0 */
  const hostWidth = (): number => {
    const style = win?.getComputedStyle(host);
    const padding = style ? (Number.parseFloat(style.paddingLeft) || 0) + (Number.parseFloat(style.paddingRight) || 0) : 0;
    return Math.max(0, (host.clientWidth || 0) - padding);
  };
  /** 配管の図を描いた時の枠の幅 (#3418)。0 は幅を渡さずに描いた図 */
  let drawnWidth = 0;
  /** 配管の図を枠の幅 `w` で描く設定。開いた `[fold]` の呼び出しと、測れた時は枠の幅を渡す。並べ方は狭い枠で字を大きくする (#3418) */
  const pipeOptions = (w: number): RenderOptions => {
    drawnWidth = w;
    return { ...options, open, ...(w > 0 ? { width: w } : {}) };
  };
  // 描けない図は頁に何も置く前に断る
  let rendered = renderDiagram(source, isPipeSource(source) ? pipeOptions(hostWidth()) : options);
  const lang = options.lang ?? DEFAULT_LANG;
  const words = FIGURE_TEXT[lang];
  const palette = paletteOf({ ...options, palette: rendered.palette }, rendered.theme);
  let { timeline } = rendered;
  let steps = rendered.diagram.steps;
  let count = steps.length;
  /** 配管の図か。描き直しても種類は変わらない */
  const isPipe = rendered.diagram.kind === "pipe";

  ensureCss(doc);
  const root = doc.createElement("div");
  root.className = "dg-player";
  root.dataset.dragon = "player";
  root.setAttribute("style", `${FONT_VARS};${paletteVars(palette, rendered.theme)}`);
  if (palette.corner === "cut") root.dataset.corner = "cut";
  if (session) root.dataset.try = "";
  if (isPipe) root.dataset.pipe = "";

  const frame = doc.createElement("div");
  frame.className = "dg-frame";
  /** 図の枠の中身の幅。枠を測れない時は置く所の中身の幅。どちらも測れない時は 0 */
  const measuredWidth = (): number => frame.clientWidth || hostWidth();
  const button = (name: string, label: string, text: string): HTMLButtonElement => {
    const b = doc.createElement("button");
    b.type = "button";
    b.className = "dg-btn";
    b.dataset.dragon = name;
    b.setAttribute("aria-label", label);
    b.textContent = text;
    return b;
  };
  const restartButton = button("restart", words.restart, BUTTON_TEXT.restart);
  const prevButton = button("prev", words.prev, BUTTON_TEXT.prev);
  const toggleButton = button("toggle", words.pause, `${BUTTON_TEXT.pause} ${words.pause}`);
  const nextButton = button("next", words.next, BUTTON_TEXT.next);
  const buttons = doc.createElement("div");
  buttons.className = "dg-btns";
  // 置いた頁の言葉と違っても、釦の名前を名前の言葉の声で読ませる
  buttons.setAttribute("lang", lang);
  buttons.append(restartButton, prevButton, toggleButton, nextButton);
  // 段ごとに分けた進み具合の帯 (#3398)。済んだ段、今の段、まだの段を分けて塗り、押すとその段へ移る。
  // 段は前と次の釦でも送れるので、帯は読み上げから隠す
  const progress = doc.createElement("div");
  progress.className = "dg-segs";
  progress.dataset.dragon = "progress";
  progress.setAttribute("aria-hidden", "true");
  const fillProgress = (): void => {
    progress.replaceChildren(
      ...steps.map((_, i) => {
        const segment = doc.createElement("span");
        segment.className = "dg-seg";
        segment.dataset.dragon = "segment";
        segment.dataset.step = String(i);
        return segment;
      }),
    );
  };
  fillProgress();

  // 見える語り。読み上げには下の一覧を読ませるので、こちらは読み上げから隠す
  const say = doc.createElement("div");
  say.className = "dg-say";
  say.setAttribute("aria-hidden", "true");
  const no = doc.createElement("div");
  no.className = "dg-no";
  no.dataset.dragon = "step-no";
  const text = doc.createElement("div");
  text.className = "dg-txt";
  const title = doc.createElement("p");
  title.className = "dg-tt";
  title.dataset.dragon = "step-title";
  const body = doc.createElement("p");
  body.className = "dg-tb";
  body.dataset.dragon = "step-body";
  const live = doc.createElement("div");
  live.append(title, body);
  text.append(live);
  // 全部の段の題と本文の写しを今の段と同じ升に重ね、段を送っても図の枠が伸び縮みしない (#3049)
  drawRooms(doc, text, steps);
  say.append(no, text);
  // 見える語りの 1 つずつも読み上げから隠す
  for (const shown of [no, title, body]) shown.setAttribute("aria-hidden", "true");
  // 配管の図の拡大と縮小の釦と、今の拡大の度合いの札 (#3418)
  const zoomOutButton = button("zoom-out", words.zoomOut, ZOOM_TEXT.out);
  const zoomInButton = button("zoom-in", words.zoomIn, ZOOM_TEXT.in);
  const zoomLevel = doc.createElement("span");
  zoomLevel.className = "dg-zl";
  zoomLevel.dataset.dragon = "zoom-level";
  const zoomTools = doc.createElement("div");
  zoomTools.className = "dg-zm";
  zoomTools.setAttribute("lang", lang);
  zoomTools.append(zoomOutButton, zoomLevel, zoomInButton);
  const row = doc.createElement("div");
  row.className = "dg-ctl";
  row.append(buttons, progress, ...(isPipe ? [zoomTools] : []));
  // 帯の幅で並べ方を替えるため、帯 (幅を測る入れ物) の中に並べる箱を 1 つ置く
  const lay = doc.createElement("div");
  lay.className = "dg-lay";
  lay.append(say, row);
  const bar = doc.createElement("div");
  bar.className = "dg-bar";
  bar.append(lay);
  // 横に送る図の下の細い線。全体のどこを見ているかを示し、図が枠に収まる時は置かない (#3398)
  const overview = doc.createElement("div");
  overview.className = "dg-ov";
  overview.dataset.dragon = "overview";
  overview.setAttribute("aria-hidden", "true");
  const thumb = doc.createElement("i");
  thumb.className = "dg-ov-t";
  thumb.dataset.dragon = "overview-thumb";
  overview.append(thumb);

  // 読み上げの道具が段の順に読む一覧。見た目からは外すが、読み上げからは隠さない。
  // 段の出典は本文の後ろに、名前を URL への link にして書いた順に並べる (#3199)
  const list = doc.createElement("ol");
  list.className = "dg-sr";
  list.dataset.dragon = "steps";
  list.setAttribute("aria-label", words.steps(rendered.diagram.title));
  const fillList = (): void => {
    list.replaceChildren();
    for (const step of steps) {
      const item = drawStepItem(doc, step);
      drawSources(doc, item, step.sources);
      list.append(item);
    }
  };
  fillList();

  // 試す図は、図の枠、段の説明とゲージの帯、入力の帯の順に置く。段の説明は押した後に図で何が変わったかを書くため、
  // 入力の帯を挟まずに図のすぐ下へ置く (#3437)。足した段は `add` が今の原本に足して描き直す。
  // 試す図を描けたので、試す図の塊は届いている
  const controls = session
    ? kindParts("try", lang).mountTryControls(
        doc,
        rendered.diagram,
        rendered.layout as TryLayout,
        lang,
        (added) => add(added),
      )
    : undefined;
  // 配管の図の段の矢印と呼び出しの結果は帯の下に置き、段を送る釦を図のすぐ下に保つ (#3418、#3450)。配管の図を描けたので、配管の図の塊は届いている
  const calls: PipeCalls | undefined = isPipe ? kindParts("pipe", lang).mountPipeCalls(doc, lang) : undefined;
  root.append(frame, bar, ...(controls ? [controls.tools] : []), ...(calls ? [calls.element] : []), list);
  host.append(root);

  const frameWidth = (): number => frame.clientWidth || host.clientWidth || rendered.layout.width;
  /**
   * 列の図は枠の幅で箱の並べ方を変える (#3351)。横に並べると箱の名前が読めない幅では縦に組んだ図を描き直す。
   * 試す図も同じ幅で縦に組み、縦に組んだ形は枠の幅で描くので、幅が変わった時も描き直す (#3366)。
   * 配管の図は描いた時と枠の幅が変わった時に、測った枠の幅で描き直す (#3418)。
   * 描き直した時だけ真を返す。段と時刻の表は原本だけで決まるので、描き直しても変わらない
   */
  const arrange = (w: number): boolean => {
    const kind = rendered.diagram.kind;
    if (kind === "pipe") {
      const measured = measuredWidth();
      if (measured === 0 || measured === drawnWidth) return false;
      rendered = renderDiagram(source, pipeOptions(measured));
      return true;
    }
    if (kind !== "lineup" && kind !== "try") return false;
    const next = renderDiagram(source, { ...options, open, width: w });
    const before = rendered.layout as { arrangement?: string; width: number };
    const after = next.layout as { arrangement?: string; width: number };
    if (before.arrangement === after.arrangement && (kind !== "try" || before.width === after.width)) return false;
    rendered = next;
    controls?.update(next.layout as TryLayout);
    return true;
  };
  arrange(frameWidth());
  /** 高さに収めると頼まれた時だけ、図の枠の中で見える高さ (上下の余白を除く)。測れない時は `undefined` で、幅だけで決める */
  const frameHeight = (): number | undefined => {
    if (!options.fitHeight || !win) return undefined;
    const style = win.getComputedStyle(frame);
    const inner =
      frame.clientHeight -
      (Number.parseFloat(style.paddingTop) || 0) -
      (Number.parseFloat(style.paddingBottom) || 0);
    return inner > 0 ? inner : undefined;
  };
  /**
   * 見せ方を選ぶ。配管の図は寄って追わず、図を縮めずに置き、枠より広い時は枠の中を横に送る (#3398)。
   * 書き出した絵だけは全体を 1 枚に縮めて写す
   */
  const viewOf = (w: number, h: number | undefined): ViewMode => (rendered.diagram.kind === "pipe" ? "fixed" : chooseView(rendered, w, h).mode);
  let mode = viewOf(frameWidth(), frameHeight());
  let width = frameWidth();
  let height = frameHeight();
  let svg: SVGSVGElement | null = null;
  // 止めて置く段を渡された図は、動きを嫌う人と同じく止め絵で置く。試す図は読み手が押すまで流さない
  let step =
    options.pausedAt === undefined ? 0 : Math.min(count - 1, Math.max(0, options.pausedAt));
  let playing = !reduce && options.pausedAt === undefined && !session;
  let at = playing ? 0 : (timeline.stills[step] ?? 0);
  /** 1 度だけ流すか。試す図は足した段を流した後に最初の段へ戻らない */
  const once = options.playOnce === true || session !== undefined;
  /** 1 度だけ流す図が止まる時刻 (最後の段の止め絵) */
  let lastStill = timeline.stills[count - 1] ?? 0;
  let born = Date.now();
  let marked: readonly Rect[] = [];

  /**
   * 渡された四角を点線で囲む。寄って追う図では窓の中身と一緒に動く所に置き、止めて見せる図では図の上に置く。
   * 囲みは字の四角より `LOOK.mark.pad` だけ広げ、字の縁に線が掛からないようにする
   */
  const drawMarks = (): void => {
    if (!svg) return;
    for (const old of svg.querySelectorAll(".dg-spots")) old.remove();
    if (marked.length === 0) return;
    const M = LOOK.mark;
    const group = doc.createElementNS(SVG_NS, "g");
    group.setAttribute("class", "dg-spots");
    for (const r of marked) {
      const rect = doc.createElementNS(SVG_NS, "rect");
      rect.setAttribute("class", "dg-spot");
      rect.setAttribute("x", String(r.x - M.pad));
      rect.setAttribute("y", String(r.y - M.pad));
      rect.setAttribute("width", String(r.w + M.pad * 2));
      rect.setAttribute("height", String(r.h + M.pad * 2));
      rect.setAttribute("rx", String(partRadius(palette.corner, M.radius)));
      group.append(rect);
    }
    (svg.querySelector('g[clip-path^="url(#dg-vp-"] > g.dg-a') ?? svg).append(group);
  };

  /** 配管の図の拡大の度合い (#3418)。1 が拡大していない図 */
  let zoom = 1;
  /**
   * 槽の残高の字が画面で `PIPE_LOOK.narrow.px` 以上に見える、配管の図の最も細い幅 (px) (#3450)。
   * 狭い枠で組み直しても字の倍率が届かない図 (箱を開いた広い図) は、これより細く置くと字が読めない。
   * 残高の字を持たない図は 0 を返し、幅を縛らない
   */
  const readableWidth = (): number => {
    const heights = ((rendered.layout as PipeLayout).levels ?? []).map((level) => level.text.h).filter((h) => h > 0);
    return heights.length > 0 ? (rendered.layout.width * PIPE_LOOK.narrow.px) / Math.min(...heights) : 0;
  };
  /**
   * 拡大していない配管の図の幅 (px)。枠の幅が `ZOOM.fit` より狭い時は図を枠の幅に収める (#3418)。
   * ただし収めると残高の字が読めない図は、字が読める幅で置いて横に送る (#3450)。
   * 広い時は枠より広い図も縮めずに置く (#3398)。どちらも図を元の大きさより大きく描かない (#3305)
   */
  const baseWidth = (): number => {
    const w = frameWidth();
    return w < ZOOM.fit ? Math.min(rendered.layout.width, Math.max(w, readableWidth())) : rendered.layout.width;
  };
  /** 置いた図の幅 (px)。配管の図は拡大の度合いを掛ける */
  const shownWidth = (): number => (isPipe ? baseWidth() * zoom : rendered.layout.width);
  /** 図の座標を、置いた図の px にする倍率 */
  const scale = (): number => shownWidth() / rendered.layout.width;
  /** 横に送るか (#3398)。置いた配管の図が枠より広い時だけ、縮めずに枠の中を横に送る。拡大して枠より広くなった図も送る (#3418) */
  const pans = (): boolean => isPipe && shownWidth() > frameWidth() + 0.5;
  /** 全体の線を、枠が図のどこを見ているかに合わせる */
  const follow = (): void => {
    const total = shownWidth();
    thumb.style.left = `${(frame.scrollLeft / total) * 100}%`;
    thumb.style.width = `${(Math.min(frameWidth(), total) / total) * 100}%`;
  };
  /** 一続きの範囲 `[x, x + size)` を、幅 `view` の窓に入れる送り位置。入らない時は真ん中を窓の真ん中に置く。`total` は送れる全体の長さ */
  const reach = (x: number, size: number, view: number, total: number): number => {
    const middle = x + size / 2 - view / 2;
    const fits = size <= view ? Math.min(Math.max(middle, x + size - view), x) : middle;
    return Math.round(Math.min(Math.max(0, fits), Math.max(0, total - view)));
  };
  /**
   * 今の段に関わる関係者の所へ送る。関わる関係者が枠に収まる時は全員を枠に入れ、収まらない時は真ん中を枠の真ん中に置く。
   * 拡大して縦にも送る図は、縦も同じく送る (#3418)。流している時は滑らかに送り、動きを嫌う設定と止めて送る時は一度に送る
   */
  const panTo = (): void => {
    if (frame.dataset.dragon !== "pan") return;
    const k = scale();
    const focus = (rendered.layout as { focus?: (Rect & { step: number })[] }).focus?.find((f) => f.step === step);
    if (focus) {
      const left = reach(focus.x * k, focus.w * k, frameWidth(), shownWidth());
      const tall = zoom > ZOOM.min && frame.clientHeight > 0;
      const top = tall ? reach(focus.y * k, focus.h * k, frame.clientHeight, frame.scrollHeight) : frame.scrollTop;
      if (playing && !reduce && typeof frame.scrollTo === "function") frame.scrollTo({ left, top, behavior: "smooth" });
      else {
        frame.scrollLeft = left;
        frame.scrollTop = top;
      }
    }
    follow();
  };
  /** 拡大の度合いの札と、拡大と縮小の釦を押せるかを今の度合いに合わせる */
  const showZoom = (): void => {
    zoomLevel.textContent = `${Math.round(zoom * 100)}%`;
    zoomOutButton.disabled = zoom <= ZOOM.min;
    zoomInButton.disabled = zoom >= ZOOM.max;
  };
  /**
   * 置いた図を、枠の幅に合わせて横に送る形か縮めて収める形にする。
   * 配管の図は拡大の度合いを掛けた幅で置き、図が枠より広い間は横に送る枠 (`pan`)、収まる間は拡大する枠 (`zoom-frame`) と名乗る (#3418)。
   * 拡大した図は枠の高さを拡大していない図の高さに保ち、枠の中を縦にも送る。置いた頁が枠の高さを決める時は頁の高さに任せる
   */
  const settle = (): void => {
    if (!svg) return;
    if (isPipe) {
      const wide = pans();
      frame.dataset.dragon = wide ? "pan" : "zoom-frame";
      svg.style.width = px(shownWidth());
      if (zoom > ZOOM.min && !options.fitHeight) frame.style.height = px((baseWidth() * rendered.layout.height) / rendered.layout.width);
      else frame.style.removeProperty("height");
      if (zoom > ZOOM.min) frame.dataset.zoomed = "";
      else delete frame.dataset.zoomed;
      if (!wide) overview.remove();
      else if (!overview.isConnected) frame.after(overview);
      showZoom();
      return;
    }
    delete frame.dataset.dragon;
    svg.style.removeProperty("width");
    overview.remove();
  };
  /**
   * 配管の図を度合い `target` に拡大する (#3418)。度合いは `ZOOM.min` から `ZOOM.max` に収める。
   * `at` (画面の座標) を渡すと、その点に在る図の所を同じ点に残し、渡さなければ枠の真ん中を残す
   */
  const zoomTo = (target: number, at?: { x: number; y: number }): void => {
    if (!isPipe || !svg) return;
    const next = Math.min(ZOOM.max, Math.max(ZOOM.min, target));
    const ratio = next / zoom;
    if (ratio === 1) return;
    const box = frame.getBoundingClientRect();
    const ax = at ? at.x - box.left : frame.clientWidth / 2;
    const ay = at ? at.y - box.top : frame.clientHeight / 2;
    // 枠より狭い図は真ん中に置くので、図の左の端と枠の左の端の間を除いて図の中の点を求める
    const inset = (): number => Math.max(0, (frame.clientWidth - shownWidth()) / 2);
    const x = frame.scrollLeft + ax - inset();
    const y = frame.scrollTop + ay;
    zoom = next;
    settle();
    frame.scrollLeft = Math.max(0, inset() + x * ratio - ax);
    frame.scrollTop = Math.max(0, y * ratio - ay);
    follow();
  };

  /**
   * 図の中の全ての動きの時刻を 0 へ戻し、動きの時計を最初から数え直させる。
   * 動きの遅れは `--at` から引くので、時刻が 0 の動きは `--at` 秒の所を描く。
   * 前に流れた時間を残したまま `--at` だけを替えると、残った時間の分だけ別の段の絵になる (#3445)。
   * 動きを持たない環境 (`getAnimations` の無い jsdom など) では何もしない
   */
  const rewind = (figure: SVGSVGElement): void => {
    if (typeof figure.getAnimations !== "function") return;
    for (const animation of figure.getAnimations({ subtree: true })) animation.currentTime = 0;
  };

  /**
   * 動きの変数を付けた図を置き、動きの時計を最初から数え直す。
   * `markup` を渡した時は描き直した新しい図に替え、渡さない時は今の図をそのまま使う。
   * 段を送るたびに図を写して置き直すと、大きな図では写す手間が段の送りの大半を占める (#3445)
   */
  const place = (markup?: string): void => {
    let next: SVGSVGElement | null;
    if (markup !== undefined) {
      const holder = doc.createElement("div");
      holder.innerHTML = markup;
      next = holder.querySelector("svg");
    } else {
      next = svg;
    }
    if (!next) return;
    // 図を替えた時だけ、図の中を全てたどる読み上げの属性と点線の四角を付け直す。同じ図ではどちらも変わらない (#3445)
    const fresh = next !== svg;
    if (fresh) {
      // 箱の飛び先 (#3199) の link を持つ図を隠すと、Tab で押せる link が読み上げから消える。
      // その図は名前を残した group として読ませ、link の無い図は段の一覧に読ませて図を隠す (#3329)
      if (next.querySelector("a[href]")) {
        next.removeAttribute("aria-hidden");
        next.setAttribute("role", "group");
      } else {
        next.setAttribute("aria-hidden", "true");
        next.removeAttribute("role");
        next.removeAttribute("aria-label");
      }
    }
    next.style.setProperty("--at", String(at));
    next.style.setProperty("--play", playing ? "running" : "paused");
    next.dataset.motion = playing ? "play" : "still";
    if (svg && fresh) svg.replaceWith(next);
    else if (!svg) frame.append(next);
    svg = next;
    rewind(next);
    born = Date.now();
    if (fresh) drawMarks();
    controls?.fit(frame, next);
    controls?.mark(next, step);
    settle();
    panTo();
  };
  const markup = (): string =>
    mode === "follow"
      ? drawSvg(rendered.diagram, rendered.layout, timeline, palette, rendered.theme, {
          width,
          ...(height === undefined ? {} : { height }),
          lang,
        })
      : rendered.svg;

  const now = (): number => (playing ? (at + (Date.now() - born) / 1000) % timeline.total : at);
  const stepAt = (t: number): number => {
    let found = 0;
    timeline.steps.forEach((span: Span, i) => {
      if (span.start <= t) found = i;
    });
    return found;
  };
  const show = (): void => {
    const current = steps[step];
    no.textContent = stepNo(step, count);
    title.textContent = current?.title ?? "";
    body.textContent = current?.body ?? "";
    toggleButton.setAttribute("aria-label", playing ? words.pause : words.play);
    toggleButton.textContent = playing ? `${BUTTON_TEXT.pause} ${words.pause}` : `${BUTTON_TEXT.play} ${words.play}`;
    for (const segment of progress.children) {
      const i = Number((segment as HTMLElement).dataset.step);
      (segment as HTMLElement).dataset.state = i < step ? "done" : i === step ? "now" : "todo";
    }
    panTo();
    if (svg) controls?.mark(svg, step);
    calls?.show(rendered.diagram, step);
    options.onStep?.(step);
  };
  const restart = (t: number, play: boolean): void => {
    at = t;
    playing = play;
    place();
    show();
  };
  const go = (target: number): void => {
    step = Math.min(count - 1, Math.max(0, target));
    const span = timeline.steps[step] as Span;
    restart(playing ? span.start : (timeline.stills[step] ?? span.start), playing);
  };

  /** 流し始める。1 度だけ流す図が最後の段の止め絵まで来ていれば、最初の段から流し直す */
  const resume = (): void => {
    if (once && at >= lastStill) {
      step = 0;
      at = 0;
    }
    restart(at, true);
  };

  /**
   * 試す図の今の原本の最後に段 `added` を足して描き直し、足した段へ移る。
   * 動きを嫌う設定では足した段の止め絵で止め、そうでなければ足した段を流して、その段の止め絵で止める。
   * 描けない原本になる時は段を足さずに訳を出し、偽を返す
   */
  const add = (added: Step): boolean => {
    if (!session || !controls) return false;
    const next = keepParsed(session, { ...session, steps: [...session.steps, added] });
    let drawn: Rendered;
    try {
      // 足した後も今の枠の幅で並べる。狭い枠で縦に組んだ形のまま描き直す (#3366)
      drawn = renderDiagram(next, { ...options, width: frameWidth() });
    } catch (error) {
      controls.refuse(error instanceof Error ? error.message : String(error));
      return false;
    }
    session = next;
    source = next;
    rendered = drawn;
    timeline = drawn.timeline;
    steps = drawn.diagram.steps;
    count = steps.length;
    lastStill = timeline.stills[count - 1] ?? 0;
    for (const room of text.querySelectorAll(".dg-room")) room.remove();
    drawRooms(doc, text, steps);
    fillList();
    fillProgress();
    width = frameWidth();
    height = frameHeight();
    mode = viewOf(width, height);
    controls.update(drawn.layout as TryLayout);
    controls.arrange(mode, width);
    step = count - 1;
    const span = timeline.steps[step] as Span;
    playing = !reduce;
    at = playing ? span.start : (timeline.stills[step] ?? span.start);
    place(markup());
    show();
    return true;
  };

  /**
   * 配管の図の畳んだ箱を押した時に、その `[fold]` の呼び出し `call` の内側の段を開いて描き直す (#3389)。
   * 段が増えるので段の一覧と語りを作り直し、開いた最初の内側の段の止め絵で止める
   */
  const unfold = (call: number): void => {
    if (!Number.isInteger(call) || open.includes(call)) return;
    const folded = (rendered.diagram.pipe?.folds ?? []).find((f) => f.call === call);
    open = [...open, call];
    rendered = renderDiagram(source, pipeOptions(measuredWidth()));
    timeline = rendered.timeline;
    steps = rendered.diagram.steps;
    count = steps.length;
    lastStill = timeline.stills[count - 1] ?? 0;
    for (const room of text.querySelectorAll(".dg-room")) room.remove();
    drawRooms(doc, text, steps);
    fillList();
    fillProgress();
    width = frameWidth();
    height = frameHeight();
    mode = viewOf(width, height);
    step = Math.min(count - 1, folded?.step ?? step);
    playing = false;
    at = timeline.stills[step] ?? 0;
    place(markup());
    show();
  };

  controls?.arrange(mode, width);
  place(markup());
  show();
  if (controls) frame.append(controls.layer);

  const timer = win?.setInterval(() => {
    if (!playing) return;
    // 1 度だけ流す図は、1 周の中の時刻に直す前の経った時間で最後の段の止め絵まで来たかを見る
    if (once && at + (Date.now() - born) / 1000 >= lastStill) {
      step = count - 1;
      restart(lastStill, false);
      return;
    }
    const s = stepAt(now());
    if (s !== step) {
      step = s;
      show();
    }
  }, 120);
  const onPrev = (): void => go(step - 1);
  const onNext = (): void => go(step + 1);
  const onToggle = (): void => (playing ? restart(now(), false) : resume());
  /** 最初の段へ戻る。流していれば最初の段から流し直し、止めていれば最初の段の止め絵で止める (#3398) */
  const onRestart = (): void => {
    step = 0;
    restart(playing ? 0 : (timeline.stills[0] ?? 0), playing);
  };
  const onProgress = (event: Event): void => {
    const s = Number((event.target as HTMLElement | null)?.closest?.<HTMLElement>("[data-dragon=\"segment\"]")?.dataset.step);
    if (Number.isInteger(s)) go(s);
  };
  // 手で横に送った時も、全体の線を見ている所に付ける
  const onPan = (): void => follow();
  // 段の番号を押すとその段へ移る。試す図のブロックの中のチップを押すと、書き換える欄を出す
  const onFigure = (event: Event): void => {
    const chip = controls ? (event.target as Element | null)?.closest?.("[data-chip]") : null;
    if (chip) {
      controls?.pick(chip.getAttribute("data-chip") ?? "", step);
      return;
    }
    const fold = (event.target as Element | null)?.closest?.("[data-pipe-fold]");
    if (fold) {
      unfold(Number(fold.getAttribute("data-pipe-fold")));
      return;
    }
    const target = (event.target as Element | null)?.closest?.("[data-step]");
    const s = target ? Number(target.getAttribute("data-step")) : Number.NaN;
    if (Number.isInteger(s)) go(s);
  };
  // 配管の図の拡大 (#3418)。釦は 1 回で `ZOOM.step` 倍、Ctrl か Command を押しながらのホイールは指した所を中心に拡大する。
  // 押さないホイールは今どおり枠か頁を送る
  const onZoomIn = (): void => zoomTo(zoom * ZOOM.step);
  const onZoomOut = (): void => zoomTo(zoom / ZOOM.step);
  const onWheel = (event: WheelEvent): void => {
    if (!isPipe || !(event.ctrlKey || event.metaKey)) return;
    event.preventDefault();
    // 行と頁の単位で送るホイールは、px に直してから度合いにする
    const unit = event.deltaMode === 1 ? TYPE.stepBody.size : event.deltaMode === 2 ? frame.clientHeight : 1;
    zoomTo(zoom * Math.exp(-event.deltaY * unit * ZOOM.wheel), { x: event.clientX, y: event.clientY });
  };
  // ダブルクリックは押した所を中心に `ZOOM.double` 倍にし、`ZOOM.reset` まで拡大した図は 100% に戻す
  const onDouble = (event: MouseEvent): void => {
    if (!isPipe) return;
    event.preventDefault();
    zoomTo(zoom >= ZOOM.reset ? ZOOM.min : zoom * ZOOM.double, { x: event.clientX, y: event.clientY });
  };
  /** 引いている指。`ZOOM.drag` より動いた後は枠を送り、離した後の押下を図に渡さない */
  let drag: { id: number; x: number; y: number; left: number; top: number; moved: boolean } | undefined;
  let dragged = false;
  // マウスとペンで引くと枠を送る。指は枠をそのまま送れるので受けない
  const onPointerDown = (event: PointerEvent): void => {
    if (!isPipe || event.button !== 0 || event.pointerType === "touch") return;
    dragged = false;
    drag = { id: event.pointerId, x: event.clientX, y: event.clientY, left: frame.scrollLeft, top: frame.scrollTop, moved: false };
  };
  const onPointerMove = (event: PointerEvent): void => {
    if (!drag || event.pointerId !== drag.id) return;
    const dx = event.clientX - drag.x;
    const dy = event.clientY - drag.y;
    if (!drag.moved) {
      if (Math.hypot(dx, dy) < ZOOM.drag) return;
      drag.moved = true;
      frame.dataset.drag = "";
      // 動き始めてから捕まえる。押しただけの時に捕まえると、押した先が枠に替わって段の番号と畳んだ箱を押せない
      try {
        frame.setPointerCapture(drag.id);
      } catch {
        // 捕まえられない指でも、枠の上で動く間は送れる
      }
    }
    frame.scrollLeft = Math.max(0, drag.left - dx);
    frame.scrollTop = Math.max(0, drag.top - dy);
    follow();
  };
  const onPointerUp = (event: PointerEvent): void => {
    if (!drag || event.pointerId !== drag.id) return;
    dragged = drag.moved;
    drag = undefined;
    delete frame.dataset.drag;
  };
  // 引いて送った後の押下は、段の番号や畳んだ箱を押したことにしない
  const onDragClick = (event: Event): void => {
    if (!dragged) return;
    dragged = false;
    event.preventDefault();
    event.stopImmediatePropagation();
  };
  prevButton.addEventListener("click", onPrev);
  nextButton.addEventListener("click", onNext);
  toggleButton.addEventListener("click", onToggle);
  restartButton.addEventListener("click", onRestart);
  progress.addEventListener("click", onProgress);
  frame.addEventListener("click", onFigure);
  frame.addEventListener("scroll", onPan);
  if (isPipe) {
    zoomInButton.addEventListener("click", onZoomIn);
    zoomOutButton.addEventListener("click", onZoomOut);
    // ホイールの既定の動き (頁の拡大) を止めるので、受け身でない受け方で受ける
    frame.addEventListener("wheel", onWheel, { passive: false });
    frame.addEventListener("dblclick", onDouble);
    frame.addEventListener("pointerdown", onPointerDown);
    frame.addEventListener("pointermove", onPointerMove);
    frame.addEventListener("pointerup", onPointerUp);
    frame.addEventListener("pointercancel", onPointerUp);
    frame.addEventListener("click", onDragClick, true);
  }

  // 枠の大きさが変わったら見せ方を選び直す。寄って追う窓は幅 (高さに収める時は高さも) で決まるので、変われば描き直す
  const Observer = (win as (Window & { ResizeObserver?: typeof ResizeObserver }) | null)
    ?.ResizeObserver;
  const observer = Observer
    ? new Observer(() => {
        const w = frameWidth();
        const h = frameHeight();
        const rearranged = arrange(w);
        const chosen = viewOf(w, h);
        controls?.arrange(chosen, w);
        if (!rearranged && chosen === mode && (mode === "fixed" || (w === width && h === height))) {
          if (svg) controls?.fit(frame, svg);
          // 枠の幅が変わらない時は送り位置を残す。読み手が引いて動かした所と拡大した所を、高さの変わりで戻さない
          settle();
          follow();
          return;
        }
        const t = now();
        mode = chosen;
        width = w;
        height = h;
        at = t;
        place(markup());
      })
    : undefined;
  observer?.observe(frame);

  return {
    get step() {
      return step;
    },
    get playing() {
      return playing;
    },
    next: onNext,
    prev: onPrev,
    play: () => {
      if (!playing) resume();
    },
    pause: () => {
      if (playing) restart(now(), false);
    },
    goTo: (target: number) => {
      playing = false;
      go(target);
    },
    mark: (rects: readonly Rect[]) => {
      marked = rects;
      drawMarks();
    },
    get diagram() {
      // 読み手が足した段を含む今の原本は写しを返し、頁の側が書き換えても再生の部品の原本を変えない
      return session ? (JSON.parse(JSON.stringify(session)) as unknown) : diagram;
    },
    destroy: () => {
      if (timer !== undefined) win?.clearInterval(timer);
      observer?.disconnect();
      controls?.destroy();
      prevButton.removeEventListener("click", onPrev);
      nextButton.removeEventListener("click", onNext);
      toggleButton.removeEventListener("click", onToggle);
      restartButton.removeEventListener("click", onRestart);
      progress.removeEventListener("click", onProgress);
      frame.removeEventListener("click", onFigure);
      frame.removeEventListener("scroll", onPan);
      zoomInButton.removeEventListener("click", onZoomIn);
      zoomOutButton.removeEventListener("click", onZoomOut);
      frame.removeEventListener("wheel", onWheel);
      frame.removeEventListener("dblclick", onDouble);
      frame.removeEventListener("pointerdown", onPointerDown);
      frame.removeEventListener("pointermove", onPointerMove);
      frame.removeEventListener("pointerup", onPointerUp);
      frame.removeEventListener("pointercancel", onPointerUp);
      frame.removeEventListener("click", onDragClick, true);
      root.remove();
    },
  };
}
