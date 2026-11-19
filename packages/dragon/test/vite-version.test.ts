import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, it, expect } from "vitest";

/**
 * 遊び場の開発サーバーのViteが、重大な脆弱性を直した版より前に戻らないことを確かめる (#3754)。
 *
 * 勧告`GHSA-p4f5-76q4-ffq7`は、`--host`か`server.host`で外から届く形にした開発サーバーに当たり、6.4.6で直った。
 * 依存の脆弱性を見る命令 (`scripts/check-dependency-vulnerabilities.sh`) は6.4.5のlockでもこの勧告を出さなかったので、
 * lockと範囲の字を読んで版を見る。
 *
 * ## lockの字から版を拾う
 *
 * `vite@<版>`の形を全て拾う。
 * 前に`/`が付く`@tailwindcss/vite@<版>`はviteの版ではないので外し、`vitest@`と`@vitejs/plugin-react@`は形が違うので当たらない。
 */

const 直った版 = "6.4.6";

const lockpath = fileURLToPath(new URL("../../../pnpm-lock.yaml", import.meta.url));
const 遊び場のpackagepath = fileURLToPath(new URL("../../../apps/playground-spa/package.json", import.meta.url));

/** `x.y.z`を数の組にする。数で比べないと`6.10.0`が`6.4.6`より前に並ぶ */
function 版の数(版: string): [number, number, number] {
  const 当たり = /^(\d+)\.(\d+)\.(\d+)$/u.exec(版);
  if (当たり === null) throw new Error(`版の形で読めない: ${版}`);
  return [Number(当たり[1]), Number(当たり[2]), Number(当たり[3])];
}

/** `版`が`下限`と同じかそれより後か */
function 下限以上(版: string, 下限: string): boolean {
  const [a, b, c] = 版の数(版);
  const [x, y, z] = 版の数(下限);
  if (a !== x) return a > x;
  if (b !== y) return b > y;
  return c >= z;
}

/** lockの字に出るviteの版を、重ねずに返す */
function lockのviteの版(字: string): string[] {
  const 版 = new Set<string>();
  for (const 当たり of 字.matchAll(/(?<![\w/@.-])vite@(\d+\.\d+\.\d+)/gu)) {
    const 拾った版 = 当たり[1];
    if (拾った版 !== undefined) 版.add(拾った版);
  }
  return [...版];
}

describe("遊び場の開発サーバーのViteの版 (#3754)", () => {
  it("lock-has-no-vite-before-6-4-6", () => {
    const 版 = lockのviteの版(readFileSync(lockpath, "utf8"));
    // 1つも拾えない時は、字の形が変わって何も見ていない
    expect(版.length).toBeGreaterThan(0);
    expect(版.filter((v) => !下限以上(v, 直った版))).toEqual([]);
  });

  it("playground-vite-range-starts-at-6-4-6", () => {
    const pkg = JSON.parse(readFileSync(遊び場のpackagepath, "utf8")) as {
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
    };
    const 範囲 = pkg.devDependencies?.vite ?? pkg.dependencies?.vite;
    // `^x.y.z`か`~x.y.z`か`x.y.z`の形だけを受け、下限をそのまま読む
    const 当たり = /^[\^~]?(\d+\.\d+\.\d+)$/u.exec(範囲 ?? "");
    expect(当たり, `viteの範囲を下限の形で読めない: ${String(範囲)}`).not.toBeNull();
    const 下限 = 当たり?.[1] ?? "0.0.0";
    expect(下限以上(下限, 直った版), `viteの範囲の下限 ${下限} は ${直った版} より前`).toBe(true);
  });
});
