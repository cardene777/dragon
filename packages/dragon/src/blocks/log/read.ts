/**
 * `log` のブロックの読み方 (#3441)。読む処理と書き戻す処理と日英の誤りの文を、入口に置く定義 (`block.ts`) と分けて持つ。
 * 軽い入口は、後から読む図の種類の個別ブロックの読み方を、書いた図が使う時に読む
 */
import { attrs } from "../../print-kit";
import { fail, ID, readDeclared } from "../../read-kit";
import type { TryVerdict } from "../../schema";
import type { SourceLine } from "../../tokenize";
import { fieldAt, needed, valueAt } from "../../try-read";
import type { BlockReading, ParseState } from "../block";

/** `all` の値。`<欄> = <値>` の形で、欄と値の前後の空白は読まない */
const ALL = /^([^\s=]+)\s*=\s*(\S(?:.*\S)?)$/u;

export interface LogMessages {
  logShape: string;
  allShape: string;
}

/** `log <名札> [all: <欄> = <値>, yes: <印>, no: <印>]` の行。all と yes と no は 3 つ揃えて書くか、どれも書かない */
function readLog(source: SourceLine, state: ParseState): void {
  const { m } = state;
  if (state.current()) throw fail(source, 0, m.tryPartInStep("log"));
  const declared = readDeclared(source, "log", state.attrs.log ?? [], m);
  if (declared.name !== undefined) throw fail(source, 0, m.logShape);
  state.declare(source, declared.id, declared.idAt);
  const read = declared.attrs;
  let all: TryVerdict | undefined;
  if (read.size > 0) {
    const open = source.text.indexOf("[");
    const rule = needed(source, read, "log", "all", open, state);
    const yes = needed(source, read, "log", "yes", open, state);
    const no = needed(source, read, "log", "no", open, state);
    const found = ALL.exec(rule.value);
    const field = found?.[1];
    const value = found?.[2];
    if (field === undefined || value === undefined || !ID.test(field)) throw fail(source, valueAt(source, rule), m.allShape);
    state.figure.try.pending.push(() => fieldAt(source, field, valueAt(source, rule), state));
    all = { field, value, yes: yes.value, no: no.value };
  }
  state.figure.try.parts.push({ type: "log", id: declared.id, ...(all ? { all } : {}) });
}

export const reading: BlockReading<LogMessages> = {
  read: { log: readLog },
  print: {
    part: (part) =>
      part.type === "log"
        ? `log ${part.id}${attrs([
            ["all", part.all ? `${part.all.field} = ${part.all.value}` : undefined],
            ["yes", part.all?.yes],
            ["no", part.all?.no],
          ])}`
        : "",
  },
  messages: {
    ja: {
      logShape: "log は log <名札> [all: <欄> = <値>, yes: <印>, no: <印>] の形で書く",
      allShape: "all は all: <欄> = <値> の形で書く",
    },
    en: {
      logShape: "Write a log as log <id> [all: <field> = <value>, yes: <mark>, no: <mark>]",
      allShape: "Write all as all: <field> = <value>",
    },
  },
};
