import { readFileSync, readdirSync } from "node:fs";
import { extname, join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * source file が grep 系 tool の検索対象から外れないことを固定する。
 *
 * ripgrep / ugrep は file を binary と判定すると、 既定で中身を走査せず結果から
 * 無言で除外する (`-I` 指定時は「binary です」 の通知すら出ない)。 判定の実トリガは
 * 次の 2 つで、 いずれかを踏んだ source file は grep に存在しない file として扱われる。
 *
 *   - NUL byte (U+0000) を 1 個でも含む
 *   - UTF-8 として復号できない byte 列を含む
 *
 * regex literal に制御文字を直接書くと前者を踏む。 検知したい code point は
 * unicode escape か `String.fromCharCode` で書く。
 *
 * cdl (`packages/cdl/src/visual-validate.ts`) が実際にこれを踏み、 該当 file の全行が
 * grep から消えた結果「その軸は存在しない」 という誤った結論を招いた。 本 test はその移植。
 *
 * test file も走査する。 制御文字を検知する軸の test は検知対象の文字を持ち込みやすい。
 */

const ROOT = join(__dirname, "..", "..", "..");
const SCAN_DIRS = ["packages/dragon/src", "packages/dragon/test", "apps/playground-spa/src"];

/**
 * binary であることが正当な asset の拡張子。 ここに無い拡張子は全て「文字の列」 として検査する。
 *
 * 既定を「検査する」 側に倒すのは、 新しい source 拡張子 (`.mts` / `.cts` 等) が検査から
 * 無言で漏れるのを防ぐため。 binary asset を新たに置く時は、 この list に追記するという
 * 明示的な操作を要求する。
 */
const BINARY_ASSET_EXTENSIONS = new Set([
  ".png",
  ".jpg",
  ".jpeg",
  ".gif",
  ".webp",
  ".avif",
  ".ico",
  ".woff",
  ".woff2",
  ".ttf",
  ".otf",
  ".eot",
  ".mp4",
  ".webm",
  ".pdf",
  ".zip",
]);

/**
 * symlink は辿らない。 循環 (ELOOP) と走査対象 dir の外への脱出を防ぐ。
 * link 先が走査対象の中にあれば、 その実体は実 path 側で走査される。
 */
function listFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.isSymbolicLink()) continue;
    const p = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...listFiles(p));
    else if (entry.isFile()) out.push(p);
  }
  return out;
}

const isBinaryAsset = (p: string): boolean => BINARY_ASSET_EXTENSIONS.has(extname(p).toLowerCase());

describe("source file は grep から外れない", () => {
  const files = SCAN_DIRS.flatMap((d) => listFiles(join(ROOT, d)))
    .filter((abs) => !isBinaryAsset(abs))
    .map((abs) => [abs.slice(ROOT.length + 1), abs] as const);

  it("走査対象が空でない", () => {
    expect(files.length).toBeGreaterThan(0);
  });

  it.each(files)("%s は NUL byte を含まない", (_rel, abs) => {
    expect(readFileSync(abs).indexOf(0)).toBe(-1);
  });

  it.each(files)("%s は UTF-8 として復号できる", (_rel, abs) => {
    const buf = readFileSync(abs);
    // 復号 → 再符号化して byte 列が戻れば、 不正 byte (U+FFFD への置換) が無い。
    expect(Buffer.from(buf.toString("utf8"), "utf8").equals(buf)).toBe(true);
  });
});
