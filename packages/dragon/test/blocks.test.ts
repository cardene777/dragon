/**
 * ブロックと図の種類の置き場 (#3342、#3345)。
 *
 * 図を組み立てる1つひとつをブロックと呼び、ブロックごとに `src/blocks/<名前>/` の置き場を1つ持つ。
 * 置き場は、語、原本の形、読む処理、書き戻す処理、日英の誤りの文、描き方、付け方、使い方の決まり、見本帳の分を全て持つ。
 * 今は中身の無い欄は、作らずに「持たない」値 (`none(<理由>)`) を置く。
 * 図の種類ごとに `src/kinds/<種類>/` の置き場を1つ持ち、並べ方 (`layout.ts`) と受け付ける付け方 (`kind.ts`) だけを持つ。
 * ブロックと図の種類の一覧は、置き場の dir から `scripts/build-blocks.mjs` が書き出し、手で書いた一覧を持たない。
 *
 * 置き場の決まりを見る関数はこの file が持ち、正しい置き場に当てて通ることと、崩した置き場に当てて名指すことの両方を確かめる。
 */
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import * as WORDS from "../src/words";

const SRC = join(__dirname, "../src");
const BLOCKS_DIR = join(SRC, "blocks");
const KINDS_DIR = join(SRC, "kinds");
const GENERATOR = "../scripts/build-blocks.mjs";

/** この課題 (#3345) で置き場へ移すブロックと図の種類 */
const MOVED_BLOCKS = ["act", "box", "carry", "color", "edge", "edge-label", "group", "icon", "lifeline", "link", "note", "source", "step", "strip"];
const MOVED_KINDS = ["architecture", "sequence"];
/** 付け方の5つ。置く、つなぐ、線に乗る、箱に付く、図に付く */
const ATTACH = ["place", "connect", "ride-on-line", "attach-to-box", "attach-to-figure"];
/** ブロックの定義が持つ欄。中身が無い欄も `none` を置いて持つ */
const BLOCK_FIELDS = ["name", "rank", "attach", "words", "shape", "read", "print", "messages"];
/** ブロックの置き場が持つ file */
const BLOCK_FILES = ["block.ts", "draw.ts", "gallery/text.ts", "gallery/shelf.ts", "gallery/docs.ts", "gallery/rule.ts"];
/** 図の種類の置き場が持つ file。これ以外を置かない */
const KIND_FILES = ["kind.ts", "layout.ts"];

interface Block {
  name: string;
  rank: number;
  attach: { how: string; only?: string };
  words: { heads?: string[] };
  shape: { definitions?: Record<string, unknown> };
  messages: { none: string } | { ja: Record<string, unknown>; en: Record<string, unknown> };
  [field: string]: unknown;
}
interface Kind {
  name: string;
  accepts: string[];
  layout: unknown;
}

const dirs = (path: string): string[] =>
  existsSync(path)
    ? readdirSync(path, { withFileTypes: true })
        .filter((entry) => entry.isDirectory())
        .map((entry) => entry.name)
        .sort()
    : [];

const files = (path: string): string[] => (existsSync(path) ? readdirSync(path, { recursive: true, encoding: "utf8" }).sort() : []);

/** 書き出した一覧 (`src/blocks/index.ts` と `src/kinds/index.ts`) を読む。まだ無い時は空。決まりの関数は欄の在り無しを見るので、ブロックごとの型を広い形で受ける */
async function registries(): Promise<{ blocks: Record<string, Block>; kinds: Record<string, Kind> }> {
  const blocks = await import("../src/blocks/index").then((m) => m.BLOCKS as unknown as Record<string, Block>).catch(() => ({}));
  const kinds = await import("../src/kinds/index").then((m) => m.KIND_FOLDERS as unknown as Record<string, Kind>).catch(() => ({}));
  return { blocks, kinds };
}

/** ブロックの置き場のうち、持つべき file を持たない物を `<名前>/<file>` で返す */
export function missingBlockFiles(root: string): string[] {
  return dirs(root).flatMap((name) => BLOCK_FILES.filter((file) => !existsSync(join(root, name, file))).map((file) => `${name}/${file}`));
}

/** 定義の欄を持たないブロックを `<名前>.<欄>` で返す */
export function missingFields(blocks: Record<string, Block>): string[] {
  return Object.entries(blocks).flatMap(([name, block]) => BLOCK_FIELDS.filter((field) => block[field] === undefined).map((field) => `${name}.${field}`));
}

/** 誤りの文が日英で揃わないブロック。`none` を置いたブロックは数えない */
export function messageProblems(blocks: Record<string, Block>): string[] {
  return Object.entries(blocks).flatMap(([name, block]) => {
    const messages = block.messages;
    if (messages === undefined) return [`${name}: 誤りの文が無い`];
    if ("none" in messages) return messages.none.trim() === "" ? [`${name}: 持たない理由が空`] : [];
    if (!messages.ja || !messages.en) return [`${name}: 日英の片方が無い`];
    const ja = Object.keys(messages.ja).sort().join(",");
    const en = Object.keys(messages.en).sort().join(",");
    return ja === en && ja !== "" ? [] : [`${name}: 日英の鍵が違う`];
  });
}

/** 2つ以上のブロックが持つ誤りの文の鍵 */
export function sharedMessageKeys(blocks: Record<string, Block>): string[] {
  const owners = new Map<string, string[]>();
  for (const [name, block] of Object.entries(blocks)) {
    if (!block.messages || "none" in block.messages) continue;
    for (const key of Object.keys(block.messages.ja ?? {})) owners.set(key, [...(owners.get(key) ?? []), name]);
  }
  return [...owners].filter(([, names]) => names.length > 1).map(([key, names]) => `${key}: ${names.join(", ")}`);
}

/** 2つ以上のブロックが持つ行の頭の語 */
export function sharedHeads(blocks: Record<string, Block>): string[] {
  const owners = new Map<string, string[]>();
  for (const [name, block] of Object.entries(blocks)) for (const head of block.words?.heads ?? []) owners.set(head, [...(owners.get(head) ?? []), name]);
  return [...owners].filter(([, names]) => names.length > 1).map(([head, names]) => `${head}: ${names.join(", ")}`);
}

/** 5つ以外の付け方を名乗るブロックと受け付ける図の種類 */
export function unknownAttach(blocks: Record<string, Block>, kinds: Record<string, Kind>): string[] {
  return [
    ...Object.entries(blocks)
      .filter(([, block]) => !ATTACH.includes(block.attach?.how))
      .map(([name, block]) => `${name}: ${block.attach?.how}`),
    ...Object.entries(kinds).flatMap(([name, kind]) => (kind.accepts ?? []).filter((how) => !ATTACH.includes(how)).map((how) => `${name}: ${how}`)),
  ];
}

/** 図の種類の置き場のうち、決まった file 以外を持つ物か、並べ方が描き方を読む物 */
export function kindFolderProblems(root: string): string[] {
  return dirs(root).flatMap((name) => {
    const own = files(join(root, name));
    const extra = own.filter((file) => !KIND_FILES.includes(file)).map((file) => `${name}/${file}: 決まった file 以外`);
    const missing = KIND_FILES.filter((file) => !own.includes(file)).map((file) => `${name}/${file}: 無い`);
    const layout = existsSync(join(root, name, "layout.ts")) ? readFileSync(join(root, name, "layout.ts"), "utf8") : "";
    const draws = /from "[./]*render\/|from "[./]*blocks\/[^"]+\/draw"|<svg|<path|<rect/u.test(layout) ? [`${name}/layout.ts: 描き方を読むか持つ`] : [];
    return [...extra, ...missing, ...draws];
  });
}

/** 見本帳の分が package の処理を読む行。型だけを読む `import type` と、同じ置き場の中の file だけを許す */
export function galleryRuntimeImports(root: string): string[] {
  return dirs(root).flatMap((name) =>
    files(join(root, name, "gallery"))
      .filter((file) => file.endsWith(".ts"))
      .flatMap((file) =>
        readFileSync(join(root, name, "gallery", file), "utf8")
          .split("\n")
          .filter((line) => /^import\s/u.test(line) && !/^import type\s/u.test(line) && !/from "\.\/[^"]+"/u.test(line))
          .map((line) => `${name}/gallery/${file}: ${line}`),
      ),
  );
}

describe("ブロックの置き場 (#3345)", () => {
  it("block-folder-holds-whole-definition", async () => {
    // 移したブロックの全てが置き場を持ち、置き場は決まった file と定義の全ての欄を持つ
    const { blocks } = await registries();
    expect(dirs(BLOCKS_DIR), "置き場の無いブロック").toEqual(expect.arrayContaining(MOVED_BLOCKS));
    expect(missingBlockFiles(BLOCKS_DIR), "置き場に無い file").toEqual([]);
    expect(Object.keys(blocks).sort(), "定義を読めないブロック").toEqual(dirs(BLOCKS_DIR));
    expect(missingFields(blocks), "定義に無い欄").toEqual([]);
    expect(messageProblems(blocks), "誤りの文の欄").toEqual([]);
  });

  it("block-check-flags-missing-messages", () => {
    // 誤りの文が無いか日英の片方しか無いブロックを、置き場の決まりの関数が名指す
    const base = { name: "x", rank: 0, attach: { how: "place" }, words: {}, shape: {} };
    expect(
      messageProblems({
        a: { ...base, messages: { ja: { k: 1 }, en: {} } },
        b: { ...base, messages: { ja: { k: 1 } } as never },
        c: { ...base, messages: { none: "" } },
        d: { ...base, messages: { ja: { k: 1 }, en: { k: 1 } } },
        e: { ...base, messages: { none: "誤りを出さない" } },
      }),
    ).toEqual(["a: 日英の鍵が違う", "b: 日英の片方が無い", "c: 持たない理由が空"]);
    const root = mkdtempSync(join(tmpdir(), "dragon-blocks-"));
    try {
      mkdirSync(join(root, "y", "gallery"), { recursive: true });
      writeFileSync(join(root, "y", "block.ts"), "");
      expect(missingBlockFiles(root)).toEqual(["y/draw.ts", "y/gallery/text.ts", "y/gallery/shelf.ts", "y/gallery/docs.ts", "y/gallery/rule.ts"]);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("block-name-matches-folder", async () => {
    const { blocks } = await registries();
    expect(Object.keys(blocks).length, "定義を読めるブロックが無い").toBeGreaterThan(0);
    expect(Object.entries(blocks).filter(([folder, block]) => block.name !== folder).map(([folder]) => folder), "置き場の名前と定義の名前が違う").toEqual([]);
  });

  it("block-message-keys-unique", async () => {
    const { blocks } = await registries();
    expect(Object.keys(blocks).length, "定義を読めるブロックが無い").toBeGreaterThan(0);
    expect(sharedMessageKeys(blocks), "2つのブロックが持つ誤りの文の鍵").toEqual([]);
    const one = { name: "a", rank: 0, attach: { how: "place" }, words: {}, shape: {}, messages: { ja: { k: 1 }, en: { k: 1 } } };
    expect(sharedMessageKeys({ a: one, b: { ...one, name: "b" } })).toEqual(["k: a, b"]);
  });

  it("block-heads-owned-once", async () => {
    const { blocks } = await registries();
    expect(Object.keys(blocks).length, "定義を読めるブロックが無い").toBeGreaterThan(0);
    expect(sharedHeads(blocks), "2つのブロックが持つ行の頭の語").toEqual([]);
    const one = { name: "a", rank: 0, attach: { how: "place" }, words: { heads: ["box"] }, shape: {}, messages: { none: "-" } };
    expect(sharedHeads({ a: one, b: { ...one, name: "b" } })).toEqual(["box: a, b"]);
  });

  it("block-attach-type-known", async () => {
    const { blocks, kinds } = await registries();
    expect(Object.keys(blocks).length, "定義を読めるブロックが無い").toBeGreaterThan(0);
    expect(unknownAttach(blocks, kinds), "5つ以外の付け方").toEqual([]);
    const one = { name: "a", rank: 0, attach: { how: "float" }, words: {}, shape: {}, messages: { none: "-" } };
    expect(unknownAttach({ a: one }, { k: { name: "k", accepts: ["place", "hover"], layout: null } })).toEqual(["a: float", "k: hover"]);
  });

  it("block-shape-matches-schema", async () => {
    // 原本の形はまだ1つの schema (`src/schemas/diagram.schema.json`) が持つので、ブロックの形の欠片は schema と同じ
    const { blocks } = await registries();
    const schema = JSON.parse(readFileSync(join(SRC, "schemas/diagram.schema.json"), "utf8")) as { definitions: Record<string, unknown> };
    const pieces = Object.entries(blocks).flatMap(([name, block]) => Object.entries(block.shape?.definitions ?? {}).map(([key, value]) => ({ name, key, value })));
    expect(pieces.length, "形の欠片を持つブロックが無い").toBeGreaterThan(0);
    expect(pieces.filter(({ key, value }) => JSON.stringify(schema.definitions[key]) !== JSON.stringify(value)).map(({ name, key }) => `${name}.${key}`), "schema と違う形の欠片").toEqual([]);
  });

  it("block-gallery-figures-match-kinds", async () => {
    // 部品の図は日英の対で置き、置き場の在る図の種類ではブロックを受け付ける種類の図だけを置く
    const { blocks, kinds } = await registries();
    const figures = dirs(BLOCKS_DIR).flatMap((name) => files(join(BLOCKS_DIR, name, "gallery")).filter((file) => file.endsWith(".dragon")).map((file) => ({ name, file })));
    expect(figures.length, "部品の図を持つブロックが無い").toBeGreaterThan(0);
    const unpaired = figures.filter(({ name, file }) => !file.endsWith(".en.dragon") && !existsSync(join(BLOCKS_DIR, name, "gallery", file.replace(/\.dragon$/u, ".en.dragon"))));
    expect(unpaired.map(({ name, file }) => `${name}/${file}`), "英語の対が無い部品の図").toEqual([]);
    const misplaced = figures.filter(({ name, file }) => {
      const kind = file.split(".")[1] ?? "";
      const block = blocks[name];
      if (!kinds[kind] || !block) return false;
      return !kinds[kind].accepts.includes(block.attach.how) || (block.attach.only !== undefined && block.attach.only !== kind);
    });
    expect(misplaced.map(({ name, file }) => `${name}/${file}`), "付け方の合わない図の種類の部品の図").toEqual([]);
  });

  it("gallery-imports-no-package-runtime", () => {
    expect(dirs(BLOCKS_DIR).length, "ブロックの置き場が無い").toBeGreaterThan(0);
    expect(galleryRuntimeImports(BLOCKS_DIR), "見本帳の分が package の処理を読む行").toEqual([]);
    const root = mkdtempSync(join(tmpdir(), "dragon-gallery-"));
    try {
      mkdirSync(join(root, "z", "gallery"), { recursive: true });
      writeFileSync(join(root, "z", "gallery", "text.ts"), 'import type { BlockGallery } from "../../gallery";\nimport { parseNotation } from "../../../parser";\n');
      expect(galleryRuntimeImports(root)).toEqual(['z/gallery/text.ts: import { parseNotation } from "../../../parser";']);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});

describe("図の種類の置き場 (#3345)", () => {
  it("kind-folder-holds-layout-and-attach-types", async () => {
    // 移した図の種類の置き場は並べ方と受け付ける付け方だけを持ち、定義の名前は置き場の名前と同じ
    const { kinds } = await registries();
    expect(dirs(KINDS_DIR), "置き場の無い図の種類").toEqual(expect.arrayContaining(MOVED_KINDS));
    expect(kindFolderProblems(KINDS_DIR), "図の種類の置き場の決まり").toEqual([]);
    expect(Object.keys(kinds).sort(), "定義を読めない図の種類").toEqual(dirs(KINDS_DIR));
    expect(Object.entries(kinds).filter(([folder, kind]) => kind.name !== folder || typeof kind.layout !== "function" || kind.accepts.length === 0).map(([folder]) => folder), "名前か並べ方か付け方を持たない図の種類").toEqual([]);
  });

  it("kind-check-flags-drawing-file", () => {
    const root = mkdtempSync(join(tmpdir(), "dragon-kinds-"));
    try {
      mkdirSync(join(root, "k"), { recursive: true });
      writeFileSync(join(root, "k", "kind.ts"), "");
      writeFileSync(join(root, "k", "layout.ts"), 'import { card } from "../../render/parts";\n');
      writeFileSync(join(root, "k", "draw.ts"), "");
      expect(kindFolderProblems(root)).toEqual(["k/draw.ts: 決まった file 以外", "k/layout.ts: 描き方を読むか持つ"]);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});

describe("置き場から導く一覧 (#3345)", () => {
  it("block-registry-derived-from-folders", async () => {
    // 一覧は置き場の dir から書き出した物で、書き出し直しても変わらない
    const { generate } = (await import(GENERATOR).catch(() => ({}))) as { generate?: () => Record<string, string> };
    expect(generate, "一覧を書き出す script (scripts/build-blocks.mjs) が無い").toBeTypeOf("function");
    const written = generate?.() ?? {};
    expect(Object.keys(written).length, "書き出す file が無い").toBeGreaterThanOrEqual(3);
    for (const [path, text] of Object.entries(written)) expect(existsSync(path) && readFileSync(path, "utf8") === text, `${path} を書き出し直していない`).toBe(true);
    const { blocks, kinds } = await registries();
    expect(Object.keys(blocks).sort(), "一覧のブロック").toEqual(dirs(BLOCKS_DIR));
    expect(Object.keys(kinds).sort(), "一覧の図の種類").toEqual(dirs(KINDS_DIR));
  });

  it("registry-check-flags-unlisted-folder", async () => {
    // 置き場を足して書き出し直すと、一覧にその名前が入る
    const { generate } = (await import(GENERATOR).catch(() => ({}))) as { generate?: (root?: string) => Record<string, string> };
    expect(generate, "一覧を書き出す script (scripts/build-blocks.mjs) が無い").toBeTypeOf("function");
    const root = mkdtempSync(join(tmpdir(), "dragon-registry-"));
    try {
      for (const dir of ["blocks/aa", "blocks/bb", "kinds/kk"]) mkdirSync(join(root, dir), { recursive: true });
      const text = Object.values(generate?.(root) ?? {}).join("\n");
      for (const name of ["aa", "bb", "kk"]) expect(text, `${name} が一覧に無い`).toContain(`"${name}"`);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("notation-words-order-unchanged", () => {
    // 行の頭の語と属性の一覧の順は誤りの文に出るので、ブロックから組み立て直しても変えない
    const words = WORDS as Record<string, unknown>;
    const now = Object.fromEntries(["KINDS", "HEADS", "ATTRS", "CARRIES", "VIEWS", "SIDES"].map((key) => [key, words[key]]));
    const before = JSON.parse(readFileSync(join(__dirname, "fixtures/notation-words.json"), "utf8")) as unknown;
    expect(now).toEqual(before);
  });
});
