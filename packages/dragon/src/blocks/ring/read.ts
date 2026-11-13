/**
 * `ring` のブロックの読み方 (#3623)。回り続ける図の決まりを、入口に置く定義 (`block.ts`) と分けて持つ。
 * 軽い入口は、後から読む図の種類の個別ブロックの読み方を、書いた図が使う時に読む。
 *
 * 段の中の線は、書いた所で輪の次の手順への線かを確かめ、手順の数は記法の終わりに確かめる。
 * 時計の文字盤の見た目 (#3638) と輪を開いた帯の見た目 (#3639) の手順の長さは、箱の行を箱のブロックより先に読んで (`take`) 確かめ、図の種類の行の `shape` と `turn` は最初の段を始める時 (`settle`) に確かめる。
 * 時計の文字盤の見た目は全ての箱に長さを求め、帯の見た目は全ての箱に書くかどの箱にも書かないかを求める。
 * 確かめた見た目と向きは、原本の根の `cycle` の欄に置く
 */
import { fail, isOneOf, readDeclared } from "../../read-kit";
import type { Box } from "../../schema";
import { type BlockReading, none } from "../block";
import { EDGE, type EdgeEvent } from "../edge/block";
import { CYCLE_SHAPES, CYCLE_TURNS, type CycleShape, RING_STEPS, timeOf } from "./limits";

export interface RingMessages {
  /** 手順の数が輪に置ける数の外 */
  cycleSteps: (least: number, most: number, count: number) => string;
  /** 輪の次の手順でない手順への線 */
  cycleNotNext: (from: string, to: string, next: string) => string;
  /** 名前を持つ線 */
  cycleNamed: string;
  /** 回り続ける図に書けない行 */
  cycleNoLine: (word: string) => string;
  /** `shape` に `clock` と `band` のほかの値を書いた (#3638、#3639) */
  cycleBadShape: string;
  /** 時計の文字盤の見た目でない図に `turn` を書いた (#3638) */
  cycleTurnNeedsClock: string;
  /** `turn` に `left` のほかの値を書いた (#3638) */
  cycleBadTurn: string;
  /** 時計の文字盤の見た目でも帯の見た目でもない図の箱に `time` を書いた (#3638) */
  cycleTimeNeedsClock: string;
  /** 時計の文字盤の見た目で、箱 `id` に `time` が無い (#3638) */
  cycleNoTime: (id: string) => string;
  /** `time` の値 `value` が、0 でない数と単位の組でない (#3638) */
  cycleBadTime: (value: string) => string;
  /** 帯の見た目で、ほかの箱に `time` を書いたのに箱 `id` に `time` が無い (#3639) */
  cycleBandTime: (id: string) => string;
}

/** 回り続ける図に書けない行の頭の語 */
const NO_LINES: readonly string[] = ["act", "group", "end"];

export const reading: BlockReading<RingMessages> = {
  // 箱の行は、手順の長さ (`time`) を足した鍵で箱のブロックの読み方に読ませ、読んだ箱に長さを足す
  take: (source, state) => {
    const { m } = state;
    const box = [...(state.attrs.box ?? []), "time"];
    const time = readDeclared(source, "box", box, m).attrs.get("time");
    const shape = state.head.get("shape")?.value;
    const clock = shape === CYCLE_SHAPES[0];
    const band = shape === CYCLE_SHAPES[1];
    if (time && !clock && !band) throw fail(source, time.at, m.cycleTimeNeedsClock);
    if (time && !timeOf(time.value)) throw fail(source, time.at, m.cycleBadTime(time.value));
    const before = [...state.figure.boxes];
    state.reader("box")?.(source, { ...state, attrs: { ...state.attrs, box } }, () => undefined);
    const read = state.figure.boxes.at(-1) as Box;
    if (time) read.time = time.value;
    else if (clock) throw fail(source, 0, m.cycleNoTime(read.id));
    // 帯の見た目は、全ての箱に長さを書くかどの箱にも書かない。長さの無い箱を、その箱の行かその後で長さを書いた行で止める
    const bare = band ? (time ? before.find((b) => b.time === undefined) : before.some((b) => b.time !== undefined) ? read : undefined) : undefined;
    if (bare) throw fail(source, 0, m.cycleBandTime(bare.id));
    return true;
  },
  checkHead: (source, word, state) => {
    if (NO_LINES.includes(word)) throw fail(source, 0, state.m.cycleNoLine(word));
  },
  settle: (state, head) => {
    const { m } = state;
    const shape = state.head.get("shape");
    const turn = state.head.get("turn");
    if (shape && !isOneOf(CYCLE_SHAPES, shape.value)) throw fail(head, shape.at, m.cycleBadShape);
    if (turn && shape?.value !== CYCLE_SHAPES[0]) throw fail(head, turn.at, m.cycleTurnNeedsClock);
    if (turn && !isOneOf(CYCLE_TURNS, turn.value)) throw fail(head, turn.at, m.cycleBadTurn);
    if (shape) state.figure.root = { ...state.figure.root, cycle: { shape: shape.value as CycleShape, ...(turn ? { turn: CYCLE_TURNS[0] } : {}) } };
  },
  afterEdge: (edge, state, source) => {
    const read = edge as EdgeEvent;
    const found = EDGE.exec(source.text);
    const toAt = found?.indices?.[2]?.[0] ?? 0;
    if (read.label !== undefined || read.labelSide !== undefined) throw fail(source, found?.[0].length ?? 0, state.m.cycleNamed);
    const ids = state.figure.boxes.map((box) => box.id);
    const next = ids[(ids.indexOf(read.from) + 1) % ids.length] ?? read.from;
    if (read.to !== next) throw fail(source, toAt, state.m.cycleNotNext(read.from, read.to, next));
  },
  finish: (state, head) => {
    const { boxes } = state.figure;
    const count = boxes.length;
    if (count < RING_STEPS.least || count > RING_STEPS.most) throw fail(head, 0, state.m.cycleSteps(RING_STEPS.least, RING_STEPS.most, count));
    // 使う人が足した箱のブロックの行 (`+<名前>`) は箱の行の形で見ないので、長さの無い手順をここでも止める
    const shape = state.figure.root?.cycle?.shape;
    const bare = boxes.find((box) => box.time === undefined);
    if (bare && shape === CYCLE_SHAPES[0]) throw fail(head, 0, state.m.cycleNoTime(bare.id));
    if (bare && shape === CYCLE_SHAPES[1] && boxes.some((box) => box.time !== undefined)) throw fail(head, 0, state.m.cycleBandTime(bare.id));
  },
  read: none("輪の行は無い。手順は box の行で、線は線のブロックが読み、ここは決まりだけを確かめる"),
  print: none("輪は手順の箱と線から並べるので、箱と線のブロックが書く。見た目と向きは図の種類の行が書く"),
  messages: {
    ja: {
      cycleSteps: (least, most, count) => `回り続ける図の手順 (box の行) は ${least} 行から ${most} 行まで書く。今は ${count} 行`,
      cycleNotNext: (from, to, next) => `${from} の次の手順は ${next} なので、${to} へは線を引けない。回り続ける図の線は輪の次の手順へ引く`,
      cycleNamed: "回り続ける図の線は名前を持たない。走る札は [tag: <字>] で書く",
      cycleNoLine: (word) => `cycle (回り続ける図) には ${word} の行を書けない`,
      cycleBadShape: "cycle (回り続ける図) の shape には clock か band を書ける。clock は手順を長さの弧で置く時計の文字盤、band は手順を左から右へ山形で並べる帯",
      cycleTurnNeedsClock: "turn は [shape: clock] の回り続ける図にだけ書ける",
      cycleBadTurn: "turn には left だけを書ける。left は文字盤を左回りにする",
      cycleTimeNeedsClock: "time は [shape: clock] か [shape: band] の回り続ける図の box にだけ書ける",
      cycleNoTime: (id) => `${id} に time を書く。時計の文字盤の見た目では、手順ごとの長さを [time: 25min] の形で書く`,
      cycleBadTime: (value) => `${value} は手順の長さ (time) に書けない。長さは 0 でない数と単位 (ms / s / min / h / d) の組で書く (25min など)`,
      cycleBandTime: (id) => `${id} に time を書く。帯の見た目 ([shape: band]) では、time を全ての box に書くか、どの box にも書かない`,
    },
    en: {
      cycleSteps: (least, most, count) => `A cycle diagram takes ${least} to ${most} steps (box lines), not ${count}`,
      cycleNotNext: (from, to, next) => `The step after ${from} is ${next}, so a line cannot go to ${to}. In a cycle diagram a line goes to the next step on the ring`,
      cycleNamed: "Lines in a cycle diagram take no label. Write the chip that runs as [tag: <text>]",
      cycleNoLine: (word) => `A cycle diagram takes no ${word} lines`,
      cycleBadShape: "A cycle diagram takes clock or band for shape. clock is a dial that sets each step as an arc as long as it takes, and band runs the steps left to right as chevrons",
      cycleTurnNeedsClock: "turn can be written only in a cycle diagram with [shape: clock]",
      cycleBadTurn: "turn takes only left, which turns the dial counterclockwise",
      cycleTimeNeedsClock: "time can be written only on box lines of a cycle diagram with [shape: clock] or [shape: band]",
      cycleNoTime: (id) => `Write time on ${id}. With the clock dial look, give each step a length such as [time: 25min]`,
      cycleBadTime: (value) => `${value} cannot be a step length (time). Write a number other than 0 and a unit (ms / s / min / h / d), such as 25min`,
      cycleBandTime: (id) => `Write time on ${id}. With the band look ([shape: band]), write time on every box or on none`,
    },
  },
};
