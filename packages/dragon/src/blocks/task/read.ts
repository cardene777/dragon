/**
 * `task` のブロックの読み方 (#3562)。読む処理と書き戻す処理と日英の誤りの文を、入口に置く定義 (`block.ts`) と分けて持つ。
 * 軽い入口は、後から読む図の種類の個別ブロックの読み方を、書いた図が使う時に読む。
 *
 * 作業の行は `task <名札> as <名前> <範囲> [color: <色>]` で、名前は空白を含められる。範囲は `[` か行の終わりの前の最後の語。
 * 名前が要らない時は `task <名札> <範囲>` と書き、名札を名前にする。
 * 書き戻す時は、作業と印の列の行を宣言した順 (作業の `after`) に 1 つの塊で書く。作業を持たない図の印の列の行は印の列のブロックが書く
 */
import { attrs, shown } from "../../print-kit";
import { AS, fail, ID, isOneOf, readAttrs, readQuoted, skipSpaces } from "../../read-kit";
import type { SourceLine } from "../../tokenize";
import type { BlockReading, ParseState } from "../block";
import { type Color, COLORS } from "../color/block";
import { rowLine } from "../row/read";
import { range, rangeAt } from "../scale/read";
import { type TimeTask, timeLines } from "./block";
import type { DiagramModel } from "../../schema";

export interface TaskMessages {
  taskShape: string;
}

/** 目盛りの範囲の形。`0-31` か `0` */
const RANGE = /^[0-9]+(?:-[0-9]+)?$/u;

/** `task <名札> as <名前> <範囲> [color: <色>]` の行。名前を書かない時は名札を名前にする */
function readTask(source: SourceLine, state: ParseState): void {
  const { m } = state;
  const { rows, tasks, pending } = state.figure.time;
  state.beforeSteps(source);
  const text = source.text;
  const start = skipSpaces(text, "task".length);
  const id = /^[^\s[]+/u.exec(text.slice(start))?.[0];
  if (id === undefined) throw fail(source, 0, m.taskShape);
  if (!ID.test(id)) throw fail(source, start, m.badId(id));
  let at = skipSpaces(text, start + id.length);
  let name = id;
  let span: { text: string; at: number } | undefined;
  if (text.startsWith(AS, at) && /^(\s|$)/u.test(text.slice(at + AS.length, at + AS.length + 1))) {
    const named = skipSpaces(text, at + AS.length);
    if (text[named] === '"') {
      const quoted = readQuoted(source, named, m);
      name = quoted.value;
      at = skipSpaces(text, quoted.end);
    } else {
      // 名前の後ろの最後の語が範囲。名前は空白を含められる
      const open = text.indexOf("[", named);
      const words = text.slice(named, open < 0 ? text.length : open).trimEnd();
      const cut = words.search(/\s\S*$/u);
      if (cut < 0) {
        if (RANGE.test(words)) throw fail(source, at, m.emptyName(id));
        throw fail(source, named + words.length, m.taskShape);
      }
      name = words.slice(0, cut).trim();
      const last = skipSpaces(words, cut);
      span = { text: words.slice(last), at: named + last };
      at = skipSpaces(text, named + words.length);
    }
    if (name === "") throw fail(source, at, m.emptyName(id));
  }
  if (span === undefined) {
    const word = /^[^\s[]+/u.exec(text.slice(at))?.[0];
    if (word === undefined) throw fail(source, at, m.taskShape);
    span = { text: word, at };
    at = skipSpaces(text, at + word.length);
  }
  if (at < text.length && text[at] !== "[") throw fail(source, at, m.taskShape);
  const color = at < text.length ? readAttrs(source, at, state.attrs.task ?? [], m).get("color") : undefined;
  if (color && !isOneOf(COLORS, color.value)) throw fail(source, color.at, m.badColor);
  state.notReserved(source, id, start);
  if (rows.some((row) => row.id === id)) throw fail(source, start, m.duplicate(id));
  state.declare(source, id, start);
  const after = rows.at(-1)?.id;
  // 目盛りの数が決まってから範囲を確かめる。欄の並びを宣言の形で残すため、先に範囲の欄を置く
  const task: TimeTask = { id, name, from: 0, to: 0, ...(color ? { color: color.value as Color } : {}), ...(after !== undefined ? { after } : {}) };
  tasks.push(task);
  const written = span;
  pending.push(() => {
    const { from, to } = rangeAt(source, written.at, written.text, state);
    task.from = from;
    task.to = to;
  });
}

/** 作業の行の書き戻し */
const taskLine = (t: TimeTask): string => `task ${t.id}${shown(t.id, t.name)} ${range(t.from, t.to)}${attrs([["color", t.color]])}`;

export const reading: BlockReading<TaskMessages> = {
  read: { task: readTask },
  print: {
    // 作業を持つ図は、作業と印の列の行を宣言した順に、目盛りの塊の後ろの 1 つの塊で書く
    lead: (diagram: DiagramModel) => {
      const time = diagram.time;
      const tasks = time?.tasks ?? [];
      if (!time || tasks.length === 0) return [];
      return [timeLines(time.rows, tasks).map((line) => ("task" in line ? taskLine(line.task) : rowLine(line.row))).join("\n")];
    },
  },
  messages: {
    ja: { taskShape: "task は task <名札> as <名前> <範囲> [color: <色>] の形で書く" },
    en: { taskShape: "Write a task as task <id> as <name> <range> [color: <color>]" },
  },
};
