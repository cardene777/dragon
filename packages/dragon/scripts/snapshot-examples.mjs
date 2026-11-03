#!/usr/bin/env node
/**
 * 見本 (`packages/dragon/examples/`) を描いた結果の指紋を取る (#3345)。
 *
 * 部品をブロックの置き場へ移す作り直しは、描いた SVG を1字も変えずに行う。
 * 作り直す前の dist でこの script を回して `test/fixtures/examples-svg.json` に指紋を残し、
 * `test/examples-svg.test.ts` が同じ関数で今の dist の指紋を取って突き合わせる。
 *
 * SVG そのものを残すと repo が数 MB 重くなるので、sha256 だけを残す。
 * 指紋が食い違った時は、作り直す前の版 (印 `v0.47.0`) の dist で同じ見本を描いて見比べる。
 *
 * 記法の見本 (`.dragon`) は読んだ原本の JSON の字の並びも指紋に取る。図の id はこの字の並びから作るため、
 * 読む処理が出す鍵の順が変わると、SVG より先にここで判る。
 */
import { createHash } from "node:crypto";
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
export const EXAMPLES = join(here, "../examples");
/** 検査が使う記法の見本。見本より細かい形 (同じ箱へ戻る線、角の番号など) を持つので、指紋の範囲に入れる */
export const FIXTURES = join(here, "../test/fixtures");
export const OUT = join(FIXTURES, "examples-svg.json");
/**
 * 見本帳の部品の図。全ての部品を、その部品を描ける全ての図の種類で描くので、作り直しの範囲を最も広く覆う。
 * ブロックの置き場へ移しても同じ鍵で引けるよう、鍵は `parts/<file の名前>` にする
 */
export const PART_FIGURES = join(here, "../../../apps/playground-spa/src/catalog/parts");

/** 描き方の組。既定、暗い地と止め絵と日本語、別の色味 */
export const VARIANTS = {
  default: {},
  "dark-still-ja": { theme: "dark", still: true, lang: "ja" },
  night: { palette: "night" },
};

// 先頭16字 (64 bit) で足りる。repo に残す file を軽くする
const sha = (text) => createHash("sha256").update(text).digest("hex").slice(0, 16);

/** 見本の file の名前と、その原本 (記法の見本は読んだ結果) */
export function sources(api) {
  const files = [
    ...readdirSync(EXAMPLES)
      .filter((file) => file.endsWith(".json") || file.endsWith(".dragon"))
      .map((file) => join("examples", file)),
    ...readdirSync(FIXTURES)
      .filter((file) => file.endsWith(".dragon"))
      .map((file) => join("test/fixtures", file)),
  ].sort();
  const figures = readdirSync(PART_FIGURES)
    .filter((file) => file.endsWith(".dragon"))
    .sort()
    .map((file) => ({ file: `parts/${file}`, path: join(PART_FIGURES, file) }));
  return [...files.map((file) => ({ file, path: join(here, "..", file) })), ...figures].map(({ file, path }) => {
      const text = readFileSync(path, "utf8");
      if (file.endsWith(".json")) return { file, diagram: JSON.parse(text) };
      const parsed = api.parseNotation(text, { lang: file.endsWith(".en.dragon") ? "en" : "ja" });
      if (!parsed.ok) throw new Error(`${file} を読めない: ${JSON.stringify(parsed.errors)}`);
      return { file, diagram: parsed.diagram };
    });
}

/** 見本ごと、描き方ごとの指紋。鍵は `<file>|<描き方>|<svg か layout か timeline か json>` */
export function fingerprints(api) {
  const out = {};
  for (const { file, diagram } of sources(api)) {
    if (file.endsWith(".dragon")) out[`${file}|parsed|json`] = sha(JSON.stringify(diagram));
    for (const [name, options] of Object.entries(VARIANTS)) {
      const rendered = api.renderDiagram(diagram, options);
      out[`${file}|${name}|svg`] = sha(rendered.svg);
      out[`${file}|${name}|layout`] = sha(JSON.stringify(rendered.layout));
      out[`${file}|${name}|timeline`] = sha(JSON.stringify(rendered.timeline));
    }
  }
  return out;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  const api = await import(pathToFileURL(join(here, "../dist/index.js")).href);
  const out = fingerprints(api);
  writeFileSync(OUT, `${JSON.stringify(out, null, 2)}\n`);
  console.log(`${Object.keys(out).length} 件の指紋を ${OUT} に書いた`);
}
