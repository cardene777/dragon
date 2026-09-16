import { readFileSync } from "node:fs";
import { join } from "node:path";

import { afterEach, describe, expect, it, vi } from "vitest";

import { BUNDLES } from "../../../../test-support/dep-bundle-freshness";
import { DEV_PORT, DEV_URL, PREVIEW_PORT } from "../../ports";

/**
 * 開発 server の束が古い時の直し方が、port が埋まっていても辿れる手順を持つこと (#2052)。
 *
 * ## 何が起きたか
 *
 * 直し方は「開発 server を止めて `pnpm dev` で起動し直す」 だけだった。 開発 server の port を
 * 別の作業が使っていると起動し直せず、#2044 から #2050 までの 4 回の e2e 全件で、束の関門が落ちて
 * 開発 server の検査 3 件が走らないまま残った。
 *
 * 実際には、空いている port で開発 server を立てると起動時に束を作り直し、`dev` project の
 * 見に行く先を環境変数で向ければ 4 件とも通った。 その手順が直し方に無かった。
 *
 * ## 何を固定するか
 *
 * 直し方に書いた環境変数と script を、実物と突き合わせる。 文だけを足すと、名前を取り違えても
 * (`SPA_URL` は `dev` project に届かない) 誰も気付かない。
 */

const ROOT = join(import.meta.dirname, "..", "..", "..", "..");
const 画面の束 = "apps/playground-spa/node_modules/.vite/deps";

function 直し方(): string {
  const 束 = BUNDLES.find((b) => b.dir === 画面の束);
  expect(束, `${画面の束} を見る束が BUNDLES に無い (検査が空振りしている)`).toBeDefined();
  return 束?.hint ?? "";
}

/** 直し方が向け先の差し替えに使う環境変数の名前。 `名前=http://localhost:` の形から拾う。 */
function 直し方の環境変数(): string[] {
  return [...直し方().matchAll(/`([A-Z][A-Z0-9_]*)=http:\/\/localhost:/gu)].map((m) => m[1] ?? "");
}

/** 環境変数を立てて `playwright.config.ts` を読み直し、`dev` project の見に行く先を返す。 */
async function devの見に行く先(env: Record<string, string>): Promise<string | undefined> {
  for (const [k, v] of Object.entries(env)) vi.stubEnv(k, v);
  vi.resetModules();
  const mod = await import("../../playwright.config");
  return mod.default.projects?.find((p) => p.name === "dev")?.use?.baseURL;
}

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("束が古い時の直し方 (#2052)", () => {
  it("port を別の作業が使っている時の手順を持つ", () => {
    const 文 = 直し方();
    // 今までの手順も残す。 port が空いているならこちらで足りる。
    expect(文).toContain("`pnpm dev` で起動し直す");
    expect(文).toContain("--port");
    expect(直し方の環境変数(), "向け先を差し替える環境変数が直し方に無い").toHaveLength(1);
  });

  it("直し方の環境変数を立てると、`dev` project がそこを見る", async () => {
    const [名前] = 直し方の環境変数();
    expect(名前, "直し方から環境変数を拾えていない (検査が空振りしている)").toBeDefined();
    const 先 = "http://localhost:1";
    expect(await devの見に行く先({ [名前 ?? ""]: 先 })).toBe(先);
  });

  it("何も立てなければ、`dev` project は既定の開発 server を見る", async () => {
    // 陰性対照。 既定でも同じ値になるなら、上の検査は環境変数を測っていない。
    expect(await devの見に行く先({})).toBe(DEV_URL);
  });

  it("build 済を見る側の差し替え (`SPA_URL`) は `dev` project に届かない", async () => {
    // `CONTRIBUTING.md` が以前この名前で開発 server へ向けると書いていた。 取り違えると、
    // 立て直した server ではなく元の port を見続ける。
    expect(await devの見に行く先({ SPA_URL: "http://localhost:1" })).toBe(DEV_URL);
  });

  it("直し方の `pnpm` の script が実在する", () => {
    const 呼ぶ = [...直し方().matchAll(/`pnpm -C (\S+) ([a-z][a-z0-9:._-]*)/gu)];
    expect(呼ぶ.length, "直し方から `pnpm -C` の形を拾えていない (検査が空振りしている)").toBeGreaterThan(0);
    for (const [, 場所 = "", script = ""] of 呼ぶ) {
      const pkg = JSON.parse(readFileSync(join(ROOT, 場所, "package.json"), "utf8")) as {
        scripts?: Record<string, string>;
      };
      expect(Object.keys(pkg.scripts ?? {}), `${場所} に ${script} が無い`).toContain(script);
    }
  });

  it("port の数字を持たない", () => {
    // 数字は `ports.ts` だけが持つ (#1326)。 直し方に書くと、port を変えた時に古い数字が残る。
    const 文 = 直し方();
    expect(文).not.toMatch(new RegExp(`\\b(${DEV_PORT}|${PREVIEW_PORT})\\b`, "u"));
  });
});
