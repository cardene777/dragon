/**
 * 画面が使う依存の束ねが古いことの検知 (#1460)。
 *
 * ## 何が起きたか
 *
 * 依存を 0.15.0 に上げた後も、動いていた開発 server は 8/27 08:11 に作った束ねを使い続けた。
 * 束ねに `drawRatio` も `chart-stat` も **1 件も入っておらず**、画面は 0.15.0 を 1 つも
 * 反映していなかった。 記法に足した項目を書いても何も出ない。
 *
 * Vite が束ねを作り直すのは server の起動時だけなので、動かしたまま依存を上げると気付かない。
 *
 * ## 何を見るか
 *
 * 1. 束ねが lockfile より古い時に落とす
 * 2. **新しい時は落とさない** (陰性対照)
 * 3. **無い時は落とさない** = server を 1 度も起動していない人を止めない
 *
 * 2 と 3 が要点。 2 が無いと「常に落とす」 実装が通り、3 が無いと使っていない人が巻き添えになる。
 */
import { describe, it, expect, afterEach } from "vitest";
import { mkdtempSync, mkdirSync, writeFileSync, utimesSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { staleBundles, staleBundleReport, BUNDLES } from "../../../test-support/dep-bundle-freshness";

const 作った: string[] = [];

/**
 * 仮の repo を作る。
 *
 * @param 束ねの時刻 `null` なら束ねを作らない。 数なら lockfile からの秒差 (正 = 新しい)
 */
function 仮のrepo(束ねの時刻: number | null): string {
  const root = mkdtempSync(join(tmpdir(), "bundle-fresh-"));
  作った.push(root);
  const lock = join(root, "pnpm-lock.yaml");
  writeFileSync(lock, "lockfileVersion: '9.0'\n");
  const 基準 = Date.now() / 1000;
  utimesSync(lock, 基準, 基準);
  if (束ねの時刻 !== null) {
    const d = join(root, "deps");
    mkdirSync(d, { recursive: true });
    writeFileSync(join(d, "x.js"), "export const a = 1;\n");
    utimesSync(d, 基準 + 束ねの時刻, 基準 + 束ねの時刻);
  }
  return root;
}

const 見る = [{ dir: "deps", hint: "開発 server を止めて `pnpm dev` で起動し直す" }];

afterEach(() => {
  for (const d of 作った.splice(0)) rmSync(d, { recursive: true, force: true });
});

describe("束ねが古い時に落とす (#1460)", () => {
  it("lockfile より古い束ねを挙げる", () => {
    const r = staleBundles(仮のrepo(-3600), 見る);
    expect(r.stale.map((s) => s.dir)).toEqual(["deps"]);
  });

  it("どれだけ古いかを出す (読み手が判断できる)", () => {
    const r = staleBundles(仮のrepo(-3600), 見る);
    expect(r.stale[0]?.古さ秒).toBeGreaterThan(3000);
  });
});

describe("落とさない形 (#1460)", () => {
  it("束ねが新しければ落とさない (陰性対照)", () => {
    // これが無いと「常に落とす」 実装でも上の 2 件が通る
    const r = staleBundles(仮のrepo(60), 見る);
    expect(r.stale).toEqual([]);
    expect(r.読めた, "束ねを 1 つも読めていない (検査が空振りしている)").toBe(1);
  });

  it("束ねが無ければ落とさない (server を使わない人を止めない)", () => {
    const r = staleBundles(仮のrepo(null), 見る);
    expect(r.stale).toEqual([]);
    expect(r.読めた, "無いものを読んだことにしている").toBe(0);
  });

  it("lockfile が無ければ落とさない", () => {
    const root = mkdtempSync(join(tmpdir(), "bundle-fresh-"));
    作った.push(root);
    expect(staleBundles(root, 見る).stale).toEqual([]);
  });
});

describe("案内 (#1460)", () => {
  it("次の一手を含む", () => {
    // 原因だけ言われても読み手は動けない (#1454 と同じ)
    const 文 = staleBundleReport(staleBundles(仮のrepo(-3600), 見る).stale);
    expect(文).toContain("pnpm dev");
    expect(文).toContain("足した項目が出ない");
  });
});

describe("見る束ねの一覧 (#1460)", () => {
  it("1 つ以上ある (配線が空になっていない)", () => {
    // 空にすると検査は常に緑になり、守りが消えたことに気付けない
    expect(BUNDLES.length, "見る束ねが 0 件").toBeGreaterThan(0);
  });

  it("画面を出す app の束ねを見ている", () => {
    expect(BUNDLES.map((b) => b.dir)).toContain("apps/playground-spa/node_modules/.vite/deps");
  });
});
