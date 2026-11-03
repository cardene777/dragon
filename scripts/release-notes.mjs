#!/usr/bin/env node
/**
 * GitHub Release の本文を `CHANGELOG.md` から作る (#3335)。
 *
 * 版の節 (`## [<版>] - <日付>` の次の行から、次の `## ` の手前まで) を取り出し、
 * 最後に変更履歴の全体への link を足して標準出力に出す。
 * 節の中の相対 link は Release の頁では切れるので、repo の main を指す絶対 URL に直す。
 *
 * 使い方: node scripts/release-notes.mjs <版> [CHANGELOG の path]
 * 版は `0.46.3` でも `v0.46.3` でもよい。節が無い版では標準エラーに理由を出して 1 で終わる。
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const BLOB = "https://github.com/cardene777/dragon/blob/main/";

const [given, file = join(dirname(fileURLToPath(import.meta.url)), "..", "CHANGELOG.md")] =
  process.argv.slice(2);
if (!given) {
  console.error("使い方: node scripts/release-notes.mjs <版> [CHANGELOG の path]");
  process.exit(2);
}
const version = given.replace(/^v/u, "");
const lines = readFileSync(file, "utf8").split("\n");
const head = new RegExp(`^## \\[${version.replaceAll(".", "\\.")}\\] - \\d{4}-\\d{2}-\\d{2}$`, "u");
const start = lines.findIndex((line) => head.test(line));
const end = lines.findIndex((line, i) => start >= 0 && i > start && line.startsWith("## "));
const body =
  start < 0
    ? ""
    : lines
        .slice(start + 1, end < 0 ? undefined : end)
        .join("\n")
        .trim();
if (body === "") {
  console.error(`${file} に日付付きの ## [${version}] の節が無いか、節が空`);
  process.exit(1);
}
const linked = body.replace(
  /\]\((?!https?:|#|mailto:)([^)\s]+)\)/gu,
  (_, path) => `](${BLOB}${path.replace(/^\.\//u, "")})`,
);
process.stdout.write(
  `${linked}\n\nEvery version is listed in [CHANGELOG.md](${BLOB}CHANGELOG.md).\n`,
);
