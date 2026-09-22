/**
 * ホームに出す記法が、いまの記法として通ることの検証 (#1310 / #2455)。
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
 *
 * **2 言語とも見る** (#2455)。 英語の本文だけが記法として通らない形になっても、日本語の側しか
 * 見ていなければ緑のまま通る。 取り出せた本数も出して、片方を取りこぼした run を見分ける。
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { parseTextDslV05, compileToCdl } from "@cardenelabs/dragon";

function 画面のsrc(): string {
  return readFileSync(fileURLToPath(new URL("./HomePage.tsx", import.meta.url)), "utf8");
}

/** 画面が使う本文を言語ごとにそのまま取り出す (写しを持たない) */
export function ヒーローの記法(src: string): Record<string, string> {
  const 塊 = src.match(/const DEMO_SRC = \{([\s\S]*?)\n\} as const;/);
  if (塊 === null) return {};
  return Object.fromEntries(
    [...塊[1]!.matchAll(/^\s{2}(\w+): `([\s\S]*?)`,$/gm)].map((m) => [m[1]!, m[2]!]),
  );
}

const 記法 = ヒーローの記法(画面のsrc());
const 言語 = Object.keys(記法);

describe("ホームの記法がいまの記法として通る (#1310)", () => {
  it("2 言語とも本文を取り出せている", () => {
    console.log(`[ヒーローの記法] 取り出した言語=${言語.join(",") || "なし"}`);
    expect(言語.sort(), "言語ごとの本文を取り出せない (検査が空振りしている)").toEqual(["en", "ja"]);
    for (const [名, src] of Object.entries(記法)) {
      expect(src.length, `${名} の本文が空 (検査が空振りしている)`).toBeGreaterThan(50);
      expect(src, `${名} に最上位の項目が無い`).toContain("title:");
    }
  });

  it("本文の取り出しが何にも当たらない形を見分ける (植え込み対照)", () => {
    // 取り出しが壊れると下の検査が 0 本を回して緑になる
    expect(ヒーローの記法("const DEMO_SRC = {\n  ja: `title: a`,\n} as const;")).toEqual({
      ja: "title: a",
    });
    expect(ヒーローの記法("const 別のもの = 1;")).toEqual({});
  });

  for (const 名 of ["ja", "en"]) {
    it(`${名} が誤り 0 件で読める`, () => {
      const src = 記法[名];
      expect(src, `${名} の本文が無い`).toBeDefined();
      const r = parseTextDslV05(src!);
      expect(
        r.ok,
        r.ok ? "" : r.errors.map((e) => `L${e.line}: ${e.message}`).join(" / "),
      ).toBe(true);
    });

    it(`${名} が図として組み立つ (板と言づてと段がある)`, () => {
      // 読めるだけでなく、絵になることまで見る = 空の図を出しても上の検査は通る。
      // 順序図は 1 枚の板で描くので、言づては矢印ではなく板の中の行になる (#1466)
      const r = parseTextDslV05(記法[名]!);
      expect(r.ok).toBe(true);
      if (!r.ok) return;
      const d = compileToCdl(r.doc);
      const 板 = d.nodes.find((n) => n.kind === "sequence-board");
      expect(板, "板が無い").toBeDefined();
      expect(板!.sequenceData?.messages.length, "言づてが 1 つも無い").toBeGreaterThan(0);
      expect(d.phases.length, "段が 1 つも無い").toBeGreaterThan(0);
    });

    it(`${名} の書いた項目が全て効く (効かない指定を見本に残さない)`, () => {
      const r = parseTextDslV05(記法[名]!);
      expect(r.ok).toBe(true);
      if (!r.ok) return;
      const 出た: string[] = [];
      compileToCdl(r.doc, { onNotice: (n) => 出た.push(`${n.kind}: ${n.message}`) });
      expect(出た, "画面の見本に効かない指定がある").toEqual([]);
    });
  }

  it("光らせる行が 2 言語とも本文の行数の内側にある", () => {
    // 光らせる行は 1 つを 2 言語で共有するので、行の並びが揃っていないと別の行が光る
    const m = 画面のsrc().match(/const DEMO_HIGHLIGHT_LINE = (\d+);/);
    expect(m, "DEMO_HIGHLIGHT_LINE を取り出せない").toBeTruthy();
    const 光る行 = Number(m![1]);
    expect(光る行).toBeGreaterThanOrEqual(1);
    for (const [名, src] of Object.entries(記法)) {
      const 行数 = src.replace(/\n$/, "").split("\n").length;
      expect(光る行, `${名} の本文は ${行数} 行しかない`).toBeLessThanOrEqual(行数);
    }
  });

  it("2 言語の行数が揃っている", () => {
    const 行数 = Object.fromEntries(
      Object.entries(記法).map(([名, src]) => [名, src.replace(/\n$/, "").split("\n").length]),
    );
    const 値 = Object.values(行数);
    expect(値.length, "本文を 1 本も取り出せていない").toBeGreaterThan(1);
    expect(new Set(値).size, `行数が揃っていない: ${JSON.stringify(行数)}`).toBe(1);
  });
});
