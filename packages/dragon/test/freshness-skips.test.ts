/**
 * 検査の前処理が、止める関門と知らせるだけの見張りを分けて持つこと (#2026 / #2050)。
 *
 * ## 何が起きたか
 *
 * #2026 では、束ねを直せない時の逃し口が 1 本しかなく、付けると `dist` の関門まで外れた。
 * そこで外す指定を関門ごとに分けた。
 *
 * その後も束ねの関門は止め続けた。 束ねは開発 server が配るもので、単体検査は読まない。
 * 開発 server の port を別の作業が使っていて起動し直せないだけで、単体検査が 1 件も走らなかった。
 * 束ねで結果が壊れる画面の検査には、#1998 で同じ関門が入っている。
 *
 * ## 何を固定するか
 *
 * - 束ねが古くても止めず、知らせを 1 回出す。 古くなければ知らせない
 * - `dist` が古ければ今までどおり止め、`SKIP_DIST_FRESHNESS=1` でだけ外れる
 * - 両方古い時は知らせを出してから止める = `dist` で止まっても束ねの古さを見落とさない
 *
 * 一時 dir だけを使い、動いている開発 server の束ねは読まない。
 */
import { mkdirSync, mkdtempSync, rmSync, symlinkSync, utimesSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, relative } from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { staleBundles, type Bundle } from "../../../test-support/dep-bundle-freshness";
import type { Target } from "../../../test-support/global-setup";
import { SKIP_ENV, readSkips, runFreshnessChecks } from "../../../test-support/global-setup";

const 作った: string[] = [];
const 対象名 = "@x/y";
const 依存名 = "@cardenelabs/cdl";
const 組み立て直す = "組み立て直して";
const 立て直す = "開発 server を起動し直して";

function tmp(): string {
  const d = mkdtempSync(join(tmpdir(), "freshness-skips-"));
  作った.push(d);
  return d;
}

/** file を書いて更新時刻を指定する (秒)。 */
function 書く(path: string, sec: number): void {
  mkdirSync(join(path, ".."), { recursive: true });
  writeFileSync(path, "x");
  utimesSync(path, sec, sec);
}

/** `dist` と `src` の更新時刻を指定した package と、それを解決する側を作る。 */
function distを持つ(dist秒: number, src秒: number): Target {
  const pkg = tmp();
  writeFileSync(
    join(pkg, "package.json"),
    JSON.stringify({ name: 対象名, version: "0.0.0", main: "./dist/index.js" }),
  );
  書く(join(pkg, "dist", "index.js"), dist秒);
  書く(join(pkg, "src", "index.ts"), src秒);
  utimesSync(join(pkg, "src"), src秒, src秒);

  const consumer = tmp();
  writeFileSync(
    join(consumer, "package.json"),
    JSON.stringify({ name: "consumer", version: "0.0.0" }),
  );
  const at = join(consumer, "node_modules", 対象名);
  mkdirSync(join(at, ".."), { recursive: true });
  symlinkSync(pkg, at);
  return { name: 対象名, from: consumer, hint: 組み立て直す };
}

const 古いdist = (): Target => distを持つ(1000, 2000);
const 新しいdist = (): Target => distを持つ(2000, 1000);

/** 入口を持つ依存 package を作り、その入口を返す。 */
function 依存package(dir: string): string {
  const entry = join(dir, "dist", "index.js");
  mkdirSync(join(dir, "dist"), { recursive: true });
  writeFileSync(join(dir, "package.json"), JSON.stringify({ name: 依存名, main: "dist/index.js" }));
  writeFileSync(entry, "export const fixture = true;\n");
  return entry;
}

/**
 * 束ねを持つ repo を作る。
 *
 * `古い` なら、いま解決される依存と違う実体を束ねに記録する。 そうでなければ、いま解決される
 * 実体そのものを記録する。 古さ以外の材料は同じにして、知らせの有無が古さだけで分かれるようにする。
 */
function 束ねを持つ(古い: boolean): { root: string; bundles: Bundle[] } {
  const root = tmp();
  const app = join(root, "apps", "screen");
  const deps = join(app, "node_modules", ".vite", "deps");
  const いま = 依存package(join(app, "node_modules", "@cardenelabs", "cdl"));
  const 記録 = 古い
    ? 依存package(join(root, "recorded", "node_modules", "@cardenelabs", "cdl"))
    : いま;
  mkdirSync(deps, { recursive: true });
  writeFileSync(
    join(deps, "_metadata.json"),
    JSON.stringify({ optimized: { [依存名]: { src: relative(deps, 記録) } } }),
  );
  return { root, bundles: [{ dir: "apps/screen/node_modules/.vite/deps", hint: 立て直す }] };
}

/** 前処理を走らせ、出た知らせと投げた説明を集める。 */
function 走らせる(
  env: Record<string, string | undefined>,
  targets: Target[],
  束ね: { root: string; bundles: Bundle[] },
): { 知らせ: string[]; 止めた: string | null } {
  const 知らせ: string[] = [];
  try {
    runFreshnessChecks(束ね.root, env, (s) => 知らせ.push(s), targets, 束ね.bundles);
    return { 知らせ, 止めた: null };
  } catch (e) {
    return { 知らせ, 止めた: e instanceof Error ? e.message : String(e) };
  }
}

afterEach(() => {
  for (const d of 作った.splice(0)) rmSync(d, { recursive: true, force: true });
});

describe("束ねが古くても止めず、知らせる (#2050)", () => {
  it("束ねだけが古ければ、止めずに知らせを 1 回出す", () => {
    const 結果 = 走らせる({}, [新しいdist()], 束ねを持つ(true));

    expect(結果.止めた).toBeNull();
    expect(結果.知らせ).toHaveLength(1);
    expect(結果.知らせ[0]).toContain(立て直す);
    // 単体検査が続くことと、止まるのは画面の検査の側であることを知らせに書く。
    expect(結果.知らせ[0]).toContain("検査は続ける");
    expect(結果.知らせ[0]).toContain("dev-deps-fresh.setup.ts");
  });

  it("束ねが古くなければ知らせない", () => {
    // 陰性対照。 古さ以外は同じ材料なので、知らせの有無は古さだけで分かれる。
    const 揃った = 束ねを持つ(false);
    // 束ねを実際に見たうえでの 0 件であることを確かめる (読めずに素通しした 0 件と分ける)。
    expect(staleBundles(揃った.root, 揃った.bundles)).toMatchObject({ 見た: 1, 見られなかった: 0 });

    const 結果 = 走らせる({}, [新しいdist()], 揃った);
    expect(結果.止めた).toBeNull();
    expect(結果.知らせ).toEqual([]);
  });

  it("束ねの知らせは `dist` を外す指定を案内しない", () => {
    // 案内すると、束ねのために `dist` の関門を外す #2026 の形に戻る。
    const 結果 = 走らせる({}, [新しいdist()], 束ねを持つ(true));
    expect(結果.知らせ).toHaveLength(1);
    expect(結果.知らせ[0]).not.toContain(SKIP_ENV.dist);
  });
});

describe("`dist` が古ければ今までどおり止める (#2026)", () => {
  it("`dist` が古ければ止め、直し方と外す名前を出す", () => {
    const 結果 = 走らせる({}, [古いdist()], 束ねを持つ(false));

    expect(結果.止めた).not.toBeNull();
    expect(結果.止めた).toContain(組み立て直す);
    expect(結果.止めた).toContain(SKIP_ENV.dist);
    expect(結果.知らせ).toEqual([]);
  });

  it("`dist` も束ねも新しければ止めない", () => {
    // 陰性対照。 止めた理由が古さ以外 (解決できない等) に無いことを確かめる。
    const 結果 = 走らせる({}, [新しいdist()], 束ねを持つ(false));
    expect(結果).toEqual({ 知らせ: [], 止めた: null });
  });

  it("両方古ければ、知らせを出してから止める", () => {
    // 2 つを同時に立てた入力で順序を固定する。 止める判定を先に置くと知らせが 0 件になる。
    const 結果 = 走らせる({}, [古いdist()], 束ねを持つ(true));

    expect(結果.知らせ).toHaveLength(1);
    expect(結果.知らせ[0]).toContain(立て直す);
    expect(結果.止めた).toContain(組み立て直す);
    // 止める説明に束ねの直し方を混ぜない。 直すと通る関門は `dist` だけ。
    expect(結果.止めた).not.toContain(立て直す);
  });

  it("`SKIP_DIST_FRESHNESS=1` なら `dist` が古くても止めず、束ねの知らせは残る", () => {
    const 結果 = 走らせる({ [SKIP_ENV.dist]: "1" }, [古いdist()], 束ねを持つ(true));

    expect(結果.止めた).toBeNull();
    expect(結果.知らせ).toHaveLength(1);
    expect(結果.知らせ[0]).toContain(立て直す);
  });
});

describe("外す指定を環境から読む (#2026)", () => {
  it("立っていれば外す", () => {
    expect(readSkips({ [SKIP_ENV.dist]: "1" })).toEqual({ dist: true });
  });

  it("何も無ければ外さない", () => {
    expect(readSkips({})).toEqual({ dist: false });
  });

  it("`1` 以外は外さない", () => {
    // `0` や `false` を「外す」 と読むと、切ったつもりで外れる。
    expect(readSkips({ [SKIP_ENV.dist]: "0" })).toEqual({ dist: false });
    expect(readSkips({ [SKIP_ENV.dist]: "true" })).toEqual({ dist: false });
  });

  it("外す指定を持つのは `dist` の関門だけ", () => {
    // 束ねは止めなくなったので、束ねを外す名前は要らない (#2050)。
    expect(Object.keys(SKIP_ENV)).toEqual(["dist"]);
  });
});
