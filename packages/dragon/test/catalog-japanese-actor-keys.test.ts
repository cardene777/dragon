import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it, expect } from "vitest";
import { ACTOR_ITEM_KEYS, parseTextDslV05 } from "../src/v05/parser";
import { compileToCdl } from "../src/compile";
import * as TextDsl from "../../../apps/playground-spa/src/topics/catalog/text-dsl.cdl";

/**
 * 箱の項目名を日本語で書いた見本がカタログにあることを見る (#2332)。
 *
 * 記法は箱の項目名を日本語でも読む (#1026 / #1301) のに、**カタログには 1 枚も見本が
 * 無かった** (実測 = 記法 570 件 17303 行を走査して、日本語の項目名は `位置` の 7 件だけ)。
 * 記法を学ぶ場はカタログしかないので、書ける形が見えないまま残っていた。
 *
 * **一覧は実装から導く**。 日本語で書ける項目は `ACTOR_ITEM_KEYS` が持つので、そこから
 * ASCII でない名前を取り出す。 手で並べると、別名を足した日に見本の無い項目が素通りする。
 */

const ここ = dirname(fileURLToPath(import.meta.url));
const 群dir = join(ここ, "..", "..", "..", "apps", "playground-spa", "src", "topics", "catalog");

/** その名前が ASCII だけで書けるか。 文字の番号で見る (逃がし字を書くと NUL byte になる) */
const ASCIIだけ = (s: string): boolean => [...s].every((c) => (c.codePointAt(0) ?? 0) < 128);

/** 日本語で書ける箱の項目名。 実装 (`ACTOR_ITEM_KEYS`) から導く */
const 日本語の項目 = [...ACTOR_ITEM_KEYS].filter((k) => !ASCIIだけ(k));

/**
 * カタログの記法 (`sourceYaml__*` の中身) を全群から集める。
 *
 * 図そのものではなく **書いた記法** を見る = 図は英語の項目名で書いても同じ形になるので、
 * 「日本語で書ける」 ことを図の側からは確かめられない。
 */
function カタログの記法(): { 本文: string[]; 行数: number; 群: number } {
  const files = readdirSync(群dir).filter((f) => f.endsWith(".cdl.ts"));
  const 本文: string[] = [];
  for (const f of files) {
    const src = readFileSync(join(群dir, f), "utf8");
    for (const m of src.matchAll(/export const sourceYaml__[^\s=]+ = `([\s\S]*?)`;/g)) {
      本文.push(m[1]!);
    }
  }
  return { 本文, 行数: 本文.reduce((n, s) => n + s.split("\n").length, 0), 群: files.length };
}

/**
 * その項目名が項目として書かれている回数。
 *
 * **直前の字を見る**。 単に `値:` を探すと `前の値:` にも当たり、別の項目を数えたことになる
 * (行頭 / 空白 / 中括弧の中 の 3 通りだけを項目の位置とみなす)。
 */
function 項目として出る回数(本文: readonly string[], key: string): number {
  const re = new RegExp(`(^|[\\s{,])${key}\\s*:`, "gmu");
  return 本文.reduce((n, s) => n + [...s.matchAll(re)].length, 0);
}

/**
 * カタログの記法に出ていない項目と、その理由 (#2332)。
 *
 * 両方向で突き合わせる。 出ていないのに宣言が無ければ落ち、宣言に在るのに出ていれば
 * 落ちる = 見本を足して直した後に宣言だけが残ることを防ぐ。
 */
const 見本に出さない項目: Record<string, string> = {
  倍率:
    "部品の箱 (`kind` に部品の名前を書いた箱) にだけ効く (#1026)。" +
    " 普通の箱に書くと綴りの誤りとして知らせる (#2330) ので、記法の頁の見本には置けない",
};

describe("箱の項目名を日本語で書いた見本がカタログにある (#2332)", () => {
  it("日本語で書ける項目を実装から導けている", () => {
    // 導けていないと以下の検査は通って当然になる
    expect(
      日本語の項目.length,
      `日本語の項目を 1 件も導けていない (語彙 ${ACTOR_ITEM_KEYS.size} 件を走査)`,
    ).toBeGreaterThan(0);
  });

  it("走査した記法の件数と行数を出す (空振り防止)", () => {
    const { 本文, 行数, 群 } = カタログの記法();
    expect(群, "群を 1 つも読めていない").toBeGreaterThan(0);
    expect(本文.length, `記法を 1 件も集められていない (群 ${群} file を走査)`).toBeGreaterThan(0);
    expect(行数, `記法の行を 1 行も読めていない (記法 ${本文.length} 件)`).toBeGreaterThan(0);
  });

  it("日本語で書ける項目が、カタログの記法に 1 回以上出る", () => {
    const { 本文, 行数 } = カタログの記法();
    const 出ない = 日本語の項目.filter((k) => 項目として出る回数(本文, k) === 0);
    expect(
      出ない.sort(),
      `記法 ${本文.length} 件 ${行数} 行を走査。 見本の無い項目は理由つきで` +
        " `見本に出さない項目` に載せる",
    ).toEqual(Object.keys(見本に出さない項目).sort());
  });

  it("出さないと決めた項目が理由を持つ", () => {
    for (const [項目, 理由] of Object.entries(見本に出さない項目)) {
      expect(理由.length, `${項目} の理由が空`).toBeGreaterThan(0);
    }
  });

  it("出さないと決めた項目が、実際にどの記法にも出ていない", () => {
    // 見本を足して直した後に宣言だけが残ると、次に消えた時に気付けない
    const { 本文 } = カタログの記法();
    const 出ている = Object.keys(見本に出さない項目)
      .map((k) => [k, 項目として出る回数(本文, k)] as const)
      .filter(([, n]) => n > 0)
      .map(([k, n]) => `${k}: ${n} 回`);
    expect(出ている, "宣言に在るのに記法に出ている項目がある").toEqual([]);
  });

  it("探し方が別の項目を巻き込まない (植え込み対照)", () => {
    // `値` で `前の値` を数えると、片方の見本だけで両方が出たことになる
    const 例 = ["actors:", "  - 甲:", '      前の値: "10"'];
    expect(項目として出る回数(例, "前の値"), "探し方が当たらない形に壊れている").toBe(1);
    expect(項目として出る回数(例, "値"), "`前の値` を `値` として数えている").toBe(0);
  });
});

describe("英語で書いた見本と日本語で書いた見本が同じ図になる (#2332)", () => {
  /** 題だけを揃えて組み立てる。 題は見本ごとに違うので、そこだけ差を消す */
  const 同じ題で組み立てる = (記法: string): unknown => {
    const 揃えた = 記法.replace(/^title: ".*"$/mu, 'title: "そろえた題"');
    const parsed = parseTextDslV05(揃えた);
    if (!parsed.ok) {
      throw new Error(`parse 失敗: ${parsed.errors.map((e) => e.message).join(" / ")}`);
    }
    return compileToCdl(parsed.doc, { onNotice: () => {} });
  };

  const 対: Array<[string, string, string]> = [
    [
      "箱の項目名",
      TextDsl.sourceYaml__textDslActorKeys,
      TextDsl.sourceYaml__pattern__textDslActorKeys__日本語で書く,
    ],
    [
      "値と前の値",
      TextDsl.sourceYaml__textDslValueKeys,
      TextDsl.sourceYaml__pattern__textDslValueKeys__日本語で書く,
    ],
  ];

  for (const [名, 英, 日] of 対) {
    it(`${名} の見本が、英語で書いても日本語で書いても同じ図になる`, () => {
      // 題を揃えた形で比べているので、差が出るなら項目名の読み方が食い違っている
      expect(同じ題で組み立てる(日)).toEqual(同じ題で組み立てる(英));
    });

    it(`${名} の見本が、そもそも日本語の項目名を書いている (空振り防止)`, () => {
      const 書いた = 日本語の項目.filter((k) => 項目として出る回数([日], k) > 0);
      expect(書いた.length, `${名} の日本語の見本に日本語の項目名が 1 件も無い`).toBeGreaterThan(0);
      const 英語側 = 日本語の項目.filter((k) => 項目として出る回数([英], k) > 0);
      expect(英語側, `${名} の英語の見本に日本語の項目名が混ざっている`).toEqual([]);
    });
  }

  it("1 行にまとめた見本の箱が、段を分けた見本と同じになる (#2344)", () => {
    /*
     * **箱だけを比べる**。 段の説明文は見本ごとに違う (どの書き方かを読み手に伝える) ので、
     * 図まるごとの比較には入れられない。 この見本が見せたいのは項目名の読み方なので、
     * 箱が 1 つも違わないことを見れば足りる。
     */
    const 箱 = (記法: string): unknown => {
      const parsed = parseTextDslV05(記法);
      if (!parsed.ok) {
        throw new Error(`parse 失敗: ${parsed.errors.map((e) => e.message).join(" / ")}`);
      }
      return compileToCdl(parsed.doc, { onNotice: () => {} }).nodes;
    };
    const 一行 = 箱(TextDsl.sourceYaml__pattern__textDslActorKeys__1行にまとめて書く);
    expect(一行).toEqual(箱(TextDsl.sourceYaml__pattern__textDslActorKeys__日本語で書く));
    // 箱を 1 つも作れていないと、上の比較は空同士で通る
    expect((一行 as unknown[]).length, "箱が 1 つも無い").toBeGreaterThan(0);
  });

  it("1 行にまとめた見本が、中括弧の中に日本語の項目名を書いている (空振り防止)", () => {
    const src = TextDsl.sourceYaml__pattern__textDslActorKeys__1行にまとめて書く;
    // 中括弧の行に日本語の項目名が 1 件も無ければ、この見本は何も見せていない
    const 中括弧の行 = src.split("\n").filter((l) => l.includes("{") && l.trimStart().startsWith("-"));
    const 書いた = 日本語の項目.filter((k) => 項目として出る回数(中括弧の行, k) > 0);
    expect(書いた.length, `中括弧の行 ${中括弧の行.length} 行`).toBeGreaterThan(0);
  });

  it("題を揃える置き換えが効いている (植え込み対照)", () => {
    // 効いていないと、上の比較は題の差で必ず落ちる = 通っていること自体が保証にならない
    const 英 = TextDsl.sourceYaml__textDslActorKeys;
    const 日 = TextDsl.sourceYaml__pattern__textDslActorKeys__日本語で書く;
    expect(英.includes('title: "箱の項目名を英語で書く"'), "英語の見本の題が変わっている").toBe(
      true,
    );
    expect(日.includes('title: "箱の項目名を日本語で書く"'), "日本語の見本の題が変わっている").toBe(
      true,
    );
  });
});
