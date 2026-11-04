/**
 * 試す図 (#3337) を描く部品。見た目の元は承認した板 (網を上に、待ち行列と、prev と hash を `=` でつないだ機械の列を下に置く形)。
 *
 * 部品の題、網の線と節、待ち行列の枠と取り出し方の字は動かさずに描く。チップは 1 枚につき 1 つの部品 (`data-chip`) で、
 * 中の字は名前と、待ち行列が並べる順の欄の値の 2 つだけ。出来事ごとの位置を keyframes で辿り、待ち行列の席とブロックの中の席の間を滑る。
 * 網を運ばれるチップは送る側の節で現れ、最短の道の節を順に通って作る人へ着いてから待ち行列へ入る。その段の間は通った線を強める。
 * ブロック (`data-block`) は新しい方から 3 つを左から古い順に並べ、ブロックが足されると左へ滑り、古いブロックは消えて畳んだ印 (`data-fold`) に数える。
 * ブロックの中の字は番号と prev と hash の頭の 4 字で、hash は書き換えた段から新しい値に替わる。
 * ブロックの間のつながり (`data-link`) は prev が前のブロックの今の hash と同じ間は `=`、違う間は橙の `≠` を出す。
 * 書き手の段を全て描くので、書き出しと印刷は書き手の例の段を描く。最後の段の止め絵は最後の段の状態。
 */
import { cs } from "../blocks/color/draw";
import { glyph } from "../blocks/icon/draw";
import { hasWide, textBox } from "../layout/measure";
import type { Point } from "../layout/scene";
import { blockKey, type TryChainPlaced, type TryLayout, type TryMoment } from "../layout/try";
import { TRY_LOOK } from "../look/try";
import { EASE, LOOK, MOTION, type TextStyle, TYPE } from "../look/values";
import type { DiagramModel } from "../schema";
import type { Span, Timeline } from "../timeline";
import { frameShape, partRadius } from "./corner";
import { ALWAYS, type Shown } from "./ink";
import type { Frame } from "./motion";
import { type Ctx, cssFont as font, cssMix as mix, esc, pathOf, r1, sansOf, write } from "./parts";

const T = TRY_LOOK;
const B = T.block;
const C = T.chip;
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

/** 和文を含む字に、和文の字の class を足す */
const cls = (base: string, text: string): string => (hasWide(text) ? `${base} ${base}j` : base);

const translate = (p: Point): string => `translate(${r1(p[0])}px,${r1(p[1])}px)`;

const same = (a: Point | null, b: Point | null): boolean =>
  a === null || b === null ? a === b : a[0] === b[0] && a[1] === b[1];

/** 止まって見えている間と、その時の左上。字の重なりを数える時に、止まっている字だけを記録する */
interface Rest {
  at: Point;
  from: number;
  to: number;
}

/** 出来事の時刻。`a` で始め、`b` で終え、`move` は網を運ばれるチップが待ち行列へ入り始める時刻 (ほかのチップが席を詰め始める時刻) */
interface Window {
  a: number;
  b: number;
  move: number;
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
  const windows: Window[] = moments.map((mo) => {
    if (mo.step < 0) return { a: 0, b: 0, move: 0 };
    const time = timeline.edges.find((t) => t.step === mo.step && t.event === mo.event);
    const a = time?.start ?? spanOf(mo.step).start;
    const b = time?.drawn ?? a;
    return { a, b, move: mo.trip !== undefined ? Math.min(b, a + MOTION.try.trip) : a };
  });

  /**
   * 出来事ごとの位置 `positions` (出ていなければ `null`) を辿る動き。現れる時は席で浮かび、消える時は席で薄れ、別の席へは滑る。
   * `trip` を返す時点は、その点を順に辿ってから席へ入る。繰り返す前に消える
   */
  const track = (
    positions: (Point | null)[],
    trip: (k: number) => Point[] | undefined = () => undefined,
  ): { style: string; rests: Rest[] } => {
    const first = positions.find((p): p is Point => p !== null) ?? [0, 0];
    const frames: Frame[] = [[0, { opacity: 0, transform: translate(first) }]];
    const rests: Rest[] = [];
    let cur: Point | null = positions[0] ?? null;
    let since = 0;
    let lastSeen = first;
    for (let k = 1; k < positions.length; k++) {
      const next = positions[k] ?? null;
      const w = windows[k] as Window;
      const path = trip(k);
      if (same(cur, next) && !path) continue;
      // 止まっていた間は、動き出す時刻まで。席から席へ滑るチップは、網を運ばれるチップが待ち行列へ入り始めるまで止まっている
      if (cur) rests.push({ at: cur, from: since, to: next && !path ? w.move : w.a });
      if (path && path.length > 0 && next) {
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
        frames.push(
          [
            arrive,
            { opacity: 1, transform: translate(path[path.length - 1] as Point) },
            EASE.inOut,
          ],
          [w.b, { opacity: 1, transform: translate(next) }],
        );
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
      const from = last ? (windows[k] as Window).b : 0;
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
    rests: Rest[],
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

  // 網。線と節は動かさず、送った段は通った線を強める
  for (const route of layout.routes) {
    const links = route.links
      .map((l) => `<path class="dg-try-net" d="${pathOf(l.points)}"/>`)
      .join("");
    const nodes = route.nodes
      .map((n) => {
        const end = n.end !== undefined;
        const icon = n.end === "from" ? "user" : n.end === "to" ? "block" : "server";
        const label = write(
          ctx.ink,
          `${cls("dg-try-nt", n.id)}${end ? " dg-try-nte" : ""}`,
          n.x,
          n.y + T.route.labelY,
          n.id,
          hasWide(n.id) ? sansOf(TYPE.tryNode) : TYPE.tryNode,
          ALWAYS,
          "middle",
        );
        return `<g data-node="${esc(n.id)}"><circle class="${end ? "dg-try-end" : "dg-try-node"}" cx="${r1(n.x)}" cy="${r1(n.y)}" r="${T.route.r}"/>${glyph(icon, n.x, n.y, T.route.glyph, end ? "dg-gl" : "dg-try-ng")}${label}</g>`;
      })
      .join("");
    base.push(
      `<g data-part="${esc(route.id)}" style="${cs(T.color.part)}">${title(route.title)}${links}</g>`,
    );
    node.push(`<g data-route="${esc(route.id)}" style="${cs(T.color.part)}">${nodes}</g>`);
    moments.forEach((mo, k) => {
      if (mo.trip?.route !== route.id) return;
      const at = new Map(route.nodes.map((n) => [n.id, n]));
      const path = mo.state.trips.find((t) => t.item === mo.trip?.item)?.path ?? [];
      const points = path.flatMap((id): Point[] => {
        const n = at.get(id);
        return n ? [[n.x, n.y]] : [];
      });
      if (points.length < 2) return;
      const w = windows[k] as Window;
      lit.push(
        `<path class="dg-try-trip dg-a" data-trip="${esc(mo.trip.item)}" d="${pathOf(points)}" style="${cs(T.color.part)};${m.vis(w.a, spanOf(mo.step).end)}"/>`,
      );
    });
  }

  // 待ち行列の枠と題と、釦が上から何件を取り出すかの字
  for (const queue of layout.queues) {
    const placed = layout.parts.find((p) => p.id === queue.id);
    const box = frameShape(
      ctx.corner,
      ` class="dg-try-q"`,
      queue.box,
      `<rect class="dg-try-q" x="${r1(queue.box.x)}" y="${r1(queue.box.y)}" width="${r1(queue.box.w)}" height="${r1(queue.box.h)}" rx="${B.radius}"/>`,
    );
    const hint = queue.hint
      ? write(
          ctx.ink,
          "dg-try-hint",
          queue.hint.x,
          queue.hint.baseline,
          queue.hint.text,
          TYPE.tryHint,
        )
      : "";
    base.push(
      `<g data-part="${esc(queue.id)}" data-most="${placed?.most ?? queue.slots.length}" style="${cs(T.color.part)}">${title(queue.title)}${box}${hint}</g>`,
    );
  }

  // 機械の列のブロックと、ブロックの間のつながりと、畳んだ印
  for (const chain of layout.chains) {
    base.push(
      `<g data-part="${esc(chain.id)}" style="${cs(T.color.part)}">${title(chain.title)}</g>`,
    );
    node.push(drawChain(chain));
  }

  // チップ。1 枚につき 1 つの部品で、名前と並べる順の欄の値だけを出す
  const declared = new Set((diagram.try?.items ?? []).map((item) => item.id));
  const chipIds = [
    ...new Set(
      moments.flatMap((mo) => Object.entries(mo.chips).flatMap(([id, at]) => (at ? [id] : []))),
    ),
  ];
  for (const id of chipIds) {
    const moved = track(
      moments.map((mo) => mo.chips[id] ?? null),
      (k) => (moments[k]?.trip?.item === id ? moments[k]?.trip?.points : undefined),
    );
    const name = layout.names[id] ?? id;
    const rx = partRadius(ctx.corner, C.radius);
    const baseline = C.h / 2 + LOOK.baseline.tag;
    const nameText = write(undefined, cls("dg-try-cn", name), C.padX, baseline, name, TYPE.tryChip);
    record(
      name,
      hasWide(name) ? sansOf(TYPE.tryChip) : TYPE.tryChip,
      moved.rests,
      C.padX,
      baseline,
    );
    const field = layout.valueField;
    const values =
      field === undefined ? [] : moments.map((mo) => mo.state.items[id]?.[field] ?? "");
    const valueText =
      field === undefined
        ? ""
        : phased(
            values,
            layout.chip.w - C.padX,
            baseline,
            cls("dg-try-cv", values.join("")),
            "end",
          );
    for (const p of phasesOf(values)) {
      const style = hasWide(p.value) ? sansOf(TYPE.tryChipValue) : TYPE.tryChipValue;
      record(
        p.value,
        style,
        moved.rests,
        layout.chip.w - C.padX - textBox(p.value, 0, 0, style).w,
        baseline,
        "start",
        [p.from, p.to],
      );
    }
    const sent = !declared.has(id);
    top.push(
      `<g class="dg-a" data-chip="${esc(id)}" style="${cs(T.color.part)};${moved.style}"><rect class="${sent ? "dg-try-sent" : "dg-try-chip"}" width="${r1(layout.chip.w)}" height="${C.h}" rx="${rx}"/>${nameText}${valueText}</g>`,
    );
  }

  return {
    base: base.join(""),
    lit: lit.join(""),
    node: node.join(""),
    top: top.join(""),
    css: TRY_CSS,
  };

  /** 機械の列 1 つ。ブロックは左上を原点に描いて出来事ごとの位置へ動かし、つながりは後ろのブロックと一緒に動く */
  function drawChain(chain: TryChainPlaced): string {
    const numbers = [
      ...new Set(moments.flatMap((mo) => (mo.state.chains[chain.id] ?? []).map((b) => b.number))),
    ].sort((a, b) => a - b);
    const blockOf = (mo: TryMoment, n: number) =>
      (mo.state.chains[chain.id] ?? []).find((b) => b.number === n);
    const rowW = chain.w - B.padX * 2;
    const rowText = B.row / 2 + LOOK.baseline.tag + 1;
    const row = (
      y: number,
      key: string,
      values: string[],
      strong: boolean,
      rests: Rest[],
    ): string => {
      const keyX = B.padX + B.rowPad;
      const valueX = keyX + textBox(key, 0, 0, TYPE.tryRowKey).w + B.keyGap;
      record(key, TYPE.tryRowKey, rests, keyX, y + rowText);
      for (const p of phasesOf(values))
        record(p.value, TYPE.tryRowValue, rests, valueX, y + rowText, "start", [p.from, p.to]);
      return (
        `<rect class="${strong ? "dg-try-hrow" : "dg-try-row"}" x="${B.padX}" y="${r1(y)}" width="${r1(rowW)}" height="${B.row}" rx="${partRadius(ctx.corner, B.rowRadius)}"/>` +
        `<text class="dg-try-rk" x="${r1(keyX)}" y="${r1(y + rowText)}">${key}</text>${phased(values, valueX, y + rowText, strong ? "dg-try-rv dg-try-hv" : "dg-try-rv")}`
      );
    };
    const blocks = numbers.map((n) => {
      const key = blockKey(chain.id, n);
      const moved = track(moments.map((mo) => mo.blocks[key] ?? null));
      const box = { x: 0, y: 0, w: chain.w, h: chain.h };
      const frame = frameShape(
        ctx.corner,
        ` class="dg-try-blk" ${ctx.sh}`,
        box,
        `<rect class="dg-try-blk" width="${r1(chain.w)}" height="${r1(chain.h)}" rx="${B.radius}" ${ctx.sh}/>`,
      );
      const builtAt = moments.findIndex(
        (mo) => mo.built?.chain === chain.id && mo.built.number === n,
      );
      const ring =
        builtAt < 0
          ? ""
          : `<g class="dg-a" style="${m.vis((windows[builtAt] as Window).b, spanOf(moments[builtAt]?.step ?? 0).end)}">${frameShape(ctx.corner, ' class="dg-halo"', box, `<rect class="dg-halo" width="${r1(chain.w)}" height="${r1(chain.h)}" rx="${B.radius}"/>`)}${frameShape(ctx.corner, ' class="dg-on"', box, `<rect class="dg-on" width="${r1(chain.w)}" height="${r1(chain.h)}" rx="${B.radius}"/>`)}</g>`;
      const label = chain.labels[n] ?? String(n);
      const no = write(
        undefined,
        cls("dg-try-no", label),
        B.padX,
        chain.noBaseline - chain.top,
        label,
        TYPE.tryBlockNo,
      );
      record(
        label,
        hasWide(label) ? sansOf(TYPE.tryBlockNo) : TYPE.tryBlockNo,
        moved.rests,
        B.padX,
        chain.noBaseline - chain.top,
      );
      const prevs = moments.map((mo) => (blockOf(mo, n)?.prev ?? "").slice(0, 4));
      const hashes = moments.map((mo) => (blockOf(mo, n)?.hash ?? "").slice(0, 4));
      const caption = `<text class="dg-try-cap" x="${B.padX}" y="${r1(chain.captionBaseline - chain.top)}">SHA-256</text>`;
      record("SHA-256", TYPE.tryCaption, moved.rests, B.padX, chain.captionBaseline - chain.top);
      return `<g class="dg-a" data-block="${n}" data-chain="${esc(chain.id)}" style="${moved.style}">${frame}${ring}${no}${row(chain.prevY - chain.top, "prev", prevs, false, moved.rests)}${caption}${row(chain.hashY - chain.top, "hash", hashes, true, moved.rests)}</g>`;
    });

    // つながり。後ろのブロックの左上を原点に、前のブロックの hash の行の右端から後ろのブロックの prev の行の左端まで引く
    const hashMid = chain.hashY - chain.top + B.row / 2;
    const prevMid = chain.prevY - chain.top + B.row / 2;
    const midX = -B.gap / 2;
    const elbow = pathOf([
      [-B.gap - B.padX, hashMid],
      [midX, hashMid],
      [midX, prevMid],
      [B.padX, prevMid],
    ]);
    const badge = T.link.badge;
    const badgeY = (hashMid + prevMid) / 2;
    const links = numbers
      .filter((n) => n > 1)
      .map((n) => {
        const key = blockKey(chain.id, n);
        const before = blockKey(chain.id, n - 1);
        const positions = moments.map((mo) =>
          mo.blocks[before] ? (mo.blocks[key] ?? null) : null,
        );
        const moved = track(positions);
        const status = moments.map((mo, k) => (positions[k] ? (blockOf(mo, n)?.link ?? "ok") : ""));
        const phases = phasesOf(status).filter((p) => p.value !== "");
        const kinds = [...new Set(phases.map((p) => p.value))];
        const variant = (kind: string): string => {
          const broken = kind === "broken";
          const ranges: Shown[] = phases.filter((p) => p.value === kind).map((p) => [p.from, p.to]);
          const anim =
            kinds.length > 1
              ? ` class="dg-a" style="${cs(broken ? T.color.broken : T.color.part)};${shownKf(ranges)}"`
              : ` style="${cs(broken ? T.color.broken : T.color.part)}"`;
          const symbol = broken ? "≠" : "=";
          return (
            `<g data-link-state="${kind}"${anim}><path class="dg-try-ln" d="${elbow}"/>` +
            `<rect class="dg-try-lb" x="${r1(midX - badge / 2)}" y="${r1(badgeY - badge / 2)}" width="${badge}" height="${badge}" rx="${partRadius(ctx.corner, C.radius)}"/>` +
            `<text class="dg-try-lt" x="${r1(midX)}" y="${r1(badgeY + LOOK.baseline.label)}" text-anchor="middle">${symbol}</text></g>`
          );
        };
        return `<g class="dg-a" data-link="${n - 1}-${n}" data-chain="${esc(chain.id)}" style="${moved.style}">${kinds.map(variant).join("")}</g>`;
      });

    // 畳んだ印。畳んだ数ごとに字を替え、畳んだブロックが無い間は出さない
    const counts = moments.map((mo) => {
      const list = mo.state.chains[chain.id] ?? [];
      return list.filter((b) => !b.shown).length;
    });
    const foldPhases = phasesOf(counts).filter((p) => p.value > 0);
    const fold =
      foldPhases.length === 0
        ? ""
        : `<g data-fold="${esc(chain.id)}">${foldPhases
            .map((p) => {
              const text = chain.folds[p.value] ?? String(p.value);
              const w =
                textBox(text, 0, 0, hasWide(text) ? sansOf(TYPE.tryHint) : TYPE.tryHint).w +
                T.fold.padX * 2;
              const x = chain.fold.right - w;
              const rect = { x, y: chain.fold.y, w, h: T.fold.h };
              const label = write(
                ctx.ink,
                cls("dg-try-ft", text),
                x + T.fold.padX,
                chain.fold.y + T.fold.h / 2 + LOOK.baseline.tag,
                text,
                hasWide(text) ? sansOf(TYPE.tryHint) : TYPE.tryHint,
                [[p.from, p.to]],
              );
              return `<g class="dg-a" style="${shownKf([[p.from, p.to]])}">${frameShape(ctx.corner, ' class="dg-try-fold"', rect, `<rect class="dg-try-fold" x="${r1(x)}" y="${r1(rect.y)}" width="${r1(w)}" height="${T.fold.h}" rx="${partRadius(ctx.corner, C.radius)}"/>`)}${label}</g>`;
            })
            .join("")}</g>`;
    return `<g data-chain-row="${esc(chain.id)}" style="${cs(T.color.part)}">${blocks.join("")}${links.join("")}${fold}</g>`;
  }
}
