/**
 * 試す図 (`try`、#3337) の置き場所と段ごとの状態。見た目の元は承認した板 (網を上に、待ち行列と、prev と hash を `=` でつないだ機械の列を下に置く形)。
 *
 * 部品は書いた順に上から積む。網 (`route`) は節を列に並べ、送る側 (`from`) を左端、作る人 (`to`) を右端に置き、
 * ほかの節は書いた道の中の何番目かの最も大きい番号の列に置く。待ち行列 (`queue`) はチップを縦に積み、縦に収まる数 (`most`) を持つ。
 * 機械の列 (`chain`) は新しい方から `TRY_LOOK.shown` 個のブロックを左から古い順に並べ、それより古いブロックは畳んだ印にまとめる。
 * 枠の幅 (`width`) を渡し、横に並べると字が `READABLE_PX` に届かない時は、枠の幅で縦に組む (#3366)。網の節は枠の幅に詰め、
 * 待ち行列は枠の幅いっぱいに置き、ブロックは上から古い順に積む。見た目の元は `docs/design/interactive/tx-block-narrow.pen` の案A。
 * 記録の列 (`log`、#3441) は機械の列と同じく新しい方から `TRY_LOOK.shown` 個の記録を並べ、記録は番号と印と、中のチップの名前と欄の値の行を持つ。
 * 記録の中のチップは記録が行として描くので、記録の列に入ったチップは図の上に置き場所を持たない。
 * 入力の帯 (`ask`) と釦 (`press`) は頁の部品 (再生の部品) が描くので、図の上に置き場所を持たない。
 *
 * 段ごとの状態 (`states`) と出来事ごとの状態 (`moments`) は、記法を読む所と同じ手順 (`try-state.ts`) で作る。
 * 出来事ごとの状態には、その時のチップとブロックの左上の位置と、網を運ばれたチップが通る点を添え、描く部品がこれを辿って動かす。
 */
import { TRY_LOOK } from "../../look/try";
import { LOOK, READABLE_PX, TYPE } from "../../look/values";
import type { DiagramModel, TryPart } from "../../schema";
import { askFields, intoOf, type TryState, TryRun } from "../../try-state";
import { TRY_TEXT } from "../../try-text";
import { DEFAULT_LANG, LABEL_MOST, type NotationLang } from "../../words";
import { textWidth } from "../../layout/measure";
import type { Layout, Point, Rect } from "../../layout/scene";

const T = TRY_LOOK;
const C = T.chip;
const B = T.block;
const L = T.record;

/** 図の上に置き場所を持つ部品。`most` は待ち行列だけが持つ */
export interface TryPartPlaced {
  id: string;
  type: "route" | "queue" | "chain" | "log";
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
 * 機械の列。ブロックは同じ大きさで、`slots` は古い順のブロックの左上 (横に並べた形は左から、縦に組んだ形は上から)。`top` は最初のブロックの上端で、
 * `noBaseline` は番号の字の基準線、`prevY` と `hashY` は prev と hash の行の上端、`chipTop` は最初のチップの上端、`captionBaseline` は SHA-256 の字の基準線。
 * `fold` は畳んだ印の右端と上端。`labels` はブロックの番号ごとの字、`folds` は畳んだ数ごとの字
 */
export interface TryChainPlaced {
  id: string;
  title: TryTitle;
  top: number;
  h: number;
  w: number;
  slots: Point[];
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
 * 記録の列 (#3441)。記録は同じ大きさで、`slots` は古い順の記録の左上 (横に並べた形は左から、縦に組んだ形は上から)。`top` は最初の記録の上端で、
 * `noBaseline` は番号の字の基準線、`markY` は印の札の上端、`rowTop` は最初の行の上端。`mark` は印の札の幅で、`all` を持たない記録の列は持たない。
 * `field` は行に出す欄の位置 (`all` の欄か、待ち行列が並べる順の欄)。`fold` は畳んだ印の右端と上端。`labels` は記録の番号ごとの字、`folds` は畳んだ数ごとの字
 */
export interface TryLogPlaced {
  id: string;
  title: TryTitle;
  top: number;
  h: number;
  w: number;
  slots: Point[];
  noBaseline: number;
  markY: number;
  mark?: number;
  rowTop: number;
  field?: number;
  fold: { right: number; y: number };
  labels: Record<number, string>;
  folds: Record<number, string>;
}

/**
 * 出来事を当てた後の時点。`step` と `event` は出来事の場所で、最初の時点 (何も起きる前) は -1 を持つ。
 * `chips` はチップの左上 (出ていなければ `null`)、`blocks` は `<機械の列>/<番号>` ごとのブロックの左上 (畳んだか、まだ無ければ `null`)。
 * `trip` はこの出来事で網を運ばれたチップと、通る節の真ん中にチップを置く左上の並び、`built` はこの出来事で足したブロック。
 * `records` は `<記録の列>/<番号>` ごとの記録の左上、`logged` はこの出来事で足した記録で、記録の列を持たない図は持たない (#3441)
 */
export interface TryMoment {
  step: number;
  event: number;
  state: TryState;
  chips: Record<string, Point | null>;
  blocks: Record<string, Point | null>;
  records?: Record<string, Point | null>;
  trip?: { item: string; route: string; points: Point[] };
  built?: { chain: string; number: number };
  logged?: { log: string; number: number };
}

export interface TryLayout extends Layout {
  kind: "try";
  /** 部品を広い枠の形で並べたか (`row`)、狭い枠の形で縦に組んだか (`stack`) (#3366) */
  arrangement: "row" | "stack";
  /** 図の上に置き場所を持つ部品 (網、待ち行列、機械の列) の四角。書いた順に上から積む */
  parts: TryPartPlaced[];
  /** 段ごとの、その段の出来事を全て当てた後の状態 */
  states: TryState[];
  moments: TryMoment[];
  routes: TryRoutePlaced[];
  queues: TryQueuePlaced[];
  chains: TryChainPlaced[];
  /** 記録の列。記録の列を持たない図は持たない (#3441) */
  logs?: TryLogPlaced[];
  /** チップの大きさ */
  chip: { w: number; h: number };
  /** チップに出す値の欄の位置 (入力の帯の欄の順)。待ち行列が並べる順の欄を持たなければ持たない */
  valueField?: number;
  /** チップごとの、図に出す名前 (`LABEL_MOST` 字まで) */
  names: Record<string, string>;
}

/** 全体図に描く試す図の部品の四角。`band` は待ち行列の枠のような地、そうでなければ節やブロックのような札 */
export interface TryOverviewShape {
  rect: Rect;
  band: boolean;
  color: (typeof TRY_LOOK.color)[keyof typeof TRY_LOOK.color];
}

const bottomOf = (r: Rect): number => r.y + r.h;

/** チップの名前を図に出す字数までに切る */
const cut = (text: string): string => [...text].slice(0, LABEL_MOST).join("");

/** ブロックの鍵 */
export const blockKey = (chain: string, number: number): string => `${chain}/${number}`;

/** 記録の鍵 (#3441) */
export const recordKey = (log: string, number: number): string => `${log}/${number}`;

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

/** 図の上に置き場所を持つ部品 (網、待ち行列、機械の列、記録の列) */
type PlacedPart = Extract<TryPart, { type: "route" | "queue" | "chain" | "log" }>;
type LogPart = Extract<TryPart, { type: "log" }>;

/** 試す図を並べる時の設定。`width` は描く枠の幅で、渡すと横に並べた形の字が読めない幅で縦に組む (#3366) */
export interface TryOptions {
  width?: number;
}

export function layoutTry(
  diagram: DiagramModel,
  lang: NotationLang = DEFAULT_LANG,
  options: TryOptions = {},
): TryLayout {
  const words = TRY_TEXT[lang];
  const spec = diagram.try ?? { parts: [], items: [] };
  const fields = askFields(spec.parts);
  const run = new TryRun(spec);
  const most = run.most;

  // 出来事を 1 つずつ当て、段ごとの状態と出来事ごとの状態を作る
  type Raw = Omit<TryMoment, "chips" | "blocks" | "records" | "trip"> & { tripItem?: string };
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
        ...(applied.record ? { logged: applied.record } : {}),
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

  // 記録の幅は、番号と印の札が並ぶ幅と、チップの名前と欄の値の行が入る幅 (#3441)
  const logParts = spec.parts.filter((p): p is LogPart => p.type === "log");
  const logField = (part: LogPart): number | undefined => {
    const at = part.all ? fields.indexOf(part.all.field) : -1;
    return at >= 1 ? at : valueField;
  };
  const markWidth = (part: LogPart): number | undefined =>
    part.all
      ? L.markPadX * 2 + Math.max(...[part.all.yes, part.all.no].map((t) => textWidth(t, TYPE.tryChipValue)))
      : undefined;
  const recordW = (part: LogPart): number => {
    const field = logField(part);
    let rowValueW = 0;
    if (field !== undefined)
      for (const raw of raws)
        for (const row of Object.values(raw.state.items))
          rowValueW = Math.max(rowValueW, textWidth(row[field] ?? "", TYPE.tryChipValue));
    const rowW = C.padX * 2 + nameW + (field === undefined ? 0 : C.valueGap + rowValueW);
    const labels = raws.flatMap((raw) => (raw.state.logs?.[part.id] ?? []).map((r) => textWidth(words.tryRecord(r.number), TYPE.tryBlockNo)));
    const head = Math.max(0, ...labels) + (part.all ? L.headGap + (markWidth(part) ?? 0) : 0);
    return Math.max(L.w, rowW + B.padX * 2, head + B.padX * 2);
  };
  const logW = new Map(logParts.map((p) => [p.id, recordW(p)]));
  const logRowW = (id: string): number => T.shown * (logW.get(id) ?? L.w) + (T.shown - 1) * L.gap;
  const titles = spec.parts
    .filter((p) => p.type === "route" || p.type === "queue" || p.type === "chain" || p.type === "log")
    .map((p) => textWidth(p.id, TYPE.tryTitle));
  const wide = Math.max(
    T.width,
    T.margin * 2 + T.shown * blockW + (T.shown - 1) * B.gap,
    T.margin * 2 + Math.max(0, ...titles),
    ...logParts.map((p) => T.margin * 2 + logRowW(p.id)),
  );
  const frame = options.width;
  /** 幅 `w` の図を枠に縮めても箱の名前の字が読める大きさに届くか。枠を渡さない時は縮めない */
  const readable = (w: number): boolean => frame === undefined || (frame / w) * TYPE.boxName.size >= READABLE_PX;
  const stacked = !readable(wide);

  // 待ち行列の横に出す、釦が上から何件を取り出すかの字と、その字が要る幅
  const hintTextOf = (id: string): string | undefined => {
    const press = spec.parts.find(
      (p): p is Extract<TryPart, { type: "press" }> => p.type === "press" && p.from === id,
    );
    return press ? words.tryTakes(press.take) : undefined;
  };
  const hintWidth = (text: string | undefined): number =>
    text === undefined ? 0 : T.queue.hintGap + textWidth(text, TYPE.tryHint);

  // side の行 (#3429)。同じ行に置いた時に部品が要る幅は、待ち行列はチップの列と字と題、機械の列は出すブロック、網は節の名札が重ならない間
  const placedParts = spec.parts.filter(
    (p): p is PlacedPart => p.type === "route" || p.type === "queue" || p.type === "chain" || p.type === "log",
  );
  const needOf = (part: PlacedPart): number => {
    const title = textWidth(part.id, TYPE.tryTitle);
    if (part.type === "queue") return Math.max(T.queue.padX * 2 + chipW + hintWidth(hintTextOf(part.id)), title);
    if (part.type === "chain") return Math.max(T.shown * blockW + (T.shown - 1) * B.gap, title);
    if (part.type === "log") return Math.max(logRowW(part.id), title);
    const labels = columnsOf(part).map((list) => Math.max(...list.map((id) => textWidth(id, TYPE.tryNode))));
    const apart = labels.slice(1).reduce((sum, w, c) => sum + ((labels[c] ?? 0) + w) / 2 + T.route.labelGap, 0);
    return Math.max(T.route.padX * 2 + apart, title);
  };
  const sideRows = (spec.sides ?? []).map((row) =>
    row.flatMap((id) => placedParts.filter((p) => p.id === id)),
  );
  const rowNeed = (row: PlacedPart[]): number =>
    row.reduce((sum, p) => sum + needOf(p), 0) + (row.length - 1) * T.gap;
  const sideWide = Math.max(wide, ...sideRows.map((row) => T.margin * 2 + rowNeed(row)));
  // 横に並べると字が読める大きさより小さくなる枠では、side の行を持たない時と同じ形にする
  const side = !stacked && sideRows.length > 0 && readable(sideWide);
  // 縦に組んだ形は枠の幅で描く。ブロックと右に回すつながりの印と部品の題が入る幅より狭い枠では、その幅で描く
  const width =
    stacked && frame !== undefined
    ? Math.max(
        frame,
        T.margin * 2 + blockW + B.side + T.link.badge / 2,
        T.margin * 2 + Math.max(0, ...titles),
        ...logParts.map((p) => T.margin * 2 + (logW.get(p.id) ?? L.w)),
      )
    : side
      ? sideWide
      : wide;
  const inner = width - T.margin * 2;

  // 部品を書いた順に行へまとめる。side の行の部品は、その中で最初に書いた部品の所に side の行の順で 1 つの行にまとめる
  const rowOf = new Map((side ? sideRows : []).flatMap((row) => row.map((p) => [p.id, row] as const)));
  const lines: PlacedPart[][] = [];
  const lined = new Set<string>();
  for (const part of placedParts) {
    if (lined.has(part.id)) continue;
    const line = rowOf.get(part.id) ?? [part];
    for (const p of line) lined.add(p.id);
    lines.push(line);
  }
  // 行の部品の幅。待ち行列は要る幅だけを取り、残りを網と機械の列に等しく分ける
  const spansOf = (line: PlacedPart[]): number[] => {
    if (line.length === 1) return [inner];
    const flexible = line.filter((p) => p.type !== "queue").length;
    const extra = inner - rowNeed(line);
    return line.map((p) => needOf(p) + (flexible === 0 ? extra / line.length : p.type === "queue" ? 0 : extra / flexible));
  };

  const parts: TryPartPlaced[] = [];
  const routes: TryRoutePlaced[] = [];
  const queues: TryQueuePlaced[] = [];
  const chains: TryChainPlaced[] = [];
  const logs: TryLogPlaced[] = [];
  let y: number = T.margin;
  const titleOf = (id: string, top: number, left: number): TryTitle => ({
    text: id,
    x: left,
    baseline: top + T.head.titleY,
  });
  for (const line of lines) {
    if (parts.length > 0) y += T.gap;
    const top = y;
    const body = top + T.head.body;
    const spans = spansOf(line);
    let left: number = T.margin;
    let lowest = top;
    for (const [k, part] of line.entries()) {
      const span = spans[k] ?? inner;
      if (part.type === "route") {
        const R = T.route;
        const columns = columnsOf(part);
        const lane = lanesOf(part, columns);
        const nodes: TryNodePlaced[] = columns.flatMap((list, c) =>
          list.map((id) => {
            const x =
              columns.length === 1
                ? left + span / 2
                : left + R.padX + (c * (span - R.padX * 2)) / (columns.length - 1);
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
        routes.push({ id: part.id, title: titleOf(part.id, top, left), nodes, links });
        parts.push({
          id: part.id,
          type: "route",
          rect: { x: left, y: top, w: span, h: bottom - top },
        });
        lowest = Math.max(lowest, bottom);
      } else if (part.type === "queue") {
        const Q = T.queue;
        const hintText = hintTextOf(part.id);
        const hintW = hintWidth(hintText);
        const track = most * pitch - C.gap;
        const box = {
          x: left,
          y: body,
          w: stacked ? span : Math.min(span, Q.padX * 2 + chipW + hintW),
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
          title: titleOf(part.id, top, left),
          box,
          slots,
          ...(hint ? { hint } : {}),
        });
        parts.push({
          id: part.id,
          type: "queue",
          rect: { x: left, y: top, w: box.w, h: bottomOf(box) - top },
          most,
        });
        lowest = Math.max(lowest, bottomOf(box));
      } else if (part.type === "log") {
        const w = logW.get(part.id) ?? L.w;
        const records = raws.flatMap((raw) => raw.state.logs?.[part.id] ?? []);
        const rows = Math.max(1, ...records.map((r) => r.items.length));
        const head = part.all ? T.fold.h : B.noH;
        const noBaseline = body + B.padTop + head / 2 + TYPE.tryBlockNo.size * 0.35;
        const rowTop = body + B.padTop + head + B.rowGap;
        const h = rowTop + rows * pitch - C.gap + B.padBottom - body;
        const numbers = new Set(records.map((r) => r.number));
        const folded = new Set(
          raws.map((raw) => Math.max(0, (raw.state.logs?.[part.id] ?? []).length - T.shown)),
        );
        const field = logField(part);
        const mark = markWidth(part);
        logs.push({
          id: part.id,
          title: titleOf(part.id, top, left),
          top: body,
          h,
          w,
          slots: Array.from({ length: T.shown }, (_, n): Point =>
            stacked ? [left, body + n * (h + L.gap)] : [left + n * (w + L.gap), body],
          ),
          noBaseline,
          markY: body + B.padTop,
          ...(mark !== undefined ? { mark } : {}),
          rowTop,
          ...(field !== undefined ? { field } : {}),
          fold: {
            right: left + span,
            y: top + T.head.titleY - TYPE.tryTitle.size * 0.35 - T.fold.h / 2,
          },
          labels: Object.fromEntries([...numbers].map((n) => [n, words.tryRecord(n)])),
          folds: Object.fromEntries(
            [...folded].filter((n) => n > 0).map((n) => [n, words.tryFoldedRecords(n)]),
          ),
        });
        const bottom = stacked ? body + T.shown * h + (T.shown - 1) * L.gap : body + h;
        parts.push({ id: part.id, type: "log", rect: { x: left, y: top, w: span, h: bottom - top } });
        lowest = Math.max(lowest, bottom);
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
          title: titleOf(part.id, top, left),
          top: body,
          h,
          w: blockW,
          slots: Array.from({ length: T.shown }, (_, n): Point =>
            stacked ? [left, body + n * (h + B.gap)] : [left + n * (blockW + B.gap), body],
          ),
          noBaseline,
          prevY,
          chipTop,
          captionBaseline,
          hashY,
          // 畳んだ印は題の行の右端に、題の字の真ん中の高さで置く
          fold: {
            right: left + span,
            y: top + T.head.titleY - TYPE.tryTitle.size * 0.35 - T.fold.h / 2,
          },
          labels: Object.fromEntries([...numbers].map((n) => [n, words.tryBlock(n)])),
          folds: Object.fromEntries(
            [...folded].filter((n) => n > 0).map((n) => [n, words.tryFolded(n)]),
          ),
        });
        // 縦に組んだ形は出すブロックの数だけ席を積み、ブロックが足りない間も高さを変えない
        const bottom = stacked ? body + T.shown * h + (T.shown - 1) * B.gap : body + h;
        parts.push({
          id: part.id,
          type: "chain",
          rect: { x: left, y: top, w: span, h: bottom - top },
        });
        lowest = Math.max(lowest, bottom);
      }
      left += span + T.gap;
    }
    y = lowest;
  }

  // 出来事ごとのチップとブロックの左上。待ち行列の席か、出ているブロックの中の席に置く
  const queueOf = new Map(queues.map((q) => [q.id, q]));
  const chainOf = new Map(chains.map((c) => [c.id, c]));
  const routeOf = new Map(routes.map((r) => [r.id, r]));
  const logOf = new Map(logs.map((l) => [l.id, l]));
  const moments: TryMoment[] = raws.map(({ tripItem, ...raw }) => {
    const chips: Record<string, Point | null> = {};
    const blocks: Record<string, Point | null> = {};
    const records: Record<string, Point | null> = {};
    // 記録の中のチップは記録が行として描くので、チップの置き場所は持たない
    for (const [id, list] of Object.entries(raw.state.logs ?? {})) {
      const l = logOf.get(id);
      const first = list.length - list.filter((r) => r.shown).length;
      list.forEach((record, i) => {
        const slot = record.shown && l ? l.slots[i - first] : undefined;
        records[recordKey(id, record.number)] = slot === undefined ? null : [slot[0], slot[1]];
      });
    }
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
        const slot = block.shown && c ? c.slots[i - first] : undefined;
        blocks[blockKey(id, block.number)] = slot === undefined || !c ? null : [slot[0], slot[1]];
        if (slot === undefined || !c) return;
        block.items.forEach((item, k) => {
          chips[item] = [slot[0] + B.padX, slot[1] + (c.chipTop - c.top) + k * pitch];
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
      ...(logs.length > 0 ? { records } : {}),
      ...(trip && points.length > 0
        ? { trip: { item: trip.item, route: trip.route, points } }
        : {}),
    };
  });

  return {
    kind: "try",
    arrangement: stacked ? "stack" : "row",
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
    ...(logs.length > 0 ? { logs } : {}),
    chip: { w: chipW, h: C.h },
    ...(valueField !== undefined ? { valueField } : {}),
    names,
  };
}

/**
 * 寄って追う窓が段 `step` で見る所 (#3337)。その段の出来事が触る部品の四角を、出来事が着く所から順に並べる。
 * 窓は最初の四角を外さずに全部を囲んだ所へ寄るので、最初の四角は読み手が結果を見る所にする。
 * 送った段は送った先の待ち行列と網、釦を押した段は作ったブロックと取り出した待ち行列、
 * 書き換えた段は書き換えたチップのブロックと次のブロックとのつながり、`line` は書いた待ち行列とブロック (待ち行列を先) を見る。
 * ブロックはその段の終わりの位置で見て、畳んだブロックは見ない
 */
export function tryFocusParts(layout: TryLayout, diagram: DiagramModel, step: number): Rect[] {
  const moments = layout.moments.filter((mo) => mo.step === step);
  const end = moments[moments.length - 1];
  if (!end) return [];
  const parts = diagram.try?.parts ?? [];
  const partRect = (id: string | undefined): Rect | undefined =>
    layout.parts.find((p) => p.id === id)?.rect;
  const blockRect = (chain: string, number: number): Rect | undefined => {
    const c = layout.chains.find((x) => x.id === chain);
    const at = end.blocks[blockKey(chain, number)];
    return c && at ? { x: at[0], y: at[1], w: c.w, h: c.h } : undefined;
  };
  const recordRect = (log: string, number: number): Rect | undefined => {
    const l = layout.logs?.find((x) => x.id === log);
    const at = end.records?.[recordKey(log, number)];
    return l && at ? { x: at[0], y: at[1], w: l.w, h: l.h } : undefined;
  };
  /** 窓から外さない所の候補、`line` がブロックに書いた所、続けて見る所 */
  const lead: Rect[] = [];
  const lines: Rect[] = [];
  const rest: Rect[] = [];
  const push = (list: Rect[], rect: Rect | undefined): void => {
    if (rect) list.push(rect);
  };
  (diagram.steps[step]?.events ?? []).forEach((event, k) => {
    const mo = moments.find((x) => x.event === k);
    const built = mo?.built
      ? blockRect(mo.built.chain, mo.built.number)
      : mo?.logged
        ? recordRect(mo.logged.log, mo.logged.number)
        : undefined;
    if (event.type === "line" && "part" in event) {
      if (built) lines.push(built);
      else push(lead, partRect(event.part));
    } else if (event.type === "ask") {
      const ask = parts.find((p): p is Extract<TryPart, { type: "ask" }> => p.type === "ask");
      push(lead, partRect(ask ? intoOf(ask, event.values, (id) => parts.some((p) => p.id === id)) : undefined));
      if (mo?.trip) push(rest, partRect(mo.trip.route));
    } else if (event.type === "press") {
      const press = parts.find(
        (p): p is Extract<TryPart, { type: "press" }> => p.type === "press" && p.id === event.press,
      );
      push(lead, built);
      push(rest, partRect(press?.from));
    } else if (event.type === "item") {
      const [chain, block] =
        Object.entries(end.state.chains).flatMap(([id, list]) =>
          list.filter((b) => b.items.includes(event.item)).map((b) => [id, b] as const),
        )[0] ?? [];
      const here = chain !== undefined && block ? blockRect(chain, block.number) : undefined;
      if (chain !== undefined && block && here) {
        lead.push(here);
        const next = blockRect(chain, block.number + 1);
        // つながりの印は、横に並べた形ではこのブロックの右端と次のブロックの左端の間に在り、
        // 縦に組んだ形ではこのブロックの下の端と次のブロックの上の端の間の、ブロックの右に在る
        if (next)
          rest.push(
            layout.arrangement === "stack"
              ? { x: here.x + here.w, y: here.y + here.h, w: B.side + T.link.badge / 2, h: next.y - here.y - here.h }
              : { x: here.x + here.w, y: here.y, w: next.x - here.x - here.w, h: here.h },
          );
      } else {
        const queue = Object.entries(end.state.queues).find(([, list]) =>
          list.includes(event.item),
        )?.[0];
        push(lead, partRect(queue));
      }
    }
  });
  return [...lead, ...lines, ...rest];
}

/** 全体図に描く試す図の部品 (#3337)。網の節と待ち行列の枠と、最後の時点に出ているブロックと記録 */
export function tryOverview(layout: TryLayout): TryOverviewShape[] {
  const color = T.color.part;
  const last = layout.moments[layout.moments.length - 1];
  const r = T.route.r;
  return [
    ...layout.queues.map((q) => ({ rect: q.box, band: true, color })),
    ...layout.routes.flatMap((route) =>
      route.nodes.map((n) => ({
        rect: { x: n.x - r, y: n.y - r, w: r * 2, h: r * 2 },
        band: false,
        color,
      })),
    ),
    ...layout.chains.flatMap((c) =>
      (last?.state.chains[c.id] ?? []).flatMap((b) => {
        const at = last?.blocks[blockKey(c.id, b.number)];
        return at ? [{ rect: { x: at[0], y: at[1], w: c.w, h: c.h }, band: false, color }] : [];
      }),
    ),
    ...(layout.logs ?? []).flatMap((l) =>
      (last?.state.logs?.[l.id] ?? []).flatMap((r) => {
        const at = last?.records?.[recordKey(l.id, r.number)];
        return at ? [{ rect: { x: at[0], y: at[1], w: l.w, h: l.h }, band: false, color }] : [];
      }),
    ),
  ];
}
