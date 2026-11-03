/**
 * 作り直す前と同じ図を描く (#3345)。
 *
 * 部品をブロックの置き場へ移す作り直しは、描いた SVG と置き場所と時刻を1字も変えずに行う。
 * `scripts/snapshot-examples.mjs` が作り直す前の dist で取った指紋 (`fixtures/examples-svg.json`) と、
 * 今の dist で同じ関数が取った指紋を突き合わせる。
 * 食い違った時は、作り直す前の版 (印 `v0.47.0`) の dist で同じ見本を描いて見比べる。
 */
import { readFileSync } from "node:fs";
import * as dragon from "@cardenelabs/dragon";
import { describe, expect, it } from "vitest";
import { fingerprints, OUT } from "../scripts/snapshot-examples.mjs";

const before = JSON.parse(readFileSync(OUT, "utf8")) as Record<string, string>;
const now = fingerprints(dragon) as Record<string, string>;

/** 鍵の末尾が `kinds` の物だけを比べ、食い違った鍵を返す */
function changed(kinds: string[]): string[] {
  const keys = new Set([...Object.keys(before), ...Object.keys(now)]);
  return [...keys].filter((key) => kinds.includes(key.split("|").at(-1) ?? "") && before[key] !== now[key]).sort();
}

describe("作り直す前と同じ図 (#3345)", () => {
  it("examples-svg-unchanged", () => {
    // 見本、検査の記法、見本帳の部品の図を3通りの描き方で描き、SVG と置き場所と時刻が作り直す前と同じ
    expect(Object.keys(before).length, "作り直す前の指紋が少なすぎる").toBeGreaterThan(2000);
    expect(changed(["svg", "layout", "timeline"]), "作り直す前と描いた結果が違う見本").toEqual([]);
  });

  it("parsed-json-key-order-unchanged", () => {
    // 図の id は読んだ原本の JSON の字の並びから作るので、読む処理が出す鍵の順も変えない
    expect(changed(["json"]), "読んだ原本の JSON の字の並びが作り直す前と違う記法").toEqual([]);
  });
});
