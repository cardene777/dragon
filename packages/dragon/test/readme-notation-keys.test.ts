/**
 * README の記法の一覧が実装と一致していること (#1275)。
 *
 * 記法の欄はどこにも書かれていなかった。 公開 doc にも skill にも `lane:` / `posW` /
 * `overlay` の記述が無く、記法を書く人は catalog の見本を読むしかなかった。
 *
 * 一覧を README に足したが、**手で書いた一覧は必ず実装とずれる**
 * (`rules/quality.md § 導出可能記述は人手で書かない`)。 実装から導いて突き合わせる。
 *
 * ## 2 方向で見る
 *
 * | 向き | 落ちる形 |
 * |---|---|
 * | 実装 → README | 実装に欄が増えて README を直していない |
 * | README → 実装 | README に実装に無い欄が書いてある |
 *
 * 片方だけだと、書き漏らしか余分かのどちらかを見逃す。
 *
 * ## 矢印の欄だけ確かめ方が違う
 *
 * 最上位と箱は実装が集合を持つ (`TOP_LEVEL_KEYS` / `INLINE_ACTOR_KEYS`) のでそれと比べる。
 * 矢印は集合を持たず、`parseFlowStep` が欄を 1 つずつ読む形なので、**実際に書いて矢印に
 * 届くか** を見る。 集合を新設して比べると、その集合自体が parser と drift する。
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { TOP_LEVEL_KEYS, INLINE_ACTOR_KEYS } from "../src/v05/parser";
import { parseTextDslV05 } from "../src/v05";
import { compileToCdl } from "../src/compile";

const README = join(dirname(fileURLToPath(import.meta.url)), "..", "README.md");

/**
 * README の印で囲まれた表から、1 列目の `` `名前` `` を取り出す。
 *
 * 印 (`<!-- notation:xxx:start -->`) で囲むのは、表の位置や前後の文を動かしても
 * 読み取りが壊れないようにするため。
 */
function 一覧(名: string): string[] {
  const md = readFileSync(README, "utf8");
  const 始 = md.indexOf(`<!-- notation:${名}:start -->`);
  const 終 = md.indexOf(`<!-- notation:${名}:end -->`);
  if (始 < 0 || 終 <= 始) throw new Error(`README に notation:${名} の印が無い`);
  return [...md.slice(始, 終).matchAll(/^\| `([^`]+)` \|/gm)].map((m) => m[1]!);
}

/** `scale` の別名。 同じ欄を 2 行に分けて書かず、説明の中で触れる */
const 別名 = new Set(["倍率"]);

describe("README の記法の一覧が実装と一致する (#1275)", () => {
  it("最上位のブロック", () => {
    const 書いた = 一覧("top-level");
    expect(書いた.length, "README から 1 件も読み取れていない (検査が空振りしている)").toBeGreaterThan(0);
    expect([...書いた].sort()).toEqual([...TOP_LEVEL_KEYS].sort());
  });

  it("箱に書ける欄", () => {
    const 書いた = 一覧("actor");
    expect(書いた.length, "README から 1 件も読み取れていない (検査が空振りしている)").toBeGreaterThan(0);
    const 実装 = [...INLINE_ACTOR_KEYS].filter((k) => !別名.has(k));
    expect([...書いた].sort()).toEqual(実装.sort());
  });

  it("別名が実装に残っている", () => {
    // 別名を除いて比べているので、除いた名前が実装から消えたら宣言も外す
    for (const k of 別名) {
      expect(INLINE_ACTOR_KEYS.has(k), `別名 "${k}" が実装に無い。 宣言から外すこと`).toBe(true);
    }
  });

  it("矢印に書ける欄が実際に届く", () => {
    // 矢印は実装が集合を持たないため、書いて届くかで見る。
    // **1 つずつ書く** = まとめて書くと、1 つが落ちても他が届いていれば気付けない
    const 書いた = 一覧("flow");
    expect(書いた.length, "README から 1 件も読み取れていない (検査が空振りしている)").toBeGreaterThan(0);

    /** 欄ごとの試す値。 README に欄を足したらここにも足す (足さないと下の検査が落ちる) */
    const 試す値: Record<string, { 書く: string; 期待: unknown }> = {
      sub: { 書く: '"補足"', 期待: "補足" },
      guard: { 書く: '"g"', 期待: "g" },
      cardinality: { 書く: '"1:N"', 期待: "1:N" },
      labelOffsetX: { 書く: "3", 期待: 3 },
      labelOffsetY: { 書く: "-8", 期待: -8 },
      overlay: { 書く: "true", 期待: true },
    };

    const 値が無い欄 = 書いた.filter((k) => !(k in 試す値));
    expect(値が無い欄, "README に足した欄の試す値が無い").toEqual([]);

    for (const 欄 of 書いた) {
      const v = 試す値[欄]!;
      const r = parseTextDslV05(`title: "t"
type: flow

actors:
  - A: { kind: card }
  - B: { kind: card }

flow:
  - A -> B: "x" { ${欄}: ${v.書く} }
`);
      if (!r.ok) throw new Error(`${欄} を書いた記法が読めない: ${JSON.stringify(r.errors)}`);
      const 矢印 = compileToCdl(r.doc).edges[0];
      expect(矢印, `${欄} を書いた記法で矢印が出来ない (検査が空振りしている)`).toBeDefined();
      expect((矢印 as unknown as Record<string, unknown>)[欄], `${欄} が矢印に届いていない`).toBe(
        v.期待,
      );
    }
  });
});
