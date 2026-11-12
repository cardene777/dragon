/**
 * 列の図の置き場所 (#3239)。卓の形 (#3351) の見た目の元は `docs/design/lineup/auction.pen` の 2 枚の板 (横に並べた形と、携帯の幅で縦に組んだ形)。
 *
 * 箱 (`box`) は宣言した順に左から並ぶ。`[order: none]` の箱は順番の無い置き場で、チップを格子に並べ、点線の枠で描く。
 * ほかの箱は札で、チップを `line` に書いた順に上から積み、札の下の端に `note` の字 (`sub` と段の中の `note`) を大きく出す。
 * どの札も同じ幅と高さにし、高さは札に積む最も多い枚数で決まる。置き場と札が隣り合う所には左から右へ向く矢印を置く。
 * 枠の幅 (`width`) を渡し、横に並べると箱の名前が `READABLE_PX` に届かない時は縦に組む。置き場を札の列の幅の帯にし、
 * 続いた札を 1 列にまとめ、宣言した順に上から積む。帯と札の列の間の矢印は上から下へ向く。
 *
 * 図の上に段の題と文 (`say`) を段ごとに出し、その下に役 (`role`) の札を並べる。札の下には `line` を書いた段にだけ出る一言を置く。
 * 一言は段の始まりに置き場に在ったチップと比べ、色付きのチップの席の番号、置き場に無かったチップを足したこと、置き場の色付きのチップが無いことを言う。
 * 一言の下に後の段の題を並べた「この先」の帯を、その下にチップの説明 (`item` の `note`) の凡例を置く。
 *
 * 段の中の `line` を書いた順に辿り、チップが席に居る間を 1 回ずつ `LineupSeat` にする。
 * 滑り始める所は、同じ箱に居たチップならその席、ほかの箱に居たチップなら段の始まりの居場所で、選んだ箱に居ればその席、なければ最後に座った席。
 * どの箱にも居なかったチップは滑り始める所を持たない。同じ席に残るチップは前の `LineupSeat` のまま続ける。
 * 元の箱を書き換えない時は元の席のチップも残る。元の箱を書き換えた時は、元の席の `until` に書き換えた出来事を書く。
 *
 * 原本の JSON が宣言していない箱とチップを書く時は、その箱とチップを除いて描く。同じ箱に同じチップを書く時は最初の 1 枚だけを描く。
 * 開いている箱への `open` と、封をした箱への `seal` は描かない。
 *
 * 段の番号は図の右上の同じ所に置き、次の段の番号と入れ替える。
 *
 * 層の見た目 (`[shape: layers]`、#3625) は箱を宣言した順に上から横の帯に重ね、帯の左に色の棒と層の名前と説明 (`sub`) を、その右に層の番号と印と札の列を置く。
 * 札 (チップ) は `line` を書いた段にその層の帯へ下り、`note` は書いた段からその層の帯に印を出して、次の `note` まで残す。層の間に矢印を置かない。
 * 横に並べると層の名前が `READABLE_PX` に届かない枠の幅では、帯の中で名前と説明の下に印と札の行を置いて縦に組む。
 */
import { type FigureText, FIGURE_TEXT } from "../../figure-text";
import { type ColorKey, LOOK, READABLE_PX, type TextStyle, TYPE } from "../../look/values";
import { LINEUP_LOOK } from "../../look/lineup";
import type { DiagramModel, DiagramEvent } from "../../schema";
import { DEFAULT_LANG, LANE_MOST, type NotationLang } from "../../words";
import { hasWide, textWidth } from "../../layout/measure";
import { besideSameSpot, boxColors, type Layout, layoutStrip, type Point, type Rect, type SceneBadge, type SceneBox, stripNeed } from "../../layout/scene";

const L = LINEUP_LOOK;
const Y = L.layers;
/** 1 行の字。`x` は左端、`baseline` は基準線 */
export interface TextLine {
  text: string;
  x: number;
  baseline: number;
}

/** 字。`text` は全文、`lines` は幅で折った行で、四角は全ての行の字の形を囲む */
export interface LineupText extends Rect {
  text: string;
  lines: TextLine[];
}

/**
 * 箱。ボードの帯か流れの線の駅 (#3624)、層の見た目の帯。`pool` は順番の無い置き場、`track` は札を置く所。
 * `hint` は置き場の「順番なし」の字で、`hintBox` はそれを囲む札。`limit` は書いた上限
 */
export interface LineupLane extends SceneBox {
  pool: boolean;
  title: LineupText;
  hint?: LineupText;
  hintBox?: Rect;
  limit?: number;
  track: Rect;
  /** 最初に出る値 (`note`) の字。値を持たない帯は持たない */
  note?: LineupText;
  /** 流れの線の、上限を書いた駅の受け口。札の席と同じ所に上限の数だけ並ぶ。ほかの帯は空 */
  slots: Rect[];
}

/** 段の出来事の場所 */
export interface LineupAt {
  step: number;
  event: number;
}

/** チップが箱の席に居る間 1 回分。`from` は滑り始める左上で、弾んで現れるチップは持たない。`until` は席を離れる出来事。`label` は枠の中の字 */
export interface LineupSeat extends Rect, LineupAt {
  id: string;
  lane: string;
  index: number;
  label: LineupText;
  /** 層の見た目 (#3625) の札の上の行の字。説明 (`note`) を持つチップは、名前をこの行に、説明を `label` に出す */
  caption?: LineupText;
  from?: Point;
  until?: LineupAt;
  /** 順番のある帯の札の番号 (#3624)。上から 1、2、3 と続く */
  number?: LineupText;
  /** 現れた段だけ付ける印。差し戻した札は `back` (戻る印の丸)、前の段にどこにも居なかった色付きの札は `added` (「足した」の札) */
  tag?: "added" | "back";
  tagBox?: Rect;
  tagText?: LineupText;
  /** 居場所でない帯に残る控えの行 */
  trace?: true;
  /** 帯を移ったか初めて現れた段で、その段だけ太い縁を見せる */
  moved?: true;
  /** 札が走る道。札の真ん中の点で、元の席の真ん中から始まり、この席の真ん中で終わる。持たない札はまっすぐ滑る */
  path?: Point[];
}

/** 帯の札の数。帯ごと段ごとに 1 つで、上限を書いた帯は「数/上限」 */
export interface LineupCount extends Rect {
  lane: string;
  step: number;
  /** その段に帯へ書いた札の数 */
  n: number;
  text: LineupText;
}

/** ボードの上限の目盛り。`index` は左から何番目か */
export interface LineupTick extends Rect {
  lane: string;
  index: number;
}

/** 帯の値 (`note`) の札。段ごとに 1 つで、`changed` は前の段から値が変わった段 */
export interface LineupValue extends Rect {
  lane: string;
  step: number;
  changed: boolean;
  text: LineupText;
}

/** 跡。差し戻しで札が抜けた帯 (`from`) と、どの帯からも外れた札の帯 (`gone`) に、その段の札の後の席へ置く */
export interface LineupGhost extends Rect, LineupAt {
  id: string;
  lane: string;
  kind: "from" | "gone";
  label: LineupText;
  tagBox?: Rect;
  tagText?: LineupText;
}

/** 差し戻しの戻りの線と札。`icon` は狭い枠で、札の代わりに戻る印の丸だけを描く */
export interface LineupBack extends LineupAt {
  id: string;
  from: string;
  to: string;
  points: Point[];
  label: Rect & { text: LineupText };
  icon?: true;
}

/** 流れの線の駅 */
export interface LineupStop {
  lane: string;
  cx: number;
  cy: number;
  r: number;
}

/** 流れの線の、段で札が後ろの駅へ移った区間 */
export interface LineupRun extends LineupAt {
  from: string;
  to: string;
  points: Point[];
}

/** 流れの線の線の四角。横の線は右の端に、縦の線は下の端に向きの三角を持つ */
type LineupStationsLine = Rect;

/** 流れの線 (#3624) の線と駅と、段で通った区間 */
export interface LineupStations {
  line: LineupStationsLine;
  stops: LineupStop[];
  runs: LineupRun[];
}

/** 封。`until` は開ける出来事 */
export interface LineupSeal extends Rect, LineupAt {
  lane: string;
  until?: LineupAt;
}

/** 箱に押す印 */
export interface LineupStamp extends Rect, LineupAt {
  lane: string;
  text: string;
}

/** 箱を選ぶ出来事。同じ箱を続けて選んだ時は最初の 1 つだけを持つ */
export interface LineupPick extends LineupAt {
  lane: string;
}

/** 選んだ札の頭の印 (「選ばれる」) */
export interface LineupMark extends Rect, LineupAt {
  lane: string;
  text: string;
}

/** 役の札。`steps` は役が動く段 */
export interface LineupRoleCard extends Rect {
  id: string;
  title: LineupText;
  note?: LineupText;
  steps: number[];
}

/** 段ごとの図の上の題と文 */
export interface LineupHeadline {
  step: number;
  title: LineupText;
  say?: LineupText;
}

/** 札の下の一言。`line` の出来事の段にだけ出る。`bar` は色の縦棒 */
export interface LineupRemark extends LineupAt {
  lane: string;
  color?: ColorKey;
  bar: Rect;
  text: LineupText;
}

/** 「この先」の帯の札。`step` は題の段、`no` は番号の箱 */
export interface LineupAheadTag extends Rect {
  step: number;
  no: Rect;
  number: LineupText;
  text: LineupText;
}

/** 段ごとの「この先」の帯。札は後の段の題で、`arrows` は札の間の矢印 */
export interface LineupAhead {
  step: number;
  label: LineupText;
  tags: LineupAheadTag[];
  arrows: Point[][];
}

/** 凡例の行。`swatch` は色の枠の見本 */
export interface LineupLegendRow {
  color?: ColorKey;
  swatch: Rect;
  text: LineupText;
}

/** 置き場と札の間の矢印 */
export interface LineupArrow {
  from: string;
  to: string;
  points: Point[];
}

/** 層の見た目 (#3625) の帯の飾り。帯そのものの四角は `lanes` の箱が持つ。`bar` は左の色の棒、`no` は層の番号の丸 */
export interface LineupBand {
  lane: string;
  bar: Rect;
  name: LineupText;
  desc?: LineupText;
  no: { cx: number; cy: number; r: number; number: LineupText };
}

/** 層の見た目の帯の印。段の中の `note` の行 1 つ分で、`until` は同じ層の次の `note` */
export interface LineupBandNote extends Rect, LineupAt {
  lane: string;
  text: LineupText;
  until?: LineupAt;
}

export interface LineupLayout extends Layout {
  kind: "lineup";
  /** 見た目。既定のボード (#3624)、流れの線 (`[shape: stations]`、#3624)、層の見た目 (`[shape: layers]`、#3625) */
  shape: "board" | "stations" | "layers";
  /** 帯か駅を横に並べたか (`row`)、携帯の幅で上から積んだか (`stack`)、層の見た目で横の帯に重ねたか (`layers`) */
  arrangement: "row" | "stack" | "layers";
  /** 層の見た目の帯の飾りと印。層の見た目だけが持つ */
  bands?: LineupBand[];
  bandNotes?: LineupBandNote[];
  lanes: LineupLane[];
  chips: LineupSeat[];
  seals: LineupSeal[];
  stamps: LineupStamp[];
  picks: LineupPick[];
  marks: LineupMark[];
  roles: LineupRoleCard[];
  /** 図の題 */
  heading: LineupText;
  headlines: LineupHeadline[];
  remarks: LineupRemark[];
  aheads: LineupAhead[];
  legend: LineupLegendRow[];
  arrows: LineupArrow[];
  /** 封の字 */
  sealWord: string;
  /** 帯の札の数と上限の目盛りと値の札。層の見た目は持たない */
  counts: LineupCount[];
  ticks: LineupTick[];
  values: LineupValue[];
  /** 抜けた跡と外れた跡、差し戻しの戻りの線 */
  ghosts: LineupGhost[];
  backs: LineupBack[];
  /** 流れの線の線と駅。流れの線だけが持つ */
  stations?: LineupStations;
}

export interface LineupOptions {
  /** 描く枠の幅。渡すと、横に並べると箱の名前が読めない幅で縦に組む */
  width?: number;
  lang?: NotationLang;
}

/** 1 行の字 */
function single(text: string, x: number, baseline: number, style: TextStyle): LineupText {
  const w = textWidth(text, style);
  return { text, lines: [{ text, x, baseline }], x, y: baseline - style.size * 0.8, w, h: style.size };
}

/** 字の後ろで折ってよい字か。読点と句点と閉じ括弧の前では折らない */
const CLOSING = new Set([..."、。，．）」』！？,.)"]);

/** 字を幅 `width` に収まる行に折る。和文は字の間で、欧文は空白の後で折る */
export function wrap(text: string, style: TextStyle, width: number): string[] {
  if (textWidth(text, style) <= width) return [text];
  const chars = [...text];
  const tokens: string[] = [];
  let cur = "";
  chars.forEach((ch, i) => {
    const prev = chars[i - 1] ?? "";
    const breakable = cur !== "" && !CLOSING.has(ch) && (hasWide(ch) || hasWide(prev) || /\s/u.test(prev));
    if (breakable) {
      tokens.push(cur);
      cur = "";
    }
    cur += ch;
  });
  if (cur !== "") tokens.push(cur);
  const lines: string[] = [];
  let line = "";
  for (const token of tokens) {
    const next = line + token;
    if (line !== "" && textWidth(next.trimEnd(), style) > width) {
      lines.push(line.trimEnd());
      line = token.trimStart();
    } else {
      line = next;
    }
  }
  if (line !== "") lines.push(line.trimEnd());
  return lines;
}

/** 幅 `width` で折った字。1 行目の基準線を `baseline` に置き、`pitch` ずつ下げる */
function wrapped(text: string, x: number, baseline: number, style: TextStyle, width: number, pitch: number): LineupText {
  const rows = wrap(text, style, width);
  const lines = rows.map((t, k) => ({ text: t, x, baseline: baseline + k * pitch }));
  const w = Math.max(0, ...rows.map((t) => textWidth(t, style)));
  const top = baseline - style.size * 0.8;
  return { text, lines, x, y: top, w, h: (rows.length - 1) * pitch + style.size };
}

const bottomOf = (r: Rect): number => r.y + r.h;

/** 段の中の `line` 1 つ。宣言したチップだけを、同じチップは最初の 1 枚だけ、上限の枚数まで持つ */
interface Line extends LineupAt {
  lane: string;
  items: string[];
}

function linesOf(diagram: DiagramModel, known: Set<string>, lanes: Set<string>): Line[] {
  return diagram.steps.flatMap((step, s) =>
    step.events.flatMap((e, k): Line[] => (e.type === "line" && "box" in e && lanes.has(e.box) ? [{ step: s, event: k, lane: e.box, items: [...new Set(e.items)].filter((id) => known.has(id)).slice(0, LANE_MOST) }] : [])),
  );
}

/** 札の下の一言の中身。置く所は並べ方が決める */
interface RemarkSpec extends LineupAt {
  lane: string;
  color?: ColorKey;
  text: string;
}

/**
 * 札の下の一言。札に `line` を書いた段ごとに、段の始まりに札より前の置き場に在ったチップと比べる。
 * 札より後ろの置き場 (済みのような終わりの置き場) は札へ流れ込む元ではないので比べない (#3624)。
 * 置き場に無かったチップは色ごとに 1 つの一言にまとめ、置き場に在った色付きのチップは席の番号か、無いことを言う。
 * 一言は札の中の最初の席の順に並べ、無いことを言う一言は最後に置く。段の始まりに前の置き場にチップが無い段は一言を出さない
 */
function remarksOf(diagram: DiagramModel, lines: Line[], pools: Set<string>, order: string[], words: FigureText): RemarkSpec[] {
  const items = new Map((diagram.lineup?.items ?? []).map((item) => [item.id, item]));
  const nameOf = (id: string): string => items.get(id)?.label ?? id;
  const held = new Map<string, string[]>();
  const out: RemarkSpec[] = [];
  diagram.steps.forEach((_, s) => {
    for (const line of lines.filter((l) => l.step === s && !pools.has(l.lane))) {
      const before = order.indexOf(line.lane);
      const pooled = [...held.entries()].filter(([lane]) => pools.has(lane) && order.indexOf(lane) < before).flatMap(([, ids]) => ids);
      const inPool = new Set(pooled);
      if (inPool.size === 0) continue;
      const found: { at: number; color?: ColorKey; text: string }[] = [];
      const added = new Map<string, { at: number; color?: ColorKey; ids: string[] }>();
      line.items.forEach((id, index) => {
        if (inPool.has(id)) return;
        const color = items.get(id)?.color;
        const key = color ?? "";
        const group = added.get(key) ?? { at: index, ...(color ? { color } : {}), ids: [] };
        group.ids.push(id);
        added.set(key, group);
      });
      for (const group of added.values()) found.push({ at: group.at, ...(group.color ? { color: group.color } : {}), text: words.lineupAdded(group.ids.map(nameOf)) });
      for (const id of [...new Set(pooled)]) {
        const color = items.get(id)?.color;
        if (!color) continue;
        const index = line.items.indexOf(id);
        found.push(index < 0 ? { at: Number.POSITIVE_INFINITY, color, text: words.lineupMissing(nameOf(id)) } : { at: index, color, text: words.lineupAt(nameOf(id), index + 1) });
      }
      found.sort((a, b) => a.at - b.at);
      for (const f of found) out.push({ step: line.step, event: line.event, lane: line.lane, ...(f.color ? { color: f.color } : {}), text: f.text });
    }
    for (const line of lines.filter((l) => l.step === s)) held.set(line.lane, line.items);
  });
  return out;
}

/** 札の形 (#3624)。高さと上下の間と角の丸み、番号の丸の半径と真ん中、名前の左端 (番号を持つ時と持たない時)、右の余白、足したの札と戻る印を置く札の右の端からの位置 */
interface CardGeo {
  h: number;
  gap: number;
  radius: number;
  numR: number;
  numX: number;
  textX: number;
  plainX: number;
  padR: number;
  tagInset: number;
  backInset: number;
  backR: number;
}

/** 帯の札を置く所。左上、1 行に並べる札の数、札の幅 */
interface Seats {
  x: number;
  y: number;
  cols: number;
  w: number;
}

export function layoutLineup(diagram: DiagramModel, options: LineupOptions = {}): LineupLayout {
  const words = FIGURE_TEXT[options.lang ?? DEFAULT_LANG];
  const { width } = options;
  const shape = diagram.lineup?.shape;
  if (shape === "layers") {
    const wide = arrangeLayers(diagram, words, false);
    if (width === undefined || (width / wide.width) * Y.type.name.size >= READABLE_PX) return wide;
    return arrangeLayers(diagram, words, true);
  }
  const look = shape === "stations" ? "stations" : "board";
  const row = arrange(diagram, words, look, false);
  if (width === undefined || (width / row.width) * TYPE.boxName.size >= READABLE_PX) return row;
  return arrange(diagram, words, look, true);
}

/** 段の中の出来事 `at` の時に選んでいる箱。それより前の最後の `pick` */
function pickedAtOf(diagram: DiagramModel): (at: LineupAt) => string | undefined {
  const picks: LineupPick[] = [];
  diagram.steps.forEach((step, s) => step.events.forEach((e, k) => (e.type === "pick" && "box" in e ? picks.push({ step: s, event: k, lane: e.box }) : undefined)));
  return (at) => picks.filter((p) => p.step < at.step || (p.step === at.step && p.event < at.event)).at(-1)?.lane;
}

/** 帯ごとの段ごとの値。箱の note (`sub`) は段 1 から、段の中の note は書いた段から出し、次の note まで残す。値の無い段は `undefined` */
function valuesOf(diagram: DiagramModel): Map<string, (string | undefined)[]> {
  return new Map(
    diagram.boxes.map((b) => {
      let now = b.sub;
      return [
        b.id,
        diagram.steps.map((step) => {
          for (const e of step.events) if (e.type === "swap" && e.box === b.id) now = e.text;
          return now;
        }),
      ];
    }),
  );
}

/**
 * ボード (#3624) と流れの線 (`[shape: stations]`) の置き方。`stacked` は携帯の幅で、ボードは帯を上から積み、流れの線は線を図の左に縦に引く。
 * どちらも帯の札を段ごとの居場所 (`walkLineup`) の席に置き、差し戻しの線と抜けた跡と外れた跡を足す。
 * ボードは帯を淡い色の縦の帯にして、見出しに名前と札の数を、2 行目に上限の目盛りと順番なしと値の札を置き、札を上から積む。
 * 流れの線は帯を 1 本の線の上の駅にして、駅の上に名前と札の数を、その下に順番なしと値の札を置き、札を駅の下に積む。上限を書いた駅は受け口を描く
 */
function arrange(diagram: DiagramModel, words: FigureText, shape: "board" | "stations", stacked: boolean): LineupLayout {
  const B = L.board;
  const ST = L.stations;
  const N = B.narrow;
  const stations = shape === "stations";
  const T = stacked ? { ...B.type, ...B.narrowType } : B.type;
  const margin = stacked ? N.margin : L.margin;
  const items = diagram.lineup?.items ?? [];
  const itemOf = new Map(items.map((item) => [item.id, item]));
  const nameOf = (id: string): string => itemOf.get(id)?.label ?? id;
  const order = diagram.boxes.map((b) => b.id);
  const boxOf = new Map(diagram.boxes.map((b) => [b.id, b]));
  const pools = new Set(diagram.boxes.filter((b) => b.order === "none").map((b) => b.id));
  const lines = linesOf(diagram, new Set(itemOf.keys()), new Set(order));
  const colors = boxColors(diagram);
  const remarkSpecs = remarksOf(diagram, lines, pools, order, words);
  const walk = walkLineup(diagram, lines, order, (id) => itemOf.get(id)?.color !== undefined, pickedAtOf(diagram));
  const hasBack = walk.backs.length > 0;
  const card: CardGeo = stations
    ? stacked
      ? { ...ST.narrowCard, radius: ST.narrowCard.h / 2 }
      : { ...ST.card, h: ST.cardH, gap: ST.cardGap, radius: ST.cardH / 2 }
    : stacked
      ? { ...N.card, tagInset: N.tagInset, backInset: N.backInset, backR: N.backR }
      : { ...B.card, tagInset: B.tag.inset, backInset: B.back.inset, backR: B.back.r };
  const pitch = card.h + card.gap;
  const limitOf = (lane: string): number | undefined => boxOf.get(lane)?.limit;
  const mostOf = (lane: string): number => Math.max(1, walk.most.get(lane) ?? 0, stations ? (limitOf(lane) ?? 0) : 0);

  // 字の幅
  const widthOf = (text: string, style: TextStyle): number => layerWidth(text, style);
  const styleOf = (text: string, style: TextStyle): TextStyle => (style.family === "mono" && hasWide(text) ? { ...style, family: "sans" } : style);
  const pillW = (text: string, style: TextStyle, padX: number): number => widthOf(text, style) + padX * 2;
  const countText = (lane: string, n: number): string => {
    const limit = limitOf(lane);
    return limit === undefined ? String(n) : `${n}/${limit}`;
  };
  const countW = (text: string): number => pillW(text, T.count, B.count.padX);
  const countMost = (lane: string): number => Math.max(...(walk.counts.get(lane) ?? [0]).map((n) => countW(countText(lane, n))));
  const values = valuesOf(diagram);
  const valuesIn = (lane: string): string[] => (values.get(lane) ?? []).filter((v): v is string => v !== undefined);
  const valueW = (text: string): number => pillW(text, T.value, B.value.padX);
  const valueMost = (lane: string): number => Math.max(0, ...valuesIn(lane).map(valueW));
  const noOrderW = pillW(words.lineupNoOrder, T.noOrder, B.noOrder.padX);
  const ticksW = (limit: number): number => limit * (B.tick.w + B.tick.gap) - B.tick.gap;
  const nameW = (lane: string): number => widthOf(boxOf.get(lane)?.name ?? lane, T.name);
  /** 見出しの 2 行目に並べる物の幅。目盛りか順番なしと、値の札。`count` を立てると札の数も先頭に置く */
  const row2W = (lane: string, count: boolean): number => {
    const limit = limitOf(lane);
    const parts = [...(count ? [countMost(lane)] : []), ...(!stations && limit !== undefined ? [ticksW(limit)] : []), ...(pools.has(lane) ? [noOrderW] : []), ...(valuesIn(lane).length > 0 ? [valueMost(lane)] : [])];
    return parts.reduce((sum, w, k) => sum + w + (k > 0 ? B.count.gap : 0), 0);
  };
  const hasRow2 = (lane: string): boolean => row2W(lane, false) > 0;

  // 札の幅。名前と、足したの札か戻る印の入る幅
  const tagW = pillW(words.lineupNew, T.tag, B.tag.padX);
  const goneW = pillW(words.lineupGone, T.tag, B.tag.padX);
  const tagsOf = new Map<string, Set<string>>();
  for (const seat of walk.seats) if (seat.tag) tagsOf.set(seat.id, new Set([...(tagsOf.get(seat.id) ?? []), seat.tag]));
  const roomOf = (id: string): number => {
    const tags = tagsOf.get(id) ?? new Set();
    return Math.max(card.padR, tags.has("added") ? B.tag.gap + tagW + card.tagInset : 0, tags.has("back") ? B.tag.gap + card.backInset + card.backR : 0);
  };
  const cardIds = [...new Set(lines.flatMap((l) => l.items))];
  const cardNeed = Math.max(
    0,
    ...cardIds.map((id) => card.textX + widthOf(nameOf(id), T.card) + roomOf(id)),
    ...walk.ghosts.map((g) => card.plainX + widthOf(nameOf(g.id), T.card) + (g.kind === "gone" ? B.tag.gap + goneW + card.tagInset : card.padR)),
  );

  // ボードの帯の幅。名前と札の数が 1 行に収まらない帯が 1 つでもあれば、どの帯も札の数を 2 行目の左に置く
  let laneW = Math.max(B.minW, cardNeed + B.padX * 2, ...order.map((l) => B.nameX + nameW(l) + B.dotX), ...order.map((l) => B.dotX * 2 + row2W(l, false)));
  const countBelow = !stacked && !stations && order.some((l) => B.nameX + nameW(l) + B.count.gap + countMost(l) + B.dotX > laneW);
  if (countBelow) laneW = Math.max(laneW, ...order.map((l) => B.dotX * 2 + row2W(l, true)));

  // 流れの線の駅の間と札の幅。駅の名前と札の数、順番なしと値の札、札のどれもが隣の駅に掛からない
  const stopCard = Math.max(ST.cardW, cardNeed);
  const nameBlock = (lane: string): number => nameW(lane) + ST.nameGap + countMost(lane);
  const row2Block = (lane: string): number => {
    const parts = [...(pools.has(lane) ? [noOrderW] : []), ...(valuesIn(lane).length > 0 ? [valueMost(lane)] : [])];
    return parts.reduce((sum, w, k) => sum + w + (k > 0 ? ST.rowGap : 0), 0);
  };
  const blockOf = (lane: string): number => Math.max(nameBlock(lane), row2Block(lane), stopCard);
  const stepX = Math.max(ST.step, ...order.map((l) => blockOf(l) + ST.laneGap));
  const first = order[0] ?? "";
  const last = order.at(-1) ?? "";
  const before = Math.max(ST.before, blockOf(first) / 2 + ST.laneGap / 2);
  const after = Math.max(ST.after, blockOf(last) / 2 + ST.head);

  // 図の幅。横に並べた形は帯か駅と役の札の並びで決まり、縦に組んだ形は決めた幅に収める
  const roleDecl = diagram.lineup?.roles ?? [];
  const roleNeed = Math.max(0, ...roleDecl.map((r) => Math.max(textWidth(r.id, TYPE.roleName), r.note === undefined ? 0 : textWidth(r.note, TYPE.roleNote)) + L.role.padX * 2));
  const rolesW = roleDecl.length * Math.max(L.role.w, roleNeed) + Math.max(0, roleDecl.length - 1) * L.role.gap;
  const n = order.length;
  const rowSpan = stations ? before + (n - 1) * stepX + after : n * laneW + (n - 1) * B.gap;
  const width = Math.max(stacked ? Math.max(N.width, roleNeed + margin * 2) : Math.max(rowSpan, rolesW) + margin * 2, stripNeed(diagram) + margin * 2);
  const inner = width - margin * 2;

  // 図の上の題。段の題と文は折った行の数が段で違うので、最も低い段に合わせて役の札を置く
  const H = L.headline;
  const { heading, headlines, headBottom } = headOf(diagram, margin, inner);

  // 役の札。横に並べた形は帯の並びの上の真ん中に、縦に組んだ形は図の幅を割って並べる
  const roleTop = headBottom + H.below;
  const roleSteps = diagram.steps.map((step) => step.events.flatMap((e) => (e.type === "role" ? [e.role] : [])));
  const roleOf = (decl: { id: string; note?: string }, x: number, y: number, w: number, h: number): LineupRoleCard => {
    const title = single(decl.id, x + L.role.padX, y + L.role.titleY, TYPE.roleName);
    const note = decl.note === undefined ? undefined : wrapped(decl.note, x + L.role.padX, y + L.role.noteY, TYPE.roleNote, w - L.role.padX * 2, H.sayLine);
    return { id: decl.id, x, y, w, h: Math.max(h, note ? bottomOf(note) - y + L.role.padX : 0), title, ...(note ? { note } : {}), steps: roleSteps.flatMap((ids, s) => (ids.includes(decl.id) ? [s] : [])) };
  };
  let roles: LineupRoleCard[];
  if (stacked) {
    let per = Math.max(1, roleDecl.length);
    while (per > 1 && (inner - L.gap * (per - 1)) / per < roleNeed) per--;
    const w = (inner - L.gap * (per - 1)) / per;
    roles = [];
    let y = roleTop;
    for (let k = 0; k < roleDecl.length; k += per) {
      const placed = roleDecl.slice(k, k + per).map((decl, j) => roleOf(decl, margin + j * (w + L.gap), y, w, L.role.stackH));
      roles.push(...placed);
      y = Math.max(...placed.map(bottomOf)) + L.gap;
    }
  } else {
    const w = Math.max(L.role.w, roleNeed);
    const total = roleDecl.length * w + Math.max(0, roleDecl.length - 1) * L.role.gap;
    const left = Math.max(margin, Math.min(margin + rowSpan / 2 - total / 2, width - margin - total));
    roles = roleDecl.map((decl, k) => roleOf(decl, left + k * (w + L.role.gap), roleTop, w, L.role.h));
  }
  // 差し戻しの在るボードは、戻りの線と札を通す所を帯の上に空ける
  const laneTop = (roles.length > 0 ? Math.max(...roles.map(bottomOf)) + L.role.below : headBottom + H.below) + (hasBack && !stacked && !stations ? B.return.room : 0);

  /** 札の下の一言が、幅 `w` の帯の下に要る高さ。段ごとの一言は別の段に出るので、最も高い段に合わせる */
  const remarkRoom = (id: string, w: number): number => {
    const mine = remarkSpecs.filter((r) => r.lane === id);
    const bySteps = [...new Set(mine.map((r) => r.step))].map((s) => mine.filter((r) => r.step === s).reduce((h, r) => h + remarkLines(r.text, w) * L.remark.line, 0));
    return bySteps.length === 0 ? 0 : L.remark.top + Math.max(...bySteps) - (L.remark.line - L.remark.barH);
  };

  const lanes: LineupLane[] = [];
  const seatsOf = new Map<string, Seats>();
  const counts: LineupCount[] = [];
  const ticks: LineupTick[] = [];
  const valueChips: LineupValue[] = [];
  /** 帯の名前の 1 行目の真ん中の高さ */
  const nameMid = new Map<string, number>();

  /** 帯の名前と札の数と、2 行目の目盛りと順番なしと値の札。`countX` は札の数の札の右の端 (2 行目に置く時は `undefined`) */
  const header = (id: string, rect: Rect, title: LineupText, mid: number, row2Y: number, countRight: number | undefined, row2X: number): Pick<LineupLane, "hint" | "hintBox" | "note"> => {
    (walk.counts.get(id) ?? []).forEach((count, s) => {
      const text = countText(id, count);
      const w = countW(text);
      const x = countRight === undefined ? row2X : countRight - w;
      const cy = countRight === undefined ? row2Y : mid;
      counts.push({ lane: id, step: s, n: count, x, y: cy - B.count.h / 2, w, h: B.count.h, text: single(text, x + B.count.padX, cy + T.count.size * 0.35, T.count) });
    });
    let x = row2X + (countRight === undefined && !stations ? countMost(id) + B.count.gap : 0);
    const limit = limitOf(id);
    if (!stations && limit !== undefined) {
      for (let j = 0; j < limit; j++) ticks.push({ lane: id, index: j, x: x + j * (B.tick.w + B.tick.gap), y: row2Y - B.tick.h / 2, w: B.tick.w, h: B.tick.h });
      x += ticksW(limit) + B.count.gap;
    }
    let hint: LineupText | undefined;
    let hintBox: Rect | undefined;
    if (pools.has(id)) {
      hintBox = { x, y: row2Y - B.noOrder.h / 2, w: noOrderW, h: B.noOrder.h };
      hint = single(words.lineupNoOrder, x + B.noOrder.padX, row2Y + T.noOrder.size * 0.35, T.noOrder);
      x += noOrderW + (stations ? ST.rowGap : B.count.gap);
    }
    let note: LineupText | undefined;
    (values.get(id) ?? []).forEach((text, s) => {
      if (text === undefined) return;
      const w = valueW(text);
      const style = styleOf(text, T.value);
      const chip = { x, y: row2Y - B.value.h / 2, w, h: B.value.h };
      const label = single(text, x + B.value.padX, row2Y + style.size * 0.35, style);
      note ??= label;
      valueChips.push({ lane: id, step: s, changed: s > 0 && text !== values.get(id)?.[s - 1], ...chip, text: label });
    });
    void rect;
    void title;
    return { ...(hint ? { hint, hintBox } : {}), ...(note ? { note } : {}) };
  };

  /** 帯の箱。`rect` は帯の四角、`track` は札を置く所 */
  const laneOf = (id: string, rect: Rect, title: LineupText, track: Rect, extra: Pick<LineupLane, "hint" | "hintBox" | "note">, slots: Rect[] = []): LineupLane => {
    const b = boxOf.get(id);
    const limit = limitOf(id);
    const lane: LineupLane = {
      id,
      name: b?.name ?? id,
      ...(b?.sub !== undefined ? { sub: b.sub } : {}),
      color: colors.get(id) ?? "slate",
      ...rect,
      cx: rect.x + rect.w / 2,
      cy: rect.y + rect.h / 2,
      pool: pools.has(id),
      title,
      ...extra,
      ...(limit !== undefined ? { limit } : {}),
      track,
      slots,
    };
    lanes.push(lane);
    return lane;
  };

  let line: LineupStationsLine | undefined;
  const stops: LineupStop[] = [];
  /** 流れの線の高さ (横の線) か左右の位置 (縦の線) */
  let lineAt = 0;
  if (!stations && !stacked) {
    // ボードの帯を左から横に並べる。どの帯も同じ高さにし、札を上から積む
    const head = order.some(hasRow2) || countBelow ? B.head2 : B.head1;
    const most = Math.max(...order.map(mostOf));
    const h = head + most * pitch - card.gap + B.bottom;
    order.forEach((id, k) => {
      const x = margin + k * (laneW + B.gap);
      const rect = { x, y: laneTop, w: laneW, h };
      const title = single(boxOf.get(id)?.name ?? id, x + B.nameX, laneTop + B.nameY, T.name);
      const mid = laneTop + B.nameY - T.name.size * 0.35;
      nameMid.set(id, mid);
      const extra = header(id, rect, title, mid, laneTop + B.row2Y, countBelow ? undefined : x + laneW - B.dotX, x + B.dotX);
      const track = { x: x + B.padX, y: laneTop + head, w: laneW - B.padX * 2, h: most * pitch - card.gap };
      laneOf(id, rect, title, track, extra);
      seatsOf.set(id, { x: track.x, y: track.y, cols: 1, w: track.w });
    });
  } else if (!stations) {
    // 狭い枠のボードは、帯を図の幅の帯にして上から積み、帯の中に札を 2 つずつ並べる。差し戻しの在る図は帯の左に戻りの線の通り道を空ける
    const x = margin + (hasBack ? N.rail : 0);
    const w = width - margin - x;
    const cw = (w - B.padX * 2 - N.colGap) / 2;
    let y = laneTop;
    order.forEach((id, k) => {
      if (k > 0) y += N.gap;
      const name = boxOf.get(id)?.name ?? id;
      const title = wrapped(name, x + B.nameX, y + B.nameY, T.name, w - B.nameX - B.count.gap - countMost(id) - B.dotX, N.nameLine);
      const more = (title.lines.length - 1) * N.nameLine;
      const head = (hasRow2(id) ? N.head2 : N.head1) + more;
      const rows = Math.ceil(mostOf(id) / 2);
      const rect = { x, y, w, h: head + rows * pitch - card.gap + B.bottom };
      const mid = y + B.nameY - T.name.size * 0.35;
      nameMid.set(id, mid);
      const extra = header(id, rect, title, mid, y + B.row2Y + more - (B.head2 - N.head2), x + w - B.dotX, x + B.dotX);
      const track = { x: x + B.padX, y: y + head, w: w - B.padX * 2, h: rows * pitch - card.gap };
      laneOf(id, rect, title, track, extra);
      seatsOf.set(id, { x: track.x, y: track.y, cols: 2, w: cw });
      y += rect.h + remarkRoom(id, w);
    });
  } else if (!stacked) {
    // 流れの線は帯を 1 本の横の線の上の駅にし、駅の上に名前と札の数を、その下に順番なしと値の札を置き、札を駅の下に積む
    const x0 = margin + (inner - rowSpan) / 2 + before;
    lineAt = laneTop + 4 + ST.nameY + T.name.size * 0.45;
    const cardTop = lineAt + (hasBack ? ST.backTop : ST.top);
    const most = Math.max(...order.map(mostOf));
    const h = cardTop + most * pitch - card.gap + ST.bottom - laneTop;
    order.forEach((id, k) => {
      const cx = x0 + k * stepX;
      const total = nameBlock(id);
      const title = single(boxOf.get(id)?.name ?? id, cx - total / 2, lineAt - ST.nameY + T.name.size * 0.35, T.name);
      const mid = lineAt - ST.nameY;
      nameMid.set(id, mid);
      const rect = { x: cx - (stepX - ST.laneGap) / 2, y: laneTop, w: stepX - ST.laneGap, h };
      const extra = header(id, rect, title, mid, lineAt - ST.row2Y, cx + total / 2, cx - row2Block(id) / 2);
      const track = { x: cx - stopCard / 2, y: cardTop, w: stopCard, h: mostOf(id) * pitch - card.gap };
      seatsOf.set(id, { x: track.x, y: track.y, cols: 1, w: stopCard });
      const limit = limitOf(id);
      const slots = limit === undefined ? [] : Array.from({ length: limit }, (_, j) => ({ x: track.x, y: track.y + j * pitch, w: stopCard, h: card.h }));
      laneOf(id, rect, title, track, extra, slots);
      stops.push({ lane: id, cx, cy: lineAt, r: ST.r });
    });
    line = { x: x0 - before, y: lineAt - ST.line / 2, w: before + (n - 1) * stepX + after, h: ST.line };
  } else {
    // 狭い枠の流れの線は、線を図の左に縦に引き、駅を上から並べ、駅の名前の下に札を 2 つずつ並べる
    lineAt = ST.narrowX;
    const x = ST.narrowCards;
    const w = width - margin - x;
    const cw = (w - N.colGap) / 2;
    let y = laneTop + 4;
    order.forEach((id, k) => {
      if (k > 0) y += ST.laneGap;
      const name = boxOf.get(id)?.name ?? id;
      const sy = y + ST.narrowTop;
      const title = wrapped(name, x, sy + T.name.size * 0.35, T.name, w - ST.nameGap - countMost(id), N.nameLine);
      const more = (title.lines.length - 1) * N.nameLine;
      const row2 = row2Block(id) > 0;
      const head = (row2 ? ST.narrowHead2 : ST.narrowHead1) + more;
      const rows = Math.ceil(mostOf(id) / 2);
      const rect = { x, y, w, h: head + rows * pitch - card.gap };
      nameMid.set(id, sy);
      const lastLine = title.lines.at(-1);
      const countX = x + (lastLine ? textWidth(lastLine.text, T.name) : 0) + ST.nameGap + countMost(id);
      const extra = header(id, rect, title, sy + more, sy + more + ST.narrowHead2 - ST.narrowHead1 - ST.narrowTop + ST.narrowR, countX, x);
      const track = { x, y: y + head, w, h: rows * pitch - card.gap };
      seatsOf.set(id, { x, y: track.y, cols: 2, w: cw });
      const limit = limitOf(id);
      const slots = limit === undefined ? [] : Array.from({ length: limit }, (_, j) => ({ x: x + (j % 2) * (cw + N.colGap), y: track.y + Math.floor(j / 2) * pitch, w: cw, h: card.h }));
      laneOf(id, rect, title, track, extra, slots);
      stops.push({ lane: id, cx: lineAt, cy: sy, r: ST.narrowR });
      y += rect.h + remarkRoom(id, w);
    });
    const top = (stops[0]?.cy ?? laneTop) - ST.narrowTop - 2;
    const end = Math.max(...lanes.map(bottomOf)) + 4;
    line = { x: lineAt - ST.line / 2, y: top, w: ST.line, h: end + ST.head - top };
  }
  const laneById = new Map(lanes.map((lane) => [lane.id, lane]));

  /** 帯 `lane` の `index` 番目の席の四角 */
  const seatRect = (lane: string, index: number): Rect => {
    const at = seatsOf.get(lane) as Seats;
    const col = index % at.cols;
    const row = Math.floor(index / at.cols);
    return { x: at.x + col * (at.w + N.colGap), y: at.y + row * pitch, w: at.w, h: card.h };
  };
  const centerOf = (r: Rect): Point => [r.x + r.w / 2, r.y + r.h / 2];
  /** 札の右の端に置く「足した」と「外れた」の札 */
  const tagOf = (r: Rect, text: string): { tagBox: Rect; tagText: LineupText } => {
    const w = pillW(text, T.tag, B.tag.padX);
    const tagBox = { x: r.x + r.w - card.tagInset - w, y: r.y + r.h / 2 - B.tag.h / 2, w, h: B.tag.h };
    return { tagBox, tagText: single(text, tagBox.x + B.tag.padX, r.y + r.h / 2 + T.tag.size * 0.35, T.tag) };
  };

  // 戻りの線の横の区間の高さ (ボードは帯の上、流れの線は線の下) と、戻る札が走る道
  const returnY = stations ? lineAt + ST.backY : laneTop - B.return.rise;
  const backPath = (a: Point, b: Point): Point[] | undefined => {
    if (stacked) return stations || a[0] === b[0] ? undefined : [a, [a[0], (a[1] + b[1]) / 2], [b[0], (a[1] + b[1]) / 2], b];
    return [a, [a[0], returnY], [b[0], returnY], b];
  };

  // 札の席
  const chips: LineupSeat[] = walk.seats.map((ws) => {
    const r = seatRect(ws.lane, ws.index);
    const ordered = !pools.has(ws.lane) && !ws.trace;
    const mid = r.y + r.h / 2;
    const style = ws.trace ? T.trace : T.card;
    const textX = r.x + (ws.trace ? B.trace.x + B.trace.r * 2 + B.trace.gap : ordered ? card.textX : card.plainX);
    const label = single(nameOf(ws.id), textX, mid + style.size * 0.35, style);
    const no = String(ws.index + 1);
    const number = ordered ? single(no, r.x + card.numX - textWidth(no, T.number) / 2, mid + T.number.size * 0.35, T.number) : undefined;
    const src = ws.source ? seatRect(ws.source.lane, ws.source.index) : undefined;
    let path: Point[] | undefined;
    if (src && ws.source && ws.source.lane !== ws.lane) {
      if (ws.tag === "back") path = backPath(centerOf(src), centerOf(r));
      else if (stations && !stacked) path = [centerOf(src), [centerOf(src)[0], lineAt], [centerOf(r)[0], lineAt], centerOf(r)];
    }
    let tag: { tagBox: Rect; tagText?: LineupText } | undefined;
    if (ws.tag === "added") tag = tagOf(r, words.lineupNew);
    else if (ws.tag === "back") tag = { tagBox: { x: r.x + r.w - card.backInset - card.backR, y: mid - card.backR, w: card.backR * 2, h: card.backR * 2 } };
    return {
      step: ws.step,
      event: ws.event,
      id: ws.id,
      lane: ws.lane,
      index: ws.index,
      ...r,
      label,
      ...(number ? { number } : {}),
      ...(src ? { from: [src.x, src.y] as Point } : {}),
      ...(ws.until ? { until: ws.until } : {}),
      ...(ws.trace ? { trace: true as const } : {}),
      ...(ws.moved ? { moved: true as const } : {}),
      ...(ws.tag ? { tag: ws.tag } : {}),
      ...(tag ?? {}),
      ...(path ? { path } : {}),
    };
  });

  // 抜けた跡と外れた跡は、その段の帯の札の後の席に置く
  const ghosts: LineupGhost[] = walk.ghosts.map((g) => {
    const r = seatRect(g.lane, g.index);
    const label = single(nameOf(g.id), r.x + card.plainX, r.y + r.h / 2 + T.card.size * 0.35, T.card);
    return { id: g.id, lane: g.lane, step: g.step, event: g.event, kind: g.kind, ...r, label, ...(g.kind === "gone" ? tagOf(r, words.lineupGone) : {}) };
  });

  // 差し戻しの戻りの線と札。広い枠は戻りの線の横の区間の真ん中に「差し戻し」の札を、狭い枠は縦の区間の真ん中に戻る印を置く
  const backs: LineupBack[] = walk.backs.map((b) => {
    const from = laneById.get(b.from) as LineupLane;
    const to = laneById.get(b.to) as LineupLane;
    let points: Point[];
    if (!stacked && !stations) points = [[from.cx, from.y], [from.cx, returnY], [to.cx, returnY], [to.cx, to.y - 3]];
    else if (!stacked) {
      const top = (seatsOf.get(b.from) as Seats).y;
      points = [[from.cx, top], [from.cx, returnY], [to.cx, returnY], [to.cx, top - 3]];
    } else if (!stations) {
      const ya = nameMid.get(b.from) ?? from.y;
      const yb = nameMid.get(b.to) ?? to.y;
      points = [[from.x, ya], [N.railX, ya], [N.railX, yb], [to.x - 3, yb]];
    } else {
      const ya = nameMid.get(b.from) ?? from.y;
      const yb = nameMid.get(b.to) ?? to.y;
      const left = lineAt - ST.narrowR - ST.narrowRing;
      points = [[left, ya], [ST.narrowRail, ya], [ST.narrowRail, yb], [left - 2, yb]];
    }
    const text = words.lineupBack;
    if (stacked) {
      const x = points[1]?.[0] ?? 0;
      const y = ((points[1]?.[1] ?? 0) + (points[2]?.[1] ?? 0)) / 2;
      const r = N.railR;
      return { id: b.id, from: b.from, to: b.to, step: b.step, event: b.event, points, icon: true, label: { x: x - r, y: y - r, w: r * 2, h: r * 2, text: single(text, x - r, y + T.label.size * 0.35, T.label) } };
    }
    const Lb = B.label;
    const w = Lb.padX * 2 + Lb.glyph + Lb.gap + widthOf(text, T.label);
    const x = (from.cx + to.cx) / 2 - w / 2;
    const label = { x, y: returnY - Lb.h / 2, w, h: Lb.h, text: single(text, x + Lb.padX + Lb.glyph + Lb.gap, returnY + T.label.size * 0.35, T.label) };
    return { id: b.id, from: b.from, to: b.to, step: b.step, event: b.event, points, label };
  });

  // 流れの線の、段で札が通った区間
  const runs: LineupRun[] = stations
    ? walk.runs.map((r) => {
        const a = stops.find((s) => s.lane === r.from) as LineupStop;
        const b = stops.find((s) => s.lane === r.to) as LineupStop;
        return { step: r.step, event: r.event, from: r.from, to: r.to, points: stacked ? [[lineAt, a.cy], [lineAt, b.cy]] : [[a.cx, lineAt], [b.cx, lineAt]] };
      })
    : [];

  // 札の下の一言
  const remarks: LineupRemark[] = [];
  for (const lane of lanes) {
    const mine = remarkSpecs.filter((r) => r.lane === lane.id);
    const tops = new Map<number, number>();
    for (const spec of mine) {
      const y = tops.get(spec.step) ?? bottomOf(lane) + L.remark.top;
      const textX = lane.x + L.remark.bar + L.remark.gap;
      const text = wrapped(spec.text, textX, y + L.remark.barH / 2 + TYPE.remark.size * 0.3, TYPE.remark, lane.w - L.remark.bar - L.remark.gap, L.remark.line);
      remarks.push({ step: spec.step, event: spec.event, lane: lane.id, ...(spec.color ? { color: spec.color } : {}), bar: { x: lane.x, y, w: L.remark.bar, h: L.remark.barH }, text });
      tops.set(spec.step, y + text.lines.length * L.remark.line);
    }
  }

  // 封と印と選ぶ印。流れの線は読む時に断るので、ボードだけが持つ
  const seals: LineupSeal[] = [];
  const stamps: LineupStamp[] = [];
  const picks: LineupPick[] = [];
  const marks: LineupMark[] = [];
  if (!stations) {
    const open = new Map<string, LineupSeal>();
    let picked: string | undefined;
    diagram.steps.forEach((step, s) =>
      step.events.forEach((e: DiagramEvent, k) => {
        if ((e.type !== "seal" && e.type !== "open" && e.type !== "pick" && e.type !== "stamp") || !("box" in e)) return;
        const lane = laneById.get(e.box);
        if (!lane) return;
        const at: LineupAt = { step: s, event: k };
        if (e.type === "seal" && !open.has(lane.id)) {
          const { over } = L.seal;
          const seal: LineupSeal = { ...at, lane: lane.id, x: lane.track.x - over, y: lane.track.y - over, w: lane.track.w + over * 2, h: lane.track.h + over * 2 };
          seals.push(seal);
          open.set(lane.id, seal);
        } else if (e.type === "open") {
          const seal = open.get(lane.id);
          if (seal) seal.until = at;
          open.delete(lane.id);
        } else if (e.type === "pick" && picked !== lane.id) {
          picks.push({ ...at, lane: lane.id });
          marks.push({ ...at, ...markOf(lane, words.lineupPicked) });
          picked = lane.id;
        } else if (e.type === "stamp") {
          const w = textWidth(e.text, TYPE.stamp) + L.stamp.padX * 2;
          stamps.push({ ...at, lane: lane.id, text: e.text, x: lane.x + lane.w - L.stamp.inset - w, y: bottomOf(lane) - L.stamp.drop, w, h: L.stamp.h });
        }
      }),
    );
  }

  // ボードの帯の間の向きの印。横に並べた帯は見出しの高さに右を向け、積んだ帯は帯の間に下を向ける
  const arrows: LineupArrow[] = [];
  if (!stations) {
    const half = B.chevron.len / 2;
    lanes.forEach((lane, k) => {
      const next = lanes[k + 1];
      if (!next) return;
      if (stacked) {
        const x = lane.x + B.nameX;
        const y = next.y - N.gap / 2;
        arrows.push({ from: lane.id, to: next.id, points: [[x, y - half], [x, y + half]] });
      } else {
        const x = lane.x + lane.w + B.gap / 2;
        const y = nameMid.get(lane.id) ?? lane.y;
        arrows.push({ from: lane.id, to: next.id, points: [[x - half, y], [x + half, y]] });
      }
    });
  }

  // 「この先」の帯。後の段の題を左から並べ、図の幅で折り返す
  const above = Math.max(...lanes.map(bottomOf), ...remarks.map((r) => bottomOf(r.text)), ...stamps.map(bottomOf), ...(line ? [bottomOf(line)] : []));
  const A = L.ahead;
  const { inset } = L.arrow;
  const aheadTop = above + A.top;
  const aheads: LineupAhead[] = diagram.steps.slice(0, -1).map((_, s) => {
    const label = single(words.lineupAhead, margin, aheadTop + A.h / 2 + TYPE.aheadLabel.size * 0.3, TYPE.aheadLabel);
    let x = label.x + label.w + A.labelGap;
    let y = aheadTop;
    const later = diagram.steps.slice(s + 1);
    const tags: LineupAheadTag[] = [];
    const tagArrows: Point[][] = [];
    later.forEach((step, k) => {
      const room = width - margin - (k < later.length - 1 ? A.arrow : 0);
      const textW = Math.min(textWidth(step.title, TYPE.aheadText), inner - A.padX * 3 - A.no - A.textGap - A.arrow);
      const w = A.padX + A.no + A.textGap + textW + A.padX * 2;
      if (k > 0 && x + w > room) {
        x = margin;
        y += A.h + A.gap;
      }
      const no = { x: x + A.padX, y: y + (A.h - A.no) / 2, w: A.no, h: A.no };
      const num = String(s + 2 + k);
      const number = single(num, no.x + no.w / 2 - textWidth(num, TYPE.aheadNo) / 2, no.y + no.h / 2 + LOOK.baseline.tag, TYPE.aheadNo);
      const text = { ...single(step.title, no.x + no.w + A.textGap, y + A.h / 2 + TYPE.aheadText.size * 0.3, TYPE.aheadText), w: textW };
      tags.push({ step: s + 1 + k, x, y, w, h: A.h, no, number, text });
      if (k < later.length - 1) tagArrows.push([[x + w + inset, y + A.h / 2], [x + w + A.arrow - inset, y + A.h / 2]]);
      x += w + A.arrow;
    });
    return { step: s, label, tags, arrows: tagArrows };
  });
  const aheadBottom = Math.max(above, ...aheads.flatMap((a) => a.tags.map(bottomOf)));

  // 凡例。説明ごとに 1 行を、札の宣言の順に左から並べ、図の幅で折り返す
  const G = L.legend;
  const notes: { note: string; color?: ColorKey }[] = [];
  for (const item of items) if (item.note !== undefined && !notes.some((x) => x.note === item.note)) notes.push({ note: item.note, ...(item.color ? { color: item.color } : {}) });
  const legend: LineupLegendRow[] = [];
  {
    let x = margin;
    let y = aheadBottom + G.top;
    let rowH: number = G.swatch;
    for (const note of notes) {
      const textW = Math.min(textWidth(note.note, TYPE.legend), inner - G.swatch - G.gap);
      const w = G.swatch + G.gap + textW;
      if (x > margin && x + w > width - margin) {
        x = margin;
        y += rowH + (G.line - G.swatch);
        rowH = G.swatch;
      }
      const swatch = { x, y, w: G.swatch, h: G.swatch };
      const text = wrapped(note.note, x + G.swatch + G.gap, y + G.swatch / 2 + TYPE.legend.size * 0.3, TYPE.legend, inner - G.swatch - G.gap, G.line);
      legend.push({ ...(note.color ? { color: note.color } : {}), swatch, text });
      rowH = Math.max(rowH, bottomOf(text) - y);
      x += w + G.colGap;
    }
  }
  const bottom = Math.max(aheadBottom, ...legend.map((r) => Math.max(bottomOf(r.swatch), bottomOf(r.text))));

  const layout: LineupLayout = {
    kind: "lineup",
    shape,
    arrangement: stacked ? "stack" : "row",
    width,
    height: 0,
    regions: [],
    boxes: lanes,
    lifelines: [],
    edges: [],
    labels: [],
    actions: [],
    badges: [],
    paths: [],
    ends: [],
    lanes,
    chips,
    seals,
    stamps,
    picks,
    marks,
    roles,
    heading,
    headlines,
    remarks,
    aheads,
    legend,
    arrows,
    sealWord: words.lineupSealed,
    counts,
    ticks,
    values: valueChips,
    ghosts,
    backs,
    ...(line ? { stations: { line, stops, runs } } : {}),
  };
  const strip = layoutStrip(diagram, margin, bottom + LOOK.gap, inner);
  layout.height = (strip ? strip.y + strip.h : bottom) + margin;
  if (strip) layout.strip = strip;
  // 段の番号は図の右上の同じ所に置き、次の段の番号と入れ替えて段を数える。
  // 入れ替えるのが作りどおりなので、どの番号も脇へずらさず (`blocked` が全ての所を断る)、`shared` を付けて崩れの確かめに数えさせない (#3525)
  const badges: SceneBadge[] = diagram.steps.map((_, s) => ({ step: s, x: width - margin - LOOK.badge.r, y: margin + H.badgeY, color: "green" }));
  layout.badges = besideSameSpot(badges, () => true, () => true);
  return layout;

  /** 選んだ帯の頭の印。名前と札の数の間に入れば名前の行に、入らなければ帯の上の端に掛けて右に寄せる */
  function markOf(lane: LineupLane, text: string): Rect & { lane: string; text: string } {
    const w = textWidth(text, TYPE.laneMark) + L.mark.padX * 2;
    const inline = lane.title.x + lane.title.w + L.mark.gap;
    const right = countBelow || lane.title.lines.length > 1 ? lane.x + lane.w - B.dotX : lane.x + lane.w - B.dotX - countMost(lane.id) - L.mark.gap;
    const mid = nameMid.get(lane.id) ?? lane.y;
    if (inline + w <= right) return { lane: lane.id, text, x: inline, y: mid - L.mark.h / 2, w, h: L.mark.h };
    return { lane: lane.id, text, x: lane.x + lane.w - B.padX - w, y: lane.y - L.mark.lift, w, h: L.mark.h };
  }
}

/** 図の上の題と、段ごとの題と文 (`say`)。`headBottom` は最も低い段の文の下の端 */
function headOf(diagram: DiagramModel, margin: number, inner: number): { heading: LineupText; headlines: LineupHeadline[]; headBottom: number } {
  const H = L.headline;
  const heading = single(diagram.title, margin, margin + H.titleY, TYPE.lineupTitle);
  const headlines: LineupHeadline[] = diagram.steps.map((step, s) => {
    const title = wrapped(step.title, margin, margin + H.headY, TYPE.lineupHead, inner, H.headLine);
    const last = title.lines.at(-1)?.baseline ?? margin + H.headY;
    const body = step.body ?? "";
    return { step: s, title, ...(body === "" ? {} : { say: wrapped(body, margin, last + H.sayY, TYPE.lineupSay, inner, H.sayLine) }) };
  });
  return { heading, headlines, headBottom: Math.max(...headlines.map((h) => bottomOf(h.say ?? h.title))) };
}

/** 一言が幅 `w` の札の下で何行になるか */
function remarkLines(text: string, w: number): number {
  return wrap(text, TYPE.remark, w - L.remark.bar - L.remark.gap).length;
}

/** 層の見た目の字の幅。等幅の字で和文を含む字は、和文の字で描くので和文の字で測る */
const layerWidth = (text: string, style: TextStyle): number => textWidth(text, style.family === "mono" && hasWide(text) ? { ...style, family: "sans" } : style);

/**
 * 層の見た目 (#3625) の置き方。`narrow` は携帯の幅で、帯の中で名前と説明の下に印と札の行を置く。
 * 横に並べた帯は左から、色の棒と名前と説明、層の番号、印、札の列を置き、帯の中の幅が下限より広い時は、余りを番号の前と札の前に半分ずつ空ける
 */
function arrangeLayers(diagram: DiagramModel, words: FigureText, narrow: boolean): LineupLayout {
  const T = Y.type;
  const margin = narrow ? L.stack.margin : L.margin;
  const items = diagram.lineup?.items ?? [];
  const itemOf = new Map(items.map((item) => [item.id, item]));
  const lines = linesOf(diagram, new Set(itemOf.keys()), new Set(diagram.boxes.map((b) => b.id)));
  const colors = boxColors(diagram);
  /** 札の字。説明を持つチップは名前を上の行に、説明を下の行に出す */
  const cardOf = (id: string): { caption?: string; text: string } => {
    const item = itemOf.get(id);
    const name = item?.label ?? id;
    return item?.note === undefined ? { text: name } : { caption: name, text: item.note };
  };
  const cardW = (id: string): number => {
    const { caption, text } = cardOf(id);
    return Math.max(layerWidth(text, T.card), caption === undefined ? 0 : layerWidth(caption, T.caption)) + Y.cardPadX * 2;
  };
  const cardsW = (ids: string[]): number => ids.reduce((sum, id, k) => sum + cardW(id) + (k > 0 ? Y.cardGap : 0), 0);
  const cardCol = Math.max(0, ...lines.map((l) => cardsW(l.items)));
  const notes = diagram.steps.flatMap((step, s) => step.events.flatMap((e, k) => (e.type === "swap" && diagram.boxes.some((b) => b.id === e.box) ? [{ step: s, event: k, lane: e.box, text: e.text }] : [])));
  const stampW = (text: string): number => layerWidth(text, T.stamp) + Y.stampPadX * 2;
  const stampCol = Math.max(0, ...notes.map((n) => stampW(n.text)));
  const nameW = Math.max(0, ...diagram.boxes.map((b) => layerWidth(b.name, T.name)));
  const descW = Math.max(0, ...diagram.boxes.map((b) => (b.sub === undefined ? 0 : layerWidth(b.sub, T.desc))));
  const noW = Y.no * 2;

  // 帯の中の幅。横に並べた帯は列を全て並べた幅、縦に組んだ帯は名前と番号の行と、印と札の行の広い方
  const rowNeed = stampCol + (stampCol > 0 && cardCol > 0 ? Y.colGap : 0) + cardCol;
  const wideNeed = Y.textX + Math.max(nameW, descW) + Y.colGap + noW + Y.colGap + rowNeed + Y.padR;
  const narrowNeed = Y.textX + Math.max(nameW + Y.colGap + noW, stampCol, cardCol) + Y.padR;
  const inner = Math.max(narrow ? L.stack.width - margin * 2 : Y.width, narrow ? narrowNeed : wideNeed, stripNeed(diagram));
  const width = inner + margin * 2;
  /** 層に出る印の幅と札の列の幅。縦に組んだ帯は層ごとにこれで行の数を決め、印の短い層まで長い印の層に合わせて間延びさせない */
  const stampIn = (lane: string): number => Math.max(0, ...notes.filter((n) => n.lane === lane).map((n) => stampW(n.text)));
  const cardsIn = (lane: string): number => Math.max(0, ...lines.filter((l) => l.lane === lane).map((l) => cardsW(l.items)));

  const { heading, headlines, headBottom } = headOf(diagram, margin, inner);
  const lanes: LineupLane[] = [];
  const bands: LineupBand[] = [];
  /** 帯ごとの、印と札の行の真ん中の高さと、札の列の左端 */
  const rowOf = new Map<string, { stampY: number; cardY: number; stampX: number; cardX: number }>();
  const extra = narrow ? 0 : (inner - wideNeed) / 2;
  let y = headBottom + L.headline.below;
  diagram.boxes.forEach((b, k) => {
    if (k > 0) y += Y.gap;
    const x = margin;
    const textX = x + Y.textX;
    const textW = narrow ? inner - Y.textX - Y.padR - Y.colGap - noW : Math.max(nameW, descW);
    const nameBase = y + Y.nameY;
    const desc = b.sub === undefined ? undefined : narrow ? wrapped(b.sub, textX, nameBase + Y.descY, T.desc, inner - Y.textX - Y.padR, Y.descLine) : single(b.sub, textX, nameBase + Y.descY, T.desc);
    const textBottom = bottomOf(desc ?? single(b.name, textX, nameBase, T.name));
    let h: number;
    let row: { stampY: number; cardY: number; stampX: number; cardX: number };
    let no: { cx: number; cy: number };
    if (narrow) {
      // 印と札が 1 つの行に収まらない層は、札を印の下の行に置く。印も札も出ない層は行を空けない
      const stamp = stampIn(b.id);
      const cards = cardsIn(b.id);
      const oneRow = stamp === 0 || cards === 0 || Y.textX + stamp + Y.cardGap + cards + Y.padR <= inner;
      const rowTop = textBottom + Y.rowGap;
      const tall = oneRow ? Math.max(stamp > 0 ? Y.stamp : 0, cards > 0 ? Y.card : 0) : Y.stamp;
      const stampY = rowTop + tall / 2;
      const cardY = oneRow ? stampY : rowTop + tall + Y.rowGap + Y.card / 2;
      row = { stampY, cardY, stampX: textX, cardX: oneRow && stamp > 0 ? textX + stamp + Y.cardGap : textX };
      h = (stamp === 0 && cards === 0 ? textBottom : oneRow ? rowTop + tall : cardY + Y.card / 2) + Y.padY - y;
      no = { cx: x + inner - Y.padR - Y.no, cy: nameBase - T.name.size * 0.35 };
    } else {
      h = Math.max(Y.minH, textBottom + Y.padY - y, Y.card + Y.padY * 2);
      const mid = y + h / 2;
      const noCx = textX + textW + Y.colGap + extra + Y.no;
      const stampX = noCx + Y.no + Y.colGap;
      row = { stampY: mid, cardY: mid, stampX, cardX: stampX + stampCol + (stampCol > 0 ? Y.colGap : 0) + extra };
      no = { cx: noCx, cy: mid };
    }
    // 説明を持たない層は、名前を帯の真ん中の高さに置く
    const name = single(b.name, textX, desc === undefined && !narrow ? y + h / 2 + T.name.size * 0.35 : nameBase, T.name);
    const rect = { x, y, w: inner, h };
    const number = String(k + 1);
    lanes.push({
      id: b.id,
      name: b.name,
      ...(b.sub !== undefined ? { sub: b.sub } : {}),
      color: colors.get(b.id) ?? "slate",
      ...rect,
      cx: x + inner / 2,
      cy: y + h / 2,
      pool: false,
      title: name,
      track: { x: row.cardX, y: row.cardY - Y.card / 2, w: cardCol, h: Y.card },
      slots: [],
    });
    bands.push({
      lane: b.id,
      bar: { x, y, w: Y.bar, h },
      name,
      ...(desc ? { desc } : {}),
      no: { ...no, r: Y.no, number: single(number, no.cx - layerWidth(number, T.no) / 2, no.cy + T.no.size * 0.35, T.no) },
    });
    rowOf.set(b.id, row);
    y += h;
  });
  const bottom = Math.max(headBottom, ...lanes.map(bottomOf));

  // 帯の印。同じ層の次の note まで残す
  const bandNotes: LineupBandNote[] = notes.map((n) => {
    const row = rowOf.get(n.lane) as { stampY: number; stampX: number };
    const w = stampW(n.text);
    const text = single(n.text, row.stampX + Y.stampPadX, row.stampY + T.stamp.size * 0.35, T.stamp);
    return { step: n.step, event: n.event, lane: n.lane, x: row.stampX, y: row.stampY - Y.stamp / 2, w, h: Y.stamp, text };
  });
  bandNotes.forEach((note, k) => {
    const next = bandNotes.slice(k + 1).find((n) => n.lane === note.lane);
    if (next) note.until = { step: next.step, event: next.event };
  });

  // 札の席。line を書いた段に、その層の札の列へ書いた順に左から置き、ほかの層に居た札はその層を離れる
  const chips: LineupSeat[] = [];
  const seated = new Map<string, LineupSeat>();
  diagram.steps.forEach((step, s) => {
    // 同じ段の line どうしは、段の始まりの居場所から滑る
    const before = new Map(seated);
    step.events.forEach((_, k) => {
      const line = lines.find((l) => l.step === s && l.event === k);
      if (!line) return;
      const at: LineupAt = { step: s, event: k };
      const row = rowOf.get(line.lane) as { cardY: number; cardX: number };
      let x = row.cardX;
      const placed = line.items.map((id, index): LineupSeat => {
        const w = cardW(id);
        const rect = { x, y: row.cardY - Y.card / 2, w, h: Y.card };
        x += w + Y.cardGap;
        const old = seated.get(id);
        if (old && old.lane === line.lane && old.x === rect.x && old.y === rect.y) return old;
        const source = before.get(id) ?? old;
        const { caption, text } = cardOf(id);
        const textX = rect.x + Y.cardPadX;
        const mid = row.cardY;
        const label = single(text, textX, caption === undefined ? mid + T.card.size * 0.35 : mid + Y.textY + T.card.size * 0.35, T.card);
        const seat: LineupSeat = {
          ...at,
          id,
          lane: line.lane,
          index,
          ...rect,
          label: { ...label, w: layerWidth(text, T.card) },
          ...(caption === undefined ? {} : { caption: single(caption, textX, mid + Y.captionY + T.caption.size * 0.35, T.caption) }),
          ...(source ? { from: [source.x, source.y] as Point } : {}),
        };
        if (old) old.until = at;
        chips.push(seat);
        return seat;
      });
      // 書き換えた層に居て、書き直した並びに無い札は、その層を離れる
      for (const [id, seat] of seated) if (seat.lane === line.lane && !line.items.includes(id) && seat.until === undefined) seat.until = at;
      for (const [id, seat] of [...seated]) if (seat.until !== undefined) seated.delete(id);
      for (const seat of placed) seated.set(seat.id, seat);
    });
  });

  const layout: LineupLayout = {
    kind: "lineup",
    shape: "layers",
    arrangement: "layers",
    width,
    height: 0,
    regions: [],
    boxes: lanes,
    lifelines: [],
    edges: [],
    labels: [],
    actions: [],
    badges: [],
    paths: [],
    ends: [],
    lanes,
    chips,
    seals: [],
    stamps: [],
    picks: [],
    marks: [],
    roles: [],
    heading,
    headlines,
    remarks: [],
    aheads: [],
    legend: [],
    arrows: [],
    sealWord: words.lineupSealed,
    bands,
    bandNotes,
    counts: [],
    ticks: [],
    values: [],
    ghosts: [],
    backs: [],
  };
  const strip = layoutStrip(diagram, margin, bottom + LOOK.gap, inner);
  layout.height = (strip ? strip.y + strip.h : bottom) + margin;
  if (strip) layout.strip = strip;
  const badges: SceneBadge[] = diagram.steps.map((_, s) => ({ step: s, x: width - margin - LOOK.badge.r, y: margin + L.headline.badgeY, color: "green" }));
  layout.badges = besideSameSpot(badges, () => true, () => true);
  return layout;
}

/**
 * 列の図のボードと流れの線 (#3624) の、段ごとの札の居場所の読み。置く所は持たず、帯の何番目の席に何が居るかだけを決める。
 *
 * 段の中の `line` を全て書いた後の並びで、札ごとに居場所を 1 つの帯に決める。札を最も後の段に書いた帯が居場所で、
 * 同じ段に 2 つの帯へ書いた札はどちらも居場所にする (入札の図で、同じ取引が 3 つのビルダーのブロックに入る)。
 * 居場所でない帯に残る札は控え (`trace`) で、書き換えていない受付が診察待ちへ移った患者を控える形。
 *
 * 札が居場所を変えた段は、元の席から滑る。同じ帯の中で席が変わる札も、その帯の元の席から滑る。
 * 札が箱を書いた順で前の帯へ移り、段の始まりにその帯に居なかった時は差し戻し (`back`) で、元の帯に抜けた跡 (`from`) を残す。
 * 前の段にどの帯にも居た札が、どの帯からも消えた時は外れた跡 (`gone`) を残す。跡はその段の帯の札の後の席に置く。
 * 前の段にどこにも居なかった色付きの札は、現れた段だけ「足した」の印を持つ。段 1 の札は印を持たない。
 *
 * 帯が変わる時刻は、その段でその帯に書いた `line` の出来事。書いていない帯が控えに変わる時刻は、その札に触れた最初の `line` の出来事
 */

/** 札が帯の席に居る間 1 回分。`source` は滑り始める席で、弾んで現れる札は持たない。`until` は席を離れる出来事 */
interface WalkSeat extends LineupAt {
  id: string;
  lane: string;
  index: number;
  /** 居場所でない帯に残る控えか */
  trace: boolean;
  source?: WalkSeat;
  until?: LineupAt;
  /** 帯を移ったか、初めて現れた段か (段 1 を除く) */
  moved: boolean;
  /** 現れた段だけ付ける印。差し戻した札は `back`、前の段にどこにも居なかった色付きの札は `added` */
  tag?: "added" | "back";
}

/** 抜けた跡。`from` は差し戻しで出た帯、`gone` はどの帯からも外れた札の帯。その段の終わりまで見せる */
interface WalkGhost extends LineupAt {
  id: string;
  lane: string;
  index: number;
  kind: "from" | "gone";
}

/** 差し戻し。`seat` は戻った先の席 */
interface WalkBack extends LineupAt {
  id: string;
  from: string;
  to: string;
  seat: WalkSeat;
}

/** 段の中で札が後ろの帯へ移った区間。同じ区間を移る札が何枚あっても 1 つにまとめ、最も早い出来事を持つ */
interface WalkRun extends LineupAt {
  from: string;
  to: string;
}

interface Walk {
  seats: WalkSeat[];
  ghosts: WalkGhost[];
  backs: WalkBack[];
  runs: WalkRun[];
  /** 帯ごとの、段ごとの札の数 (書いた並びの数で、控えも数える) */
  counts: Map<string, number[]>;
  /** 帯ごとの、一度に使う席の数の最も多い数。控えと跡も数える */
  most: Map<string, number>;
}

/**
 * 段ごとの札の居場所を読む。`order` は箱を書いた順、`colored` は札が色を持つか。
 * `pickedAt` はその出来事の時に選んでいる箱で、同じ札が幾つもの帯から移れる時は選んだ箱から滑らせる
 */
function walkLineup(diagram: DiagramModel, lines: Line[], order: string[], colored: (id: string) => boolean, pickedAt: (at: LineupAt) => string | undefined): Walk {
  const rank = new Map(order.map((id, k) => [id, k]));
  const cont = new Map<string, string[]>(order.map((id) => [id, []]));
  const wrote = new Map<string, number>();
  const key = (lane: string, id: string): string => `${lane}\u0000${id}`;
  let live = new Map<string, WalkSeat>();
  const seats: WalkSeat[] = [];
  const ghosts: WalkGhost[] = [];
  const backs: WalkBack[] = [];
  const runs: WalkRun[] = [];
  const counts = new Map<string, number[]>(order.map((id) => [id, []]));
  const most = new Map<string, number>(order.map((id) => [id, 0]));

  /** 札ごとの居場所の帯。札を最も後の段に書いた帯で、同じ段に書いた帯はどれも居場所にする */
  const mainOf = (): Map<string, Set<string>> => {
    const last = new Map<string, number>();
    for (const lane of order) for (const id of cont.get(lane) ?? []) last.set(id, Math.max(last.get(id) ?? -1, wrote.get(lane) ?? -1));
    const main = new Map<string, Set<string>>();
    for (const lane of order)
      for (const id of cont.get(lane) ?? []) {
        if (wrote.get(lane) !== last.get(id)) continue;
        const set = main.get(id) ?? new Set<string>();
        set.add(lane);
        main.set(id, set);
      }
    return main;
  };

  diagram.steps.forEach((_, s) => {
    const mine = lines.filter((l) => l.step === s);
    if (mine.length > 0) {
      const startMain = mainOf();
      const startLive = [...live.values()];
      const present = new Set(order.flatMap((lane) => cont.get(lane) ?? []));
      /** 帯ごとの、その段で最後に書いた出来事と、札ごとの、その段で最初に触れた出来事 */
      const laneEvent = new Map<string, number>();
      const touch = new Map<string, number>();
      for (const line of mine) {
        for (const id of [...(cont.get(line.lane) ?? []), ...line.items]) if (!touch.has(id)) touch.set(id, line.event);
        cont.set(line.lane, line.items);
        wrote.set(line.lane, s);
        laneEvent.set(line.lane, line.event);
      }
      const endMain = mainOf();
      const firstEvent = (mine[0] as Line).event;
      const eventOf = (lane: string, id: string): number => laneEvent.get(lane) ?? touch.get(id) ?? firstEvent;
      /** 帯を移る札の滑り始める席。選んだ箱の席、居場所の席、控えの席の順に、後に座った席を選ぶ */
      const sourceOf = (id: string, lane: string, at: LineupAt): WalkSeat | undefined => {
        const others = startLive.filter((c) => c.id === id && c.lane !== lane);
        const picked = pickedAt(at);
        return others.find((c) => c.lane === picked) ?? others.filter((c) => !c.trace).at(-1) ?? others.at(-1);
      };

      const next = new Map<string, WalkSeat>();
      for (const lane of order) {
        (cont.get(lane) ?? []).forEach((id, index) => {
          const trace = !endMain.get(id)?.has(lane);
          const k = key(lane, id);
          const prev = live.get(k);
          if (prev && prev.index === index && prev.trace === trace) {
            next.set(k, prev);
            return;
          }
          const at: LineupAt = { step: s, event: eventOf(lane, id) };
          if (prev) prev.until = at;
          const source = trace ? undefined : (prev ?? sourceOf(id, lane, at));
          const back = !trace && !prev && source !== undefined && (rank.get(lane) ?? 0) < (rank.get(source.lane) ?? 0);
          const added = !trace && s > 0 && !present.has(id) && colored(id);
          const seat: WalkSeat = {
            ...at,
            id,
            lane,
            index,
            trace,
            ...(source ? { source } : {}),
            moved: !trace && s > 0 && (source === undefined || source.lane !== lane),
            ...(back ? { tag: "back" as const } : added ? { tag: "added" as const } : {}),
          };
          seats.push(seat);
          next.set(k, seat);
          if (back && source) backs.push({ ...at, id, from: source.lane, to: lane, seat });
          else if (source && source.lane !== lane && !trace) {
            const run = runs.find((r) => r.step === s && r.from === source.lane && r.to === lane);
            if (!run) runs.push({ ...at, from: source.lane, to: lane });
            else if (at.event < run.event) run.event = at.event;
          }
        });
      }
      // 書き直した並びに無い札は、その帯を離れる
      for (const [k, seat] of live) if (!next.has(k)) seat.until = { step: s, event: eventOf(seat.lane, seat.id) };
      live = next;

      // 跡は、その段の帯の札の後の席に置く
      const extra = new Map<string, number>();
      const ghost = (id: string, lane: string, event: number, kind: "from" | "gone"): void => {
        const n = extra.get(lane) ?? 0;
        ghosts.push({ step: s, event, id, lane, index: (cont.get(lane) ?? []).length + n, kind });
        extra.set(lane, n + 1);
      };
      for (const b of backs.filter((x) => x.step === s)) if (!(cont.get(b.from) ?? []).includes(b.id)) ghost(b.id, b.from, b.event, "from");
      for (const [id, lanes] of startMain) {
        if (endMain.has(id)) continue;
        for (const lane of order) if (lanes.has(lane)) ghost(id, lane, eventOf(lane, id), "gone");
      }
      for (const lane of order) most.set(lane, Math.max(most.get(lane) ?? 0, (cont.get(lane) ?? []).length + (extra.get(lane) ?? 0)));
    }
    for (const lane of order) counts.get(lane)?.push((cont.get(lane) ?? []).length);
  });
  return { seats, ghosts, backs, runs, counts, most };
}
