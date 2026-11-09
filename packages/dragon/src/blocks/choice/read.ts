/**
 * `choice` のブロックの読み方 (#3561)。読む処理と書き戻す処理と日英の誤りの文を、入口に置く定義 (`block.ts`) と分けて持つ。
 * 軽い入口は、後から読む図の種類の個別ブロックの読み方を、書いた図が使う時に読む。
 *
 * 手順の図の決まりもここが持つ。線の端の `start` と `finish`、名札に使えない名前、`group` の行を断ること、
 * 最初の段より前の線 (今回は通らない道) を読むこと、判断から出る線の数と名前、本筋で前に置いた箱へ戻る線を断ること。
 * 本筋は段の線が初めて辿り着く順の箱と判断で、手順の図の並べ方 (`kinds/flow/layout.ts`) が上から下へ 1 列に並べる。
 * 段の中の線は書いた所で確かめ、最初の段より前の線は本筋が決まった記法の終わりに確かめる。
 */
import { fail, isOneOf, readDeclared } from "../../read-kit";
import { shown } from "../../print-kit";
import type { SourceLine } from "../../tokenize";
import type { BlockReading, ParseState } from "../block";
import { EDGE } from "../edge/block";
import { line, readLine } from "../edge/read";
import { STATE_ENDS } from "../start-finish/block";
import { CHOICE_WAYS, type FlowLine, walkLine } from "./block";

export interface ChoiceMessages {
  /** 手順の図の箱か判断の名札に、始まりか終わりの印の名前を書いた */
  flowReservedId: (id: string) => string;
  flowIntoStart: string;
  flowOutOfFinish: string;
  flowNoGroup: string;
  flowEmpty: string;
  /** 最初の step より前の線に属性を書いた */
  flowPathNoAttrs: string;
  /** 判断から出る線に名前が無い */
  choiceUnnamed: (id: string) => string;
  /** 判断から 3 つ目の行き先へ線を出した */
  choiceWays: (id: string, most: number) => string;
  /** 本筋で前に置いた箱か判断へ戻る線 */
  flowBack: (from: string, to: string) => string;
}

const isEnd = (id: string): boolean => isOneOf(STATE_ENDS, id);

/**
 * 本筋に無い箱が掛かる本筋の位置。その箱へ道を出す本筋の箱か判断のうち最も上の位置で、本筋に無い箱から道を引かれた箱はその箱の位置を継ぐ。
 * どこからも道を引かれない箱は位置を持たない
 */
function anchors(order: string[], lines: readonly FlowLine[]): Map<string, number> {
  const at = new Map(order.map((id, k) => [id, k]));
  const out = new Map<string, number>();
  for (let changed = true; changed; ) {
    changed = false;
    for (const l of lines) {
      if (isEnd(l.to) || at.has(l.to)) continue;
      const from = at.get(l.from) ?? out.get(l.from);
      if (from === undefined || (out.get(l.to) ?? Number.POSITIVE_INFINITY) <= from) continue;
      out.set(l.to, from);
      changed = true;
    }
  }
  return out;
}

/** 線 `l` が本筋で前に置いた箱か判断へ戻るか。送る側の位置は本筋の位置か、本筋に無い箱が掛かる位置 */
function goesBack(l: FlowLine, order: string[], hung: Map<string, number>): boolean {
  if (l.from === l.to) return true;
  const to = order.indexOf(l.to);
  if (to < 0) return false;
  const from = order.includes(l.from) ? order.indexOf(l.from) : hung.get(l.from);
  return from !== undefined && to <= from;
}

/** 線を読んだ時の確かめ。判断から出る線の名前と数と、段の中の線が本筋で前へ戻らないかを見て、読んだ線を積む */
function record(source: SourceLine, read: { from: string; to: string; label?: string }, state: ParseState, inStep: boolean): void {
  const { m } = state;
  const flow = state.figure.flow;
  const edge = EDGE.exec(source.text);
  const fromAt = edge?.indices?.[1]?.[0] ?? 0;
  const toAt = edge?.indices?.[2]?.[0] ?? 0;
  if (flow.choices.some((c) => c.id === read.from)) {
    if (read.label === undefined) throw fail(source, fromAt, m.choiceUnnamed(read.from));
    const ways = new Set([...flow.lines.filter((l) => l.from === read.from).map((l) => l.to), read.to]);
    if (ways.size > CHOICE_WAYS) throw fail(source, fromAt, m.choiceWays(read.from, CHOICE_WAYS));
  }
  const drawn: FlowLine = { source, from: read.from, to: read.to, toAt, inStep };
  if (inStep) {
    walkLine(flow, read, (id) => flow.choices.some((c) => c.id === id));
    if (goesBack(drawn, flow.main, anchors(flow.main, [...flow.lines, drawn]))) throw fail(source, toAt, m.flowBack(read.from, read.to));
  }
  flow.lines.push(drawn);
}

export const reading: BlockReading<ChoiceMessages> = {
  // 最初の段より前の線は今回は通らない道。属性は書けない
  take: (source, state) => {
    const edge = EDGE.exec(source.text);
    if (!edge) return false;
    const read = readLine(source, edge, state);
    if (read.at < source.text.length) throw fail(source, read.at, source.text[read.at] === "[" ? state.m.flowPathNoAttrs : state.m.edgeShape);
    const path = { from: read.from, to: read.to, ...(read.label !== undefined ? { label: read.label } : {}) };
    record(source, path, state, false);
    state.figure.flow.paths.push(path);
    return true;
  },
  // 判断から同じ段に書いた線を数え直す (#3579)
  beginStep: (state) => {
    state.figure.flow.forked.length = 0;
  },
  // 手順の図は箱を区画にまとめない
  checkHead: (source, word, state) => {
    if (word === "group" || word === "end") throw fail(source, 0, state.m.flowNoGroup);
  },
  // 線の送る側に始まりの印 `start`、受ける側に終わりの印 `finish` を書ける。判断も線の端に書ける
  endAt: (source, id, at, side, state) => {
    if (isEnd(id)) {
      if ((id === "start") !== (side === "from")) throw fail(source, at, id === "start" ? state.m.flowIntoStart : state.m.flowOutOfFinish);
      return id;
    }
    return state.figure.flow.choices.some((c) => c.id === id) ? id : undefined;
  },
  reserved: (source, id, at, state) => {
    if (isEnd(id)) throw fail(source, at, state.m.flowReservedId(id));
  },
  afterEdge: (edge, state, source) => record(source, edge, state, true),
  finish: (state, head) => {
    if (state.figure.boxes.length === 0 && state.figure.flow.choices.length === 0) throw fail(head, 0, state.m.flowEmpty);
  },
  // 最初の段より前の線は、本筋が決まってから、前へ戻らないかを確かめる
  verify: (state) => {
    const { main, lines } = state.figure.flow;
    const hung = anchors(main, lines);
    const back = lines.find((l) => !l.inStep && goesBack(l, main, hung));
    if (back) throw fail(back.source, back.toAt, state.m.flowBack(back.from, back.to));
  },
  read: {
    choice: (source, state) => {
      state.beforeSteps(source);
      const declared = readDeclared(source, "choice", [], state.m);
      state.claim(source, declared.id, declared.idAt);
      state.figure.flow.choices.push({ id: declared.id, name: declared.name ?? declared.id });
    },
  },
  print: {
    // 判断は箱の宣言の後ろに、原本の並びのまま書く
    declare: (diagram) => (diagram.flow && diagram.flow.choices.length > 0 ? [diagram.flow.choices.map((c) => `choice ${c.id}${shown(c.id, c.name)}`).join("\n")] : []),
    // 今回は通らない道は中身の帯の宣言の後ろ、最初の `step` より前に、原本の並びのまま書く
    figure: (diagram) => (diagram.flow && diagram.flow.paths.length > 0 ? [diagram.flow.paths.map((p) => line(p.from, p.to, p.label)).join("\n")] : []),
  },
  messages: {
    ja: {
      flowReservedId: (id) => `${id} は手順の図の始まりと終わりの印の名前で、箱と判断の名札に使えない`,
      flowIntoStart: "start へ入る線は書けない。start は始まりの印で、線は start から出る",
      flowOutOfFinish: "finish から出る線は書けない。finish は終わりの印で、線は finish へ入る",
      flowNoGroup: "flow (手順の図) には group を書けない。手順は box と choice の行で宣言する",
      flowEmpty: "flow (手順の図) には box か choice を 1 つ以上宣言する",
      flowPathNoAttrs: "最初の step より前の線は今回は通らない道なので、属性 (carry と tag と side) を書けない",
      choiceUnnamed: (id) => `判断 ${id} から出る線には、はいやいいえのような名前を書く`,
      choiceWays: (id, most) => `判断 ${id} から出せる線の行き先は ${most} つまで。3 つ以上に分かれる時は判断を重ねる`,
      flowBack: (from, to) => `${to} は本筋で ${from} より前に置くので、${from} から戻る線は書けない。戻る道は state (状態遷移図) で描く`,
    },
    en: {
      flowReservedId: (id) => `${id} names the start or end mark of a flow diagram and cannot be a box or choice id`,
      flowIntoStart: "A line cannot go into start. start is the start mark, and lines leave it",
      flowOutOfFinish: "A line cannot leave finish. finish is the end mark, and lines go into it",
      flowNoGroup: "A flow diagram takes no group. Declare the steps with box and choice lines",
      flowEmpty: "Declare at least one box or choice in a flow diagram",
      flowPathNoAttrs: "A line before the first step is a path not taken, so it takes no attributes (carry, tag, side)",
      choiceUnnamed: (id) => `Name each line that leaves the choice ${id}, such as yes or no`,
      choiceWays: (id, most) => `A choice leads to at most ${most} places, but ${id} leads to more. Chain two choices to split three ways`,
      flowBack: (from, to) => `${to} comes before ${from} on the main path, so a line cannot go back from ${from} to it. Draw a loop in a state diagram`,
    },
  },
};
