import { type Dirent, readdirSync, realpathSync, statSync } from "node:fs";
import { join, sep } from "node:path";

/**
 * package の `dist` が `src` より古くないかを見る。
 *
 * dragon は cdl を `link:` で参照し、 dragon 自身の test も `@cardenelabs/dragon` (= `dist`) を
 * 読む。 どちらの test script にも build は含まれていないため、 古い `dist` が手元に残っていると
 * **src を壊しても test が通る**。
 *
 * `dist` が無い場合は import 解決に失敗して落ちるので見逃しにならない。 危ないのは
 * 「古い `dist` が残っている」 場合だけで、 それを検知する。
 */

/** `src` の走査から外す dir。 */
const SRC_SKIP: ReadonlySet<string> = new Set(["node_modules", ".git", "dist", "dist-types"]);

/** `dist` の走査から外す dir。 */
const DIST_SKIP: ReadonlySet<string> = new Set(["node_modules"]);

/**
 * dir 配下の更新時刻 (epoch ミリ秒) を集めて畳む。
 *
 * @param withDirs dir 自身の mtime も混ぜるか。
 *
 * file だけ見ると **削除と rename を取りこぼす**。 file を消しても残りの file の mtime は動かず、
 * rename も元の mtime を保つため、 build 後に module を消しても「新しくない」 と判定される
 * (codex review Round 1 の指摘)。 dir の mtime は直下の entry が増減した時に動くので、 両方の
 * 大きい方を取れば中身の変更と増減の両方を捉えられる。
 *
 * 逆に dir だけ見ると、 file の中身を直し続けた変更を取りこぼす。 片方では足りない。
 */
function foldMtime(
  dir: string,
  pick: (a: number, b: number) => number,
  skip: ReadonlySet<string>,
  withDirs: boolean,
): number | null {
  let acc: number | null = null;
  let entries: Dirent[];
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return null;
  }
  if (withDirs) {
    try {
      acc = statSync(dir).mtimeMs;
    } catch {
      // 走査中に消えた dir は無視する。
    }
  }
  for (const e of entries) {
    if (e.isDirectory()) {
      if (skip.has(e.name)) continue;
      const sub = foldMtime(join(dir, e.name), pick, skip, withDirs);
      if (sub !== null) acc = acc === null ? sub : pick(acc, sub);
      continue;
    }
    if (!e.isFile()) continue;
    try {
      const m = statSync(join(dir, e.name)).mtimeMs;
      acc = acc === null ? m : pick(acc, m);
    } catch {
      // 走査中に消えた file は無視する。
    }
  }
  return acc;
}

/**
 * dir 配下で最も新しい更新時刻。 dir 自身の mtime も含める。 空なら `null`。
 *
 * dir を含めるのは削除と rename を捉えるため。 含めないと build 後に src の file を消しても
 * 「新しくない」 と判定される。
 */
export const newestMtime = (dir: string): number | null => foldMtime(dir, Math.max, SRC_SKIP, true);

/**
 * dir 配下で最も古い file の更新時刻。 file が 1 つも無ければ `null`。
 *
 * `dist` 側は最も古いもので見る。 一部だけ作り直された状態を「新しい」 と判定しないため。
 * dir の mtime は混ぜない。 混ぜると「dir を作った時刻」 が最古になり、 中身より古い値で
 * 判定してしまう。
 */
export const oldestMtime = (dir: string): number | null => foldMtime(dir, Math.min, DIST_SKIP, false);

/** `checkFreshness` の判定結果。 */
export type FreshnessVerdict =
  | { readonly kind: "fresh" }
  /** 配布物として install された package。 mtime は展開時刻なので判定材料にならない。 */
  | { readonly kind: "installed" }
  /** `src` が無い。 判定材料が揃わない。 */
  | { readonly kind: "no-src" }
  /** `dist` が無い。 import 解決の失敗として別途 loud に落ちるので、 ここでは止めない。 */
  | { readonly kind: "no-dist" }
  | { readonly kind: "stale"; readonly srcMtime: number; readonly distMtime: number };

/** path が `node_modules` の配下か。 */
function isInstalled(dir: string): boolean {
  let real: string;
  try {
    real = realpathSync(dir);
  } catch {
    real = dir;
  }
  return real.split(sep).includes("node_modules");
}

/**
 * package dir の `dist` が `src` より古いかを返す。
 *
 * 判定できない形 (配布物 / `src` 無し / `dist` 無し) は専用の値で返し、 呼出側が「古い」 に
 * 倒さないようにする。 素の真偽で返すと、 判定できない形が「古い」 に落ちて配布物 install の
 * 環境で常に落ちる。
 *
 * 配布物を外すのは、 npm が展開時に mtime を書くため `dist` と `src` の前後が中身と無関係に
 * 決まるから (cdl は `files` に `src` を含むので、 install 先にも `src` が存在する)。
 */
export function checkFreshness(pkgDir: string): FreshnessVerdict {
  if (isInstalled(pkgDir)) return { kind: "installed" };
  const srcMtime = newestMtime(join(pkgDir, "src"));
  if (srcMtime === null) return { kind: "no-src" };
  const distMtime = oldestMtime(join(pkgDir, "dist"));
  if (distMtime === null) return { kind: "no-dist" };
  if (distMtime >= srcMtime) return { kind: "fresh" };
  return { kind: "stale", srcMtime, distMtime };
}

/**
 * 古ければ人が読める説明を返す。 古くなければ `null`。
 *
 * @param pkgDir package の root
 * @param pkgName 表示用の package 名
 * @param buildHint 直し方 (実行する command)
 */
export function staleReport(pkgDir: string, pkgName: string, buildHint: string): string | null {
  const v = checkFreshness(pkgDir);
  if (v.kind !== "stale") return null;
  const behind = Math.max(1, Math.round((v.srcMtime - v.distMtime) / 1000));
  return (
    `${pkgName} の dist が src より ${behind} 秒古い。 test は dist を読むため、 ` +
    `このまま走らせると src の変更を検査しないまま通る。\n` +
    `  直す: ${buildHint}\n` +
    `  対象: ${pkgDir}`
  );
}
