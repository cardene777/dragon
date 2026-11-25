/**
 * 場面を書いた図 (#3878) を頁に置いて動かす。
 *
 * 場面ごとに描いた図 (`renderDiagram` の `scenes`) を場面の枠に入れて上から並べ、図の下に段を送る帯を 1 つ置く。
 * 並べる見せ方 (`stack`) は、段を送ると全ての場面を同じ段へ同時に進める。段の数は最も長い場面の段の数で、
 * 最後の段に着いた場面はそこに留まり、`stop` を書いた場面は止まる段に着いた時から理由の文を出す。
 * 選ぶ見せ方 (`pick`) は、場面の名前の釦で選んだ 1 つの場面だけを見せ、釦を押すとその場面の 1 段目に戻って、段を送ると選んだ場面の段だけを進める。
 * 場面の図は再生の部品と同じく、1 周の秒 (`--T`) と動きの位置 (`--at`) と止めるか流すか (`--play`) の変数で動かし、
 * 最後の段の止め絵の時刻 (`--dg-last`) を持つ。印刷の形では、どちらの見せ方でも隠した場面も見せ、全ての場面を最後の段の止め絵で止めて縦に並べる。
 * 札で見せる図 (#3877) は場面の枠ごとに札の層を持ち、押した場面の箱のすぐ下に札を開いて、ほかの場面の札を閉じる。
 * 帯の釦と進み具合と段の番号と題と本文は、再生の部品 (`player.ts`) と同じ class と名前で置き、見た目も再生の部品の規則が描く。
 * この file は場面を書ける種類の描く部品の組だけが読み、最初に読む量に入れない
 */
import { type NoteCards, withNoteCards } from "./blocks/pop/cards-store";
import { drawStepItem } from "./blocks/step/draw";
import { FIGURE_TEXT } from "./figure-text";
import { FONT_VARS, LOOK, paletteVars, type TextStyle, TYPE } from "./look/values";
import { type Player, type PlayerOptions, stepNo } from "./player";
import { paletteOf, type Rendered, type RenderedScene } from "./render/draw";
import type { Step } from "./schema";
import { DEFAULT_LANG } from "./words";

const SC = LOOK.scene;
const P = LOOK.player;
const px = (v: number): string => `${v}px`;
const font = (t: TextStyle): string => `font:${t.weight} ${t.size}px var(--${t.family})`;
/** 流す時に、段の動きを描き終えてから次の段へ移るまで止め絵を見せる秒 */
const HOLD = 1.2;

/**
 * 場面の枠と釦の見た目。印刷の形では帯と釦を描かず、隠した場面も見せ、全ての場面の図を最後の段の止め絵で止め、止まる場面の理由の文を出す。
 * 理由の文は画面では `hidden` で隠すので、隠し方を上書きしないよう、画面の規則は表示の値を持たない
 */
function sceneCss(): string {
  return [
    `.dg-scenes{display:flex;flex-direction:column;gap:${px(SC.panelGap)}}`,
    `.dg-scene-picks{display:flex;flex-wrap:wrap;gap:${px(P.segmentGap)}}`,
    `.dg-scene-pick{padding:0 ${px(P.button / 2)}}`,
    '.dg-scene-pick[aria-pressed="true"]{background:var(--c-blue);border-color:var(--c-blue);color:var(--on-c)}',
    `.dg-scene-h{display:flex;align-items:baseline;flex-wrap:wrap;gap:${px(SC.captionGap)};margin:0 0 ${px(SC.stopGap)}}`,
    `.dg-scene-n{${font(TYPE.boxName)};color:var(--ink);margin:0}`,
    `.dg-scene-s{${font(TYPE.boxSub)};color:var(--mute);margin:0}`,
    '.dg-player[data-scenes="pick"] .dg-scene-h{display:none}',
    `.dg-scene-stop{${font(TYPE.noteBody)};color:var(--ink2);margin:${px(SC.stopGap)} 0 0}`,
    "@media print{" +
      ".dg-player[data-scenes] .dg-scene[hidden]{display:block}" +
      ".dg-player[data-scenes] .dg-scene svg{--at:var(--dg-last)!important;--play:paused!important}" +
      ".dg-player[data-scenes] .dg-scene-stop[data-final]{display:block}" +
      ".dg-player[data-scenes] .dg-scene-h{display:flex}" +
      ".dg-player[data-scenes] .dg-scene-s,.dg-player[data-scenes] .dg-scene-picks,.dg-player[data-scenes] .dg-bar{display:none}" +
      "}",
  ].join("");
}

/** 場面の枠と釦の見た目を入れる。口`styles`を渡された時は口で入れ、無い時は文書の頭へ入れる (#3695) */
function ensureSceneCss(doc: Document, styles: PlayerOptions["styles"]): void {
  if (styles) return styles.adopt("dragon-scenes-css", sceneCss());
  if (doc.getElementById("dragon-scenes-css")) return;
  const style = doc.createElement("style");
  style.id = "dragon-scenes-css";
  style.textContent = sceneCss();
  doc.head.appendChild(style);
}

/** 場面の枠 1 つ */
interface Panel {
  scene: RenderedScene;
  el: HTMLElement;
  frame: HTMLElement;
  svg: SVGSVGElement | null;
  caption: HTMLElement;
  reason: HTMLElement | undefined;
  /** 見せている段 (0 から) */
  step: number;
  notes?: NoteCards;
  /** 流している段の止め絵で止める予約 */
  timer?: ReturnType<typeof setTimeout>;
}

/** 場面を書いた図 `rendered` を `host` に置く。`diagram` は渡された原本で、`player.diagram` が返す */
export function mountScenes(host: HTMLElement, rendered: Rendered, diagram: unknown, options: PlayerOptions = {}): Player {
  const scenes = rendered.scenes ?? [];
  const show = rendered.sceneShow ?? "stack";
  const doc = host.ownerDocument;
  const win = doc.defaultView;
  const lang = options.lang ?? DEFAULT_LANG;
  const words = FIGURE_TEXT[lang];
  const reduce = Boolean(win?.matchMedia?.("(prefers-reduced-motion: reduce)").matches);
  let speed = options.speed ?? 1;
  ensureSceneCss(doc, options.styles);
  const palette = paletteOf({ ...options, palette: rendered.palette }, rendered.theme);

  const root = doc.createElement("div");
  root.className = "dg-player";
  root.dataset.dragon = "player";
  root.dataset.scenes = show;
  root.setAttribute("style", `${FONT_VARS};${paletteVars(palette, rendered.theme)}`);
  if (palette.corner === "cut") root.dataset.corner = "cut";

  const iconOf = (name: string): HTMLElement => {
    const i = doc.createElement("i");
    i.className = "dg-btn-ic";
    i.dataset.icon = name;
    i.setAttribute("aria-hidden", "true");
    return i;
  };
  const button = (name: string, label: string, icon: string): HTMLButtonElement => {
    const b = doc.createElement("button");
    b.type = "button";
    b.className = "dg-btn";
    b.dataset.dragon = name;
    b.setAttribute("aria-label", label);
    b.append(iconOf(icon));
    return b;
  };
  const text = (tag: string, cls: string, name: string, value = ""): HTMLElement => {
    const el = doc.createElement(tag);
    el.className = cls;
    el.dataset.dragon = name;
    el.textContent = value;
    return el;
  };

  // 選ぶ見せ方の釦。場面の名前をそのまま釦の字にする
  const picks = show === "pick" ? doc.createElement("div") : undefined;
  if (picks) {
    picks.className = "dg-scene-picks";
    picks.setAttribute("role", "group");
  }
  const pickButtons = scenes.map((scene, k) => {
    const b = doc.createElement("button");
    b.type = "button";
    b.className = "dg-btn dg-scene-pick";
    b.dataset.dragon = "scene-pick";
    b.dataset.scene = scene.name;
    b.dataset.index = String(k);
    b.textContent = scene.name;
    return b;
  });
  picks?.append(...pickButtons);

  // 帯。釦と進み具合は再生の部品と同じ class と名前で置く
  const restartButton = button("restart", words.restart, "restart");
  const prevButton = button("prev", words.prev, "prev");
  const toggleButton = button("toggle", words.pause, "pause");
  const nextButton = button("next", words.next, "next");
  const showToggle = (play: boolean): void => {
    const label = play ? words.pause : words.play;
    toggleButton.setAttribute("aria-label", label);
    toggleButton.replaceChildren(iconOf(play ? "pause" : "play"), doc.createTextNode(label));
  };
  const buttons = doc.createElement("div");
  buttons.className = "dg-btns";
  buttons.setAttribute("lang", lang);
  buttons.append(restartButton, prevButton, toggleButton, nextButton);
  const progress = doc.createElement("div");
  progress.className = "dg-segs";
  progress.dataset.dragon = "progress";
  progress.setAttribute("aria-hidden", "true");
  const no = text("div", "dg-no", "step-no");
  const title = text("p", "dg-tt", "step-title");
  const body = text("p", "dg-tb", "step-body");
  const live = doc.createElement("div");
  live.append(title, body);
  const txt = doc.createElement("div");
  txt.className = "dg-txt";
  txt.append(live);
  const say = doc.createElement("div");
  say.className = "dg-say";
  say.setAttribute("aria-hidden", "true");
  say.append(no, txt);
  const row = doc.createElement("div");
  row.className = "dg-ctl";
  row.append(buttons, progress);
  const lay = doc.createElement("div");
  lay.className = "dg-lay";
  lay.append(say, row);
  const bar = doc.createElement("div");
  bar.className = "dg-bar";
  bar.append(lay);
  const list = doc.createElement("ol");
  list.className = "dg-sr";
  list.dataset.dragon = "steps";
  list.setAttribute("aria-label", words.steps(rendered.diagram.title));

  // 場面の枠。場面の名前と今の段の題、図の枠、止まる場面の理由の文を持つ
  const column = doc.createElement("div");
  column.className = "dg-scenes";
  const panels: Panel[] = scenes.map((scene) => {
    const el = doc.createElement("div");
    el.className = "dg-scene";
    el.dataset.dragon = "scene";
    el.dataset.scene = scene.name;
    const head = doc.createElement("div");
    head.className = "dg-scene-h";
    const caption = text("p", "dg-scene-s", "scene-step");
    head.append(text("p", "dg-scene-n", "scene-name", scene.name), caption);
    const frame = doc.createElement("div");
    frame.className = "dg-frame";
    const holder = doc.createElement("div");
    holder.innerHTML = options.styles ? options.styles.markup(scene.svg) : scene.svg;
    const svg = holder.querySelector("svg");
    if (svg) {
      // 札で見せる図の印の付いた箱は押せる物なので、図を名前を残した組として読ませ、箱を Tab で選べるようにする (#3877)
      for (const box of svg.querySelectorAll("[data-note]")) {
        const name = scene.layout.noteCards?.find((note) => note.box === box.getAttribute("data-note"))?.name ?? "";
        box.setAttribute("role", "button");
        box.setAttribute("tabindex", "0");
        box.setAttribute("aria-label", words.openNote(name));
      }
      if (svg.querySelector("a[href],[data-note]")) svg.setAttribute("role", "group");
      else svg.setAttribute("aria-hidden", "true");
      frame.append(svg);
    }
    el.append(head, frame);
    const reason = scene.stop === undefined ? undefined : text("p", "dg-scene-stop", "scene-stop", scene.stop);
    if (reason) {
      reason.dataset.final = "";
      reason.hidden = true;
      el.append(reason);
    }
    return { scene, el, frame, svg, caption, reason, step: 0 };
  });
  column.append(...panels.map((p) => p.el));
  root.append(...(picks ? [picks] : []), column, bar, list);
  host.append(root);

  /** 選ぶ見せ方で選んだ場面 */
  let picked = 0;
  const lengthOf = (panel: Panel): number => panel.scene.diagram.steps.length;
  /** 段の数。並べる見せ方は最も長い場面、選ぶ見せ方は選んだ場面の段の数 */
  const countOf = (): number => (show === "pick" ? lengthOf(panels[picked] as Panel) : Math.max(1, ...panels.map(lengthOf)));
  /** 段を送る場面 */
  const moving = (): Panel[] => (show === "pick" ? [panels[picked] as Panel] : panels);
  let count = countOf();
  let step = Math.min(count - 1, Math.max(0, options.pausedAt ?? 0));
  let playing = !reduce && options.pausedAt === undefined && options.pausedAtStart !== true;
  let clock: ReturnType<typeof setTimeout> | undefined;

  /** 場面の枠の図の動きの変数。`at` は時刻の表の秒、`play` は流すか */
  const place = (panel: Panel, at: number, play: boolean): void => {
    const { svg } = panel;
    if (!svg) return;
    const t = panel.scene.timeline;
    svg.style.setProperty("--T", `${t.total / speed}s`);
    svg.style.setProperty("--at", String(at / speed));
    svg.style.setProperty("--play", play ? "running" : "paused");
    svg.style.setProperty("--dg-last", String((t.stills[t.steps.length - 1] ?? 0) / speed));
    svg.dataset.motion = play ? "play" : "still";
    // 時刻を替えた動きは時計を最初から数え直す。前に流れた時間が残ると別の段の絵になる (#3445)
    if (typeof svg.getAnimations === "function") for (const animation of svg.getAnimations({ subtree: true })) animation.currentTime = 0;
  };
  /** 場面の枠を、今の段の止め絵で止める */
  const still = (panel: Panel): void => {
    if (panel.timer !== undefined) clearTimeout(panel.timer);
    panel.timer = undefined;
    const t = panel.scene.timeline;
    const atStart = options.pausedAtStart === true && step === 0 && !playing;
    place(panel, atStart ? (t.steps[0]?.start ?? 0) : (t.stills[panel.step] ?? 0), false);
  };

  const fillProgress = (): void => {
    progress.replaceChildren(
      ...Array.from({ length: count }, (_, i) => {
        const segment = doc.createElement("span");
        segment.className = "dg-seg";
        segment.dataset.dragon = "segment";
        segment.dataset.step = String(i);
        return segment;
      }),
    );
  };
  /** 読み上げの段の一覧。並べる見せ方は共通の段と場面ごとの段、選ぶ見せ方は選んだ場面の段を並べる */
  const fillList = (): void => {
    const first = panels[0]?.scene;
    const common = first ? first.diagram.steps.slice(0, first.common) : [];
    const own = (panel: Panel): Step[] => panel.scene.diagram.steps.slice(panel.scene.common).map((s) => ({ ...s, title: `${panel.scene.name}: ${s.title}` }));
    const steps = show === "pick" ? (panels[picked]?.scene.diagram.steps ?? []) : [...common, ...panels.flatMap(own)];
    list.replaceChildren(...steps.map((s) => drawStepItem(doc, s)));
  };

  /** 今の段を、帯と場面の枠と札に出す */
  const showStep = (): void => {
    // 帯の題と本文は、今の段を進める場面のうち最初の場面の段
    const lead = moving().find((p) => step < lengthOf(p)) ?? moving()[0];
    const current = lead?.scene.diagram.steps[step];
    no.textContent = stepNo(step, count);
    title.textContent = current?.title ?? "";
    body.textContent = current?.body ?? "";
    showToggle(playing);
    for (const segment of progress.children) {
      const el = segment as HTMLElement;
      const i = Number(el.dataset.step);
      el.dataset.state = i < step ? "done" : i === step ? "now" : "todo";
    }
    panels.forEach((panel, k) => {
      panel.el.hidden = show === "pick" && k !== picked;
      panel.el.dataset.step = String(panel.step);
      const stopped = panel.reason !== undefined && panel.step === lengthOf(panel) - 1 && (show === "stack" || k === picked);
      panel.el.toggleAttribute("data-stopped", stopped);
      if (panel.reason) panel.reason.hidden = !stopped;
      panel.caption.textContent = panel.scene.diagram.steps[panel.step]?.title ?? "";
      panel.notes?.stepped(panel.step);
    });
    for (const [k, b] of pickButtons.entries()) b.setAttribute("aria-pressed", String(k === picked));
    options.onStep?.(step);
  };

  /** 今の段 `step` を、段を送る場面の枠に当てる。場面の最後の段より先へは進めない */
  const follow = (): void => {
    for (const panel of moving()) panel.step = Math.min(step, lengthOf(panel) - 1);
  };
  const stopClock = (): void => {
    if (clock !== undefined) clearTimeout(clock);
    clock = undefined;
  };
  /** 段 `target` へ移り、全ての場面を止め絵で止める */
  const go = (target: number): void => {
    stopClock();
    playing = false;
    step = Math.min(count - 1, Math.max(0, target));
    follow();
    for (const panel of panels) still(panel);
    showStep();
  };
  /**
   * 今の段を流す。段を送る場面のうちその段へ進む場面は段の始まりから流して止め絵で止め、留まる場面は止め絵のままにする。
   * 最も長く動く場面が止め絵に着いた後に次の段へ移り、最後の段の後は最初の段から流し直す。1 度だけ流す図は最後の段で止める
   */
  const run = (): void => {
    stopClock();
    let longest = 0;
    for (const panel of moving()) {
      const t = panel.scene.timeline;
      const advances = step < lengthOf(panel);
      const span = t.steps[panel.step];
      const end = t.stills[panel.step] ?? span?.end ?? 0;
      if (!advances || !span) {
        still(panel);
        continue;
      }
      place(panel, span.start, true);
      const seconds = Math.max(0, end - span.start) / speed;
      longest = Math.max(longest, seconds);
      if (panel.timer !== undefined) clearTimeout(panel.timer);
      panel.timer = setTimeout(() => {
        panel.timer = undefined;
        place(panel, end, false);
      }, seconds * 1000);
    }
    clock = setTimeout(() => {
      if (step + 1 < count) step += 1;
      else if (options.playOnce) {
        playing = false;
        showStep();
        return;
      } else step = 0;
      follow();
      showStep();
      run();
    }, (longest + HOLD / speed) * 1000);
  };
  const play = (): void => {
    if (playing) return;
    playing = true;
    // 1 度だけ流す図が最後の段まで来ていれば、最初の段から流し直す
    if (options.playOnce && step === count - 1) {
      step = 0;
      follow();
    }
    showStep();
    run();
  };
  const pause = (): void => {
    if (!playing) return;
    go(step);
  };

  /** 選ぶ見せ方で場面 `k` を選び、その場面の 1 段目に戻る */
  const pick = (k: number): void => {
    if (!panels[k]) return;
    picked = k;
    count = countOf();
    fillProgress();
    fillList();
    go(0);
  };

  // 札で見せる図 (#3877) は、場面の枠ごとに札の層を置く。押した場面の箱の札を開き、ほかの場面の札を閉じる
  let gone = false;
  for (const panel of panels) {
    if ((panel.scene.layout.noteCards ?? []).length === 0) continue;
    withNoteCards((made) => {
      if (gone) return;
      panel.notes = made(doc, panel.frame, row, panel.scene.layout, words);
      if (!panel.notes) return;
      panel.frame.insertBefore(panel.notes.layer, panel.svg?.nextSibling ?? null);
      root.dataset.notes = "";
    });
  }
  const openNote = (panel: Panel, noted: Element): void => {
    for (const other of panels) if (other !== panel) other.notes?.close();
    panel.notes?.open(noted.getAttribute("data-note") ?? "", noted, panel.step);
  };
  const onFrame = (panel: Panel) => (event: Event): void => {
    if (!panel.notes) return;
    const target = event.target as Element | null;
    if (target?.closest?.('[data-dragon="note-close"]')) {
      panel.notes.close();
      return;
    }
    if (target?.closest?.('[data-dragon="note-card"]')) return;
    const noted = target?.closest?.("[data-note]");
    if (noted) openNote(panel, noted);
  };
  const onKey = (panel: Panel) => (event: KeyboardEvent): void => {
    if (!panel.notes) return;
    if (event.key === "Escape") {
      panel.notes.close();
      return;
    }
    if (event.key !== "Enter" && event.key !== " ") return;
    const noted = (event.target as Element | null)?.closest?.("[data-note]");
    if (!noted) return;
    event.preventDefault();
    openNote(panel, noted);
  };
  const frameHandlers = panels.map((panel) => ({ panel, click: onFrame(panel), key: onKey(panel) }));
  for (const { panel, click, key } of frameHandlers) {
    panel.frame.addEventListener("click", click);
    panel.frame.addEventListener("keydown", key);
  }

  const onPrev = (): void => go(step - 1);
  const onNext = (): void => go(step + 1);
  const onToggle = (): void => (playing ? pause() : play());
  const onRestart = (): void => {
    const again = playing;
    go(0);
    if (again) play();
  };
  const onProgress = (event: Event): void => {
    const s = Number((event.target as HTMLElement | null)?.closest?.<HTMLElement>('[data-dragon="segment"]')?.dataset.step);
    if (Number.isInteger(s)) go(s);
  };
  const onPick = (event: Event): void => {
    const k = Number((event.target as HTMLElement | null)?.closest?.<HTMLElement>('[data-dragon="scene-pick"]')?.dataset.index);
    if (Number.isInteger(k)) pick(k);
  };
  prevButton.addEventListener("click", onPrev);
  nextButton.addEventListener("click", onNext);
  toggleButton.addEventListener("click", onToggle);
  restartButton.addEventListener("click", onRestart);
  progress.addEventListener("click", onProgress);
  picks?.addEventListener("click", onPick);

  fillProgress();
  fillList();
  follow();
  for (const panel of panels) still(panel);
  showStep();
  if (playing) {
    playing = false;
    play();
  }

  return {
    get step() {
      return step;
    },
    get playing() {
      return playing;
    },
    held: false,
    hold: () => undefined,
    next: onNext,
    prev: onPrev,
    play,
    pause,
    goTo: (target: number) => go(target),
    rewind: () => go(0),
    setSpeed: (next: number) => {
      if (typeof next !== "number" || !Number.isFinite(next) || next <= 0) throw new RangeError(`speed must be a finite number greater than 0, got ${String(next)}`);
      speed = next;
      if (playing) run();
      else for (const panel of panels) still(panel);
    },
    mark: () => undefined,
    get diagram() {
      return diagram;
    },
    destroy: () => {
      gone = true;
      stopClock();
      for (const panel of panels) {
        if (panel.timer !== undefined) clearTimeout(panel.timer);
        panel.notes?.destroy();
      }
      for (const { panel, click, key } of frameHandlers) {
        panel.frame.removeEventListener("click", click);
        panel.frame.removeEventListener("keydown", key);
      }
      prevButton.removeEventListener("click", onPrev);
      nextButton.removeEventListener("click", onNext);
      toggleButton.removeEventListener("click", onToggle);
      restartButton.removeEventListener("click", onRestart);
      progress.removeEventListener("click", onProgress);
      picks?.removeEventListener("click", onPick);
      root.remove();
    },
  };
}
