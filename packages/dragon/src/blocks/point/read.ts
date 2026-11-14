/**
 * `point` のブロックの読み方 (#3349)。読む処理と書き戻す処理と日英の誤りの文を、入口に置く定義 (`block.ts`) と分けて持つ。
 * 軽い入口は、後から読む図の種類の個別ブロックの読み方を、書いた図が使う時に読む
 */
import { type Attr, fail, ID, isOneOf, readAttrs, readName } from "../../read-kit";
import type { SourceLine } from "../../tokenize";
import type { BlockReading, ParseState } from "../block";
import { AT, type Color, COLORS, type TimePoint } from "../definition-values";
import { unitAt } from "../scale/read";

/** 時間軸の図の宣言の行 `point <名札> at <目盛り>` */
const POINT = new RegExp(`^point\\s+(\\S+)\\s+${AT}\\s+(\\S+)\\s*$`, "du");

export interface PointMessages {
  pointShape: string;
  /** 時間軸の図の note の行の名札が、箱でも節目でもない */
  undeclaredNote: (id: string) => string;
  noteColorPointOnly: string;
}

/** `point <名札> at <目盛り>` の行。箱と印の列と同じ名札は持てない */
function readPoint(source: SourceLine, state: ParseState): void {
  const { m } = state;
  const { rows, points, pending } = state.figure.time;
  state.beforeSteps(source);
  const found = POINT.exec(source.text);
  const id = found?.[1];
  const unit = found?.[2];
  if (!found || id === undefined || unit === undefined) throw fail(source, 0, m.pointShape);
  const idAt = found.indices?.[1]?.[0] ?? 0;
  const unitStart = found.indices?.[2]?.[0] ?? 0;
  if (!ID.test(id)) throw fail(source, idAt, m.badId(id));
  state.notReserved(source, id, idAt);
  if (rows.some((row) => row.id === id)) throw fail(source, idAt, m.duplicate(id));
  state.declare(source, id, idAt);
  const point: TimePoint = { id, at: 0 };
  points.push(point);
  pending.push(() => {
    point.at = unitAt(source, unitStart, unit, state);
  });
}

/** 時間軸の図の `note <箱か節目>: <字> [color: <色>]` の行。色は節目の丸の色 */
export function readTimeNote(source: SourceLine, state: ParseState): { type: "swap"; box: string; text: string; color?: Color } {
  const { m } = state;
  const found = /^note\s+([^\s:]+)\s*:/du.exec(source.text);
  const id = found?.[1];
  if (!found || id === undefined) throw fail(source, 0, m.noteShape);
  const idAt = found.indices?.[1]?.[0] ?? 0;
  const isPoint = state.figure.time.points.some((point) => point.id === id);
  if (!isPoint && !state.figure.boxes.some((box) => box.id === id)) throw fail(source, idAt, m.undeclaredNote(id));
  const named = readName(source, found[0].length, m);
  if (named.value === "") throw fail(source, 0, m.noteShape);
  const color: Attr | undefined = named.rest < source.text.length ? readAttrs(source, named.rest, state.attrs.note ?? [], m).get("color") : undefined;
  if (color && !isPoint) throw fail(source, color.at, m.noteColorPointOnly);
  if (color && !isOneOf(COLORS, color.value)) throw fail(source, color.at, m.badColor);
  return { type: "swap", box: id, text: named.value, ...(color ? { color: color.value as Color } : {}) };
}

export const reading: BlockReading<PointMessages> = {
  // 時間軸の図の `note` の行は節目にも書けて丸の色を持つので、下の字のブロックでなく節目のブロックの読み方で読む
  take: (source, state, view) => {
    if (view.word !== "note") return false;
    state.inStep(source).events.push(readTimeNote(source, state));
    return true;
  },
  // 時間軸の図の線の端は、箱か節目
  endAt: (source, id, at, _side, state) => {
    if (!state.figure.boxes.some((box) => box.id === id) && !state.figure.time.points.some((point) => point.id === id)) throw fail(source, at, state.m.undeclaredNote(id));
    return id;
  },
  read: { point: readPoint },
  print: {
    // 節目の行は、印の列の塊の後ろに 1 つの塊で書く。節目の無い図は書かない
    lead: (diagram) => {
      const points = diagram.time?.points ?? [];
      return points.length > 0 ? [points.map((p) => `point ${p.id} ${AT} ${p.at}`).join("\n")] : [];
    },
  },
  messages: {
    ja: {
      pointShape: "point は point <名札> at <目盛り> の形で書く",
      undeclaredNote: (id) => `${id} という箱か節目は宣言していない`,
      noteColorPointOnly: "note の color は節目の丸の色で、節目の note にだけ書ける",
    },
    en: {
      pointShape: "Write a point as point <id> at <unit>",
      undeclaredNote: (id) => `No box or point named ${id} is declared`,
      noteColorPointOnly: "The color of a note colors the circle of a point, so write it only on the note of a point",
    },
  },
};
