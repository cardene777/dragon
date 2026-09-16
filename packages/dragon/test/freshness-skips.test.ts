/**
 * 検査の前処理が持つ 2 つの関門と、それぞれを外す指定 (#2026)。
 *
 * ## 何が起きたか
 *
 * `0.28.0` を公開する時、公開前の関門が「画面が使う依存の束ねが古い」 で止まった。 束ねを持つのは
 * 動いている開発 server で、その作業で起動したものではないため入れ直せない。 逃し口は
 * `SKIP_DIST_FRESHNESS=1` の 1 本しかなく、付けると `dist` が `src` より古くないかを見る関門まで
 * 一緒に外れた。 公開の経路で本当に守りたいのは後者なので、直せない方のために守りたい方を落とす
 * 形になっていた。
 *
 * ## 何を固定するか
 *
 * 外す指定の 4 通りで、返る問題の数と中身が変わること。 片方を外しても もう片方は残る。
 * 一時 dir だけを使い、動いている開発 server の束ねは読まない。
 */
import { mkdirSync, mkdtempSync, rmSync, symlinkSync, utimesSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, relative } from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import type { Bundle } from "../../../test-support/dep-bundle-freshness";
import type { Target } from "../../../test-support/global-setup";
import { SKIP_ENV, freshnessProblems, readSkips } from "../../../test-support/global-setup";

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

/** `dist` が `src` より古い package と、それを解決する側を作る。 */
function 古いdist(): Target {
  const pkg = tmp();
  writeFileSync(
    join(pkg, "package.json"),
    JSON.stringify({ name: 対象名, version: "0.0.0", main: "./dist/index.js" }),
  );
  書く(join(pkg, "dist", "index.js"), 1000);
  書く(join(pkg, "src", "index.ts"), 2000);
  utimesSync(join(pkg, "src"), 2000, 2000);

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

/** 入口を持つ依存 package を作り、その入口を返す。 */
function 依存package(dir: string): string {
  const entry = join(dir, "dist", "index.js");
  mkdirSync(join(dir, "dist"), { recursive: true });
  writeFileSync(join(dir, "package.json"), JSON.stringify({ name: 依存名, main: "dist/index.js" }));
  writeFileSync(entry, "export const fixture = true;\n");
  return entry;
}

/** いま解決される依存と違う実体を記録した束ねを持つ repo を作る。 */
function ずれた束ね(): { root: string; bundle: Bundle } {
  const root = tmp();
  const app = join(root, "apps", "screen");
  const deps = join(app, "node_modules", ".vite", "deps");
  依存package(join(app, "node_modules", "@cardenelabs", "cdl"));
  const 記録 = 依存package(join(root, "recorded", "node_modules", "@cardenelabs", "cdl"));
  mkdirSync(deps, { recursive: true });
  writeFileSync(
    join(deps, "_metadata.json"),
    JSON.stringify({ optimized: { [依存名]: { src: relative(deps, 記録) } } }),
  );
  return { root, bundle: { dir: "apps/screen/node_modules/.vite/deps", hint: 立て直す } };
}

/** 両方が古い状態を作る。 どの組み合わせでも同じ材料を使う。 */
function 両方古い(): { root: string; targets: Target[]; bundles: Bundle[] } {
  const { root, bundle } = ずれた束ね();
  return { root, targets: [古いdist()], bundles: [bundle] };
}

afterEach(() => {
  for (const d of 作った.splice(0)) rmSync(d, { recursive: true, force: true });
});

describe("外す指定は関門ごとに分かれる (#2026)", () => {
  it("どちらも外さなければ、2 つとも問題として返る", () => {
    // 以降の件数が意味を持つのは、外さない時に 2 件出る材料を使っているから。
    const { root, targets, bundles } = 両方古い();
    const 問題 = freshnessProblems(root, { dist: false, bundle: false }, targets, bundles);

    expect(問題).toHaveLength(2);
    expect(問題.join("\n")).toContain(組み立て直す);
    expect(問題.join("\n")).toContain(立て直す);
  });

  it("`dist` の関門だけを外すと、束ねの古さは残る", () => {
    const { root, targets, bundles } = 両方古い();
    const 問題 = freshnessProblems(root, { dist: true, bundle: false }, targets, bundles);

    expect(問題).toHaveLength(1);
    expect(問題[0]).toContain(立て直す);
    expect(問題[0]).not.toContain(組み立て直す);
  });

  it("束ねの関門だけを外すと、`dist` の古さは残る", () => {
    // 公開の経路で守りたいのはこちら。 束ねを直せない時に一緒に落ちてはいけない。
    const { root, targets, bundles } = 両方古い();
    const 問題 = freshnessProblems(root, { dist: false, bundle: true }, targets, bundles);

    expect(問題).toHaveLength(1);
    expect(問題[0]).toContain(組み立て直す);
    expect(問題[0]).not.toContain(立て直す);
  });

  it("両方外すと問題は 0 件", () => {
    const { root, targets, bundles } = 両方古い();
    expect(freshnessProblems(root, { dist: true, bundle: true }, targets, bundles)).toEqual([]);
  });

  it("古くなければ、外さなくても 0 件", () => {
    // 陰性対照。 古い材料でなくても件数が出るなら、件数は古さを測っていない。
    const root = tmp();
    expect(freshnessProblems(root, { dist: false, bundle: false }, [], [])).toEqual([]);
  });
});

describe("説明文は、その関門を外す名前を出す (#2026)", () => {
  it("`dist` の側は `dist` の名前だけを出す", () => {
    const { root, targets, bundles } = 両方古い();
    const 問題 = freshnessProblems(root, { dist: false, bundle: true }, targets, bundles);

    expect(問題[0]).toContain(SKIP_ENV.dist);
    expect(問題[0]).not.toContain(SKIP_ENV.bundle);
  });

  it("束ねの側は束ねの名前だけを出す", () => {
    const { root, targets, bundles } = 両方古い();
    const 問題 = freshnessProblems(root, { dist: true, bundle: false }, targets, bundles);

    expect(問題[0]).toContain(SKIP_ENV.bundle);
    // `SKIP_DEP_BUNDLE_FRESHNESS` は `SKIP_DIST_FRESHNESS` を部分文字列に持たない。
    expect(問題[0]).not.toContain(SKIP_ENV.dist);
  });

  it("2 つの名前は別物", () => {
    expect(SKIP_ENV.dist).not.toBe(SKIP_ENV.bundle);
  });
});

describe("外す指定を環境から読む (#2026)", () => {
  it("立っている名前だけを外す", () => {
    expect(readSkips({ [SKIP_ENV.dist]: "1" })).toEqual({ dist: true, bundle: false });
    expect(readSkips({ [SKIP_ENV.bundle]: "1" })).toEqual({ dist: false, bundle: true });
  });

  it("何も無ければどちらも外さない", () => {
    expect(readSkips({})).toEqual({ dist: false, bundle: false });
  });

  it("`1` 以外は外さない", () => {
    // 既存の判定と揃える。 `0` や `false` を「外す」 と読むと、切ったつもりで外れる。
    expect(readSkips({ [SKIP_ENV.dist]: "0", [SKIP_ENV.bundle]: "true" })).toEqual({
      dist: false,
      bundle: false,
    });
  });
});
