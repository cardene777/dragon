/**
 * 字幅の見積りの検査 (#1678)。
 *
 * 重なりを数える検査が使う見積りで、**狭い側に外すと 0 件を期待する検査が偽の合格になる**。
 * 階級ごとの比が実物以上であることと、見積りを 2 か所に持たないことを見る。
 */
import { describe, it, expect } from "vitest";
import { readdirSync, readFileSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { 字幅 } from "./text-width-estimate";

const ここ = dirname(fileURLToPath(import.meta.url));

describe("字幅の見積り (#1678)", () => {
  it("階級ごとに違う比を返す", () => {
    // 広い > その他の ASCII > 細い。 同じ比で潰すと最悪幅を抑えられない
    const 級 = 100;
    expect(字幅("W", 級)).toBeGreaterThan(字幅("a", 級));
    expect(字幅("a", 級)).toBeGreaterThan(字幅("i", 級));
  });

  it("ASCII の外は最大の比で見る", () => {
    // 分類しない = 抜けようがない。 和文の実測 1.000 に対し 1.04 で安全側
    expect(字幅("あ", 100)).toBeCloseTo(字幅("W", 100), 6);
  });

  it("半角の比が描画側の実測を下回らない", () => {
    // 0.55 で見ていたのが元の不具合。 実測は 0.86 で、狭い見積りは重なりを見落とす
    expect(字幅("a", 100)).toBeGreaterThanOrEqual(86);
  });

  it("実際に重なる 2 つの字を、重なりとして測れる", () => {
    // 狭い見積り (半角 0.55) では、この 2 つは離れて見えて重なりを見落とす。
    // 描画側の実測 (0.86) なら 15.9 ぶん重なる
    const 級 = 13;
    const 文 = "ABCDE";
    const 左 = { x0: 0, x1: 字幅(文, 級) };
    const 右 = { x0: 40, x1: 40 + 字幅(文, 級) };
    const 重なり = Math.min(左.x1, 右.x1) - Math.max(左.x0, 右.x0);
    expect(重なり, `重なりを見落としている: ${重なり.toFixed(1)}`).toBeGreaterThan(0);
    // 0.55 で見た場合の幅 (35.75) では重ならない = この検査が識別している差
    expect(5 * 0.55 * 級).toBeLessThan(40);
  });

  it("級に比例し、空の文字は 0", () => {
    expect(字幅("abc", 20)).toBeCloseTo(字幅("abc", 10) * 2, 6);
    expect(字幅("", 100)).toBe(0);
  });

  it("見積りを自前で持つ検査が残っていない", () => {
    // 2 か所に持つと片方だけ直って drift する。 実物を走査して数える
    const 見つけ方 = /const\s+字幅\s*=|function\s+字幅\s*\(/;
    const 対象 = readdirSync(ここ).filter((f) => f.endsWith(".test.ts") || f.endsWith(".test.tsx"));
    expect(対象.length, "検査 file を 1 つも読めていない (検査が空振りしている)").toBeGreaterThan(0);
    const 持っている = 対象.filter((f) => 見つけ方.test(readFileSync(join(ここ, f), "utf8")));
    expect(持っている).toEqual([]);
  });

  it("走査が、置いた自前の見積りを見つける", () => {
    // 植え込み対照。 上の検査は 0 件を期待するので、探し方が何も見つけないだけでも通る
    const 見つけ方 = /const\s+字幅\s*=|function\s+字幅\s*\(/;
    const 仮 = mkdtempSync(join(tmpdir(), "text-width-"));
    // 自前の定義は組み立てて書く = この file 自身が走査に引っかからないようにする
    const 自前の定義 = ["const", "字幅", "= (s: string) => s.length;"].join(" ");
    writeFileSync(join(仮, "a.test.ts"), `${自前の定義}\n`);
    writeFileSync(join(仮, "b.test.ts"), "import { 字幅 } from './text-width-estimate';\n");
    const 対象 = readdirSync(仮).filter((f) => f.endsWith(".test.ts"));
    const 持っている = 対象.filter((f) => 見つけ方.test(readFileSync(join(仮, f), "utf8")));
    expect(持っている).toEqual(["a.test.ts"]);
  });
});
