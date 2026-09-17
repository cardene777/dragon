import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, it, expect } from "vitest";

/**
 * 一式の待ち時間が既定より長いことの検証 (#2087)。
 *
 * 既定は検査 5 秒 / 前後処理 10 秒。 400 file 超を並列で回すこの一式では、機械が混むと重い検査が
 * その範囲に収まらず、中身が正しいのに落ちる。 実測では同じ commit の 3 回の全件実行で落ちた
 * 検査が 8 件 → 5 件 → 0 件と変わり、落ちた組も毎回違い、どれも単独では通った。
 *
 * ## 下限を持つ
 *
 * 設定から待ち時間が消える / 既定へ戻ると、同じ揺れがそのまま戻る。 値そのものではなく
 * **下限** を見るのは、長くする向きの変更を止めないため。
 *
 * ## 設定を import せず、字を読む
 *
 * `import config from "../../../vitest.config"` の形は採れない。 import すると設定 file が
 * 検査の型検査 (`tsconfig.test.json`) の対象に入り、待ち時間と無関係な指定
 * (`environmentMatchGlobs`、今の vitest には無い) の型の誤りでこの検査が型検査を落とす (#2089)。
 * 字を読む形なら、設定 file の他の指定がどうであれ待ち時間だけを見られる。
 */

const 設定path = fileURLToPath(new URL("../../../vitest.config.ts", import.meta.url));
const 設定の字 = readFileSync(設定path, "utf8");

/** 待ち時間の下限 (ミリ秒)。 落ちなかった回の最も遅い検査 8.7 秒の 3 倍強 */
const 下限 = 30_000;

/**
 * 設定の字から待ち時間を読む。
 * 数の区切り (`30_000`) と区切り無し (`30000`) の両方を受ける。
 * 書かれていなければ `undefined` を返す (0 に潰さない)。
 */
function 待ち時間を読む(字: string, 名: string): number | undefined {
  const 当たり = new RegExp(`\\b${名}\\s*:\\s*([0-9_]+)`, "u").exec(字);
  const 桁 = 当たり?.[1];
  if (桁 === undefined) return undefined;
  const 数 = Number(桁.replace(/_/gu, ""));
  return Number.isFinite(数) ? 数 : undefined;
}

/** 待ち時間として受け付ける値か */
function 下限を満たす(値: unknown): boolean {
  return typeof 値 === "number" && Number.isFinite(値) && 値 >= 下限;
}

describe("一式の待ち時間が既定より長い (#2087)", () => {
  it("設定を読めている", () => {
    // 読めていなければ、以下の検査は通って当然になる
    expect(設定の字.length, "vitest の設定が空").toBeGreaterThan(0);
    expect(設定の字, "vitest の設定ではない file を読んでいる").toContain("defineConfig");
  });

  it("検査の待ち時間が下限以上", () => {
    const 値 = 待ち時間を読む(設定の字, "testTimeout");
    expect(
      下限を満たす(値),
      `検査の待ち時間が ${下限} ミリ秒未満 (実際: ${String(値)})`,
    ).toBe(true);
  });

  it("前後処理の待ち時間が下限以上", () => {
    const 値 = 待ち時間を読む(設定の字, "hookTimeout");
    expect(
      下限を満たす(値),
      `前後処理の待ち時間が ${下限} ミリ秒未満 (実際: ${String(値)})`,
    ).toBe(true);
  });

  it("既定の値と、書かれていない状態を落とせる (植え込み対照)", () => {
    // 何でも通す判定だと、設定から消えても通ってしまう
    expect(下限を満たす(待ち時間を読む("testTimeout: 5_000,", "testTimeout")), "既定の検査の待ち時間を通している").toBe(false);
    expect(下限を満たす(待ち時間を読む("hookTimeout: 10000,", "hookTimeout")), "既定の前後処理の待ち時間を通している").toBe(false);
    expect(下限を満たす(待ち時間を読む("globals: false,", "testTimeout")), "書かれていない状態を通している").toBe(false);
    expect(下限を満たす("30000"), "数でない値を通している").toBe(false);
  });

  it("長くする向きの値と、区切りの書き方の違いを通す (陰性対照)", () => {
    // 下限ではなく一致で見ていると、長くする変更まで落ちる
    expect(下限を満たす(待ち時間を読む("testTimeout: 30_000,", "testTimeout")), "下限ちょうどを落としている").toBe(true);
    expect(下限を満たす(待ち時間を読む("testTimeout: 60000,", "testTimeout")), "区切りの無い書き方を落としている").toBe(true);
  });
});
