/**
 * 崩れの記録 (`packages/dragon/test/fixtures/layout-breaks.json`) と突き合わせる見本の一覧 (#3790)。
 *
 * 見本の崩れの検査 (`layout-check.test.ts` の `layout-check-examples-match-recorded`) と、記録を書き直す script (`layout-breaks-record.mjs`) の両方がここから読む。
 * 2 つが別々に置き場を持つと、片方だけに置き場を足して、記録と検査が読む見本がずれるため。
 *
 * 読む置き場は 3 つで、`packages/dragon/examples` は下のフォルダの `.dragon` と md の中の図も読む。
 * - `packages/dragon/examples` の `.dragon` と、`.md` の中の図
 * - `packages/dragon/blocks/examples` の `.dragon`
 * - 使い方の頁の見本 (`apps/playground-spa/src/docs/examples`) の `.dragon`
 *
 * 見本帳の図 (`packages/dragon/src/blocks` のブロックごとの `gallery` の置き場) は、崩れ 0 件を求める検査 (`gallery-warns-nothing`) が読むので、ここに入れない。
 * 使い方の頁の図の原本 (`.json`) は記法の崩れの検査に渡せないので、原本から描く検査 (`layout-check-json-examples-have-no-breaks`) が読む。
 *
 * md の中の図は、図の中身の 1 行目が md の何行目かで呼ぶ (`packages/dragon/examples/quick-start.md:779`)。
 * file の名前に `.en.` を含む見本は英語で、ほかは日本語で読む。
 */
import { readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";

/** dir の下の file を、下のフォルダも含めて全て */
const filesUnder = (dir) => readdirSync(dir, { withFileTypes: true }).flatMap((entry) => (entry.isDirectory() ? filesUnder(join(dir, entry.name)) : [join(dir, entry.name)]));

/** dir の直下の file のうち、名前が `ext` で終わる物 */
const filesIn = (dir, ext) =>
  readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith(ext))
    .map((entry) => join(dir, entry.name));

/**
 * repo の根 `root` から見た見本の一覧を、名前の順に返す。
 * `extractDiagrams` は md から図を取り出す関数 (`@cardenelabs/dragon` の `extractDiagrams`)。検査は元の code の、script は build した package の関数を渡す。
 * 1 件は名前 (`name`)、記法 (`source`)、読む言葉 (`lang`) を持つ
 */
export function layoutExamples(root, extractDiagrams) {
  const examples = filesUnder(join(root, "packages/dragon/examples"));
  const notations = [
    ...examples.filter((file) => file.endsWith(".dragon")),
    ...filesIn(join(root, "packages/dragon/blocks/examples"), ".dragon"),
    ...filesIn(join(root, "apps/playground-spa/src/docs/examples"), ".dragon"),
  ].map((file) => ({ file, name: relative(root, file), source: readFileSync(file, "utf8") }));
  const fences = examples
    .filter((file) => file.endsWith(".md"))
    .flatMap((file) => extractDiagrams(readFileSync(file, "utf8")).map((fence) => ({ file, name: `${relative(root, file)}:${fence.line}`, source: fence.source })));
  return [...notations, ...fences]
    .map(({ file, name, source }) => ({ name, source, lang: file.includes(".en.") ? "en" : "ja" }))
    .sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));
}
