/**
 * 2つの軸で置く図の置き場所 (#3622)。見た目の元は step 2 で本人が選んだ動く試作の案A (矢印の軸で 4 つの区画に分け、左に並べた札を段ごとに区画へ動かす)。
 *
 * 左から、置く前の一覧、縦の軸、2 行 2 列の区画の順に並べ、区画の下に横の軸を引く。区画は box を書いた順に左上、右上、左下、右下に置く。
 * 1 行目の軸は横の軸で、区画の下を左から右へ引き、2 行目の軸は縦の軸で、区画の左を下から上へ引く。どちらも矢印の先が大きい側になる。
 * 軸の字は軸の外に、小さい側の字を始まりの端、大きい側の字を矢印の先の端、名前を真ん中に置く。縦の軸の字は軸に沿わせて回す。
 * 課題の札は item を書いた順に、置く前の一覧に上から並べる。区画へ置いた札は、その区画に着いた順に区画の名前の下へ上から積み、
 * 札が区画から別の区画へ移っても、空いた所を詰めない。区画は全ての札を積める高さにし、4 つの区画の幅と高さを揃える。
 * 段の番号は、その段で最初に札を置いた区画の右上に置き、札を置かない段は置く前の一覧の右上に置く。
 * 区画を書かない `line: <課題>` の行 (#3637) の札は、課題の点数から決まる区画 (`blocks/matrix-item/spot.ts`) へ置く。
 * `reverse` の軸 (#3637) は矢印の先を左か下にし、小さい側の字を右か上の端、大きい側の字を左か下の端に置く。
 * 図の種類の行に `[shape: scatter]` を書いた図は、点数で点を打つ見た目 (`layoutScatter`) で並べる。見た目の元は #3622 の step 2 で本人が選ばなかった動く試作の案B
 * (目盛りの軸に点数どおりの点を打ち、軸から引いた線で値を読む)。
 * 左から、置く前の課題の表、縦の軸の名前と目盛りの数、点の図の枠の順に並べ、枠の下に横の軸の目盛りの数と名前を置く。
 * 点の図の枠は 0 から 10 の目盛りで、課題を点数どおりの所に打つ。点数が大きいほど右と上で、`reverse` の軸は左と下になる。
 * 区画は枠を真ん中で 4 つに分けた四角で、box を書いた順に左上、右上、左下、右下に置く。課題の区画は点数から決まる (`blocks/matrix-item/spot.ts`)。
 * 同じ点数の課題は 1 つの点にまとめ、打った段の順に名前を点の横へ上から並べる。名前は点が入る区画の中で、ほかの字と真ん中の線と、縦の軸から点へ引く線に重ならない所に置く。
 * 表は課題を書いた順に上から並べ、横と縦の点数を列に書く。図の種類の行に `table: none` を書いた図は表を出さず、表の分の幅を点の図の枠に回す。
 * 狭い枠 (`width`) に横に並ばない時は、表を上に置き、点の図の枠を枠の幅いっぱいに下へ積む。
 * 段の番号は、その段で打つ課題の表の行の左に置き、課題を打たない段は表の題の右に置く。表を出さない図は、打った点の区画の角のうち区画の名前と点に重ならない角に置き、打たない段は点の図の枠の角に置く。
 */
import { textWidth } from "../../layout/measure";
import { besideSameSpot, type Layout, type Point, type Rect, type SceneBadge } from "../../layout/scene";
import { MATRIX_LOOK, MATRIX_TYPE } from "../../look/matrix";
import { type ColorKey, LOOK } from "../../look/values";
import { spotOf } from "../../blocks/matrix-item/spot";
import type { DiagramModel } from "../../schema";
import type { NotationLang } from "../../words";
import type { KindOptions } from "../parts";

/** 置く前の一覧の題 */
const LIST_TITLE: Readonly<Record<NotationLang, string>> = { ja: "まだ置いていない", en: "Not placed yet" };

/** 並べた区画。`spot` は区画の場所で、左上が 0、右上が 1、左下が 2、右下が 3。`label` は点数で点を打つ見た目の名前を置く所で、点と重なる名前は下の角へ移す */
export interface MatrixArea extends Rect {
  id: string;
  name: string;
  sub?: string;
  color: ColorKey;
  spot: number;
  label?: MatrixLabel;
}

/** 軸の字。`at` は字の基準線の上の点で、縦の軸の字はこの点を軸に回す */
export interface MatrixAxisText {
  text: string;
  at: Point;
  anchor: "start" | "middle" | "end";
}

/** 目盛り 1 つ。`from` から `to` へ引く短い線と、5 の倍数の目盛りの数 (`text`) */
export interface MatrixTick {
  from: Point;
  to: Point;
  text?: MatrixAxisText;
}

/** 並べた軸。`dir` は横 (`x`) か縦 (`y`)。`line` は小さい側の端から大きい側の矢印の先まで。`ticks` は点数で点を打つ見た目の目盛り */
export interface MatrixAxisPlaced {
  dir: "x" | "y";
  name: string;
  from?: string;
  to?: string;
  reverse?: boolean;
  line: [Point, Point];
  texts: MatrixAxisText[];
  ticks?: MatrixTick[];
}

/** 札を区画へ置く出来事。`step` と `event` は原本の出来事の番号、`x` と `y` は区画の中の札の左上 */
export interface MatrixMove {
  step: number;
  event: number;
  area: string;
  x: number;
  y: number;
  color: ColorKey;
}

/** 課題の札。四角は置く前の一覧の席で、`moves` は区画へ置いた順の出来事 */
export interface MatrixCard extends Rect {
  id: string;
  name: string;
  moves: MatrixMove[];
}

/**
 * 2つの軸で置く図の並べ方。札を置く見た目は置く前の一覧 (`list`) と札 (`cards`) を持ち、
 * 点数で点を打つ見た目 (`shape: "scatter"`) は札を持たず、点の図の枠と点と表 (`ScatterParts`) を持つ
 */
export interface MatrixLayout extends Layout, Partial<ScatterParts> {
  kind: "matrix";
  shape?: "scatter";
  areas: MatrixArea[];
  axes: MatrixAxisPlaced[];
  list?: Rect & { title: string };
  cards: MatrixCard[];
}

/** 課題を区画へ置く出来事 1 つ。区画を書かない行の課題は、点数から決まる区画にする */
export interface MatrixPlacement {
  step: number;
  event: number;
  area: string;
  item: string;
}

/** 段の中の、課題を区画へ置く出来事を書いた順に並べる。区画を書かない行の課題は点数から区画を決め、決まらない課題は外す */
export function placementsOf(diagram: DiagramModel): MatrixPlacement[] {
  const axes = diagram.matrix?.axes ?? [];
  const items = new Map((diagram.matrix?.items ?? []).map((item) => [item.id, item]));
  return diagram.steps.flatMap((step, s) =>
    step.events.flatMap((e, i) => {
      if (e.type !== "line" || "part" in e) return [];
      return e.items.flatMap((id) => {
        const item = items.get(id);
        const spot = item ? spotOf(item, axes) : undefined;
        const area = "box" in e ? e.box : spot === undefined ? undefined : diagram.boxes[spot]?.id;
        return area === undefined ? [] : [{ step: s, event: i, area, item: id }];
      });
    }),
  );
}

/** 軸の字を、小さい側と大きい側の端に置く。`reverse` の軸は小さい側を右か上の端、大きい側を左か下の端にする */
export function axisTexts(
  axis: { name: string; from?: string; to?: string; reverse?: boolean },
  place: (anchor: MatrixAxisText["anchor"], size: number) => Point,
  type: { name: { size: number }; end: { size: number } },
): MatrixAxisText[] {
  const [low, high] = axis.reverse ? (["end", "start"] as const) : (["start", "end"] as const);
  return [
    ...(axis.from !== undefined ? [{ text: axis.from, at: place(low, type.end.size), anchor: low }] : []),
    { text: axis.name, at: place("middle", type.name.size), anchor: "middle" as const },
    ...(axis.to !== undefined ? [{ text: axis.to, at: place(high, type.end.size), anchor: high }] : []),
  ];
}

/** 字 `text` を字の形 `style` で書いた幅。無い字は 0 */
const widthOf = (text: string | undefined, style: (typeof MATRIX_TYPE)[keyof typeof MATRIX_TYPE]): number => (text === undefined ? 0 : textWidth(text, style));

/** 字の行の真ん中 `centre` に、字の形 `size` の字を置く基準線 */
const baseOf = (centre: number, size: number): number => centre + size * MATRIX_LOOK.baseline;

export function layoutMatrix(diagram: DiagramModel, lang: NotationLang, options: KindOptions = {}): MatrixLayout {
  if (diagram.matrix?.shape === "scatter") return layoutScatter(diagram, lang, options.width);
  const M = MATRIX_LOOK;
  const T = MATRIX_TYPE;
  const R = LOOK.badge.r;
  const items = diagram.matrix?.items ?? [];
  const [xAxis = { name: "" }, yAxis = { name: "" }] = diagram.matrix?.axes ?? [];
  const boxes = diagram.boxes;

  // 区画へ置く出来事を書いた順に並べ、区画ごとに着いた順の席を数える
  const moves = placementsOf(diagram);
  const seats = new Map<string, number>(boxes.map((box) => [box.id, 0]));
  const seatOf = moves.map((move) => {
    const seat = seats.get(move.area) ?? 0;
    seats.set(move.area, seat + 1);
    return seat;
  });
  const most = Math.max(0, ...seats.values());

  // 札の幅は一番広い名前に揃える。一覧でも区画でも同じ幅の札にし、動いても形を変えない
  const cardW = Math.max(0, ...items.map((item) => textWidth(item.name, T.card))) + M.card.padL + M.card.padR;
  const stack = (n: number): number => (n === 0 ? 0 : n * M.card.h + (n - 1) * M.card.gap);
  const badgeRoom = R * 2 + M.badge.inset;
  const title = LIST_TITLE[lang];

  // 区画の幅。札と、名前と段の番号と、下の字が収まる幅。横の軸の字が収まる幅
  const subbed = boxes.some((box) => box.sub !== undefined);
  const head = M.area.head + (subbed ? M.area.subH : 0);
  // 軸の長さの下限。名前を真ん中に、両端の字を端に置き、字どうしの間を `apart` だけ空ける
  const fit = (axis: { name: string; from?: string; to?: string }): number =>
    widthOf(axis.name, T.axis) + 2 * Math.max(widthOf(axis.from, T.end), widthOf(axis.to, T.end)) + 4 * M.axis.apart;
  const areaW = Math.max(
    M.area.minW,
    cardW + M.area.padX * 2,
    ...boxes.map((box) => Math.max(textWidth(box.name, T.area), widthOf(box.sub, T.sub)) + M.area.padX * 2 + badgeRoom),
    (fit(xAxis) - M.area.gap) / 2,
  );
  const listNeed = M.list.head + stack(items.length) + M.list.below;
  const areaH = Math.max(M.area.minH, head + stack(most) + M.area.below, (listNeed - M.area.gap) / 2, (fit(yAxis) - M.area.gap) / 2);
  const listW = Math.max(cardW + M.list.padX * 2, textWidth(title, T.list) + M.list.padX * 2 + badgeRoom);

  // 横に、置く前の一覧、縦の軸の字の列、縦の軸の線、区画の順に並べる
  const top = M.pad;
  const list = { x: M.pad, y: top, w: listW, h: areaH * 2 + M.area.gap, title };
  const columnX = list.x + list.w + M.axis.gap + M.axis.column / 2;
  const lineX = columnX + M.axis.column / 2 + M.axis.text;
  const left = lineX + M.axis.gap;
  const right = left + areaW * 2 + M.area.gap;
  const bottom = top + list.h;
  const areas: MatrixArea[] = boxes.map((box, k) => ({
    id: box.id,
    name: box.name,
    ...(box.sub !== undefined ? { sub: box.sub } : {}),
    color: M.colors[k % M.colors.length] as ColorKey,
    spot: k,
    x: left + (k % 2) * (areaW + M.area.gap),
    y: top + Math.floor(k / 2) * (areaH + M.area.gap),
    w: areaW,
    h: areaH,
  }));
  const areaOf = new Map(areas.map((a) => [a.id, a]));

  // 横の軸は区画の下を左から右へ、縦の軸は区画の左を下から上へ引く。字は軸の外に置く
  const lineY = bottom + M.axis.gap;
  const rowY = lineY + M.axis.text + M.axis.row / 2;
  const type = { name: T.axis, end: T.end };
  // `reverse` の軸は矢印の向きを逆にし、大きい側の端を左か下にする
  const xLine: [Point, Point] = [
    [left, lineY],
    [right, lineY],
  ];
  const yLine: [Point, Point] = [
    [lineX, bottom],
    [lineX, top],
  ];
  const axes: MatrixAxisPlaced[] = [
    {
      dir: "x",
      ...xAxis,
      line: xAxis.reverse ? [xLine[1], xLine[0]] : xLine,
      texts: axisTexts(xAxis, (anchor, size) => [anchor === "start" ? left : anchor === "end" ? right : (left + right) / 2, baseOf(rowY, size)], type),
    },
    {
      dir: "y",
      ...yAxis,
      line: yAxis.reverse ? [yLine[1], yLine[0]] : yLine,
      // 縦の軸の字は左へ 90 度回すので、回した後の字の真ん中を列の真ん中に揃え、回す前の始まりを下の端に置く
      texts: axisTexts(yAxis, (anchor, size) => [baseOf(columnX, size), anchor === "start" ? bottom : anchor === "end" ? top : (top + bottom) / 2], type),
    },
  ];

  // 課題の札。一覧の席は書いた順に上から、区画の席は着いた順に区画の名前の下から
  const cards: MatrixCard[] = items.map((item, k) => ({
    id: item.id,
    name: item.name,
    x: list.x + M.list.padX,
    y: list.y + M.list.head + k * (M.card.h + M.card.gap),
    w: cardW,
    h: M.card.h,
    moves: [],
  }));
  const cardOf = new Map(cards.map((c) => [c.id, c]));
  moves.forEach((move, k) => {
    const area = areaOf.get(move.area);
    const card = cardOf.get(move.item);
    if (!area || !card) return;
    const seat = seatOf[k] ?? 0;
    card.moves.push({ step: move.step, event: move.event, area: area.id, x: area.x + M.area.padX, y: area.y + head + seat * (M.card.h + M.card.gap), color: area.color });
  });

  // 段の番号。その段で最初に札を置いた区画の右上、札を置かない段は置く前の一覧の右上。同じ所の番号は入れ替える
  const corner = (r: Rect): Point => [r.x + r.w - M.badge.inset - R, r.y + M.badge.inset + R];
  const raw: SceneBadge[] = diagram.steps.map((_, s) => {
    const first = moves.find((move) => move.step === s);
    const area = first ? areaOf.get(first.area) : undefined;
    const [x, y] = corner(area ?? list);
    return { step: s, x, y, color: area?.color ?? M.idle };
  });
  const badges = besideSameSpot(raw, () => false, () => true);

  return {
    kind: "matrix",
    width: Math.ceil(right + M.pad),
    height: Math.ceil(rowY + M.axis.row / 2 + M.pad),
    regions: [],
    boxes: [],
    lifelines: [],
    edges: [],
    labels: [],
    actions: [],
    badges,
    paths: [],
    ends: [],
    areas,
    axes,
    list,
    cards,
  };
}

/** 置く前の課題の表の題と、課題の列の見出し */
const TABLE_TEXT: Readonly<Record<NotationLang, { title: string; item: string }>> = {
  ja: { title: "置く前の課題", item: "課題" },
  en: { title: "Tasks to place", item: "Task" },
};

/** 字を置く所。`x` は揃え方 `anchor` の端、`y` は 1 行目の字の基準線 */
export interface MatrixLabel {
  x: number;
  y: number;
  anchor: "start" | "end";
}

/** 打った点。同じ点数の課題は `ids` に打った段の順に並ぶ。`x` と `y` は点の真ん中、`area` は点が入る区画、`label` は名前を並べる所 */
export interface MatrixDot {
  ids: string[];
  names: string[];
  /** 名前ごとの、打った段と出来事の番号 */
  plots: { step: number; event: number }[];
  x: number;
  y: number;
  score: [number, number];
  area: string;
  color: ColorKey;
  label: MatrixLabel;
}

/** 置く前の課題の表の行。`score` は横と縦の点数の字、`plot` は課題を打つ段と出来事の番号 */
export interface MatrixRow extends Rect {
  id: string;
  name: string;
  score: [string, string];
  plot?: { step: number; event: number };
  color: ColorKey;
}

/** 置く前の課題の表。`cols` は課題と横の点数と縦の点数の列の字の始まり */
export interface MatrixTable extends Rect {
  title: string;
  heads: [string, string, string];
  cols: [number, number, number];
}

/** 点数で点を打つ見た目だけが持つ並べ方 */
export interface ScatterParts {
  plot: Rect;
  dots: MatrixDot[];
  table?: MatrixTable;
  rows?: MatrixRow[];
}

/** 区画の名前を置く所。左の区画は左の角に左揃えで、右の区画は右の角に右揃えで置き、真ん中の線から離す。`bottom` を立てると下の角に置く */
export function areaLabel(area: MatrixArea, bottom = false): MatrixLabel {
  const { padX, head } = MATRIX_LOOK.area;
  const right = area.spot % 2 === 1;
  const centre = bottom ? area.y + area.h - head / 2 : area.y + head / 2;
  return { x: right ? area.x + area.w - padX : area.x + padX, y: centre + MATRIX_TYPE.area.size * MATRIX_LOOK.baseline, anchor: right ? "end" : "start" };
}

/** 字の四角。`anchor` が `end` の字は `x` を右の端にする */
const boxOf = (x: number, y: number, w: number, size: number, anchor: MatrixLabel["anchor"]): Rect => ({ x: anchor === "end" ? x - w : x, y: y - size * 0.8, w, h: size });

/** 2 つの四角が重なるか */
const hits = (a: Rect, b: Rect): boolean => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;

/** 点数を書いた字。整数は小数点を付けない */
const scoreText = (value: number | undefined): string => (value === undefined ? "" : String(value));

export function layoutScatter(diagram: DiagramModel, lang: NotationLang, width?: number): MatrixLayout {
  const M = MATRIX_LOOK;
  const S = M.scatter;
  const T = MATRIX_TYPE;
  const R = LOOK.badge.r;
  const items = diagram.matrix?.items ?? [];
  const [xAxis = { name: "" }, yAxis = { name: "" }] = diagram.matrix?.axes ?? [];
  const xRev = xAxis.reverse === true;
  const yRev = yAxis.reverse === true;
  const showTable = diagram.matrix?.table !== "none";
  const text = TABLE_TEXT[lang];

  // 表の幅。段の番号の列、課題の名前の列、横と縦の点数の列
  const scoreW = Math.max(S.table.score, textWidth(xAxis.name, T.th) + S.table.padX, textWidth(yAxis.name, T.th) + S.table.padX);
  const nameW = Math.max(textWidth(text.item, T.th), ...items.map((item) => textWidth(item.name, T.td)));
  const tableNeed = Math.max(S.table.padX + S.table.badge + nameW + S.table.padX + scoreW * 2, textWidth(text.title, T.table) + S.table.padX * 2 + R * 2 + M.badge.inset);
  const tableH = S.table.head + S.table.cols + items.length * S.table.row + S.table.below;

  // 縦の軸の名前の列と目盛りの数の列と目盛りの幅。向きを変えた横の軸の矢印は縦の軸の左へ伸びるので、数を矢印の分だけ左へ離す
  const leftAxis = S.axis.name + S.axis.aside + S.axis.column + S.axis.gap + S.axis.major + (xRev ? S.axis.ext : 0);
  const rightRoom = xRev ? 0 : S.axis.ext;
  const topRoom = yRev ? 0 : S.axis.ext;

  // 横に並べた時の幅。表を出さない図は、表の分の幅を点の図の枠に回す
  const wideW = M.pad + tableNeed + S.table.gap + leftAxis + S.plot.w + rightRoom + M.pad;
  const narrow = width !== undefined && width < wideW;
  const stacked = showTable && narrow;

  let table: MatrixTable | undefined;
  let plot: Rect;
  if (stacked) {
    const frame = width;
    const tableW = Math.max(tableNeed, frame - M.pad * 2);
    table = { x: M.pad, y: M.pad, w: tableW, h: tableH, title: text.title, heads: [text.item, xAxis.name, yAxis.name], cols: [0, 0, 0] };
    const x = M.pad + leftAxis;
    const w = Math.max(S.plot.minW, frame - M.pad - rightRoom - x);
    plot = { x, y: table.y + tableH + S.table.stackGap + topRoom, w, h: Math.round(w * S.plot.narrow) };
  } else {
    const tableW = showTable ? tableNeed : 0;
    if (showTable) table = { x: M.pad, y: M.pad, w: tableW, h: tableH, title: text.title, heads: [text.item, xAxis.name, yAxis.name], cols: [0, 0, 0] };
    const x = M.pad + (showTable ? tableW + S.table.gap : 0) + leftAxis;
    // 表を出さない狭い枠は、点の図の枠を枠の幅に合わせて縮める
    const w = showTable ? S.plot.w : narrow ? Math.max(S.plot.minW, width - M.pad - rightRoom - x) : S.plot.w + tableNeed + S.table.gap;
    plot = { x, y: M.pad + topRoom, w, h: narrow ? Math.round(w * S.plot.narrow) : Math.max(S.plot.h, showTable ? tableH - topRoom : 0) };
  }
  if (table) {
    const right = table.x + table.w - S.table.padX;
    table.cols = [table.x + S.table.padX + S.table.badge, right - scoreW * 1.5, right - scoreW / 2];
  }

  // 点数から点の図の枠の中の所。`reverse` の軸は大きい値を左か下に置く
  const px = (v: number): number => plot.x + (plot.w * (xRev ? 10 - v : v)) / 10;
  const py = (v: number): number => plot.y + plot.h - (plot.h * (yRev ? 10 - v : v)) / 10;

  // 区画。点の図の枠を真ん中で 4 つに分け、書いた順に左上、右上、左下、右下に置く
  const halfW = plot.w / 2;
  const halfH = plot.h / 2;
  const areas: MatrixArea[] = diagram.boxes.map((box, k) => ({
    id: box.id,
    name: box.name,
    ...(box.sub !== undefined ? { sub: box.sub } : {}),
    color: M.colors[k % M.colors.length] as ColorKey,
    spot: k,
    x: plot.x + (k % 2) * halfW,
    y: plot.y + Math.floor(k / 2) * halfH,
    w: halfW,
    h: halfH,
  }));
  const areaOf = new Map(areas.map((a) => [a.id, a]));

  // 課題を打つ出来事。同じ課題は最初に打った段で打ち、点数を持たない課題は打たない
  const plotOf = new Map<string, { step: number; event: number; area: string }>();
  for (const p of placementsOf(diagram)) if (!plotOf.has(p.item)) plotOf.set(p.item, { step: p.step, event: p.event, area: p.area });
  const ordered = items
    .flatMap((item) => {
      const at = plotOf.get(item.id);
      return at && item.x !== undefined && item.y !== undefined ? [{ item, at, x: item.x, y: item.y }] : [];
    })
    .sort((a, b) => a.at.step - b.at.step || a.at.event - b.at.event);
  const dots: MatrixDot[] = [];
  for (const { item, at, x, y } of ordered) {
    const same = dots.find((d) => d.score[0] === x && d.score[1] === y);
    if (same) {
      same.ids.push(item.id);
      same.names.push(item.name);
      same.plots.push({ step: at.step, event: at.event });
      continue;
    }
    dots.push({
      ids: [item.id],
      names: [item.name],
      plots: [{ step: at.step, event: at.event }],
      x: px(x),
      y: py(y),
      score: [x, y],
      area: at.area,
      color: areaOf.get(at.area)?.color ?? M.idle,
      label: { x: 0, y: 0, anchor: "start" },
    });
  }

  // 区画の名前は上の角に置き、点と重なる時は下の角に置く
  const D = MATRIX_TYPE.dot;
  const dotBoxes = dots.map((d) => ({ x: d.x - S.dot.ring, y: d.y - S.dot.ring, w: S.dot.ring * 2, h: S.dot.ring * 2 }));
  const nameBox = (a: MatrixArea, at: MatrixLabel): Rect => boxOf(at.x, at.y, textWidth(a.name, T.area), T.area.size, at.anchor);
  for (const area of areas) {
    const top = areaLabel(area);
    area.label = top;
    if (dotBoxes.some((d) => hits(d, nameBox(area, top)))) {
      const bottom = areaLabel(area, true);
      if (!dotBoxes.some((d) => hits(d, nameBox(area, bottom)))) area.label = bottom;
    }
  }
  const areaNames = areas.map((a) => nameBox(a, a.label as MatrixLabel));

  // 表の無い図の段の番号は、その段で打った点の区画の角に置き、打たない段は点の図の枠の角に置く。
  // 角は右上、左上、右下、左下の順に探し、区画の名前と点に重ならない最初の角を選ぶ。右の区画の名前は右上に在るので、番号は左上に回る
  const badgeBox = ([x, y]: Point): Rect => ({ x: x - R, y: y - R, w: R * 2, h: R * 2 });
  const cornerOf = (r: Rect): Point => {
    const inset = M.badge.inset + R;
    const corners: Point[] = [
      [r.x + r.w - inset, r.y + inset],
      [r.x + inset, r.y + inset],
      [r.x + r.w - inset, r.y + r.h - inset],
      [r.x + inset, r.y + r.h - inset],
    ];
    return corners.find((c) => ![...areaNames, ...dotBoxes].some((b) => hits(b, badgeBox(c)))) ?? (corners[0] as Point);
  };
  const stepArea = (s: number): MatrixArea | undefined => {
    const first = ordered.find((o) => o.at.step === s);
    return first ? areaOf.get(first.at.area) : undefined;
  };
  const badgeAt: Point[] = showTable ? [] : diagram.steps.map((_, s) => cornerOf(stepArea(s) ?? plot));

  // 点の名前を置く所。点の右の横、点の真上、左の 1 行上、右の 1 行上、点の真下、左の 1 行下、右の 1 行下の順に探す。
  // 左の横は縦の軸からの線が、真下は横の軸からの線が名前を横切るので後に回す。真上と真下の名前は点の図の枠に収まるよう横にずらす。
  // ほかの点と名前と区画の名前と段の番号と真ん中の線に重ならない所を、点が入る区画の中、点の図の枠の中の順に選ぶ。
  // 無い時は真ん中の線に重なってよいとして枠の中で選び直し、それでも無い時は枠の中の最初に探した所に置く。字が図の外へはみ出すより、破線に重なるほうが読める
  const taken: Rect[] = [...areaNames, ...badgeAt.map(badgeBox), ...dots.map((d) => ({ x: d.x - S.dot.r - 2, y: d.y - S.dot.r - 2, w: S.dot.r * 2 + 4, h: S.dot.r * 2 + 4 }))];
  const mids: Rect[] = [
    { x: plot.x, y: plot.y + halfH - 1, w: plot.w, h: 2 },
    { x: plot.x + halfW - 1, y: plot.y, w: 2, h: plot.h },
  ];
  const within = (r: Rect, box: Rect): boolean => r.x >= box.x && r.x + r.w <= box.x + box.w && r.y >= box.y && r.y + r.h <= box.y + box.h;
  const line = S.dot.line;
  const rise = S.dot.ring + D.size / 2;
  for (const dot of dots) {
    const w = Math.max(...dot.names.map((name) => textWidth(name, D)));
    const lines = (dot.names.length - 1) * line;
    const own = areaOf.get(dot.area) ?? plot;
    // 真上と真下の名前の左の端。点の真ん中に揃え、点の図の枠の内に収める
    const centred = Math.min(Math.max(dot.x - w / 2, plot.x + S.dot.r), plot.x + plot.w - S.dot.r - w);
    const tries: [MatrixLabel["anchor"], number, number][] = [
      ["start", dot.x + S.dot.gap, 0],
      ["start", centred, -rise - lines],
      ["end", dot.x - S.dot.gap, -line],
      ["start", dot.x + S.dot.gap, -line],
      ["start", centred, rise],
      ["end", dot.x - S.dot.gap, line],
      ["start", dot.x + S.dot.gap, line],
    ];
    const placed = tries.map(([anchor, x, dy]): { label: MatrixLabel; rect: Rect } => {
      const label = { x, y: baseOf(dot.y + dy, D.size), anchor };
      const first = boxOf(label.x, label.y, w, D.size, anchor);
      return { label, rect: { ...first, h: first.h + lines } };
    });
    const clear = placed.filter((t) => !taken.some((r) => hits(r, t.rect)) && within(t.rect, plot));
    // 破線は字の端がかすめる程度なら読めるので、字の四角を左右に `graze` だけ縮めて重なりを数える
    const free = clear.filter((t) => !mids.some((r) => hits(r, { ...t.rect, x: t.rect.x + S.dot.graze, w: t.rect.w - S.dot.graze * 2 })));
    const pick = free.find((t) => within(t.rect, own)) ?? free[0] ?? clear[0] ?? placed.find((t) => within(t.rect, plot)) ?? (placed[0] as { label: MatrixLabel; rect: Rect });
    dot.label = pick.label;
    taken.push(pick.rect);
  }

  // 表の行。課題を書いた順に上から並べ、打つ課題は打つ区画の色にする
  const rows: MatrixRow[] | undefined = table
    ? items.map((item, k) => {
        const at = plotOf.get(item.id);
        return {
          id: item.id,
          name: item.name,
          score: [scoreText(item.x), scoreText(item.y)],
          ...(at ? { plot: { step: at.step, event: at.event } } : {}),
          color: (at ? areaOf.get(at.area)?.color : undefined) ?? M.idle,
          x: table.x + S.table.padX / 2,
          y: table.y + S.table.head + S.table.cols + k * S.table.row,
          w: table.w - S.table.padX,
          h: S.table.row,
        };
      })
    : undefined;

  // 軸。横の軸は枠の下の端を、縦の軸は枠の左の端を、小さい値の側から大きい値の側の矢印の先まで引く
  const bottom = plot.y + plot.h;
  const ext = S.axis.ext;
  const tickRowY = bottom + S.axis.major + S.axis.gap + (yRev ? ext : 0) + S.axis.row / 2;
  const nameRowY = tickRowY + S.axis.row / 2 + S.axis.aside + S.axis.name / 2;
  const numRight = plot.x - S.axis.major - S.axis.gap - (xRev ? ext : 0);
  const nameColX = numRight - S.axis.column - S.axis.aside - S.axis.name / 2;
  const type = { name: T.axis, end: T.end };
  const tick = (v: number): boolean => v % 5 === 0;
  const xTicks: MatrixTick[] = Array.from({ length: 11 }, (_, v) => ({
    from: [px(v), bottom],
    to: [px(v), bottom + (tick(v) ? S.axis.major : S.axis.minor)],
    ...(tick(v) ? { text: { text: String(v), at: [px(v), baseOf(tickRowY, T.tick.size)] as Point, anchor: "middle" as const } } : {}),
  }));
  const yTicks: MatrixTick[] = Array.from({ length: 11 }, (_, v) => ({
    from: [plot.x, py(v)],
    to: [plot.x - (tick(v) ? S.axis.major : S.axis.minor), py(v)],
    ...(tick(v) ? { text: { text: String(v), at: [numRight, baseOf(py(v), T.tick.size)] as Point, anchor: "end" as const } } : {}),
  }));
  const xLine: [Point, Point] = [
    [px(0), bottom],
    [px(10) + (xRev ? -ext : ext), bottom],
  ];
  const yLine: [Point, Point] = [
    [plot.x, py(0)],
    [plot.x, py(10) + (yRev ? ext : -ext)],
  ];
  const axes: MatrixAxisPlaced[] = [
    {
      dir: "x",
      ...xAxis,
      line: xLine,
      texts: axisTexts(xAxis, (anchor, size) => [anchor === "start" ? plot.x : anchor === "end" ? plot.x + plot.w : plot.x + plot.w / 2, baseOf(nameRowY, size)], type),
      ticks: xTicks,
    },
    {
      dir: "y",
      ...yAxis,
      line: yLine,
      // 縦の軸の字は左へ 90 度回すので、回した後の字の真ん中を列の真ん中に揃え、回す前の始まりを下の端に置く
      texts: axisTexts(yAxis, (anchor, size) => [baseOf(nameColX, size), anchor === "start" ? bottom : anchor === "end" ? plot.y : plot.y + plot.h / 2], type),
      ticks: yTicks,
    },
  ];

  // 段の番号。表の在る図は、その段で打つ課題の表の行の左、打たない段は表の題の右。表の無い図は、上で選んだ区画か枠の角
  const raw: SceneBadge[] = diagram.steps.map((_, s) => {
    const first = ordered.find((o) => o.at.step === s);
    const color = stepArea(s)?.color ?? M.idle;
    if (table) {
      const row = first ? rows?.find((r) => r.id === first.item.id) : undefined;
      if (row) return { step: s, x: table.x + S.table.padX + S.table.badge / 2, y: row.y + row.h / 2, color };
      return { step: s, x: table.x + table.w - M.badge.inset - R, y: table.y + S.table.head / 2, color };
    }
    const [x, y] = badgeAt[s] as Point;
    return { step: s, x, y, color };
  });
  const badges = besideSameSpot(raw, () => false, () => true);

  const height = Math.max(table ? table.y + table.h : 0, nameRowY + S.axis.name / 2) + M.pad;
  const right = Math.max(plot.x + plot.w + rightRoom, table ? table.x + table.w : 0) + M.pad;

  return {
    kind: "matrix",
    shape: "scatter",
    width: Math.ceil(narrow ? Math.max(width, right) : right),
    height: Math.ceil(height),
    regions: [],
    boxes: [],
    lifelines: [],
    edges: [],
    labels: [],
    actions: [],
    badges,
    paths: [],
    ends: [],
    areas,
    axes,
    cards: [],
    plot,
    dots,
    ...(table ? { table, rows } : {}),
  };
}
