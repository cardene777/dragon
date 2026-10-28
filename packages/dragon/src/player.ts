/**
 * 頁に図を置いて動かす。
 *
 * 動きを嫌う設定 (`prefers-reduced-motion: reduce`) は描く前に読み、その人には一瞬も自動再生せず、
 * 段ごとの止め絵を釦で送る。各段の題と本文は、読み上げの道具が段の順に読める番号付きの一覧として置き、
 * 図そのものは読み上げから隠して同じ中身を 2 度読ませない。
 * 見せ方は枠の幅で選び (`view.ts`)、寄って追う時は窓と全体図で描き直す。
 * 釦と段の一覧の読み上げの名前と全体図の札は、渡した言葉 (`options.lang`、書かなければ日本語) で出す (#3001)。
 * 段が替わるたびに `options.onStep` で今の段を知らせ、頁の側が段の札や進み具合を出せるようにする (#3031)。
 * 頁は `goTo` で段へ移って止め、`mark` で図の上に点線の四角を描く。頁の側では SVG を組まないので、編集画面が字の重なりを囲む時もこれを呼ぶ (#3178)。
 * 段の本文の帯は本文の最も長い段の高さに保ち、段を送っても図の大きさと位置を変えない (#3049)。
 * 帯の中身の幅が `LOOK.player.narrow` より狭い時は、段を送る釦を指で押せる大きさにして段の番号と上の段に並べ、
 * 題と本文をその下の段の全幅に置く (#3057、#3069)。
 */
import { FIGURE_TEXT } from "./figure-text";
import type { Rect } from "./layout/scene";
import { FONT_VARS, LOOK, paletteVars, resolvePalette, type TextStyle, TYPE } from "./look/values";
import { drawSvg, type RenderOptions, renderDiagram } from "./render/svg";
import type { Span } from "./timeline";
import { chooseView } from "./view";

export interface PlayerOptions extends RenderOptions {
  /** 段が替わるたびに今の段 (0 から) を受け取る。置いた時にも最初の段で 1 度呼ぶ。頁の側で段の札や進み具合を出す時に使う (#3031) */
  onStep?: (step: number) => void;
  /**
   * 図を、図の枠の中で見える高さに収める (#3047)。高さに収めると字が読めない図は寄って追う図にし、寄って追う窓と全体図をその高さに収める。
   * 枠の高さが決まっている置き場 (カタログの拡大の重ね窓) で使う。枠の高さが図に合わせて伸びる置き場で使うと、描くたびに低くなる
   */
  fitHeight?: boolean;
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
  destroy(): void;
}

const font = (t: TextStyle): string => `font:${t.weight} ${t.size}px var(--${t.family})`;
const px = (v: number): string => `${v}px`;

function playerCss(): string {
  const P = LOOK.player;
  const hidden = px(P.hidden);
  return [
    `.dg-player{display:flex;flex-direction:column;gap:${px(P.gap)};color:var(--ink)}`,
    `.dg-player .dg-frame{border-radius:${px(P.radius)};overflow:hidden}`,
    // 並べ方は帯の中身の幅で選ぶ。帯の中の 1 段 (`.dg-row`) が並べ替わり、帯の左右の余白は置いた頁が帯に付ける
    `.dg-bar{container:dg-bar/inline-size}`,
    `.dg-row{display:flex;align-items:flex-start;gap:${px(P.gap)}}`,
    `.dg-btns{display:flex;gap:${px(P.gap / 2)};flex:none}`,
    `.dg-btn{width:${px(P.button)};height:${px(P.button)};border-radius:${px(P.radius)};border:${px(LOOK.stroke.hair)} solid var(--hair);background:var(--surf);color:var(--ink);${font(TYPE.button)};cursor:pointer}`,
    `.dg-btn:focus-visible{outline:${px(P.focus)} solid var(--c-blue);outline-offset:${px(P.focus)}}`,
    `.dg-say{display:flex;gap:${px(P.gap)};min-width:0}`,
    `.dg-no{${font(TYPE.stepNo)};color:var(--mute);padding-top:${px(P.focus)}}`,
    `.dg-txt{display:grid;grid-template-columns:minmax(0,1fr);min-width:0}`,
    `.dg-txt>*{grid-area:1/1}`,
    `.dg-room{visibility:hidden}`,
    `.dg-tt{${font(TYPE.stepTitle)};margin:0}`,
    `.dg-tb{${font(TYPE.stepBody)};color:var(--ink2);margin:0;white-space:pre-line}`,
    `.dg-sr{position:absolute;width:${hidden};height:${hidden};margin:-${hidden};padding:0;overflow:hidden;clip:rect(0 0 0 0);clip-path:inset(50%);white-space:nowrap;border:0}`,
    // 狭い帯 (携帯の幅) では、段を送る釦を指で押せる大きさにし、その横に番号を置き、
    // 題を 2 段目、本文を 3 段目に置いてどちらも帯の全幅を使う (#3057、#3069)。
    // 釦を大きくすると横に題を置く幅が足りず題が細かく折れるため、題は釦の段に置かない。
    // 題と本文を包む箱を外して写しも同じ升に重ねるので、2 段目は最も高い題、3 段目は最も長い本文の高さになる。
    // 題と本文の間は広い帯と同じく空けず、釦の段の下にだけ間を取って、帯が高くなる分を抑える
    `@container dg-bar (width < ${px(P.narrow)}){` +
      `.dg-row{display:grid;grid-template-columns:auto minmax(0,1fr);align-items:start;gap:0 ${px(P.gap)}}` +
      `.dg-say,.dg-txt,.dg-txt>*{display:contents}` +
      `.dg-btns{grid-area:1/1;margin-bottom:${px(P.gap / 2)}}` +
      `.dg-btn{width:${px(P.touch)};height:${px(P.touch)}}` +
      `.dg-no{grid-area:1/2;display:flex;align-items:center;min-height:${px(P.touch)};padding-top:0}` +
      `.dg-tt{grid-area:2/1/3/3}` +
      `.dg-tb{grid-area:3/1/4/3}` +
      `}`,
    // 指で触る時は、広い帯でも段を送る釦を指で押せる大きさにする (#3076)。並びは横 1 列のまま変えない。
    // 広い帯は本文が 2 行あれば帯の高さが変わらず、本文の無い帯だけが釦の分だけ高くなる
    `@media (pointer: coarse){.dg-btn{width:${px(P.touch)};height:${px(P.touch)}}}`,
    `.dg-mark{fill:none;stroke:var(--t-amber);stroke-width:${px(LOOK.stroke.mark)};stroke-dasharray:${LOOK.mark.dash} ${LOOK.mark.gap};pointer-events:none}`,
  ].join("");
}

function ensureCss(doc: Document): void {
  if (doc.getElementById("dragon-player-css")) return;
  const style = doc.createElement("style");
  style.id = "dragon-player-css";
  style.textContent = playerCss();
  doc.head.appendChild(style);
}

/** 釦に出す字。HTML に書き出す時は、この字も字の file に残す。 */
export const BUTTON_TEXT = { prev: "‹", pause: "❚❚", play: "▶", next: "›" } as const;

/** 図の上に四角を描く時の SVG の名前空間 */
const SVG_NS = "http://www.w3.org/2000/svg";

const pad = (n: number): string => String(n).padStart(2, "0");
/** 段の番号の札 (`01/12`)。`step` は 0 から数える。 */
export const stepNo = (step: number, count: number): string => `${pad(step + 1)}/${pad(count)}`;

export function mountDiagram(host: HTMLElement, diagram: unknown, options: PlayerOptions = {}): Player {
  const doc = host.ownerDocument;
  const win = doc.defaultView;
  // 描く前に読む。描いた後に読むと、動きを嫌う人にも一瞬だけ流れてしまう
  const reduce = Boolean(win?.matchMedia?.("(prefers-reduced-motion: reduce)").matches);
  const rendered = renderDiagram(diagram, options);
  const lang = options.lang ?? "ja";
  const words = FIGURE_TEXT[lang];
  const palette = resolvePalette(rendered.palette);
  const { timeline } = rendered;
  const steps = rendered.diagram.steps;
  const count = steps.length;

  ensureCss(doc);
  const root = doc.createElement("div");
  root.className = "dg-player";
  root.dataset.dragon = "player";
  root.setAttribute("style", `${FONT_VARS};${paletteVars(palette, rendered.theme)}`);

  const frame = doc.createElement("div");
  frame.className = "dg-frame";
  const button = (name: string, label: string, text: string): HTMLButtonElement => {
    const b = doc.createElement("button");
    b.type = "button";
    b.className = "dg-btn";
    b.dataset.dragon = name;
    b.setAttribute("aria-label", label);
    b.textContent = text;
    return b;
  };
  const prevButton = button("prev", words.prev, BUTTON_TEXT.prev);
  const toggleButton = button("toggle", words.pause, BUTTON_TEXT.pause);
  const nextButton = button("next", words.next, BUTTON_TEXT.next);
  const buttons = doc.createElement("div");
  buttons.className = "dg-btns";
  // 置いた頁の言葉と違っても、釦の名前を名前の言葉の声で読ませる
  buttons.setAttribute("lang", lang);
  buttons.append(prevButton, toggleButton, nextButton);

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
  // 全部の段の題と本文の写しを今の段と同じ升に重ね、見た目からは隠して場所だけを取る。
  // 帯の高さが本文の最も長い段で決まり、段を送っても図の枠が伸び縮みしない (#3049)
  for (const step of steps) {
    const room = doc.createElement("div");
    room.className = "dg-room";
    room.dataset.dragon = "caption-room";
    const roomTitle = doc.createElement("p");
    roomTitle.className = "dg-tt";
    roomTitle.textContent = step.title;
    const roomBody = doc.createElement("p");
    roomBody.className = "dg-tb";
    roomBody.textContent = step.body;
    room.append(roomTitle, roomBody);
    text.append(room);
  }
  say.append(no, text);
  // 狭い帯では語りの箱を外して番号と題と本文を釦と同じ升の並びに置く (#3057)。
  // 箱を外した要素の読み上げからの隠し方に頼らず、見える語りの 1 つずつも読み上げから隠す
  for (const shown of [no, title, body]) shown.setAttribute("aria-hidden", "true");
  const row = doc.createElement("div");
  row.className = "dg-row";
  row.append(buttons, say);
  const bar = doc.createElement("div");
  bar.className = "dg-bar";
  bar.append(row);

  // 読み上げの道具が段の順に読む一覧。見た目からは外すが、読み上げからは隠さない
  const list = doc.createElement("ol");
  list.className = "dg-sr";
  list.dataset.dragon = "steps";
  list.setAttribute("aria-label", words.steps(rendered.diagram.title));
  for (const step of steps) {
    const item = doc.createElement("li");
    const head = doc.createElement("strong");
    head.textContent = step.title;
    item.append(head);
    for (const line of step.body.split("\n")) {
      const p = doc.createElement("p");
      p.textContent = line;
      item.append(p);
    }
    list.append(item);
  }

  root.append(frame, bar, list);
  host.append(root);

  const frameWidth = (): number => frame.clientWidth || host.clientWidth || rendered.layout.width;
  /** 高さに収めると頼まれた時だけ、図の枠の中で見える高さ (上下の余白を除く)。測れない時は `undefined` で、幅だけで決める */
  const frameHeight = (): number | undefined => {
    if (!options.fitHeight || !win) return undefined;
    const style = win.getComputedStyle(frame);
    const inner = frame.clientHeight - (Number.parseFloat(style.paddingTop) || 0) - (Number.parseFloat(style.paddingBottom) || 0);
    return inner > 0 ? inner : undefined;
  };
  let mode = chooseView(rendered, frameWidth(), frameHeight()).mode;
  let width = frameWidth();
  let height = frameHeight();
  let svg: SVGSVGElement | null = null;
  let step = 0;
  let playing = !reduce;
  let at = reduce ? (timeline.stills[0] ?? 0) : 0;
  let born = Date.now();
  let marked: readonly Rect[] = [];

  /**
   * 渡された四角を点線で囲む。寄って追う図では窓の中身と一緒に動く所に置き、止めて見せる図では図の上に置く。
   * 囲みは字の四角より `LOOK.mark.pad` だけ広げ、字の縁に線が掛からないようにする
   */
  const drawMarks = (): void => {
    if (!svg) return;
    for (const old of svg.querySelectorAll(".dg-marks")) old.remove();
    if (marked.length === 0) return;
    const M = LOOK.mark;
    const group = doc.createElementNS(SVG_NS, "g");
    group.setAttribute("class", "dg-marks");
    for (const r of marked) {
      const rect = doc.createElementNS(SVG_NS, "rect");
      rect.setAttribute("class", "dg-mark");
      rect.setAttribute("x", String(r.x - M.pad));
      rect.setAttribute("y", String(r.y - M.pad));
      rect.setAttribute("width", String(r.w + M.pad * 2));
      rect.setAttribute("height", String(r.h + M.pad * 2));
      rect.setAttribute("rx", String(M.radius));
      group.append(rect);
    }
    (svg.querySelector('g[clip-path^="url(#dg-vp-"] > g.dg-a') ?? svg).append(group);
  };

  /** 動きの変数を付けた図を置き直す。置き直すと動きの時計が最初から数え直される */
  const place = (markup?: string): void => {
    let next: SVGSVGElement | null;
    if (markup !== undefined) {
      const holder = doc.createElement("div");
      holder.innerHTML = markup;
      next = holder.querySelector("svg");
    } else {
      next = svg ? (svg.cloneNode(true) as SVGSVGElement) : null;
    }
    if (!next) return;
    next.setAttribute("aria-hidden", "true");
    next.removeAttribute("role");
    next.removeAttribute("aria-label");
    next.style.setProperty("--at", String(at));
    next.style.setProperty("--play", playing ? "running" : "paused");
    next.dataset.motion = playing ? "play" : "still";
    if (svg) svg.replaceWith(next);
    else frame.append(next);
    svg = next;
    born = Date.now();
    drawMarks();
  };
  const markup = (): string => (mode === "follow" ? drawSvg(rendered.diagram, rendered.layout, timeline, palette, rendered.theme, { width, ...(height === undefined ? {} : { height }), lang }) : rendered.svg);

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
    toggleButton.textContent = playing ? BUTTON_TEXT.pause : BUTTON_TEXT.play;
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

  place(markup());
  show();

  const timer = win?.setInterval(() => {
    if (!playing) return;
    const s = stepAt(now());
    if (s !== step) {
      step = s;
      show();
    }
  }, 120);
  const onPrev = (): void => go(step - 1);
  const onNext = (): void => go(step + 1);
  const onToggle = (): void => (playing ? restart(now(), false) : restart(at, true));
  // 段の番号を押すとその段へ移る
  const onFigure = (event: Event): void => {
    const target = (event.target as Element | null)?.closest?.("[data-step]");
    const s = target ? Number(target.getAttribute("data-step")) : Number.NaN;
    if (Number.isInteger(s)) go(s);
  };
  prevButton.addEventListener("click", onPrev);
  nextButton.addEventListener("click", onNext);
  toggleButton.addEventListener("click", onToggle);
  frame.addEventListener("click", onFigure);

  // 枠の大きさが変わったら見せ方を選び直す。寄って追う窓は幅 (高さに収める時は高さも) で決まるので、変われば描き直す
  const Observer = (win as (Window & { ResizeObserver?: typeof ResizeObserver }) | null)?.ResizeObserver;
  const observer = Observer
    ? new Observer(() => {
        const w = frameWidth();
        const h = frameHeight();
        const chosen = chooseView(rendered, w, h).mode;
        if (chosen === mode && (mode === "fixed" || (w === width && h === height))) return;
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
      if (!playing) restart(at, true);
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
    destroy: () => {
      if (timer !== undefined) win?.clearInterval(timer);
      observer?.disconnect();
      prevButton.removeEventListener("click", onPrev);
      nextButton.removeEventListener("click", onNext);
      toggleButton.removeEventListener("click", onToggle);
      frame.removeEventListener("click", onFigure);
      root.remove();
    },
  };
}
