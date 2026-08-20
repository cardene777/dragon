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
 * ## 矢印は 2 つの検査で見る
 *
 * 最上位と箱は実装が集合を持つ (`TOP_LEVEL_KEYS` / `INLINE_ACTOR_KEYS`) のでそれと比べる。
 *
 * 矢印も `FLOW_INLINE_KEYS` と比べるが、**その集合は parser が読み取りに使う表から
 * 導いている** (`FLOW_INLINE_READERS`)。 集合を別に並べると parser と drift するため、
 * 実装が実際に回している表を唯一の出どころにした。
 *
 * 名前が一致しても値が届くとは限らないので、届くことも別に見る (実測で `sub` が 2 図種で
 * 届いていなかった)。
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { TOP_LEVEL_KEYS, INLINE_ACTOR_KEYS, FLOW_INLINE_KEYS } from "../src/v05/parser";
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

  // **印の内側の全データ行を見る** (Round 1 の指摘)。 想定の形に合う行だけ拾うと、
  // backtick を付け忘れた行が黙って一覧から漏れる = 検査を通ったまま実装とずれる
  //
  // **区切りの前後の空白は数を問わない** (Round 2 の指摘)。 markdown の表は空白の数が
  // 自由なので、1 個に決め打つと正しい書き方を落とす。 見るのは「2 列であること」 と
  // 「1 列目が `欄` の形であること」 の 2 点
  const 行 = md
    .slice(始, 終)
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.startsWith("|"))
    // 見出し行と区切り行は表の骨格なので飛ばす
    .filter((l) => !/^\|\s*欄\s*\|/.test(l) && !/^\|[\s:|-]+\|$/.test(l));

  /** 1 行を列に割る。 前後の `|` を外してから区切る */
  const 列 = (l: string): string[] =>
    l
      .replace(/^\|/, "")
      .replace(/\|$/, "")
      .split("|")
      .map((c) => c.trim());

  const 読めない = 行.filter((l) => {
    const c = 列(l);
    return c.length !== 2 || !/^`[^`]+`$/.test(c[0] ?? "") || (c[1] ?? "") === "";
  });
  if (読めない.length > 0) {
    throw new Error(`notation:${名} に読めない行がある (\`欄\` と説明の 2 列で書く): ${読めない.join(" / ")}`);
  }
  return 行.map((l) => /^`([^`]+)`$/.exec(列(l)[0] ?? "")![1]!);
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

  it("表の空白の数を問わない", () => {
    // markdown の表は空白の数が自由。 1 個に決め打つと正しい書き方を落とす
    const 読める = (行: string): boolean => {
      const c = 行
        .replace(/^\|/, "")
        .replace(/\|$/, "")
        .split("|")
        .map((x) => x.trim());
      return c.length === 2 && /^`[^`]+`$/.test(c[0] ?? "") && (c[1] ?? "") !== "";
    };
    expect(読める("|`a`|説明|"), "空白なしが読めない").toBe(true);
    expect(読める("|   `a`   |   説明   |"), "空白が多いと読めない").toBe(true);
    expect(読める("| a | 説明 |"), "backtick 無しを読めてしまう").toBe(false);
    expect(読める("| `a` |"), "1 列を読めてしまう").toBe(false);
    expect(読める("| `a` | 説明 | 余分 |"), "3 列を読めてしまう").toBe(false);
  });

  it("別名が実装に残っている", () => {
    // 別名を除いて比べているので、除いた名前が実装から消えたら宣言も外す
    for (const k of 別名) {
      expect(INLINE_ACTOR_KEYS.has(k), `別名 "${k}" が実装に無い。 宣言から外すこと`).toBe(true);
    }
  });

  it("矢印に書ける欄が実装と一致する", () => {
    // **両方向で見る** (Round 1 の指摘)。 届くかだけを見ると、実装に欄を足して README を
    // 直さない形が通ってしまう。 `FLOW_INLINE_KEYS` は parser が読み取りに使う表から
    // 導いているので、実装との drift が起きない
    const 書いた = 一覧("flow");
    expect(書いた.length, "README から 1 件も読み取れていない (検査が空振りしている)").toBeGreaterThan(0);
    expect([...書いた].sort()).toEqual([...FLOW_INLINE_KEYS].sort());
  });

  it("矢印に書ける欄が実際に届く", () => {
    // 名前が一致しても値が届くとは限らない。 上の検査は `FLOW_INLINE_KEYS` (parser が
    // 読み取りに回す表の鍵) と名前を比べるだけなので、届くことはここで別に見る
    // (実測で `sub` が 2 図種で届いていなかった)。
    //
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

  describe("補足は書いた値が勝ち、書かなければ見本の既定が残る (#1275)", () => {
    // `er` は多重度から補足を作る。 **書いた値で上書きする実装が、書いていない時まで
    // 上書きしていないか** を両側で見る
    const 関係 = (中括弧: string): string | undefined => {
      const r = parseTextDslV05(`title: "t"
type: er

actors:
  - User: { kind: storage }
  - Order: { kind: storage }

flow:
  - User -> Order: "places"${中括弧}
`);
      if (!r.ok) throw new Error(JSON.stringify(r.errors));
      const 矢印 = compileToCdl(r.doc).edges[0];
      expect(矢印, "矢印が出来ていない (検査が空振りしている)").toBeDefined();
      return 矢印?.sub;
    };

    it("書かなければ多重度から作った既定が残る", () => {
      expect(関係(' { cardinality: "1:N" }')).toBe("1:N");
    });

    it("書けば書いた値が勝つ", () => {
      expect(関係(' { cardinality: "1:N", sub: "補足" }')).toBe("補足");
    });
  });

  describe("箱の initial / final が実際に届く (#1275)", () => {
    // **README に載せた欄が効かなければ嘘になる** (Round 1 の指摘)。 実測すると
    // `initial:` / `final:` は 1 度も読まれておらず、位置だけで決まっていた
    // (中央の箱に `final: true` を書いても、最後に書いた箱が「最終」 になった)。
    const 小見出し = (actors: string, 動きあり = false): string => {
      const 段 = '\nanimation:\n  - step: "1" 0.9s\n    focus: [A]\n    body: "b"\n';
      const r = parseTextDslV05(`title: "t"
type: state

actors:
${actors}
flow:
  - A -> B: "go"
  - B -> C: "end"
${動きあり ? 段 : ""}`);
      if (!r.ok) throw new Error(JSON.stringify(r.errors));
      const 箱 = compileToCdl(r.doc).nodes;
      expect(箱.length, "箱が 1 つも無い (検査が空振りしている)").toBeGreaterThan(0);
      return 箱.map((n) => `${n.id}=${n.eyebrow ?? "(無)"}`).join(" ");
    };

    const 素 = "  - A: { kind: card }\n  - B: { kind: card }\n  - C: { kind: card }\n";

    it("書かなければ順序で決まる", () => {
      // 書かない記法の図を変えていないこと
      expect(小見出し(素)).toBe("a=初期 b=状態 c=最終");
    });

    it("中央に書いた initial が効く", () => {
      expect(小見出し("  - A: { kind: card }\n  - B: { kind: card, initial: true }\n  - C: { kind: card }\n")).toBe(
        "a=状態 b=初期 c=最終",
      );
    });

    it("中央に書いた final が効く", () => {
      expect(小見出し("  - A: { kind: card }\n  - B: { kind: card, final: true }\n  - C: { kind: card }\n")).toBe(
        "a=初期 b=最終 c=状態",
      );
    });

    it("段のある図でも書いた値が効く", () => {
      // 段の有無で組み立ての経路が分かれる。 片方だけ直すと、同じ記法で結果が割れる
      expect(小見出し("  - A: { kind: card }\n  - B: { kind: card, initial: true }\n  - C: { kind: card }\n", true)).toContain(
        "b=初期",
      );
    });
  });
});
