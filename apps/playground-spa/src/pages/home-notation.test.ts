/**
 * ホームに出す記法が、いまの記法として通ることの検証 (#1310)。
 *
 * かつては 1 行ずつ手で `<span>` を貼っていたため parser を通っておらず、
 * **記法として通らない本文がトップページに出ていた** (実測で 6 件の誤り)。
 *
 * | 行 | 中身 | 誤り |
 * |---|---|---|
 * | `animate:` 以下 5 行 | 最上位に無い項目 (正しくは `animation:`) | `最上位の項目名が読めません` |
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

  it("図として組み立つ (板と言づてと段がある)", () => {
    // 読めるだけでなく、絵になることまで見る = 空の図を出しても上の検査は通る。
    // 順序図は 1 枚の板で描くので、言づては矢印ではなく板の中の行になる (#1466)
    const r = parseTextDslV05(ヒーローの記法());
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const d = compileToCdl(r.doc);
    const 板 = d.nodes.find((n) => n.kind === "sequence-board");
    expect(板, "板が無い").toBeDefined();
    expect(板!.sequenceData?.messages.length, "言づてが 1 つも無い").toBeGreaterThan(0);
    expect(d.phases.length, "段が 1 つも無い").toBeGreaterThan(0);
  });

  it("書いた項目が全て効く (効かない指定を見本に残さない)", () => {
    const r = parseTextDslV05(ヒーローの記法());
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const 出た: string[] = [];
    compileToCdl(r.doc, { onNotice: (n) => 出た.push(`${n.kind}: ${n.message}`) });
    expect(出た, "画面の見本に効かない指定がある").toEqual([]);
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
