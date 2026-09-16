/**
 * 順序図に書いた面の種類が、記法 5 経路すべてで組み立てまで運ばれる検証 (#1058 / #1466)。
 *
 * `#1058` の時点では種類は上端の名札 (小型の箱) に載っていた。 `#1466` で順序図が 1 枚の板に
 * なり、面は見出しに名前と呼び名だけで並ぶ = **種類の絵を置く箱が無くなった**。
 *
 * 載せる先は消えたが、**書いたものが黙って落ちない** ことは残す。 組み立ては
 * `actor-kind-not-honored` を出し、書いた側に効かないことを伝える。 この知らせが出るのは
 * 種類が組み立てまで運ばれた時だけなので、経路が 1 つ欠けると落ちる。
 *
 * `kind` は書かなくても既定の `actor` が入るため、値だけを見ると「書かなかった」 が
 * 「`actor` と書いた」 に化ける。 書いたかどうかの印 (`kindWritten`) で分ける。
 *
 * **記法は 5 経路ある**。 実装中に 2 度、 1 経路だけ直して他が漏れた (括弧記法を直した時に
 * inline mapping と継続行が残り、 書いた種類が落ちた)。 表で全経路を通す。
 */
import { describe, it, expect } from "vitest";
import { textDslToDiagram, compileToCdl, parseTextDsl, parseTextDslV05 } from "../src/index";
// `jsonToDoc` は公開していないので実装から直接読む (JSON も他の記法と同じ規約を守るかを見る)
import { jsonToDoc } from "../src/json-parser";
import type { DslActor, DslDocument } from "../src/types";
import type { CompileNotice } from "../src/compile";
import type { ParseResult } from "../src/parser";
import type { V05ParseResult } from "../src/v05";

/** 書いた種類が効かないことの知らせを、対象の名前で返す。 */
function 効かない種類(doc: DslDocument): string[] {
  const 出た: CompileNotice[] = [];
  compileToCdl(doc, {
    onNotice: (n) => {
      出た.push(n);
    },
  });
  return 出た.filter((n) => n.kind === "actor-kind-not-honored").map((n) => n.actor);
}

/** 下の 5 つの記法に共通する形。 `Client` は種類を書かない、 `API` は `database` を書く。 記法ごとに書き方が違う。 */

const V04 = `title: "t"
type: sequence

actors:
  - Client
  - API (database)

flow:
  1. Client → API: 呼ぶ
`;

const 略記 = `title: "t"
type: sequence

actors:
  - Client
  - API: database

flow:
  - Client -> API: "呼ぶ"
`;

const INLINE = `title: "t"
type: sequence

actors:
  - Client
  - API: { kind: database }

flow:
  - Client -> API: "呼ぶ"
`;

const 継続行 = `title: "t"
type: sequence

actors:
  - Client
  - API:
      kind: database

flow:
  - Client -> API: "呼ぶ"
`;

const JSON_DOC = {
  title: "t",
  type: "sequence" as const,
  actors: ["Client", { name: "API", kind: "database" }],
  flow: [{ from: "Client", to: "API", label: "呼ぶ" }],
};

/**
 * 解析の結果から登場人物を取り出す。
 *
 * `ParseResult` は `ok` で分かれる共用体で、`doc` は成功した時にしか無い。 `?.` で引くと
 * 型が通らず、**失敗した時に `undefined` が返って検査が静かに空振りする**。
 * 失敗をここで落として、何が起きたかを残す。
 */
function 登場人物(r: ParseResult | V05ParseResult): DslActor[] {
  return 文書(r).actors;
}

/** 解析の結果から文書を取り出す。 失敗はここで落として何が起きたかを残す。 */
function 文書(r: ParseResult | V05ParseResult): DslDocument {
  if (!r.ok) throw new Error(`記法を読めなかった: ${r.errors.map((e) => e.message).join(" / ")}`);
  return r.doc;
}

describe("解析の失敗は何が起きたかを残して落ちる (#1415)", () => {
  it("読めない記法は誤りの中身を残す", () => {
    /*
     * `as` で通すと `Cannot read properties of undefined (reading 'actors')` で落ち、
     * **記法のどこが読めなかったのかが残らない**。 実測で両方の形を試し、落ちること自体は
     * 同じで、残る情報だけが違うことを確かめている。
     *
     * 変異試験では「落ちるかどうか」 が変わらないため、この検査が無いと `as` に戻しても
     * 1 件も落ちない。
     */
    expect(() => 登場人物(parseTextDsl("!!! 読めない !!!"))).toThrow(/記法を読めなかった/);
    expect(() => 登場人物(parseTextDsl("!!! 読めない !!!"))).toThrow(/タイトル: が見つかりません/);
  });

  it("読める記法はそのまま返す", () => {
    expect(登場人物(parseTextDsl(V04)).length).toBeGreaterThan(0);
  });
});

const 記法 = [
  { name: "v0.4 括弧", doc: () => 文書(parseTextDsl(V04)), actors: () => 登場人物(parseTextDsl(V04)) },
  { name: "v0.5 略記", doc: () => 文書(parseTextDslV05(略記)), actors: () => 登場人物(parseTextDslV05(略記)) },
  {
    name: "v0.5 inline mapping",
    doc: () => 文書(parseTextDslV05(INLINE)),
    actors: () => 登場人物(parseTextDslV05(INLINE)),
  },
  {
    name: "v0.5 継続行",
    doc: () => 文書(parseTextDslV05(継続行)),
    actors: () => 登場人物(parseTextDslV05(継続行)),
  },
  { name: "JSON", doc: () => jsonToDoc(JSON_DOC), actors: () => jsonToDoc(JSON_DOC).actors },
];

const 探す = (list: DslActor[] | undefined, name: string) => list?.find((a) => a.name === name);

describe("順序図に書いた面の種類 (#1058 / #1466)", () => {
  describe.each(記法)("$name", ({ doc, actors }) => {
    it("書いた種類は組み立てまで運ばれ、効かないことが伝わる", () => {
      // #975 の意図 = 書いたのに効かない項目を黙って落とさない。 板になっても失わせない
      const 出た = 効かない種類(doc());
      expect(出た, `書いた database が組み立てまで届いていない (出た知らせ: ${出た.join(", ") || "なし"})`).toContain("API");
    });

    it("書かない登場人物は巻き込まない", () => {
      // 既定の `actor` を「書いた」 と読むと、種類を書いていない図で毎回知らせが出る
      expect(効かない種類(doc()), "書いていない側まで巻き込んでいる").not.toContain("Client");
    });

    it("書いたかを true / false で明示する", () => {
      // **省略では守れない**。 `kindWritten` を書き忘れると `undefined` になり、
      // 後方互換のために「書いた」 へ倒れる (記法を通さない直接組み立てを壊さないため)。
      // その結果 `undefined` は配線漏れを隠す。 parse が **明示的に値を置く** ことを直接見る。
      const list = actors();
      expect(探す(list, "Client"), "Client が読めていない").toBeDefined();
      expect(探す(list, "API"), "API が読めていない").toBeDefined();
      expect(探す(list, "Client")?.kindWritten, "書かなかったのに false が明示されていない").toBe(false);
      expect(探す(list, "API")?.kindWritten, "書いたのに true が明示されていない").toBe(true);
    });
  });

  it("板は面ごとの箱を持たない", () => {
    /*
     * 名札 (`*-header` / `*-footer`) は #1466 で消えた。 残っていると、種類を載せる先が
     * あることになり、上の「効かない」 という知らせと食い違う。
     */
    const diagram = textDslToDiagram(略記);
    const 名札 = diagram.nodes.filter((n) => /-(header|footer)$/.test(String(n.id)));
    expect(名札.map((n) => String(n.id)), "板に名札が残っている").toEqual([]);
  });

  it("記法を通さず組み立てた場合は従来どおり書いた扱いになる", () => {
    // 公開 API (`compileToCdl`) を外から呼ぶ利用者は `kindWritten` を知らない。
    // `undefined` を「書かなかった」 に倒すと、 その経路で #975 の挙動が壊れる
    const 出た = 効かない種類({
      title: "t",
      type: "sequence",
      actors: [
        { name: "Client", kind: "service", pos: { line: 1 } },
        { name: "DB", kind: "database", pos: { line: 2 } },
      ],
      flow: [{ no: 1, from: "Client", to: "DB", label: "呼ぶ", pos: { line: 3 } }],
      pos: { line: 1 },
    });
    expect(出た, "直接組み立てた種類が黙って落ちている").toEqual(["Client", "DB"]);
  });
});
