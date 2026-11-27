/**
 * 字を幅に収まる行に折る (#4009)。並べ方で幅を測って字を折る図の種類 (列の図、判定の表の絵) だけが読む。
 * 字の幅を測る所 (`measure.ts`) は全ての図が最初に読むので、折る処理を置くと最初に読む量の上限 (90KB) を超える
 */
import { type TextStyle, WRAP } from "../look/values";
import { hasWide, textWidth } from "./measure";

/** 字の後ろで折ってよい字か。読点と句点と閉じ括弧の前では折らない */
const CLOSING = new Set([..."、。，．）」』！？,.)"]);
/** 和文の句読点。最後の行が短い時に、前の行のこの字の後で折り直す (#4009) */
const WIDE_STOPS = new Set([..."。、，．！？"]);
/** 欧文の句読点。後ろに空白が続く時だけ句読点に数え、数の中の点 (`0.05`) で折り直さない */
const LATIN_STOPS = new Set([...".,!?;:"]);

/** 全角に直した字数。和文の字は 1 字、ほかの字 (欧文と空白) は半字に数える (#4009) */
const charCount = (text: string): number => [...text].reduce((n, ch) => n + (hasWide(ch) ? 1 : 0.5), 0);

/** 字を折ってよい所で切った塊。和文は字の間で、欧文は空白の後で切り、空白は前の塊の後ろに付く */
function tokensOf(text: string): string[] {
  const chars = [...text];
  const tokens: string[] = [];
  let cur = "";
  chars.forEach((ch, i) => {
    const prev = chars[i - 1] ?? "";
    if (cur !== "" && !CLOSING.has(ch) && (hasWide(ch) || hasWide(prev) || /\s/u.test(prev))) {
      tokens.push(cur);
      cur = "";
    }
    cur += ch;
  });
  if (cur !== "") tokens.push(cur);
  return tokens;
}

/** 塊を幅 `width` に前から詰めた行の始まりの塊の番号 */
function fill(tokens: string[], style: TextStyle, width: number): number[] {
  const starts = [0];
  let line = "";
  tokens.forEach((token, i) => {
    const next = line + token;
    if (line !== "" && textWidth(next.trimEnd(), style) > width) {
      starts.push(i);
      line = token.trimStart();
    } else {
      line = next;
    }
  });
  return starts;
}

/** 行の始まりの塊の番号から作る行。行の端の空白を落とす */
const rowsOf = (tokens: string[], starts: number[]): string[] =>
  starts.map((start, k) => {
    const row = tokens.slice(start, starts[k + 1]).join("").trimEnd();
    return k === 0 ? row : row.trimStart();
  });

/** 塊が文の区切りで終わるか。欧文の句読点は後ろに空白が続く時だけ数える */
function endsSentence(token: string): boolean {
  const trimmed = token.trimEnd();
  const last = [...trimmed].at(-1) ?? "";
  return WIDE_STOPS.has(last) || (LATIN_STOPS.has(last) && trimmed !== token);
}

/** 塊を `count` 行のまま収める一番狭い幅で前から詰めた行の始まり。行の長さが揃う */
function even(tokens: string[], style: TextStyle, width: number, count: number): number[] {
  let lo = 0;
  let hi = width;
  for (let i = 0; i < 24; i++) {
    const mid = (lo + hi) / 2;
    if (fill(tokens, style, mid).length <= count) hi = mid;
    else lo = mid;
  }
  return fill(tokens, style, hi);
}

/**
 * 最後の行が `WRAP.last` 字に満たない時の行の始まり (#4009)。前の行の最後の句読点の後で折り直し、
 * 前の行に句読点が無いか、句読点の後で折ると最後の行が幅に収まらない時は、行数を変えずに行の長さを均す
 */
function settle(tokens: string[], style: TextStyle, width: number, starts: number[]): number[] {
  const n = starts.length;
  if (n < 2 || charCount(rowsOf(tokens, starts).at(-1) ?? "") >= WRAP.last) return starts;
  const from = starts[n - 2] as number;
  const to = starts[n - 1] as number;
  for (let k = to - 1; k > from; k--) {
    if (!endsSentence(tokens[k - 1] ?? "")) continue;
    const moved = [...starts.slice(0, n - 1), k];
    if (textWidth(rowsOf(tokens, moved).at(-1) ?? "", style) <= width) return moved;
    break;
  }
  return even(tokens, style, width, n);
}

/** 改行を持たない字 1 つを幅 `room` に収まる行に折る */
function wrapLine(text: string, style: TextStyle, room: number): string[] {
  if (textWidth(text, style) <= room) return [text];
  const tokens = tokensOf(text);
  return rowsOf(tokens, settle(tokens, style, room, fill(tokens, style, room)));
}

/**
 * 字を幅 `width` に収まる行に折る。和文は字の間で、欧文は空白の後で折る。
 * 幅は 1 行に `WRAP.least` 字入る幅 (字の大きさの `WRAP.least` 倍) を下限にし、それより狭い幅を渡されても下限の幅で折る (#4009)。
 * 描き方は折る所をこの幅まで広げて置く。最後の行が短い時は句読点の後で折り直すか行の長さを均す (`settle`)。
 * 書き手が改行で分けた字は改行の所で行を替え、分けた行ごとに折る。書き手が作った 1 行だけの短い行は折り直さない (#4016)
 */
export function wrap(text: string, style: TextStyle, width: number): string[] {
  const room = Math.max(width, WRAP.least * style.size);
  return text.split("\n").flatMap((line) => wrapLine(line, style, room));
}
