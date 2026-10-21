#!/usr/bin/env node
/**
 * 原本の JSON Schema から、検査の関数を JS の file に前もって書き出す (#2995)。
 *
 * ajv は schema を読んだ時に検査の関数を組み立て、`new Function` で動かす。
 * 頁の CSP は `eval` も `new Function` も許さないため、頁で schema を組み立てると読み込みの時点で止まる。
 * 組み立てを build の前にここで済ませ、出来た関数を `src/schemas/validate-diagram.js` に置く。
 *
 * schema を直したら `node packages/dragon/scripts/build-validator.mjs` で書き出し直す。
 * 書き出した file が今の schema と食い違うと `schema.test.ts` の検査が落ちる。
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import Ajv from "ajv";
import standaloneCode from "ajv/dist/standalone/index.js";

const here = dirname(fileURLToPath(import.meta.url));
const schemas = join(here, "../src/schemas");
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

/** 書き出す file の中身。schema と ajv の版が同じなら毎回同じ字の並びになる */
export function generate() {
  const schema = JSON.parse(readFileSync(join(schemas, "diagram.schema.json"), "utf8"));
  // 設定は検査の結果を変えるため、src/schema.ts の説明と同じにする
  const ajv = new Ajv({ allErrors: true, discriminator: true, strictTypes: false, code: { source: true, esm: true } });
  const code = standaloneCode(ajv, ajv.compile(schema));
  const requires = code.match(/require\(/gu) ?? [];
  if (requires.length !== code.split(REQUIRE_UCS2LENGTH).length - 1) {
    throw new Error("書き出した検査が ucs2length のほかに ajv の部品を require している。build-validator.mjs で置き換えを足す");
  }
  return [
    "/* eslint-disable */",
    "// packages/dragon/scripts/build-validator.mjs が diagram.schema.json から書き出した。手で直さない",
    UCS2LENGTH,
    // ESM の file は初めから strict なので、file の途中に残る "use strict" は要らない
    code.replace(/^"use strict";/u, "").replaceAll(REQUIRE_UCS2LENGTH, "ucs2length"),
    "",
  ].join("\n");
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  writeFileSync(OUT, generate());
  console.log(`[build-validator] ${OUT} を書き出した`);
}
