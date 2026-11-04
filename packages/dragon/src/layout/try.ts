/**
 * 試す図 (`try`、#3337) の置き場所と段ごとの状態。見た目の元は承認した板 (網を上に、待ち行列と、prev と hash を `=` でつないだ機械の列を下に置く形)。
 *
 * 部品は書いた順に上から積む。網 (`route`) は節を列に並べ、送る側 (`from`) を左端、作る人 (`to`) を右端に置き、
 * ほかの節は書いた道の中の何番目かの最も大きい番号の列に置く。待ち行列 (`queue`) はチップを縦に積み、縦に収まる数 (`most`) を持つ。
 * 機械の列 (`chain`) は新しい方から `TRY_LOOK.shown` 個のブロックを左から古い順に並べ、それより古いブロックは畳んだ印にまとめる。
 * 入力の帯 (`ask`) と釦 (`press`) は頁の部品 (再生の部品) が描くので、図の上に置き場所を持たない。
 *
 * 段ごとの状態 (`states`) と出来事ごとの状態 (`moments`) は、記法を読む所と同じ手順 (`try-state.ts`) で作る。
 * 出来事ごとの状態には、その時のチップとブロックの左上の位置と、網を運ばれたチップが通る点を添え、描く部品がこれを辿って動かす。
 */
import { FIGURE_TEXT } from "../figure-text";
import { TRY_LOOK } from "../look/try";
import { LOOK, TYPE } from "../look/values";
import type { DiagramModel, TryPart } from "../schema";
import { askFields, type TryState, TryRun } from "../try-state";
import { DEFAULT_LANG, LABEL_MOST, type NotationLang } from "../words";
import { textWidth } from "./measure";
import type { Layout, Point, Rect } from "./scene";

const T = TRY_LOOK;
const C = T.chip;
const B = T.block;

/** 図の上に置き場所を持つ部品。`most` は待ち行列だけが持つ */
export interface TryPartPlaced {
  id: string;
  type: "route" | "queue" | "chain";
  rect: Rect;
  most?: number;
}

/** 網の節。`end` は送る側 (`from`) か作る人 (`to`) */
export interface TryNodePlaced {
  id: string;
  x: number;
  y: number;
  end?: "from" | "to";
}

/** 網の節どうしの線。丸の縁から縁まで */
export interface TryNetLink {
  a: string;
  b: string;
  points: Point[];
}

/** 部品の題。`x` は左端、`baseline` は基準線 */
export interface TryTitle {
  text: string;
  x: number;
  baseline: number;
}

export interface TryRoutePlaced {
  id: string;
  title: TryTitle;
  nodes: TryNodePlaced[];
  links: TryNetLink[];
}

/** 待ち行列。`slots` は上から順のチップの席、`hint` は釦が上から何件を取り出すかの字 */
export interface TryQueuePlaced {
  id: string;
  title: TryTitle;
  box: Rect;
  slots: Rect[];
  hint?: TryTitle;
}

/**
 * 機械の列。ブロックは同じ高さで、`slots` は左から順のブロックの左端。`top` はブロックの上端で、
 * `noBaseline` は番号の字の基準線、`prevY` と `hashY` は prev と hash の行の上端、`chipTop` は最初のチップの上端、`captionBaseline` は SHA-256 の字の基準線。
 * `fold` は畳んだ印の右端と上端。`labels` はブロックの番号ごとの字、`folds` は畳んだ数ごとの字
 */
export interface TryChainPlaced {
  id: string;
  title: TryTitle;
  top: number;
  h: number;
  w: number;
  slots: number[];
  noBaseline: number;
  prevY: number;
  chipTop: number;
  captionBaseline: number;
  hashY: number;
  fold: { right: number; y: number };
  labels: Record<number, string>;
  folds: Record<number, string>;
}

/**
 * 出来事を当てた後の時点。`step` と `event` は出来事の場所で、最初の時点 (何も起きる前) は -1 を持つ。
 * `chips` はチップの左上 (出ていなければ `null`)、`blocks` は `<機械の列>/<番号>` ごとのブロックの左上 (畳んだか、まだ無ければ `null`)。
 * `trip` はこの出来事で網を運ばれたチップと、通る節の真ん中にチップを置く左上の並び、`built` はこの出来事で足したブロック
 */
export interface TryMoment {
  step: number;
  event: number;
  state: TryState;
  chips: Record<string, Point | null>;
  blocks: Record<string, Point | null>;
  trip?: { item: string; route: string; points: Point[] };
  built?: { chain: string; number: number };
}

export interface TryLayout extends Layout {
  kind: "try";
  /** 図の上に置き場所を持つ部品 (網、待ち行列、機械の列) の四角。書いた順に上から積む */
  parts: TryPartPlaced[];
  /** 段ごとの、その段の出来事を全て当てた後の状態 */
  states: TryState[];
  moments: TryMoment[];
  routes: TryRoutePlaced[];
  queues: TryQueuePlaced[];
  chains: TryChainPlaced[];
  /** チップの大きさ */
  chip: { w: number; h: number };
  /** チップに出す値の欄の位置 (入力の帯の欄の順)。待ち行列が並べる順の欄を持たなければ持たない */
  valueField?: number;
  /** チップごとの、図に出す名前 (`LABEL_MOST` 字まで) */
  names: Record<string, string>;
}

const bottomOf = (r: Rect): number => r.y + r.h;

/** チップの名前を図に出す字数までに切る */
const cut = (text: string): string => [...text].slice(0, LABEL_MOST).join("");

/** ブロックの鍵 */
export const blockKey = (chain: string, number: number): string => `${chain}/${number}`;

/**
 * 網の節の列。送る側を 0 列、作る人を最後の列に置き、ほかの節は書いた道の中の何番目かの最も大きい番号の列に置く。
 * 送る側でない道の頭の節も 1 列より左には置かない
 */
function columnsOf(route: Extract<TryPart, { type: "route" }>): string[][] {
  const order: string[] = [];
  const column = new Map<string, number>();
  for (const path of route.paths)
    path.forEach((node, i) => {
      if (!order.includes(node)) order.push(node);
      column.set(node, Math.max(column.get(node) ?? 0, node === route.from ? 0 : Math.max(1, i)));
    });
  column.set(route.from, 0);
  const others = order.filter((node) => node !== route.to);
  const last = Math.max(1, ...others.map((node) => (column.get(node) ?? 0) + 1));
  column.set(route.to, Math.max(last, column.get(route.to) ?? 0));
  const count = Math.max(...column.values()) + 1;
  const columns: string[][] = Array.from({ length: count }, () => []);
  for (const node of order) columns[column.get(node) ?? 0]?.push(node);
  return columns.filter((list) => list.length > 0);
}

/**
 * 網の節の段。1 本の道だけが通る節はその道の段に、2 本以上の道が通る節は真ん中の段に置く。
 * 列を飛ばす線が飛ばした列の節の上を通らないように、道ごとに段を分ける。
 * 同じ列の節の段が 1 段より近づく時は、その列だけ真ん中から上下へ並べる
 */
function lanesOf(
  route: Extract<TryPart, { type: "route" }>,
  columns: string[][],
): Map<string, number> {
  const ways = new Map<string, number[]>();
  route.paths.forEach((path, p) =>
    path.forEach((node) => {
      const list = ways.get(node) ?? [];
      if (!list.includes(p)) list.push(p);
      ways.set(node, list);
    }),
  );
  const tall = Math.max(route.paths.length, ...columns.map((list) => list.length));
  const middle = (tall - 1) / 2;
  const shift = (tall - route.paths.length) / 2;
  const lane = new Map<string, number>();
  for (const list of columns) {
    const wish = list.map((node) => {
      const way = ways.get(node) ?? [];
      return way.length === 1 ? shift + (way[0] ?? 0) : middle;
    });
    const sorted = [...wish].sort((a, b) => a - b);
    const apart = sorted.every((at, i) => i === 0 || at - (sorted[i - 1] ?? at) >= 1);
    list.forEach((node, k) =>
      lane.set(node, apart ? (wish[k] ?? middle) : middle + k - (list.length - 1) / 2),
    );
  }
  return lane;
}

export function layoutTry(diagram: DiagramModel, lang: NotationLang = DEFAULT_LANG): TryLayout {
  const words = FIGURE_TEXT[lang];
  const spec = diagram.try ?? { parts: [], items: [] };
  const fields = askFields(spec.parts);
  const run = new TryRun(spec);
  const most = run.most;

  // 出来事を 1 つずつ当て、段ごとの状態と出来事ごとの状態を作る
  type Raw = Omit<TryMoment, "chips" | "blocks" | "trip"> & { tripItem?: string };
  const raws: Raw[] = [{ step: -1, event: -1, state: run.state() }];
  const states: TryState[] = [];
  diagram.steps.forEach((step, s) => {
    run.beginStep();
    step.events.forEach((event, k) => {
      const applied = run.apply(event);
      const state = run.state();
      const tripItem =
        applied.chip !== undefined && state.trips.some((t) => t.item === applied.chip)
          ? applied.chip
          : undefined;
      raws.push({
        step: s,
        event: k,
        state,
        ...(tripItem !== undefined ? { tripItem } : {}),
        ...(applied.block ? { built: applied.block } : {}),
      });
    });
    states.push(run.state());
  });

  // チップの名前と、待ち行列が並べる順の欄の値で、チップの幅を決める
  const orders = spec.parts
    .flatMap((p) => (p.type === "queue" && p.order !== undefined ? [fields.indexOf(p.order)] : []))
    .filter((at) => at >= 1);
  const valueField = orders[0];
  const names: Record<string, string> = {};
  let nameW = 0;
  let valueW = 0;
  for (const raw of raws)
    for (const [id, row] of Object.entries(raw.state.items)) {
      names[id] = cut(row[0] ?? id);
      nameW = Math.max(nameW, textWidth(names[id] ?? "", TYPE.tryChip));
      if (valueField !== undefined)
        valueW = Math.max(valueW, textWidth(row[valueField] ?? "", TYPE.tryChipValue));
    }
  const chipW = Math.max(
    C.minW,
    C.padX * 2 + nameW + (valueField === undefined ? 0 : C.valueGap + valueW),
  );
  const pitch = C.h + C.gap;

  // ブロックの幅は、チップと prev と hash の行が入る幅
  const rowText =
    textWidth("prev", TYPE.tryRowKey) +
    B.keyGap +
    textWidth("0000", TYPE.tryRowValue) +
    B.rowPad * 2;
  const blockW = Math.max(B.w, chipW + B.padX * 2, rowText + B.padX * 2);
  const titles = spec.parts
    .filter((p) => p.type === "route" || p.type === "queue" || p.type === "chain")
    .map((p) => textWidth(p.id, TYPE.tryTitle));
  const width = Math.max(
    T.width,
    T.margin * 2 + T.shown * blockW + (T.shown - 1) * B.gap,
    T.margin * 2 + Math.max(0, ...titles),
  );
  const inner = width - T.margin * 2;

  const parts: TryPartPlaced[] = [];
  const routes: TryRoutePlaced[] = [];
  const queues: TryQueuePlaced[] = [];
  const chains: TryChainPlaced[] = [];
  let y: number = T.margin;
  const titleOf = (id: string, top: number): TryTitle => ({
    text: id,
    x: T.margin,
    baseline: top + T.head.titleY,
  });
  for (const part of spec.parts) {
    if (part.type !== "route" && part.type !== "queue" && part.type !== "chain") continue;
    if (parts.length > 0) y += T.gap;
    const top = y;
    const body = top + T.head.body;
    if (part.type === "route") {
      const R = T.route;
      const columns = columnsOf(part);
      const lane = lanesOf(part, columns);
      const nodes: TryNodePlaced[] = columns.flatMap((list, c) =>
        list.map((id) => {
          const x =
            columns.length === 1
              ? T.margin + inner / 2
              : T.margin + R.padX + (c * (inner - R.padX * 2)) / (columns.length - 1);
          const cy = body + R.r + (lane.get(id) ?? 0) * R.pitch;
          return {
            id,
            x,
            y: cy,
            ...(id === part.from
              ? { end: "from" as const }
              : id === part.to
                ? { end: "to" as const }
                : {}),
          };
        }),
      );
      const at = new Map(nodes.map((n) => [n.id, n]));
      const links: TryNetLink[] = [];
      for (const path of part.paths)
        path.forEach((a, i) => {
          const b = path[i + 1];
          if (
            b === undefined ||
            links.some((l) => (l.a === a && l.b === b) || (l.a === b && l.b === a))
          )
            return;
          const p = at.get(a) as TryNodePlaced;
          const q = at.get(b) as TryNodePlaced;
          const len = Math.hypot(q.x - p.x, q.y - p.y) || 1;
          const ux = (q.x - p.x) / len;
          const uy = (q.y - p.y) / len;
          links.push({
            a,
            b,
            points: [
              [p.x + ux * R.r, p.y + uy * R.r],
              [q.x - ux * R.r, q.y - uy * R.r],
            ],
          });
        });
      const bottom = Math.max(...nodes.map((n) => n.y)) + R.labelY + R.bottom;
      routes.push({ id: part.id, title: titleOf(part.id, top), nodes, links });
      parts.push({
        id: part.id,
        type: "route",
        rect: { x: T.margin, y: top, w: inner, h: bottom - top },
      });
      y = bottom;
    } else if (part.type === "queue") {
      const Q = T.queue;
      const press = spec.parts.find(
        (p): p is Extract<TryPart, { type: "press" }> => p.type === "press" && p.from === part.id,
      );
      const hintText = press ? words.tryTakes(press.take) : undefined;
      const hintW = hintText === undefined ? 0 : Q.hintGap + textWidth(hintText, TYPE.tryHint);
      const track = most * pitch - C.gap;
      const box = {
        x: T.margin,
        y: body,
        w: Math.min(inner, Q.padX * 2 + chipW + hintW),
        h: Q.padY * 2 + track,
      };
      const slots = Array.from({ length: most }, (_, k) => ({
        x: box.x + Q.padX,
        y: box.y + Q.padY + k * pitch,
        w: chipW,
        h: C.h,
      }));
      const hint =
        hintText === undefined
          ? undefined
          : {
              text: hintText,
              x: box.x + Q.padX + chipW + Q.hintGap,
              baseline: box.y + Q.padY + C.h / 2 + LOOK.baseline.tag,
            };
      queues.push({
        id: part.id,
        title: titleOf(part.id, top),
        box,
        slots,
        ...(hint ? { hint } : {}),
      });
      parts.push({
        id: part.id,
        type: "queue",
        rect: { x: T.margin, y: top, w: box.w, h: bottomOf(box) - top },
        most,
      });
      y = bottomOf(box);
    } else {
      const rows = Math.max(
        1,
        ...raws.flatMap((raw) => (raw.state.chains[part.id] ?? []).map((b) => b.items.length)),
      );
      const noBaseline = body + B.padTop + TYPE.tryBlockNo.size * 0.8;
      const prevY = body + B.padTop + B.noH + B.rowGap;
      const chipTop = prevY + B.row + B.rowGap;
      const rowsBottom = chipTop + rows * pitch - C.gap;
      const captionBaseline = rowsBottom + B.rowGap + B.sha * 0.75;
      const hashY = rowsBottom + B.rowGap + B.sha;
      const h = hashY + B.row + B.padBottom - body;
      const numbers = new Set(
        raws.flatMap((raw) => (raw.state.chains[part.id] ?? []).map((b) => b.number)),
      );
      const folded = new Set(
        raws.map((raw) => Math.max(0, (raw.state.chains[part.id] ?? []).length - T.shown)),
      );
      chains.push({
        id: part.id,
        title: titleOf(part.id, top),
        top: body,
        h,
        w: blockW,
        slots: Array.from({ length: T.shown }, (_, k) => T.margin + k * (blockW + B.gap)),
        noBaseline,
        prevY,
        chipTop,
        captionBaseline,
        hashY,
        // 畳んだ印は題の行の右端に、題の字の真ん中の高さで置く
        fold: {
          right: T.margin + inner,
          y: top + T.head.titleY - TYPE.tryTitle.size * 0.35 - T.fold.h / 2,
        },
        labels: Object.fromEntries([...numbers].map((n) => [n, words.tryBlock(n)])),
        folds: Object.fromEntries(
          [...folded].filter((n) => n > 0).map((n) => [n, words.tryFolded(n)]),
        ),
      });
      parts.push({
        id: part.id,
        type: "chain",
        rect: { x: T.margin, y: top, w: inner, h: body + h - top },
      });
      y = body + h;
    }
  }

  // 出来事ごとのチップとブロックの左上。待ち行列の席か、出ているブロックの中の席に置く
  const queueOf = new Map(queues.map((q) => [q.id, q]));
  const chainOf = new Map(chains.map((c) => [c.id, c]));
  const routeOf = new Map(routes.map((r) => [r.id, r]));
  const moments: TryMoment[] = raws.map(({ tripItem, ...raw }) => {
    const chips: Record<string, Point | null> = {};
    const blocks: Record<string, Point | null> = {};
    for (const id of Object.keys(raw.state.items)) chips[id] = null;
    for (const [id, list] of Object.entries(raw.state.queues)) {
      const q = queueOf.get(id);
      list.forEach((item, k) => {
        const slot = q?.slots[k];
        if (slot) chips[item] = [slot.x, slot.y];
      });
    }
    for (const [id, list] of Object.entries(raw.state.chains)) {
      const c = chainOf.get(id);
      const first = list.length - list.filter((b) => b.shown).length;
      list.forEach((block, i) => {
        const x = block.shown && c ? c.slots[i - first] : undefined;
        blocks[blockKey(id, block.number)] = x === undefined || !c ? null : [x, c.top];
        if (x === undefined || !c) return;
        block.items.forEach((item, k) => {
          chips[item] = [x + B.padX, c.chipTop + k * pitch];
        });
      });
    }
    const trip =
      tripItem === undefined ? undefined : raw.state.trips.find((t) => t.item === tripItem);
    const route = trip ? routeOf.get(trip.route) : undefined;
    const points =
      trip && route
        ? trip.path.flatMap((node): Point[] => {
            const n = route.nodes.find((x) => x.id === node);
            return n ? [[n.x - chipW / 2, n.y - C.h / 2]] : [];
          })
        : [];
    return {
      ...raw,
      chips,
      blocks,
      ...(trip && points.length > 0
        ? { trip: { item: trip.item, route: trip.route, points } }
        : {}),
    };
  });

  return {
    kind: "try",
    width,
    height: y + T.margin,
    regions: [],
    boxes: [],
    lifelines: [],
    edges: [],
    labels: [],
    actions: [],
    // 段の番号は頁の部品 (再生の部品) が段の題と一緒に出すので、図の中には置かない
    badges: [],
    paths: [],
    ends: [],
    parts,
    states,
    moments,
    routes,
    queues,
    chains,
    chip: { w: chipW, h: C.h },
    ...(valueField !== undefined ? { valueField } : {}),
    names,
  };
}
