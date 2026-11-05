import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, it, expect } from "vitest";

/**
 * 一式を同時に動かす数を、設定の字から読んで確かめる (#3268)。
 *
 * 待ち時間の下限 (#2087) は、待ち時間の上限 (`test-limits.test.ts`、#3381) に置き換えた。
 *
 * ## 設定を import せず、字を読む
 *
 * `import config from "../../../vitest.config"` の形は採れない。 import すると設定 file が
 * 検査の型検査 (`tsconfig.test.json`) の対象に入る (#2089)。
 * 字を読む形なら、設定 file の他の指定がどうであれ同時に動かす数だけを見られる。
 */

const 設定path = fileURLToPath(new URL("../../../vitest.config.ts", import.meta.url));
const 設定の字 = readFileSync(設定path, "utf8");

/**
 * 設定の字から数の指定を読む。
 * 数の区切り (`30_000`) と区切り無し (`30000`) の両方を受ける。
 * 書かれていなければ `undefined` を返す (0 に潰さない)。
 */
function 数を読む(字: string, 名: string): number | undefined {
  const 当たり = new RegExp(`\\b${名}\\s*:\\s*([0-9_]+)`, "u").exec(字);
  const 桁 = 当たり?.[1];
  if (桁 === undefined) return undefined;
  const 数 = Number(桁.replace(/_/gu, ""));
  return Number.isFinite(数) ? 数 : undefined;
}

/**
 * 同時に動かす数の上限 (#3268)。 既定の数より 4 のほうが一式が短かった。
 * 待ち時間と逆向きに上限で見るのは、減らす向きの変更を止めないため
 */
const 同時の上限 = 4;

/** 同時に動かす数として受け付ける値か */
function 同時の上限を満たす(値: unknown): boolean {
  return typeof 値 === "number" && Number.isInteger(値) && 値 >= 1 && 値 <= 同時の上限;
}

describe("一式を同時に動かす数を留める (#3268)", () => {
  it("max-workers-within-limit", () => {
    const 値 = 数を読む(設定の字, "maxWorkers");
    expect(同時の上限を満たす(値), `同時に動かす数が ${同時の上限} を超えるか書かれていない (実際: ${String(値)})`).toBe(true);
  });

  it("max-workers-check-rejects-unset-and-larger", () => {
    // 何でも通す判定だと、設定から消えても通ってしまう
    expect(同時の上限を満たす(数を読む("globals: false,", "maxWorkers")), "書かれていない状態を通している").toBe(false);
    expect(同時の上限を満たす(数を読む("maxWorkers: 11,", "maxWorkers")), "上限を超える数を通している").toBe(false);
    expect(同時の上限を満たす(数を読む("maxWorkers: 2,", "maxWorkers")), "減らす向きの値を落としている").toBe(true);
  });
});
