#!/usr/bin/env node
/**
 * 見本に今ある崩れの一覧を数えて書く (#3484)。`packages/dragon/test/fixtures/layout-breaks.json` を書き直す。
 *
 * 見本の検査 (`layout-check.test.ts` の `layout-check-examples-match-recorded`) は、この一覧に無い崩れが出ると落ちる。
 * 崩れを直した後と、崩れが増えるのを承知で見本を足した後に、`pnpm build:packages` の後でこの script を回して一覧を書き直す。
 * 見本の file の名前に `.en.` を含む図は英語で、ほかは日本語で読む。崩れの無い見本は一覧に載せない。
 */
import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";

// 検査と同じく build した package を読む。repo の根は package を依存に持たないので、置き場の path で読む
const { checkLayoutText } = await import(new URL("../packages/dragon/dist/index.js", import.meta.url).href);

const ROOT = process.cwd();
const DIRS = ["packages/dragon/examples", "packages/dragon/blocks/examples"].map((dir) => join(ROOT, dir));
const OUT = join(ROOT, "packages/dragon/test/fixtures/layout-breaks.json");

const files = DIRS.flatMap((dir) =>
  readdirSync(dir)
    .filter((name) => name.endsWith(".dragon") && statSync(join(dir, name)).isFile())
    .map((name) => join(dir, name)),
).sort();
const record = {};
let count = 0;
for (const file of files) {
  const breaks = checkLayoutText(readFileSync(file, "utf8"), { lang: file.includes(".en.") ? "en" : "ja" });
  if (breaks.length === 0) continue;
  record[relative(ROOT, file)] = breaks;
  count += breaks.length;
}
writeFileSync(OUT, `${JSON.stringify(record, null, 2)}\n`);
console.log(`${relative(ROOT, OUT)}: ${files.length} 件の見本のうち ${Object.keys(record).length} 件に崩れが ${count} 件`);
