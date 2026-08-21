/**
 * ホームに出す記法が、いまの記法として通ることの検証 (#1310)。
 *
 * かつては 1 行ずつ手で `<span>` を貼っていたため parser を通っておらず、
 * **記法として通らない本文がトップページに出ていた** (実測で 6 件の誤り)。
 *
 * | 行 | 中身 | 誤り |
 * |---|---|---|
 * | `animate:` 以下 5 行 | 最上位に無い項目 (正しくは `animation:`) | `unknown top-level key` |
 * | `row (1)` | 丸括弧が色名として読まれる | `色名か線種が読めません: "1"` |
 *
 * 分解器に寄せた以上、本文は色が付いて権威づけられる。 通ることを機械で固定する。
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { parseTextDslV05, compileToCdl } from "@cardenelabs/dragon";

/** 画面が使う本文をそのまま取り出す (写しを持たない) */
function ヒーローの記法(): string {
  const src = readFileSync(fileURLToPath(new URL("./HomePage.tsx", import.meta.url)), "utf8");
  const m = src.match(/const DEMO_SRC = `([\s\S]*?)`;/);
  expect(m, "HomePage から DEMO_SRC を取り出せない (検査が空振りしている)").toBeTruthy();
  return m![1]!;
}

describe("ホームの記法がいまの記法として通る (#1310)", () => {
  it("本文を取り出せている", () => {
    const src = ヒーローの記法();
    expect(src.length, "本文が空 (検査が空振りしている)").toBeGreaterThan(50);
    expect(src, "最上位の項目が無い").toContain("title:");
  });

  it("誤り 0 件で読める", () => {
    const r = parseTextDslV05(ヒーローの記法());
    expect(
      r.ok,
      r.ok ? "" : r.errors.map((e) => `L${e.line}: ${e.message}`).join(" / "),
    ).toBe(true);
  });

  it("図として組み立つ (箱と矢印と段がある)", () => {
    // 読めるだけでなく、絵になることまで見る = 空の図を出しても上の検査は通る
    const r = parseTextDslV05(ヒーローの記法());
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const d = compileToCdl(r.doc);
    expect(d.nodes.length, "箱が 1 つも無い").toBeGreaterThan(0);
    expect(d.edges.length, "矢印が 1 本も無い").toBeGreaterThan(0);
    expect(d.phases.length, "段が 1 つも無い").toBeGreaterThan(0);
  });

  it("光らせる行が本文の行数の内側にある", () => {
    const src = readFileSync(fileURLToPath(new URL("./HomePage.tsx", import.meta.url)), "utf8");
    const m = src.match(/const DEMO_HIGHLIGHT_LINE = (\d+);/);
    expect(m, "DEMO_HIGHLIGHT_LINE を取り出せない").toBeTruthy();
    const 行数 = ヒーローの記法().replace(/\n$/, "").split("\n").length;
    const 光る行 = Number(m![1]);
    expect(光る行).toBeGreaterThanOrEqual(1);
    expect(光る行, `本文は ${行数} 行しかない`).toBeLessThanOrEqual(行数);
  });
});
