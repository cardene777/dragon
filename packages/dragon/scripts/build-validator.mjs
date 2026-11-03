#!/usr/bin/env node
/**
 * 原本の形を、骨組みとブロックの形の欠片から束ねて書き出し、検査の関数を JS の file に前もって書き出す (#2995、#3346)。
 *
 * 骨組み (`src/schemas/base.schema.json`) は、根の欄 (版、種類、題、見せ方、`blocks`、段) と、ブロックの置き場へまだ移していない形と、
 * 図の種類ごとの決まりを持つ。ブロックは置き場の `block.ts` の `shape` に、原本の `blocks` の中の自分の欄の形 (`field`)、
 * `definitions` の欠片、段の中で起きることの枝 (`events`) を持つ。ここで両方を束ねて `src/schemas/diagram.schema.json` を書き出す。
 * ブロックの欄と欠片はブロックの並び (`rank`) の順に、骨組みの同じ所の前に置く。同じ鍵を 2 か所が持つ時は止める。
 *
 * ajv は schema を読んだ時に検査の関数を組み立て、`new Function` で動かす。
 * 頁の CSP は `eval` も `new Function` も許さないため、頁で schema を組み立てると読み込みの時点で止まる。
 * 組み立てを build の前にここで済ませ、出来た関数を `src/schemas/validate-diagram.js` に置く。
 *
 * ブロックの定義は TypeScript なので、script は Node の型を外す読み込みで読む。
 * 拡張子の無い import は `scripts/ts-resolve.mjs` の hook が解くので、`node --import ./scripts/ts-resolve.mjs scripts/build-validator.mjs` で回す。
 * package の build は最初にこれを回す。書き出した file が骨組みとブロックの形と食い違うと `format-v2.test.ts` の検査が落ちる。
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import Ajv from "ajv";
import standaloneCode from "ajv/dist/standalone/index.js";
import { BLOCKS } from "../src/blocks/index.ts";

const here = dirname(fileURLToPath(import.meta.url));
const schemas = join(here, "../src/schemas");
/** 骨組みの形 */
export const BASE = join(schemas, "base.schema.json");
/** 束ねて書き出す原本の形 */
export const SCHEMA = join(schemas, "diagram.schema.json");
/** 書き出す検査の関数 */
export const OUT = join(schemas, "validate-diagram.js");

/**
 * 字の数を code point で数える関数。ajv は書き出した file から自分の部品を `require` で読むが、
 * ESM の file では `require` が無いため、同じ数え方をする関数を file の中に置く。
 */
const UCS2LENGTH = `function ucs2length(str) {
  let length = 0;
  for (const _ of str) length++;
  return length;
}`;
const REQUIRE_UCS2LENGTH = 'require("ajv/dist/runtime/ucs2length").default';

/** 鍵を足す。同じ鍵が既に在れば、2 か所が同じ形を持つので止める */
function put(table, key, value, owner) {
  if (Object.hasOwn(table, key)) throw new Error(`原本の形の ${key} を 2 か所が持つ (${owner})`);
  table[key] = value;
}

/** 骨組みとブロックの形の欠片を束ねた原本の形。ブロックの欄と欠片は、ブロックの並び (`rank`) の順に骨組みの前に置く */
export function compose(blocks = BLOCKS) {
  const base = JSON.parse(readFileSync(BASE, "utf8"));
  const shaped = Object.values(blocks)
    .sort((a, b) => a.rank - b.rank)
    .filter((block) => !("none" in block.shape));
  const fields = {};
  const definitions = {};
  const events = [];
  for (const { name, shape } of shaped) {
    if (shape.field !== undefined) put(fields, name, shape.field, name);
    for (const [key, value] of Object.entries(shape.definitions ?? {})) put(definitions, key, value, name);
    events.push(...Object.values(shape.events ?? {}));
  }
  const blocksField = base.properties.blocks;
  for (const key of Object.keys(blocksField.properties)) put(fields, key, blocksField.properties[key], "骨組み");
  for (const key of Object.keys(base.definitions)) if (Object.hasOwn(definitions, key)) throw new Error(`原本の形の ${key} を 2 か所が持つ (骨組み)`);
  return {
    ...base,
    properties: { ...base.properties, blocks: { ...blocksField, properties: fields } },
    definitions: {
      ...base.definitions,
      event: { ...base.definitions.event, oneOf: [...events, ...base.definitions.event.oneOf] },
      ...definitions,
    },
  };
}

/** 書き出す 2 つの file の中身。骨組みとブロックの形と ajv の版が同じなら毎回同じ字の並びになる */
export function generate(blocks = BLOCKS) {
  const schema = compose(blocks);
  // 設定は検査の結果を変えるため、src/schema.ts の説明と同じにする
  const ajv = new Ajv({ allErrors: true, discriminator: true, strictTypes: false, code: { source: true, esm: true } });
  const code = standaloneCode(ajv, ajv.compile(schema));
  const requires = code.match(/require\(/gu) ?? [];
  if (requires.length !== code.split(REQUIRE_UCS2LENGTH).length - 1) {
    throw new Error("書き出した検査が ucs2length のほかに ajv の部品を require している。build-validator.mjs で置き換えを足す");
  }
  const validator = [
    "/* eslint-disable */",
    "// packages/dragon/scripts/build-validator.mjs が base.schema.json とブロックの形から書き出した。手で直さない",
    UCS2LENGTH,
    // ESM の file は初めから strict なので、file の途中に残る "use strict" は要らない
    code.replace(/^"use strict";/u, "").replaceAll(REQUIRE_UCS2LENGTH, "ucs2length"),
    "",
  ].join("\n");
  return { schema: `${JSON.stringify(schema, null, 2)}\n`, validator };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const written = generate();
  for (const [path, text] of [
    [SCHEMA, written.schema],
    [OUT, written.validator],
  ]) {
    let before = "";
    try {
      before = readFileSync(path, "utf8");
    } catch {
      // 初めて書き出す
    }
    if (before !== text) writeFileSync(path, text);
  }
  console.log(`[build-validator] ${SCHEMA} と ${OUT} を書き出した`);
}
