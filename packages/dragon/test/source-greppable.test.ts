import { lstatSync, readFileSync, readdirSync } from "node:fs";
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
 * 走査結果。 symlink は辿らずに集めるだけにする。
 *
 * 辿れば循環 (ELOOP) と走査対象の外への脱出を招き、 黙って飛ばせば link 先の source が
 * 無検査のまま残る。 どちらも避けるため、 見つけた symlink は path ごと持ち帰って test で落とす。
 */
type Scan = { files: string[]; symlinks: string[]; missing: string[] };

function walk(dir: string): Omit<Scan, "missing"> {
  const out = { files: [] as string[], symlinks: [] as string[] };
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, entry.name);
    if (entry.isSymbolicLink()) {
      out.symlinks.push(p);
      continue;
    }
    if (entry.isDirectory()) {
      const sub = walk(p);
      out.files.push(...sub.files);
      out.symlinks.push(...sub.symlinks);
    } else if (entry.isFile()) {
      out.files.push(p);
    }
  }
  return out;
}

/**
 * `ROOT` から走査 root までの各 segment を上から順に見る。
 *
 * `lstatSync` は引数の **最後の** 要素だけを辿らない。 途中の `packages` や `packages/dragon` が
 * symlink なら黙って解決される。 `readdirSync` も引数の symlink を辿るため、 走査 root とその祖先は
 * 子と同じ経路 (`entry.isSymbolicLink()`) では守れない。
 *
 * segment が存在しない場合は `"missing"` を返す。 `__dirname` は Node が symlink を解決した実 path で、
 * `packages` 自体が symlink なら `ROOT` は repo の外へ飛ぶ。 その時 `SCAN_DIRS` は解決できない。
 * 例外を投げると収集ごと落ちて原因が読めないため、 path を持ち帰って test で落とす。
 */
type SegmentCheck = { kind: "ok" } | { kind: "symlink" | "missing"; path: string };

function checkSegments(root: string, relDir: string): SegmentCheck {
  let cur = root;
  for (const part of relDir.split("/")) {
    cur = join(cur, part);
    let st;
    try {
      st = lstatSync(cur);
    } catch (e) {
      // 不在 (ENOENT) だけを missing として持ち帰る。 EACCES / ENOTDIR / ELOOP 等は
      // 原因が全く違うため、 「存在しない」 に丸めず投げ直して素の error を見せる。
      if ((e as NodeJS.ErrnoException).code === "ENOENT") return { kind: "missing", path: cur };
      throw e;
    }
    if (st.isSymbolicLink()) return { kind: "symlink", path: cur };
  }
  return { kind: "ok" };
}

function scanRoots(relDirs: readonly string[]): Scan {
  const out: Scan = { files: [], symlinks: [], missing: [] };
  for (const relDir of relDirs) {
    const check = checkSegments(ROOT, relDir);
    if (check.kind === "symlink") {
      out.symlinks.push(check.path);
      continue;
    }
    if (check.kind === "missing") {
      out.missing.push(check.path);
      continue;
    }
    const sub = walk(join(ROOT, relDir));
    out.files.push(...sub.files);
    out.symlinks.push(...sub.symlinks);
  }
  return out;
}

const isBinaryAsset = (p: string): boolean => BINARY_ASSET_EXTENSIONS.has(extname(p).toLowerCase());

describe("source file は grep から外れない", () => {
  const scan = scanRoots(SCAN_DIRS);
  const rel = (abs: string): string => abs.slice(ROOT.length + 1);

  const files = scan.files.filter((abs) => !isBinaryAsset(abs)).map((abs) => [rel(abs), abs] as const);

  // symlink を辿ると走査が package の外へ出る。 黙って飛ばすと link 先が無検査で残る。
  // 走査 root でも中間 dir でも扱いは同じで、 存在したら path を出して落とす。
  it("走査対象に symlink が無い", () => {
    expect(scan.symlinks.map(rel)).toEqual([]);
  });

  // `__dirname` は Node が symlink を解決した実 path のため、 `packages` 自体が symlink だと
  // `ROOT` は repo の外を指し、 `SCAN_DIRS` が解決できなくなる。 その状態を path 付きで落とす。
  it("走査 root が全て存在する", () => {
    expect(scan.missing).toEqual([]);
  });

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
