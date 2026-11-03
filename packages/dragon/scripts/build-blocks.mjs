#!/usr/bin/env node
/**
 * ブロックと図の種類の置き場の dir から、一覧の file を書き出す (#3345)。
 *
 * ブロックは `src/blocks/<名前>/`、図の種類は `src/kinds/<種類>/` に置き場を1つずつ持つ。
 * 一覧を手で書くと、置き場を足した時に書き足し忘れるので、置き場の dir の名前から次の 3 つを書き出す。
 *
 * - `src/blocks/index.ts` ... 各置き場の `block.ts` が出す定義を、dir の名前を鍵にした `BLOCKS` と、名前の並び `BLOCK_NAMES`
 * - `src/kinds/index.ts` ... 各置き場の `kind.ts` が出す定義を、dir の名前を鍵にした `KIND_FOLDERS`
 * - `apps/playground-spa/src/catalog/blocks.gen.ts` ... 各置き場の `gallery/` の一覧の名前と説明と棚の部品の名前を、種類ごとに dir の名前を鍵にした表
 * - `apps/playground-spa/src/catalog/blocks-docs.gen.ts` ... 各置き場の `gallery/` の使い方の頁の段落と `GRAMMAR.md` の表の行を、同じ形の表
 *
 * 見本帳の分は package の入口から読まないので、package の一覧 (`src/blocks/index.ts`) には入れず、見本帳の側に書き出す。
 * 一覧の名前と説明と棚の名前は、見本帳を開いた時に読む字の表 (`text.ts`) が読む。使い方の頁の段落は使い方の頁だけが読むので、
 * 別の file に書き出して、見本帳を開いた時に読む塊へ入れない (#3347)。
 * 書き出す字の並びは dir の名前の並びだけで決まり、同じ dir からは毎回同じ字の並びになる。
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
/** 見本帳の分のうち、見本帳を開いた時に読む分の一覧を書き出す先 */
export const CATALOG = join(here, "../../../apps/playground-spa/src/catalog/blocks.gen.ts");
/** 見本帳の分のうち、使い方の頁と `GRAMMAR.md` の検査だけが読む分の一覧を書き出す先 (#3347) */
export const CATALOG_DOCS = join(here, "../../../apps/playground-spa/src/catalog/blocks-docs.gen.ts");
/** 見本帳の分の file。file ごとに file の名前と同じ名前の値を出す (`gallery/text.ts` は `text`) */
export const GALLERY_FILES = ["text", "shelf", "docs", "rule"];
/** 見本帳を開いた時に読む分の file。残り (`docs` と `rule`) は `CATALOG_DOCS` に書き出す */
const FIRST_FILES = ["text", "shelf"];

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

/** 見本帳の分の一覧。`files` は書き出す見本帳の分の file */
function catalogIndex(root, catalog, names, files) {
  const exportName = { text: "BLOCK_TEXT", shelf: "BLOCK_SHELF", docs: "BLOCK_DOCS", rule: "BLOCK_RULE" };
  const what = {
    text: "見本帳の一覧の名前と説明",
    shelf: "編集画面の棚に置く部品の名前",
    docs: "使い方の頁の段落",
    rule: "`GRAMMAR.md` の部品と使い方の表の行",
  };
  const local = (name, file) => `${ident(name)}${file[0].toUpperCase()}${file.slice(1)}`;
  return [
    HEADER,
    ...names.flatMap((name) => files.map((file) => `import { ${file} as ${local(name, file)} } from "${importPath(catalog, join(root, "blocks", name, "gallery", file))}";`)),
    ...files.flatMap((file) => ["", `/** ${what[file]}。鍵はブロックの置き場の dir の名前 */`, `export const ${exportName[file]} = ${table(names, (name) => local(name, file))} as const;`]),
    "",
  ].join("\n");
}

/**
 * 書き出す file の path と中身。`root` は package の src に当たる dir、`catalog` と `catalogDocs` は見本帳の分の 2 つの一覧を書き出す先。
 * 置き場の dir の中身は読まず、dir の名前だけから作る
 */
export function generate(root = SRC, catalog = CATALOG, catalogDocs = CATALOG_DOCS) {
  const blocks = dirs(join(root, "blocks"));
  const kinds = dirs(join(root, "kinds"));
  return {
    [join(root, "blocks", "index.ts")]: blocksIndex(blocks),
    [join(root, "kinds", "index.ts")]: kindsIndex(kinds),
    [catalog]: catalogIndex(root, catalog, blocks, FIRST_FILES),
    [catalogDocs]: catalogIndex(root, catalogDocs, blocks, GALLERY_FILES.filter((file) => !FIRST_FILES.includes(file))),
  };
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  const written = [];
  for (const [path, text] of Object.entries(generate())) {
    // 見本帳の無い所 (package だけを取り出した所) では、見本帳の分の一覧を書かない
    if (!existsSync(dirname(path))) continue;
    if (existsSync(path) && readFileSync(path, "utf8") === text) continue;
    writeFileSync(path, text);
    written.push(relative(join(here, "../../.."), path));
  }
  console.log(written.length === 0 ? "[build-blocks] 一覧は置き場の dir と同じ" : `[build-blocks] ${written.join("、")} を書き出した`);
}
