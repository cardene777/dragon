/**
 * 登場人物 1 人の位置を DSL 本文に書き込む。
 *
 * editor の画面で見えている座標を、 そのまま記法に落とすために使う。 書く人は図を見ながら
 * 数値を決められないので、 今の位置を出発点として渡す経路が要る。
 *
 * 記法を知っているのは本 package なので、 本文の書き換えもここに置く。 画面側に置くと
 * 記法が増えた時に画面側だけが取り残される。
 *
 * 書き方は 4 通りあり、 元の形を保ったまま位置だけを差し替える。 形を勝手に揃えると、
 * 書いた人の見た目が変わって差分が読めなくなる。
 */

/** 位置の書き込み結果。 対象が見つからなければ null。 */
export function writeActorPosition(
  src: string,
  actorName: string,
  posX: number,
  posY: number,
): string | null {
  if (!Number.isFinite(posX) || !Number.isFinite(posY)) return null;
  const x = Math.round(posX);
  const y = Math.round(posY);

  // 改行コードは行ごとに元のまま残す。 buffer 全体で一括判定すると、 混在した本文で
  // 無関係な行の改行まで書き換わって差分が変更箇所の外に広がる
  const seg = src.split(/(\r\n|\n)/);
  const lineAt = (i: number): string => seg[i * 2] ?? "";
  const lineCount = Math.ceil(seg.length / 2);

  for (let i = 0; i < lineCount; i += 1) {
    const head = matchActorHead(lineAt(i));
    if (!head || head.name !== actorName) continue;

    // 1. `- API: { kind: service }` = 中括弧の中に座標を入れる
    if (head.rest.startsWith("{") && head.rest.endsWith("}")) {
      seg[i * 2] = `${head.prefix}{ ${upsertInlineFields(head.rest.slice(1, -1), x, y)} }`;
      return seg.join("");
    }

    // 2. `- API:` だけの行 = 続く字下げ行に `位置:` を入れる
    if (head.hasColon && head.rest === "") {
      return writeVerticalForm(seg, i, lineCount, head.indent, x, y);
    }

    // 3. `- API: service` = 値の並びに `@x,y` を入れる
    if (head.hasColon) {
      seg[i * 2] = `${head.prefix}${upsertAtToken(head.rest, x, y)}`;
      return seg.join("");
    }

    // 4. `- API` = 名前だけ。 値を書ける形にしてから座標を足す
    seg[i * 2] = `${head.indentText}- ${head.rawName}: @${x},${y}`;
    return seg.join("");
  }
  return null;
}

type ActorHead = {
  /** 行頭から `:` までをそのまま保つ。 元の空白の入れ方を壊さないために持つ */
  prefix: string;
  indentText: string;
  indent: number;
  rawName: string;
  name: string;
  hasColon: boolean;
  rest: string;
};

/**
 * `  - API: service` の形を、 前置き / 名前 / 残りに分ける。
 *
 * `:` を任意にした 1 本の正規表現では書けない。 名前の部分を控えめに取ると `A` で切って
 * 残りを `PI: service` と読んでしまう (実測)。 `:` のある形を先に当てる。
 */
function matchActorHead(line: string): ActorHead | null {
  const NAME = String.raw`"(?:[^"\\]|\\.)*"|[^:\s][^:]*?`;
  const withColon = line.match(new RegExp(String.raw`^(\s*)-[ \t]+(${NAME})[ \t]*:[ \t]*(.*)$`));
  if (withColon) {
    const [, indentText = "", rawName = "", rest = ""] = withColon;
    return {
      // 元の空白の入れ方を壊さないよう、 行頭から値の直前までをそのまま持つ
      prefix: line.slice(0, line.length - rest.length),
      indentText,
      indent: indentText.length,
      rawName,
      name: unquote(rawName),
      hasColon: true,
      rest: rest.trimEnd(),
    };
  }
  const nameOnly = line.match(new RegExp(String.raw`^(\s*)-[ \t]+("(?:[^"\\]|\\.)*"|\S+)[ \t]*$`));
  if (!nameOnly) return null;
  const [, indentText = "", rawName = ""] = nameOnly;
  return {
    prefix: line,
    indentText,
    indent: indentText.length,
    rawName,
    name: unquote(rawName),
    hasColon: false,
    rest: "",
  };
}

function unquote(raw: string): string {
  if (!raw.startsWith('"') || !raw.endsWith('"') || raw.length < 2) return raw;
  return raw.slice(1, -1).replace(/\\(.)/g, "$1");
}

/**
 * 空白区切りの値の並びに `@x,y` を差し込む。 既に書かれていれば差し替える。
 *
 * 引用符の中は触らない。 補足 (`"@1,2 の話"`) を座標と取り違えないため。
 */
function upsertAtToken(rest: string, x: number, y: number): string {
  const kept = splitOutsideQuotes(rest).filter((t) => !/^@-?\d+(\.\d+)?\s*[,、]\s*-?\d+(\.\d+)?$/.test(t));
  kept.push(`@${x},${y}`);
  return kept.join(" ");
}

/** 引用符と角括弧の外の空白で区切る。 */
function splitOutsideQuotes(s: string): string[] {
  const out: string[] = [];
  let buf = "";
  let quote: '"' | "'" | null = null;
  let depth = 0;
  for (let i = 0; i < s.length; i += 1) {
    const c = s[i]!;
    if (quote) {
      buf += c;
      if (quote === '"' && c === "\\") {
        buf += s[i + 1] ?? "";
        i += 1;
        continue;
      }
      if (c === quote) quote = null;
      continue;
    }
    if (c === '"' || c === "'") {
      quote = c;
      buf += c;
      continue;
    }
    if (c === "[") depth += 1;
    if (c === "]") depth -= 1;
    if (/\s/.test(c) && depth === 0) {
      if (buf) out.push(buf);
      buf = "";
      continue;
    }
    buf += c;
  }
  if (buf) out.push(buf);
  return out;
}

/** 中括弧の中の `posX` / `posY` を差し替える。 他の項目は順番ごと残す。 */
function upsertInlineFields(inner: string, x: number, y: number): string {
  const kept = splitTopLevel(inner).filter((f) => {
    const key = f.slice(0, f.indexOf(":")).trim();
    return key !== "posX" && key !== "posY";
  });
  kept.push(`posX: ${x}`, `posY: ${y}`);
  return kept.join(", ");
}

/** 中括弧と角括弧の深さ 0 の `,` で区切る。 入れ子の中の項目を top-level と取り違えない。 */
function splitTopLevel(inner: string): string[] {
  const out: string[] = [];
  let depth = 0;
  let start = 0;
  let quote: '"' | "'" | null = null;
  for (let i = 0; i < inner.length; i += 1) {
    const c = inner[i]!;
    if (quote) {
      if (quote === '"' && c === "\\") {
        i += 1;
        continue;
      }
      if (c === quote) quote = null;
      continue;
    }
    if (c === '"' || c === "'") quote = c;
    else if (c === "{" || c === "[") depth += 1;
    else if (c === "}" || c === "]") depth -= 1;
    else if (c === "," && depth === 0) {
      out.push(inner.slice(start, i));
      start = i + 1;
    }
  }
  out.push(inner.slice(start));
  return out.map((f) => f.trim()).filter((f) => f.length > 0);
}

/**
 * 縦に並べた形に `位置:` を入れる。
 *
 * 既にあれば値だけ差し替える。 無ければ最後の項目の次に足す。 字下げは既にある項目に
 * 合わせ、 項目が 1 つも無ければ頭の字下げに 4 を足す。
 */
function writeVerticalForm(
  seg: string[],
  headIdx: number,
  lineCount: number,
  headIndent: number,
  x: number,
  y: number,
): string {
  let lastChild = -1;
  let childIndent = -1;
  for (let j = headIdx + 1; j < lineCount; j += 1) {
    const line = seg[j * 2] ?? "";
    if (line.trim() === "") continue;
    const indent = line.length - line.trimStart().length;
    if (indent <= headIndent) break;
    if (childIndent < 0) childIndent = indent;
    lastChild = j;
    // 位置 / pos の行が既にあれば、 その行の値だけ差し替える
    const key = line.trim().match(/^(位置|pos)\s*:/);
    if (key) {
      seg[j * 2] = `${" ".repeat(indent)}${key[1]}: ${x},${y}`;
      return seg.join("");
    }
  }
  const indent = childIndent >= 0 ? childIndent : headIndent + 4;
  const newLine = `${" ".repeat(indent)}位置: ${x},${y}`;
  const insertAt = (lastChild >= 0 ? lastChild : headIdx) + 1;
  // 挿入位置の直前で実際に使われている改行に合わせる。 末尾に足す時は最後の区切りを見る
  const sep = seg[insertAt * 2 - 1] ?? seg[seg.length - 2] ?? "\n";
  if (insertAt * 2 >= seg.length) seg.push(sep, newLine);
  else seg.splice(insertAt * 2, 0, newLine, sep);
  return seg.join("");
}
