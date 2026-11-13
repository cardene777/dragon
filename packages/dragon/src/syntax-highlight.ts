/**
 * 書く欄の字を語の役ごとに分ける (#3613)。
 *
 * 編集画面は書く欄の下に色の層を敷き、ここで分けた役ごとに字の色を替えて描く。
 * 分けた字を行ごとに繋ぐと、渡した字と一字も違わない。色の層の字と打った字の行と位置をずらさないため。
 *
 * 記法は 1 行ずつ、行の頭の語と行の終わりの属性の角括弧と線の矢印で分ける。
 * 図の種類の名前と行の頭の語は、記法の読み取りが持つ語の一覧 (`NOTATION_WORDS`) を呼ぶ側から受け取る。
 * ここで語を並べると、ブロックを足した時に色が付かない語が出るため。
 * 行の頭の語のうち、命令を書く行の語だけは、続く字を命令の役で塗るために名指す。
 * 本文を書く行の下に字下げした行は本文の続きなので、行の頭の語を探さない。
 *
 * JSON は鍵、字の列、数、真偽と null、括弧と区切りに分ける。
 */

/** 記法の役。図の種類の名前、行の頭の語、名札と名前を繋ぐ語、線の矢印、属性の鍵と値、注釈、命令、括弧と区切り */
export type NotationRole = "kind" | "head" | "as" | "arrow" | "key" | "value" | "comment" | "code" | "punct";
/** JSON の役。鍵、字の列、数、真偽と null、括弧と区切り */
export type JsonRole = "json-key" | "json-string" | "json-number" | "json-literal" | "json-punct";

/** 同じ役の字の続き。役の無い字は今の字の色で描く */
export interface Span<R extends string = string> {
  text: string;
  role?: R;
}

/** 記法の読み取りが持つ語の一覧 */
export interface NotationWords {
  readonly kinds: readonly string[];
  readonly heads: readonly string[];
}

/** 命令を書く行の頭の語。続く字は角括弧も含めて全て命令なので、属性に分けない */
const COMMAND_HEAD = "code";
/** 本文を書く行の頭の語。下に字下げした行は本文の続き */
const PROSE_HEAD = "say";
/** 名札の後ろで名前を続ける語 */
const NAME_JOIN = "as";
const ARROW = "->";
const COMMENT = "//";

/** 役の無い字。どの役の並びにも入れられるよう、役を持たない型にする */
const plain = (text: string): Span<never>[] => (text ? [{ text }] : []);
const role = <R extends string>(text: string, r: R): Span<R>[] => (text ? [{ text, role: r }] : []);

/** 字の中で、囲み (`"`) の外に在る最初の `[` の位置。行の終わりの属性の角括弧の始まり。無ければ -1 */
function attrStart(body: string): number {
  if (!body.trimEnd().endsWith("]")) return -1;
  let quoted = false;
  for (let i = 0; i < body.length; i += 1) {
    const c = body[i];
    if (quoted && c === "\\") i += 1;
    else if (c === '"') quoted = !quoted;
    else if (!quoted && c === "[") return i;
  }
  return -1;
}

/** 属性の角括弧 (`[鍵: 値, 鍵: 値]` と後ろの空白) を鍵と値と区切りに分ける */
function paintAttrs(attrs: string): Span<NotationRole>[] {
  const close = attrs.lastIndexOf("]");
  const inner = attrs.slice(1, close);
  const out: Span<NotationRole>[] = [{ text: "[", role: "punct" }];
  let quoted = false;
  let from = 0;
  const item = (text: string): void => {
    const colon = text.indexOf(":");
    if (colon < 0) {
      out.push(...role(text, "value"));
      return;
    }
    const key = /^(\s*)([\s\S]*?)(\s*)$/u.exec(text.slice(0, colon)) ?? [];
    const value = /^(\s*)([\s\S]*?)(\s*)$/u.exec(text.slice(colon + 1)) ?? [];
    out.push(...plain(key[1] ?? ""), ...role(key[2] ?? "", "key"), ...plain(key[3] ?? ""), { text: ":", role: "punct" });
    out.push(...plain(value[1] ?? ""), ...role(value[2] ?? "", "value"), ...plain(value[3] ?? ""));
  };
  for (let i = 0; i < inner.length; i += 1) {
    const c = inner[i];
    if (quoted && c === "\\") i += 1;
    else if (c === '"') quoted = !quoted;
    else if (!quoted && c === ",") {
      item(inner.slice(from, i));
      out.push({ text: ",", role: "punct" });
      from = i + 1;
    }
  }
  item(inner.slice(from));
  out.push({ text: "]", role: "punct" }, ...plain(attrs.slice(close + 1)));
  return out;
}

/** 行の中の最初の矢印を矢印の役にする */
function paintArrow(text: string): Span<NotationRole>[] {
  const at = text.indexOf(ARROW);
  if (at < 0) return plain(text);
  return [...plain(text.slice(0, at)), { text: ARROW, role: "arrow" }, ...plain(text.slice(at + ARROW.length))];
}

/** 行の頭の語の後ろ。名札の後ろの名前を続ける語を役にする */
function paintAfterHead(rest: string): Span<NotationRole>[] {
  const join = new RegExp(`^(\\s+\\S+\\s+)(${NAME_JOIN})(?=\\s|$)`, "u").exec(rest);
  if (!join) return plain(rest);
  const lead = join[1] ?? "";
  return [...plain(lead), { text: NAME_JOIN, role: "as" }, ...plain(rest.slice(lead.length + NAME_JOIN.length))];
}

/** 記法を行ごとに役で分ける */
export function paintNotation(text: string, words: NotationWords): Span<NotationRole>[][] {
  const kinds = new Set(words.kinds);
  const heads = new Set(words.heads);
  let first = true;
  let proseIndent = -1;
  return text.split("\n").map((line): Span<NotationRole>[] => {
    const indent = /^\s*/u.exec(line)?.[0] ?? "";
    const body = line.slice(indent.length);
    if (!body) return plain(line);
    if (body.startsWith(COMMENT)) return [...plain(indent), { text: body, role: "comment" }];
    if (proseIndent >= 0 && indent.length > proseIndent) return plain(line);
    proseIndent = -1;
    const word = /^\S+/u.exec(body)?.[0] ?? "";
    const after = body.slice(word.length);
    if (first) {
      first = false;
      if (kinds.has(word)) return [...plain(indent), { text: word, role: "kind" }, ...paintTail(after)];
    }
    // 行の頭の語と同じ綴りの名札の次に矢印が来る行は、線の行と読む
    if (heads.has(word) && !after.trimStart().startsWith(ARROW)) {
      if (word === COMMAND_HEAD) return [...plain(indent), { text: word, role: "head" }, ...role(after, "code")];
      if (word === PROSE_HEAD) proseIndent = indent.length;
      const at = attrStart(after);
      const main = at < 0 ? after : after.slice(0, at);
      return [...plain(indent), { text: word, role: "head" }, ...paintAfterHead(main), ...(at < 0 ? [] : paintAttrs(after.slice(at)))];
    }
    return [...plain(indent), ...paintTail(body)];
  });
}

/** 行の頭の語を持たない字。線の矢印と、行の終わりの属性の角括弧を分ける */
function paintTail(text: string): Span<NotationRole>[] {
  const at = attrStart(text);
  if (at < 0) return paintArrow(text);
  return [...paintArrow(text.slice(0, at)), ...paintAttrs(text.slice(at))];
}

/** JSON の字の 1 つ。字の列の後ろに `:` が続けば鍵 */
const JSON_TOKEN = /("(?:[^"\\]|\\.)*")(?=(\s*:)?)|(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)|\b(true|false|null)\b|([{}[\],:])/gu;

/** JSON を行ごとに役で分ける */
export function paintJson(text: string): Span<JsonRole>[][] {
  return text.split("\n").map((line) => {
    const out: Span<JsonRole>[] = [];
    let from = 0;
    for (const m of line.matchAll(JSON_TOKEN)) {
      const at = m.index;
      out.push(...plain(line.slice(from, at)));
      const [token, str, colon, num, lit] = m;
      const r: JsonRole = str !== undefined ? (colon !== undefined ? "json-key" : "json-string") : num !== undefined ? "json-number" : lit !== undefined ? "json-literal" : "json-punct";
      out.push({ text: token, role: r });
      from = at + token.length;
    }
    out.push(...plain(line.slice(from)));
    return out;
  });
}
