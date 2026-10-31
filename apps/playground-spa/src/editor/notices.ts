/**
 * 知らせの欄に出す誤りの一覧 (#3031)。
 *
 * 記法の読み取りの誤りは記法の行を、JSON の誤りは JSON の字の行を持つ。
 * schema の誤りの場所 (JSON Pointer) は、JSON の字を走査して、その欄の鍵か値が始まる行へ写す。
 * 記法から読んだ図の schema の誤りと描けない誤りは、記法の行と結べないので行を持たない。
 */
import type { FieldError, LineError } from "@cardenelabs/dragon/light";

export interface Notice {
  /** 誤りの行 (1 から)。行と結べない誤りは持たない */
  line?: number;
  text: string;
}

/** 行の順に並べる。行を持たない誤りは後ろに置く */
const byLine = (notices: Notice[]): Notice[] =>
  notices.map((n, i) => ({ n, i })).sort((a, b) => (a.n.line ?? Infinity) - (b.n.line ?? Infinity) || a.i - b.i).map(({ n }) => n);

export const lineNotices = (errors: LineError[]): Notice[] => byLine(errors.map((e) => ({ line: e.line, text: e.message })));

/** schema の誤り。`json` を渡した時は、誤りの場所を JSON の字の行へ写す */
export function fieldNotices(errors: FieldError[], json?: string): Notice[] {
  const lines = json === undefined ? undefined : pointerLines(json);
  return byLine(
    errors.map((e) => {
      const line = lines ? lineOf(lines, e.pointer) : undefined;
      return { ...(line !== undefined ? { line } : {}), text: `${e.pointer || "/"} — ${e.message}` };
    }),
  );
}

/** `JSON.parse` の誤りの文から行を読む。V8 は `(line 3 column 6)` を、ほかの実装は `position 16` を書く */
export function jsonErrorLine(message: string, json: string): number | undefined {
  const line = /\bline (\d+)/u.exec(message);
  if (line) return Number(line[1]);
  const at = /\bposition (\d+)/u.exec(message);
  if (at) return json.slice(0, Number(at[1])).split("\n").length;
  return undefined;
}

/** JSON Pointer の 1 つの段の書き方 (`~` と `/` を逃がす) */
const segment = (key: string): string => key.replaceAll("~", "~0").replaceAll("/", "~1");

/** 場所が無ければ、親の場所の行を返す */
function lineOf(lines: Map<string, number>, pointer: string): number | undefined {
  for (let at = pointer; ; at = at.slice(0, at.lastIndexOf("/"))) {
    const found = lines.get(at);
    if (found !== undefined) return found;
    if (at === "") return undefined;
  }
}

/**
 * JSON の字を走査し、各値の JSON Pointer と、その値が始まる行を返す。オブジェクトの欄は鍵の行を返す。
 * `JSON.parse` が通った字だけを渡す。字の中に改行は無いので、行は字の外の改行だけで数える。
 */
export function pointerLines(json: string): Map<string, number> {
  const lines = new Map<string, number>();
  let i = 0;
  let line = 1;
  const skip = (): void => {
    while (i < json.length && /\s/u.test(json[i] ?? "")) {
      if (json[i] === "\n") line++;
      i++;
    }
  };
  const string = (): string => {
    const start = i;
    i++;
    while (i < json.length && json[i] !== '"') i += json[i] === "\\" ? 2 : 1;
    i++;
    return JSON.parse(json.slice(start, i)) as string;
  };
  const value = (path: string, at: number): void => {
    lines.set(path, at);
    const open = json[i];
    if (open === "{" || open === "[") {
      i++;
      for (let k = 0; i < json.length; k++) {
        skip();
        if (json[i] === "}" || json[i] === "]") {
          i++;
          return;
        }
        if (json[i] === ",") {
          i++;
          skip();
        }
        if (open === "{") {
          const keyLine = line;
          const key = string();
          skip();
          i++;
          skip();
          value(`${path}/${segment(key)}`, keyLine);
        } else {
          value(`${path}/${k}`, line);
        }
      }
      return;
    }
    if (open === '"') {
      string();
      return;
    }
    while (i < json.length && !/[\s,\]}]/u.test(json[i] ?? "")) i++;
  };
  skip();
  value("", line);
  return lines;
}
