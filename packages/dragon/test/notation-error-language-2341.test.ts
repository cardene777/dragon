/*
 * 記法が出す誤りの文が、同じ言葉で書かれているかを見る (#2341)。
 *
 * 記法の誤りはほとんどが日本語で書かれていた一方、**書き始めに必ず通る所だけが英語**だった
 * (題や図種の書き忘れ、登場人物 / 矢印 / 段の行の形)。
 * 細かい項目名を間違えた時は日本語で、最初に当たる所だけが英語になっていた。
 * どの文が残っているかは下の検査が落ちた時に名指しで出す。
 *
 * **走査は実物から導く** = 一覧を手で並べると、文を足した日に一覧だけが古くなる。
 * `v05/parser.ts` を読んで `message:` と `hint:` の字をすべて拾い、日本語を含むかで数える。
 *
 * 対象は記法 (YAML) の parser だけ。 `json-parser.ts` は機械に渡す道具の側なので外す。
 */
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { parseTextDslV05, PRESET_TYPES } from "../src/v05/parser";

const PARSER = new URL("../src/v05/parser.ts", import.meta.url).pathname;
const 日本語を含む = (s: string): boolean => /[ぁ-んァ-ヶ一-龠]/u.test(s);

/** `message:` と `hint:` に書かれた字を、埋め込みを含めてそのまま拾う */
function 記法の文(): { 欄: string; 字: string }[] {
  const src = readFileSync(PARSER, "utf8");
  const 出た: { 欄: string; 字: string }[] = [];
  for (const m of src.matchAll(/(message|hint):\s*(`(?:\\.|[^`\\])*`|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*')/gu)) {
    const 字 = m[2]!.slice(1, -1);
    if (字.trim() === "") continue;
    出た.push({ 欄: m[1]!, 字 });
  }
  return 出た;
}

describe("記法の誤りが同じ言葉で書かれている (#2341)", () => {
  const 文 = 記法の文();

  it("文を走査できている (空振り防止)", () => {
    // 0 件だと下の検査が「差が無い」 で通る。 書き方を変えた時もここで落ちる
    expect(文.length, "記法の parser から文を 1 件も拾えていない").toBeGreaterThan(100);
  });

  it("日本語を含まない文が 1 件も無い", () => {
    const 英語だけ = 文.filter((x) => !日本語を含む(x.字));
    expect(
      英語だけ.map((x) => `${x.欄}: ${x.字}`),
      `走査 ${文.length} 件`,
    ).toEqual([]);
  });
});

describe("図種を挙げる補足が実物と一致する (#2341)", () => {
  const 全図種 = [...PRESET_TYPES];

  const 補足 = (src: string, 本文: string): string => {
    const p = parseTextDslV05(src);
    if (p.ok) throw new Error("誤りが出ていない");
    const e = p.errors.find((x) => x.message.includes(本文));
    if (e === undefined) throw new Error(`"${本文}" の誤りが出ていない`);
    return e.hint ?? "";
  };

  it("図種を書かない時の補足が、書ける図種を全て挙げる", () => {
    const h = 補足(`title: "t"\nactors:\n  - A\n`, "type");
    const 挙げていない = 全図種.filter((t) => !h.includes(t));
    expect(挙げていない, `走査 ${全図種.length} 図種 / 補足: ${h}`).toEqual([]);
  });

  it("知らない図種を書いた時の補足も、書ける図種を全て挙げる", () => {
    const h = 補足(`title: "t"\ntype: ながれ\nactors:\n  - A\n`, "図種");
    const 挙げていない = 全図種.filter((t) => !h.includes(t));
    expect(挙げていない, `走査 ${全図種.length} 図種 / 補足: ${h}`).toEqual([]);
  });

  it("補足が、書けない図種を挙げていない", () => {
    // 片方向だけだと、一覧をもっと増やせば通ってしまう
    const h = 補足(`title: "t"\nactors:\n  - A\n`, "type");
    const 語 = h.match(/[a-z][a-z0-9]*/gu) ?? [];
    const 図種らしき = 語.filter((w) => w.length > 2 && !["type", "add"].includes(w));
    expect(図種らしき.filter((w) => !全図種.includes(w as never))).toEqual([]);
  });
});

describe("最上位の読めない項目名は、行ではなく名前を引用する (#2341)", () => {
  it("値を含む行を書いても、引用は項目名だけになる", () => {
    const p = parseTextDslV05(`題: "t"\ntype: flow\nactors:\n  - A\n`);
    expect(p.ok).toBe(false);
    if (p.ok) return;
    const e = p.errors[0]!;
    // 直す前は `unknown top-level key: "題: "t""` で、引用符が入れ子になって読めなかった
    expect(e.message).toContain('"題"');
    expect(e.message, `本文: ${e.message}`).not.toContain('"題: ');
  });
});
