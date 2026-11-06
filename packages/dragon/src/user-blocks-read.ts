/**
 * 使う人が足すブロックの定義の並びを読む処理 (#3399)。決まりは `user-blocks.ts` の冒頭に書いた。
 *
 * 定義を書いた図でしか要らないので、最初に読む束から外して別の file に置く。
 * 全部を持つ入口は図の種類と一緒に登録し (`kinds/all.ts`)、軽い入口は定義の行を持つ図を読む前に後から読む (`light.ts`)
 */
import { COLORS, type Color } from "./blocks/color/block";
import { columnOf, isBlankOrComment, type SourceLine, tokenize } from "./tokenize";
import {
  type ReadBlocks,
  USER_BASES,
  USER_BLOCKS_FORMAT,
  USER_NAME,
  USER_SHAPES,
  type UserBase,
  type UserBlock,
  isUserPath,
  UserBlockFailure,
  type UserBlockReader,
  type UserBlocks,
  type UserBlockUseMessages,
  userBlockUseMessages,
  versionLine,
} from "./user-blocks";
import { DEFAULT_LANG, type NotationLang } from "./words";

/** 元のブロックごとに、path で形を書けるか */
const TAKES_PATH: Readonly<Record<UserBase, boolean>> = { box: true, edge: false, icon: true };
/** 元のブロックごとに、色の役を書けるか。印は載せた箱の色で描く */
const TAKES_COLOR: Readonly<Record<UserBase, boolean>> = { box: true, edge: true, icon: false };

/** 定義を読む時の誤りの文。日英で持つ */
export interface UserBlockMessages extends UserBlockUseMessages {
  versionUnknown: (version: string) => string;
  needsPlus: (name: string) => string;
  duplicate: (name: string) => string;
  unclosed: (name: string) => string;
  badLine: string;
  badKey: (key: string) => string;
  badBase: (value: string) => string;
  noBase: (name: string) => string;
  badShape: (base: UserBase, value: string) => string;
  noPath: (base: UserBase) => string;
  needsPath: string;
  shapeAndPath: string;
  badColor: (value: string) => string;
  noColor: (base: UserBase) => string;
  notObject: (where: string) => string;
}

const listOf = (values: readonly string[]): string => values.join(" / ");

const MESSAGES: Readonly<Record<NotationLang, UserBlockMessages>> = {
  ja: {
    ...userBlockUseMessages("ja"),
    versionUnknown: (version) => `${version} はブロックの定義の形の知らない版。今の版は ${USER_BLOCKS_FORMAT}`,
    needsPlus: (name) => `足すブロックの名前 ${name} は + で始め、英小文字と数字と - で書く (+bridge など)`,
    duplicate: (name) => `${name} のブロックを 2 度定義している`,
    unclosed: (name) => `${name} のブロックの定義を閉じる end が無い`,
    badLine: "ブロックの定義の後に書けるのは、block の行と空行だけ",
    badKey: (key) => `ブロックの定義に ${key} は書けない。書けるのは base / shape / color`,
    badBase: (value) => `${value} は元にできるブロックでない。base は ${listOf(USER_BASES)} のどれか`,
    noBase: (name) => `${name} のブロックの定義に、元にするブロック (base) が無い`,
    badShape: (base, value) => `${value} は ${base} を元にしたブロックの形でない。shape は ${listOf([...USER_SHAPES[base], ...(TAKES_PATH[base] ? ["path"] : [])])} のどれか`,
    noPath: (base) => `${base} を元にしたブロックは path の形を持てない`,
    needsPath: "icon を元にしたブロックは shape path \"…\" で形を書く",
    shapeAndPath: "基本の形と path は一緒に書けない",
    badColor: (value) => `${value} は色の役でない。color は ${listOf(COLORS)} のどれか`,
    noColor: (base) => `${base} を元にしたブロックは色を持てない。載せた箱の色で描く`,
    notObject: (where) => `${where} はブロックの定義の形でない`,
  },
  en: {
    ...userBlockUseMessages("en"),
    versionUnknown: (version) => `${version} is an unknown version of the block definition format. The current version is ${USER_BLOCKS_FORMAT}`,
    needsPlus: (name) => `Name an added block like +bridge: ${name} must start with + and use lowercase letters, digits and -`,
    duplicate: (name) => `The block ${name} is defined twice`,
    unclosed: (name) => `The definition of ${name} has no closing end`,
    badLine: "Only block lines and blank lines can follow block definitions",
    badKey: (key) => `A block definition cannot take ${key}. It takes base / shape / color`,
    badBase: (value) => `${value} cannot be a base. base is one of ${listOf(USER_BASES)}`,
    noBase: (name) => `The definition of ${name} has no base block`,
    badShape: (base, value) => `${value} is not a shape of a block based on ${base}. shape is one of ${listOf([...USER_SHAPES[base], ...(TAKES_PATH[base] ? ["path"] : [])])}`,
    noPath: (base) => `A block based on ${base} cannot take a path shape`,
    needsPath: 'A block based on icon takes its shape as shape path "…"',
    shapeAndPath: "A block takes a named shape or a path, not both",
    badColor: (value) => `${value} is not a color role. color is one of ${listOf(COLORS)}`,
    noColor: (base) => `A block based on ${base} takes no color. It is drawn in the color of its box`,
    notObject: (where) => `${where} is not a block definition`,
  },
};


const failAt = (source: SourceLine, index: number, message: string): UserBlockFailure => new UserBlockFailure(source.line, columnOf(source, index), message);


/** 定義の鍵。誤りを指す所を選ぶ */
type BlockKey = "name" | "base" | "shape" | "path" | "color";

/**
 * 定義 1 つの中身を確かめる。`at` は誤りを指す所を鍵ごとに返す (記法は行と列、JSON は欄の名前)。
 * 記法と JSON で同じ決まりを使うため、確かめ方はここに 1 つだけ置く
 */
function checkBlock(block: UserBlock, m: UserBlockMessages, fail: (key: BlockKey, message: string) => UserBlockFailure): void {
  if (!USER_NAME.test(block.name)) throw fail("name", m.needsPlus(block.name));
  const { base } = block;
  if (block.shape !== undefined && block.path !== undefined) throw fail("path", m.shapeAndPath);
  if (block.shape !== undefined && !USER_SHAPES[base].includes(block.shape)) throw fail("shape", m.badShape(base, block.shape));
  if (block.path !== undefined && !TAKES_PATH[base]) throw fail("path", m.noPath(base));
  if (block.path !== undefined && !isUserPath(block.path)) throw fail("path", m.badPath);
  if (base === "icon" && block.path === undefined) throw fail("name", m.needsPath);
  if (block.color !== undefined && !TAKES_COLOR[base]) throw fail("color", m.noColor(base));
  if (block.color !== undefined && !(COLORS as readonly string[]).includes(block.color)) throw fail("color", m.badColor(block.color));
}

/** 引用符で囲んだ字。囲みの中の `\"` は `"` に戻す */
function quoted(text: string): string | undefined {
  const m = /^"((?:[^"\\]|\\.)*)"$/u.exec(text.trim());
  return m?.[1]?.replace(/\\(.)/gu, "$1");
}

/**
 * 記法の行 `lines` の `start` 番目 (`blocks <版>` の行) から定義の並びを読む。
 * `block` の行と空行が続く間を読み、読み終えた次の行の番号を返す。`known` は前に読んだ定義で、同じ名前を 2 度定義すると断る
 */
export function readBlockLines(lines: readonly SourceLine[], start: number, lang: NotationLang, known: ReadonlySet<string> = new Set()): { blocks: UserBlock[]; next: number } {
  const m = MESSAGES[lang];
  const head = lines[start] as SourceLine;
  const version = versionLine(head) ?? "";
  if (version === "") throw failAt(head, 0, m.versionMissing);
  if (version !== String(USER_BLOCKS_FORMAT)) throw failAt(head, head.text.indexOf(version, "blocks".length), m.versionUnknown(version));
  const blocks: UserBlock[] = [];
  const names = new Set(known);
  let i = start + 1;
  for (;;) {
    while (i < lines.length && isBlankOrComment(lines[i] as SourceLine)) i++;
    const source = lines[i];
    if (!source || !/^block(?:\s|$)/u.test(source.text)) break;
    const name = source.text.slice("block".length).trim();
    const nameAt = source.text.indexOf(name, "block".length);
    if (!USER_NAME.test(name)) throw failAt(source, nameAt, m.needsPlus(name));
    if (names.has(name)) throw failAt(source, nameAt, m.duplicate(name));
    names.add(name);
    const fields: Partial<Record<"base" | "shape" | "path" | "color", { value: string; source: SourceLine; at: number }>> = {};
    let closed = false;
    for (i++; i < lines.length; i++) {
      const row = lines[i] as SourceLine;
      if (isBlankOrComment(row)) continue;
      if (row.text === "end") {
        closed = true;
        i++;
        break;
      }
      const key = row.text.split(/\s/u)[0] ?? "";
      const rest = row.text.slice(key.length).trim();
      const restAt = rest === "" ? row.text.length : row.text.indexOf(rest, key.length);
      if (key === "base" || key === "color") fields[key] = { value: rest, source: row, at: restAt };
      else if (key === "shape") {
        const path = /^path\s+(.*)$/su.exec(rest);
        if (path) {
          const d = quoted(path[1] ?? "");
          const pathAt = row.text.indexOf(path[1] ?? "", restAt);
          if (d === undefined) throw failAt(row, pathAt, m.badPath);
          fields.path = { value: d, source: row, at: pathAt };
        } else fields.shape = { value: rest, source: row, at: restAt };
      } else throw failAt(row, 0, m.badKey(key));
    }
    if (!closed) throw failAt(source, 0, m.unclosed(name));
    const base = fields.base;
    if (!base) throw failAt(source, 0, m.noBase(name));
    if (!(USER_BASES as readonly string[]).includes(base.value)) throw failAt(base.source, base.at, m.badBase(base.value));
    const block: UserBlock = {
      name,
      base: base.value as UserBase,
      ...(fields.shape ? { shape: fields.shape.value } : {}),
      ...(fields.path ? { path: fields.path.value } : {}),
      ...(fields.color ? { color: fields.color.value as Color } : {}),
    };
    checkBlock(block, m, (key, message) => {
      const field = key === "name" ? undefined : fields[key];
      return field ? failAt(field.source, field.at, message) : failAt(source, nameAt, message);
    });
    blocks.push(block);
  }
  return { blocks, next: i };
}

/** JSON の定義の並びを確かめて、記法から読んだ物と同じ形にする */
function readBlocksJson(input: unknown, m: UserBlockMessages): UserBlocks {
  const whole = (message: string): UserBlockFailure => new UserBlockFailure(1, 1, message);
  if (typeof input !== "object" || input === null || Array.isArray(input)) throw whole(m.notObject("/"));
  const { format, blocks, ...rest } = input as Record<string, unknown>;
  const extra = Object.keys(rest)[0];
  if (extra !== undefined) throw whole(`/${extra}: ${m.badKey(extra)}`);
  if (format === undefined) throw whole(`/format: ${m.versionMissing}`);
  if (format !== USER_BLOCKS_FORMAT) throw whole(`/format: ${m.versionUnknown(JSON.stringify(format))}`);
  if (!Array.isArray(blocks)) throw whole(m.notObject("/blocks"));
  const names = new Set<string>();
  return {
    format: USER_BLOCKS_FORMAT,
    blocks: blocks.map((item, k): UserBlock => {
      const where = `/blocks/${k}`;
      if (typeof item !== "object" || item === null || Array.isArray(item)) throw whole(m.notObject(where));
      const { name, base, shape, path, color, ...others } = item as Record<string, unknown>;
      const other = Object.keys(others)[0];
      if (other !== undefined) throw whole(`${where}/${other}: ${m.badKey(other)}`);
      if (typeof name !== "string") throw whole(`${where}/name: ${m.needsPlus(String(name))}`);
      if (typeof base !== "string" || !(USER_BASES as readonly string[]).includes(base)) throw whole(`${where}/base: ${m.badBase(String(base))}`);
      for (const [key, value] of Object.entries({ shape, path, color })) if (value !== undefined && typeof value !== "string") throw whole(`${where}/${key}: ${m.notObject(where)}`);
      const block: UserBlock = {
        name,
        base: base as UserBase,
        ...(shape !== undefined ? { shape: shape as string } : {}),
        ...(path !== undefined ? { path: path as string } : {}),
        ...(color !== undefined ? { color: color as Color } : {}),
      };
      checkBlock(block, m, (key, message) => whole(`${where}/${key}: ${message}`));
      if (names.has(name)) throw whole(`${where}/name: ${m.duplicate(name)}`);
      names.add(name);
      return block;
    }),
  };
}

/**
 * 足すブロックの定義を読む。記法の字 (`blocks 1` の行から始まる) か、JSON の値 (`"format": 1` と `blocks` の並び) を受ける。
 * 読めた定義は `parseNotation` と `renderDiagram` の引数 `blocks` にそのまま渡せる
 */
export function readBlocks(input: unknown, options: { lang?: NotationLang } = {}): ReadBlocks {
  const lang = options.lang ?? DEFAULT_LANG;
  const m = MESSAGES[lang];
  try {
    if (typeof input !== "string") return { ok: true, blocks: readBlocksJson(input, m) };
    const lines = tokenize(input);
    const first = lines.findIndex((source) => !isBlankOrComment(source));
    if (first < 0) throw new UserBlockFailure(1, 1, m.versionMissing);
    const head = lines[first] as SourceLine;
    if (versionLine(head) === undefined) throw failAt(head, 0, m.versionMissing);
    const { blocks, next } = readBlockLines(lines, first, lang);
    const after = lines.slice(next).find((source) => !isBlankOrComment(source));
    if (after) throw failAt(after, 0, m.badLine);
    return { ok: true, blocks: { format: USER_BLOCKS_FORMAT, blocks } };
  } catch (error) {
    if (!(error instanceof UserBlockFailure)) throw error;
    return { ok: false, errors: [{ line: error.line, column: error.column, message: error.message }] };
  }
}

/** 図を読む処理に登録する、定義の並びを読む処理 */
export const USER_BLOCK_READER: UserBlockReader = { readBlockLines };
