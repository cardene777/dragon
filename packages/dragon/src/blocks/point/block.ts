/**
 * 節目のブロック (#3165、#3348)。
 *
 * 時間軸の図の部品 (`only: time`)。最初の `step` より前の `point <名札> at <目盛り>` の行で、その目盛りの印の下に旗の丸を置く。
 * 段の中の `note <節目>: <状態> [color: <色>]` の行で、節目の状態の字と丸の色を変え、節目どうしを線で結ぶ。
 * `note` の行の頭の語は下の字のブロックが持つので、時間軸の図の `note` の行は parser が見分けて `readTimeNote` を呼ぶ。
 * 時間軸の図の `note` の行は箱にも書け、`color` は節目にだけ書ける。
 */
import { type Attr, fail, ID, isOneOf, readAttrs, readName } from "../../read-kit";
import type { SourceLine } from "../../tokenize";
import type { Block, ParseState } from "../block";
import { type Color, COLORS } from "../color/block";
import { unitAt } from "../scale/block";

/** 時間軸の図の節目の行で、節目を置く目盛りを続ける語 (`point <名札> at <目盛り>`)。必ず書くので部品の語に数えない */
export const AT = "at";

/** 時間軸の図の節目。`at` の目盛りの印の下に旗の丸と名札を置く */
export interface TimePoint {
  id: string;
  at: number;
}

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

export const block: Block<PointMessages> = {
  name: "point",
  rank: 92,
  attach: { how: "place", only: "time" },
  words: { heads: ["point"], attrs: { note: ["color"] } },
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
