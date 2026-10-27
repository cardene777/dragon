/**
 * 人が書く dragon記法と原本の JSON の行き来 (#2984、#3137)。
 *
 * 行の種類は行の頭の英語の語で決まり、矢印の行だけは箱の名札から始まる。
 * 鍵と値はコロンで区切り、属性は `[ ]` の中に `,` で並べる。
 * 入れ子は `group … end` だけで、段は次の `step` まで続く。
 * JSON から記法へは決まった並べ方で書き戻し、書き手の並べ方とコメントは保たない。
 */
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { api, exampleJson, exampleText, type Json, type LineError, type Parsed, reversedKeys } from "./diagram-support";

const EXAMPLES = ["intro", "oauth", "ccip"] as const;

const firstError = (parsed: Parsed): LineError | undefined => (parsed.ok ? undefined : parsed.errors[0]);

const edge = (from: string, to: string, extra: Record<string, Json> = {}): Json => ({ type: "edge", from, to, carry: { kind: "envelope" }, ...extra });

describe("記法から JSON へ", () => {
  it("notation-compiles-oauth-to-json", () => {
    const parse = api("parseNotation");
    expect(parse(exampleText("oauth.dragon"))).toEqual({ ok: true, diagram: exampleJson("oauth.json") });

    // 空行、字下げしたコメント、空白を含む日本語の名前
    const small = [
      "// コメントの行",
      "sequence 小さな図",
      "",
      "box 送る側 as 送る 側 の アプリ [note: メッセージを作る]",
      "box 受ける側 [note: 受け取る]",
      "",
      "  // 字下げしたコメント",
      "step 送る",
      "  say 送る側が受ける側へ送る。",
      "",
      "  送る側 -> 受ける側: 最初の 1 通",
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
        steps: [{ title: "送る", body: "送る側が受ける側へ送る。", events: [edge("送る側", "受ける側", { label: "最初の 1 通" })] }],
        sequence: { lifelines: ["送る側", "受ける側"] },
      },
    });
  });

  it("notation-compiles-ccip-to-json", () => {
    const parse = api("parseNotation");
    expect(parse(exampleText("ccip.dragon"))).toEqual({ ok: true, diagram: exampleJson("ccip.json") });
  });

  it("notation-reads-every-line-kind", () => {
    const parse = api("parseNotation");
    const text = [
      "// 行の一覧の全ての種類",
      "architecture 全部の行 [view: follow]",
      "",
      "group 店 as 店側 [note: 受ける側, color: blue, icon: cart]",
      "  box レジ [note: 払う所]",
      "end",
      "box 客",
      // 同じ名札の group をもう一度開くと、同じ区画に箱を足す
      "group 店",
      "  box 倉庫 as 品物の倉庫",
      "end",
      // 行の頭の語と同じ綴りの名札
      "box end",
      "box step",
      "strip 注文: 番号, 状態",
      "",
      "step 頼む",
      "  say",
      "    客が注文する。",
      "    レジが受ける。",
      "  code POST /order",
      "  客 -> レジ: 注文 [tag: 42, side: below]",
      "  レジ -> 倉庫 [carry: coin]",
      "  倉庫 -> 客 [carry: none]",
      "  act レジ: 数える",
      "  note 倉庫: 品物を出した",
      "  set 番号: 42",
      "  set 状態: A -> B [tag: 受けた]",
      "  set 状態 [tag: 済]",
      "  end -> 客: 終わり",
      "  step -> 客",
      "step 送る",
      "  say 倉庫が送る。",
      "  倉庫 -> 客",
    ].join("\n");
    expect(parse(text)).toEqual({
      ok: true,
      diagram: {
        version: 1,
        kind: "architecture",
        title: "全部の行",
        view: "follow",
        regions: [{ id: "店", name: "店側", note: "受ける側", color: "blue", icon: "cart" }],
        boxes: [
          { id: "レジ", name: "レジ", sub: "払う所", region: "店" },
          { id: "客", name: "客" },
          { id: "倉庫", name: "品物の倉庫", region: "店" },
          { id: "end", name: "end" },
          { id: "step", name: "step" },
        ],
        strip: { title: "注文", fields: ["番号", "状態"] },
        steps: [
          {
            title: "頼む",
            body: "客が注文する。\nレジが受ける。",
            code: "POST /order",
            events: [
              edge("客", "レジ", { label: "注文", carry: { kind: "tag", text: "42" }, labelSide: "below" }),
              edge("レジ", "倉庫", { carry: { kind: "coin" } }),
              edge("倉庫", "客", { carry: { kind: "none" } }),
              { type: "action", box: "レジ", label: "数える" },
              { type: "swap", box: "倉庫", text: "品物を出した" },
              { type: "strip", field: "番号", value: "42" },
              { type: "strip", field: "状態", value: "A -> B", tag: "受けた" },
              { type: "strip", field: "状態", tag: "済" },
              edge("end", "客", { label: "終わり" }),
              edge("step", "客"),
            ],
          },
          { title: "送る", body: "倉庫が送る。", events: [edge("倉庫", "客")] },
        ],
      },
    });

    // 開き直す group に名前か属性を書くと、最初の宣言と食い違うので誤りにする
    const reopened = ["architecture 開き直す", "group 店", "  box レジ", "end", "group 店 as 別の名前", "  box 倉庫", "end", "step 流す", "  say 流す。", "  レジ -> 倉庫"];
    expect(firstError(parse(reopened.join("\n")))).toMatchObject({ line: 5, column: 1 });
    expect(firstError(parse(reopened.map((l, i) => (i === 4 ? "group 店 [color: blue]" : l)).join("\n")))).toMatchObject({ line: 5, column: 1 });
  });

  it("notation-reads-quoted-and-spaced-values", () => {
    const parse = api("parseNotation");
    const text = [
      'sequence "題 [下書き]"',
      "box a as 送る 側 の アプリ [note: \"東京, 大阪\", icon: app]",
      'box b as "b[0] の箱" [note: "閉じ ] を含む"]',
      'box c as 引用 "の" 字 [note: "\\"引用\\" と \\\\ を含む"]',
      'strip "表: 一": "欄, 1", 欄2',
      "step 送る",
      "  say 送る。",
      '  a -> b: 最初の 1 通 [tag: "x, y"]',
      '  a -> c: "a[1]"',
      '  set 欄, 1: "v [1]" [tag: 済]',
    ].join("\n");
    expect(parse(text)).toEqual({
      ok: true,
      diagram: {
        version: 1,
        kind: "sequence",
        title: "題 [下書き]",
        boxes: [
          { id: "a", name: "送る 側 の アプリ", sub: "東京, 大阪", icon: "app" },
          { id: "b", name: "b[0] の箱", sub: "閉じ ] を含む" },
          { id: "c", name: '引用 "の" 字', sub: '"引用" と \\ を含む' },
        ],
        strip: { title: "表: 一", fields: ["欄, 1", "欄2"] },
        steps: [
          {
            title: "送る",
            body: "送る。",
            events: [
              edge("a", "b", { label: "最初の 1 通", carry: { kind: "tag", text: "x, y" } }),
              edge("a", "c", { label: "a[1]" }),
              { type: "strip", field: "欄, 1", value: "v [1]", tag: "済" },
            ],
          },
        ],
        sequence: { lifelines: ["a", "b", "c"] },
      },
    });
  });

  it("notation-reports-line-and-column", () => {
    const parse = api("parseNotation");
    const head = ["sequence 誤りのある図", "", "box 送る側", "box 受ける側", "", "step 送る", "  say 送る。"];
    const at = (line: string): LineError | undefined => firstError(parse([...head, line].join("\n")));

    // 宣言していない箱を行き先にした行は、その名前の位置を示す
    const undeclared = at("  送る側 -> 届け先: 最初の 1 通");
    expect(undeclared).toMatchObject({ line: 8, column: 10 });
    expect(undeclared?.message).toContain("届け先");

    // 行の頭の語が一覧に無い行は、その行の頭を示す
    expect(at("  送る側 => 受ける側")).toMatchObject({ line: 8, column: 3 });
    const unknown = firstError(parse(["sequence 誤りのある図", "participant 送る側"].join("\n")));
    expect(unknown).toMatchObject({ line: 2, column: 1 });
    expect(unknown?.message, "知らない行の頭の誤りが、書ける語を示さない").toContain("box");

    // コロンの無い属性と知らない属性の鍵は、属性の頭を示す
    const noColon = at("  送る側 -> 受ける側 [tag 1]");
    expect(noColon).toMatchObject({ line: 8, column: 16 });
    expect(noColon?.message).toContain(":");
    const badKey = at("  送る側 -> 受ける側 [colour: blue]");
    expect(badKey).toMatchObject({ line: 8, column: 16 });
    expect(badKey?.message).toContain("colour");
  });

  it("notation-rejects-unclosed-group", () => {
    const parse = api("parseNotation");
    const body = ["step 頼む", "  say 頼む。", "  レジ -> 倉庫"];

    // 次の step が来ても閉じていない group は、その group の行を示す
    const beforeStep = firstError(parse(["architecture 閉じない区画", "group 店", "  box レジ", "  box 倉庫", ...body].join("\n")));
    expect(beforeStep).toMatchObject({ line: 2, column: 1 });
    expect(beforeStep?.message).toContain("end");

    // file の終わりまで閉じていない group も同じ
    expect(firstError(parse(["architecture 閉じない区画", "box 客", "group 店", "  box レジ"].join("\n")))).toMatchObject({ line: 3, column: 1 });

    // group の中の group は、内側の group の行を示す
    const nested = ["architecture 入れ子", "group 店", "  group 奥", "    box レジ", "  end", "end", "box 倉庫", ...body];
    expect(firstError(parse(nested.join("\n")))).toMatchObject({ line: 3, column: 3 });

    // 開いていない所の end は、その end の行を示す
    const stray = ["architecture 余る end", "box レジ", "box 倉庫", "end", ...body];
    expect(firstError(parse(stray.join("\n")))).toMatchObject({ line: 4, column: 1 });
  });

  it("notation-rejects-the-old-form", () => {
    const parse = api("parseNotation");

    // 日本語の語で始まる今の形の file は、新しい形の図の種類の語で書いた行の形を示す。
    // 語の一覧を並べるだけの誤りと見分けるため、語の後ろに穴 (`<題>` など) を続けた形を探す
    const sequence = firstError(parse(["時系列図 古い図", "甲 = 甲「下の字」", "# 段", "> 本文。", "甲 : 考える"].join("\n")));
    expect(sequence).toMatchObject({ line: 1, column: 1 });
    expect(sequence?.message).toContain("sequence <");
    const architecture = firstError(parse(["", "構成図 古い図", "区画 店 = 店"].join("\n")));
    expect(architecture).toMatchObject({ line: 2, column: 1 });
    expect(architecture?.message).toContain("architecture <");

    // 新しい形の file に紛れた今の形の行は、新しい形の語で書いた行の形を示す
    const head = ["sequence 新しい図", "box 甲", "step 段", "  say 本文。"];
    for (const [line, word] of [
      ["  甲「書き換えた字」", "note"],
      ["  甲 : 考える", "act"],
      ["# 次の段", "step"],
      ["  > 続きの本文。", "say"],
      ["  帯 状態 = 済", "set"],
    ] as const) {
      const error = firstError(parse([...head, line].join("\n")));
      expect(error, `${line} が誤りにならない`).toMatchObject({ line: 5 });
      expect(error?.message, `${line} の誤りが ${word} の行の形を示さない`).toContain(`${word} <`);
    }
    const declared = firstError(parse(["sequence 新しい図", "甲 = 甲「下の字」"].join("\n")));
    expect(declared).toMatchObject({ line: 2, column: 1 });
    expect(declared?.message).toContain("box <");
  });

  it("every-dragon-file-parses", () => {
    const parse = api("parseNotation");
    const files = execFileSync("git", ["ls-files", "*.dragon"], { encoding: "utf8" })
      .split("\n")
      .filter((file) => file !== "");
    // 0 件で通らないように、repo の .dragon の file を数える
    expect(files.length, "git ls-files が .dragon の file を挙げない").toBeGreaterThan(0);
    const failed = files.flatMap((file) => {
      const parsed = parse(readFileSync(join(process.cwd(), file), "utf8"));
      return parsed.ok ? [] : [`${file}:${parsed.errors[0]?.line} ${parsed.errors[0]?.message}`];
    });
    expect(failed, `${files.length} 本のうち読めない file`).toEqual([]);
  });

  it("markdown-fence-extracts-every-diagram", () => {
    const extract = api("extractDiagrams");
    const markdown = [
      "# 説明", // 1
      "", // 2
      "```dragon", // 3
      "sequence 1 枚目", // 4
      "```", // 5
      "", // 6
      "```js", // 7
      "const a = 1;", // 8
      "```", // 9
      "", // 10
      "```dragon", // 11
      "architecture 2 枚目", // 12
      "```", // 13
    ].join("\n");
    // line は囲みの中身の 1 行目。記法の誤りの行を文書の行に直す時に足す
    expect(extract(markdown)).toEqual([
      { source: "sequence 1 枚目", line: 4 },
      { source: "architecture 2 枚目", line: 12 },
    ]);

    expect(extract("# 図の無い文書\n\n本文だけ")).toEqual([]);

    // 閉じていない囲みは、文書の終わりまでを中身にする (CommonMark と同じ)
    expect(extract("```dragon\nsequence 閉じていない")).toEqual([{ source: "sequence 閉じていない", line: 2 }]);
  });
});

describe("JSON から記法へ", () => {
  /** 区画を持つ構成図。`boxes` と `regions` だけを差し替えて使う */
  const architecture = (regions: Json[], boxes: Json[]): Json => ({
    version: 1,
    kind: "architecture",
    title: "区画の並び",
    regions,
    boxes,
    steps: [{ title: "流す", body: "流す。", events: [edge("a", "b")] }],
  });

  it("roundtrip-keeps-json-identical", () => {
    const parse = api("parseNotation");
    const print = api("printNotation");
    for (const name of EXAMPLES.flatMap((key) => [key, `${key}.en`])) {
      const first = parse(exampleText(`${name}.dragon`));
      expect(first.ok, name).toBe(true);
      if (!first.ok) continue;
      expect(first.diagram, name).toEqual(exampleJson(`${name}.json`));
      expect(parse(print(first.diagram)), name).toEqual({ ok: true, diagram: first.diagram });
    }

    // 入れ子だけでは書けない区画の並び。同じ group を開き直して書き戻す
    const shapes: Record<string, Json> = {
      区画の箱が飛び飛び: architecture(
        [{ id: "r", name: "区画" }, { id: "s", name: "もう 1 つ", color: "green" }],
        [
          { id: "a", name: "入口", region: "r" },
          { id: "b", name: "外" },
          { id: "c", name: "奥", region: "r" },
          { id: "d", name: "出口", region: "s" },
        ],
      ),
      区画の並びが箱の現れる順と違う: architecture(
        [{ id: "s", name: "後" }, { id: "r", name: "先", note: "添え書き" }],
        [
          { id: "a", name: "入口", region: "r" },
          { id: "b", name: "出口", region: "s" },
        ],
      ),
      箱の無い区画: architecture(
        [{ id: "r", name: "区画" }, { id: "e", name: "空" }],
        [
          { id: "a", name: "入口", region: "r" },
          { id: "b", name: "出口", region: "r" },
        ],
      ),
      本文の途中の空の行: {
        version: 1,
        kind: "sequence",
        title: "長い本文",
        boxes: [
          { id: "a", name: "a" },
          { id: "b", name: "b" },
        ],
        steps: [{ title: "送る", body: "1 行目。\n\n3 行目。\n4 行目。", events: [edge("a", "b")] }],
        sequence: { lifelines: ["a", "b"] },
      },
    };
    for (const [label, json] of Object.entries(shapes)) {
      expect(parse(print(json)), label).toEqual({ ok: true, diagram: json });
    }
  });

  it("print-matches-the-printed-fixtures", () => {
    const print = api("printNotation");
    for (const name of EXAMPLES) {
      const fixture = readFileSync(join(process.cwd(), "packages/dragon/test/fixtures/printed", `${name}.dragon`), "utf8");
      expect(print(exampleJson(`${name}.json`)), name).toBe(fixture);
    }
  });

  it("print-quotes-only-when-needed", () => {
    const parse = api("parseNotation");
    const print = api("printNotation");
    const json: Json = {
      version: 1,
      kind: "sequence",
      title: "引用符の要る所",
      boxes: [
        { id: "a", name: "a[0]", sub: "東京, 大阪" },
        { id: "b", name: "閉じ ] だけ", sub: "閉じ ] を含む", icon: "app" },
        { id: "c", name: '"引用" で始まる', sub: 'say "hi"' },
        { id: "d", name: "そのまま", sub: "空白 を 含む 字" },
      ],
      steps: [
        {
          title: "送る",
          body: "送る。",
          events: [edge("a", "b", { label: "f[1]", carry: { kind: "tag", text: "x, y" } }), edge("b", "c", { label: "普通の名前", carry: { kind: "tag", text: "1 通" } })],
        },
      ],
      sequence: { lifelines: ["a", "b", "c", "d"] },
    };
    const lines = print(json).split("\n");
    expect(lines).toEqual(
      expect.arrayContaining([
        'box a as "a[0]" [note: "東京, 大阪"]',
        'box b as 閉じ ] だけ [note: "閉じ ] を含む", icon: app]',
        'box c as "\\"引用\\" で始まる" [note: say "hi"]',
        "box d as そのまま [note: 空白 を 含む 字]",
        '  a -> b: "f[1]" [tag: "x, y"]',
        "  b -> c: 普通の名前 [tag: 1 通]",
      ]),
    );
    expect(lines[0], "引用符の要らない題を囲む").toBe("sequence 引用符の要る所");
    expect(parse(print(json))).toEqual({ ok: true, diagram: json });
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
