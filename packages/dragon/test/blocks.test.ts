/**
 * ブロックと図の種類の置き場 (#3342、#3345、#3347)。
 *
 * 図を組み立てる1つひとつをブロックと呼び、ブロックごとに `src/blocks/<名前>/` の置き場を1つ持つ。
 * 置き場は、語、原本の形、読む処理、書き戻す処理、日英の誤りの文、描き方、付け方、使い方の決まり、見本帳の分を全て持つ。
 * 今は中身の無い欄は、作らずに「持たない」値 (`none(<理由>)`) を置く。
 * 図の種類ごとに `src/kinds/<種類>/` の置き場を1つ持ち、並べ方 (`layout.ts`) と受け付ける付け方 (`kind.ts`) だけを持つ。
 * ブロックと図の種類の一覧は、置き場の dir から `scripts/build-blocks.mjs` が書き出し、手で書いた一覧を持たない。
 *
 * 置き場の決まりを見る関数はこの file が持ち、正しい置き場に当てて通ることと、崩した置き場に当てて名指すことの両方を確かめる。
 * 見本帳を開いた時に読まない図の種類 (状態遷移図と枝分かれの図と時間軸の図と木の図と列の図、#3248) は、
 * 置き場の `kind.ts` が並べ方を読まずに `later: true` を名乗る (#3347、#3348)。
 * ブロックを使える図の種類は、図の種類が受け付ける付け方とブロックの付け方から導き、見本帳の部品の表に手で書かない (#3348)。
 */
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import * as WORDS from "../src/words";
import { api } from "./diagram-support";
import { draw } from "./render-support";

const SRC = join(__dirname, "../src");
const BLOCKS_DIR = join(SRC, "blocks");
const KINDS_DIR = join(SRC, "kinds");
const GENERATOR = "../scripts/build-blocks.mjs";
/** 見本帳の部品の表 */
const PARTS_TABLE = join(__dirname, "../../../apps/playground-spa/src/catalog/parts.ts");

/**
 * 置き場へ移したブロックと図の種類。状態遷移図と枝分かれの図とその個別ブロックは #3347 で、
 * 時間軸の図と木の図と列の図とその個別ブロックは #3348 で移す
 */
const MOVED_BLOCKS = [
  ...["act", "box", "carry", "color", "edge", "edge-label", "group", "icon", "lifeline", "link", "note", "source", "step", "strip"],
  ...["branch", "commit", "copy", "merge", "side-path", "start-finish"],
  ...["scale", "row", "point", "zoom", "leaf", "node", "item", "line", "seal", "pick", "stamp", "order", "role", "legend"],
];
/** 全ての図の種類。記法の最初の行の頭の語 */
const ALL_KINDS = [...WORDS.KINDS].sort();
const MOVED_KINDS = ALL_KINDS;
/** 見本帳を開いた時に読まず、描く時に後から読む図の種類 (#3248) */
const LATER_KINDS = ["git", "lineup", "state", "time", "tree", "try"];
/** 付け方の5つ。置く、つなぐ、線に乗る、箱に付く、図に付く */
const ATTACH = ["place", "connect", "ride-on-line", "attach-to-box", "attach-to-figure"];
/** ブロックの定義が持つ欄。中身が無い欄も `none` を置いて持つ */
const BLOCK_FIELDS = ["name", "rank", "attach", "words", "read", "print", "messages"];
/**
 * 定義の欄のうち、読み方 (`read.ts` の `reading`) が持つ欄。軽い入口は個別ブロックの読み方を書いた図が使う時に読むので、
 * 入口に置く定義 (`block.ts` の `block`) と分ける (#3349)
 */
const READING_FIELDS = ["read", "print", "messages"];
/**
 * ブロックの置き場が持つ file。原本の形の欠片 (`shape.ts`) は定義 (`block.ts`) と分けて持つ (#3348)。
 * 読む処理と書き戻す処理と誤りの文 (`read.ts`) も定義と分けて持つ (#3349)。見本帳の部品の頁が見本を探す関数 (`gallery/uses.ts`) も持つ (#3350)。
 * 部品の説明 (`gallery/desc.ts`) は名前 (`gallery/text.ts`) と分けて持つ。説明は部品の頁だけが見せ、見本帳が最初に読む塊に入れないため (#3531)
 */
const BLOCK_FILES = ["block.ts", "read.ts", "shape.ts", "draw.ts", "gallery/text.ts", "gallery/desc.ts", "gallery/shelf.ts", "gallery/docs.ts", "gallery/rule.ts", "gallery/uses.ts"];
/** 図の種類の置き場が持つ file。これ以外を置かない */
const KIND_FILES = ["kind.ts", "layout.ts"];

interface Block {
  name: string;
  rank: number;
  attach: { how: string; only?: string; except?: string[] };
  words: { heads?: string[] };
  messages: { none: string } | { ja: Record<string, unknown>; en: Record<string, unknown> };
  [field: string]: unknown;
}
interface Kind {
  name: string;
  accepts: string[];
  /** 並べ方。後から読む図の種類は持たない */
  layout?: unknown;
  /** 後から読む図の種類か */
  later?: boolean;
}

const dirs = (path: string): string[] =>
  existsSync(path)
    ? readdirSync(path, { withFileTypes: true })
        .filter((entry) => entry.isDirectory())
        .map((entry) => entry.name)
        .sort()
    : [];

const files = (path: string): string[] => (existsSync(path) ? readdirSync(path, { recursive: true, encoding: "utf8" }).sort() : []);

/** ブロックの原本の形の欠片 (`shape.ts` の `shape`) */
type Shape = { none: string } | { field?: unknown; definitions?: Record<string, unknown>; events?: Record<string, unknown> };

/**
 * 書き出した一覧 (`src/blocks/index.ts` と `src/blocks/shapes.ts` と `src/kinds/index.ts`) を読む。まだ無い時は空。
 * 決まりの関数は欄の在り無しを見るので、ブロックごとの型を広い形で受ける
 */
async function registries(): Promise<{ blocks: Record<string, Block>; definitions: Record<string, Block>; shapes: Record<string, Shape>; kinds: Record<string, Kind> }> {
  const definitions = await import("../src/blocks/index").then((m) => m.BLOCKS as unknown as Record<string, Block>).catch(() => ({}));
  const readings: Record<string, object> = await import("../src/blocks/readings").then((m) => m.READINGS).catch(() => ({}));
  // 定義と読み方を合わせたブロック。読み方を持たないブロックは定義の欄だけになり、決まりの関数が欠けた欄を名指す
  const blocks = Object.fromEntries(Object.entries(definitions).map(([name, block]) => [name, { ...block, ...readings[name] }]));
  const shapes = await import("../src/blocks/shapes").then((m) => m.SHAPES as unknown as Record<string, Shape>).catch(() => ({}));
  const kinds = await import("../src/kinds/index").then((m) => m.KIND_FOLDERS as unknown as Record<string, Kind>).catch(() => ({}));
  return { blocks, definitions, shapes, kinds };
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

/**
 * 後から読む図の種類 (`later: true` を名乗る `kind.ts`) のうち、並べ方 (`layout.ts`) を読む物を `<種類>/kind.ts` で返す。
 * 図の種類の一覧は描く所が最初に読むので、`kind.ts` が並べ方を読むと見本帳を開いた時に読む塊へ並べ方が入る
 */
export function laterKindProblems(root: string): string[] {
  return dirs(root).flatMap((name) => {
    const path = join(root, name, "kind.ts");
    const text = existsSync(path) ? readFileSync(path, "utf8") : "";
    const later = /\blater:\s*true\b/u.test(text);
    return later && /from "\.\/layout"/u.test(text) ? [`${name}/kind.ts: 後から読む図の種類が並べ方を読む`] : [];
  });
}

/**
 * ブロックの付け方が図の種類に合うか。図の種類がブロックの付け方を受け付け、ブロックの `only` が無いかその図の種類で、
 * ブロックの `except` にその図の種類が無い
 */
const fits = (block: Block, kind: Kind): boolean =>
  kind.accepts.includes(block.attach.how) && (block.attach.only === undefined || block.attach.only === kind.name) && !(block.attach.except ?? []).includes(kind.name);

/**
 * 見本帳の部品の表 (`catalog/parts.ts` の `PARTS`) の行のうち、図の種類の一覧 (`kinds`) を手で書いた行の名札。
 * 行は `{ id: "<名札>"` から次の `}` までの字で、行の中に `kinds:` が在れば手で書いた行に数える
 */
export function handWrittenKinds(text: string): string[] {
  const at = text.indexOf("export const PARTS");
  if (at < 0) return [];
  return text
    .slice(at)
    .split(/(?=\{\s*id:\s*")/u)
    .slice(1)
    .map((row) => row.slice(0, row.indexOf("}") + 1))
    .filter((row) => /\bkinds\s*:/u.test(row))
    .map((row) => /id:\s*"([^"]+)"/u.exec(row)?.[1] ?? row);
}

/** ブロックの置き場の部品の図のうち、図の種類 `kind` の物。英語の対は除く */
const figuresOf = (block: string, kind: string): string[] =>
  files(join(BLOCKS_DIR, block, "gallery")).filter((file) => file.endsWith(`.${kind}.dragon`));

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

/** 形の欠片の一覧 (`blocks/shapes.ts`) と各置き場の `shape.ts` のほかで、形の欠片を読む行。`root` は package の src に当たる dir */
export function shapeImports(root: string): string[] {
  const all = files(root).filter((file) => file.endsWith(".ts") && file !== "blocks/shapes.ts" && !/^blocks\/[^/]+\/shape\.ts$/u.test(file));
  return all.flatMap((file) =>
    readFileSync(join(root, file), "utf8")
      .split("\n")
      .filter((line) => /^import\s/u.test(line) && !/^import type\s/u.test(line) && /from "[^"]*\/(shape|shapes)"/u.test(line))
      .map((line) => `${file}: ${line}`),
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

  it("block-definition-keeps-reading-out", async () => {
    // 入口に置く定義 (`block.ts`) は読む処理と書き戻す処理と誤りの文を持たず、読み方 (`read.ts`) が持つ (#3349)
    const { definitions } = await registries();
    expect(Object.keys(definitions).length, "定義を読めたブロックの数").toBeGreaterThan(0);
    expect(
      Object.entries(definitions).flatMap(([name, block]) => READING_FIELDS.filter((field) => block[field] !== undefined).map((field) => `${name}.${field}`)),
      "読み方の欄を定義に持つブロック",
    ).toEqual([]);
  });

  it("block-check-flags-missing-messages", () => {
    // 誤りの文が無いか日英の片方しか無いブロックを、置き場の決まりの関数が名指す
    const base = { name: "x", rank: 0, attach: { how: "place" }, words: {} };
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
      expect(missingBlockFiles(root)).toEqual(["y/read.ts", "y/shape.ts", "y/draw.ts", "y/gallery/text.ts", "y/gallery/desc.ts", "y/gallery/shelf.ts", "y/gallery/docs.ts", "y/gallery/rule.ts", "y/gallery/uses.ts"]);
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
    const one = { name: "a", rank: 0, attach: { how: "place" }, words: {}, messages: { ja: { k: 1 }, en: { k: 1 } } };
    expect(sharedMessageKeys({ a: one, b: { ...one, name: "b" } })).toEqual(["k: a, b"]);
  });

  it("block-heads-owned-once", async () => {
    const { blocks } = await registries();
    expect(Object.keys(blocks).length, "定義を読めるブロックが無い").toBeGreaterThan(0);
    expect(sharedHeads(blocks), "2つのブロックが持つ行の頭の語").toEqual([]);
    const one = { name: "a", rank: 0, attach: { how: "place" }, words: { heads: ["box"] }, messages: { none: "-" } };
    expect(sharedHeads({ a: one, b: { ...one, name: "b" } })).toEqual(["box: a, b"]);
  });

  it("block-attach-type-known", async () => {
    const { blocks, kinds } = await registries();
    expect(Object.keys(blocks).length, "定義を読めるブロックが無い").toBeGreaterThan(0);
    expect(unknownAttach(blocks, kinds), "5つ以外の付け方").toEqual([]);
    const one = { name: "a", rank: 0, attach: { how: "float" }, words: {}, messages: { none: "-" } };
    expect(unknownAttach({ a: one }, { k: { name: "k", accepts: ["place", "hover"], layout: null } })).toEqual(["a: float", "k: hover"]);
  });

  it("block-shape-matches-schema", async () => {
    // 書き出した原本の形 (`src/schemas/diagram.schema.json`) は形の欠片を束ねた物なので、ブロックの形の欠片は schema と同じ
    const { blocks, shapes } = await registries();
    expect(Object.keys(shapes).sort(), "形の欠片の一覧とブロックの一覧の名前").toEqual(Object.keys(blocks).sort());
    const schema = JSON.parse(readFileSync(join(SRC, "schemas/diagram.schema.json"), "utf8")) as { definitions: Record<string, unknown> };
    const pieces = Object.entries(shapes).flatMap(([name, shape]) => ("none" in shape ? [] : Object.entries(shape.definitions ?? {}).map(([key, value]) => ({ name, key, value }))));
    expect(pieces.length, "形の欠片を持つブロックが無い").toBeGreaterThan(0);
    expect(pieces.filter(({ key, value }) => JSON.stringify(schema.definitions[key]) !== JSON.stringify(value)).map(({ name, key }) => `${name}.${key}`), "schema と違う形の欠片").toEqual([]);
  });

  it("block-shapes-stay-out-of-runtime", async () => {
    // 原本の形の欠片は build の時の script と検査だけが読み、描く時に読む塊に入れない (#3348)。
    // 定義は形の欠片を持たず、package の src は形の欠片の一覧 (`blocks/shapes.ts`) と各置き場の `shape.ts` を読まない
    const { blocks } = await registries();
    expect(Object.keys(blocks).length, "定義を読めるブロックが無い").toBeGreaterThan(0);
    expect(Object.keys(blocks).filter((name) => blocks[name]?.shape !== undefined), "形の欠片を持つ定義").toEqual([]);
    expect(shapeImports(SRC), "形の欠片を読む package の行").toEqual([]);
    const root = mkdtempSync(join(tmpdir(), "dragon-shapes-"));
    try {
      mkdirSync(join(root, "blocks", "w"), { recursive: true });
      writeFileSync(join(root, "blocks", "shapes.ts"), 'import { shape as wShape } from "./w/shape";\n');
      writeFileSync(join(root, "blocks", "w", "shape.ts"), 'import { none } from "../block";\n');
      writeFileSync(join(root, "blocks", "w", "block.ts"), 'import type { BlockShape } from "../shape";\nimport { shape } from "./shape";\n');
      writeFileSync(join(root, "parser.ts"), 'import { SHAPES } from "./blocks/shapes";\n');
      expect(shapeImports(root)).toEqual(['blocks/w/block.ts: import { shape } from "./shape";', 'parser.ts: import { SHAPES } from "./blocks/shapes";']);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
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
      return !fits(block, kinds[kind]);
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
    const laidOut = (kind: Kind): boolean => (kind.later === true ? kind.layout === undefined : typeof kind.layout === "function");
    expect(Object.entries(kinds).filter(([folder, kind]) => kind.name !== folder || !laidOut(kind) || kind.accepts.length === 0).map(([folder]) => folder), "名前か並べ方か付け方を持たない図の種類").toEqual([]);
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

describe("付け方が合う組 (#3347)", () => {
  it("every-block-draws-on-every-matching-kind", async () => {
    // 置き場の在る図の種類と、その種類が受け付ける付け方を名乗るブロックの組の全てで、部品の図を日英の記法で読んで描ける
    const { blocks, kinds } = await registries();
    expect(Object.keys(kinds), "置き場の無い図の種類").toEqual(expect.arrayContaining(MOVED_KINDS));
    expect(Object.keys(blocks), "置き場の無いブロック").toEqual(expect.arrayContaining(MOVED_BLOCKS));
    const parse = api("parseNotation");
    const render = draw("renderDiagram");
    const pairs = Object.values(kinds).flatMap((kind) =>
      Object.values(blocks)
        .filter((block) => fits(block, kind))
        .map((block) => ({ block: block.name, kind: kind.name })),
    );
    expect(pairs.length, "付け方が合う組が無い").toBeGreaterThan(0);
    const missing = pairs.filter(({ block, kind }) => figuresOf(block, kind).length === 0).map(({ block, kind }) => `${block} × ${kind}`);
    expect(missing, "部品の図が無い組").toEqual([]);
    const refused: string[] = [];
    for (const { block, kind } of pairs) {
      for (const figure of figuresOf(block, kind)) {
        for (const [file, lang] of [
          [figure, "ja"],
          [figure.replace(/\.dragon$/u, ".en.dragon"), "en"],
        ] as const) {
          const text = readFileSync(join(BLOCKS_DIR, block, "gallery", file), "utf8");
          const parsed = parse(text, { lang });
          if (!parsed.ok) {
            refused.push(`${block}/${file}: ${parsed.errors.map((e) => `${e.line}: ${e.message}`).join(" / ")}`);
            continue;
          }
          try {
            const { svg } = render(parsed.diagram, { lang });
            if (!svg.startsWith("<svg")) refused.push(`${block}/${file}: SVG でない`);
          } catch (error) {
            refused.push(`${block}/${file}: ${(error as Error).message}`);
          }
        }
      }
    }
    expect(refused, "読めないか描けない部品の図").toEqual([]);
  });

  it("later-kind-folder-keeps-layout-out-of-first-load", async () => {
    // 後から読む図の種類の置き場は、kind.ts で後から読むと名乗り、並べ方を読まない
    const { kinds } = await registries();
    expect(
      LATER_KINDS.filter((name) => kinds[name]?.later !== true),
      "後から読むと名乗らない図の種類",
    ).toEqual([]);
    expect(laterKindProblems(KINDS_DIR), "並べ方を読む後から読む図の種類").toEqual([]);
    const root = mkdtempSync(join(tmpdir(), "dragon-later-"));
    try {
      mkdirSync(join(root, "k"), { recursive: true });
      writeFileSync(join(root, "k", "kind.ts"), 'import { layoutK } from "./layout";\nexport const kind = { name: "k", accepts: ["place"], later: true, layout: layoutK };\n');
      expect(laterKindProblems(root)).toEqual(["k/kind.ts: 後から読む図の種類が並べ方を読む"]);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});

describe("付け方から導く図の種類 (#3348)", () => {
  it("block-kinds-derived-from-attach-types", async () => {
    // ブロックを使える図の種類は、図の種類が受け付ける付け方とブロックの付け方 (`only` と `except`) から導く。
    // どの図でも使えるブロック (コアブロック) と 1 つの図の種類だけのブロック (個別ブロック) の分け方も、導いた図の種類から決まる。
    // 見本帳の部品の表は図の種類を手で書かず、導いた図の種類を引く
    const { blocks, kinds } = await registries();
    expect(Object.keys(kinds).sort(), "置き場の無い図の種類").toEqual(ALL_KINDS);
    expect(Object.keys(blocks), "置き場の無いブロック").toEqual(expect.arrayContaining(MOVED_BLOCKS));
    const blockKinds = api("blockKinds");
    const names = Object.keys(blocks).sort();
    const derived = Object.fromEntries(
      names.map((name) => [
        name,
        Object.values(kinds)
          .filter((kind) => blocks[name] !== undefined && fits(blocks[name], kind))
          .map((kind) => kind.name)
          .sort(),
      ]),
    );
    expect(Object.fromEntries(names.map((name) => [name, [...blockKinds(name)].sort()])), "付け方から導いた図の種類と違う").toEqual(derived);
    const drawn = Object.fromEntries(
      names.map((name) => [
        name,
        [
          ...new Set(
            files(join(BLOCKS_DIR, name, "gallery"))
              .filter((file) => file.endsWith(".dragon") && !file.endsWith(".en.dragon"))
              .map((file) => file.split(".")[1] ?? ""),
          ),
        ].sort(),
      ]),
    );
    expect(drawn, "部品の図の図の種類が、付け方から導いた図の種類と違う").toEqual(derived);
    expect(
      names.filter((name) => (blockKinds(name).length > 1) !== (blocks[name]?.attach.only === undefined)),
      "どの図でも使えるかが付け方の only と食い違うブロック",
    ).toEqual([]);
    expect(handWrittenKinds(readFileSync(PARTS_TABLE, "utf8")), "図の種類を手で書いた部品の表の行").toEqual([]);
    expect(handWrittenKinds('export const PARTS = [\n  { id: "a", words: ["head:a"] },\n  { id: "b", kinds: ["time"], words: [] },\n];\n')).toEqual(["b"]);
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
