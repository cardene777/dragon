/**
 * 2つの軸で置く図の置き場所 (#3622)。見た目の元は step 2 で本人が選んだ動く試作の案A (矢印の軸で 4 つの区画に分け、左に並べた札を段ごとに区画へ動かす)。
 *
 * 左から、置く前の一覧、縦の軸、2 行 2 列の区画の順に並べ、区画の下に横の軸を引く。区画は box を書いた順に左上、右上、左下、右下に置く。
 * 1 行目の軸は横の軸で、区画の下を左から右へ引き、2 行目の軸は縦の軸で、区画の左を下から上へ引く。どちらも矢印の先が大きい側になる。
 * 軸の字は軸の外に、小さい側の字を始まりの端、大きい側の字を矢印の先の端、名前を真ん中に置く。縦の軸の字は軸に沿わせて回す。
 * 課題の札は item を書いた順に、置く前の一覧に上から並べる。区画へ置いた札は、その区画に着いた順に区画の名前の下へ上から積み、
 * 札が区画から別の区画へ移っても、空いた所を詰めない。区画は全ての札を積める高さにし、4 つの区画の幅と高さを揃える。
 * 段の番号は、その段で最初に札を置いた区画の右上に置き、札を置かない段は置く前の一覧の右上に置く。
 */
import { textWidth } from "../../layout/measure";
import { besideSameSpot, type Layout, type Point, type Rect, type SceneBadge } from "../../layout/scene";
import { MATRIX_LOOK, MATRIX_TYPE } from "../../look/matrix";
import { type ColorKey, LOOK } from "../../look/values";
import type { DiagramModel } from "../../schema";
import type { NotationLang } from "../../words";

/** 置く前の一覧の題 */
const LIST_TITLE: Readonly<Record<NotationLang, string>> = { ja: "まだ置いていない", en: "Not placed yet" };

/** 並べた区画。`spot` は区画の場所で、左上が 0、右上が 1、左下が 2、右下が 3 */
export interface MatrixArea extends Rect {
  id: string;
  name: string;
  sub?: string;
  color: ColorKey;
  spot: number;
}

/** 軸の字。`at` は字の基準線の上の点で、縦の軸の字はこの点を軸に回す */
export interface MatrixAxisText {
  text: string;
  at: Point;
  anchor: "start" | "middle" | "end";
}

/** 並べた軸。`dir` は横 (`x`) か縦 (`y`)。`line` は小さい側の端から大きい側の矢印の先まで */
export interface MatrixAxisPlaced {
  dir: "x" | "y";
  name: string;
  from?: string;
  to?: string;
  line: [Point, Point];
  texts: MatrixAxisText[];
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

export interface MatrixLayout extends Layout {
  kind: "matrix";
  areas: MatrixArea[];
  axes: MatrixAxisPlaced[];
  list: Rect & { title: string };
  cards: MatrixCard[];
}

/** 字 `text` を字の形 `style` で書いた幅。無い字は 0 */
const widthOf = (text: string | undefined, style: (typeof MATRIX_TYPE)[keyof typeof MATRIX_TYPE]): number => (text === undefined ? 0 : textWidth(text, style));

/** 字の行の真ん中 `centre` に、字の形 `size` の字を置く基準線 */
const baseOf = (centre: number, size: number): number => centre + size * MATRIX_LOOK.baseline;

export function layoutMatrix(diagram: DiagramModel, lang: NotationLang): MatrixLayout {
  const M = MATRIX_LOOK;
  const T = MATRIX_TYPE;
  const R = LOOK.badge.r;
  const items = diagram.matrix?.items ?? [];
  const [xAxis = { name: "" }, yAxis = { name: "" }] = diagram.matrix?.axes ?? [];
  const boxes = diagram.boxes;

  // 区画へ置く出来事を書いた順に並べ、区画ごとに着いた順の席を数える
  const moves: { step: number; event: number; area: string; item: string }[] = diagram.steps.flatMap((step, s) =>
    step.events.flatMap((e, i) => (e.type === "line" && "box" in e ? e.items.map((item) => ({ step: s, event: i, area: e.box, item })) : [])),
  );
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
  const texts = (axis: { name: string; from?: string; to?: string }, place: (anchor: MatrixAxisText["anchor"], size: number) => Point): MatrixAxisText[] => [
    ...(axis.from !== undefined ? [{ text: axis.from, at: place("start", T.end.size), anchor: "start" as const }] : []),
    { text: axis.name, at: place("middle", T.axis.size), anchor: "middle" as const },
    ...(axis.to !== undefined ? [{ text: axis.to, at: place("end", T.end.size), anchor: "end" as const }] : []),
  ];
  const axes: MatrixAxisPlaced[] = [
    {
      dir: "x",
      ...xAxis,
      line: [
        [left, lineY],
        [right, lineY],
      ],
      texts: texts(xAxis, (anchor, size) => [anchor === "start" ? left : anchor === "end" ? right : (left + right) / 2, baseOf(rowY, size)]),
    },
    {
      dir: "y",
      ...yAxis,
      line: [
        [lineX, bottom],
        [lineX, top],
      ],
      // 縦の軸の字は左へ 90 度回すので、回した後の字の真ん中を列の真ん中に揃え、回す前の始まりを下の端に置く
      texts: texts(yAxis, (anchor, size) => [baseOf(columnX, size), anchor === "start" ? bottom : anchor === "end" ? top : (top + bottom) / 2]),
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
