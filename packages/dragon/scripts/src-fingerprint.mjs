/**
 * `packages/dragon/src` の全ての file から、本体の code の指紋を作る (#3748)。
 *
 * build (`tsup.config.ts`) が本体に埋め (`__DRAGON_SRC_FINGERPRINT__`)、収めた配管の図の並べ方の鍵に入る。
 * file の path と中身を path の順に並べて SHA-256 にするので、file を変えても、足しても、名前を変えても指紋が変わる。
 * 版の番号は並べ方の code を変えない時にも上がり、並べ方の code を変えた時に上がらないこともあるので、版ではなく中身で作る。
 * 頭に `.` の付く file と dir は、作業場所に残る物 (`.DS_Store` など) なので読まない
 */
import { createHash } from "node:crypto";
import { readdirSync, readFileSync } from "node:fs";
import { join, relative, sep } from "node:path";

/** `dir` の下の全ての file の path (`dir` から見た `/` 区切り)。字の順に並べる */
function filesUnder(dir, root = dir) {
  return readdirSync(dir, { withFileTypes: true })
    .filter((entry) => !entry.name.startsWith("."))
    .flatMap((entry) => (entry.isDirectory() ? filesUnder(join(dir, entry.name), root) : [relative(root, join(dir, entry.name)).split(sep).join("/")]));
}

/** `dir` の下の全ての file の path と中身から作る SHA-256 の 16 進 64 字 */
export function srcFingerprint(dir) {
  const hash = createHash("sha256");
  for (const file of filesUnder(dir).sort()) {
    const body = readFileSync(join(dir, file));
    hash.update(`${file}\0${body.length}\0`);
    hash.update(body);
  }
  return hash.digest("hex");
}
