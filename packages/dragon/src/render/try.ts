/**
 * 試す図 (#3337) を描く部品。見た目の元は承認した板 (網を上に、待ち行列と、prev と hash を `=` でつないだ機械の列を下に置く形)。
 *
 * 出来事ごとの時刻と、出来事ごとの位置を辿る動きと、時点ごとに替わる字を描く状態 (`TryKit`) に組み、
 * 網、待ち行列、機械の列、入力の帯のブロックの描き方 (`blocks/<名前>/draw.ts`) を層の順に呼ぶ (#3348)。
 * 呼ぶ順は網、待ち行列、機械の列、チップ、記録の列で、この順が動きの名前の番号を決める。見た目の規則 (`TRY_CSS`) は試す図の SVG にだけ書く。
 * 書き手の段を全て描くので、書き出しと印刷は書き手の例の段を描く。最後の段の止め絵は最後の段の状態。
 */
import { tryChips } from "../blocks/ask/draw";
import { chainRows } from "../blocks/chain/draw";
import { logRows } from "../blocks/log/draw";
import { queueFrames } from "../blocks/queue/draw";
import { routeNet } from "../blocks/route/draw";
import { hasWide, textBox } from "../layout/measure";
import type { Point } from "../layout/scene";
import type { TryLayout, TryMoment } from "../kinds/try/layout";
import { EASE, LOOK, MOTION, type TextStyle, TYPE } from "../look/values";
import type { DiagramModel } from "../schema";
import type { Span, Timeline } from "../timeline";
import type { Shown } from "./ink";
import type { Frame } from "./motion";
import { type Ctx, cssFont as font, cssMix as mix, esc, r1, sansOf, write } from "./parts";

const S = LOOK.stroke;
const X = LOOK.mix;

/**
 * 試す図の部品の見た目。どの値も値の表から読む。試す図の SVG にだけ書き、ほかの図の SVG と頁が最初に読む script に入れない。
 * 末尾に j を付けた class は、和文を含む字を同じ大きさと太さの和文の字で描く
 */
const TRY_CSS = [
  `.dg-try-t{${font(TYPE.tryTitle)};fill:var(--ct)}`,
  `.dg-try-tj{${font(sansOf(TYPE.tryTitle))}}`,
  `.dg-try-net{fill:none;stroke:var(--line);stroke-width:${S.edge};stroke-linecap:round}`,
  `.dg-try-trip{fill:none;stroke:var(--c);stroke-width:${S.edgeOn};stroke-linecap:round;stroke-linejoin:round}`,
  `.dg-try-node{fill:var(--surf);stroke:var(--line);stroke-width:${S.slot}}`,
  `.dg-try-end{fill:${mix(X.chipTint)};stroke:var(--c);stroke-width:${S.on}}`,
  `.dg-try-ng{fill:none;stroke:var(--mute);stroke-width:${S.glyph};stroke-linecap:round;stroke-linejoin:round}`,
  `.dg-try-nt{${font(TYPE.tryNode)};fill:var(--mute)}`,
  `.dg-try-ntj{${font(sansOf(TYPE.tryNode))}}`,
  ".dg-try-nte{fill:var(--ink)}",
  `.dg-try-q{fill:var(--surf);stroke:var(--hair);stroke-width:${S.hair}}`,
  `.dg-try-hint{${font(TYPE.tryHint)};fill:var(--ct)}`,
  `.dg-try-chip{fill:var(--surf);stroke:var(--line);stroke-width:${S.hair}}`,
  `.dg-try-sent{fill:${mix(X.chipTint)};stroke:var(--c);stroke-width:${S.on}}`,
  `.dg-try-cn{${font(TYPE.tryChip)};fill:var(--ink)}`,
  `.dg-try-cnj{${font(sansOf(TYPE.tryChip))}}`,
  `.dg-try-cv{${font(TYPE.tryChipValue)};fill:var(--ct)}`,
  `.dg-try-cvj{${font(sansOf(TYPE.tryChipValue))}}`,
  `.dg-try-blk{fill:var(--surf);stroke:var(--hair);stroke-width:${S.hair}}`,
  `.dg-try-no{${font(TYPE.tryBlockNo)};fill:var(--mute)}`,
  `.dg-try-noj{${font(sansOf(TYPE.tryBlockNo))}}`,
  `.dg-try-row{fill:var(--sunk);stroke:var(--hair);stroke-width:${S.hair}}`,
  `.dg-try-hrow{fill:${mix(X.chipTint)};stroke:${mix(X.capEdge, "transparent")};stroke-width:${S.hair}}`,
  `.dg-try-rk{${font(TYPE.tryRowKey)};fill:var(--mute)}`,
  `.dg-try-rv{${font(TYPE.tryRowValue)};fill:var(--ink)}`,
  ".dg-try-hv{fill:var(--ct)}",
  `.dg-try-cap{${font(TYPE.tryCaption)};fill:var(--mute)}`,
  `.dg-try-ln{fill:none;stroke:var(--c);stroke-width:${S.edge};stroke-linecap:round;stroke-linejoin:round}`,
  `.dg-try-lb{fill:var(--surf);stroke:var(--c);stroke-width:${S.on}}`,
  `.dg-try-lt{${font(TYPE.tryLink)};fill:var(--ct)}`,
  `.dg-try-fold{fill:var(--surf);stroke:var(--hair);stroke-width:${S.hair};stroke-dasharray:3 3}`,
  `.dg-try-ft{${font(TYPE.tryHint)};fill:var(--mute)}`,
  `.dg-try-ftj{${font(sansOf(TYPE.tryHint))}}`,
].join("");

/**
 * 記録の列 (#3441) だけが使う見た目。記録の列を持つ図の SVG にだけ書き、記録の列を持たない図の SVG を変えない。
 * 印の札は色の役の色で縁を引き、印の字は色の役の字の色で書く
 */
const LOG_CSS = [
  `.dg-try-mb{fill:${mix(X.chipTint)};stroke:var(--c);stroke-width:${S.on}}`,
  `.dg-try-mk{${font(TYPE.tryChipValue)};fill:var(--ct)}`,
  `.dg-try-mkj{${font(sansOf(TYPE.tryChipValue))}}`,
].join("");

/** 網の節の関門 (#3476) を持つ図だけが使う見た目。関門で止まった節の輪を止まった色で引く。関門を持たない図の SVG を変えない */
const GATE_CSS = `.dg-try-stop{fill:none;stroke:var(--c);stroke-width:${S.on}}`;

/** 和文を含む字に、和文の字の class を足す */
const cls = (base: string, text: string): string => (hasWide(text) ? `${base} ${base}j` : base);

const translate = (p: Point): string => `translate(${r1(p[0])}px,${r1(p[1])}px)`;

const same = (a: Point | null, b: Point | null): boolean =>
  a === null || b === null ? a === b : a[0] === b[0] && a[1] === b[1];

/** 止まって見えている間と、その時の左上。字の重なりを数える時に、止まっている字だけを記録する */
export interface TryRest {
  at: Point;
  from: number;
  to: number;
}

/** 出来事の時刻。`a` で始め、`b` で終え、`move` は網を運ばれるチップが待ち行列へ入り始める時刻 (ほかのチップが席を詰め始める時刻) */
export interface TryWindow {
  a: number;
  b: number;
  move: number;
}

/**
 * 試す図のブロックの描き方 (網、待ち行列、機械の列、入力の帯) が受ける、描く状態 (#3348)。
 * 描き方は描いた物を層 (`base`、`lit`、`node`、`top`) に積み、呼ぶ順が動きの名前の番号を決める
 */
export interface TryKit {
  readonly layout: TryLayout;
  readonly diagram: DiagramModel;
  readonly ctx: Ctx;
  /** 出来事ごとの状態と、出来事ごとの時刻。最初の時点 (何も起きる前) を含む */
  readonly moments: TryMoment[];
  readonly windows: TryWindow[];
  /** 段 `s` の時刻 */
  readonly spanOf: (s: number) => Span;
  /** 出来事ごとの位置 (出ていなければ `null`) を辿る動きと、止まって見えている間。`trip` を返す時点は、その点を順に辿ってから席へ入る */
  readonly track: (positions: (Point | null)[], trip?: (k: number) => Point[] | undefined) => { style: string; rests: TryRest[] };
  /** 出来事ごとの値が替わる時刻で区切った値の並び */
  readonly phasesOf: <V>(values: V[]) => { value: V; from: number; to: number }[];
  /** `from` から `to` まで見える動き。`prop` は変える性質 */
  readonly shownKf: (ranges: Shown[], prop?: string) => string;
  /** 時点ごとに替わる字 */
  readonly phased: (texts: string[], x: number, y: number, className: string, anchor?: "middle" | "end") => string;
  /** 止まって見えている字を、字の重なりを数える記録に足す */
  readonly record: (text: string, style: TextStyle, rests: TryRest[], x: number, y: number, anchor?: "start" | "middle", shown?: Shown) => void;
  /** 部品の題 */
  readonly title: (t: { text: string; x: number; baseline: number }) => string;
  /** 和文を含む字に、同じ大きさと太さの和文の字の class を足す */
  readonly cls: (base: string, text: string) => string;
  /** 層。下から、地と題と枠 (`base`)、通った線 (`lit`)、網の節とブロック (`node`)、チップ (`top`) */
  readonly base: string[];
  readonly lit: string[];
  readonly node: string[];
  readonly top: string[];
}

export function drawTry(
  layout: TryLayout,
  diagram: DiagramModel,
  timeline: Timeline,
  ctx: Ctx,
): { base: string; lit: string; node: string; top: string; css: string } {
  const { m } = ctx;
  const moments = layout.moments;
  const spanOf = (s: number): Span => timeline.steps[s] as Span;
  /** 出来事ごとの時刻。最初の時点 (何も起きる前) は 0 */
  const windows: TryWindow[] = moments.map((mo) => {
    if (mo.step < 0) return { a: 0, b: 0, move: 0 };
    const time = timeline.edges.find((t) => t.step === mo.step && t.event === mo.event);
    const a = time?.start ?? spanOf(mo.step).start;
    const b = time?.drawn ?? a;
    return { a, b, move: mo.trip !== undefined ? Math.min(b, a + MOTION.try.trip) : a };
  });

  /**
   * 出来事ごとの位置 `positions` (出ていなければ `null`) を辿る動き。現れる時は席で浮かび、消える時は席で薄れ、別の席へは滑る。
   * `trip` を返す時点は、その点を順に辿ってから席へ入る。席の無い時点 (関門で止まったチップ、#3476) は最後の点で薄れて消える。繰り返す前に消える
   */
  const track = (
    positions: (Point | null)[],
    trip: (k: number) => Point[] | undefined = () => undefined,
  ): { style: string; rests: TryRest[] } => {
    const first = positions.find((p): p is Point => p !== null) ?? [0, 0];
    const frames: Frame[] = [[0, { opacity: 0, transform: translate(first) }]];
    const rests: TryRest[] = [];
    let cur: Point | null = positions[0] ?? null;
    let since = 0;
    let lastSeen = first;
    for (let k = 1; k < positions.length; k++) {
      const next = positions[k] ?? null;
      const w = windows[k] as TryWindow;
      const path = trip(k);
      if (same(cur, next) && !path) continue;
      // 止まっていた間は、動き出す時刻まで。席から席へ滑るチップは、網を運ばれるチップが待ち行列へ入り始めるまで止まっている
      if (cur) rests.push({ at: cur, from: since, to: next && !path ? w.move : w.a });
      if (path && path.length > 0) {
        // 送る側の節で現れ、道の長さに比べた時間で節を順に通り、作る人から待ち行列の席へ入る
        const start = path[0] as Point;
        const arrive = Math.min(w.b, w.a + MOTION.try.trip);
        const appear = Math.min(arrive, w.a + MOTION.popFade);
        frames.push(
          [w.a, { opacity: 0, transform: translate(start) }, EASE.out],
          [appear, { opacity: 1, transform: translate(start) }],
        );
        const legs = path
          .slice(1)
          .map((p, i) => Math.hypot(p[0] - (path[i] as Point)[0], p[1] - (path[i] as Point)[1]));
        const total = legs.reduce((sum, l) => sum + l, 0) || 1;
        let walked = 0;
        path.slice(1).forEach((p, i) => {
          walked += legs[i] ?? 0;
          frames.push([
            appear + ((arrive - appear) * walked) / total,
            { opacity: 1, transform: translate(p) },
          ]);
        });
        const end = path[path.length - 1] as Point;
        frames.push(
          [
            arrive,
            { opacity: 1, transform: translate(end) },
            EASE.inOut,
          ],
          [w.b, { opacity: next ? 1 : 0, transform: translate(next ?? end) }],
        );
        if (!next) lastSeen = end;
      } else if (!cur && next) {
        frames.push(
          [w.a, { opacity: 0, transform: translate(next) }, EASE.out],
          [w.b, { opacity: 1, transform: translate(next) }],
        );
      } else if (cur && !next) {
        frames.push(
          [w.a, { opacity: 1, transform: translate(cur) }, EASE.inOut],
          [w.b, { opacity: 0, transform: translate(cur) }],
        );
      } else if (cur && next) {
        frames.push(
          [w.move, { opacity: 1, transform: translate(cur) }, EASE.inOut],
          [w.b, { opacity: 1, transform: translate(next) }],
        );
      }
      since = w.b;
      cur = next;
      if (next) lastSeen = next;
    }
    if (cur) rests.push({ at: cur, from: since, to: m.last });
    frames.push(
      [m.last, { opacity: cur ? 1 : 0, transform: translate(lastSeen) }, EASE.inOut],
      [m.total, { opacity: 0, transform: translate(lastSeen) }],
    );
    return { style: m.kf(frames), rests };
  };

  /** 出来事ごとの値 `values` が替わる時刻で区切った値の並び。最初の値は初めから */
  const phasesOf = <V>(values: V[]): { value: V; from: number; to: number }[] => {
    const out: { value: V; from: number; to: number }[] = [];
    values.forEach((value, k) => {
      const last = out[out.length - 1];
      if (last && last.value === value) return;
      const from = last ? (windows[k] as TryWindow).b : 0;
      if (last) last.to = from;
      out.push({ value, from, to: Number.POSITIVE_INFINITY });
    });
    return out;
  };

  /** `from` から `to` まで見える動き。`prop` は変える性質 (字の一部は `fill-opacity` で消す) */
  const shownKf = (ranges: Shown[], prop = "opacity"): string => {
    const frames: Frame[] = [[0, { [prop]: 0 }]];
    for (const [a, b] of ranges) {
      if (a <= 0) frames.push([0, { [prop]: 1 }]);
      else frames.push([a, { [prop]: 0 }, EASE.out], [a + MOTION.fade, { [prop]: 1 }]);
      if (Number.isFinite(b))
        frames.push(
          [b, { [prop]: 1 }, EASE.inOut],
          [Math.min(b + MOTION.fade, m.total), { [prop]: 0 }],
        );
      else frames.push([m.last, { [prop]: 1 }, EASE.inOut]);
    }
    frames.push([m.total, { [prop]: 0 }]);
    return m.kf(frames);
  };

  /** 時点ごとに替わる字。替わらなければ 1 つの字、替われば替わる時刻ごとに薄れて入れ替わる字の並び */
  const phased = (
    texts: string[],
    x: number,
    y: number,
    className: string,
    anchor?: "middle" | "end",
  ): string => {
    const phases = phasesOf(texts).filter((p) => p.value !== "");
    const head = `<text class="${className}" x="${r1(x)}" y="${r1(y)}"${anchor ? ` text-anchor="${anchor}"` : ""}>`;
    if (phases.length <= 1) return `${head}${esc(phases[0]?.value ?? "")}</text>`;
    return `${head}${phases.map((p) => `<tspan class="dg-a" x="${r1(x)}" style="${shownKf([[p.from, p.to]], "fill-opacity")}">${esc(p.value)}</tspan>`).join("")}</text>`;
  };

  /** 止まって見えている字を、字の重なりを数える記録に足す */
  const record = (
    text: string,
    style: TextStyle,
    rests: TryRest[],
    x: number,
    y: number,
    anchor?: "start" | "middle",
    shown: Shown = [0, Number.POSITIVE_INFINITY],
  ): void => {
    if (text === "") return;
    for (const r of rests) {
      const a = Math.max(r.from, shown[0]);
      const b = Math.min(r.to, shown[1]);
      if (a < b)
        ctx.ink.push({
          text,
          rect: textBox(text, r.at[0] + x, r.at[1] + y, style, anchor),
          shown: [[a, b]],
        });
    }
  };

  const base: string[] = [];
  const lit: string[] = [];
  const node: string[] = [];
  const top: string[] = [];
  const title = (t: { text: string; x: number; baseline: number }): string =>
    write(
      ctx.ink,
      cls("dg-try-t", t.text),
      t.x,
      t.baseline,
      t.text,
      hasWide(t.text) ? sansOf(TYPE.tryTitle) : TYPE.tryTitle,
    );
  const kit: TryKit = { layout, diagram, ctx, moments, windows, spanOf, track, phasesOf, shownKf, phased, record, title, cls, base, lit, node, top };
  // 呼ぶ順が動きの名前の番号を決めるので、移す前の順のまま呼ぶ
  routeNet(kit);
  queueFrames(kit);
  chainRows(kit);
  tryChips(kit);
  // 記録の列はチップの後に呼び、記録の列を持たない図の動きの名前の番号を変えない
  logRows(kit);
  return {
    base: base.join(""),
    lit: lit.join(""),
    node: node.join(""),
    top: top.join(""),
    css: (layout.logs ? TRY_CSS + LOG_CSS : TRY_CSS) + ((diagram.try?.checks ?? []).length > 0 ? GATE_CSS : ""),
  };
}
