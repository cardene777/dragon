import {
  mkdirSync,
  mkdtempSync,
  readdirSync,
  realpathSync,
  rmSync,
  symlinkSync,
  unlinkSync,
  utimesSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { checkFreshness, newestMtime, oldestMtime, staleReport } from "../../../test-support/dist-freshness";
import { TARGETS, collectProblems, resolvePkgDir } from "../../../test-support/global-setup";

/**
 * `dist` の鮮度検知 (#979)。
 *
 * dragon の test は package の `dist` を読むため、 古い `dist` が残っていると src を壊しても
 * 通る。 その状態を検知する経路を固定する。
 */

const made: string[] = [];

/** 一時 dir を作る。 test の終わりで消す。 */
function tmp(): string {
  const d = mkdtempSync(join(tmpdir(), "dist-fresh-"));
  made.push(d);
  return d;
}

/** file を書いて更新時刻を指定する (秒)。 */
function write(path: string, sec: number): void {
  mkdirSync(join(path, ".."), { recursive: true });
  writeFileSync(path, "x");
  utimesSync(path, sec, sec);
}

/**
 * dir 自身とその配下の dir の更新時刻を揃える (秒)。
 *
 * `newestMtime` は dir の mtime も見る (削除と rename を捉えるため)。 一時 dir は作った瞬間の
 * 時刻を持つので、 揃えないと fixture の意図した時刻にならない。
 */
function stampDirs(root: string, sec: number): void {
  for (const e of readdirSync(root, { withFileTypes: true })) {
    if (e.isDirectory()) stampDirs(join(root, e.name), sec);
  }
  utimesSync(root, sec, sec);
}

/** `src` と `dist` を持つ package を組み立てる。 */
function pkg(srcSec: number, distSec: number): string {
  const d = tmp();
  write(join(d, "src", "index.ts"), srcSec);
  write(join(d, "dist", "index.js"), distSec);
  stampDirs(join(d, "src"), srcSec);
  return d;
}

afterEach(() => {
  for (const d of made.splice(0)) rmSync(d, { recursive: true, force: true });
});

describe("更新時刻の畳み込み", () => {
  it("最も新しい file を返す", () => {
    const d = tmp();
    write(join(d, "a.ts"), 1000);
    write(join(d, "sub", "b.ts"), 3000);
    write(join(d, "sub", "c.ts"), 2000);
    stampDirs(d, 1000);
    expect(newestMtime(d)).toBe(3000 * 1000);
  });

  it("file を直しただけで dir の mtime が動かない形も拾う", () => {
    // dir の mtime だけ見ると、 中身を直し続けた変更を取りこぼす。
    const d = tmp();
    write(join(d, "a.ts"), 5000);
    stampDirs(d, 1000);
    expect(newestMtime(d)).toBe(5000 * 1000);
  });

  it("dir の mtime も混ぜる (file の削除を捉えるため)", () => {
    // file を消しても残りの file の mtime は動かない。 dir の mtime だけが動く。
    const d = tmp();
    write(join(d, "a.ts"), 1000);
    stampDirs(d, 7000);
    expect(newestMtime(d)).toBe(7000 * 1000);
  });

  it("最も古い file を返す", () => {
    const d = tmp();
    write(join(d, "a.js"), 3000);
    write(join(d, "sub", "b.js"), 1000);
    expect(oldestMtime(d)).toBe(1000 * 1000);
  });

  it("`dist` は src の走査から外す", () => {
    // package の src の中に dist を置く形は無いが、 外し忘れると自分自身を数える。
    const d = tmp();
    write(join(d, "a.ts"), 1000);
    write(join(d, "dist", "gen.js"), 9000);
    stampDirs(d, 1000);
    expect(newestMtime(d)).toBe(1000 * 1000);
  });

  it("`node_modules` は両方の走査から外す", () => {
    const d = tmp();
    write(join(d, "a.ts"), 2000);
    write(join(d, "node_modules", "dep", "index.js"), 9000);
    stampDirs(d, 2000);
    expect(newestMtime(d)).toBe(2000 * 1000);
    expect(oldestMtime(d)).toBe(2000 * 1000);
  });

  it("file が無い dir は null", () => {
    expect(newestMtime(join(tmp(), "居ない"))).toBeNull();
    expect(oldestMtime(join(tmp(), "居ない"))).toBeNull();
  });
});

describe("鮮度の判定", () => {
  it("dist が新しければ fresh", () => {
    expect(checkFreshness(pkg(1000, 2000))).toEqual({ kind: "fresh" });
  });

  it("同時刻は fresh (build 直後は秒が揃う)", () => {
    expect(checkFreshness(pkg(1000, 1000))).toEqual({ kind: "fresh" });
  });

  it("dist が古ければ stale", () => {
    const v = checkFreshness(pkg(2000, 1000));
    expect(v.kind).toBe("stale");
    if (v.kind !== "stale") return;
    expect(v.srcMtime).toBe(2000 * 1000);
    expect(v.distMtime).toBe(1000 * 1000);
  });

  it("dist の一部だけ新しい状態も stale (最も古いもので見る)", () => {
    const d = tmp();
    write(join(d, "src", "index.ts"), 2000);
    write(join(d, "dist", "index.js"), 3000);
    write(join(d, "dist", "react.js"), 1000);
    stampDirs(join(d, "src"), 2000);
    expect(checkFreshness(d).kind).toBe("stale");
  });

  it("src が無ければ no-src (判定材料が無い形を stale に倒さない)", () => {
    const d = tmp();
    write(join(d, "dist", "index.js"), 1000);
    expect(checkFreshness(d)).toEqual({ kind: "no-src" });
  });

  it("dist が無ければ no-dist (import 解決の失敗として別途落ちる)", () => {
    const d = tmp();
    write(join(d, "src", "index.ts"), 1000);
    stampDirs(join(d, "src"), 1000);
    expect(checkFreshness(d)).toEqual({ kind: "no-dist" });
  });

  it("`node_modules` 配下は installed (展開時刻は判定材料にならない)", () => {
    const root = tmp();
    const d = join(root, "node_modules", "@x", "y");
    write(join(d, "src", "index.ts"), 2000);
    write(join(d, "dist", "index.js"), 1000);
    stampDirs(join(d, "src"), 2000);
    expect(checkFreshness(d)).toEqual({ kind: "installed" });
  });
});

describe("報告", () => {
  it("古い時だけ文を返し、 直し方と対象を含む", () => {
    const d = pkg(2000, 1000);
    const r = staleReport(d, "@x/y", "pnpm build");
    expect(r).not.toBeNull();
    expect(r).toContain("@x/y");
    expect(r).toContain("pnpm build");
    expect(r).toContain(d);
    expect(r).toContain("1000 秒");
  });

  it("古くなければ null", () => {
    expect(staleReport(pkg(1000, 2000), "@x/y", "pnpm build")).toBeNull();
  });

  it("差が 1 秒未満でも 0 秒とは書かない", () => {
    const d = tmp();
    write(join(d, "src", "index.ts"), 1000);
    write(join(d, "dist", "index.js"), 999);
    stampDirs(join(d, "src"), 1000);
    expect(staleReport(d, "@x/y", "pnpm build")).toContain("1 秒");
  });
});

/** package.json を持つ package を組み立てる。 `main` は `dist` を指す。 */
function namedPkg(name: string, srcSec: number, distSec: number): string {
  const d = tmp();
  writeFileSync(join(d, "package.json"), JSON.stringify({ name, version: "0.0.0", main: "./dist/index.js" }));
  write(join(d, "src", "index.ts"), srcSec);
  write(join(d, "dist", "index.js"), distSec);
  stampDirs(join(d, "src"), srcSec);
  return d;
}

/** `<consumer>/node_modules/<name>` から package へ symlink を張り、 consumer の dir を返す。 */
function linkInto(pkgDir: string, name: string): string {
  const c = tmp();
  writeFileSync(join(c, "package.json"), JSON.stringify({ name: "consumer", version: "0.0.0" }));
  const at = join(c, "node_modules", name);
  mkdirSync(join(at, ".."), { recursive: true });
  symlinkSync(pkgDir, at);
  return c;
}

describe("package の場所の解決", () => {
  it("`node_modules` の symlink を辿って実体を返す", () => {
    // pnpm の link はこの形。 path で決め打ちすると、 link の置き場所が変わった時に
    // 検査が黙って無効になる。
    const pkg = namedPkg("@x/y", 1000, 2000);
    expect(resolvePkgDir("@x/y", linkInto(pkg, "@x/y"))).toBe(realpathSync(pkg));
  });

  it("名前が合わない package.json は掴まない", () => {
    // pnpm の store (`.pnpm/<pkg>@<ver>/node_modules/<pkg>`) は途中に別の package.json を挟む。
    const pkg = namedPkg("@x/y", 1000, 2000);
    writeFileSync(join(pkg, "dist", "package.json"), JSON.stringify({ name: "別物" }));
    expect(resolvePkgDir("@x/y", linkInto(pkg, "@x/y"))).toBe(realpathSync(pkg));
  });

  it("解決できなければ null", () => {
    expect(resolvePkgDir("@居ない/package", tmp())).toBeNull();
  });
});

describe("検知の全体", () => {
  it("古い package を挙げる", () => {
    const pkg = namedPkg("@x/y", 2000, 1000);
    const p = collectProblems([{ name: "@x/y", from: linkInto(pkg, "@x/y"), hint: "build して" }]);
    expect(p).toHaveLength(1);
    expect(p[0]).toContain("dist が src より");
    expect(p[0]).toContain("build して");
  });

  it("新しければ何も挙げない", () => {
    const pkg = namedPkg("@x/y", 1000, 2000);
    expect(collectProblems([{ name: "@x/y", from: linkInto(pkg, "@x/y"), hint: "build して" }])).toEqual([]);
  });

  it("解決できない target は素通ししない", () => {
    // name の typo や package の移動で検査が黙って無効になるのを防ぐ。
    const p = collectProblems([{ name: "@居ない/package", from: tmp(), hint: "build して" }]);
    expect(p).toHaveLength(1);
    expect(p[0]).toContain("解決できない");
  });

  it("build 後に src の file を消した状態も挙げる", () => {
    // file の mtime だけ見ると、 消しても残りの file の mtime は動かないので通ってしまう。
    const pkg = namedPkg("@x/y", 1000, 2000);
    write(join(pkg, "src", "消す.ts"), 1000);
    stampDirs(join(pkg, "src"), 1000);
    const from = linkInto(pkg, "@x/y");
    // dist を src より新しくしてから消す。 消すと src の dir の mtime が今になる。
    expect(collectProblems([{ name: "@x/y", from, hint: "build して" }])).toEqual([]);
    unlinkSync(join(pkg, "src", "消す.ts"));
    expect(collectProblems([{ name: "@x/y", from, hint: "build して" }])).toHaveLength(1);
  });
});

describe("この repo の対象指定", () => {
  it("並べた package が全て解決できる", () => {
    // 対象指定が実体とずれると検査が丸ごと無効になる。 実際に 1 度そうなった。
    for (const t of TARGETS) {
      expect(resolvePkgDir(t.name, t.from), t.name).not.toBeNull();
    }
  });
});
