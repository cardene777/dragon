/**
 * 人が書く記法と原本の JSON の行き来 (#2984)。
 *
 * 記法は段の見出し (`#`) と本文 (`>`) の下に、その段の線を `送る側 -> 受ける側 : 線の名前` の
 * 1 行ずつで並べる。JSON から記法へは決まった並べ方で書き戻し、書き手の並べ方とコメントは保たない。
 */
import { describe, expect, it } from "vitest";
import { api, exampleJson, exampleText, reversedKeys } from "./diagram-support";

describe("記法から JSON へ", () => {
  it("notation-compiles-oauth-to-json", () => {
    const parse = api("parseNotation");
    expect(parse(exampleText("oauth.dragon"))).toEqual({ ok: true, diagram: exampleJson("oauth.json") });

    // 空行、字下げしたコメント、空白を含む日本語の名前
    const small = [
      "// コメントの行",
      "時系列図 小さな図",
      "",
      "送る側 = 送る 側 の アプリ「メッセージを作る」",
      "受ける側 = 受ける側「受け取る」",
      "",
      "  // 字下げしたコメント",
      "# 送る",
      "> 送る側が受ける側へ送る。",
      "",
      "送る側 -> 受ける側 : 最初の 1 通",
    ].join("\n");
    expect(parse(small)).toEqual({
      ok: true,
      diagram: {
        version: 1,
        kind: "sequence",
        title: "小さな図",
        boxes: [
          { id: "送る側", name: "送る 側 の アプリ", sub: "メッセージを作る" },
          { id: "受ける側", name: "受ける側", sub: "受け取る" },
        ],
        steps: [
          {
            title: "送る",
            body: "送る側が受ける側へ送る。",
            events: [{ type: "edge", from: "送る側", to: "受ける側", label: "最初の 1 通", carry: { kind: "envelope" } }],
          },
        ],
        sequence: { lifelines: ["送る側", "受ける側"] },
      },
    });
  });

  it("notation-compiles-ccip-to-json", () => {
    const parse = api("parseNotation");
    expect(parse(exampleText("ccip.dragon"))).toEqual({ ok: true, diagram: exampleJson("ccip.json") });
  });

  it("notation-reports-line-and-column", () => {
    const parse = api("parseNotation");
    const head = ["時系列図 誤りのある図", "", "送る側 = 送る側「送る」", "受ける側 = 受ける側「受ける」", "", "# 送る", "> 送る。"];

    // 宣言していない箱を行き先にした行は、その名前の位置を示す
    const undeclared = parse([...head, "送る側 -> 届け先 : 最初の 1 通"].join("\n"));
    expect(undeclared.ok).toBe(false);
    if (undeclared.ok) return;
    expect(undeclared.errors[0]).toMatchObject({ line: 8, column: 8 });
    expect(undeclared.errors[0]?.message).toContain("届け先");

    // どの形にも当たらない行は、その行の頭を示す
    const unreadable = parse([...head, "送る側 => 受ける側"].join("\n"));
    expect(unreadable.ok).toBe(false);
    if (unreadable.ok) return;
    expect(unreadable.errors[0]).toMatchObject({ line: 8, column: 1 });
  });

  it("markdown-fence-extracts-every-diagram", () => {
    const extract = api("extractDiagrams");
    const markdown = [
      "# 説明", // 1
      "", // 2
      "```dragon", // 3
      "時系列図 1 枚目", // 4
      "```", // 5
      "", // 6
      "```js", // 7
      "const a = 1;", // 8
      "```", // 9
      "", // 10
      "```dragon", // 11
      "構成図 2 枚目", // 12
      "```", // 13
    ].join("\n");
    // line は囲みの中身の 1 行目。記法の誤りの行を文書の行に直す時に足す
    expect(extract(markdown)).toEqual([
      { source: "時系列図 1 枚目", line: 4 },
      { source: "構成図 2 枚目", line: 12 },
    ]);

    expect(extract("# 図の無い文書\n\n本文だけ")).toEqual([]);

    // 閉じていない囲みは、文書の終わりまでを中身にする (CommonMark と同じ)
    expect(extract("```dragon\n時系列図 閉じていない")).toEqual([{ source: "時系列図 閉じていない", line: 2 }]);
  });
});

describe("JSON から記法へ", () => {
  it("roundtrip-keeps-json-identical", () => {
    const parse = api("parseNotation");
    const print = api("printNotation");
    for (const name of ["oauth", "ccip"]) {
      const first = parse(exampleText(`${name}.dragon`));
      expect(first.ok, name).toBe(true);
      if (!first.ok) continue;
      expect(first.diagram, name).toEqual(exampleJson(`${name}.json`));
      expect(parse(print(first.diagram)), name).toEqual({ ok: true, diagram: first.diagram });
    }
  });

  it("print-is-stable", () => {
    const print = api("printNotation");
    for (const name of ["oauth.json", "ccip.json"]) {
      const json = exampleJson(name);
      expect(print(json), name).toBe(print(json));
      // 欄の並び順だけが違う同じ内容の JSON は、同じ文字列になる
      expect(print(reversedKeys(json)), name).toBe(print(json));
    }
  });
});
