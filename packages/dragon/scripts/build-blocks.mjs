#!/usr/bin/env node
/**
 * ブロックと図の種類の置き場の dir から、一覧の file を書き出す (#3345、#3348、#3350)。
 *
 * ブロックは `src/blocks/<名前>/`、図の種類は `src/kinds/<種類>/` に置き場を1つずつ持つ。
 * 一覧を手で書くと、置き場を足した時に書き足し忘れるので、置き場の dir の名前から次の一覧を書き出す。
 *
 * - `src/blocks/index.ts` ... 各置き場の `block.ts` が出す定義を、dir の名前を鍵にした `BLOCKS` と、名前の並び `BLOCK_NAMES`
 * - `src/blocks/shapes.ts` ... 各置き場の `shape.ts` が出す原本の形の欠片を、dir の名前を鍵にした `SHAPES`
 * - `src/blocks/readings.ts` ... 各置き場の `read.ts` が出す読み方を、dir の名前を鍵にした `READINGS` (全部入りの入口と検査が読む、#3349)
 * - `src/blocks/entry-readings.ts` ... 入口が初めから持つ読み方 (`ENTRY_READINGS`)。コアブロックと、後から読まない図の種類の個別ブロック
 * - `src/blocks/later-readings.ts` ... 後から読む図の種類の個別ブロックの読み方を読む関数 (`LATER_READINGS`)。軽い入口が書いた図が使う時に呼ぶ
 * - `src/kinds/index.ts` ... 各置き場の `kind.ts` が出す定義を、dir の名前を鍵にした `KIND_FOLDERS`
 * - `apps/playground-spa/src/catalog/blocks.gen.ts` ... 各置き場の `gallery/` の見本帳の分を、種類ごとに dir の名前を鍵にした表と、
 *   ブロックの名前をブロックの並び (`block.ts` の `rank`) の順に並べた `BLOCK_ORDER`
 * - `apps/playground-spa/src/catalog/blocks-docs.gen.ts` ... 見本帳の分のうち、使い方の頁だけが読む段落 (`BLOCK_DOCS`) の表
 * - `apps/playground-spa/src/catalog/blocks-uses.gen.ts` ... 見本帳の分のうち、部品の頁が見本を探す関数 (`BLOCK_USES`) の表
 * - `apps/playground-spa/src/catalog/blocks-desc.gen.ts` ... 見本帳の分のうち、部品の頁だけが出す説明 (`BLOCK_DESC`) の表 (#3531)
 * - `apps/playground-spa/src/catalog/inputs.gen.ts` ... 図種固有の入力ブロックが持つ名前と属性の定義
 * - `docs/design/base/GRAMMAR.md` の部品と使い方の表 ... 各置き場の `gallery/rule.ts` の行を、ブロックの並びの順に並べた表の行
 *
 * 形の欠片の一覧を `src/blocks/index.ts` と分けるのは、形の欠片を使うのが build の時に原本の検査を書き出す script と検査だけで、
 * 描く時に読む塊に入れないため (#3348)。package の入口は `src/blocks/shapes.ts` を読まない。
 * 使い方の頁の段落を別の file に分けるのは、上の表と同じ module に置くと、最初に読む塊へ全てのブロックの段落が入るため (#3341)。
 * 塊は module ごとに分かれ、最初の画面が読む `BLOCK_TEXT` と同じ module の値は、後から読む頁だけが使う値も最初の塊に入る。
 * 見本を探す関数も同じ理由で別の file に分ける。部品の説明も同じ理由で分け、置き場でも名前 (`gallery/text.ts`) と別の file に置く (#3531)。
 * `GRAMMAR.md` は人が読む文書なので、部品と使い方の表の行だけを書き換え、見出しと表の頭の行とほかの節は触らない。
 * `rule.ts` は TypeScript なので読み込まず、行の 3 つの欄の字 (`part`、`rule`、`name`) を JSON の字として読む。
 * 読み違えると見本帳の検査 (`block-gallery.test.ts` の `grammar-parts-table-from-blocks`) が、読み込んだ行と表の行の食い違いで落ちる。
 *
 * 見本帳の分は package の入口から読まないので、package の一覧 (`src/blocks/index.ts`) には入れず、見本帳の側に書き出す。
 * 読み方を 3 つの一覧に分けるのは、軽い入口が後から読む個別ブロックの読み方を最初に読む塊に入れないため (#3349)。
 * どのブロックが後から読む図の種類の個別ブロックかは、置き場の `block.ts` の付け方の `only` と、図の種類の置き場の `kind.ts` の `later: true` の字から引く。
 * ブロックの並びは `block.ts` の `rank` の字から引き、同じ並びのブロックは dir の名前の順に置く (`blocks/block.ts` の `ranked` と同じ順)。
 * 書き出す字の並びは dir の名前の並びと、上の 3 つの字と `rule.ts` の字だけで決まり、同じ置き場からは毎回同じ字の並びになる。
 *
 * 置き場を足したか消したら `node packages/dragon/scripts/build-blocks.mjs` で書き出し直す。package の build も最初にこれを回す。
 * 書き出した file が dir と食い違うと `test/blocks.test.ts` の `block-registry-derived-from-folders` が落ちる。
 * script として回すと、中身が変わった file だけを書く (書き出した file の更新の時刻を、中身が同じなら動かさない)。
 */
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, relative, sep } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
/** package の src。ブロックと図の種類の置き場はこの下に在る */
export const SRC = join(here, "../src");
/** 見本帳の分の一覧を書き出す先 */
export const CATALOG = join(here, "../../../apps/playground-spa/src/catalog/blocks.gen.ts");
/** 部品と使い方の表を書き換える文書 */
export const GRAMMAR = join(here, "../../../docs/design/base/GRAMMAR.md");
/** 見本帳の分の file。file ごとに file の名前と同じ名前の値を出す (`gallery/text.ts` は `text`) */
export const GALLERY_FILES = ["text", "desc", "shelf", "docs", "rule", "uses"];
/** 見本帳の分のうち、`catalog` の隣の別の file に書き出す分と、その file の名前。使い方の頁と部品の頁だけが読む */
const APART_FILES = { desc: "blocks-desc.gen.ts", docs: "blocks-docs.gen.ts", uses: "blocks-uses.gen.ts" };
/** 部品と使い方の表の見出し */
const GRAMMAR_TABLE = "## 部品と使い方";

const HEADER = "// packages/dragon/scripts/build-blocks.mjs が置き場の dir から書き出した。手で直さない";

/** `path` の下の dir の名前。名前の並び (UTF-16 の順) で返し、無ければ空 */
const dirs = (path) =>
  existsSync(path)
    ? readdirSync(path, { withFileTypes: true })
        .filter((entry) => entry.isDirectory())
        .map((entry) => entry.name)
        .sort()
    : [];

/** dir の名前から作る、import の名前。`edge-label` は `edgeLabel` */
const ident = (name) => name.replace(/[^A-Za-z0-9]+([A-Za-z0-9])/gu, (_, c) => c.toUpperCase()).replace(/^(?=[0-9])/u, "_");

/** `from` の file から `to` の file を指す import の path。拡張子を付けず、区切りは `/` */
const importPath = (from, to) => {
  const path = relative(dirname(from), to).split(sep).join("/");
  return path.startsWith(".") ? path : `./${path}`;
};

/** 鍵を `"<名前>"` で書いた表の字。値は名前ごとに `value(name)` */
const table = (names, value) => (names.length === 0 ? "{}" : `{\n${names.map((name) => `  ${JSON.stringify(name)}: ${value(name)},`).join("\n")}\n}`);

function blocksIndex(names) {
  return [
    HEADER,
    ...names.map((name) => `import { block as ${ident(name)}Block } from "./${name}/block";`),
    "",
    "/** ブロックの一覧。鍵は置き場の dir の名前 */",
    `export const BLOCKS = ${table(names, (name) => `${ident(name)}Block`)} as const;`,
    "",
    "/** ブロックの名前。置き場の dir の名前の並び */",
    `export const BLOCK_NAMES = [${names.map((name) => JSON.stringify(name)).join(", ")}] as const;`,
    "",
  ].join("\n");
}

function shapesIndex(names) {
  return [
    HEADER,
    ...names.map((name) => `import { shape as ${ident(name)}Shape } from "./${name}/shape";`),
    "",
    "/** ブロックの原本の形の欠片の一覧。鍵は置き場の dir の名前。build の時の script と検査だけが読む */",
    `export const SHAPES = ${table(names, (name) => `${ident(name)}Shape`)} as const;`,
    "",
  ].join("\n");
}

/** 置き場の `block.ts` の付け方の `only` の字。無ければ `undefined` */
const onlyOf = (root, name) => {
  const path = join(root, "blocks", name, "block.ts");
  return existsSync(path) ? /\bonly:\s*"([a-z-]+)"/u.exec(readFileSync(path, "utf8"))?.[1] : undefined;
};

/** 置き場の `block.ts` のブロックの並び (`rank`) の字。無ければ `undefined` */
const rankOf = (root, name) => {
  const path = join(root, "blocks", name, "block.ts");
  const found = existsSync(path) ? /\brank:\s*(\d+)/u.exec(readFileSync(path, "utf8"))?.[1] : undefined;
  return found === undefined ? undefined : Number(found);
};

/** ブロックの名前をブロックの並びの順に。並びを書かない置き場は最後に、同じ並びは dir の名前の順に置く */
const rankedNames = (root, names) =>
  names
    .map((name, at) => ({ name, at, rank: rankOf(root, name) ?? Number.POSITIVE_INFINITY }))
    .sort((a, b) => a.rank - b.rank || a.at - b.at)
    .map(({ name }) => name);

/** 後から読む図の種類。置き場の `kind.ts` が `later: true` を名乗る */
const laterKinds = (root, kinds) =>
  kinds.filter((kind) => {
    const path = join(root, "kinds", kind, "kind.ts");
    return existsSync(path) && /\blater:\s*true\b/u.test(readFileSync(path, "utf8"));
  });

function readingsIndex(names) {
  return [
    HEADER,
    ...names.map((name) => `import { reading as ${ident(name)}Reading } from "./${name}/read";`),
    "",
    "/** 全てのブロックの読み方。鍵は置き場の dir の名前。全部入りの入口と検査が読み、軽い入口は読まない (#3349) */",
    `export const READINGS = ${table(names, (name) => `${ident(name)}Reading`)} as const;`,
    "",
  ].join("\n");
}

function entryReadingsIndex(names) {
  return [
    HEADER,
    'import type { BlockReading } from "./block";',
    ...names.map((name) => `import { reading as ${ident(name)}Reading } from "./${name}/read";`),
    "",
    "/** 入口が初めから持つ読み方。コアブロックと、後から読まない図の種類の個別ブロック。鍵は置き場の dir の名前 (#3349) */",
    `export const ENTRY_READINGS: Readonly<Record<string, BlockReading>> = ${table(names, (name) => `${ident(name)}Reading`)};`,
    "",
  ].join("\n");
}

function laterReadingsIndex(names) {
  return [
    HEADER,
    'import type { BlockReading } from "./block";',
    "",
    "/** 後から読む図の種類の個別ブロックの読み方を読む関数。鍵は置き場の dir の名前。軽い入口が書いた図が使う時に呼ぶ (#3349) */",
    `export const LATER_READINGS: Readonly<Record<string, () => Promise<BlockReading>>> = ${table(names, (name) => `() => import("./${name}/read").then((m): BlockReading => m.reading)`)};`,
    "",
  ].join("\n");
}

function kindsIndex(names) {
  return [
    HEADER,
    ...names.map((name) => `import { kind as ${ident(name)}Kind } from "./${name}/kind";`),
    "",
    "/** 置き場を持つ図の種類の一覧。鍵は置き場の dir の名前 */",
    `export const KIND_FOLDERS = ${table(names, (name) => `${ident(name)}Kind`)} as const;`,
    "",
  ].join("\n");
}

function catalogIndex(root, catalog, names, files, order) {
  const exportName = { text: "BLOCK_TEXT", desc: "BLOCK_DESC", shelf: "BLOCK_SHELF", docs: "BLOCK_DOCS", rule: "BLOCK_RULE", uses: "BLOCK_USES" };
  const what = {
    text: "見本帳の一覧の名前",
    desc: "部品の頁の説明",
    shelf: "編集画面の棚に置く部品",
    docs: "使い方の頁の段落",
    rule: "`GRAMMAR.md` の部品と使い方の表の行",
    uses: "部品の頁が、見本がブロックの語を使ったかを決める関数",
  };
  const local = (name, file) => `${ident(name)}${file[0].toUpperCase()}${file.slice(1)}`;
  return [
    HEADER,
    ...names.flatMap((name) => files.map((file) => `import { ${file} as ${local(name, file)} } from "${importPath(catalog, join(root, "blocks", name, "gallery", file))}";`)),
    ...files.flatMap((file) => ["", `/** ${what[file]}。鍵はブロックの置き場の dir の名前 */`, `export const ${exportName[file]} = ${table(names, (name) => local(name, file))} as const;`]),
    ...(order === undefined
      ? []
      : [
          "",
          "/** ブロックの名前をブロックの並び (`block.ts` の `rank`) の順に。見本帳の一覧と棚と使い方の頁は、この順にブロックの見本帳の分を並べる */",
          `export const BLOCK_ORDER = [${order.map((name) => JSON.stringify(name)).join(", ")}] as const;`,
        ]),
    "",
  ].join("\n");
}

/** JSON の字として読める、`"` で囲んだ字 */
const QUOTED = String.raw`"(?:[^"\\]|\\.)*"`;
/** `rule.ts` の 1 行の 3 つの欄 */
const RULE_ROW = new RegExp(String.raw`part:\s*(${QUOTED}),\s*rule:\s*(${QUOTED}),\s*name:\s*(${QUOTED})`, "gu");

/** 置き場の `gallery/rule.ts` の表の行を、書いた順に `| 部品 | 決まり | 部品の名前 |` の字で。持たない置き場は空 */
const ruleRows = (root, name) => {
  const path = join(root, "blocks", name, "gallery", "rule.ts");
  if (!existsSync(path)) return [];
  return [...readFileSync(path, "utf8").matchAll(RULE_ROW)].map((m) => `| ${JSON.parse(m[1])} | ${JSON.parse(m[2])} | ${JSON.parse(m[3])} |`);
};

/**
 * `GRAMMAR.md` の字のうち、部品と使い方の表の行を、ブロックの並びの順のブロックの行に替えた字。
 * 表の頭の行 (見出しの後の最初の `|` の行と区切りの行) とほかの字は変えない。節か表が無ければ `undefined`
 */
function grammarText(root, grammar, order) {
  const text = readFileSync(grammar, "utf8");
  const lines = text.split("\n");
  const heading = lines.indexOf(GRAMMAR_TABLE);
  const head = heading < 0 ? -1 : lines.findIndex((line, i) => i > heading && line.startsWith("|"));
  if (head < 0 || !/^\|\s*-/u.test(lines[head + 1] ?? "")) return undefined;
  let end = head + 2;
  while (end < lines.length && lines[end].startsWith("|")) end++;
  return [...lines.slice(0, head + 2), ...order.flatMap((name) => ruleRows(root, name)), ...lines.slice(end)].join("\n");
}

/**
 * 書き出す file の path と中身。`root` は package の src に当たる dir、`catalog` は見本帳の分の一覧を書き出す先。
 * 読み方の一覧は、置き場の `block.ts` の付け方の `only` と図の種類の `kind.ts` の `later: true` の字で分ける
 */
/** Keep the catalog's kind-owned inputs outside the public drawing entry. */
function inputCatalog(root) {
  const directory = join(root, "checkout", "blocks");
  if (!existsSync(directory)) return undefined;
  const blocks = readdirSync(directory).filter(name => name.endsWith(".ts") && name !== "index.ts").sort().map(name => {
    const source = readFileSync(join(directory, name), "utf8");
    const object = /export const \w+ = (\{[\s\S]*\}) satisfies BlockRule;/u.exec(source)?.[1];
    if (!object) throw new Error(`Cannot read input definition ${name}`);
    return JSON.parse(object);
  });
  return `${HEADER}\nexport const CHECKOUT_INPUTS = ${JSON.stringify(blocks, null, 2)};\n`;
}

export function generate(root = SRC, catalog = CATALOG, grammar = GRAMMAR) {
  const blocks = dirs(join(root, "blocks"));
  const kinds = dirs(join(root, "kinds"));
  const later = new Set(laterKinds(root, kinds));
  const laterBlocks = blocks.filter((name) => later.has(onlyOf(root, name) ?? ""));
  const order = rankedNames(root, blocks);
  const apart = Object.keys(APART_FILES);
  const grammarRewritten = existsSync(grammar) ? grammarText(root, grammar, order) : undefined;
  const inputs = inputCatalog(root);
  return {
    [join(root, "blocks", "index.ts")]: blocksIndex(blocks),
    [join(root, "blocks", "shapes.ts")]: shapesIndex(blocks),
    [join(root, "blocks", "readings.ts")]: readingsIndex(blocks),
    [join(root, "blocks", "entry-readings.ts")]: entryReadingsIndex(blocks.filter((name) => !laterBlocks.includes(name))),
    [join(root, "blocks", "later-readings.ts")]: laterReadingsIndex(laterBlocks),
    [join(root, "kinds", "index.ts")]: kindsIndex(kinds),
    [catalog]: catalogIndex(root, catalog, blocks, GALLERY_FILES.filter((file) => !apart.includes(file)), order),
    ...(inputs === undefined ? {} : { [join(dirname(catalog), "inputs.gen.ts")]: inputs }),
    ...Object.fromEntries(Object.entries(APART_FILES).map(([file, name]) => [join(dirname(catalog), name), catalogIndex(root, join(dirname(catalog), name), blocks, [file])])),
    ...(grammarRewritten === undefined ? {} : { [grammar]: grammarRewritten }),
  };
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  const written = [];
  for (const [path, text] of Object.entries(generate())) {
    // 見本帳と文書の無い所 (package だけを取り出した所) では、見本帳の分の一覧と表を書かない
    if (!existsSync(dirname(path))) continue;
    if (existsSync(path) && readFileSync(path, "utf8") === text) continue;
    writeFileSync(path, text);
    written.push(relative(join(here, "../../.."), path));
  }
  console.log(written.length === 0 ? "[build-blocks] 一覧は置き場の dir と同じ" : `[build-blocks] ${written.join("、")} を書き出した`);
}
