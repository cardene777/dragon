/**
 * `press` のブロックの読み方 (#3349)。読む処理と書き戻す処理と日英の誤りの文を、入口に置く定義 (`block.ts`) と分けて持つ。
 * 軽い入口は、後から読む図の種類の個別ブロックの読み方を、書いた図が使う時に読む
 */
import { attrs, num } from "../../print-kit";
import { fail, readDeclared } from "../../read-kit";
import type { SourceLine } from "../../tokenize";
import { faultOf, needed, refer, valueAt } from "../../try-read";
import type { BlockReading, ParseState } from "../block";

const PUSH = /^press\s+(\S+)\s*$/du;

/** 釦が取り出す件数。1 以上の整数 */
const COUNT = /^[1-9][0-9]*$/u;

export interface PressMessages {
  pressShape: string;
  /** 釦の置き場所 `at` に釦を名指した */
  pressAt: (id: string) => string;
  badTake: string;
}

/** 最初の step より前の `press <名札> [from: <待ち行列>, into: <機械の列か記録の列>, take: <数>, at: <部品>]` の行 */
function readPress(source: SourceLine, state: ParseState): void {
  const { m } = state;
  const declared = readDeclared(source, "press", state.attrs.press ?? [], m);
  if (declared.name !== undefined) throw fail(source, 0, m.pressShape);
  state.declare(source, declared.id, declared.idAt);
  const read = declared.attrs;
  const rest = source.text.indexOf("[");
  const at = rest < 0 ? source.text.length : rest;
  const from = needed(source, read, "press", "from", at, state);
  const into = needed(source, read, "press", "into", at, state);
  const take = needed(source, read, "press", "take", at, state);
  if (!COUNT.test(take.value)) throw fail(source, valueAt(source, take), m.badTake);
  refer(source, from, ["queue"], state);
  refer(source, into, ["chain", "log"], state);
  const place = read.get("at");
  if (place) {
    refer(source, place, ["route", "queue", "chain", "log", "ask"], state);
    if (place.value === declared.id) throw fail(source, valueAt(source, place), m.pressAt(place.value));
  }
  state.figure.try.parts.push({ type: "press", id: declared.id, from: from.value, into: into.value, take: Number(take.value), ...(place ? { at: place.value } : {}) });
}

/** 段の中の `press <釦>` の行。空の待ち行列から取り出す釦は押せない */
function readPush(source: SourceLine, state: ParseState): void {
  const { m } = state;
  const step = state.inStep(source);
  const found = PUSH.exec(source.text);
  const id = found?.[1];
  if (!found || id === undefined) throw fail(source, 0, m.pressShape);
  const at = found.indices?.[1]?.[0] ?? 0;
  const declared = state.figure.try.parts.find((p) => p.id === id);
  if (!declared) throw fail(source, at, m.undeclaredPart(id));
  if (declared.type !== "press") throw fail(source, at, m.wrongPart(id, ["press"]));
  const fault = state.figure.try.run?.press(id).fault;
  if (fault) throw faultOf(source, fault, state, [], id);
  step.events.push({ type: "press", press: id });
}

export const reading: BlockReading<PressMessages> = {
  read: {
    press: (source, state) => (state.current() ? readPush(source, state) : readPress(source, state)),
  },
  print: {
    part: (part) =>
      part.type === "press"
        ? `press ${part.id}${attrs([
            ["from", part.from],
            ["into", part.into],
            ["take", num(part.take)],
            ["at", part.at],
          ])}`
        : "",
    events: {
      press: (e) => `press ${e.press}`,
    },
  },
  messages: {
    ja: {
      pressShape: "press は最初の step より前なら press <名札> [from: <待ち行列>, into: <機械の列か記録の列>, take: <数>]、step の中なら press <名札> の形で書く",
      pressAt: (id) => `${id} は釦なので、釦の置き場所にできない`,
      badTake: "take は 1 以上の整数にする",
    },
    en: {
      pressShape: "Write press as press <id> [from: <queue>, into: <chain or log>, take: <count>] before the first step, or as press <id> inside a step",
      pressAt: (id) => `${id} is a button, so a button cannot be placed at it`,
      badTake: "take is a whole number of 1 or more",
    },
  },
};
