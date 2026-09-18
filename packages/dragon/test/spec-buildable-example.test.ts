/**
 * 書いた見本が、実際に図へ組み立てられることの検査 (#1207 / #2254)。
 *
 * ## 何を対象にするか
 *
 * 対象は **題を持つ塊**。 記法として完結した文書は `title` と `type` を必須に持つため、
 * `title:` で始まることが「組み立てられるべき見本」 の印になる。
 * 一部だけを見せる見本 (`type:` から始める形) は完結していないので対象外。
 *
 * **題が空の塊も対象外** (#2254)。 `title: ""` はこれから足す欄を書くための器で、
 * 計画の文書がその形を使う。 題を持たないので「完結した見本」 の条件を満たさない。
 * 名指しの宣言で外すのではなく、決まりを 1 段細かくして外す。
 *
 * ## 置き場所を名指ししない (#2254)
 *
 * 決まりの文は一般なのに、読む先を 1 枚の文書に固定していた。
 * そのため **配る package の説明書の見本を 1 つも見ておらず**、説明書の見本が壊れても
 * この検査は緑のまま通った。 走査が「何を見るか」 を名指しで決めると、後から足した文書が
 * 黙って外れる (#2236 から #2244 で 5 回続けて踏んだ形)。
 *
 * 集める処理は `test-support/scan-targets.ts` の説明書の集合に寄せる (#2240)。
 *
 * ## なぜ計画の例を対象にしないか
 *
 * 計画の文書は「これから足す欄」 を書く。 解けないのが正しいので、対象に入れると
 * 計画を消す方向の圧力になる。 題の有無で分かれるため、宣言を 1 件も持たずに済む。
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, relative } from "node:path";
import { describe, it, expect } from "vitest";
import { compile } from "@cardenelabs/cdl";
import { textDslToDiagram } from "../src/index";
import { 説明書のfile } from "../../../test-support/scan-targets";

const ここ = dirname(fileURLToPath(import.meta.url));
const REPO = join(ここ, "..", "..", "..");

interface 見本 {
  場所: string;
  本文: string;
}

/**
 * 題を持つ塊を 1 つの md から取り出す。
 *
 * 言語指定 (```text 等) は落とす。 開き fence と閉じ fence を交互に数える素朴な走査で足りる
 * (この repo の md に入れ子の fence は無い)。
 */
function 題を持つ塊(src: string, 場所: string): 見本[] {
  const 出: 見本[] = [];
  let 中 = false;
  let buf: string[] = [];
  let 開いた行 = 0;
  src.split("\n").forEach((line, i) => {
    if (line.startsWith("```")) {
      if (中) {
        const 本文 = buf.join("\n");
        // 題が空の塊はこれから足す欄を書く器で、完結した見本ではない
        if (/^title:\s*"[^"]/.test(本文.trimStart())) 出.push({ 場所: `${場所}:${開いた行}`, 本文 });
        buf = [];
      } else {
        開いた行 = i + 1;
      }
      中 = !中;
      return;
    }
    if (中) buf.push(line);
  });
  return 出;
}

/**
 * 走査は **1 度だけ** 行い、結果を全ての検査が共有する。
 *
 * `it.each` の引数は describe の収集時に評価され、`it` の中身は実行時に評価される。
 * 走査を検査ごとに呼ぶと **収集時と実行時で別々に file を読む** ことになり、
 * 収集時に 0 件でも実行時に 1 件あれば「空振りしていない」 が通る = その assert が
 * 実際に走った case 数を保証しない (本 file が塞ごうとしている恒真と同じ形)。
 *
 * 1 度だけ評価すれば、`it.each` が受け取る配列と assert が見る配列が同一になる。
 *
 * **この形は変異試験で覆えていない**。 検査ごとの呼出へ戻すだけでは通る
 * (収集と実行の間で file が変わらない限り顕在化しない)。 落ちる入力を作れないため、
 * 構造で閉じてある。
 */
const 走査したmd: string[] = 説明書のfile(REPO);
const 組み立てるべき見本: 見本[] = 走査したmd.flatMap((p) =>
  題を持つ塊(readFileSync(p, "utf8"), relative(REPO, p)),
);

describe("書いた見本が図へ組み立てられる (#1207 / #2254)", () => {
  it("説明書を走査できている", () => {
    // 集められていなければ、以下の検査は見るものが無いまま通る
    expect(走査したmd.length, "説明書を 1 枚も集められていない").toBeGreaterThan(20);
  });

  it("走査が空振りしていない", () => {
    // 0 件だと `it.each` が case を 1 つも登録せず、以下の検査が「全て通った」 として素通りする。
    // fence の書き方が変わった時と、見本そのものが消えた時の両方をここで捕まえる
    expect(
      組み立てるべき見本.length,
      "題を持つ塊を 1 件も取れていない (検査が空振りしている)",
    ).toBeGreaterThan(0);
  });

  it("配る説明書の見本が対象に入る (#2254)", () => {
    // 1 枚の文書だけを見ていた間、配る面の見本は 1 つも見ていなかった
    expect(
      組み立てるべき見本.some((v) => v.場所.startsWith("packages/dragon/README.md")),
      "配る説明書の見本が対象に入っていない",
    ).toBe(true);
  });

  it.each(組み立てるべき見本.map((v) => [v.場所, v.本文] as const))(
    "%s の見本が図へ組み立てられる",
    (_場所, 本文) => {
      // 公開変換経路を通し、parse / Dragon 側の組立てだけでなく CDL compile まで完走することを保証する。
      // parse error は `textDslToDiagram` が行番号付きで投げるため、md 内の箇所も追える。
      expect(() => compile(textDslToDiagram(本文))).not.toThrow();
    },
  );

  it("題が空の計画の例は対象に入らない (植え込み対照)", () => {
    // 宣言ではなく決まりで外していることを、その場で作った塊で確かめる
    expect(題を持つ塊('```\ntitle: ""\ntype: sequence\n```', "仮"), "題が空の塊を拾っている").toEqual(
      [],
    );
    expect(
      題を持つ塊('```\ntitle: "ある"\ntype: sequence\n```', "仮").length,
      "題を持つ塊を拾えていない",
    ).toBe(1);
    expect(題を持つ塊("```\ntype: sequence\n```", "仮"), "題を書かない塊を拾っている").toEqual([]);
  });

  it("計画の書き方は対象に入らない", () => {
    // これから足す欄は解けないのが正しい。 対象に入ると計画を消す方向の圧力になる
    expect(組み立てるべき見本.some((v) => v.本文.includes("reads:")), "計画の欄が対象に入っている").toBe(
      false,
    );
    expect(組み立てるべき見本.some((v) => v.本文.includes("parts:")), "計画の欄が対象に入っている").toBe(
      false,
    );
  });

  it("入った記法は対象に入る", () => {
    // `trigger:` は #1161 段 2 で入った。 計画側に置いたままにすると、入った記法が
    // 「解けないのが正しい」 側で固定され、壊れても検査が気付かない
    expect(
      組み立てるべき見本.some((v) => v.本文.includes("trigger:")),
      "入った記法が対象に入っていない",
    ).toBe(true);
  });
});
