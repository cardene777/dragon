/**
 * 画面が使う依存の束ねが、いま解決される依存を指しているかの検知 (#1636)。
 *
 * Vite の `_metadata.json` に残る `optimized.<name>.src` から package root を取り、
 * app が現在解決する package root と突き合わせる。時刻は判定に使わない。
 */
import { describe, it, expect, afterEach } from "vitest";
import { mkdtempSync, mkdirSync, rmSync, utimesSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, relative } from "node:path";

import { staleBundles, staleBundleReport, BUNDLES } from "../../../test-support/dep-bundle-freshness";

const 作った: string[] = [];
const 依存名 = "@cardenelabs/cdl";
const 案内 = "開発 server を止めて `pnpm dev` で起動し直す";

interface Fixture {
  readonly root: string;
  readonly bundle: { readonly dir: string; readonly hint: string };
  readonly deps: string;
  readonly lock: string;
  readonly 記録された入口: string;
  readonly いまの入口: string;
}

function packageを作る(dir: string): string {
  const entry = join(dir, "dist", "index.js");
  mkdirSync(join(dir, "dist"), { recursive: true });
  writeFileSync(join(dir, "package.json"), JSON.stringify({ name: 依存名, main: "dist/index.js" }));
  writeFileSync(entry, "export const fixture = true;\n");
  return entry;
}

/** Vite metadata と、app が解決する package を持つ仮の repo を作る。 */
function 仮のrepo(記録先: "同じ" | "違う" = "違う"): Fixture {
  const root = mkdtempSync(join(tmpdir(), "bundle-fresh-"));
  作った.push(root);

  const app = join(root, "apps", "screen");
  const deps = join(app, "node_modules", ".vite", "deps");
  const いまの入口 = packageを作る(join(app, "node_modules", "@cardenelabs", "cdl"));
  const 記録された入口 = packageを作る(join(root, "recorded", "node_modules", "@cardenelabs", "cdl"));
  const lock = join(root, "pnpm-lock.yaml");
  writeFileSync(lock, "lockfileVersion: '9.0'\n");
  mkdirSync(deps, { recursive: true });

  const metadata = join(deps, "_metadata.json");
  writeFileSync(
    metadata,
    JSON.stringify({
      optimized: {
        [依存名]: { src: relative(deps, 記録先 === "同じ" ? いまの入口 : 記録された入口) },
      },
    }),
  );

  return {
    root,
    bundle: { dir: "apps/screen/node_modules/.vite/deps", hint: 案内 },
    deps,
    lock,
    記録された入口,
    いまの入口,
  };
}

afterEach(() => {
  for (const d of 作った.splice(0)) rmSync(d, { recursive: true, force: true });
});

describe("束ねが別の実体を記録している時に落とす (#1636)", () => {
  it("記録された実体 path といまの実体 path が違う束ねを挙げる", () => {
    const f = 仮のrepo();
    const r = staleBundles(f.root, [f.bundle]);

    expect(r.stale).toHaveLength(1);
    expect(r.stale[0]).toMatchObject({
      dir: f.bundle.dir,
      hint: 案内,
      ずれた: [{ name: 依存名, 記録: join(f.root, "recorded", "node_modules", "@cardenelabs", "cdl"), いま: join(f.root, "apps", "screen", "node_modules", "@cardenelabs", "cdl") }],
    });
  });

  it("案内に依存名、記録された path、いまの path と次の一手を出す", () => {
    const f = 仮のrepo();
    const 文 = staleBundleReport(staleBundles(f.root, [f.bundle]).stale);

    expect(文).toContain(依存名);
    expect(文).toContain(join(f.root, "recorded", "node_modules", "@cardenelabs", "cdl"));
    expect(文).toContain(join(f.root, "apps", "screen", "node_modules", "@cardenelabs", "cdl"));
    expect(文).toContain("pnpm dev");
  });
});

describe("時刻では落とさない (#1636)", () => {
  it("lockfile の mtime だけが進んでも実体 path が同じなら報告しない", () => {
    const f = 仮のrepo("同じ");
    const 未来 = (Date.now() + 60_000) / 1000;
    utimesSync(f.lock, 未来, 未来);

    const r = staleBundles(f.root, [f.bundle]);
    expect(r.stale).toEqual([]);
    expect(r.見た, "実体 path の突き合わせが空振りしている").toBe(1);
    expect(r.見られなかった).toBe(0);
  });
});

describe("落とさない形 (#1636)", () => {
  it("束ねの dir が無ければ報告しない", () => {
    const f = 仮のrepo();
    rmSync(f.deps, { recursive: true });

    expect(staleBundles(f.root, [f.bundle])).toEqual({ stale: [], 見た: 0, 見られなかった: 0 });
  });

  it("_metadata.json が無ければ報告しない", () => {
    const f = 仮のrepo();
    rmSync(join(f.deps, "_metadata.json"));

    expect(staleBundles(f.root, [f.bundle])).toEqual({ stale: [], 見た: 0, 見られなかった: 0 });
  });

  it("_metadata.json を読めなければ報告しない", () => {
    const f = 仮のrepo();
    writeFileSync(join(f.deps, "_metadata.json"), "{ not json");

    expect(staleBundles(f.root, [f.bundle])).toEqual({ stale: [], 見た: 0, 見られなかった: 0 });
  });

  it("optimized が空なら報告しない", () => {
    const f = 仮のrepo();
    writeFileSync(join(f.deps, "_metadata.json"), JSON.stringify({ optimized: {} }));

    expect(staleBundles(f.root, [f.bundle])).toEqual({ stale: [], 見た: 0, 見られなかった: 0 });
  });

  it("いまの実体 path を解決できない依存は飛ばして数える", () => {
    const f = 仮のrepo();
    rmSync(join(f.root, "apps", "screen", "node_modules", "@cardenelabs"), { recursive: true });

    expect(staleBundles(f.root, [f.bundle])).toEqual({ stale: [], 見た: 0, 見られなかった: 1 });
  });
});

describe("見る束ねの一覧 (#1636)", () => {
  it("1 つ以上ある (配線が空になっていない)", () => {
    expect(BUNDLES.length, "見る束ねが 0 件").toBeGreaterThan(0);
  });

  it("画面を出す app の束ねを見ている", () => {
    expect(BUNDLES.map((b) => b.dir)).toContain("apps/playground-spa/node_modules/.vite/deps");
  });
});
